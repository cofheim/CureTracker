using CureTracker.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CureTracker.TelegramBot
{
    public class IntakeReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IntakeReminderService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Проверка каждые 5 минут

        public IntakeReminderService(
            IServiceProvider serviceProvider,
            ILogger<IntakeReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Служба напоминаний о приеме лекарств запущена");

            using var scope = _serviceProvider.CreateScope();
            var telegramService = scope.ServiceProvider.GetRequiredService<TelegramNotificationService>();
            
            // Запускаем получение обновлений от Telegram в отдельной задаче
            Task.Run(() => telegramService.StartReceivingUpdatesAsync(stoppingToken), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndSendRemindersAsync();
                    _logger.LogInformation($"Проверка напоминаний выполнена в {DateTime.UtcNow:O}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка при проверке напоминаний");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task CheckAndSendRemindersAsync()
        {
            _logger.LogInformation($"Запуск CheckAndSendRemindersAsync в {DateTime.UtcNow:O}");
            using var scope = _serviceProvider.CreateScope();
            var intakeService = scope.ServiceProvider.GetRequiredService<IIntakeService>();
            var telegramService = scope.ServiceProvider.GetRequiredService<TelegramNotificationService>();
            var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
            var courseService = scope.ServiceProvider.GetRequiredService<ICourseService>();

            // Получаем все предстоящие приемы в ближайшие 10 минут
            var upcomingIntakes = await intakeService.GetUpcomingIntakesAsync(DateTime.UtcNow, DateTime.UtcNow.AddMinutes(10));

            foreach (var intake in upcomingIntakes)
            {
                var user = await userService.GetUserById(intake.UserId);
                if (user != null && user.TelegramId.HasValue)
                {
                    var course = await courseService.GetCourseByIdAsync(intake.CourseId, intake.UserId);
                    var medicineName = course?.Medicine?.Name ?? "неизвестное лекарство";
                    var message = $"Напоминание: пора принять {medicineName}. Время: {intake.ScheduledTime:HH:mm}.";
                    await telegramService.SendNotificationAsync(user.TelegramId.Value, message, intake.Id);
                }
            }
        }
    }
} 