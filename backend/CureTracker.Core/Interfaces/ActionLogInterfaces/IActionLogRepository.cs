﻿using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces
{
    public interface IActionLogRepository
    {
        Task<List<ActionLog>> GetAllByUserIdAsync(Guid userId, int limit = 50, int offset = 0);
        Task<ActionLog?> GetByIdAsync(Guid id);
        Task<ActionLog> CreateAsync(ActionLog actionLog);
        Task<List<ActionLog>> GetByRelatedEntityAsync(Guid entityId, string entityType);
        Task<bool> DeleteByCourseIdAsync(Guid courseId);
        Task DeleteByMedicineIdAsync(Guid medicineId);
        Task ClearIntakeReferencesAsync(Guid intakeId);
        Task DeleteLogsOlderThanAsync(DateTime cutoffDate);
    }
}
