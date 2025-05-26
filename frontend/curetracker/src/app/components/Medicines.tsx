import { MedicineName } from "./MedicineName";
import { Button, Card, Modal, Typography, Progress, Empty, Space } from "antd";
import { Medicine as MedicineModel } from "../models/Medicine";
import { useState } from "react";
import { getMedicineTypeLabel, getStatusLabel, getIntakeFrequencyLabel } from "@/utils/enumLocalization";

const { Text, Title } = Typography;

interface EnrichedMedicineClient extends MedicineModel {
    totalDosesInCourse: number;
    takenDosesInCourse: number;
    todaysIntakes: Array<{ time: Date, plannedTime: string, status: 'planned' | 'taken' | 'missed' | 'skipped' }>;
}

interface Props {
    medicines: EnrichedMedicineClient[];
    handleDelete: (id:string) => void;
    handleOpen: (medicine: MedicineModel) => void;
    handleTakeDose: (medicineId: string, intakeTime: Date) => void;
    handleSkipDose?: (medicineId: string, intakeTime: Date) => void;
}

export const Medicines = ({medicines, handleDelete, handleOpen, handleTakeDose, handleSkipDose} : Props) => {
    const [medicineToDelete, setMedicineToDelete] = useState<MedicineModel | null>(null);

    const showDeleteConfirm = (medicine: MedicineModel) => {
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
            {medicines.length === 0 ? (
                <div style={{ 
                    textAlign: 'center',
                    padding: '50px 0',
                    width: '100%' 
                }}>
                    <Empty 
                        description="Нет лекарств, соответствующих заданным фильтрам" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </div>
            ) : (
                medicines.map((medicine : EnrichedMedicineClient) => (
                    <Card 
                        key={medicine.id} 
                        title={<MedicineName name={medicine.name}/>} 
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
                                    <strong>Дата начала:</strong> {formatDate(new Date(medicine.startDate))}
                                </Text>
                                <Text type="secondary">
                                    <strong>Дата окончания:</strong> {formatDate(new Date(medicine.endDate))}
                                </Text>

                                {medicine.totalDosesInCourse > 0 && (
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={5} style={{ marginBottom: '8px' }}>Прогресс курса:</Title>
                                        <Progress 
                                            percent={Math.round((medicine.takenDosesInCourse / medicine.totalDosesInCourse) * 100)} 
                                            strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} 
                                        />
                                        <Text type="secondary" style={{ display: 'block', textAlign: 'right' }}>
                                            Принято {medicine.takenDosesInCourse} из {medicine.totalDosesInCourse}
                                        </Text>
                                    </div>
                                )}

                                {medicine.todaysIntakes && medicine.todaysIntakes.length > 0 && (
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={5} style={{ marginBottom: '8px' }}>Сегодняшние приемы:</Title>
                                        {medicine.todaysIntakes.map((intake, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 0',
                                                borderBottom: index < medicine.todaysIntakes.length - 1 ? '1px solid #f0f0f0' : 'none'
                                            }}>
                                                <Text style={{ textDecoration: intake.status === 'taken' || intake.status === 'skipped' ? 'line-through' : 'none' }}>
                                                    {intake.plannedTime}
                                                </Text>
                                                {intake.status === 'planned' && (
                                                    <Space>
                                                        <Button 
                                                            size="small" 
                                                            type="primary" 
                                                            onClick={() => handleTakeDose(medicine.id, intake.time)}
                                                            disabled={medicine.takenDosesInCourse >= medicine.totalDosesInCourse}
                                                            title={medicine.takenDosesInCourse >= medicine.totalDosesInCourse ? 
                                                                "Курс лекарства завершен" : ""}
                                                        >
                                                            Принять
                                                        </Button>
                                                        {handleSkipDose && (
                                                            <Button 
                                                                size="small"
                                                                danger
                                                                onClick={() => handleSkipDose(medicine.id, intake.time)}
                                                                disabled={medicine.takenDosesInCourse >= medicine.totalDosesInCourse}
                                                                title={medicine.takenDosesInCourse >= medicine.totalDosesInCourse ? 
                                                                    "Курс лекарства завершен" : ""}
                                                            >
                                                                Пропустить
                                                            </Button>
                                                        )}
                                                    </Space>
                                                )}
                                                {intake.status === 'taken' && (
                                                    <Text type="success">Принято ✔</Text>
                                                )}
                                                {intake.status === 'skipped' && (
                                                    <Text type="warning">Пропущено ⊘</Text>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {medicine.todaysIntakes && medicine.todaysIntakes.length === 0 && medicine.totalDosesInCourse > 0 && (
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={5} style={{ marginBottom: '8px' }}>Сегодняшние приемы:</Title>
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="На сегодня приемов нет" />
                                    </div>
                                )}
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
                ))
            )}

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
