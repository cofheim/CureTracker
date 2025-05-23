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
    timeOfTaking: Date;
    startDate: Date;
    endDate: Date;
    type: MedicineType;
    status: Status;
    intakeFrequency: IntakeFrequency;
}

export const getAllMedicines = async () => {
    const response = await fetch("https://localhost:7210/Medicine");

    return response.json();
};

export const createMedicine = async(medicineRequest: MedicineRequest) => {
    await fetch("https://localhost:7210/Medicine", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(medicineRequest),
    });
};

export const updateMedicine = async (id: string, medicineRequest: MedicineRequest) => {
    await fetch(`https://localhost:7210/Medicine/${id}`, {
        method: "PUT",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(medicineRequest),
    });
};

export const deleteMedicine = async (id: string) => {
    await fetch(`https://localhost:7210/Medicine/${id}`, {
        method: "DELETE",
    });
};