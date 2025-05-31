using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.IntakesContracts
{
    public record IntakesByDateRangeRequest(
        [Required] DateTime StartDate,
        [Required] DateTime EndDate
    );
}
