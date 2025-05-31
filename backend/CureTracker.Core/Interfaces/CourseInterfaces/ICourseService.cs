using CureTracker.Core.Models;
using static CureTracker.Core.Enums.CourseStatusEnum;

namespace CureTracker.Core.Interfaces
{
    public interface ICourseService
    {
        Task<List<Course>> GetAllCoursesForUserAsync(Guid userId);
        Task<Course?> GetCourseByIdAsync(Guid courseId, Guid userId);
        Task<Course> CreateCourseAsync(Course course);
        Task<Course> UpdateCourseAsync(Course course);
        Task<bool> DeleteCourseAsync(Guid courseId, Guid userId);
        Task<List<Course>> GetActiveCoursesForUserAsync(Guid userId);
        Task<Course> ChangeCourseStatusAsync(Guid courseId, CourseStatus newStatus, Guid userId);
        Task<Course> GenerateIntakesForCourseAsync(Guid courseId, Guid userId);
    }
}
