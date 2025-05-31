namespace CureTracker.Contracts.UserContracts
{
    public record UserResponse(Guid Id, 
        string Name, 
        string Email, 
        long? TelegramId = null);
}
