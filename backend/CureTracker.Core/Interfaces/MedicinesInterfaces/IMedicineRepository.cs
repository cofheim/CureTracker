using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Core.Interfaces;

public interface IMedicineRepository
{

    Task<List<Medicine>> Get();
    Task<Medicine> GetById(Guid id);
    Task<List<Medicine>> GetByUserId(Guid userId);
    Task<Guid> Create(Medicine medicine);
    Task<Guid> Update(Guid id, 
        string name, 
        string description, 
        int dosagePerTake, 
        string storageConditions,
        MedicineType type,
        Guid userId);
    Task<Guid> Delete(Guid id);
}