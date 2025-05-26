"use client";

import { Button, Typography, Segmented } from "antd";
import { AppstoreOutlined, BarsOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { createMedicine, deleteMedicine, getAllMedicines, MedicineRequest, updateMedicine, takeDose, Status, IntakeFrequency } from "@/services/medicines";
import Title from "antd/es/typography/Title";
import { Medicine as MedicineModel } from "../models/Medicine";
import { CreateUpdateMedicine, Mode } from "../components/CreateUpdateMedicine";
import { MedicineType } from "@/services/medicines";
import { MedicineKanban } from "../components/MedicineKanban";
import { Medicines } from "../components/Medicines";
import { calculateCourseDetails } from "@/utils/courseUtils";

interface EnrichedMedicine extends MedicineModel {
    totalDosesInCourse: number;
    takenDosesInCourse: number;
    todaysIntakes: Array<{ time: Date, plannedTime: string, status: 'planned' | 'taken' | 'missed' }>;
}

export default function MedicinesPage() {
    const [view, setView] = useState<'list' | 'kanban'>('list');

    const defaulValues: MedicineModel = {
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

    const [values, setValues] = useState<MedicineModel>(defaulValues);
    const [loading, setLoading] = useState(true);
    const [medicines, setMedicines] = useState<EnrichedMedicine[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState(Mode.Create);

    const processMedicines = (medicinesToProcess: MedicineModel[]): EnrichedMedicine[] => {
        console.log('Raw medicines from API:', medicinesToProcess);
        return medicinesToProcess.map(med => {
            const details = calculateCourseDetails(med);
            return {
                ...med,
                totalDosesInCourse: details.totalDosesInCourse,
                todaysIntakes: details.todaysIntakes,
                takenDosesInCourse: med.takenDosesCount || 0 
            };
        });
    };

    useEffect(() => {
        const getMedicinesList = async () => {
            setLoading(true);
            const rawMedicines = await getAllMedicines();
            setMedicines(processMedicines(rawMedicines));
            setLoading(false);
        };
        getMedicinesList();
    }, []);

    const refreshMedicines = async () => {
        setLoading(true);
        const rawMedicines = await getAllMedicines();
        setMedicines(processMedicines(rawMedicines));
        setLoading(false);
    }

    const handleCreateMedicine = async (request: MedicineRequest) => {
        await createMedicine(request);
        closeModal();
        refreshMedicines();
    };

    const handleUpdateMedicine = async (id: string, request: MedicineRequest) => {
        await updateMedicine(id, request);
        closeModal();
        refreshMedicines();
    };

    const handleDeleteMedicine = async (id: string) => {
        await deleteMedicine(id);
        closeModal();
        refreshMedicines();
    };

    const handleTakeDose = async (medicineId: string, intakeTimeToMark: Date) => {
        const success = await takeDose(medicineId, intakeTimeToMark);
        
        if (success) {
            setMedicines(prevMedicines => 
                prevMedicines.map(med => {
                    if (med.id === medicineId) {
                        const newTodaysIntakes = med.todaysIntakes.map(intake => {
                            if (intake.time.getTime() === intakeTimeToMark.getTime() && intake.status === 'planned') {
                                return { ...intake, status: 'taken' as 'taken' };
                            }
                            return intake;
                        });
                        return { 
                            ...med, 
                            todaysIntakes: newTodaysIntakes,
                        };
                    }
                    return med;
                })
            );
            
            await refreshMedicines();
        }
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

    const openEditModal = (medicine: MedicineModel) => {
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
        window.location.href = "/";
    };

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
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: 24 
                    }}>
                        <Button 
                            onClick={openModal} 
                            type="primary" 
                            size="large"
                            style={{ 
                                height: '48px',
                                fontSize: '16px'
                            }}
                        >
                            Добавить лекарство
                        </Button>
                        <Segmented
                            options={[
                                { label: 'Список', value: 'list', icon: <BarsOutlined /> },
                                { label: 'Канбан', value: 'kanban', icon: <AppstoreOutlined /> },
                            ]}
                            value={view}
                            onChange={(value) => setView(value as 'list' | 'kanban')}
                        />
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
                        <>
                            {view === 'list' && (
                                <Medicines
                                    medicines={medicines}
                                    handleDelete={handleDeleteMedicine}
                                    handleOpen={openEditModal}
                                    handleTakeDose={handleTakeDose}
                                />
                            )}
                            {view === 'kanban' && (
                                <MedicineKanban
                                    medicines={medicines}
                                    handleOpen={openEditModal}
                                    handleDelete={handleDeleteMedicine}
                                    handleStatusChange={handleStatusChange}
                                />
                            )}
                        </>
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
