using CureTracker.TelegramBot;

namespace CureTracker.BackgroundServices
{
    public class TelegramBotHostedService : IHostedService
    {
        private readonly TelegramNotificationService _telegramNotificationService;
        private CancellationTokenSource _cancellationTokenSource;

        public TelegramBotHostedService(TelegramNotificationService telegramNotificationService)
        {
            _telegramNotificationService = telegramNotificationService;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _cancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            return _telegramNotificationService.StartReceivingUpdatesAsync(_cancellationTokenSource.Token);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _cancellationTokenSource?.Cancel();
            return Task.CompletedTask;
        }
    }
} 