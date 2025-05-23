import { MedicineName } from "./MedicineName";
import Button from "antd/es/button/button";
import { Card, Modal, Typography } from "antd";
import { Medicine } from "../models/Medicine";
import { useState } from "react";
import { getMedicineTypeLabel, getStatusLabel, getIntakeFrequencyLabel } from "@/utils/enumLocalization";

const { Text } = Typography;

interface Props {
    medicines: Medicine[];
    handleDelete: (id:string) => void;
    handleOpen: (medicine: Medicine) => void;
}

export const Medicines = ({medicines, handleDelete, handleOpen} : Props) => {
    const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);

    const showDeleteConfirm = (medicine: Medicine) => {
        setMedicineToDelete(medicine);
    };

    const handleDeleteConfirm = () => {
        if (medicineToDelete) {
            handleDelete(medicineToDelete.id);
            setMedicineToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setMedicineToDelete(null);
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="cards">
            {medicines.map((medicine : Medicine) => (
                <Card 
                    key={medicine.id} 
                    title={<MedicineName name={medicine.name}/>} 
                    variant="borderless"
                >
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {medicine.description && (
                                <Text>
                                    <strong>Описание:</strong> {medicine.description}
                                </Text>
                            )}
                            <Text type="secondary">
                                <strong>Тип:</strong> {getMedicineTypeLabel(medicine.type)}
                            </Text>
                            <Text type="secondary">
                                <strong>Статус:</strong> {getStatusLabel(medicine.status)}
                            </Text>
                            <Text type="secondary">
                                <strong>Частота приема:</strong> {getIntakeFrequencyLabel(medicine.intakeFrequency)}
                            </Text>
                            <Text type="secondary">
                                <strong>Дозировка:</strong> {medicine.dosagePerTake} мг
                            </Text>
                            {medicine.storageConditions && (
                                <Text type="secondary">
                                    <strong>Условия хранения:</strong> {medicine.storageConditions}
                                </Text>
                            )}
                            <Text type="secondary">
                                <strong>Приемов в день:</strong> {medicine.timesADay}
                            </Text>
                            <Text type="secondary">
                                <strong>Время приема:</strong> {formatTime(medicine.timeOfTaking)}
                            </Text>
                            <Text type="secondary">
                                <strong>Дата начала:</strong> {formatDate(medicine.startDate)}
                            </Text>
                            <Text type="secondary">
                                <strong>Дата окончания:</strong> {formatDate(medicine.endDate)}
                            </Text>
                        </div>
                    </div>
                    <div className="card_buttons">
                        <Button 
                            onClick={() => handleOpen(medicine)}
                            style={{flex: 1}}
                        >
                            Редактировать
                        </Button>
                        <Button 
                            onClick={() => showDeleteConfirm(medicine)}
                            danger
                            style={{flex:1}}
                        >
                            Удалить
                        </Button>
                    </div>
                </Card>
            ))}

            <Modal
                title="Подтверждение удаления"
                open={medicineToDelete !== null}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
            >
                <p>Вы уверены, что хотите удалить лекарство &quot;{medicineToDelete?.name}&quot;?</p>
                <p>Это действие нельзя будет отменить.</p>
            </Modal>
        </div>
    );
}
