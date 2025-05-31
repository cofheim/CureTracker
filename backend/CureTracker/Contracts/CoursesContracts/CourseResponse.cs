namespace CureTracker.Contracts.CoursesContracts
{
    public record CourseResponse(
        Guid Id,
        string Name,
        string Description,
        int TimesADay,
        List<DateTime> TimesOfTaking,
        DateTime StartDate,
        DateTime EndDate,
        string Status,
        string IntakeFrequency,
        int TakenDosesCount,
        int SkippedDosesCount,
        Guid MedicineId,
        string MedicineName
    );
}
