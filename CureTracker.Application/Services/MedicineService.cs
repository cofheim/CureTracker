using CureTracker.Core.Models;
using CureTracker.DataAccess;
using CureTracker.DataAccess.Repositories;

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
            DateTime timeOfTaking,
            DateTime startDate,
            DateTime endDate,
            MedicineType type,
            Status status,
            IntakeFrequency intakeFrequency,
            Guid userId)
        {
            return await _medicineRepository.Update(id,
                name,
                description,
                dosagePerTake,
                storageConditions,
                timesADay,
                timeOfTaking,
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
    }
}
