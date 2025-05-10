using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces
{
    public interface IUserRepository
    {
        Task<List<User>> GetAllUsers();
        Task<User?> GetUserById(Guid id);
        Task<User?> GetUserByEmail(string email);
        Task<User?> GetUserByTelegramId(long telegramId);
        Task<Guid> CreateUser(User user);
        Task<Guid> UpdateUser(User user);
        Task<Guid> UpdateUserTelegramId(Guid userId, long telegramId);
        Task<Guid> DeleteUser(Guid id);
    }
}
