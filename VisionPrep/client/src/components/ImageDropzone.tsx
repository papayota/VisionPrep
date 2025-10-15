import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  currentCount: number;
  maxImages: number;
}

export function ImageDropzone({
  onFilesAdded,
  currentCount,
  maxImages,
}: ImageDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxImages - currentCount;
      const filesToAdd = acceptedFiles.slice(0, remaining);
      if (filesToAdd.length > 0) {
        onFilesAdded(filesToAdd);
      }
    },
    [onFilesAdded, currentCount, maxImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    },
    maxFiles: maxImages - currentCount,
    disabled: currentCount >= maxImages,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-8
        transition-all duration-200 cursor-pointer
        ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        }
        ${currentCount >= maxImages ? "opacity-50 cursor-not-allowed" : ""}
      `}
      data-testid="dropzone-container"
    >
      <input {...getInputProps()} data-testid="input-file" />
      
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 rounded-full bg-primary/10">
          {isDragActive ? (
            <ImageIcon className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            {isDragActive
              ? "Drop images here"
              : "Drag & drop images or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">
            {currentCount >= maxImages
              ? `Maximum ${maxImages} images reached`
              : `Upload up to ${maxImages - currentCount} more image${maxImages - currentCount === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="absolute top-3 right-3">
          <div className="px-2 py-1 rounded-md bg-muted">
            <p className="text-xs font-medium text-muted-foreground" data-testid="text-count">
              {currentCount}/{maxImages}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
