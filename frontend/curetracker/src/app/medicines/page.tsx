"use client";

import { Button, Typography } from "antd";
import { Medicines } from "../components/Medicines";
import { useEffect, useState } from "react";
import { createMedicine, deleteMedicine, getAllMedicines, MedicineRequest, updateMedicine } from "@/services/medicines";
import Title from "antd/es/typography/Title";
import { Medicine } from "../models/Medicine";
import { CreateUpdateMedicine, Mode } from "../components/CreateUpdateMedicine";
import { MedicineType, Status, IntakeFrequency } from "@/services/medicines";
import AuthFormSwitcher from "../components/AuthFormSwitcher";

export default function MedicinesPage() {
    const [isAuth, setIsAuth] = useState(false);

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

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuth(!!token);
    }, []);

    useEffect(() => {
        if (!isAuth) return;
        const getMedicinesList = async () => {
            setLoading(true);
            const medicines = await getAllMedicines();
            setMedicines(medicines);
            setLoading(false);
        };
        getMedicinesList();
    }, [isAuth]);

    const handleCreateMedicine = async (request: MedicineRequest) => {
        await createMedicine(request);
        closeModal();
        const medicines = await getAllMedicines();
        setMedicines(medicines);
    };

    const handleUpdateMedicine = async (id: string, request: MedicineRequest) => {
        await updateMedicine(id, request);
        closeModal();
        const medicines = await getAllMedicines();
        setMedicines(medicines);
    };

    const handleDeleteMedicine = async (id: string) => {
        await deleteMedicine(id);
        closeModal();
        const medicines = await getAllMedicines();
        setMedicines(medicines);
    };

    const openEditModal = (medicine: Medicine) => {
        setMode(Mode.Edit);
        setValues(medicine);
        setIsModalOpen(true);
    };

    const openModal = () => {
        setMode(Mode.Create);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setValues(defaulValues);
        setIsModalOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuth(false);
    };

    if (!isAuth) {
        return <AuthFormSwitcher onAuth={() => setIsAuth(true)} />;
    }

    return (
        <div>
            <Button onClick={handleLogout} style={{ float: "right", marginBottom: 16 }}>
                Выйти
            </Button>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <Button 
                    onClick={openModal} 
                    type="primary" 
                    size="large"
                    style={{ 
                        padding: '0 40px',
                        height: '48px',
                        fontSize: '16px'
                    }}
                >
                    Add medicine
                </Button>
            </div>

            <CreateUpdateMedicine
                mode={mode}
                values={values}
                isModalOpen={isModalOpen}
                handleCreate={handleCreateMedicine}
                handleUpdate={handleUpdateMedicine}
                handleCancel={closeModal}
            />

            {loading ? (
                <Title>Loading...</Title>
            ) : (
                <Medicines
                    medicines={medicines}
                    handleOpen={openEditModal}
                    handleDelete={handleDeleteMedicine}
                />
            )}
        </div>
    );
}
