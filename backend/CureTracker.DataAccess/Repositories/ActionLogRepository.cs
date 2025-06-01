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
                .Include(a => a.Medicine)
                .Include(a => a.Course)
                .OrderByDescending(a => a.Timestamp)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            return logs.Select(MapToDomainModel).ToList();
        }

        public async Task<ActionLog?> GetByIdAsync(Guid id)
        {
            var log = await _context.ActionLogs
                .Include(a => a.Medicine)
                .Include(a => a.Course)
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
            var query = _context.ActionLogs
                .Include(a => a.Medicine)
                .Include(a => a.Course);

            var logs = entityType.ToLower() switch
            {
                "medicine" => await query
                    .Where(a => a.MedicineId == entityId)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync(),

                "course" => await query
                    .Where(a => a.CourseId == entityId)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync(),

                "intake" => await query
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

        public async Task DeleteByMedicineIdAsync(Guid medicineId)
        {
            try
            {
                var logsToDelete = await _context.ActionLogs
                    .Where(log => log.MedicineId == medicineId)
                    .ToListAsync();

                if (logsToDelete.Any())
                {
                    _context.ActionLogs.RemoveRange(logsToDelete);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                // Логируем ошибку или обрабатываем ее соответствующим образом
                Console.WriteLine($"Ошибка при удалении логов для лекарства {medicineId}: {ex.Message}");
                // В зависимости от требований, здесь можно пробросить исключение дальше
                // throw; 
            }
        }

        public async Task ClearIntakeReferencesAsync(Guid intakeId)
        {
            var logsToUpdate = await _context.ActionLogs
                .Where(log => log.IntakeId == intakeId)
                .ToListAsync();

            if (logsToUpdate.Any())
            {
                foreach (var log in logsToUpdate)
                {
                    log.IntakeId = null;
                }
                await _context.SaveChangesAsync();
            }
        }

        // Вспомогательные методы для маппинга
        private ActionLog MapToDomainModel(ActionLogEntity entity)
        {
            var actionLog = new ActionLog(
                entity.Id,
                entity.Description,
                entity.Timestamp,
                entity.UserId,
                entity.MedicineId,
                entity.CourseId,
                entity.IntakeId
            );

            if (entity.Medicine != null)
            {
                typeof(ActionLog).GetProperty("Medicine", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actionLog, new Medicine(entity.Medicine.Id, entity.Medicine.Name, entity.Medicine.Description, entity.Medicine.DosagePerTake, entity.Medicine.StorageConditions, entity.Medicine.Type, entity.Medicine.UserId));
            }

            if (entity.Course != null)
            {
                typeof(ActionLog).GetProperty("Course", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actionLog, new Course(entity.Course.Id, entity.Course.Name, entity.Course.Description, entity.Course.TimesADay, entity.Course.TimesOfTaking, entity.Course.StartDate, entity.Course.EndDate, entity.Course.MedicineId, entity.Course.UserId, entity.Course.Status, entity.Course.IntakeFrequency, entity.Course.TakenDosesCount, entity.Course.SkippedDosesCount));
            }
            
            return actionLog;
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