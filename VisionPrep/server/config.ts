import {
  DEFAULT_MAX_UPLOAD_MB,
  DEFAULT_MAX_FILE_MB,
  toBytes,
  createPayloadTooLargeHint,
} from "@shared/uploadLimits";

const configuredUploadMb = Number(process.env.MAX_UPLOAD_MB ?? DEFAULT_MAX_UPLOAD_MB);
const configuredFileMb = Number(process.env.MAX_FILE_MB ?? DEFAULT_MAX_FILE_MB);

const maxUploadMb = Number.isFinite(configuredUploadMb) && configuredUploadMb > 0
  ? configuredUploadMb
  : DEFAULT_MAX_UPLOAD_MB;

const maxFileMb = Number.isFinite(configuredFileMb) && configuredFileMb > 0
  ? configuredFileMb
  : DEFAULT_MAX_FILE_MB;

export const UPLOAD_LIMIT_CONFIG = {
  maxUploadMb,
  maxUploadBytes: toBytes(maxUploadMb),
  maxFileMb,
  maxFileBytes: toBytes(maxFileMb),
  hint: createPayloadTooLargeHint(maxUploadMb),
} as const;
