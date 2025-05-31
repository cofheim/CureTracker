namespace CureTracker.Contracts.ActionLogContracts
{
    public record ActionLogResponse(
        Guid Id,
        string Description,
        DateTime Timestamp,
        Guid? MedicineId,
        string? MedicineName,
        Guid? CourseId,
        string? CourseName,
        Guid? IntakeId
    );
}
