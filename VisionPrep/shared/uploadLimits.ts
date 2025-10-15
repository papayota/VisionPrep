export const DEFAULT_MAX_UPLOAD_MB = 10;
export const DEFAULT_MAX_FILE_MB = 2;

export function toBytes(megabytes: number): number {
  return Math.round(megabytes * 1024 * 1024);
}

export function estimateBase64Bytes(base64OrDataUrl: string): number {
  const base64 = base64OrDataUrl.includes(",")
    ? base64OrDataUrl.split(",", 2)[1] ?? ""
    : base64OrDataUrl;

  const sanitized = base64.trim();
  const padding = sanitized.endsWith("==")
    ? 2
    : sanitized.endsWith("=")
      ? 1
      : 0;
  const length = sanitized.length;

  if (length === 0) {
    return 0;
  }

  return Math.max(0, Math.floor((length * 3) / 4) - padding);
}

export function createPayloadTooLargeHint(maxUploadMb: number): string {
  return `Try smaller files or fewer images (max ${maxUploadMb} MB total)`;
}
