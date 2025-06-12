using CureTracker.Core.Interfaces;

namespace CureTracker.BackgroundServices
{
    public class ActionLogCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ActionLogCleanupService> _logger;

        public ActionLogCleanupService(IServiceProvider serviceProvider, ILogger<ActionLogCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ActionLog Cleanup Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var actionLogRepository = scope.ServiceProvider.GetRequiredService<IActionLogRepository>();
                        
                        var cutoffDate = DateTime.UtcNow.AddDays(-90);
                        
                        _logger.LogInformation("Running ActionLog cleanup for entries older than {CutoffDate}", cutoffDate);

                        await actionLogRepository.DeleteLogsOlderThanAsync(cutoffDate);
                        
                        _logger.LogInformation("ActionLog cleanup finished successfully.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while cleaning up action logs.");
                }

                // Wait for 24 hours before running again
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }

            _logger.LogInformation("ActionLog Cleanup Service is stopping.");
        }
    }
} 