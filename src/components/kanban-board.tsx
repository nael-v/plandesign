"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  label?: string;
  color?: "blue" | "emerald" | "amber" | "red";
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove?: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  onAddCard?: (columnId: string) => void;
}

const colorClasses = {
  blue: "border-l-4 border-l-blue-500",
  emerald: "border-l-4 border-l-emerald-500",
  amber: "border-l-4 border-l-amber-500",
  red: "border-l-4 border-l-red-500",
};

function SortableCard({ card }: { card: KanbanCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md",
        colorClasses[card.color || "blue"],
        isDragging && "opacity-50 scale-95 shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-colors"
          aria-label="Drag card"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{card.title}</p>
          {card.description && (
            <p className="mt-1 text-xs text-muted line-clamp-2">
              {card.description}
            </p>
          )}
          {card.label && (
            <div className="mt-3 flex items-center">
              <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                {card.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function KanbanColumnComponent({
  column,
  onAddCard,
}: {
  column: KanbanColumn;
  onAddCard?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex w-full min-w-[320px] flex-col rounded-xl border border-border bg-surface p-4 sm:w-96"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
          <p className="text-xs text-muted">{column.cards.length} items</p>
        </div>
        {onAddCard && (
          <button
            onClick={onAddCard}
            className="rounded-lg p-1.5 hover:bg-surface-elevated transition-colors duration-200"
            aria-label="Add card"
          >
            <Plus className="h-4 w-4 text-muted hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Cards */}
      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <motion.div className="space-y-3 flex-1">
          <AnimatePresence>
            {column.cards.map((card) => (
              <SortableCard key={card.id} card={card} />
            ))}
          </AnimatePresence>
        </motion.div>
      </SortableContext>

      {/* Add card button */}
      {column.cards.length === 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-sm text-muted hover:border-foreground hover:text-foreground transition-colors duration-200"
          onClick={onAddCard}
        >
          <Plus className="h-4 w-4" />
          Add card
        </motion.button>
      )}
    </motion.div>
  );
}

export function KanbanBoard({
  columns: initialColumns,
  onCardMove,
  onAddCard,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find the column and position of the dragged card
    let fromColumnId: string | null = null;
    let toColumnId: string | null = null;
    let draggedCard: KanbanCard | null = null;

    for (const col of columns) {
      const cardIndex = col.cards.findIndex((c) => c.id === active.id);
      if (cardIndex !== -1) {
        fromColumnId = col.id;
        draggedCard = col.cards[cardIndex];
        break;
      }
    }

    // Find target column
    for (const col of columns) {
      if (col.cards.some((c) => c.id === over.id) || over.id === col.id) {
        toColumnId = col.id;
        break;
      }
    }

    if (!fromColumnId || !toColumnId || !draggedCard) return;

    if (onCardMove) {
      onCardMove(draggedCard.id, fromColumnId, toColumnId);
    }

    // Update local state
    const newColumns = columns.map((col) => ({
      ...col,
      cards: col.cards.filter((c) => c.id !== draggedCard.id),
    }));

    const targetColIndex = newColumns.findIndex((c) => c.id === toColumnId);
    if (targetColIndex !== -1) {
      const overCardIndex = newColumns[targetColIndex].cards.findIndex(
        (c) => c.id === over.id
      );
      if (overCardIndex !== -1) {
        newColumns[targetColIndex].cards.splice(
          overCardIndex,
          0,
          draggedCard
        );
      } else {
        newColumns[targetColIndex].cards.push(draggedCard);
      }
    }

    setColumns(newColumns);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            onAddCard={() => onAddCard?.(column.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-96 flex-shrink-0 rounded-xl border border-border bg-surface p-4 space-y-4"
        >
          <div className="space-y-1">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="h-20 animate-pulse rounded-lg bg-slate-200"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
