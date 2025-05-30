namespace CureTracker.DataAccess.Entities
{
    public class ActionLogEntity
    {
        public Guid Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }

        // связь с пользователем
        public Guid UserId { get; set; }
        public UserEntity? User { get; set; }

        // опциональные связи с другими сущностями
        public Guid? MedicineId { get; set; }
        public MedicineEntity? Medicine { get; set; }

        public Guid? CourseId { get; set; }
        public CourseEntity? Course { get; set; }

        public Guid? IntakeId { get; set; }
        public IntakeEntity? Intake { get; set; }
    }
} 