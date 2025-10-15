export const UPLOAD_LIMITS = {
  MAX_FILES: 10,
  MAX_FILE_MB: 10,
} as const;

export const MAX_FILE_BYTES = UPLOAD_LIMITS.MAX_FILE_MB * 1024 * 1024;

export interface UploadValidationResult {
  acceptedFiles: File[];
  oversizedFiles: File[];
  extraFilesIgnored: boolean;
}

export function enforceUploadLimits(files: File[], currentCount: number): UploadValidationResult {
  const availableSlots = Math.max(UPLOAD_LIMITS.MAX_FILES - currentCount, 0);
  const acceptedFiles: File[] = [];
  const oversizedFiles: File[] = [];
  let extraFilesIgnored = false;

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      oversizedFiles.push(file);
      continue;
    }

    if (acceptedFiles.length >= availableSlots) {
      extraFilesIgnored = true;
      continue;
    }

    acceptedFiles.push(file);
  }

  if (files.length > 0 && availableSlots === 0) {
    extraFilesIgnored = true;
  }

  return {
    acceptedFiles,
    oversizedFiles,
    extraFilesIgnored,
  };
}
