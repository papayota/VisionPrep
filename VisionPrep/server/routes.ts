import type { Express, Request } from "express";
import { Buffer } from "node:buffer";
import { createServer, type Server } from "http";
import { generateRequestSchema, batchResponseSchema } from "@shared/schema";
import { processImageWithRetry, processBatchWithConcurrency } from "./lib/imageProcessor";
import { estimateBase64Bytes } from "@shared/uploadLimits";
import { UPLOAD_LIMIT_CONFIG } from "./config";

function logApproximatePayloadSize(req: Request, bodyBytes: number) {
  const contentLength = req.headers["content-length"];
  console.log("Content-Length:", contentLength ?? "(not provided)");
  console.log("Approximate payload bytes:", bodyBytes);
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate", async (req, res) => {
    try {
      const approxBodyBytes = Buffer.byteLength(JSON.stringify(req.body ?? {}), "utf8");
      logApproximatePayloadSize(req, approxBodyBytes);

      const validated = generateRequestSchema.parse(req.body);
      const { images, lang, tone, keywords } = validated;

      const imageByteSizes = images.map((image) => estimateBase64Bytes(image.dataUrl));
      const totalImageBytes = imageByteSizes.reduce((total, size) => total + size, 0);

      if (totalImageBytes > UPLOAD_LIMIT_CONFIG.maxUploadBytes) {
        return res.status(413).json({
          error: "payload_too_large",
          hint: UPLOAD_LIMIT_CONFIG.hint,
        });
      }

      const hasOversizedImage = imageByteSizes.some(
        (size) => size > UPLOAD_LIMIT_CONFIG.maxFileBytes,
      );

      if (hasOversizedImage) {
        return res.status(413).json({
          error: "payload_too_large",
          hint: UPLOAD_LIMIT_CONFIG.hint,
        });
      }

      const results = await processBatchWithConcurrency(
        images,
        async (image) => {
          const result = await processImageWithRetry(
            {
              dataUrl: image.dataUrl,
              filename: image.filename,
              lang,
              tone,
              keywords,
            },
            2
          );

          return {
            filename: image.filename,
            sha256: image.sha256,
            metrics: image.metrics,
            result,
          };
        },
        3
      );

      const response = {
        generated_at: new Date().toISOString(),
        lang,
        items: results,
      };

      const validatedResponse = batchResponseSchema.parse(response);
      res.json(validatedResponse);
    } catch (error: any) {
      console.error("Error processing images:", error);
      
      if (error.name === "ZodError") {
        res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: "Processing failed",
          message: error.message || "An error occurred during image processing",
        });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
