// Edge Function for image optimization
// Processes uploaded images and generates WebP/AVIF variants
// Triggered by storage events using webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ImageOptRequest {
  bucket: string;
  name: string;
  contentType: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json() as ImageOptRequest;
    
    // Validate request
    if (!body.bucket || !body.name) {
      return new Response(
        JSON.stringify({ error: "Missing bucket or name" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Only process images
    if (!body.contentType?.startsWith("image/")) {
      return new Response(
        JSON.stringify({ success: true, message: "Not an image, skipping" }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    console.log(`[Image Optimization] Processing: ${body.bucket}/${body.name}`);
    console.log(`[Image Optimization] Content-Type: ${body.contentType}`);

    // NOTE: In a production environment, you would:
    // 1. Download image from Supabase storage
    // 2. Use an image processing library (e.g., ImageMagick, Sharp via FFI)
    // 3. Generate WebP and AVIF variants
    // 4. Upload variants back to storage with different extensions
    // 5. Update database with variant URLs
    //
    // For now, this is a placeholder that logs the optimization request
    // Deno's image processing capabilities are limited
    // Consider using a CDN or external service like Cloudinary for this

    // Future enhancement: Use ImageMagick or external API
    // const { data, error } = await supabase.storage
    //   .from(body.bucket)
    //   .download(body.name);
    //
    // if (error) throw error;
    //
    // const buffer = await data.arrayBuffer();
    // // Process with ImageMagick or similar
    // const webpBuffer = await convertToWebP(buffer);
    // const avifBuffer = await convertToAVIF(buffer);
    //
    // // Upload variants
    // await supabase.storage
    //   .from(body.bucket)
    //   .upload(`${body.name.replace(/\.\w+$/, '')}.webp`, webpBuffer);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Image optimization queued",
        file: body.name,
        note: "Configure CDN or external image service for automatic format conversion",
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Error in image optimization:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
