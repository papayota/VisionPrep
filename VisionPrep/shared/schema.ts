import { z } from "zod";

// Placement hint enum for strict validation
export const placementHints = [
  "hero",
  "how-it-works",
  "feature",
  "sidebar",
  "cta-near",
  "gallery",
] as const;

export type PlacementHint = typeof placementHints[number];

// Language enum
export const languages = ["ja", "en"] as const;
export type Language = typeof languages[number];

// Tone enum
export const tones = ["neutral", "friendly", "professional"] as const;
export type Tone = typeof tones[number];

// Image processing status
export const processingStatuses = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export type ProcessingStatus = typeof processingStatuses[number];

// Image metrics schema
export const imageMetricsSchema = z.object({
  width: z.number(),
  height: z.number(),
  bytes: z.number(),
});

export type ImageMetrics = z.infer<typeof imageMetricsSchema>;

// Result schema from OpenAI
export const imageResultSchema = z.object({
  alt: z.string(),
  keywords_used: z.array(z.string()).max(2),
  tags: z.array(z.string()).max(10),
  placement_hint: z.enum(placementHints),
});

export type ImageResult = z.infer<typeof imageResultSchema>;

// Single image item schema
export const imageItemSchema = z.object({
  filename: z.string(),
  sha256: z.string(),
  metrics: imageMetricsSchema,
  result: imageResultSchema,
});

export type ImageItem = z.infer<typeof imageItemSchema>;

// Batch response schema
export const batchResponseSchema = z.object({
  generated_at: z.string(),
  lang: z.enum(languages),
  items: z.array(imageItemSchema),
});

export type BatchResponse = z.infer<typeof batchResponseSchema>;

// Request payload schema
export const generateRequestSchema = z.object({
  images: z.array(
    z.object({
      dataUrl: z.string(),
      filename: z.string(),
      sha256: z.string(),
      metrics: imageMetricsSchema,
    })
  ).min(1).max(10),
  lang: z.enum(languages),
  tone: z.enum(tones).optional(),
  keywords: z.array(z.string()).optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// Frontend-only: Extended image with processing state
export interface ProcessingImage {
  id: string;
  file: File;
  dataUrl: string;
  sha256: string;
  metrics: ImageMetrics;
  status: ProcessingStatus;
  result?: ImageResult;
  error?: string;
}
