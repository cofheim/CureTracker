

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
        public List<MedicineEntity> Medicines { get; set; } = new List<MedicineEntity>(); // лекарства, которые использует пользователь
    }
}
