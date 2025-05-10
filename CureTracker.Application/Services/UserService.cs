using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;

namespace CureTracker.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<List<User>> GetAllUsers()
        {
            return await _userRepository.GetAllUsers();
        }

        public async Task<User?> GetUserById(Guid id)
        {
            return await _userRepository.GetUserById(id);
        }

        public async Task<User?> GetUserByEmail(string email)
        {
            return await _userRepository.GetUserByEmail(email);
        }

        public async Task<User?> GetUserByTelegramId(long telegramId)
        {
            return await _userRepository.GetUserByTelegramId(telegramId);
        }

        public async Task<Guid> CreateUser(User user)
        {
            return await _userRepository.CreateUser(user);
        }

        public async Task<Guid> UpdateUser(User user)
        {
            return await _userRepository.UpdateUser(user);
        }

        public async Task<Guid> UpdateUserTelegramId(Guid userId, long telegramId)
        {
            return await _userRepository.UpdateUserTelegramId(userId, telegramId);
        }

        public async Task<Guid> DeleteUser(Guid id)
        {
            return await _userRepository.DeleteUser(id);
        }
    }
}
