using CureTracker.DataAccess.Entities;
using CureTracker.Core.Models;
using Microsoft.EntityFrameworkCore;

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
            var medicines = medicineEntities.Select(z => Medicine.Create(z.Id, 
                z.Name, 
                z.Description, 
                z.DosagePerTake, 
                z.StorageConditions, 
                z.TimesADay,
                z.TimeOfTaking,
                z.StartDate, 
                z.EndDate, 
                z.Type,
                z.Status,
                z.IntakeFrequency,
                z.UserId).Medicine).ToList();

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
                TimeOfTaking = medicine.TimeOfTaking,
                StartDate = medicine.StartDate,
                EndDate = medicine.EndDate,
                Type = medicine.Type,
                Status = medicine.Status,
                IntakeFrequency = medicine.IntakeFrequency,
                UserId = medicine.UserId
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
            DateTime timeOfTaking,
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
                .SetProperty(m => m.TimeOfTaking, m => timeOfTaking)
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
    }
}
