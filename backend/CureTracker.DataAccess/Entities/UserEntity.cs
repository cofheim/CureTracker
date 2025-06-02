using CureTracker.Core.Models;

namespace CureTracker.DataAccess.Entities
{
    public class UserEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public long? TelegramId { get; set; } // ID пользователя в Telegram
        public string? ConnectionCode { get; set; } // Временный код для связи с Telegram
        
        // Навигационные свойства
        public List<MedicineEntity> Medicines { get; set; } = new List<MedicineEntity>();
        public List<CourseEntity> Courses { get; set; } = new List<CourseEntity>();
        public List<IntakeEntity> Intakes { get; set; } = new List<IntakeEntity>();
        public List<ActionLogEntity> ActionLogs { get; set; } = new List<ActionLogEntity>();
    }
}
