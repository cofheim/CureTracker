using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using static CureTracker.Core.Enums.IntakeStatusEnum;

namespace CureTracker.DataAccess.Repositories
{
    public class IntakeRepository : IIntakeRepository
    {
        private readonly CureTrackerDbContext _context;

        public IntakeRepository(CureTrackerDbContext dbContext)
        {
            _context = dbContext;
        }

        public async Task<List<Intake>> GetAllByCourseIdAsync(Guid courseId)
        {
            var intakes = await _context.Intakes
                .Where(i => i.CourseId == courseId)
                .OrderBy(i => i.ScheduledTime)
                .ToListAsync();

            return intakes.Select(MapToDomainModel).ToList();
        }

        public async Task<Intake?> GetByIdAsync(Guid id)
        {
            var intake = await _context.Intakes
                .Include(i => i.Course)
                .FirstOrDefaultAsync(i => i.Id == id);

            return intake != null ? MapToDomainModel(intake) : null;
        }

        public async Task<Intake> CreateAsync(Intake intake)
        {
            var entity = MapToEntity(intake);
            _context.Intakes.Add(entity);
            await _context.SaveChangesAsync();

            return MapToDomainModel(entity);
        }

        public async Task<Intake> UpdateAsync(Intake intake)
        {
            var entity = await _context.Intakes.FindAsync(intake.Id);
            if (entity == null)
                throw new KeyNotFoundException($"Intake with ID {intake.Id} not found");

            entity.ScheduledTime = intake.ScheduledTime;
            entity.ActualTime = intake.ActualTime;
            entity.Status = intake.Status;
            entity.SkipReason = intake.Status == IntakeStatus.Skipped ? entity.SkipReason : null;

            await _context.SaveChangesAsync();

            return MapToDomainModel(entity);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var entity = await _context.Intakes.FindAsync(id);
            if (entity == null)
                return false;

            _context.Intakes.Remove(entity);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<Intake>> GetScheduledIntakesByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            var intakes = await _context.Intakes
                .Where(i => i.UserId == userId &&
                           i.ScheduledTime >= startDate &&
                           i.ScheduledTime <= endDate)
                .Include(i => i.Course)
                .ThenInclude(c => c.Medicine)
                .OrderBy(i => i.ScheduledTime)
                .ToListAsync();

            return intakes.Select(MapToDomainModel).ToList();
        }

        private Intake MapToDomainModel(IntakeEntity entity)
        {
            return new Intake(
                entity.Id,
                entity.ScheduledTime,
                entity.ActualTime,
                entity.Status,
                entity.CourseId,
                entity.UserId
            );
        }

        private IntakeEntity MapToEntity(Intake intake)
        {
            return new IntakeEntity
            {
                Id = intake.Id,
                ScheduledTime = intake.ScheduledTime,
                ActualTime = intake.ActualTime,
                Status = intake.Status,
                CourseId = intake.CourseId,
                UserId = intake.UserId,
                SkipReason = null
            };
        }

        public async Task<bool> SetSkipReasonAsync(Guid intakeId, string skipReason)
        {
            var entity = await _context.Intakes.FindAsync(intakeId);
            if (entity == null)
                return false;

            entity.SkipReason = skipReason;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}