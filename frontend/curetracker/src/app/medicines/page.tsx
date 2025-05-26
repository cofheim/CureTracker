"use client";

import { Button, Typography, Segmented } from "antd";
import { AppstoreOutlined, BarsOutlined, CalendarOutlined } from "@ant-design/icons";
import { useEffect, useState, useMemo } from "react";
import { createMedicine, deleteMedicine, getAllMedicines, MedicineRequest, updateMedicine, takeDose, skipDose, Status, IntakeFrequency } from "@/services/medicines";
import Title from "antd/es/typography/Title";
import { Medicine as MedicineModel } from "../models/Medicine";
import { CreateUpdateMedicine, Mode } from "../components/CreateUpdateMedicine";
import { MedicineType } from "@/services/medicines";
import { MedicineCalendar } from "../components/MedicineCalendar";
import { Medicines } from "../components/Medicines";
import { calculateCourseDetails } from "@/utils/courseUtils";
import { MedicineFilters, MedicineFilters as MedicineFiltersType } from "../components/MedicineFilters";
import dayjs from "dayjs";

interface EnrichedMedicine extends MedicineModel {
    totalDosesInCourse: number;
    takenDosesInCourse: number;
    skippedDosesCount?: number;
    todaysIntakes: Array<{ time: Date, plannedTime: string, status: 'planned' | 'taken' | 'missed' | 'skipped' }>;
}

export default function MedicinesPage() {
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [filters, setFilters] = useState<MedicineFiltersType>({
        searchQuery: '',
        status: null,
        dateRange: null
    });

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
                takenDosesInCourse: med.takenDosesCount || 0,
                skippedDosesCount: med.skippedDosesCount || 0
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
        try {
            console.log("Прием дозы для:", medicineId, "время:", intakeTimeToMark);
            const success = await takeDose(medicineId, intakeTimeToMark);
            
            if (success) {
                console.log("Доза успешно принята, обновляем UI");
                // Немедленно обновляем UI для реактивности
                setMedicines(prevMedicines => 
                    prevMedicines.map(med => {
                        if (med.id === medicineId) {
                            // Увеличиваем счетчик принятых доз
                            const takenDosesCount = (med.takenDosesCount || 0) + 1;
                            const takenDosesInCourse = (med.takenDosesInCourse || 0) + 1;
                            
                            const newTodaysIntakes = med.todaysIntakes.map(intake => {
                                if (new Date(intake.time).getTime() === new Date(intakeTimeToMark).getTime() && 
                                    intake.status === 'planned') {
                                    return { ...intake, status: 'taken' as 'taken' };
                                }
                                return intake;
                            });
                            
                            return { 
                                ...med, 
                                todaysIntakes: newTodaysIntakes,
                                takenDosesCount,
                                takenDosesInCourse
                            };
                        }
                        return med;
                    })
                );
                
                // Затем полное обновление с сервера
                await refreshMedicines();
            } else {
                console.error("Ошибка при приеме дозы");
            }
        } catch (error) {
            console.error("Ошибка при приеме дозы:", error);
        }
    };

    const handleSkipDose = async (medicineId: string, intakeTimeToMark: Date) => {
        try {
            console.log("Пропуск дозы для:", medicineId, "время:", intakeTimeToMark);
            const success = await skipDose(medicineId, intakeTimeToMark);
            
            if (success) {
                console.log("Доза успешно пропущена, обновляем UI");
                // Немедленно обновляем UI для реактивности
                setMedicines(prevMedicines => 
                    prevMedicines.map(med => {
                        if (med.id === medicineId) {
                            // Увеличиваем счетчик принятых доз и счетчик пропущенных доз
                            const takenDosesCount = (med.takenDosesCount || 0) + 1;
                            const takenDosesInCourse = (med.takenDosesInCourse || 0) + 1;
                            const skippedDosesCount = (med.skippedDosesCount || 0) + 1;
                            
                            const newTodaysIntakes = med.todaysIntakes.map(intake => {
                                if (new Date(intake.time).getTime() === new Date(intakeTimeToMark).getTime() && 
                                    intake.status === 'planned') {
                                    return { ...intake, status: 'skipped' as 'skipped' };
                                }
                                return intake;
                            });
                            
                            return { 
                                ...med, 
                                todaysIntakes: newTodaysIntakes,
                                takenDosesCount,
                                takenDosesInCourse,
                                skippedDosesCount
                            };
                        }
                        return med;
                    })
                );
                
                // Затем полное обновление с сервера
                await refreshMedicines();
            } else {
                console.error("Ошибка при пропуске дозы");
            }
        } catch (error) {
            console.error("Ошибка при пропуске дозы:", error);
        }
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

    const filteredMedicines = useMemo(() => {
        return medicines.filter(medicine => {
            if (filters.searchQuery && !medicine.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
                !medicine.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
                return false;
            }
            
            if (filters.status && medicine.status !== filters.status) {
                return false;
            }
            
            if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
                const startDate = dayjs(medicine.startDate);
                const endDate = dayjs(medicine.endDate);
                const filterStartDate = filters.dateRange[0];
                const filterEndDate = filters.dateRange[1];
                
                const periodsOverlap = 
                    (startDate.isBefore(filterEndDate) || startDate.isSame(filterEndDate, 'day')) &&
                    (endDate.isAfter(filterStartDate) || endDate.isSame(filterStartDate, 'day'));
                
                if (!periodsOverlap) {
                    return false;
                }
            }
            
            return true;
        });
    }, [medicines, filters]);

    const handleResetFilters = () => {
        setFilters({
            searchQuery: '',
            status: null,
            dateRange: null
        });
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
                                { label: 'Календарь', value: 'calendar', icon: <CalendarOutlined /> },
                            ]}
                            value={view}
                            onChange={(value) => setView(value as 'list' | 'calendar')}
                        />
                    </div>

                    {medicines.length > 0 && (
                        <>
                            <MedicineFilters 
                                filters={filters}
                                onFiltersChange={setFilters}
                                onResetFilters={handleResetFilters}
                            />
                            {(filters.searchQuery || filters.status || (filters.dateRange && filters.dateRange[0] && filters.dateRange[1])) && (
                                <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                                    <Typography.Text>
                                        Найдено лекарств: <strong>{filteredMedicines.length}</strong> из {medicines.length}
                                    </Typography.Text>
                                </div>
                            )}
                        </>
                    )}

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
                                    medicines={filteredMedicines}
                                    handleDelete={handleDeleteMedicine}
                                    handleOpen={openEditModal}
                                    handleTakeDose={handleTakeDose}
                                    handleSkipDose={handleSkipDose}
                                />
                            )}
                            {view === 'calendar' && (
                                <MedicineCalendar
                                    medicines={filteredMedicines}
                                    handleOpen={openEditModal}
                                    handleTakeDose={handleTakeDose}
                                    handleSkipDose={handleSkipDose}
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
