import { describe, it, expect } from "vitest";
import {
  imageMetricsSchema,
  imageResultSchema,
  generateRequestSchema,
  batchResponseSchema,
  placementHints,
  languages,
  tones,
} from "./schema";

describe("Schema Validation", () => {
  describe("imageMetricsSchema", () => {
    it("validates correct metrics", () => {
      const validMetrics = {
        width: 1920,
        height: 1080,
        bytes: 500000,
      };

      expect(imageMetricsSchema.parse(validMetrics)).toEqual(validMetrics);
    });

    it("accepts zero bytes", () => {
      expect(
        imageMetricsSchema.parse({ width: 1920, height: 1080, bytes: 0 })
      ).toEqual({ width: 1920, height: 1080, bytes: 0 });
    });
  });

  describe("imageResultSchema", () => {
    it("validates complete result", () => {
      const validResult = {
        alt: "Beautiful sunset over mountains",
        keywords_used: ["sunset", "mountains"],
        tags: ["nature", "landscape", "outdoor", "scenic"],
        placement_hint: "hero" as const,
      };

      expect(imageResultSchema.parse(validResult)).toEqual(validResult);
    });

    it("accepts ALT text of any length (no validation)", () => {
      // Schema doesn't enforce length limits - tests actual behavior
      const alt140 = "a".repeat(140);
      expect(
        imageResultSchema.parse({
          alt: alt140,
          keywords_used: [],
          tags: ["test"],
          placement_hint: "hero",
        })
      ).toMatchObject({ alt: alt140 });

      const alt200 = "a".repeat(200);
      expect(
        imageResultSchema.parse({
          alt: alt200,
          keywords_used: [],
          tags: ["test"],
          placement_hint: "hero",
        })
      ).toMatchObject({ alt: alt200 });
    });

    it("accepts empty ALT text (no validation)", () => {
      // Schema doesn't require non-empty - tests actual behavior
      expect(
        imageResultSchema.parse({
          alt: "",
          keywords_used: [],
          tags: ["test"],
          placement_hint: "hero",
        })
      ).toMatchObject({ alt: "" });
    });

    it("limits keywords_used to max 2", () => {
      expect(() =>
        imageResultSchema.parse({
          alt: "Test",
          keywords_used: ["one", "two", "three"],
          tags: ["test"],
          placement_hint: "hero",
        })
      ).toThrow();

      // 2 keywords should pass
      expect(
        imageResultSchema.parse({
          alt: "Test",
          keywords_used: ["one", "two"],
          tags: ["test"],
          placement_hint: "hero",
        })
      ).toMatchObject({ keywords_used: ["one", "two"] });
    });

    it("limits tags to max 10", () => {
      const tags11 = Array.from({ length: 11 }, (_, i) => `tag${i}`);

      expect(() =>
        imageResultSchema.parse({
          alt: "Test",
          keywords_used: [],
          tags: tags11,
          placement_hint: "hero",
        })
      ).toThrow();

      // 10 tags should pass
      const tags10 = Array.from({ length: 10 }, (_, i) => `tag${i}`);
      expect(
        imageResultSchema.parse({
          alt: "Test",
          keywords_used: [],
          tags: tags10,
          placement_hint: "hero",
        })
      ).toMatchObject({ tags: tags10 });
    });

    it("validates placement hint is from allowed list", () => {
      placementHints.forEach((hint) => {
        expect(
          imageResultSchema.parse({
            alt: "Test",
            keywords_used: [],
            tags: ["test"],
            placement_hint: hint,
          })
        ).toMatchObject({ placement_hint: hint });
      });

      expect(() =>
        imageResultSchema.parse({
          alt: "Test",
          keywords_used: [],
          tags: ["test"],
          placement_hint: "invalid" as any,
        })
      ).toThrow();
    });
  });

  describe("generateRequestSchema", () => {
    it("validates complete request", () => {
      const validRequest = {
        images: [
          {
            dataUrl: "data:image/png;base64,abc123",
            filename: "test.png",
            sha256: "a".repeat(64),
            metrics: { width: 100, height: 100, bytes: 1000 },
          },
        ],
        lang: "en" as const,
        tone: "professional" as const,
        keywords: ["test", "sample"],
      };

      expect(generateRequestSchema.parse(validRequest)).toEqual(validRequest);
    });

    it("requires at least 1 image", () => {
      expect(() =>
        generateRequestSchema.parse({
          images: [],
          lang: "en",
        })
      ).toThrow();
    });

    it("limits to max 10 images", () => {
      const images11 = Array.from({ length: 11 }, (_, i) => ({
        dataUrl: `data:image/png;base64,img${i}`,
        filename: `test${i}.png`,
        sha256: `${"a".repeat(64)}`,
        metrics: { width: 100, height: 100, bytes: 1000 },
      }));

      expect(() =>
        generateRequestSchema.parse({
          images: images11,
          lang: "en",
        })
      ).toThrow();
    });

    it("validates language is from allowed list", () => {
      languages.forEach((lang) => {
        expect(
          generateRequestSchema.parse({
            images: [
              {
                dataUrl: "data:image/png;base64,abc",
                filename: "test.png",
                sha256: "a".repeat(64),
                metrics: { width: 100, height: 100, bytes: 1000 },
              },
            ],
            lang,
          })
        ).toMatchObject({ lang });
      });

      expect(() =>
        generateRequestSchema.parse({
          images: [
            {
              dataUrl: "data:image/png;base64,abc",
              filename: "test.png",
              sha256: "a".repeat(64),
              metrics: { width: 100, height: 100, bytes: 1000 },
            },
          ],
          lang: "fr" as any,
        })
      ).toThrow();
    });

    it("validates tone is from allowed list", () => {
      tones.forEach((tone) => {
        expect(
          generateRequestSchema.parse({
            images: [
              {
                dataUrl: "data:image/png;base64,abc",
                filename: "test.png",
                sha256: "a".repeat(64),
                metrics: { width: 100, height: 100, bytes: 1000 },
              },
            ],
            lang: "en",
            tone,
          })
        ).toMatchObject({ tone });
      });
    });

    it("allows optional tone and keywords", () => {
      const requestWithoutOptional = {
        images: [
          {
            dataUrl: "data:image/png;base64,abc",
            filename: "test.png",
            sha256: "a".repeat(64),
            metrics: { width: 100, height: 100, bytes: 1000 },
          },
        ],
        lang: "en" as const,
      };

      expect(
        generateRequestSchema.parse(requestWithoutOptional)
      ).toMatchObject(requestWithoutOptional);
    });
  });

  describe("batchResponseSchema", () => {
    it("validates complete response", () => {
      const validResponse = {
        generated_at: new Date().toISOString(),
        lang: "en" as const,
        items: [
          {
            filename: "test.png",
            sha256: "a".repeat(64),
            metrics: { width: 100, height: 100, bytes: 1000 },
            result: {
              alt: "Test image",
              keywords_used: ["test"],
              tags: ["photo"],
              placement_hint: "hero" as const,
            },
          },
        ],
      };

      expect(batchResponseSchema.parse(validResponse)).toEqual(validResponse);
    });

    it("allows empty items array", () => {
      const responseWithNoItems = {
        generated_at: new Date().toISOString(),
        lang: "en" as const,
        items: [],
      };

      expect(batchResponseSchema.parse(responseWithNoItems)).toEqual(
        responseWithNoItems
      );
    });
  });

  describe("CSV/JSON Export Format", () => {
    it("validates complete data structure for export", () => {
      const exportData = {
        generated_at: new Date().toISOString(),
        lang: "en" as const,
        items: [
          {
            filename: "test1.jpg",
            sha256: "a".repeat(64),
            metrics: { width: 1920, height: 1080, bytes: 500000 },
            result: {
              alt: "Professional workspace with laptop",
              keywords_used: ["modern", "workspace"],
              tags: ["office", "technology", "professional", "business"],
              placement_hint: "feature" as const,
            },
          },
          {
            filename: "test2.jpg",
            sha256: "b".repeat(64),
            metrics: { width: 1280, height: 720, bytes: 300000 },
            result: {
              alt: "Team collaboration meeting",
              keywords_used: [],
              tags: ["teamwork", "meeting", "collaboration"],
              placement_hint: "how-it-works" as const,
            },
          },
        ],
      };

      const parsed = batchResponseSchema.parse(exportData);
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0].result?.keywords_used).toHaveLength(2);
      expect(parsed.items[1].result?.keywords_used).toHaveLength(0);
    });
  });
});
