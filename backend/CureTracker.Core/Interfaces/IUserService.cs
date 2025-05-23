using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces;

public interface IUserService
{
    Task<Guid> CreateUser(User user);
    Task<Guid> DeleteUser(Guid id);
    Task<List<User>> GetAllUsers();
    Task<User?> GetUserByEmail(string email);
    Task<User?> GetUserById(Guid id);
    Task<User?> GetUserByTelegramId(long telegramId);
    Task<string> Login(string email, string password);
    Task Register(string userName, string email, string password);
    Task<Guid> UpdateUser(User user);
    Task<Guid> UpdateUserTelegramId(Guid userId, long telegramId);
}