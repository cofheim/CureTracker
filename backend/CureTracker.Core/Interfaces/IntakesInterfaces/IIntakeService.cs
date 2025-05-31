using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces
{
    public interface IIntakeService
    {
        Task<List<Intake>> GetIntakesForCourseAsync(Guid courseId, Guid userId);
        Task<Intake?> GetIntakeByIdAsync(Guid intakeId, Guid userId);
        Task<Intake> MarkIntakeAsTakenAsync(Guid intakeId, Guid userId);
        Task<Intake> MarkIntakeAsSkippedAsync(Guid intakeId, string skipReason, Guid userId);
        Task<List<Intake>> GetScheduledIntakesForDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
        Task<Dictionary<DateTime, List<Intake>>> GetCalendarDataAsync(Guid userId, DateTime month);
    }
}
