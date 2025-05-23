namespace CureTracker.Contracts
{
    public record UserRequest(string Name,
        string Email,
        string PasswordHash,
        long? TelegramId = null);
}
