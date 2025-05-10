using CureTracker.Core.Models;

namespace CureTracker.Application.Services
{
    public interface IUserService
    {
        Task<Guid> CreateUser(User user);
        Task<Guid> DeleteUser(Guid id);
        Task<List<User>> GetAllUsers();
        Task<User?> GetUserByEmail(string email);
        Task<User?> GetUserById(Guid id);
        Task<User?> GetUserByTelegramId(long telegramId);
        Task<Guid> UpdateUser(User user);
        Task<Guid> UpdateUserTelegramId(Guid userId, long telegramId);
    }
}