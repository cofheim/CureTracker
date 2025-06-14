using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.ActionLogContracts
{
    public record RelatedEntityLogsRequest(
        [Required] Guid EntityId,
        [Required] string EntityType
    );
}
