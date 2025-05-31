using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Contracts
{
    public record MedicineRequest(
        string name,
        string description,
        int dosagePerTake,
        string storageConditions,
        MedicineType type,
        Guid userId);
}
