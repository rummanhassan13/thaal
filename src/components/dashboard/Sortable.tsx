import type { ReactNode } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

/** Vertical drag-to-reorder list. Works with mouse, touch (press-and-drag on the handle) and keyboard. */
export function SortableList<T extends { id: string }>({ items, onReorder, children }: {
  items: T[]; onReorder: (next: T[]) => void; children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>{children}</SortableContext>
    </DndContext>
  );
}

export function SortableItem({ id, children, className }: {
  id: string; className?: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Drag to reorder"
      className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
    >
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden><g fill="currentColor">{[2, 8, 14].flatMap((y) => [<circle key={`a${y}`} cx="2" cy={y} r="1.3" />, <circle key={`b${y}`} cx="8" cy={y} r="1.3" />])}</g></svg>
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative bg-background", isDragging && "z-10 opacity-90 ring-1 ring-ink/15 rounded-lg", className)}
    >
      {children(handle)}
    </div>
  );
}
