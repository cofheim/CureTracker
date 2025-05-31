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

            var intakes = await _intakeService.GetScheduledIntakesForDateRangeAsync(
                userId,
                request.StartDate,
                request.EndDate
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

            // Первый и последний день месяца
            var firstDay = new DateTime(year, month, 1);
            var lastDay = firstDay.AddMonths(1).AddDays(-1);

            var intakes = await _intakeService.GetScheduledIntakesForDateRangeAsync(
                userId,
                firstDay,
                lastDay
            );

            // Группируем по датам в формате "yyyy-MM-dd" для удобства использования на фронтенде
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
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var intakes = await _intakeService.GetScheduledIntakesForDateRangeAsync(
                userId,
                today,
                tomorrow.AddSeconds(-1) // До конца текущего дня
            );

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
