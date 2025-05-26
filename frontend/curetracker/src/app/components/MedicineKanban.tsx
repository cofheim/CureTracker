"use client";

import { Medicine } from "../models/Medicine";
import { Status } from "@/services/medicines";
import { Typography } from "antd";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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

const DraggableCard = ({ medicine, handleDelete, handleOpen }: { 
    medicine: Medicine; 
    handleDelete: (id: string) => void; 
    handleOpen: (medicine: Medicine) => void;
}) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'MEDICINE',
        item: { id: medicine.id, status: medicine.status },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={node => { drag(node); }}
            style={{
                opacity: isDragging ? 0.5 : 1,
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
};

const DroppableColumn = ({ 
    status, 
    title, 
    medicines, 
    handleDelete, 
    handleOpen, 
    handleStatusChange 
}: { 
    status: Status; 
    title: string; 
    medicines: Medicine[]; 
    handleDelete: (id: string) => void; 
    handleOpen: (medicine: Medicine) => void;
    handleStatusChange: (id: string, newStatus: Status) => void;
}) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'MEDICINE',
        drop: (item: { id: string, status: Status }) => {
            if (item.status !== status) {
                handleStatusChange(item.id, status);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={node => { drop(node); }}
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
            <div style={{
                position: 'relative',
                zIndex: 999,
                background: '#fff',
                padding: '8px',
                borderRadius: '8px 8px 0 0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
                <Title level={4} style={{ 
                    margin: 0, 
                    textAlign: 'center', 
                    letterSpacing: 1,
                }}>{title}</Title>
            </div>
            {medicines
                .filter((medicine) => medicine.status === status)
                .map((medicine) => (
                    <DraggableCard
                        key={medicine.id}
                        medicine={medicine}
                        handleDelete={handleDelete}
                        handleOpen={handleOpen}
                    />
                ))}
        </div>
    );
};

export const MedicineKanban = ({ medicines, handleDelete, handleOpen, handleStatusChange }: Props) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <div style={{
                display: 'flex',
                gap: '32px',
                padding: '32px 16px',
                overflowX: 'auto',
                minHeight: 'calc(100vh - 200px)',
                background: '#f7f8fa',
            }}>
                {columns.map((column) => (
                    <DroppableColumn
                        key={column.status}
                        status={column.status}
                        title={column.title}
                        medicines={medicines}
                        handleDelete={handleDelete}
                        handleOpen={handleOpen}
                        handleStatusChange={handleStatusChange}
                    />
                ))}
            </div>
        </DndProvider>
    );
}; 