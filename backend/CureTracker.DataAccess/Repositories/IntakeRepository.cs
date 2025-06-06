﻿using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using static CureTracker.Core.Enums.IntakeStatusEnum;
using static CureTracker.Core.Enums.MedicineTypeEnum;

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
                .Include(i => i.Course)
                .ThenInclude(c => c.Medicine)
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

        public async Task<List<Intake>> GetAllUserIntakesForPeriodAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            var intakes = await _context.Intakes
                .Where(i => i.UserId == userId && 
                            i.ScheduledTime >= startDate && 
                            i.ScheduledTime <= endDate)
                .Include(i => i.Course)
                    .ThenInclude(c => c!.Medicine)
                .OrderBy(i => i.ScheduledTime)
                .ToListAsync();

            return intakes.Select(MapToDomainModel).ToList();
        }

        public async Task<List<Intake>> GetUpcomingIntakesAsync(DateTime startTime, DateTime endTime)
        {
            var entities = await _context.Intakes
                .AsNoTracking()
                .Where(i => i.ScheduledTime >= startTime && i.ScheduledTime <= endTime && i.Status == IntakeStatus.Scheduled)
                .ToListAsync();
            return entities.Select(MapToDomainModel).ToList();
        }

        private Intake MapToDomainModel(IntakeEntity entity)
        {
            var intake = new Intake(
                entity.Id,
                entity.ScheduledTime,
                entity.ActualTime,
                entity.Status,
                entity.CourseId,
                entity.UserId
            );
            
            if (entity.Course != null)
            {
                var course = new Course(
                    entity.Course.Id,
                    entity.Course.Name,
                    entity.Course.Description,
                    entity.Course.TimesADay,
                    entity.Course.TimesOfTaking,
                    entity.Course.StartDate,
                    entity.Course.EndDate,
                    entity.Course.MedicineId,
                    entity.Course.UserId,
                    entity.Course.Status,
                    entity.Course.IntakeFrequency,
                    entity.Course.TakenDosesCount,
                    entity.Course.SkippedDosesCount
                );
                
                if (entity.Course.Medicine != null)
                {
                    var medicine = new Medicine(
                        entity.Course.Medicine.Id,
                        entity.Course.Medicine.Name,
                        entity.Course.Medicine.Description,
                        entity.Course.Medicine.DosagePerTake,
                        entity.Course.Medicine.StorageConditions,
                        entity.Course.Medicine.Type,
                        entity.Course.Medicine.UserId
                    );
                    
                    typeof(Course).GetProperty("Medicine")?.SetValue(course, medicine);
                }
                
                typeof(Intake).GetProperty("Course")?.SetValue(intake, course);
            }
            
            return intake;
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