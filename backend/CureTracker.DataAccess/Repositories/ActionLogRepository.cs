using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace CureTracker.DataAccess.Repositories
{
    public class ActionLogRepository : IActionLogRepository
    {
        private readonly CureTrackerDbContext _context;

        public ActionLogRepository(CureTrackerDbContext dbContext)
        {
            _context = dbContext;
        }

        public async Task<List<ActionLog>> GetAllByUserIdAsync(Guid userId, int limit = 50, int offset = 0)
        {
            var logs = await _context.ActionLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            return logs.Select(MapToDomainModel).ToList();
        }

        public async Task<ActionLog?> GetByIdAsync(Guid id)
        {
            var log = await _context.ActionLogs
                .FirstOrDefaultAsync(a => a.Id == id);

            return log != null ? MapToDomainModel(log) : null;
        }

        public async Task<ActionLog> CreateAsync(ActionLog actionLog)
        {
            var entity = MapToEntity(actionLog);
            _context.ActionLogs.Add(entity);
            await _context.SaveChangesAsync();

            return MapToDomainModel(entity);
        }

        public async Task<List<ActionLog>> GetByRelatedEntityAsync(Guid entityId, string entityType)
        {
            var logs = entityType.ToLower() switch
            {
                "medicine" => await _context.ActionLogs
                    .Where(a => a.MedicineId == entityId)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync(),

                "course" => await _context.ActionLogs
                    .Where(a => a.CourseId == entityId)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync(),

                "intake" => await _context.ActionLogs
                    .Where(a => a.IntakeId == entityId)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync(),

                _ => new List<ActionLogEntity>()
            };

            return logs.Select(MapToDomainModel).ToList();
        }

        public async Task<bool> DeleteByCourseIdAsync(Guid courseId)
        {
            try
            {
                // Находим все логи, связанные с указанным курсом
                var logs = await _context.ActionLogs
                    .Where(a => a.CourseId == courseId)
                    .ToListAsync();
                
                if (logs.Any())
                {
                    // Удаляем все найденные логи
                    _context.ActionLogs.RemoveRange(logs);
                    await _context.SaveChangesAsync();
                }
                
                return true;
            }
            catch (Exception ex)
            {
                // Логируем ошибку
                Console.WriteLine($"Ошибка при удалении логов курса {courseId}: {ex.Message}");
                return false;
            }
        }

        // Вспомогательные методы для маппинга
        private ActionLog MapToDomainModel(ActionLogEntity entity)
        {
            return new ActionLog(
                entity.Id,
                entity.Description,
                entity.Timestamp,
                entity.UserId,
                entity.MedicineId,
                entity.CourseId,
                entity.IntakeId
            );
        }

        private ActionLogEntity MapToEntity(ActionLog actionLog)
        {
            return new ActionLogEntity
            {
                Id = actionLog.Id,
                Description = actionLog.Description,
                Timestamp = actionLog.Timestamp,
                UserId = actionLog.UserId,
                MedicineId = actionLog.MedicineId,
                CourseId = actionLog.CourseId,
                IntakeId = actionLog.IntakeId
            };
        }
    }
}