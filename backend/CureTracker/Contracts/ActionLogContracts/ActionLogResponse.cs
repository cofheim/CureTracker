using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.ActionLogContracts
{
    public record ActionLogPageRequest(
        [Range(1, int.MaxValue)] int Page = 1,
        [Range(1, 100)] int PageSize = 20
    );
}
