namespace CureTracker.Contracts
{
    public record UserResponse(Guid Id, 
        string Name, 
        string Email, 
        long? TelegramId = null);
}
