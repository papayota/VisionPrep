import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveToHistory,
  getHistory,
  clearHistory,
  deleteHistoryEntry,
  getProcessedSHA256s,
  type HistoryEntry,
} from "./historyStorage";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock dispatchEvent
const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

describe("historyStorage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    dispatchEventSpy.mockClear();
  });

  describe("saveToHistory", () => {
    it("saves completed images to history", () => {
      const images: any[] = [
        {
          file: { name: "test.jpg" },
          sha256: "abc123",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "Test image",
            keywords_used: ["test"],
            tags: ["photo"],
            placement_hint: "hero",
          },
        },
      ];

      saveToHistory(images, "en");

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].lang).toBe("en");
      expect(history[0].images).toHaveLength(1);
      expect(history[0].images[0].filename).toBe("test.jpg");
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
    });

    it("ignores images without results", () => {
      const images: any[] = [
        {
          file: { name: "test.jpg" },
          sha256: "abc123",
          metrics: { width: 100, height: 100, bytes: 1000 },
          // No result
        },
      ];

      saveToHistory(images, "en");

      const history = getHistory();
      expect(history).toHaveLength(0); // Empty entry not saved
    });

    it("maintains max 50 entries", () => {
      // Create 55 entries
      for (let i = 0; i < 55; i++) {
        const images: any[] = [
          {
            file: { name: `test${i}.jpg` },
            sha256: `sha${i}`,
            metrics: { width: 100, height: 100, bytes: 1000 },
            result: {
              alt: `Image ${i}`,
              keywords_used: [],
              tags: [],
              placement_hint: "hero",
            },
          },
        ];
        saveToHistory(images, "en");
      }

      const history = getHistory();
      expect(history).toHaveLength(50);
      expect(history[0].images[0].filename).toBe("test54.jpg"); // Most recent
      expect(history[49].images[0].filename).toBe("test5.jpg"); // Oldest kept
    });

    it("adds newest entries to the beginning", () => {
      const images1: any[] = [
        {
          file: { name: "first.jpg" },
          sha256: "sha1",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "First",
            keywords_used: [],
            tags: [],
            placement_hint: "hero",
          },
        },
      ];

      const images2: any[] = [
        {
          file: { name: "second.jpg" },
          sha256: "sha2",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "Second",
            keywords_used: [],
            tags: [],
            placement_hint: "feature",
          },
        },
      ];

      saveToHistory(images1, "en");
      saveToHistory(images2, "ja");

      const history = getHistory();
      expect(history[0].images[0].filename).toBe("second.jpg");
      expect(history[1].images[0].filename).toBe("first.jpg");
    });
  });

  describe("clearHistory", () => {
    it("removes all history entries", () => {
      const images: any[] = [
        {
          file: { name: "test.jpg" },
          sha256: "abc123",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "Test",
            keywords_used: [],
            tags: [],
            placement_hint: "hero",
          },
        },
      ];

      saveToHistory(images, "en");
      expect(getHistory()).toHaveLength(1);

      clearHistory();
      expect(getHistory()).toHaveLength(0);
      expect(dispatchEventSpy).toHaveBeenCalled();
    });
  });

  describe("deleteHistoryEntry", () => {
    it("removes specific entry by id", () => {
      const images: any[] = [
        {
          file: { name: "test.jpg" },
          sha256: "abc123",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "Test",
            keywords_used: [],
            tags: [],
            placement_hint: "hero",
          },
        },
      ];

      saveToHistory(images, "en");
      saveToHistory(images, "ja");

      const history = getHistory();
      expect(history).toHaveLength(2);

      const idToDelete = history[0].id;
      deleteHistoryEntry(idToDelete);

      const updatedHistory = getHistory();
      expect(updatedHistory).toHaveLength(1);
      expect(updatedHistory[0].id).not.toBe(idToDelete);
    });
  });

  describe("getProcessedSHA256s", () => {
    it("returns set of all processed SHA256 hashes", () => {
      const images1: any[] = [
        {
          file: { name: "test1.jpg" },
          sha256: "sha1",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "Test 1",
            keywords_used: [],
            tags: [],
            placement_hint: "hero",
          },
        },
        {
          file: { name: "test2.jpg" },
          sha256: "sha2",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "Test 2",
            keywords_used: [],
            tags: [],
            placement_hint: "feature",
          },
        },
      ];

      const images2: any[] = [
        {
          file: { name: "test3.jpg" },
          sha256: "sha3",
          metrics: { width: 100, height: 100, bytes: 1000 },
          result: {
            alt: "Test 3",
            keywords_used: [],
            tags: [],
            placement_hint: "sidebar",
          },
        },
      ];

      saveToHistory(images1, "en");
      saveToHistory(images2, "ja");

      const sha256Set = getProcessedSHA256s();
      expect(sha256Set.size).toBe(3);
      expect(sha256Set.has("sha1")).toBe(true);
      expect(sha256Set.has("sha2")).toBe(true);
      expect(sha256Set.has("sha3")).toBe(true);
      expect(sha256Set.has("nonexistent")).toBe(false);
    });

    it("returns empty set when no history", () => {
      const sha256Set = getProcessedSHA256s();
      expect(sha256Set.size).toBe(0);
    });
  });
});
