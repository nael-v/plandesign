"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addProjectCommentAction } from "@/actions/projects";
import { commentFormSchema, CommentFormValues } from "@/features/projects/validation";
import type { ProjectCommentItem } from "@/features/projects/types";

type Props = {
  projectId: string;
  comments: ProjectCommentItem[];
};

export function ProjectComments({ projectId, comments }: Props) {
  const queryClient = useQueryClient();
  const listRef = useRef<HTMLUListElement>(null);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { content: "" },
  });

  const addCommentMutation = useMutation({
    mutationFn: (values: CommentFormValues) =>
      addProjectCommentAction({ projectId, content: values.content }),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ["project-workspace", projectId] });
      const previous = queryClient.getQueryData(["project-workspace", projectId]);

      queryClient.setQueryData(["project-workspace", projectId], (current: { comments?: ProjectCommentItem[] } | null) => {
        if (!current) return current;
        const optimistic: ProjectCommentItem = {
          id: `optimistic-${Date.now()}`,
          content: values.content,
          author: "You",
          createdAt: new Date(),
        };
        return { ...current, comments: [...(current.comments ?? []), optimistic] };
      });

      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["project-workspace", projectId], ctx.previous);
      toast.error("Failed to post comment");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Failed to post comment");
        return;
      }
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["project-workspace", projectId] });
      // Scroll to bottom
      setTimeout(() => {
        listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-foreground">
          Discussion
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {comments.length}
          </span>
        </h3>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          No comments yet. Start the discussion below.
        </div>
      ) : (
        <ul ref={listRef} className="space-y-3" aria-label="Project comments">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700"
                aria-hidden="true"
              >
                {comment.author.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{comment.author}</span>
                  <time
                    className="text-xs text-muted"
                    dateTime={new Date(comment.createdAt).toISOString()}
                  >
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Compose */}
      <form
        className="flex gap-3"
        onSubmit={form.handleSubmit((values) => addCommentMutation.mutate(values))}
        aria-label="Add comment"
      >
        <textarea
          className="min-h-12 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Add a comment or note to the project…"
          rows={2}
          aria-label="Comment text"
          {...form.register("content")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              form.handleSubmit((values) => addCommentMutation.mutate(values))();
            }
          }}
        />
        <Button
          type="submit"
          disabled={addCommentMutation.isPending}
          size="sm"
          aria-label="Post comment"
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {form.formState.errors.content && (
        <p className="text-xs text-red-600" role="alert">
          {form.formState.errors.content.message}
        </p>
      )}
    </div>
  );
}
