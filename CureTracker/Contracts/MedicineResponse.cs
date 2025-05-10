using CureTracker.Core.Models;

namespace CureTracker.Contracts
{
    public record MedicineResponse(Guid id,
            string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            int timesADay,
            DateTime timeOfTaking,
            DateTime startDate,
            DateTime endDate,
            MedicineType type,
            Status status,
            IntakeFrequency intakeFrequency);
}
