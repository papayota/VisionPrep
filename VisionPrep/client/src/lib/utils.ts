import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import CryptoJS from "crypto-js";
import type { ProcessingImage, ImageMetrics } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function calculateSHA256(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && result instanceof ArrayBuffer) {
        const wordArray = CryptoJS.lib.WordArray.create(result);
        const hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export async function getImageMetrics(file: File): Promise<ImageMetrics> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && typeof result === "string") {
        img.src = result;
      } else {
        reject(new Error("Failed to read image"));
      }
    };
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        bytes: file.size,
      });
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + " " + sizes[i];
}

export function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(images: ProcessingImage[], lang: string) {
  const headers = [
    "filename",
    "lang",
    "alt",
    "keywords_used",
    "tags",
    "placement_hint",
    "width",
    "height",
    "bytes",
    "sha256",
  ];
  
  const rows = images
    .filter((img) => img.result)
    .map((img) => [
      img.file.name,
      lang,
      img.result!.alt,
      img.result!.keywords_used.join(","),
      img.result!.tags.join(","),
      img.result!.placement_hint,
      img.metrics.width,
      img.metrics.height,
      img.metrics.bytes,
      img.sha256,
    ]);
  
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `image-analysis-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function trimAltText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const trimmed = text.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  
  if (lastSpace > maxLength * 0.8) {
    return trimmed.substring(0, lastSpace);
  }
  
  return trimmed;
}
