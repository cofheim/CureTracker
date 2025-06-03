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
        private readonly ITimeZoneService _timeZoneService;

        public UserService(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IJwtProvider jwtProvider,
            ITimeZoneService timeZoneService)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _jwtProvider = jwtProvider;
            _timeZoneService = timeZoneService;
        }

        public async Task Register(string userName, string email, string password, string countryCode)
        {
            var existingUser = await _userRepository.GetUserByEmail(email);
            if (existingUser != null)
            {
                throw new DuplicateEmailException(email);
            }

            var hashedPassword = _passwordHasher.Generate(password);
            var timeZoneId = _timeZoneService.GetTimeZoneByCountryCode(countryCode);
            
            var user = User.Create(Guid.NewGuid(), userName, email, hashedPassword, timeZoneId, countryCode);
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
            var existingUserWithTelegramId = await _userRepository.GetUserByTelegramId(telegramId);
            if (existingUserWithTelegramId != null && existingUserWithTelegramId.Id != userId)
            {
                throw new TelegramIdAlreadyLinkedException(telegramId);
            }

            var currentUser = await _userRepository.GetUserById(userId);
            if (currentUser != null && currentUser.TelegramId == telegramId)
            {
                return userId;
            }

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

        public async Task UpdateProfileAsync(Guid userId, string name, string email, string? countryCode)
        {
            var user = await _userRepository.GetUserById(userId);
            if (user == null)
            {
                throw new UserNotFoundException($"User with ID {userId} not found.");
            }

            user.Name = name;
            user.Email = email;

            if (!string.IsNullOrWhiteSpace(countryCode))
            {
                user.CountryCode = countryCode;
                user.TimeZoneId = _timeZoneService.GetTimeZoneByCountryCode(countryCode);
            }

            await _userRepository.UpdateUser(user);
        }
    }
}
