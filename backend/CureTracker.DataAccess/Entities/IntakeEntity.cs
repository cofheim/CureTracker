using static CureTracker.Core.Enums.IntakeStatusEnum;

namespace CureTracker.DataAccess.Entities
{
    public class IntakeEntity
    {
        public Guid Id { get; set; }
        public DateTime ScheduledTime { get; set; }
        public DateTime? ActualTime { get; set; }
        public IntakeStatus Status { get; set; }
        public string? SkipReason { get; set; }

        public Guid CourseId { get; set; }
        public CourseEntity? Course { get; set; }

        public Guid UserId { get; set; }
        public UserEntity? User { get; set; }
    }
} 