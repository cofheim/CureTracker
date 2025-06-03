using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;

namespace CureTracker.Application.Services
{
    public class ActionLogService : IActionLogService
    {
        private readonly IActionLogRepository _actionLogRepository;

        public ActionLogService(IActionLogRepository actionLogRepository)
        {
            _actionLogRepository = actionLogRepository;
        }

        public async Task<List<ActionLog>> GetUserActionLogsAsync(Guid userId, int page = 1, int pageSize = 20)
        {
            int offset = (page - 1) * pageSize;
            return await _actionLogRepository.GetAllByUserIdAsync(userId, pageSize, offset);
        }

        public async Task<ActionLog> LogActionAsync(string description, Guid userId, Guid? medicineId = null, Guid? courseId = null, Guid? intakeId = null)
        {
            var actionLog = ActionLog.Create(
                Guid.NewGuid(),
                description,
                userId,
                medicineId,
                courseId,
                intakeId
            );

            return await _actionLogRepository.CreateAsync(actionLog);
        }

        public async Task<List<ActionLog>> GetRelatedEntityLogsAsync(Guid entityId, string entityType, Guid userId)
        {
            var logs = await _actionLogRepository.GetByRelatedEntityAsync(entityId, entityType);

            return logs.Where(log => log.UserId == userId).ToList();
        }
    }
}
