using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace CureTracker.DataAccess.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly CureTrackerDbContext _context;
        public UserRepository(CureTrackerDbContext context)
        {
            _context = context;
        }
        public async Task<List<User>> GetAllUsers()
        {
            var userEntities = await _context.Users.AsNoTracking().ToListAsync();
            var users = userEntities.Select(MapEntityToDomain).ToList();
            return users;
        }

        public async Task<User?> GetUserById(Guid id)
        {
            var userEntity = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);

            return userEntity != null ? MapEntityToDomain(userEntity) : null;
        }

        public async Task<User?> GetUserByEmail(string email)
        {
            var userEntity = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == email);

            return userEntity != null ? MapEntityToDomain(userEntity) : null;
        }

        public async Task<User?> GetUserByTelegramId(long telegramId)
        {
            var userEntity = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.TelegramId == telegramId);

            return userEntity != null ? MapEntityToDomain(userEntity) : null;
        }

        public async Task<User?> GetUserByConnectionCodeAsync(string code)
        {
            var entity = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.ConnectionCode == code);
            return entity == null ? null : MapEntityToDomain(entity);
        }

        public async Task<Guid> CreateUser(User user)
        {
            var userEntity = new UserEntity
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                PasswordHash = user.PasswordHash,
                TelegramId = user.TelegramId,
                TimeZoneId = user.TimeZoneId,
                CountryCode = user.CountryCode
            };

            await _context.Users.AddAsync(userEntity);
            await _context.SaveChangesAsync();

            return userEntity.Id;
        }

        public async Task<Guid> UpdateUser(User user)
        {
            await _context.Users
                .Where(u => u.Id == user.Id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(u => u.Name, u => user.Name)
                    .SetProperty(u => u.Email, u => user.Email)
                    .SetProperty(u => u.PasswordHash, u => user.PasswordHash)
                    .SetProperty(u => u.TelegramId, u => user.TelegramId)
                    .SetProperty(u => u.TimeZoneId, u => user.TimeZoneId)
                    .SetProperty(u => u.CountryCode, u => user.CountryCode));

            return user.Id;
        }

        public async Task<Guid> UpdateUserTelegramId(Guid userId, long telegramId)
        {
            await _context.Users
                .Where(u => u.Id == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.TelegramId, u => telegramId));

            return userId;
        }

        public async Task<Guid> DeleteUser(Guid id)
        {
            await _context.Users.Where(u => u.Id == id).ExecuteDeleteAsync();
            return id;
        }

        public async Task<string> GenerateConnectionCodeAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception($"Пользователь с ID {userId} не найден");

            var code = Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
            user.ConnectionCode = code;
            await _context.SaveChangesAsync();
            return code;
        }

        private User MapEntityToDomain(UserEntity entity)
        {
            return new User(entity.Id, entity.Name, entity.Email, entity.PasswordHash, entity.TelegramId, entity.ConnectionCode, entity.TimeZoneId, entity.CountryCode);
        }
    }
}
