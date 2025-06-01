using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces
{
    public interface IIntakeRepository
    {
        Task<List<Intake>> GetAllByCourseIdAsync(Guid courseId);
        Task<Intake?> GetByIdAsync(Guid id);
        Task<Intake> CreateAsync(Intake intake);
        Task<Intake> UpdateAsync(Intake intake);
        Task<bool> DeleteAsync(Guid id);
        Task<List<Intake>> GetScheduledIntakesByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
        Task<bool> SetSkipReasonAsync(Guid intakeId, string skipReason);
        Task<List<Intake>> GetAllUserIntakesForPeriodAsync(Guid userId, DateTime startDate, DateTime endDate);
    }
}
