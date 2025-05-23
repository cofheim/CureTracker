import { MedicineRequest, MedicineType, Status, IntakeFrequency } from "@/services/medicines";
import { Medicine } from "@/app/models/Medicine";
import { Input, Modal, Typography, DatePicker, InputNumber, Select, Space, TimePicker } from "antd";
import { useEffect, useState } from "react";
import { getMedicineTypeLabel, getStatusLabel, getIntakeFrequencyLabel } from "@/utils/enumLocalization";
import dayjs from 'dayjs';

interface Props {
    mode: Mode;
    values: Medicine;
    isModalOpen: boolean;
    handleCancel: () => void;
    handleCreate: (request: MedicineRequest) => void;
    handleUpdate: (id: string, request: MedicineRequest) => void;
}

export enum Mode {
    Create,
    Edit,
}

export const CreateUpdateMedicine = ({
    mode,
    values,
    isModalOpen,
    handleCancel,
    handleCreate,
    handleUpdate
}: Props) => {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [dosagePerTake, setDosagePerTake] = useState<number>(0);
    const [storageConditions, setStorageConditions] = useState<string>("");
    const [timesADay, setTimesADay] = useState<number>(0);
    const [timesOfTaking, setTimesOfTaking] = useState<Date[]>([]);
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [type, setType] = useState<MedicineType>(MedicineType.Other);
    const [status, setStatus] = useState<Status>(Status.Planned);
    const [intakeFrequency, setIntakeFrequency] = useState<IntakeFrequency>(IntakeFrequency.Daily);

    useEffect(() => {
        setName(values.name)
        setDescription(values.description)
        setDosagePerTake(values.dosagePerTake)
        setStorageConditions(values.storageConditions)
        setTimesADay(values.timesADay)
        setTimesOfTaking(values.timesOfTaking || [])
        setStartDate(values.startDate)
        setEndDate(values.endDate)
        setType(values.type as MedicineType)
        setStatus(values.status as Status)
        setIntakeFrequency(values.intakeFrequency as IntakeFrequency)
    }, [values])

    // Обработчик изменения количества приёмов в день
    const handleTimesADayChange = (value: number | null) => {
        const newTimesADay = value || 0;
        setTimesADay(newTimesADay);
        
        // Обновляем массив времён приёма
        if (newTimesADay > timesOfTaking.length) {
            // Добавляем новые слоты для времени
            setTimesOfTaking([
                ...timesOfTaking,
                ...Array(newTimesADay - timesOfTaking.length).fill(new Date())
            ]);
        } else {
            // Удаляем лишние слоты
            setTimesOfTaking(timesOfTaking.slice(0, newTimesADay));
        }
    };

    // Обработчик изменения времени приёма
    const handleTimeChange = (index: number, date: dayjs.Dayjs | null) => {
        if (date) {
            const newTimes = [...timesOfTaking];
            newTimes[index] = date.toDate();
            setTimesOfTaking(newTimes);
        }
    };

    const handleOnOk = async () => {
        // Проверяем, что все времена приёма установлены
        if (timesOfTaking.length !== timesADay) {
            alert("Пожалуйста, установите все времена приёма");
            return;
        }

        const medicineRequest = {
            name,
            description,
            dosagePerTake,
            storageConditions,
            timesADay,
            timesOfTaking,
            startDate: startDate || new Date(),
            endDate: endDate || new Date(),
            type,
            status,
            intakeFrequency
        };

        mode == Mode.Create ? handleCreate(medicineRequest) : handleUpdate(values.id, medicineRequest)
    };

    return (
        <Modal 
            title={mode === Mode.Create ? "Добавить лекарство" : "Редактировать лекарство"} 
            open={isModalOpen} 
            onCancel={handleCancel}
            onOk={handleOnOk}
            cancelText={"Отменить"}
            okText={"Сохранить"}
        >
            <div className="medicine__modal" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Название"
                    maxLength={50}
                />
                
                <Input.TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание"
                    maxLength={250}
                />

                <Typography.Text>Дозировка на один прием (например, 500 для 500мг)</Typography.Text>
                <InputNumber
                    value={dosagePerTake}
                    onChange={(value) => setDosagePerTake(value || 0)}
                    placeholder="Дозировка"
                    min={0}
                />

                <Input
                    value={storageConditions}
                    onChange={(e) => setStorageConditions(e.target.value)}
                    placeholder="Условия хранения"
                    maxLength={100}
                />

                <Typography.Text>Сколько раз в день принимать</Typography.Text>
                <InputNumber
                    value={timesADay}
                    onChange={handleTimesADayChange}
                    placeholder="Сколько раз в день"
                    min={0}
                />

                {timesADay > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Typography.Text>Времена приёма:</Typography.Text>
                        {Array.from({ length: timesADay }).map((_, index) => (
                            <TimePicker
                                key={index}
                                value={timesOfTaking[index] ? dayjs(timesOfTaking[index]) : null}
                                onChange={(time) => handleTimeChange(index, time)}
                                placeholder={`Время приёма ${index + 1}`}
                                format="HH:mm"
                                minuteStep={5}
                                hideDisabledOptions
                                use12Hours={false}
                            />
                        ))}
                    </div>
                )}

                <DatePicker
                    onChange={(date) => setStartDate(date?.toDate())}
                    placeholder="Дата начала"
                    value={startDate ? dayjs(startDate) : null}
                />

                <DatePicker
                    onChange={(date) => setEndDate(date?.toDate())}
                    placeholder="Дата окончания"
                    value={endDate ? dayjs(endDate) : null}
                />

                <Select
                    value={type}
                    onChange={setType}
                    placeholder="Тип"
                    options={Object.values(MedicineType).map(type => ({
                        value: type,
                        label: getMedicineTypeLabel(type)
                    }))}
                />

                <Select
                    value={status}
                    onChange={setStatus}
                    placeholder="Статус"
                    options={Object.values(Status).map(status => ({
                        value: status,
                        label: getStatusLabel(status)
                    }))}
                />

                <Select
                    value={intakeFrequency}
                    onChange={setIntakeFrequency}
                    placeholder="Частота приема"
                    options={Object.values(IntakeFrequency).map(frequency => ({
                        value: frequency,
                        label: getIntakeFrequencyLabel(frequency)
                    }))}
                />
            </div>
        </Modal>
    );
};