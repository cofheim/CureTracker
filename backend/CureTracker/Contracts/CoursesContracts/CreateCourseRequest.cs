using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;
using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.CoursesContracts
{
    public record CreateCourseRequest(
        [Required][MaxLength(50)] string Name,
        [MaxLength(250)] string Description,
        [Range(1, 10)] int TimesADay,
        [Required] List<string> TimesOfTaking,
        [Required] DateTime StartDate,
        [Required] DateTime EndDate,
        [Required] Guid MedicineId,
        IntakeFrequency IntakeFrequency = IntakeFrequency.Daily
    );
}
