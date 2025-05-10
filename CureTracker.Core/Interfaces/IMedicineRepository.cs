using CureTracker.Core.Models;

namespace CureTracker.DataAccess.Repositories
{
    public interface IMedicineRepository
    {
        Task<Guid> Create(Medicine medicine);
        Task<Guid> Delete(Guid id);
        Task<List<Medicine>> Get();
        Task<Guid> Update(Guid id, 
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
}