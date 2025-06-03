using CureTracker.Core.Models;
using static CureTracker.Core.Enums.CourseStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.DataAccess.Entities
{
    public class CourseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TimesADay { get; set; } = 0;
        public List<DateTime> TimesOfTaking { get; set; } = new List<DateTime>();
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; } = DateTime.UtcNow.AddDays(1);
        public CourseStatus Status { get; set; } = CourseStatus.Planned;
        public IntakeFrequency IntakeFrequency { get; set; } = IntakeFrequency.Daily;
        public int TakenDosesCount { get; set; } = 0;
        public int SkippedDosesCount { get; set; } = 0;

        public Guid MedicineId { get; set; }
        public MedicineEntity? Medicine { get; set; }

        public Guid UserId { get; set; }
        public UserEntity? User { get; set; }

        public List<IntakeEntity> Intakes { get; set; } = new List<IntakeEntity>();
    }
} 