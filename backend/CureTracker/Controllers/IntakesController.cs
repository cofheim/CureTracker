using CureTracker.Contracts.IntakesContracts;
using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CureTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class IntakesController : ControllerBase
    {
        private readonly IIntakeService _intakeService;

        public IntakesController(IIntakeService intakeService)
        {
            _intakeService = intakeService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IntakeResponse>> GetIntakeById(Guid id)
        {
            var userId = GetUserIdFromClaims();
            var intake = await _intakeService.GetIntakeByIdAsync(id, userId);

            if (intake == null)
                return NotFound();

            return Ok(MapToIntakeResponse(intake));
        }

        [HttpPost("{id}/take")]
        public async Task<ActionResult<IntakeResponse>> MarkIntakeAsTaken(Guid id)
        {
            var userId = GetUserIdFromClaims();

            try
            {
                var updatedIntake = await _intakeService.MarkIntakeAsTakenAsync(id, userId);
                return Ok(MapToIntakeResponse(updatedIntake));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("{id}/skip")]
        public async Task<ActionResult<IntakeResponse>> MarkIntakeAsSkipped(Guid id, MarkIntakeAsSkippedRequest request)
        {
            var userId = GetUserIdFromClaims();

            try
            {
                var updatedIntake = await _intakeService.MarkIntakeAsSkippedAsync(id, request.SkipReason, userId);
                return Ok(MapToIntakeResponse(updatedIntake));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpGet("byDateRange")]
        public async Task<ActionResult<List<IntakeResponse>>> GetIntakesByDateRange([FromQuery] IntakesByDateRangeRequest request)
        {
            var userId = GetUserIdFromClaims();

 
            var startDateUtc = request.StartDate.Kind == DateTimeKind.Unspecified || request.StartDate.Kind == DateTimeKind.Local
                ? request.StartDate.ToUniversalTime()
                : request.StartDate;
            var endDateUtc = request.EndDate.Kind == DateTimeKind.Unspecified || request.EndDate.Kind == DateTimeKind.Local
                ? request.EndDate.ToUniversalTime()
                : request.EndDate;


            var intakes = await _intakeService.GetScheduledIntakesForDateRangeAsync(
                userId,
                startDateUtc, 
                endDateUtc   
            );

            var response = intakes.Select(MapToIntakeResponse).ToList();
            return Ok(response);
        }

        [HttpGet("calendar")]
        public async Task<ActionResult<Dictionary<string, List<IntakeResponse>>>> GetCalendarData([FromQuery] int year, [FromQuery] int month)
        {
            if (year <= 0 || month < 1 || month > 12)
                return BadRequest("Invalid year or month");

            var userId = GetUserIdFromClaims();

            var firstDayOfMonthUtc = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var lastDayOfMonthUtc = firstDayOfMonthUtc.AddMonths(1).AddDays(-1);
            lastDayOfMonthUtc = new DateTime(lastDayOfMonthUtc.Year, lastDayOfMonthUtc.Month, lastDayOfMonthUtc.Day, 23, 59, 59, 999, DateTimeKind.Utc);


            var intakes = await _intakeService.GetScheduledIntakesForDateRangeAsync(
                userId,
                firstDayOfMonthUtc,
                lastDayOfMonthUtc
            );

            var calendarData = intakes
                .GroupBy(i => i.ScheduledTime.Date) 
                .ToDictionary(
                    g => g.Key.ToString("yyyy-MM-dd"),
                    g => g.Select(MapToIntakeResponse).ToList()
                );

            return Ok(calendarData);
        }

        [HttpGet("today")]
        public async Task<ActionResult<List<IntakeResponse>>> GetTodayIntakes()
        {
            var userId = GetUserIdFromClaims();
            
            DateTime todayUtcStart = DateTime.UtcNow.Date; 
            DateTime todayUtcEnd = todayUtcStart.AddDays(1).AddSeconds(-1);

            var intakes = await _intakeService.GetScheduledIntakesForDateRangeAsync(
                userId,
                todayUtcStart,
                todayUtcEnd
            );

            var response = intakes.Select(MapToIntakeResponse).ToList();
            return Ok(response);
        }

        [HttpGet("calendar/range")]
        public async Task<ActionResult<List<IntakeResponse>>> GetUserIntakesForCalendar([FromQuery] CalendarIntakesRequest request)
        {
            var userId = GetUserIdFromClaims();
            var intakes = await _intakeService.GetUserIntakesForCalendarAsync(userId, request.StartDate, request.EndDate);
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
