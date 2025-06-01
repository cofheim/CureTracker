using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using static CureTracker.Core.Enums.CourseStatusEnum;
using static CureTracker.Core.Enums.IntakeStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Application.Services
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly IIntakeRepository _intakeRepository;
        private readonly IActionLogService _actionLogService;
        private readonly IActionLogRepository _actionLogRepository;

        public CourseService(
            ICourseRepository courseRepository,
            IIntakeRepository intakeRepository,
            IActionLogService actionLogService,
            IActionLogRepository actionLogRepository)
        {
            _courseRepository = courseRepository;
            _intakeRepository = intakeRepository;
            _actionLogService = actionLogService;
            _actionLogRepository = actionLogRepository;
        }

        public async Task<List<Course>> GetAllCoursesForUserAsync(Guid userId)
        {
            return await _courseRepository.GetAllByUserIdAsync(userId);
        }

        public async Task<Course?> GetCourseByIdAsync(Guid courseId, Guid userId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);

            // Проверка доступа - пользователь может получить только свои курсы
            if (course == null || course.UserId != userId)
                return null;

            return course;
        }

        public async Task<Course> CreateCourseAsync(Course course)
        {
            var newCourse = await _courseRepository.CreateAsync(course);

            // Логируем создание курса
            await _actionLogService.LogActionAsync(
                $"Создан новый курс приёма: {course.Name}",
                course.UserId,
                course.MedicineId,
                newCourse.Id);

            return newCourse;
        }

        public async Task<Course> UpdateCourseAsync(Course course)
        {
            var existingCourse = await _courseRepository.GetByIdAsync(course.Id);
            if (existingCourse == null || existingCourse.UserId != course.UserId)
                throw new UnauthorizedAccessException("У вас нет прав на редактирование этого курса");

            var updatedCourse = await _courseRepository.UpdateAsync(course);

            // Логируем обновление курса
            await _actionLogService.LogActionAsync(
                $"Обновлен курс приёма: {course.Name}",
                course.UserId,
                course.MedicineId,
                course.Id);

            return updatedCourse;
        }

        public async Task<bool> DeleteCourseAsync(Guid courseId, Guid userId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null || course.UserId != userId)
                return false;

            // Сначала удаляем все связанные логи
            await _actionLogRepository.DeleteByCourseIdAsync(courseId);

            // Затем удаляем интейки для этого курса
            var intakes = await _intakeRepository.GetAllByCourseIdAsync(courseId);
            foreach (var intake in intakes)
            {
                await _intakeRepository.DeleteAsync(intake.Id);
            }

            // И только после этого удаляем сам курс
            var result = await _courseRepository.DeleteAsync(courseId);
            if (result)
            {
                // Логируем удаление курса (этот лог не привязан к курсу, так как курс уже удален)
                await _actionLogService.LogActionAsync(
                    $"Удален курс приёма: {course.Name}",
                    userId,
                    course.MedicineId,
                    null);
            }

            return result;
        }

        public async Task<List<Course>> GetActiveCoursesForUserAsync(Guid userId)
        {
            return await _courseRepository.GetActiveCoursesByUserIdAsync(userId);
        }

        public async Task<Course> ChangeCourseStatusAsync(Guid courseId, CourseStatus newStatus, Guid userId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null || course.UserId != userId)
                throw new UnauthorizedAccessException("У вас нет прав на изменение этого курса");

            // Меняем статус
            var statusName = newStatus switch
            {
                CourseStatus.Planned => "запланирован",
                CourseStatus.Active => "в процессе",
                CourseStatus.Completed => "завершен",
                _ => newStatus.ToString()
            };

            // Обновляем и сохраняем
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
                newStatus,
                course.IntakeFrequency,
                course.TakenDosesCount,
                course.SkippedDosesCount
            );

            var result = await _courseRepository.UpdateAsync(updatedCourse);

            // Логируем изменение статуса
            await _actionLogService.LogActionAsync(
                $"Изменен статус курса {course.Name} на '{statusName}'",
                userId,
                course.MedicineId,
                courseId);

            return result;
        }

        public async Task GenerateIntakesForCourseAsync(Course course, Guid userId)
        {
            if (course == null || course.UserId != userId)
                throw new UnauthorizedAccessException("У вас нет прав на изменение этого курса или курс не найден");

            // Удаляем существующие интейки для этого курса, если они есть
            var existingIntakes = await _intakeRepository.GetAllByCourseIdAsync(course.Id);
            foreach (var intake in existingIntakes)
            {
                // Сначала очищаем ссылки на этот Intake в ActionLogs
                await _actionLogRepository.ClearIntakeReferencesAsync(intake.Id);
                // Затем удаляем сам Intake
                await _intakeRepository.DeleteAsync(intake.Id);
            }

            // Генерируем новые интейки в зависимости от частоты приёма
            var scheduledIntakes = new List<Intake>();
            var currentDate = course.StartDate.Date;
            var endDate = course.EndDate.Date;
            var utcNow = DateTime.UtcNow; // Текущее время для определения статуса

            while (currentDate <= endDate)
            {
                bool shouldCreateForThisDay = course.IntakeFrequency switch
                {
                    IntakeFrequency.Daily => true,
                    IntakeFrequency.Weekly => currentDate.DayOfWeek == course.StartDate.DayOfWeek,
                    IntakeFrequency.Monthly => currentDate.Day == course.StartDate.Day,
                    _ => true
                };

                if (shouldCreateForThisDay)
                {
                    foreach (var time in course.TimesOfTaking)
                    {
                        // Создаем DateTime с указанием UTC, сохраняя часы и минуты из времени приема
                        var intakeTime = new DateTime(
                            currentDate.Year,
                            currentDate.Month,
                            currentDate.Day,
                            time.Hour,
                            time.Minute,
                            0,
                            DateTimeKind.Utc);

                        // Определяем статус в зависимости от времени
                        IntakeStatus status;
                        if (intakeTime < utcNow)
                        {
                            // Если время приема уже прошло, помечаем как пропущенный
                            status = IntakeStatus.Missed;
                        }
                        else
                        {
                            // Если время приема еще не наступило, помечаем как запланированный
                            status = IntakeStatus.Scheduled;
                        }

                        var intake = Intake.Create(
                            Guid.NewGuid(),
                            intakeTime,
                            status,
                            course.Id,
                            userId
                        );

                        var createdIntake = await _intakeRepository.CreateAsync(intake);
                        scheduledIntakes.Add(createdIntake);
                    }
                }

                currentDate = currentDate.AddDays(1);
            }

            // Логируем генерацию приёмов
            await _actionLogService.LogActionAsync(
                $"Сгенерировано {scheduledIntakes.Count} приёмов для курса {course.Name}",
                userId,
                course.MedicineId,
                course.Id);

            // Статус курса НЕ меняется при генерации приемов
            // Статус курса будет обновляться автоматически фоновой службой CourseStatusUpdateService
            // в соответствии с текущей датой и датами начала/окончания курса
        }

        /// <summary>
        /// Обновляет статусы курсов на основе текущей даты
        /// </summary>
        /// <returns>Количество обновленных курсов</returns>
        public async Task<int> UpdateCoursesStatusesAsync()
        {
            int updatedCount = 0;
            var utcNow = DateTime.UtcNow.Date;
            
            // Получаем все запланированные курсы, у которых дата начала <= текущей дате
            var plannedCourses = await _courseRepository.GetCoursesByStatusAsync(CourseStatus.Planned);
            var coursesToUpdate = plannedCourses.Where(c => c.StartDate.Date <= utcNow).ToList();
            
            foreach (var course in coursesToUpdate)
            {
                try
                {
                    // Меняем статус на "В процессе"
                    await ChangeCourseStatusAsync(course.Id, CourseStatus.Active, course.UserId);
                    updatedCount++;
                }
                catch (Exception ex)
                {
                    // Логируем ошибку, но продолжаем обработку остальных курсов
                    Console.WriteLine($"Ошибка при обновлении статуса курса {course.Id}: {ex.Message}");
                }
            }
            
            // Также проверяем курсы "В процессе", у которых дата окончания < текущей даты
            var activeCourses = await _courseRepository.GetCoursesByStatusAsync(CourseStatus.Active);
            var completedCourses = activeCourses.Where(c => c.EndDate.Date < utcNow).ToList();
            
            foreach (var course in completedCourses)
            {
                try
                {
                    // Меняем статус на "Завершен"
                    await ChangeCourseStatusAsync(course.Id, CourseStatus.Completed, course.UserId);
                    updatedCount++;
                }
                catch (Exception ex)
                {
                    // Логируем ошибку, но продолжаем обработку остальных курсов
                    Console.WriteLine($"Ошибка при обновлении статуса курса {course.Id}: {ex.Message}");
                }
            }
            
            return updatedCount;
        }
    }
}
