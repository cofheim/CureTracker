using System;
using CureTracker.Core.Models;
using static CureTracker.Core.Enums.CourseStatusEnum;

namespace CureTracker.Core.Interfaces
{
    public interface ICourseRepository
    {
        Task<List<Course>> GetAllByUserIdAsync(Guid userId);
        Task<Course?> GetByIdAsync(Guid id);
        Task<Course> CreateAsync(Course course);
        Task<Course> UpdateAsync(Course course);
        Task<bool> DeleteAsync(Guid id);
        Task<List<Course>> GetActiveCoursesByUserIdAsync(Guid userId);
        Task<List<Course>> GetCoursesByStatusAsync(CourseStatus status);
    }
}
