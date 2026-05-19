import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex flex-col items-center justify-between gap-4 sm:flex-row", className)}>
      <p className="text-sm text-muted">
        Showing <span className="font-medium text-foreground">{start}</span> to{" "}
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="px-2 text-sm">
          Page <span className="font-medium">{page}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {onPageSizeChange && (
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-2xl border border-border bg-background px-3 py-1 text-sm text-foreground"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      )}
    </div>
  );
}
