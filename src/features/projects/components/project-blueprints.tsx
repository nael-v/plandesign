"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, FolderOpen, ImageIcon, Paperclip, Upload, X } from "lucide-react";
import { uploadProjectFileAction } from "@/actions/projects";
import type { ProjectAttachmentItem } from "@/features/projects/types";

type UploadQueueItem = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  errorMsg?: string;
};

type Props = {
  projectId: string;
  attachments: ProjectAttachmentItem[];
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "image/": <ImageIcon className="h-4 w-4 text-blue-500" />,
  "application/pdf": <FileText className="h-4 w-4 text-red-500" />,
  default: <Paperclip className="h-4 w-4 text-slate-500" />,
};

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return CATEGORY_ICONS["image/"];
  if (mimeType === "application/pdf") return CATEGORY_ICONS["application/pdf"];
  return CATEGORY_ICONS.default;
}

function fileCategory(mimeType: string) {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF";
  return "Document";
}

export function ProjectBlueprints({ projectId, attachments }: Props) {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      uploadProjectFileAction({
        projectId,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      }),
    onSuccess: (result, file) => {
      if (!result.success) {
        setQueue((prev) =>
          prev.map((q) =>
            q.file === file ? { ...q, status: "error", errorMsg: result.error } : q,
          ),
        );
        toast.error(`Failed to upload ${file.name}`);
        return;
      }
      setQueue((prev) =>
        prev.map((q) => (q.file === file ? { ...q, status: "done", progress: 100 } : q)),
      );
      queryClient.invalidateQueries({ queryKey: ["project-workspace", projectId] });
    },
    onError: (_e, file) => {
      setQueue((prev) =>
        prev.map((q) =>
          q.file === file ? { ...q, status: "error", errorMsg: "Upload failed" } : q,
        ),
      );
      toast.error(`Upload failed: ${file.name}`);
    },
  });

  const enqueue = useCallback(
    (files: FileList | File[]) => {
      const newItems: UploadQueueItem[] = Array.from(files).map((f) => ({
        id: `${Date.now()}-${f.name}`,
        file: f,
        status: "uploading",
        progress: 0,
      }));

      setQueue((prev) => [...prev, ...newItems]);

      newItems.forEach((item) => {
        uploadMutation.mutate(item.file);
      });
    },
    [uploadMutation],
  );

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) enqueue(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-foreground">
          Project files & blueprints
        </h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {attachments.length} files
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50/60"
            : "border-border bg-surface/30 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*,.pdf,.dwg,.dxf,.rvt";
          input.multiple = true;
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files?.length) enqueue(files);
          };
          input.click();
        }}
      >
        <Upload className="h-6 w-6 text-muted" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop blueprints, plans, and documents here
          </p>
          <p className="text-xs text-muted">
            Supports images, PDFs, DWG, DXF, Revit files
          </p>
        </div>
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Upload queue</p>
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              {fileIcon(item.file.type)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  {item.status === "uploading" && (
                    <>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/50">
                        <div className="h-full animate-pulse rounded-full bg-blue-500 w-2/3" />
                      </div>
                      <span className="text-xs text-muted">Uploading…</span>
                    </>
                  )}
                  {item.status === "done" && (
                    <span className="text-xs text-emerald-600">Uploaded</span>
                  )}
                  {item.status === "error" && (
                    <span className="text-xs text-red-600">{item.errorMsg ?? "Failed"}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Remove from queue"
                className="rounded-lg p-1 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => removeFromQueue(item.id)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Existing files */}
      {attachments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Uploaded files</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                {fileIcon(file.mimeType)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted">
                    {fileCategory(file.mimeType)} · {Math.round(file.size / 1024)} KB ·{" "}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    aria-label={`Open ${file.name}`}
                  >
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          No files uploaded yet. Drop blueprints or plan documents above.
        </div>
      )}
    </div>
  );
}
