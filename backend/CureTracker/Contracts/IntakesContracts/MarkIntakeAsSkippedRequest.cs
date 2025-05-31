using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.IntakesContracts
{
    public record MarkIntakeAsSkippedRequest(
        [MaxLength(250)] string SkipReason
    );
}
