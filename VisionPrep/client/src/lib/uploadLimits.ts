import {
  DEFAULT_MAX_UPLOAD_MB,
  DEFAULT_MAX_FILE_MB,
  estimateBase64Bytes,
  toBytes,
} from "@shared/uploadLimits";

export const UPLOAD_LIMITS = {
  MAX_FILES: 10,
  MAX_FILE_MB: DEFAULT_MAX_FILE_MB,
  MAX_TOTAL_MB: DEFAULT_MAX_UPLOAD_MB,
} as const;

export const MAX_FILE_BYTES = toBytes(UPLOAD_LIMITS.MAX_FILE_MB);
export const MAX_TOTAL_BYTES = toBytes(UPLOAD_LIMITS.MAX_TOTAL_MB);

export interface UploadValidationResult {
  acceptedFiles: File[];
  oversizedFiles: File[];
  extraFilesIgnored: boolean;
  totalSizeExceeded: boolean;
  totalBytesAfter: number;
}

export function enforceUploadLimits(
  files: File[],
  currentCount: number,
  currentTotalBytes: number,
): UploadValidationResult {
  const availableSlots = Math.max(UPLOAD_LIMITS.MAX_FILES - currentCount, 0);
  const acceptedFiles: File[] = [];
  const oversizedFiles: File[] = [];
  let extraFilesIgnored = false;
  let totalSizeExceeded = false;
  let runningTotal = currentTotalBytes;

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      oversizedFiles.push(file);
      continue;
    }

    if (acceptedFiles.length >= availableSlots) {
      extraFilesIgnored = true;
      continue;
    }

    if (runningTotal + file.size > MAX_TOTAL_BYTES) {
      totalSizeExceeded = true;
      continue;
    }

    acceptedFiles.push(file);
    runningTotal += file.size;
  }

  if (files.length > 0 && availableSlots === 0) {
    extraFilesIgnored = true;
  }

  return {
    acceptedFiles,
    oversizedFiles,
    extraFilesIgnored,
    totalSizeExceeded,
    totalBytesAfter: runningTotal,
  };
}

export function estimateBatchBytesFromDataUrls(dataUrls: string[]): number {
  return dataUrls.reduce((total, url) => total + estimateBase64Bytes(url), 0);
}
