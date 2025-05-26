"use client";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";

const statuses = ["Planned", "InProgress", "Done"];

export default function KanbanDemo() {
  const [items, setItems] = useState([
    { id: "1", title: "Test 1", status: "Planned" },
    { id: "2", title: "Test 2", status: "InProgress" }
  ]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(items =>
        items.map(item =>
          item.id === active.id ? { ...item, status: over.id as string } : item
        )
      );
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: "flex", gap: 24 }}>
        {statuses.map(status => (
          <Column key={status} id={status}>
            {items.filter(i => i.status === status).map(item => (
              <Card key={item.id} id={item.id} title={item.title} />
            ))}
          </Column>
        ))}
      </div>
    </DndContext>
  );
}

function Column({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 200,
        minHeight: 300,
        background: isOver ? "#e0f7fa" : "#fff",
        border: "2px solid #e5e7eb",
        borderRadius: 8,
        padding: 16
      }}
    >
      <b>{id}</b>
      {children}
    </div>
  );
}

function Card({ id, title }: { id: string; title: string }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        background: "#fafafa",
        border: "1px solid #ccc",
        borderRadius: 4,
        margin: "8px 0",
        padding: 8,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab"
      }}
    >
      {title}
    </div>
  );
} 