using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces;

public interface IMedicineRepository
{
    /// <summary>
    /// Получает все лекарства
    /// </summary>
    Task<List<Medicine>> Get();
    
    /// <summary>
    /// Получает лекарство по его идентификатору
    /// </summary>
    /// <param name="id">Идентификатор лекарства</param>
    Task<Medicine> GetById(Guid id);
    
    /// <summary>
    /// Получает все лекарства конкретного пользователя
    /// </summary>
    /// <param name="userId">Идентификатор пользователя</param>
    Task<List<Medicine>> GetByUserId(Guid userId);
    
    /// <summary>
    /// Создает новое лекарство
    /// </summary>
    /// <param name="medicine">Данные лекарства</param>
    Task<Guid> Create(Medicine medicine);
    
    /// <summary>
    /// Обновляет существующее лекарство
    /// </summary>
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
        IntakeFrequency intakeFrequency,
        Guid userId);
    
    /// <summary>
    /// Удаляет лекарство по его идентификатору
    /// </summary>
    /// <param name="id">Идентификатор лекарства</param>
    Task<Guid> Delete(Guid id);
}