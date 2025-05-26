using CureTracker.Core.Models;
using CureTracker.Core.Interfaces;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Application.Services
{
    public class MedicineService : IMedicineService
    {
        private readonly IMedicineRepository _medicineRepository;
        public MedicineService(IMedicineRepository medicineRepository)
        {
            _medicineRepository = medicineRepository;
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
            return await _medicineRepository.Create(medicine);
        }

        public async Task<Guid> UpdateMedicine(Guid id,
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
            
            return await _medicineRepository.Update(id,
                name,
                description,
                dosagePerTake,
                storageConditions,
                timesADay,
                timesOfTaking,
                startDate,
                endDate,
                type,
                status,
                intakeFrequency,
                userId);
        }

        public async Task<Guid> DeleteMedicine(Guid id)
        {
            return await _medicineRepository.Delete(id);
        }
        
        public async Task<Guid> TakeDose(Guid medicineId, DateTime intakeTime, Guid userId)
        {
            var medicine = await _medicineRepository.GetById(medicineId);
            if (medicine == null)
            {
                throw new KeyNotFoundException($"Medicine with ID {medicineId} not found");
            }
            
            if (medicine.UserId != userId)
            {
                throw new UnauthorizedAccessException("Not authorized to take a dose of this medicine");
            }
            
            // Проверяем, что лекарство в активном периоде
            var today = DateTime.UtcNow.Date;
            if (today < medicine.StartDate.Date || today > medicine.EndDate.Date)
            {
                throw new InvalidOperationException("Cannot take a dose of medicine outside its active period");
            }
            
            return await _medicineRepository.IncrementTakenDoses(medicineId);
        }
        
        public async Task<Guid> SkipDose(Guid medicineId, DateTime intakeTime, Guid userId)
        {
            var medicine = await _medicineRepository.GetById(medicineId);
            if (medicine == null)
            {
                throw new KeyNotFoundException($"Medicine with ID {medicineId} not found");
            }
            
            if (medicine.UserId != userId)
            {
                throw new UnauthorizedAccessException("Not authorized to skip a dose of this medicine");
            }
            
            // Проверяем, что лекарство в активном периоде
            var today = DateTime.UtcNow.Date;
            if (today < medicine.StartDate.Date || today > medicine.EndDate.Date)
            {
                throw new InvalidOperationException("Cannot skip a dose of medicine outside its active period");
            }
            
            // Используем тот же метод инкремента счетчика доз, что и для приема
            // Пропущенная доза засчитывается так же, как принятая, для прогресса
            return await _medicineRepository.IncrementTakenDoses(medicineId);
        }
    }
}
