import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";
import type { Server } from "http";
import { createApp } from "./index";
import type { GenerateRequest } from "@shared/schema";

vi.mock("./lib/imageProcessor", () => ({
  processImageWithRetry: vi.fn(async () => ({
    alt: "Stub alt text",
    keywords_used: [],
    tags: ["stub"],
    placement_hint: "hero",
  })),
  processBatchWithConcurrency: async <T, R>(items: T[], processor: (item: T) => Promise<R>) => {
    const results: R[] = [];
    for (const item of items) {
      results.push(await processor(item));
    }
    return results;
  },
}));

function createImagePayload(sizeBytes: number, name: string): GenerateRequest["images"][number] {
  const buffer = Buffer.alloc(sizeBytes, 0);
  const base64 = buffer.toString("base64");
  return {
    dataUrl: `data:image/jpeg;base64,${base64}`,
    filename: name,
    sha256: `sha-${name}`,
    metrics: {
      width: 100,
      height: 100,
      bytes: sizeBytes,
    },
  };
}

describe("POST /api/generate upload limits", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const created = await createApp();
    server = created.server;

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to determine server address");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });

  async function postImages(images: GenerateRequest["images"]): Promise<Response> {
    return fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images, lang: "en" }),
    });
  }

  it("accepts a ~50KB payload", async () => {
    const res = await postImages([createImagePayload(50 * 1024, "50kb.jpg")]);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.items).toHaveLength(1);
  });

  it("accepts a ~500KB payload", async () => {
    const res = await postImages([createImagePayload(500 * 1024, "500kb.jpg")]);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
  });

  it("rejects payloads larger than the per-file limit", async () => {
    const res = await postImages([createImagePayload(5 * 1024 * 1024, "5mb.jpg")]);

    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json).toEqual({
      error: "payload_too_large",
      hint: expect.stringContaining("max"),
    });
  });
});
