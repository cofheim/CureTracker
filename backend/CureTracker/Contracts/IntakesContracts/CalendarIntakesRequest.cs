using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.IntakesContracts
{
    public record CalendarIntakesRequest(
        [Required] DateTime StartDate,
        [Required] DateTime EndDate
    );
} 