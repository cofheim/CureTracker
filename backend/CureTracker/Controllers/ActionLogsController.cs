using CureTracker.Contracts.ActionLogContracts;
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
    public class ActionLogsController : ControllerBase
    {
        private readonly IActionLogService _actionLogService;

        public ActionLogsController(IActionLogService actionLogService)
        {
            _actionLogService = actionLogService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ActionLogResponse>>> GetUserActionLogs([FromQuery] ActionLogPageRequest request)
        {
            var userId = GetUserIdFromClaims();

            var logs = await _actionLogService.GetUserActionLogsAsync(
                userId,
                request.Page,
                request.PageSize
            );

            // Здесь можно добавить информацию о пагинации, если она нужна
            var response = logs.Select(MapToActionLogResponse).ToList();
            return Ok(response);
        }

        [HttpGet("medicine/{medicineId}")]
        public async Task<ActionResult<List<ActionLogResponse>>> GetMedicineActionLogs(Guid medicineId)
        {
            var userId = GetUserIdFromClaims();

            var logs = await _actionLogService.GetRelatedEntityLogsAsync(medicineId, "medicine", userId);
            var response = logs.Select(MapToActionLogResponse).ToList();
            return Ok(response);
        }

        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<List<ActionLogResponse>>> GetCourseActionLogs(Guid courseId)
        {
            var userId = GetUserIdFromClaims();

            var logs = await _actionLogService.GetRelatedEntityLogsAsync(courseId, "course", userId);
            var response = logs.Select(MapToActionLogResponse).ToList();
            return Ok(response);
        }

        [HttpGet("intake/{intakeId}")]
        public async Task<ActionResult<List<ActionLogResponse>>> GetIntakeActionLogs(Guid intakeId)
        {
            var userId = GetUserIdFromClaims();

            var logs = await _actionLogService.GetRelatedEntityLogsAsync(intakeId, "intake", userId);
            var response = logs.Select(MapToActionLogResponse).ToList();
            return Ok(response);
        }

        [HttpGet("related")]
        public async Task<ActionResult<List<ActionLogResponse>>> GetRelatedEntityLogs([FromQuery] RelatedEntityLogsRequest request)
        {
            var userId = GetUserIdFromClaims();

            // Проверка на валидность типа сущности
            if (!IsValidEntityType(request.EntityType))
                return BadRequest($"Invalid entity type: {request.EntityType}. Valid types are: medicine, course, intake");

            var logs = await _actionLogService.GetRelatedEntityLogsAsync(request.EntityId, request.EntityType, userId);
            var response = logs.Select(MapToActionLogResponse).ToList();
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

        private ActionLogResponse MapToActionLogResponse(ActionLog log)
        {
            return new ActionLogResponse(
                log.Id,
                log.Description,
                log.Timestamp,
                log.MedicineId,
                log.Medicine?.Name,
                log.CourseId,
                log.Course?.Name,
                log.IntakeId
            );
        }

        private bool IsValidEntityType(string entityType)
        {
            return entityType.ToLower() switch
            {
                "medicine" => true,
                "course" => true,
                "intake" => true,
                _ => false
            };
        }
    }
}
