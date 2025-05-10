using CureTracker.Core.Models;

namespace CureTracker.Core.Interfaces;

public interface IJwtProvider
{
    string GenerateToken(User user);
}