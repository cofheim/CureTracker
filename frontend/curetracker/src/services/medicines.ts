import { exportPages } from "next/dist/export/worker";
import { Medicine } from "@/app/models/Medicine";

export enum MedicineType {
    Capsule = "Capsule",
    Tablet = "Tablet",
    Liquid = "Liquid",
    Injection = "Injection",
    Powder = "Powder",
    Other = "Other"
}

export enum Status {
    Planned = "Planned",
    InProgress = "InProgress",
    Taken = "Taken",
    Missed = "Missed",
    Skipped = "Skipped"
}

export enum IntakeFrequency {
    Daily = "Daily",
    Weekly = "Weekly",
    Monthly = "Monthly"
}

export interface MedicineRequest {
    name: string;
    description: string;
    dosagePerTake: number;
    storageConditions: string;
    timesADay: number;
    timesOfTaking: Date[];
    startDate: Date;
    endDate: Date;
    type: MedicineType;
    status: Status;
    intakeFrequency: IntakeFrequency;
}

export interface TakeDoseRequest {
    intakeTime: Date;
}

export const getAllMedicines = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("https://localhost:7210/Medicine", {
        headers: {
            "Authorization": "Bearer " + token,
        },
    });
    return response.json();
};

export const createMedicine = async(medicineRequest: MedicineRequest) => {
    const token = localStorage.getItem("token");
    await fetch("https://localhost:7210/Medicine", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": "Bearer " + token,
        },
        body: JSON.stringify(medicineRequest),
    });
};

export const updateMedicine = async (id: string, medicineRequest: MedicineRequest) => {
    const token = localStorage.getItem("token");
    await fetch(`https://localhost:7210/Medicine/${id}`, {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            "Authorization": "Bearer " + token,
        },
        body: JSON.stringify(medicineRequest),
    });
};

export const deleteMedicine = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`https://localhost:7210/Medicine/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token,
        },
    });
};

export const takeDose = async (medicineId: string, intakeTime: Date) => {
    const token = localStorage.getItem("token");
    
    // Преобразуем дату в ISO формат для обеспечения правильной передачи
    const formattedIntakeTime = new Date(intakeTime).toISOString();
    
    const response = await fetch(`https://localhost:7210/Medicine/${medicineId}/TakeDose`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ intakeTime: formattedIntakeTime }),
    });
    
    // Если ответ не OK, выведем информацию об ошибке
    if (!response.ok) {
        console.error("Ошибка при приеме дозы:", await response.text());
    }
    
    return response.ok;
};

export const skipDose = async (medicineId: string, intakeTime: Date) => {
    const token = localStorage.getItem("token");
    
    // Преобразуем дату в ISO формат для обеспечения правильной передачи
    const formattedIntakeTime = new Date(intakeTime).toISOString();
    
    const response = await fetch(`https://localhost:7210/Medicine/${medicineId}/SkipDose`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ intakeTime: formattedIntakeTime }),
    });
    
    // Если ответ не OK, выведем информацию об ошибке
    if (!response.ok) {
        console.error("Ошибка при пропуске дозы:", await response.text());
    }
    
    return response.ok;
};