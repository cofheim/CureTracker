import { MedicineType, Status, IntakeFrequency } from "@/services/medicines";

export interface Medicine {
    id: string;
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
