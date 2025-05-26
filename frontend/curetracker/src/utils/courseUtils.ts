import { Medicine } from "../app/models/Medicine";
import { IntakeFrequency } from "@/services/medicines";

interface TodaysIntake {
    time: Date; // Полная дата и время сегодняшнего приема
    plannedTime: string; // Исходное время из timesOfTaking (например, "09:00")
    status: 'planned' | 'taken' | 'missed';
}

interface CourseDetails {
    totalDosesInCourse: number;
    todaysIntakes: TodaysIntake[];
}

// Вспомогательная функция для получения количества дней между двумя датами
const getDaysBetween = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0); // Нормализуем время для корректного сравнения дат
    end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Включая начальный и конечный день
};

export const calculateCourseDetails = (medicine: Medicine): CourseDetails => {
    let totalDosesInCourse = 0;
    const courseDurationDays = getDaysBetween(medicine.startDate, medicine.endDate);

    if (courseDurationDays < 0) { // Если дата окончания раньше даты начала
        return { totalDosesInCourse: 0, todaysIntakes: [] };
    }

    switch (medicine.intakeFrequency) {
        case IntakeFrequency.Daily:
            totalDosesInCourse = courseDurationDays * medicine.timesADay;
            break;
        case IntakeFrequency.Weekly:
            totalDosesInCourse = Math.ceil(courseDurationDays / 7) * medicine.timesADay;
            break;
        case IntakeFrequency.Monthly:
            totalDosesInCourse = Math.ceil(courseDurationDays / 30) * medicine.timesADay; 
            break;
        default:
            totalDosesInCourse = 0; 
            break;
    }

    const todaysIntakes: TodaysIntake[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    const medicineStartDate = new Date(medicine.startDate);
    medicineStartDate.setHours(0,0,0,0);
    const medicineEndDate = new Date(medicine.endDate);
    medicineEndDate.setHours(0,0,0,0);

    // Проверяем, активен ли курс сегодня
    if (today >= medicineStartDate && today <= medicineEndDate) {
        medicine.timesOfTaking.forEach((intakeTime: Date) => {
            // intakeTime - это Date объект, но нам интересно только время
            // Создаем новый Date объект для сегодняшнего дня с временем из intakeTime
            const todayIntakeDate = new Date(); // Сегодняшняя дата
            const time = new Date(intakeTime); // Время из timesOfTaking
            
            todayIntakeDate.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
            
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const plannedTimeStr = `${hours}:${minutes}`;

            todaysIntakes.push({
                time: todayIntakeDate,
                plannedTime: plannedTimeStr,
                status: 'planned',
            });
        });
        // Сортируем приемы по времени
        todaysIntakes.sort((a, b) => a.time.getTime() - b.time.getTime());
    }

    return {
        totalDosesInCourse: Math.max(0, totalDosesInCourse), // Убедимся, что не отрицательное
        todaysIntakes,
    };
}; 