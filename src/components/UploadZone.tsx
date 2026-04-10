"use client";

import { useCallback, useState } from "react";
import { buttonVariants } from "@/components/ui/button";

interface UploadZoneProps {
  onUploadComplete: () => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".epub")) {
        setError("Only EPUB files are supported");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/books/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        onUploadComplete();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <p className="text-muted-foreground">Uploading and parsing...</p>
      ) : (
        <>
          <p className="text-muted-foreground mb-4">
            Drag and drop an EPUB file here, or click to select
          </p>
          <label className="inline-flex cursor-pointer">
            <span className={buttonVariants({ variant: "outline" })}>
              Select EPUB
            </span>
            <input
              type="file"
              accept=".epub"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </>
      )}
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  );
}
