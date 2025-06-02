namespace CureTracker.Contracts.UserContracts
{
    public record UserRequest(string Name,
        string Email,
        string PasswordHash,
        string? TimeZoneId,
        long? TelegramId = null);
}
