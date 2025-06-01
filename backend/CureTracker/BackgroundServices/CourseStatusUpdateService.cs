using CureTracker.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CureTracker.BackgroundServices
{
    public class CourseStatusUpdateService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CourseStatusUpdateService> _logger;
        private readonly TimeSpan _updateInterval = TimeSpan.FromHours(1); // Обновление каждый час

        public CourseStatusUpdateService(
            IServiceProvider serviceProvider,
            ILogger<CourseStatusUpdateService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Служба обновления статусов курсов запущена");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await UpdateCoursesStatusesAsync();
                    _logger.LogInformation("Статусы курсов успешно обновлены");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка при обновлении статусов курсов");
                }

                // Ждем до следующего обновления
                await Task.Delay(_updateInterval, stoppingToken);
            }
        }

        private async Task UpdateCoursesStatusesAsync()
        {
            // Создаем новый скоуп для DI
            using var scope = _serviceProvider.CreateScope();
            // Получаем сервис курсов из DI
            var courseService = scope.ServiceProvider.GetRequiredService<ICourseService>();
            
            // Обновляем статусы курсов
            int updatedCount = await courseService.UpdateCoursesStatusesAsync();
            
            if (updatedCount > 0)
            {
                _logger.LogInformation($"Обновлено статусов курсов: {updatedCount}");
            }
        }
    }
} 