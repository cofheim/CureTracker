using CureTracker.Core.Models;
using static CureTracker.Core.Enums.MedicineTypeEnum;
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
        public MedicineType Type { get; set; } = MedicineType.Other;


        public Guid UserId { get; set; }
        public UserEntity? User { get; set; } 

        public List<CourseEntity> Courses { get; set; } = new List<CourseEntity>();
    }
}
