using CureTracker.Core.Models;

namespace CureTracker.Contracts
{
    public record MedicineRequest (string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            int timesADay,
            DateTime timeOfTaking,
            DateTime startDate,
            DateTime endDate,
            MedicineType type,
            Status status,
            IntakeFrequency intakeFrequency,
            Guid userId);
}
