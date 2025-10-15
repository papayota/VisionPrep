import { describe, it, expect } from "vitest";
import {
  enforceUploadLimits,
  UPLOAD_LIMITS,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
} from "./uploadLimits";

const createFile = (size: number, name: string) =>
  new File([new Uint8Array(size)], name, { type: "image/png" });

describe("enforceUploadLimits", () => {
  it("keeps only the allowed number of files and flags extras", () => {
    const files = Array.from({ length: UPLOAD_LIMITS.MAX_FILES + 2 }, (_, index) =>
      createFile(1024, `image-${index}.png`)
    );

    const result = enforceUploadLimits(files, 0, 0);

    expect(result.acceptedFiles).toHaveLength(UPLOAD_LIMITS.MAX_FILES);
    expect(result.acceptedFiles[0]?.name).toBe("image-0.png");
    expect(result.acceptedFiles.at(-1)?.name).toBe(
      `image-${UPLOAD_LIMITS.MAX_FILES - 1}.png`
    );
    expect(result.extraFilesIgnored).toBe(true);
    expect(result.oversizedFiles).toHaveLength(0);
  });

  it("skips files larger than the maximum size", () => {
    const largeFile = createFile(MAX_FILE_BYTES + 1, "large.png");
    const smallFile = createFile(1024, "small.png");

    const result = enforceUploadLimits([smallFile, largeFile], 0, 0);

    expect(result.acceptedFiles).toHaveLength(1);
    expect(result.acceptedFiles[0]?.name).toBe("small.png");
    expect(result.oversizedFiles).toEqual([largeFile]);
    expect(result.extraFilesIgnored).toBe(false);
  });

  it("returns no accepted files when every file is invalid", () => {
    const oversizedFiles = [
      createFile(MAX_FILE_BYTES + 1, "too-big-1.png"),
      createFile(MAX_FILE_BYTES + 1, "too-big-2.png"),
    ];

    const result = enforceUploadLimits(oversizedFiles, 0, 0);

    expect(result.acceptedFiles).toHaveLength(0);
    expect(result.oversizedFiles).toHaveLength(2);
    expect(result.extraFilesIgnored).toBe(false);
  });
  it("prevents exceeding the total batch size", () => {
    const nearLimit = MAX_TOTAL_BYTES - 512;
    const overflowFile = createFile(2048, "overflow.png");

    const result = enforceUploadLimits([overflowFile], 0, nearLimit);

    expect(result.acceptedFiles).toHaveLength(0);
    expect(result.totalSizeExceeded).toBe(true);
  });
});
