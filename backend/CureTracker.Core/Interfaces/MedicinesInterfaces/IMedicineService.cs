using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Core.Interfaces;

public interface IMedicineService
{
    Task<List<Medicine>> GetAllMedicines();
    Task<List<Medicine>> GetMedicinesByUserId(Guid userId);
    Task<Medicine> GetMedicineById(Guid id);
    Task<Guid> CreateMedicine(Medicine medicine);
    Task<Guid> UpdateMedicine(Guid id, 
        string name, 
        string description, 
        int dosagePerTake, 
        string storageConditions,
        MedicineType type,
        Guid userId);
    
    Task<Guid> DeleteMedicine(Guid id);
}