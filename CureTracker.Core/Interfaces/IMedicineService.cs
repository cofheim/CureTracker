using CureTracker.Core.Models;

namespace CureTracker.Application.Services
{
    public interface IMedicineService
    {
        Task<Guid> CreateMedicine(Medicine medicine);
        Task<Guid> DeleteMedicine(Guid id);
        Task<List<Medicine>> GetAllMedicines();
        Task<Guid> UpdateMedicine(Guid id, 
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