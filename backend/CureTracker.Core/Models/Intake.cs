using static CureTracker.Core.Enums.IntakeStatusEnum;

namespace CureTracker.Core.Models
{
    public class Intake
    {
        public Intake(Guid id,
            DateTime scheduledTime,
            DateTime? actualTime,
            IntakeStatus status,
            Guid courseId,
            Guid userId)
        {
            Id = id;
            ScheduledTime = scheduledTime;
            ActualTime = actualTime;
            Status = status;
            CourseId = courseId;
            UserId = userId;
        }

        public Guid Id { get; }
        public DateTime ScheduledTime { get; private set; } 
        public DateTime? ActualTime { get; private set; } 
        public IntakeStatus Status { get; private set; } 

        public Guid CourseId { get; private set; }
        public Course? Course { get; private set; }

        public Guid UserId { get; private set; }
        public User? User { get; private set; }

        public static Intake Create(Guid id,
            DateTime scheduledTime,
            IntakeStatus status,
            Guid courseId,
            Guid userId)
        {
            return new Intake(id, scheduledTime, null, status, courseId, userId);
        }

        public void MarkAsTaken(DateTime actualTime)
        {
            Status = IntakeStatus.Taken;
            ActualTime = actualTime;
        }

        public void MarkAsSkipped()
        {
            Status = IntakeStatus.Skipped;
        }

        public void MarkAsMissed()
        {
            Status = IntakeStatus.Missed;
        }
    }
}
