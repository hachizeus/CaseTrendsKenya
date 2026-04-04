// Alternative: Backend API endpoint for sending emails (Node.js/Express)
// If not using Supabase Edge Functions, use this with a backend like Express
// 
// Installation:
// npm install resend
// OR
// npm install @sendgrid/mail

import express from "express";
import { generateOrderConfirmationEmail, generateStatusUpdateEmail } from "../src/lib/emailTemplates";

const router = express.Router();

// Using Resend (Option 1)
// const { Resend } = require("resend");
// const resend = new Resend(process.env.RESEND_API_KEY);

// Or using SendGrid (Option 2)
// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailRequest {
  to: string;
  type: "order_confirmation" | "status_update";
  data: any;
}

router.post("/api/send-email", async (req, res) => {
  try {
    const payload: EmailRequest = req.body;

    let template;
    if (payload.type === "order_confirmation") {
      template = generateOrderConfirmationEmail(payload.data);
    } else if (payload.type === "status_update") {
      template = generateStatusUpdateEmail(payload.data);
    } else {
      return res.status(400).json({ error: "Invalid email type" });
    }

    // Option 1: Using Resend
    // const response = await resend.emails.send({
    //   from: "Case Trends <noreply@casetrendskеnya.com>",
    //   to: template.to,
    //   subject: template.subject,
    //   html: template.html,
    // });

    // Option 2: Using SendGrid
    // const message = {
    //   to: template.to,
    //   from: "noreply@casetrendskеnya.com",
    //   subject: template.subject,
    //   html: template.html,
    // };
    // await sgMail.send(message);

    // For testing/development - log the email
    console.log("Email would be sent to:", template.to);
    console.log("Subject:", template.subject);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
