using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts.UserContracts
{
    public record RegisterUserRequest([Required] string UserName, string Password, string Email);
}
