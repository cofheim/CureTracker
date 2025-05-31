namespace CureTracker.Contracts.IntakesContracts
{
    public record IntakeResponse(
        Guid Id,
        DateTime ScheduledTime,
        DateTime? ActualTime,
        string Status,
        string? SkipReason,
        Guid CourseId,
        string CourseName,
        string MedicineName
    );
}
