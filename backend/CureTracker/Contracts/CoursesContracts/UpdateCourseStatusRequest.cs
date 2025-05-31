using static CureTracker.Core.Enums.CourseStatusEnum;
using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.CoursesContracts
{
    public record UpdateCourseStatusRequest(
        [Required] CourseStatus Status
    );
}
