using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using static CureTracker.Core.Enums.CourseStatusEnum;

namespace CureTracker.DataAccess.Repositories
{
    public class CourseRepository : ICourseRepository
    {
        private readonly CureTrackerDbContext _context;

        public CourseRepository(CureTrackerDbContext dbContext)
        {
            _context = dbContext;
        }

        public async Task<List<Course>> GetAllByUserIdAsync(Guid userId)
        {
            var courses = await _context.Courses
                .Where(c => c.UserId == userId)
                .Include(c => c.Medicine)
                .ToListAsync();

            return courses.Select(MapToDomainModel).ToList();
        }

        public async Task<Course?> GetByIdAsync(Guid id)
        {
            var course = await _context.Courses
                .Include(c => c.Medicine)
                .Include(c => c.Intakes)
                .FirstOrDefaultAsync(c => c.Id == id);

            return course != null ? MapToDomainModel(course) : null;
        }

        public async Task<Course> CreateAsync(Course course)
        {
            var entity = MapToEntity(course);
            _context.Courses.Add(entity);
            await _context.SaveChangesAsync();

            return MapToDomainModel(entity);
        }

        public async Task<Course> UpdateAsync(Course course)
        {
            var entity = await _context.Courses.FindAsync(course.Id);
            if (entity == null)
                throw new KeyNotFoundException($"Course with ID {course.Id} not found");

            entity.Name = course.Name;
            entity.Description = course.Description;
            entity.TimesADay = course.TimesADay;
            entity.TimesOfTaking = course.TimesOfTaking;
            entity.StartDate = course.StartDate;
            entity.EndDate = course.EndDate;
            entity.Status = course.Status;
            entity.IntakeFrequency = course.IntakeFrequency;
            entity.TakenDosesCount = course.TakenDosesCount;
            entity.SkippedDosesCount = course.SkippedDosesCount;
            entity.MedicineId = course.MedicineId;

            await _context.SaveChangesAsync();

            return MapToDomainModel(entity);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var entity = await _context.Courses.FindAsync(id);
            if (entity == null)
                return false;

            _context.Courses.Remove(entity);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<Course>> GetActiveCoursesByUserIdAsync(Guid userId)
        {
            var courses = await _context.Courses
                .Where(c => c.UserId == userId && c.Status == CourseStatus.Active)
                .Include(c => c.Medicine)
                .ToListAsync();

            return courses.Select(MapToDomainModel).ToList();
        }

        public async Task<List<Course>> GetCoursesByStatusAsync(CourseStatus status)
        {
            var courses = await _context.Courses
                .Where(c => c.Status == status)
                .Include(c => c.Medicine)
                .ToListAsync();

            return courses.Select(MapToDomainModel).ToList();
        }

        private Course MapToDomainModel(CourseEntity entity)
        {
            return new Course(
                entity.Id,
                entity.Name,
                entity.Description,
                entity.TimesADay,
                entity.TimesOfTaking,
                entity.StartDate,
                entity.EndDate,
                entity.MedicineId,
                entity.UserId,
                entity.Status,
                entity.IntakeFrequency,
                entity.TakenDosesCount,
                entity.SkippedDosesCount
            );
        }

        private CourseEntity MapToEntity(Course course)
        {
            return new CourseEntity
            {
                Id = course.Id,
                Name = course.Name,
                Description = course.Description,
                TimesADay = course.TimesADay,
                TimesOfTaking = course.TimesOfTaking,
                StartDate = course.StartDate,
                EndDate = course.EndDate,
                Status = course.Status,
                IntakeFrequency = course.IntakeFrequency,
                TakenDosesCount = course.TakenDosesCount,
                SkippedDosesCount = course.SkippedDosesCount,
                MedicineId = course.MedicineId,
                UserId = course.UserId
            };
        }
    }
}