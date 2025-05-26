using CureTracker.DataAccess.Entities;
using CureTracker.Core.Models;
using Microsoft.EntityFrameworkCore;
using CureTracker.Core.Interfaces;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineStatusEnum;
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
                TimesADay = medicine.TimesADay,
                TimesOfTaking = medicine.TimesOfTaking,
                StartDate = medicine.StartDate,
                EndDate = medicine.EndDate,
                Type = medicine.Type,
                Status = medicine.Status,
                IntakeFrequency = medicine.IntakeFrequency,
                UserId = medicine.UserId,
                TakenDosesCount = medicine.TakenDosesCount
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
            int timesADay,
            List<DateTime> timesOfTaking,
            DateTime startDate,
            DateTime endDate,
            MedicineType type,
            Status status,
            IntakeFrequency intakeFrequency,
            Guid userId)
        {
            await _context.Medicines
                .Where(m => m.Id == id)
                .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.Name, m => name)
                .SetProperty(m => m.Description, m => description)
                .SetProperty(m => m.StorageConditions, m => storageConditions)
                .SetProperty(m => m.DosagePerTake, m => dosagePerTake)
                .SetProperty(m => m.TimesADay, m => timesADay)
                .SetProperty(m => m.TimesOfTaking, m => timesOfTaking)
                .SetProperty(m => m.StartDate, m => startDate)
                .SetProperty(m => m.EndDate, m => endDate)
                .SetProperty(m => m.Type, m => type)
                .SetProperty(m => m.Status, m => status)
                .SetProperty(m => m.IntakeFrequency, m => intakeFrequency)
                .SetProperty(m => m.UserId, m => userId));

            return id;
        }

        public async Task<Guid> Delete(Guid id)
        {
            await _context.Medicines.Where(m => m.Id == id).ExecuteDeleteAsync();
            return id;
        }
        
        public async Task<Guid> IncrementTakenDoses(Guid medicineId)
        {
            await _context.Medicines
                .Where(m => m.Id == medicineId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(m => m.TakenDosesCount, m => m.TakenDosesCount + 1));
            
            return medicineId;
        }
        
        private Medicine MapEntityToDomain(MedicineEntity entity)
        {
            var (medicine, _) = Medicine.Create(
                entity.Id,
                entity.Name,
                entity.Description,
                entity.DosagePerTake,
                entity.StorageConditions,
                entity.TimesADay,
                entity.TimesOfTaking,
                entity.StartDate,
                entity.EndDate,
                entity.Type,
                entity.Status,
                entity.IntakeFrequency,
                entity.UserId,
                entity.TakenDosesCount);
                
            return medicine;
        }
    }
}
