namespace CureTracker.Contracts.UserContracts
{
    public record UpdateProfileRequest(
        string Name,
        string Email,
        string? TimeZoneId
    );
} 