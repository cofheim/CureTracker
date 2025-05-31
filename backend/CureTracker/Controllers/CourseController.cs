using CureTracker.Contracts.CoursesContracts;
using CureTracker.Contracts.IntakesContracts;
using CureTracker.Application;
using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static CureTracker.Core.Enums.CourseStatusEnum;
using System.Security.Claims;

namespace CureTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;
        private readonly IIntakeService _intakeService;

        public CoursesController(
            ICourseService courseService,
            IIntakeService intakeService)
        {
            _courseService = courseService;
            _intakeService = intakeService;
        }

        [HttpGet]
        public async Task<ActionResult<List<CourseResponse>>> GetAllCourses()
        {
            var userId = GetUserIdFromClaims();
            var courses = await _courseService.GetAllCoursesForUserAsync(userId);

            var response = courses.Select(MapToCourseResponse).ToList();
            return Ok(response);
        }

        [HttpGet("active")]
        public async Task<ActionResult<List<CourseResponse>>> GetActiveCourses()
        {
            var userId = GetUserIdFromClaims();
            var courses = await _courseService.GetActiveCoursesForUserAsync(userId);

            var response = courses.Select(MapToCourseResponse).ToList();
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseResponse>> GetCourseById(Guid id)
        {
            var userId = GetUserIdFromClaims();
            var course = await _courseService.GetCourseByIdAsync(id, userId);

            if (course == null)
                return NotFound();

            return Ok(MapToCourseResponse(course));
        }

        [HttpPost]
        public async Task<ActionResult<CourseResponse>> CreateCourse(CreateCourseRequest request)
        {
            var userId = GetUserIdFromClaims();

            // Преобразуем TimeSpan в DateTime для сохранения времен приема
            var timesOfTaking = request.TimesOfTaking
                .Select(t => new DateTime(2000, 1, 1, t.Hours, t.Minutes, 0))
                .ToList();

            var courseResult = Course.Create(
                Guid.NewGuid(),
                request.Name,
                request.Description,
                request.TimesADay,
                timesOfTaking,
                request.StartDate,
                request.EndDate,
                request.MedicineId,
                userId,
                CourseStatus.Planned,
                request.IntakeFrequency
            );

            if (courseResult.Error != string.Empty)
                return BadRequest(courseResult.Error);

            var createdCourse = await _courseService.CreateCourseAsync(courseResult.Course);

            // Генерируем интейки для курса
            await _courseService.GenerateIntakesForCourseAsync(createdCourse.Id, userId);

            var response = MapToCourseResponse(createdCourse);
            return CreatedAtAction(nameof(GetCourseById), new { id = response.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CourseResponse>> UpdateCourse(Guid id, UpdateCourseRequest request)
        {
            var userId = GetUserIdFromClaims();

            var existingCourse = await _courseService.GetCourseByIdAsync(id, userId);
            if (existingCourse == null)
                return NotFound();

            // Преобразуем TimeSpan в DateTime для сохранения времен приема
            var timesOfTaking = request.TimesOfTaking
                .Select(t => new DateTime(2000, 1, 1, t.Hours, t.Minutes, 0))
                .ToList();

            var course = new Course(
                id,
                request.Name,
                request.Description,
                request.TimesADay,
                timesOfTaking,
                request.StartDate,
                request.EndDate,
                existingCourse.MedicineId,
                userId,
                existingCourse.Status,
                request.IntakeFrequency,
                existingCourse.TakenDosesCount,
                existingCourse.SkippedDosesCount
            );

            var updatedCourse = await _courseService.UpdateCourseAsync(course);

            // Перегенерируем интейки для курса, если изменились даты или времена приема
            if (existingCourse.StartDate != request.StartDate ||
                existingCourse.EndDate != request.EndDate ||
                existingCourse.TimesADay != request.TimesADay ||
                !existingCourse.TimesOfTaking.Select(t => new TimeSpan(t.Hour, t.Minute, 0))
                    .SequenceEqual(request.TimesOfTaking))
            {
                await _courseService.GenerateIntakesForCourseAsync(id, userId);
            }

            var response = MapToCourseResponse(updatedCourse);
            return Ok(response);
        }

        [HttpPatch("{id}/status")]
        public async Task<ActionResult<CourseResponse>> UpdateCourseStatus(Guid id, UpdateCourseStatusRequest request)
        {
            var userId = GetUserIdFromClaims();

            var existingCourse = await _courseService.GetCourseByIdAsync(id, userId);
            if (existingCourse == null)
                return NotFound();

            var updatedCourse = await _courseService.ChangeCourseStatusAsync(id, request.Status, userId);

            var response = MapToCourseResponse(updatedCourse);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCourse(Guid id)
        {
            var userId = GetUserIdFromClaims();

            var result = await _courseService.DeleteCourseAsync(id, userId);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpGet("{id}/intakes")]
        public async Task<ActionResult<List<IntakeResponse>>> GetCourseIntakes(Guid id)
        {
            var userId = GetUserIdFromClaims();

            var course = await _courseService.GetCourseByIdAsync(id, userId);
            if (course == null)
                return NotFound();

            var intakes = await _intakeService.GetIntakesForCourseAsync(id, userId);

            var response = intakes.Select(MapToIntakeResponse).ToList();
            return Ok(response);
        }

        // Вспомогательные методы
        private Guid GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                throw new UnauthorizedAccessException("User ID not found in claims");

            return userId;
        }

        private CourseResponse MapToCourseResponse(Course course)
        {
            return new CourseResponse(
                course.Id,
                course.Name,
                course.Description,
                course.TimesADay,
                course.TimesOfTaking,
                course.StartDate,
                course.EndDate,
                course.Status.ToString(),
                course.IntakeFrequency.ToString(),
                course.TakenDosesCount,
                course.SkippedDosesCount,
                course.MedicineId,
                course.Medicine?.Name ?? string.Empty
            );
        }

        private IntakeResponse MapToIntakeResponse(Intake intake)
        {
            return new IntakeResponse(
                intake.Id,
                intake.ScheduledTime,
                intake.ActualTime,
                intake.Status.ToString(),
                null, // SkipReason отсутствует в модели Core
                intake.CourseId,
                intake.Course?.Name ?? string.Empty,
                intake.Course?.Medicine?.Name ?? string.Empty
            );
        }
    }
}
