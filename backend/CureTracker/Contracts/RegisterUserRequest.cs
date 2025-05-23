using System.ComponentModel.DataAnnotations;

namespace CureTracker.Contracts
{
    public record RegisterUserRequest([Required] string UserName, string Password, string Email);
}
