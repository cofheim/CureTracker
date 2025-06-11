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
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

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

            var upcomingIntakes = await intakeService.GetUpcomingIntakesAsync(DateTime.UtcNow, DateTime.UtcNow.AddMinutes(10));

            foreach (var intake in upcomingIntakes)
            {
                var user = await userService.GetUserById(intake.UserId);
                if (user != null && user.TelegramId.HasValue)
                {
                    var course = await courseService.GetCourseByIdAsync(intake.CourseId, intake.UserId);
                    var medicineName = course?.Medicine?.Name ?? "неизвестное лекарство";
                    
                    DateTime displayTime = intake.ScheduledTime;
                    if (!string.IsNullOrEmpty(user.TimeZoneId))
                    {
                        try
                        {
                            TimeZoneInfo userTimeZone = TimeZoneInfo.FindSystemTimeZoneById(user.TimeZoneId);
                            displayTime = TimeZoneInfo.ConvertTimeFromUtc(intake.ScheduledTime, userTimeZone);
                        }
                        catch (TimeZoneNotFoundException)
                        {
                            _logger.LogWarning($"Часовой пояс с ID '{user.TimeZoneId}' для пользователя {user.Id} не найден. Используется UTC.");
                        }
                        catch (InvalidTimeZoneException)
                        {
                             _logger.LogWarning($"Часовой пояс с ID '{user.TimeZoneId}' для пользователя {user.Id} поврежден. Используется UTC.");
                        }
                    }
                    
                    var message = $"Напоминание: пора принять {medicineName}. Время: {displayTime:HH:mm}.";
                    await telegramService.SendNotificationAsync(user.TelegramId.Value, message, intake.Id);
                }
            }
        }
    }
} 