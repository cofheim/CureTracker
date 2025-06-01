using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;
using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.CoursesContracts
{
    public record UpdateCourseRequest(
        [Required][MaxLength(50)] string Name,
        [MaxLength(250)] string Description,
        [Range(1, 10)] int TimesADay,
        [Required] List<string> TimesOfTaking,
        [Required] DateTime StartDate,
        [Required] DateTime EndDate,
        IntakeFrequency IntakeFrequency
    );
}
