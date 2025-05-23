using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using Telegram.Bot.Types.ReplyMarkups;

namespace CureTracker.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtProvider _jwtProvider;

        public UserService(IUserRepository userRepository, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _jwtProvider = jwtProvider;
        }

        public async Task Register (string userName, string email, string password)
        {
            var hashedPassword = _passwordHasher.Generate(password);

            var user = User.Create(Guid.NewGuid(), userName, email, hashedPassword);

            await _userRepository.CreateUser(user);
        }

        public async Task<string> Login(string email, string password)
        {
            var user = await _userRepository.GetUserByEmail(email);

            var result = _passwordHasher.Verify(password, user.PasswordHash);

            if(result == false)
            {
                throw new Exception("Failed to login");
            }

            var token = _jwtProvider.GenerateToken(user);

            return token;
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
