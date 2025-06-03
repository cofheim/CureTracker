using System;

namespace CureTracker.Core.Exceptions
{
    public class TelegramIdAlreadyLinkedException : Exception
    {
        public TelegramIdAlreadyLinkedException(long telegramId) 
            : base($"Telegram ID '{telegramId}' is already linked to another user.")
        {
        }

        public TelegramIdAlreadyLinkedException(long telegramId, Exception innerException) 
            : base($"Telegram ID '{telegramId}' is already linked to another user.", innerException)
        {
        }
    }
} 