"use client";

import { Button, Typography } from "antd";
import { Medicines } from "../components/Medicines";
import { useEffect, useState } from "react";
import { createMedicine, deleteMedicine, getAllMedicines, MedicineRequest, updateMedicine } from "@/services/medicines";
import Title from "antd/es/typography/Title";
import { Medicine } from "../models/Medicine";
import { CreateUpdateMedicine, Mode } from "../components/CreateUpdateMedicine";
import { MedicineType, Status, IntakeFrequency } from "@/services/medicines";

export default function MedicinesPage() {

    const defaulValues = {
        name: "",
        description: "",
        dosagePerTake: 0,
        storageConditions: "",
        timesADay: 0,
        timeOfTaking: new Date(),
        startDate: new Date(),
        endDate: new Date(),
        type: MedicineType.Other,
        status: Status.Planned,
        intakeFrequency: IntakeFrequency.Daily
    } as Medicine;

    const [values, setValues] = useState<Medicine>(defaulValues);

    const [loading, setLoading] = useState(true);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState(Mode.Create);

    const handleCreateMedicine = async (request: MedicineRequest) => {
        await createMedicine(request);
        closeModal();

        const medicines = await getAllMedicines();
        setMedicines(medicines);
    }

    const handleUpdateMedicine = async(id:string, request: MedicineRequest) => {
        await updateMedicine(id, request);
        closeModal();

        const medicines = await getAllMedicines();
        setMedicines(medicines);
    };

    const handleDeleteMedicine = async(id: string) => {
        await deleteMedicine(id);
        closeModal();

        const medicines = await getAllMedicines();
        setMedicines(medicines);
    };

    const openEditModal =(medicine: Medicine) => {
        setMode: (Mode.Edit);
        setValues(medicine);
        setIsModalOpen(true);
    };

    const openModal = () => {
        setMode(Mode.Create);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setValues(defaulValues)
        setIsModalOpen(false);
    };

    useEffect(() => {
        const getMedicines = async () => {
            const medicines = await getAllMedicines();
            setLoading(false);
            setMedicines(medicines);
        };
        getMedicines();
    }, []);

    return (
        <div>
            <Button>Add medicine</Button>

            <CreateUpdateMedicine 
            mode={mode} 
            values={values} 
            isModalOpen={isModalOpen} 
            handleCreate={handleCreateMedicine} 
            handleUpdate={handleUpdateMedicine}
            handleCancel={closeModal}
            />

            {loading ? (<Title>Loading...</Title>) : <Medicines 
                medicines={medicines}
                handleOpen={openEditModal}
                handleDelete={handleDeleteMedicine}
            />}
            
        </div>
    );
}
