﻿using CureTracker.Core.Models;
using CureTracker.Core.Interfaces;
using static CureTracker.Core.Enums.MedicineTypeEnum;
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
            
            return await _medicineRepository.Update(id,
                name,
                description,
                dosagePerTake,
                storageConditions,
                type,
                userId);
        }

        public async Task<Guid> DeleteMedicine(Guid id)
        {
            return await _medicineRepository.Delete(id);
        }
        
    }
}
