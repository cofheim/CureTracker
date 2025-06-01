using CureTracker.Core.Models;
using CureTracker.Core.Interfaces;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Application.Services
{
    public class MedicineService : IMedicineService
    {
        private readonly IMedicineRepository _medicineRepository;
        private readonly IActionLogService _actionLogService;

        public MedicineService(IMedicineRepository medicineRepository, IActionLogService actionLogService)
        {
            _medicineRepository = medicineRepository;
            _actionLogService = actionLogService;
        }

        public async Task<List<Medicine>> GetAllMedicines()
        {
            return await _medicineRepository.Get();
        }

        public async Task<List<Medicine>> GetMedicinesByUserId(Guid userId)
        {
            return await _medicineRepository.GetByUserId(userId);
        }

        public async Task<Medicine> GetMedicineById(Guid id)
        {
            return await _medicineRepository.GetById(id);
        }

        public async Task<Guid> CreateMedicine(Medicine medicine)
        {
            var medicineId = await _medicineRepository.Create(medicine);
            
            // Логируем создание лекарства
            await _actionLogService.LogActionAsync(
                $"Создано новое лекарство: {medicine.Name}",
                medicine.UserId,
                medicineId,
                null,
                null);
                
            return medicineId;
        }

        public async Task<Guid> UpdateMedicine(Guid id,
            string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            MedicineType type,
            Guid userId)
        {
            var existingMedicine = await _medicineRepository.GetById(id);
            if (existingMedicine == null)
            {
                throw new KeyNotFoundException($"Medicine with ID {id} not found");
            }
            
            if (existingMedicine.UserId != userId)
            {
                throw new UnauthorizedAccessException("Not authorized to update this medicine");
            }
            
            var medicineId = await _medicineRepository.Update(id,
                name,
                description,
                dosagePerTake,
                storageConditions,
                type,
                userId);
                
            // Логируем обновление лекарства
            await _actionLogService.LogActionAsync(
                $"Обновлено лекарство: {name}",
                userId,
                medicineId,
                null,
                null);
                
            return medicineId;
        }

        public async Task<Guid> DeleteMedicine(Guid id)
        {
            var medicine = await _medicineRepository.GetById(id);
            if (medicine == null)
            {
                throw new KeyNotFoundException($"Medicine with ID {id} not found");
            }
            
            var medicineId = await _medicineRepository.Delete(id);
            
            // Логируем удаление лекарства
            await _actionLogService.LogActionAsync(
                $"Удалено лекарство: {medicine.Name}",
                medicine.UserId,
                medicineId,
                null,
                null);
                
            return medicineId;
        }
        
    }
}
