﻿using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;

namespace CureTracker.Application.Services
{
    public class IntakeService : IIntakeService
    {
        private readonly IIntakeRepository _intakeRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly IActionLogService _actionLogService;

        public IntakeService(
            IIntakeRepository intakeRepository,
            ICourseRepository courseRepository,
            IActionLogService actionLogService)
        {
            _intakeRepository = intakeRepository;
            _courseRepository = courseRepository;
            _actionLogService = actionLogService;
        }

        public async Task<List<Intake>> GetIntakesForCourseAsync(Guid courseId, Guid userId)
        {
            // Проверяем доступ к курсу
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null || course.UserId != userId)
                throw new UnauthorizedAccessException("У вас нет прав на просмотр этого курса");

            return await _intakeRepository.GetAllByCourseIdAsync(courseId);
        }

        public async Task<Intake?> GetIntakeByIdAsync(Guid intakeId, Guid userId)
        {
            var intake = await _intakeRepository.GetByIdAsync(intakeId);

            // Проверка доступа - пользователь может получить только свои приёмы
            if (intake == null || intake.UserId != userId)
                return null;

            return intake;
        }

        public async Task<Intake> MarkIntakeAsTakenAsync(Guid intakeId, Guid userId)
        {
            var intake = await _intakeRepository.GetByIdAsync(intakeId);
            if (intake == null || intake.UserId != userId)
                throw new UnauthorizedAccessException("У вас нет прав на изменение этого приёма");

            // Отмечаем приём как принятый
            intake.MarkAsTaken(DateTime.UtcNow);
            var updatedIntake = await _intakeRepository.UpdateAsync(intake);

            // Обновляем статистику курса
            var course = await _courseRepository.GetByIdAsync(intake.CourseId);
            if (course != null)
            {
                // Увеличиваем счетчик принятых доз
                var updatedCourse = new Course(
                    course.Id,
                    course.Name,
                    course.Description,
                    course.TimesADay,
                    course.TimesOfTaking,
                    course.StartDate,
                    course.EndDate,
                    course.MedicineId,
                    course.UserId,
                    course.Status,
                    course.IntakeFrequency,
                    course.TakenDosesCount + 1,
                    course.SkippedDosesCount
                );

                await _courseRepository.UpdateAsync(updatedCourse);
            }

            // Логируем принятие лекарства
            await _actionLogService.LogActionAsync(
                $"Принято лекарство по курсу {course?.Name}",
                userId,
                course?.MedicineId,
                course?.Id,
                intakeId);

            return updatedIntake;
        }

        public async Task<Intake> MarkIntakeAsSkippedAsync(Guid intakeId, string skipReason, Guid userId)
        {
            var intake = await _intakeRepository.GetByIdAsync(intakeId);
            if (intake == null || intake.UserId != userId)
                throw new UnauthorizedAccessException("У вас нет прав на изменение этого приёма");

            // Отмечаем приём как пропущенный
            intake.MarkAsSkipped();

            // Обновляем прием в БД с установкой статуса
            var updatedIntake = await _intakeRepository.UpdateAsync(intake);

            // Добавляем причину пропуска через прямое обновление в БД
            // Для этого нужно добавить новый метод в IIntakeRepository и его реализацию
            await _intakeRepository.SetSkipReasonAsync(intakeId, skipReason);

            // Обновляем статистику курса
            var course = await _courseRepository.GetByIdAsync(intake.CourseId);
            if (course != null)
            {
                // Увеличиваем счетчик пропущенных доз
                var updatedCourse = new Course(
                    course.Id,
                    course.Name,
                    course.Description,
                    course.TimesADay,
                    course.TimesOfTaking,
                    course.StartDate,
                    course.EndDate,
                    course.MedicineId,
                    course.UserId,
                    course.Status,
                    course.IntakeFrequency,
                    course.TakenDosesCount,
                    course.SkippedDosesCount + 1
                );

                await _courseRepository.UpdateAsync(updatedCourse);
            }

            // Логируем пропуск лекарства
            await _actionLogService.LogActionAsync(
                $"Пропущен приём лекарства по курсу {course?.Name}" +
                (!string.IsNullOrEmpty(skipReason) ? $" по причине: {skipReason}" : ""),
                userId,
                course?.MedicineId,
                course?.Id,
                intakeId);

            return updatedIntake;
        }

        public async Task<List<Intake>> GetScheduledIntakesForDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            return await _intakeRepository.GetScheduledIntakesByDateRangeAsync(userId, startDate, endDate);
        }

        public async Task<Dictionary<DateTime, List<Intake>>> GetCalendarDataAsync(Guid userId, DateTime month)
        {
            // Получаем первый и последний день месяца
            var firstDayOfMonth = new DateTime(month.Year, month.Month, 1);
            var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

            // Получаем все приёмы за месяц
            var intakes = await _intakeRepository.GetScheduledIntakesByDateRangeAsync(
                userId,
                firstDayOfMonth,
                lastDayOfMonth);

            // Группируем по датам
            var calendarData = new Dictionary<DateTime, List<Intake>>();

            foreach (var intake in intakes)
            {
                var date = intake.ScheduledTime.Date;

                if (!calendarData.ContainsKey(date))
                {
                    calendarData[date] = new List<Intake>();
                }

                calendarData[date].Add(intake);
            }

            return calendarData;
        }
    }
}
