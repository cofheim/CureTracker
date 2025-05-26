using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Contracts
{
    public record MedicineResponse(
        Guid Id,
        string Name,
        string Description,
        int DosagePerTake,
        string StorageConditions,
        int TimesADay,
        List<DateTime> TimesOfTaking,
        DateTime StartDate,
        DateTime EndDate,
        MedicineType Type,
        Status Status,
        IntakeFrequency IntakeFrequency,
        int TakenDosesCount,
        int SkippedDosesCount);
}
