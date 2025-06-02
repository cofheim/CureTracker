using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.Core.Exceptions;
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

        public async Task Register(string userName, string email, string password, string? timeZoneId)
        {
            var existingUser = await _userRepository.GetUserByEmail(email);
            if (existingUser != null)
            {
                throw new DuplicateEmailException(email);
            }

            var hashedPassword = _passwordHasher.Generate(password);
            var user = User.Create(Guid.NewGuid(), userName, email, hashedPassword, timeZoneId);
            await _userRepository.CreateUser(user);
        }

        public async Task<string> Login(string email, string password)
        {
            var user = await _userRepository.GetUserByEmail(email);
            if (user == null)
            {
                throw new Exception("Пользователь не найден");
            }

            var result = _passwordHasher.Verify(password, user.PasswordHash);

            if(result == false)
            {
                throw new Exception("Неверный пароль");
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

        public async Task<string> GenerateConnectionCodeAsync(Guid userId)
        {
            return await _userRepository.GenerateConnectionCodeAsync(userId);
        }

        public async Task<User?> GetUserByConnectionCodeAsync(string code)
        {
            return await _userRepository.GetUserByConnectionCodeAsync(code);
        }
    }
}
