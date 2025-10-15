import type { ProcessingImage } from "@shared/schema";

export interface HistoryEntry {
  id: string;
  timestamp: string;
  lang: string;
  images: {
    filename: string;
    sha256: string;
    metrics: {
      width: number;
      height: number;
      bytes: number;
    };
    result?: {
      alt: string;
      keywords_used: string[];
      tags: string[];
      placement_hint: string;
    };
  }[];
}

const HISTORY_KEY = "ai-image-prep-history";
const MAX_HISTORY_ENTRIES = 50;

export function saveToHistory(images: ProcessingImage[], lang: string): void {
  try {
    const history = getHistory();
    
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      lang,
      images: images
        .filter((img) => img.result)
        .map((img) => ({
          filename: img.file.name,
          sha256: img.sha256,
          metrics: img.metrics,
          result: img.result,
        })),
    };

    if (entry.images.length > 0) {
      history.unshift(entry);
      
      if (history.length > MAX_HISTORY_ENTRIES) {
        history.splice(MAX_HISTORY_ENTRIES);
      }
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event("historyUpdated"));
    }
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

export function getHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event("historyUpdated"));
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}

export function getProcessedSHA256s(): Set<string> {
  const history = getHistory();
  const sha256Set = new Set<string>();
  
  for (const entry of history) {
    for (const image of entry.images) {
      sha256Set.add(image.sha256);
    }
  }
  
  return sha256Set;
}

export function deleteHistoryEntry(id: string): void {
  try {
    const history = getHistory();
    const filtered = history.filter((entry) => entry.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("historyUpdated"));
  } catch (error) {
    console.error("Failed to delete history entry:", error);
  }
}
