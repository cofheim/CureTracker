using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.UserContracts
{
    public record LoginUserRequest([Required] string Email, string Password);
}
