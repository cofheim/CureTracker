namespace CureTracker.Core.Models
{
    public class ActionLog
    {
        public ActionLog(Guid id,
            string description,
            DateTime timestamp,
            Guid userId,
            Guid? medicineId = null,
            Guid? courseId = null,
            Guid? intakeId = null)
        {
            Id = id;
            Description = description;
            Timestamp = timestamp;
            UserId = userId;
            MedicineId = medicineId;
            CourseId = courseId;
            IntakeId = intakeId;
        }

        public Guid Id { get; }
        public string Description { get; private set; }
        public DateTime Timestamp { get; private set; }

        public Guid UserId { get; private set; }
        public User? User { get; private set; }

        public Guid? MedicineId { get; private set; }
        public Medicine? Medicine { get; private set; }

        public Guid? CourseId { get; private set; }
        public Course? Course { get; private set; }

        public Guid? IntakeId { get; private set; }
        public Intake? Intake { get; private set; }

        public static ActionLog Create(Guid id,
            string description,
            Guid userId,
            Guid? medicineId = null,
            Guid? courseId = null,
            Guid? intakeId = null)
        {
            return new ActionLog(id, description, DateTime.UtcNow, userId, medicineId, courseId, intakeId);
        }
    }
}
