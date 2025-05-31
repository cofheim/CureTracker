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

        public CourseService(
            ICourseRepository courseRepository,
            IIntakeRepository intakeRepository,
            IActionLogService actionLogService)
        {
            _courseRepository = courseRepository;
            _intakeRepository = intakeRepository;
            _actionLogService = actionLogService;
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

            var result = await _courseRepository.DeleteAsync(courseId);
            if (result)
            {
                // Логируем удаление курса
                await _actionLogService.LogActionAsync(
                    $"Удален курс приёма: {course.Name}",
                    userId,
                    course.MedicineId,
                    courseId);
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
                CourseStatus.InProgress => "в процессе",
                CourseStatus.Done => "завершен",
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

        public async Task<Course> GenerateIntakesForCourseAsync(Guid courseId, Guid userId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null || course.UserId != userId)
                throw new UnauthorizedAccessException("У вас нет прав на изменение этого курса");

            // Удаляем существующие интейки для этого курса, если они есть
            var existingIntakes = await _intakeRepository.GetAllByCourseIdAsync(courseId);
            foreach (var intake in existingIntakes)
            {
                await _intakeRepository.DeleteAsync(intake.Id);
            }

            // Генерируем новые интейки в зависимости от частоты приёма
            var scheduledIntakes = new List<Intake>();
            var currentDate = course.StartDate.Date;
            var endDate = course.EndDate.Date;

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
                        var intakeTime = new DateTime(
                            currentDate.Year,
                            currentDate.Month,
                            currentDate.Day,
                            time.Hour,
                            time.Minute,
                            0);

                        var intake = Intake.Create(
                            Guid.NewGuid(),
                            intakeTime,
                            IntakeStatus.Missed, // По умолчанию - пропущено, пока не отметят
                            courseId,
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
                courseId);

            // Меняем статус курса на "В процессе"
            if (course.Status == CourseStatus.Planned)
            {
                course = await ChangeCourseStatusAsync(courseId, CourseStatus.InProgress, userId);
            }

            return course;
        }
    }
}
