using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Core.Interfaces;

public interface IMedicineService
{
    // Получение списка всех лекарств (для админов)
    Task<List<Medicine>> GetAllMedicines();
    
    // Получение лекарств конкретного пользователя
    Task<List<Medicine>> GetMedicinesByUserId(Guid userId);
    
    // Получение конкретного лекарства по ID
    Task<Medicine> GetMedicineById(Guid id);
    
    // Создание нового лекарства
    Task<Guid> CreateMedicine(Medicine medicine);
    
    // Обновление существующего лекарства
    Task<Guid> UpdateMedicine(Guid id, 
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
    
    // Удаление лекарства
    Task<Guid> DeleteMedicine(Guid id);
    
    // Регистрация приема дозы лекарства
    Task<Guid> TakeDose(Guid medicineId, DateTime intakeTime, Guid userId);
    
    // Регистрация пропуска дозы лекарства (считается как принятая)
    Task<Guid> SkipDose(Guid medicineId, DateTime intakeTime, Guid userId);
}