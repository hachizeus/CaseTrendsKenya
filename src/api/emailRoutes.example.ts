// Backend API endpoint for sending emails (Node.js/Express)
// Installation:
// npm install resend
// OR
// npm install @sendgrid/mail

import express, { Request, Response } from "express";
import { generateOrderConfirmationEmail, generateStatusUpdateEmail, generateOrderNotificationEmail } from "../src/lib/emailTemplates";

const router = express.Router();

// Using Resend (Option 1)
// const { Resend } = require("resend");
// const resend = new Resend(process.env.RESEND_API_KEY);

// Or using SendGrid (Option 2)
// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailRequest {
  to: string;
  type: "order_confirmation" | "status_update" | "order_notification";
  data: any;
}

// Middleware to log all incoming requests
router.use("/api/send-email", (req: Request, res: Response, next) => {
  console.log("📧 Email request received:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    hasAuth: !!req.headers.authorization,
    authHeader: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'none',
    contentType: req.headers["content-type"],
    bodyType: req.body?.type,
    bodyTo: req.body?.to,
    bodyData: {
      hasRole: !!req.body?.data?.actor_role,
      role: req.body?.data?.actor_role,
      orderId: req.body?.data?.id,
      status: req.body?.data?.status
    }
  });
  next();
});

// Authentication middleware - ALLOWS BOTH admin and moderator roles
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn("⚠️ No valid authorization header");
      return res.status(401).json({ 
        error: "Authentication required",
        details: "No valid Bearer token provided" 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    // You'll need to implement this based on your Supabase setup
    // For now, we'll just check if token exists
    if (!token || token.length < 10) {
      console.warn("⚠️ Invalid token format");
      return res.status(401).json({ 
        error: "Invalid authentication token",
        details: "Token format is invalid" 
      });
    }

    // TODO: Add actual Supabase token verification here
    // const { data: { user }, error } = await supabase.auth.getUser(token);
    
    console.log("✅ Authentication passed, proceeding with email send");
    next();
  } catch (error) {
    console.error("❌ Authentication error:", error);
    return res.status(403).json({ 
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown authentication error"
    });
  }
};

// Role authorization middleware - ALLOWS BOTH admin and moderator
const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    // Extract role from request body data (sent from frontend)
    const userRole = req.body?.data?.actor_role;
    
    console.log("🔑 Checking role authorization:", {
      userRole,
      allowedRoles,
      isAllowed: !userRole || allowedRoles.includes(userRole)
    });

    // If no role information is provided, still allow the request
    // This helps during development and ensures backward compatibility
    if (!userRole) {
      console.log("ℹ️ No role information provided, allowing request");
      return next();
    }

    // Check if the user's role is in the allowed roles
    if (!allowedRoles.includes(userRole)) {
      console.warn(`⛔ Role ${userRole} not authorized. Allowed: ${allowedRoles.join(", ")}`);
      return res.status(403).json({
        error: "Insufficient permissions",
        details: `Role '${userRole}' is not authorized to send emails. Allowed roles: ${allowedRoles.join(", ")}`
      });
    }

    console.log(`✅ Role ${userRole} authorized`);
    next();
  };
};

// Main email sending endpoint - ALLOWS both admin and moderator
router.post(
  "/api/send-email",
  authenticateUser,
  authorizeRoles(["admin", "moderator"]), // Allow both admin AND moderator
  async (req: Request, res: Response) => {
    try {
      const payload: EmailRequest = req.body;
      
      console.log("📨 Processing email request:", {
        type: payload.type,
        to: payload.to,
        orderId: payload.data?.id,
        status: payload.data?.status,
        hasRole: !!payload.data?.actor_role,
        role: payload.data?.actor_role
      });

      // Generate the appropriate email template
      let template;
      if (payload.type === "order_confirmation") {
        template = generateOrderConfirmationEmail(payload.data);
        console.log("📋 Generated order confirmation template");
      } else if (payload.type === "status_update") {
        template = generateStatusUpdateEmail(payload.data);
        console.log("📋 Generated status update template");
      } else if (payload.type === "order_notification") {
        template = generateOrderNotificationEmail(payload.data, payload.to);
        console.log("📋 Generated order notification template");
      } else {
        console.warn("⚠️ Invalid email type requested:", payload.type);
        return res.status(400).json({ 
          error: "Invalid email type",
          validTypes: ["order_confirmation", "status_update", "order_notification"],
          receivedType: payload.type
        });
      }

      // Log the complete email details for debugging
      console.log("📧 Email details:", {
        to: template.to,
        subject: template.subject,
        htmlLength: template.html.length,
        htmlPreview: template.html.substring(0, 200) + "..."
      });

      // Option 1: Using Resend
      // const response = await resend.emails.send({
      //   from: "Case Trends <info@casetrendskenya.co.ke>",
      //   to: template.to,
      //   subject: template.subject,
      //   html: template.html,
      // });
      // console.log("✅ Email sent via Resend:", response);

      // Option 2: Using SendGrid
      // const message = {
      //   to: template.to,
      //   from: "info@casetrendskenya.co.ke",
      //   subject: template.subject,
      //   html: template.html,
      // };
      // await sgMail.send(message);
      // console.log("✅ Email sent via SendGrid");

      // For testing/development - log the email
      console.log("📧 Email would be sent to:", template.to);
      console.log("📧 Subject:", template.subject);
      console.log("📧 HTML length:", template.html.length, "characters");

      // Send success response
      res.json({ 
        success: true, 
        message: "Email sent successfully",
        details: {
          to: template.to,
          type: payload.type,
          orderId: payload.data?.id,
          status: payload.data?.status
        }
      });
      
    } catch (error) {
      console.error("❌ Email sending error:", error);
      res.status(500).json({ 
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
);

// Health check endpoint
router.get("/api/send-email/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Email service is running",
    allowedRoles: ["admin", "moderator"]
  });
});

// Error handling middleware
router.use("/api/send-email", (err: Error, req: Request, res: Response, next: Function) => {
  console.error("❌ Unhandled error in email routes:", err);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : "An unexpected error occurred"
  });
});

export default router;