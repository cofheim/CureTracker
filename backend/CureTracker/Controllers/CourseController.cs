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

            var timesOfTaking = new List<DateTime>();
            
            foreach (var timeStr in request.TimesOfTaking)
            {
                try
                {
                    if (TimeSpan.TryParse(timeStr, out var timeSpan))
                    {
                        var timeAsDateTime = new DateTime(2000, 1, 1, timeSpan.Hours, timeSpan.Minutes, 0, DateTimeKind.Unspecified);
                        timesOfTaking.Add(timeAsDateTime);
                    }
                    else
                    {
                        return BadRequest($"Неверный формат времени: {timeStr}. Используйте формат HH:mm:ss.");
                    }
                }
                catch (Exception ex)
                {
                    return BadRequest($"Ошибка при обработке времени: {ex.Message}");
                }
            }

            var startDate = new DateTime(request.StartDate.Year, request.StartDate.Month, request.StartDate.Day, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(request.EndDate.Year, request.EndDate.Month, request.EndDate.Day, 0, 0, 0, DateTimeKind.Utc);

            var courseResult = Course.Create(
                Guid.NewGuid(),
                request.Name,
                request.Description,
                request.TimesADay,
                timesOfTaking,
                startDate,
                endDate,
                request.MedicineId,
                userId,
                CourseStatus.Planned,
                request.IntakeFrequency
            );

            if (courseResult.Error != string.Empty)
                return BadRequest(courseResult.Error);

            var createdCourse = await _courseService.CreateCourseAsync(courseResult.Course);

            await _courseService.GenerateIntakesForCourseAsync(createdCourse, userId);

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

            var timesOfTaking = new List<DateTime>();
            
            foreach (var timeStr in request.TimesOfTaking)
            {
                try
                {
                    if (TimeSpan.TryParse(timeStr, out var timeSpan))
                    {
                        var timeAsDateTime = new DateTime(2000, 1, 1, timeSpan.Hours, timeSpan.Minutes, 0, DateTimeKind.Unspecified);
                        timesOfTaking.Add(timeAsDateTime);
                    }
                    else
                    {
                        return BadRequest($"Неверный формат времени: {timeStr}. Используйте формат HH:mm:ss.");
                    }
                }
                catch (Exception ex)
                {
                    return BadRequest($"Ошибка при обработке времени: {ex.Message}");
                }
            }

            var startDate = new DateTime(request.StartDate.Year, request.StartDate.Month, request.StartDate.Day, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(request.EndDate.Year, request.EndDate.Month, request.EndDate.Day, 0, 0, 0, DateTimeKind.Utc);

            var course = new Course(
                id,
                request.Name,
                request.Description,
                request.TimesADay,
                timesOfTaking,
                startDate,
                endDate,
                request.MedicineId,
                userId,
                existingCourse.Status,
                request.IntakeFrequency,
                existingCourse.TakenDosesCount,
                existingCourse.SkippedDosesCount
            );

            var updatedCourse = await _courseService.UpdateCourseAsync(course);

            if (existingCourse.StartDate.Date != startDate.Date || 
                existingCourse.EndDate.Date != endDate.Date ||
                existingCourse.TimesADay != request.TimesADay ||
                !existingCourse.TimesOfTaking.SequenceEqual(timesOfTaking) || 
                existingCourse.MedicineId != request.MedicineId ||
                existingCourse.IntakeFrequency != request.IntakeFrequency) 
            {
                await _courseService.GenerateIntakesForCourseAsync(updatedCourse, userId);
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
                null,
                intake.CourseId,
                intake.Course?.Name ?? string.Empty,
                intake.Course?.Medicine?.Name ?? string.Empty
            );
        }
    }
}