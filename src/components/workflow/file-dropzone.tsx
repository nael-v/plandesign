"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FileText, ImageIcon, Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewFile = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  previewUrl?: string;
};

type FileDropzoneProps = {
  title: string;
  onUpload: (file: File) => Promise<void>;
  accept?: string;
};

function isPreviewableImage(file: File) {
  return file.type.startsWith("image/");
}

function isPdf(file: File) {
  return file.type === "application/pdf";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({ title, onUpload, accept }: FileDropzoneProps) {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadCount = useMemo(() => files.filter((item) => item.status === "done").length, [files]);
  const failedCount = useMemo(() => files.filter((item) => item.status === "error").length, [files]);
  const pendingCount = useMemo(() => files.filter((item) => item.status === "pending").length, [files]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;

    const list = Array.from(incoming).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      file,
      progress: 0,
      status: "pending" as const,
      error: undefined,
      previewUrl: isPreviewableImage(file) ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((current) => [...list, ...current]);
  };

  const removeItem = (id: string) => {
    setFiles((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const uploadFile = async (item: PreviewFile) => {
    setFiles((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "uploading", progress: Math.max(entry.progress, 8), error: undefined }
          : entry,
      ),
    );

    const progressTicker = window.setInterval(() => {
      setFiles((current) =>
        current.map((entry) => {
          if (entry.id !== item.id || entry.status !== "uploading") {
            return entry;
          }

          const nextProgress = Math.min(95, entry.progress + Math.floor(Math.random() * 12 + 4));
          return { ...entry, progress: nextProgress };
        }),
      );
    }, 180);

    try {
      await onUpload(item.file);

      window.clearInterval(progressTicker);
      setFiles((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, progress: 100, status: "done", error: undefined } : entry,
        ),
      );
    } catch (error) {
      window.clearInterval(progressTicker);
      const message = error instanceof Error ? error.message : "Upload failed";
      setFiles((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "error", error: message } : entry,
        ),
      );
    }
  };

  const uploadAll = async () => {
    const pending = files.filter((item) => item.status === "pending");
    for (const item of pending) {
      // Sequential upload keeps the progress indicators readable.
      await uploadFile(item);
    }
  };

  const retryUpload = async (item: PreviewFile) => {
    await uploadFile({ ...item, progress: 0, status: "pending", error: undefined });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="File upload dropzone"
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-blue-400 bg-blue-50/50" : "border-border",
        )}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted">Drag and drop files, images, or PDFs</p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Select files
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              {uploadCount} uploaded • {pendingCount} pending • {failedCount} failed
            </span>
            <Button size="sm" type="button" onClick={uploadAll} disabled={pendingCount === 0}>
              Upload all
            </Button>
          </div>

          <ul className="space-y-2">
            {files.map((item) => (
              <li key={item.id} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.previewUrl ? (
                      <Image
                        src={item.previewUrl}
                        alt={item.file.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                        unoptimized
                      />
                    ) : isPdf(item.file) ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <FileText className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                      <p className="text-xs text-muted">{Math.round(item.file.size / 1024)} KB</p>
                    </div>
                  </div>

                  <button
                    className="rounded-full p-1 text-muted transition-colors hover:bg-slate-100 hover:text-foreground"
                    onClick={() => removeItem(item.id)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${item.progress}%` }} />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    {item.progress}% • {formatFileSize(item.file.size)}
                  </span>
                  {item.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
                  {item.status === "pending" && (
                    <Button size="sm" variant="ghost" type="button" onClick={() => uploadFile(item)}>
                      Upload
                    </Button>
                  )}
                  {item.status === "done" && <span className="text-emerald-600">Done</span>}
                  {item.status === "error" && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-600" role="status">{item.error || "Upload failed"}</span>
                      <Button size="sm" variant="ghost" type="button" onClick={() => retryUpload(item)}>
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
