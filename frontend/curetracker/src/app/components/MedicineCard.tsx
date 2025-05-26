import { Medicine } from "../models/Medicine";
import { Card, Typography, Button } from "antd";
import { MedicineName } from "./MedicineName";
import { getMedicineTypeLabel, getIntakeFrequencyLabel } from "@/utils/enumLocalization";
import { useDraggable } from "@dnd-kit/core";

const { Text } = Typography;

interface Props {
    medicine: Medicine;
    handleDelete: (id: string) => void;
    handleOpen: (medicine: Medicine) => void;
}

const MedicineCard = ({ medicine, handleDelete, handleOpen }: Props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
    } = useDraggable({ id: medicine.id });

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                cursor: 'grab',
                marginBottom: 8,
            }}
            {...attributes}
            {...listeners}
        >
            <Card
                title={<MedicineName name={medicine.name} />}
                size="small"
                style={{ marginBottom: '8px' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {medicine.description && (
                        <Text type="secondary" ellipsis>
                            {medicine.description}
                        </Text>
                    )}
                    <Text type="secondary">
                        <strong>Тип:</strong> {getMedicineTypeLabel(medicine.type)}
                    </Text>
                    <Text type="secondary">
                        <strong>Частота:</strong> {getIntakeFrequencyLabel(medicine.intakeFrequency)}
                    </Text>
                    <Text type="secondary">
                        <strong>Доза:</strong> {medicine.dosagePerTake} мг
                    </Text>
                    <Text type="secondary">
                        <strong>Приемов в день:</strong> {medicine.timesADay}
                    </Text>
                    <Text type="secondary">
                        <strong>Время приема:</strong> {medicine.timesOfTaking.map(time => formatTime(time)).join(', ')}
                    </Text>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px',
                    justifyContent: 'flex-end'
                }}>
                    <Button
                        size="small"
                        onClick={() => handleOpen(medicine)}
                    >
                        Редактировать
                    </Button>
                    <Button
                        size="small"
                        danger
                        onClick={() => handleDelete(medicine.id)}
                    >
                        Удалить
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default MedicineCard; 