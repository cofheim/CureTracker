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
        private readonly IUserService _userService;

        public CourseService(
            ICourseRepository courseRepository,
            IIntakeRepository intakeRepository,
            IActionLogService actionLogService,
            IActionLogRepository actionLogRepository,
            IUserService userService)
        {
            _courseRepository = courseRepository;
            _intakeRepository = intakeRepository;
            _actionLogService = actionLogService;
            _actionLogRepository = actionLogRepository;
            _userService = userService;
        }

        public async Task<List<Course>> GetAllCoursesForUserAsync(Guid userId)
        {
            return await _courseRepository.GetAllByUserIdAsync(userId);
        }

        public async Task<Course?> GetCourseByIdAsync(Guid courseId, Guid userId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);

            if (course == null || course.UserId != userId)
                return null;

            return course;
        }

        public async Task<Course> CreateCourseAsync(Course course)
        {
            var newCourse = await _courseRepository.CreateAsync(course);

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

            await _actionLogRepository.DeleteByCourseIdAsync(courseId);

            var intakes = await _intakeRepository.GetAllByCourseIdAsync(courseId);
            foreach (var intake in intakes)
            {
                await _intakeRepository.DeleteAsync(intake.Id);
            }

            var result = await _courseRepository.DeleteAsync(courseId);
            if (result)
            {
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

            var statusName = newStatus switch
            {
                CourseStatus.Planned => "запланирован",
                CourseStatus.Active => "в процессе",
                CourseStatus.Completed => "завершен",
                _ => newStatus.ToString()
            };

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

            var user = await _userService.GetUserById(userId);
            var userTimeZone = TimeZoneInfo.Utc;
            if (user != null && !string.IsNullOrEmpty(user.TimeZoneId))
            {
                try
                {
                    userTimeZone = TimeZoneInfo.FindSystemTimeZoneById(user.TimeZoneId);
                }
                catch (TimeZoneNotFoundException)
                {

                }
            }

            var existingIntakes = await _intakeRepository.GetAllByCourseIdAsync(course.Id);
            foreach (var intake in existingIntakes)
            {
                await _actionLogRepository.ClearIntakeReferencesAsync(intake.Id);
                await _intakeRepository.DeleteAsync(intake.Id);
            }

            var scheduledIntakes = new List<Intake>();
            var currentDate = course.StartDate.Date;
            var endDate = course.EndDate.Date;
            var utcNow = DateTime.UtcNow;

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
                        var localIntakeTime = new DateTime(
                            currentDate.Year,
                            currentDate.Month,
                            currentDate.Day,
                            time.Hour,
                            time.Minute,
                            0,
                            DateTimeKind.Unspecified);

                        var intakeTime = TimeZoneInfo.ConvertTimeToUtc(localIntakeTime, userTimeZone);

                        IntakeStatus status;
                        if (intakeTime < utcNow)
                        {
                            status = IntakeStatus.Missed;
                        }
                        else
                        {
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

            await _actionLogService.LogActionAsync(
                $"Сгенерировано {scheduledIntakes.Count} приёмов для курса {course.Name}",
                userId,
                course.MedicineId,
                course.Id);
        }

        public async Task<int> UpdateCoursesStatusesAsync()
        {
            int updatedCount = 0;
            var utcNow = DateTime.UtcNow.Date;
            
            var plannedCourses = await _courseRepository.GetCoursesByStatusAsync(CourseStatus.Planned);
            var coursesToUpdate = plannedCourses.Where(c => c.StartDate.Date <= utcNow).ToList();
            
            foreach (var course in coursesToUpdate)
            {
                try
                {
                    await ChangeCourseStatusAsync(course.Id, CourseStatus.Active, course.UserId);
                    updatedCount++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Ошибка при обновлении статуса курса {course.Id}: {ex.Message}");
                }
            }
            
            var activeCourses = await _courseRepository.GetCoursesByStatusAsync(CourseStatus.Active);
            var completedCourses = activeCourses.Where(c => c.EndDate.Date < utcNow).ToList();
            
            foreach (var course in completedCourses)
            {
                try
                {
                    await ChangeCourseStatusAsync(course.Id, CourseStatus.Completed, course.UserId);
                    updatedCount++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Ошибка при обновлении статуса курса {course.Id}: {ex.Message}");
                }
            }
            
            return updatedCount;
        }
    }
}
