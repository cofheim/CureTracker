using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Contracts
{
    public record MedicineRequest(
        string name,
        string description,
        int dosagePerTake,
        string storageConditions,
        int timesADay,
        List<DateTime> timesOfTaking,
        DateTime startDate,
        DateTime endDate,
        MedicineType type,
        Status status,
        IntakeFrequency intakeFrequency,
        Guid userId);
}
