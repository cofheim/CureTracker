"use client";

import { Button, Typography } from "antd";
import { useEffect, useState } from "react";
import { createMedicine, deleteMedicine, getAllMedicines, MedicineRequest, updateMedicine } from "@/services/medicines";
import Title from "antd/es/typography/Title";
import { Medicine } from "../models/Medicine";
import { CreateUpdateMedicine, Mode } from "../components/CreateUpdateMedicine";
import { MedicineType, Status, IntakeFrequency } from "@/services/medicines";
import AuthFormSwitcher from "../components/AuthFormSwitcher";
import { MedicineKanban } from "../components/MedicineKanban";

export default function MedicinesPage() {
    const [isAuth, setIsAuth] = useState(false);

    const defaulValues: Medicine = {
        id: "",
        name: "",
        description: "",
        dosagePerTake: 0,
        storageConditions: "",
        timesADay: 0,
        timesOfTaking: [],
        startDate: new Date(),
        endDate: new Date(),
        type: MedicineType.Other,
        status: Status.Planned,
        intakeFrequency: IntakeFrequency.Daily
    };

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

    const handleStatusChange = async (id: string, newStatus: Status) => {
        
        setMedicines(prev =>
            prev.map(med =>
                med.id === id ? { ...med, status: newStatus } : med
            )
        );

        
        const medicine = medicines.find(m => m.id === id);
        if (!medicine) return;

        const request: MedicineRequest = {
            name: medicine.name,
            description: medicine.description,
            dosagePerTake: medicine.dosagePerTake,
            storageConditions: medicine.storageConditions,
            timesADay: medicine.timesADay,
            timesOfTaking: medicine.timesOfTaking,
            startDate: medicine.startDate,
            endDate: medicine.endDate,
            type: medicine.type,
            status: newStatus,
            intakeFrequency: medicine.intakeFrequency
        };

        await handleUpdateMedicine(id, request);
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
        <div style={{ 
            position: 'relative', 
            minHeight: '100vh',
            padding: '16px'
        }}>
            <Button 
                onClick={handleLogout} 
                style={{ 
                    position: 'absolute',
                    top: '16px',
                    right: '16px'
                }}
            >
                Выйти
            </Button>
            
            {medicines.length === 0 && !loading ? (
                <div style={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <Button 
                        onClick={openModal} 
                        type="primary" 
                        size="large"
                        style={{ 
                            padding: '0 40px',
                            height: '64px',
                            fontSize: '16px'
                        }}
                    >
                        Добавить лекарство
                    </Button>
                </div>
            ) : (
                <div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        marginBottom: 24 
                    }}>
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
                            Добавить лекарство
                        </Button>
                    </div>

                    {loading ? (
                        <div style={{ 
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center'
                        }}>
                            <Title>Загрузка...</Title>
                        </div>
                    ) : (
                        <MedicineKanban
                            medicines={medicines}
                            handleOpen={openEditModal}
                            handleDelete={handleDeleteMedicine}
                            handleStatusChange={handleStatusChange}
                        />
                    )}
                </div>
            )}

            <CreateUpdateMedicine
                mode={mode}
                values={values}
                isModalOpen={isModalOpen}
                handleCreate={handleCreateMedicine}
                handleUpdate={handleUpdateMedicine}
                handleCancel={closeModal}
            />
        </div>
    );
}
