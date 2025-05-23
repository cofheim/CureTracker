import { MedicineType, Status, IntakeFrequency } from "@/services/medicines";

export const getMedicineTypeLabel = (type: MedicineType): string => {
    const labels: Record<MedicineType, string> = {
        [MedicineType.Capsule]: "Капсула",
        [MedicineType.Tablet]: "Таблетка",
        [MedicineType.Liquid]: "Жидкость",
        [MedicineType.Injection]: "Инъекция",
        [MedicineType.Powder]: "Порошок",
        [MedicineType.Other]: "Другое"
    };
    return labels[type];
};

export const getStatusLabel = (status: Status): string => {
    const labels: Record<Status, string> = {
        [Status.Planned]: "Запланировано",
        [Status.InProgress]: "В процессе",
        [Status.Taken]: "Принято",
        [Status.Missed]: "Пропущено",
        [Status.Skipped]: "Пропущено намеренно"
    };
    return labels[status];
};

export const getIntakeFrequencyLabel = (frequency: IntakeFrequency): string => {
    const labels: Record<IntakeFrequency, string> = {
        [IntakeFrequency.Daily]: "Ежедневно",
        [IntakeFrequency.Weekly]: "Еженедельно",
        [IntakeFrequency.Monthly]: "Ежемесячно"
    };
    return labels[frequency];
}; 