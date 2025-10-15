import { describe, it, expect, beforeEach } from "vitest";
import { formatBytes, calculateSHA256 } from "./utils";

describe("formatBytes", () => {
  it("formats bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1572864)).toBe("1.5 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("handles decimal precision", () => {
    expect(formatBytes(1234)).toBe("1.2 KB");
    expect(formatBytes(1234567)).toBe("1.2 MB");
  });
});

describe("calculateSHA256", () => {
  it("generates consistent SHA256 hash for same file", async () => {
    const content = "test content";
    const file1 = new File([content], "test.txt", { type: "text/plain" });
    const file2 = new File([content], "test.txt", { type: "text/plain" });

    const hash1 = await calculateSHA256(file1);
    const hash2 = await calculateSHA256(file2);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 is 64 hex chars
  });

  it("generates different hashes for different files", async () => {
    const file1 = new File(["content1"], "test1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "test2.txt", { type: "text/plain" });

    const hash1 = await calculateSHA256(file1);
    const hash2 = await calculateSHA256(file2);

    expect(hash1).not.toBe(hash2);
  });

  it("handles binary data", async () => {
    const buffer = new Uint8Array([1, 2, 3, 4, 5]);
    const file = new File([buffer], "binary.bin", { type: "application/octet-stream" });

    const hash = await calculateSHA256(file);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
