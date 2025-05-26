"use client";

import { Medicine } from "../models/Medicine";
import { Status } from "@/services/medicines";
import { Typography } from "antd";
import { DndContext, useDraggable, useDroppable, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import MedicineCard from "./MedicineCard";

const { Title } = Typography;

interface Props {
    medicines: Medicine[];
    handleDelete: (id: string) => void;
    handleOpen: (medicine: Medicine) => void;
    handleStatusChange: (id: string, newStatus: Status) => void;
}

const columns = [
    { status: Status.Planned, title: "Запланировано" },
    { status: Status.InProgress, title: "В процессе" },
    { status: Status.Taken, title: "Принято" },
    { status: Status.Missed, title: "Пропущено" },
    { status: Status.Skipped, title: "Пропущено" },
];

export const MedicineKanban = ({ medicines, handleDelete, handleOpen, handleStatusChange }: Props) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;
        const newStatus = over.id as Status;
        const med = medicines.find(m => m.id === active.id);
        if (med && med.status !== newStatus && Object.values(Status).includes(newStatus)) {
            handleStatusChange(med.id, newStatus);
        }
    };

    const activeMedicine = medicines.find(m => m.id === activeId);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{
                display: 'flex',
                gap: '32px',
                padding: '32px 16px',
                overflowX: 'auto',
                minHeight: 'calc(100vh - 200px)',
                background: '#f7f8fa',
            }}>
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.status}
                        id={column.status}
                        title={column.title}
                    >
                        {medicines
                            .filter((medicine) => medicine.status === column.status)
                            .map((medicine) => (
                                <KanbanCard
                                    key={medicine.id}
                                    id={medicine.id}
                                    medicine={medicine}
                                    handleDelete={handleDelete}
                                    handleOpen={handleOpen}
                                />
                            ))}
                    </KanbanColumn>
                ))}
            </div>
            <DragOverlay>
                {activeMedicine ? (
                    <MedicineCard
                        medicine={activeMedicine}
                        handleDelete={handleDelete}
                        handleOpen={handleOpen}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

function KanbanColumn({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{
                minWidth: 320,
                minHeight: 300,
                background: isOver ? "#e0f7fa" : "#fff",
                border: isOver ? "2px solid #1890ff" : "2px solid #e5e7eb",
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flex: 1,
                transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
            }}
        >
            <Title level={4} style={{ margin: 0, padding: '8px', textAlign: 'center', letterSpacing: 1 }}>{title}</Title>
            {children}
        </div>
    );
}

function KanbanCard({ id, medicine, handleDelete, handleOpen }: { id: string; medicine: Medicine; handleDelete: (id: string) => void; handleOpen: (medicine: Medicine) => void; }) {
    const { setNodeRef, listeners, attributes } = useDraggable({ id });
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                cursor: 'grab',
                marginBottom: 8,
            }}
        >
            <MedicineCard
                medicine={medicine}
                handleDelete={handleDelete}
                handleOpen={handleOpen}
            />
        </div>
    );
} 