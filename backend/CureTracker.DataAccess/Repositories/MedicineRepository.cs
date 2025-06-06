﻿using CureTracker.DataAccess.Entities;
using CureTracker.Core.Models;
using Microsoft.EntityFrameworkCore;
using CureTracker.Core.Interfaces;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.DataAccess.Repositories
{
    public class MedicineRepository : IMedicineRepository
    {
        private readonly CureTrackerDbContext _context;

        public MedicineRepository(CureTrackerDbContext context)
        {
            _context = context;
        }

        public async Task<List<Medicine>> Get()
        {
            var medicineEntities = await _context.Medicines.AsNoTracking().ToListAsync();
            var medicines = medicineEntities.Select(MapEntityToDomain).ToList();

            return medicines;
        }
        
        public async Task<Medicine> GetById(Guid id)
        {
            var medicineEntity = await _context.Medicines
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == id);
                
            return medicineEntity != null ? MapEntityToDomain(medicineEntity) : null;
        }
        
        public async Task<List<Medicine>> GetByUserId(Guid userId)
        {
            var medicineEntities = await _context.Medicines
                .Where(m => m.UserId == userId)
                .AsNoTracking()
                .ToListAsync();
                
            var medicines = medicineEntities.Select(MapEntityToDomain).ToList();
            
            return medicines;
        }

        public async Task<Guid> Create(Medicine medicine)
        {
            var medicineEntity = new MedicineEntity
            {
                Id = medicine.Id,
                Name = medicine.Name,
                Description = medicine.Description,
                DosagePerTake = medicine.DosagePerTake,
                StorageConditions = medicine.StorageConditions,
                Type = medicine.Type,
                UserId = medicine.UserId,
            };

            await _context.Medicines.AddAsync(medicineEntity);
            await _context.SaveChangesAsync();

            return medicineEntity.Id;
        }

        public async Task<Guid> Update(Guid id,
            string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            MedicineType type,
            Guid userId)
        {
            await _context.Medicines
                .Where(m => m.Id == id)
                .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.Name, m => name)
                .SetProperty(m => m.Description, m => description)
                .SetProperty(m => m.StorageConditions, m => storageConditions)
                .SetProperty(m => m.DosagePerTake, m => dosagePerTake)
                .SetProperty(m => m.Type, m => type)
                .SetProperty(m => m.UserId, m => userId));

            return id;
        }

        public async Task<Guid> Delete(Guid id)
        {
            await _context.Medicines.Where(m => m.Id == id).ExecuteDeleteAsync();
            return id;
        }
        
        private Medicine MapEntityToDomain(MedicineEntity entity)
        {
            var (medicine, _) = Medicine.Create(
                entity.Id,
                entity.Name,
                entity.Description,
                entity.DosagePerTake,
                entity.StorageConditions,
                entity.Type,
                entity.UserId);
                
            return medicine;
        }
    }
}
