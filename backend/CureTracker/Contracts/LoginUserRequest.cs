using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts
{
    public record LoginUserRequest([Required] string Email, string Password);
}
