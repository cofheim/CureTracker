using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces
{
    public interface IActionLogService
    {
        Task<List<ActionLog>> GetUserActionLogsAsync(Guid userId, int page = 1, int pageSize = 20);
        Task<ActionLog> LogActionAsync(string description, Guid userId, Guid? medicineId = null, Guid? courseId = null, Guid? intakeId = null);
        Task<List<ActionLog>> GetRelatedEntityLogsAsync(Guid entityId, string entityType, Guid userId);
    }
}
