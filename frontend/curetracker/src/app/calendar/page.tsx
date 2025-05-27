'use client';

import { useState, useEffect } from "react";
import { Typography, Spin } from "antd";
import { MedicineCalendar } from "../components/MedicineCalendar";
import { getAllMedicines, takeDose, skipDose, Status } from "@/services/medicines";
import { Medicine as MedicineModel } from "@/app/models/Medicine";
import { calculateCourseDetails } from "@/utils/courseUtils";

const { Title } = Typography;

interface EnrichedMedicine extends MedicineModel {
  totalDosesInCourse: number;
  takenDosesInCourse: number;
  skippedDosesCount?: number;
  todaysIntakes: Array<{ time: Date, plannedTime: string, status: 'planned' | 'taken' | 'missed' | 'skipped' }>;
}

export default function CalendarPage() {
  const [medicines, setMedicines] = useState<EnrichedMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicine, setSelectedMedicine] = useState<EnrichedMedicine | null>(null);

  const processMedicines = (medicinesToProcess: MedicineModel[]): EnrichedMedicine[] => {
    return medicinesToProcess.map(med => {
      const details = calculateCourseDetails(med);
      
      // Автоматически определяем статус на основе дат
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      const startDate = new Date(med.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(med.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      let status = Status.Planned;
      
      if (currentDate > endDate) {
        status = Status.Taken; // Курс завершен
      } else if (currentDate >= startDate && currentDate <= endDate) {
        status = Status.InProgress; // Курс в процессе
      }
      
      return {
        ...med,
        status,
        key: med.id,
        totalDosesInCourse: details.totalDosesInCourse,
        todaysIntakes: details.todaysIntakes,
        takenDosesInCourse: med.takenDosesCount || 0,
        skippedDosesCount: med.skippedDosesCount || 0
      };
    });
  };

  const getMedicinesList = async () => {
    try {
      setLoading(true);
      const rawMedicines = await getAllMedicines();
      setMedicines(processMedicines(rawMedicines));
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMedicinesList();
  }, []);

  const handleTakeDose = async (medicineId: string, intakeTime: Date) => {
    try {
      await takeDose(medicineId, intakeTime);
      
      // Update the local state to reflect the change
      setMedicines(prevMedicines =>
        prevMedicines.map(med => {
          if (med.id === medicineId) {
            const updatedMed = { ...med };
            
            // Update todaysIntakes to mark this dose as taken
            if (updatedMed.todaysIntakes) {
              updatedMed.todaysIntakes = updatedMed.todaysIntakes.map(intake => {
                const intakeTimeDate = new Date(intake.time);
                const compareTime = new Date(intakeTime);
                
                // Check if this is the intake we're updating
                if (
                  intakeTimeDate.getHours() === compareTime.getHours() &&
                  intakeTimeDate.getMinutes() === compareTime.getMinutes()
                ) {
                  return { ...intake, status: 'taken' };
                }
                return intake;
              });
            }
            
            return updatedMed;
          }
          return med;
        })
      );
    } catch (error) {
      console.error("Error taking dose:", error);
    }
  };

  const handleSkipDose = async (medicineId: string, intakeTime: Date) => {
    try {
      await skipDose(medicineId, intakeTime);
      
      // Update the local state to reflect the change
      setMedicines(prevMedicines =>
        prevMedicines.map(med => {
          if (med.id === medicineId) {
            const updatedMed = { ...med };
            
            // Update todaysIntakes to mark this dose as skipped
            if (updatedMed.todaysIntakes) {
              updatedMed.todaysIntakes = updatedMed.todaysIntakes.map(intake => {
                const intakeTimeDate = new Date(intake.time);
                const compareTime = new Date(intakeTime);
                
                // Check if this is the intake we're updating
                if (
                  intakeTimeDate.getHours() === compareTime.getHours() &&
                  intakeTimeDate.getMinutes() === compareTime.getMinutes()
                ) {
                  return { ...intake, status: 'skipped' };
                }
                return intake;
              });
            }
            
            return updatedMed;
          }
          return med;
        })
      );
    } catch (error) {
      console.error("Error skipping dose:", error);
    }
  };

  const handleOpen = (medicine: EnrichedMedicine) => {
    setSelectedMedicine(medicine);
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>Календарь приёма лекарств</Title>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <MedicineCalendar 
          medicines={medicines as unknown as MedicineModel[]}
          handleTakeDose={handleTakeDose}
          handleSkipDose={handleSkipDose}
          handleOpen={(medicine) => handleOpen(medicine as unknown as EnrichedMedicine)}
        />
      )}
    </div>
  );
} 