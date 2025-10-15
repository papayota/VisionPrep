import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateRequestSchema, batchResponseSchema } from "@shared/schema";
import { processImageWithRetry, processBatchWithConcurrency } from "./lib/imageProcessor";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate", async (req, res) => {
    try {
      const validated = generateRequestSchema.parse(req.body);
      const { images, lang, tone, keywords } = validated;

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
