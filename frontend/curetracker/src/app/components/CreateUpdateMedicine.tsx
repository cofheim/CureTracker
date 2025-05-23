import { MedicineRequest, MedicineType, Status, IntakeFrequency } from "@/services/medicines";
import { Medicine } from "@/app/models/Medicine";
import { Input, Modal, Typography, DatePicker, InputNumber, Select } from "antd";
import { useEffect, useState } from "react";
import { getMedicineTypeLabel, getStatusLabel, getIntakeFrequencyLabel } from "@/utils/enumLocalization";

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
    const [timeOfTaking, setTimeOfTaking] = useState<Date>();
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
        setTimeOfTaking(values.timeOfTaking)
        setStartDate(values.startDate)
        setEndDate(values.endDate)
        setType(values.type as MedicineType)
        setStatus(values.status as Status)
        setIntakeFrequency(values.intakeFrequency as IntakeFrequency)
    }, [values])

    const handleOnOk = async () => {
        const medicineRequest = {
            name,
            description,
            dosagePerTake,
            storageConditions,
            timesADay,
            timeOfTaking: timeOfTaking || new Date(),
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
                    onChange={(value) => setTimesADay(value || 0)}
                    placeholder="Сколько раз в день"
                    min={0}
                />

                <DatePicker
                    onChange={(date) => setTimeOfTaking(date?.toDate())}
                    placeholder="Время приема"
                    mode="time"
                    format="HH:mm"
                    showTime={{ format: 'HH:mm' }}
                />

                <DatePicker
                    onChange={(date) => setStartDate(date?.toDate())}
                    placeholder="Дата начала"
                />

                <DatePicker
                    onChange={(date) => setEndDate(date?.toDate())}
                    placeholder="Дата окончания"
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