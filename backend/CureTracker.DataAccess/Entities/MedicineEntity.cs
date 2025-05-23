using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.DataAccess.Entities
{
    public class MedicineEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DosagePerTake { get; set; } = 0;
        public string StorageConditions { get; set; } = string.Empty;
        public int TimesADay { get; set; } = 0;
        public List<DateTime> TimesOfTaking { get; set; } = new List<DateTime>();
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; } = DateTime.UtcNow.AddDays(1);
        public MedicineType Type { get; set; } = MedicineType.Other;
        public Status Status { get; set; } = Status.Planned;
        public IntakeFrequency IntakeFrequency { get; set; } = IntakeFrequency.Daily;

        // связь с пользователем
        public Guid UserId { get; set; } // ID пользователя
        public UserEntity? User { get; set; }  // Навигационное свойство
    }
}
