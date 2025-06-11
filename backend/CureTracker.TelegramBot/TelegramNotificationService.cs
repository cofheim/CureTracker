using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text;
using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;

namespace CureTracker.TelegramBot
{
    public class TelegramNotificationService
    {
        private readonly TelegramBotClient _botClient;
        private readonly ILogger<TelegramNotificationService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public TelegramNotificationService(
            IConfiguration configuration,
            ILogger<TelegramNotificationService> logger,
            IServiceScopeFactory scopeFactory)
        {
            var token = configuration.GetSection("TelegramBot:Token").Value;
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogError("Telegram Bot Token is not configured.");
                throw new ArgumentNullException(nameof(token), "Telegram Bot Token cannot be null or empty.");
            }
            _botClient = new TelegramBotClient(token);
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task SendNotificationAsync(long chatId, string message, Guid intakeId)
        {
            try
            {
                var inlineKeyboard = new InlineKeyboardMarkup(new[]
                {
                    new []
                    {
                        InlineKeyboardButton.WithCallbackData(text: "Принято", callbackData: $"intake_taken_{intakeId}"),
                        InlineKeyboardButton.WithCallbackData(text: "Пропущено", callbackData: $"intake_skipped_{intakeId}"),
                    }
                });

                await _botClient.SendMessage(
                    chatId: chatId,
                    text: message,
                    replyMarkup: inlineKeyboard,
                    cancellationToken: default);

                _logger.LogInformation($"Уведомление с кнопками для intakeId {intakeId} успешно отправлено пользователю с ID {chatId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при отправке уведомления с кнопками для intakeId {intakeId} пользователю с ID {chatId}");
            }
        }

        public Task StartReceivingUpdatesAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Запуск получения обновлений от Telegram (StartReceiving)");
            var receiverOptions = new ReceiverOptions
            {
                AllowedUpdates = Array.Empty<UpdateType>()
            };
            _botClient.StartReceiving(
                updateHandler: UpdateHandler,
                errorHandler: ErrorHandler,
                receiverOptions: receiverOptions,
                cancellationToken: cancellationToken
            );
            _logger.LogInformation("Получение обновлений от Telegram запущено.");
            return Task.CompletedTask;
        }

        private async Task UpdateHandler(ITelegramBotClient client, Update update, CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
            var intakeService = scope.ServiceProvider.GetRequiredService<IIntakeService>();
            var medicineService = scope.ServiceProvider.GetRequiredService<IMedicineService>();
            var courseService = scope.ServiceProvider.GetRequiredService<ICourseService>();
            var actionLogService = scope.ServiceProvider.GetRequiredService<IActionLogService>();

            if (update.Type == UpdateType.Message && update.Message?.Text != null)
            {
                var message = update.Message;
                var chatId = message.Chat.Id;
                var text = message.Text;

                _logger.LogInformation($"Получено сообщение от {chatId}: {text}");

                var user = await userService.GetUserByTelegramId(chatId);

                if (user != null)
                {
                    // Authenticated User Logic
                    if (text.StartsWith("/start"))
                    {
                        await SendMainMenu(chatId, $"Добро пожаловать, {user.Name}! Чем я могу помочь?", cancellationToken);
                    }
                    else
                    {
                        switch (text)
                        {
                            case "💊 Лекарства":
                                await SendMedicinesList(chatId, user.Id, medicineService, cancellationToken);
                                break;
                            case "Приёмы на сегодня":
                                await SendTodayIntakes(chatId, user, intakeService, courseService, cancellationToken);
                                break;
                            case "❓ Помощь":
                                await SendHelpMessage(chatId, cancellationToken);
                                break;
                            case "📜 История действий":
                                await SendActionHistoryOptions(chatId, cancellationToken);
                                break;
                            default:
                                await _botClient.SendMessage(chatId, "Неизвестная команда. Пожалуйста, используйте меню.", cancellationToken: cancellationToken);
                                break;
                        }
                    }
                }
                else
                {
                    // Unauthenticated User Logic
                    if (text.StartsWith("/start"))
                    {
                        var inlineKeyboard = new InlineKeyboardMarkup(new[]
                        {
                            InlineKeyboardButton.WithCallbackData(text: "Как привязать аккаунт?", callbackData: "how_to_link")
                        });
                        await _botClient.SendMessage(chatId, "Добро пожаловать в CureTracker Bot! Пожалуйста, привяжите ваш аккаунт, чтобы начать.", replyMarkup: inlineKeyboard, cancellationToken: cancellationToken);
                    }
                    else if (text == "❓ Помощь")
                    {
                        await SendHelpMessage(chatId, cancellationToken);
                    }
                    else if (text == "💊 Лекарства" || text == "Приёмы на сегодня" || text == "📜 История действий")
                    {
                         await _botClient.SendMessage(chatId, "Сначала привяжите ваш аккаунт. Нажмите /start, чтобы получить инструкцию.", cancellationToken: cancellationToken);
                    }
                    else
                    {
                        // Assume it's a connection code
                        var code = text.Trim();
                        var userByCode = await userService.GetUserByConnectionCodeAsync(code);
                        if (userByCode != null)
                        {
                            try
                            {
                                await userService.UpdateUserTelegramId(userByCode.Id, chatId);
                                await _botClient.SendMessage(
                                    chatId: chatId,
                                    text: "Ваш аккаунт успешно связан с CureTracker!",
                                    cancellationToken: cancellationToken);
                                await SendMainMenu(chatId, "Чем я могу помочь?", cancellationToken);
                                _logger.LogInformation($"Аккаунт пользователя {userByCode.Id} связан с Telegram ID {chatId}");
                            }
                            catch (Core.Exceptions.TelegramIdAlreadyLinkedException ex)
                            {
                                _logger.LogWarning(ex, $"Попытка привязать уже связанный Telegram ID {chatId} к пользователю {userByCode.Id}");
                                await _botClient.SendMessage(
                                    chatId: chatId,
                                    text: "Этот Telegram-аккаунт уже привязан к другому пользователю.",
                                    cancellationToken: cancellationToken);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Ошибка при обновлении Telegram ID для пользователя {userByCode.Id}");
                                await _botClient.SendMessage(
                                    chatId: chatId,
                                    text: "Произошла ошибка при попытке связать ваш аккаунт.",
                                    cancellationToken: cancellationToken);
                            }
                        }
                        else
                        {
                            await _botClient.SendMessage(chatId, "Неверный код. Пожалуйста, проверьте код и попробуйте снова, или нажмите /start для помощи.", cancellationToken: cancellationToken);
                        }
                    }
                }
            }
            else if (update.Type == UpdateType.CallbackQuery && update.CallbackQuery != null)
            {
                var callbackQuery = update.CallbackQuery;
                var chatId = callbackQuery.Message.Chat.Id;
                var callbackData = callbackQuery.Data;

                var user = await userService.GetUserByTelegramId(chatId);
                if (user == null)
                {
                    // Handle unauthenticated user trying to use callbacks for authenticated features
                    if(callbackData == "how_to_link")
                    {
                         await _botClient.AnswerCallbackQuery(callbackQuery.Id, cancellationToken: cancellationToken);
                         await SendLinkingInstructions(chatId, cancellationToken);
                    }
                    else
                    {
                        await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Пожалуйста, сначала привяжите ваш аккаунт.", showAlert: true, cancellationToken: cancellationToken);
                    }
                    return;
                }
                
                _logger.LogInformation($"Получен CallbackQuery от {chatId} с данными: {callbackData}");

                if (callbackData == "history_by_medicine")
                {
                    await SendMedicineSelectionForHistory(chatId, user.Id, medicineService, cancellationToken);
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, cancellationToken: cancellationToken);
                    return;
                }

                if (callbackData == "history_by_course")
                {
                    await SendCourseSelectionForHistory(chatId, user.Id, courseService, cancellationToken);
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, cancellationToken: cancellationToken);
                    return;
                }

                if (callbackData.StartsWith("history_medicine_"))
                {
                    var medicineId = Guid.Parse(callbackData.Split('_')[2]);
                    await SendActionLogs(chatId, user, "medicine", medicineId, actionLogService, cancellationToken);
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, cancellationToken: cancellationToken);
                    return;
                }

                if (callbackData.StartsWith("history_course_"))
                {
                    var courseId = Guid.Parse(callbackData.Split('_')[2]);
                    await SendActionLogs(chatId, user, "course", courseId, actionLogService, cancellationToken);
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, cancellationToken: cancellationToken);
                    return;
                }

                if (callbackData == "how_to_link")
                {
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, cancellationToken: cancellationToken);
                    await SendLinkingInstructions(chatId, cancellationToken);
                    return;
                }
                
                if (callbackData.StartsWith("intake_taken_"))
                {
                    var intakeIdStr = callbackData.Split('_').Last();
                    if (Guid.TryParse(intakeIdStr, out var intakeId))
                    {
                        try
                        {
                            await intakeService.MarkIntakeAsTakenAsync(intakeId, user.Id);
                            await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Приём отмечен как 'Принято'", cancellationToken: cancellationToken);
                            await _botClient.EditMessageText(chatId, callbackQuery.Message.MessageId, "Приём отмечен как 'Принято'", cancellationToken: cancellationToken);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Ошибка при отметке приёма {intakeId} как 'Принято' для пользователя {user.Id}");
                            await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка при обновлении статуса.", showAlert: true, cancellationToken: cancellationToken);
                        }
                    }
                    return;
                }

                if (callbackData.StartsWith("intake_skipped_"))
                {
                    var intakeIdStr = callbackData.Split('_').Last();
                    if (Guid.TryParse(intakeIdStr, out var intakeId))
                    {
                        try
                        {
                            await intakeService.MarkIntakeAsSkippedAsync(intakeId, "Пропущено через Telegram", user.Id);
                            await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Приём отмечен как 'Пропущено'", cancellationToken: cancellationToken);
                            await _botClient.EditMessageText(chatId, callbackQuery.Message.MessageId, "Приём отмечен как 'Пропущено'", cancellationToken: cancellationToken);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Ошибка при отметке приёма {intakeId} как 'Пропущено' для пользователя {user.Id}");
                            await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка при обновлении статуса.", showAlert: true, cancellationToken: cancellationToken);
                        }
                    }
                    return;
                }
            }
        }
        
        private async Task SendMainMenu(long chatId, string text, CancellationToken cancellationToken)
        {
            var replyKeyboardMarkup = new ReplyKeyboardMarkup(new[]
            {
                new KeyboardButton[] { "Приёмы на сегодня", "💊 Лекарства" },
                new KeyboardButton[] { "📜 История действий", "❓ Помощь" }
            })
            {
                ResizeKeyboard = true
            };

            await _botClient.SendMessage(chatId, text, replyMarkup: replyKeyboardMarkup, cancellationToken: cancellationToken);
        }

        private async Task SendMedicinesList(long chatId, Guid userId, IMedicineService medicineService, CancellationToken cancellationToken)
        {
            var medicines = await medicineService.GetMedicinesByUserId(userId);
            var text = new StringBuilder("Ваши лекарства:\n\n");
            foreach (var med in medicines)
            {
                text.AppendLine($"- {med.Name}");
            }
            await _botClient.SendMessage(chatId, text.ToString(), cancellationToken: cancellationToken);
        }

        private async Task SendTodayIntakes(long chatId, Core.Models.User user, IIntakeService intakeService, ICourseService courseService, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation($"Запрос приемов на сегодня для пользователя {user.Id} с часовым поясом {user.TimeZoneId}");
                
                var userTimeZone = TimeZoneInfo.FindSystemTimeZoneById(user.TimeZoneId ?? "UTC");
                
                // Рассчитываем начало и конец дня в часовом поясе пользователя
                var nowInUserTz = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, userTimeZone);
                var startOfDayInUserTz = nowInUserTz.Date;
                var endOfDayInUserTz = startOfDayInUserTz.AddDays(1).AddTicks(-1);

                // Конвертируем в UTC для запроса к БД
                var startDateUtc = TimeZoneInfo.ConvertTimeToUtc(startOfDayInUserTz, userTimeZone);
                var endDateUtc = TimeZoneInfo.ConvertTimeToUtc(endOfDayInUserTz, userTimeZone);

                var intakes = await intakeService.GetScheduledIntakesForDateRangeAsync(user.Id, startDateUtc, endDateUtc);

                if (!intakes.Any())
                {
                    await _botClient.SendMessage(chatId, "На сегодня приёмов не запланировано.", cancellationToken: cancellationToken);
                    return;
                }

                var sb = new StringBuilder("Приёмы на сегодня:\n\n");
                foreach (var intake in intakes.OrderBy(i => i.ScheduledTime))
                {
                    var course = await courseService.GetCourseByIdAsync(intake.CourseId, user.Id);
                    var localIntakeTime = TimeZoneInfo.ConvertTimeFromUtc(intake.ScheduledTime, userTimeZone);
                    sb.AppendLine($"*{(course?.Name ?? "Курс не найден")}*");
                    sb.AppendLine($"Время: {localIntakeTime:HH:mm}");
                    sb.AppendLine($"Статус: {TranslateIntakeStatus(intake.Status)}");
                    sb.AppendLine("-----");
                }

                await _botClient.SendMessage(chatId, sb.ToString(), ParseMode.Markdown, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении приёмов для пользователя {user.Id}");
                await _botClient.SendMessage(chatId, "Произошла ошибка при получении приёмов. Пожалуйста, попробуйте позже.", cancellationToken: cancellationToken);
            }
        }

        private string GetLinkingInstructionsText()
        {
            return "Чтобы привязать ваш аккаунт CureTracker к этому боту, выполните следующие действия:\n\n" +
                   "1. Войдите в ваш аккаунт на сайте CureTracker.\n" +
                   "2. Перейдите в раздел 'Профиль'.\n" +
                   "3. Нажмите кнопку 'Сгенерировать код' в разделе 'Подключение Telegram'.\n" +
                   "4. Скопируйте полученный код и отправьте его мне в этот чат.\n\n" +
                   "После этого ваш аккаунт будет связан, и вы сможете получать уведомления и управлять курсами прямо из Telegram.";
        }

        private async Task SendLinkingInstructions(long chatId, CancellationToken cancellationToken)
        {
            await _botClient.SendMessage(chatId, GetLinkingInstructionsText(), cancellationToken: cancellationToken);
        }
        
        private async Task SendHelpMessage(long chatId, CancellationToken cancellationToken)
        {
            var helpText = "Я бот CureTracker, ваш помощник для контроля за приёмом лекарств.\n\n" +
                           "Используйте кнопки меню для взаимодействия со мной:\n" +
                           "🔹 *Приёмы на сегодня* - посмотреть все запланированные приёмы на сегодня.\n" +
                           "🔹 *Лекарства* - (в разработке) управление списком ваших лекарств.\n" +
                           "🔹 *История действий* - посмотреть историю ваших действий.\n" +
                           "🔹 *Помощь* - показать это сообщение.\n\n" +
                           "Для привязки или отвязки аккаунта, воспользуйтесь инструкцией:\n" +
                           GetLinkingInstructionsText();
            await _botClient.SendMessage(chatId, helpText, ParseMode.Markdown, cancellationToken: cancellationToken);
        }
        
        private async Task SendActionHistoryOptions(long chatId, CancellationToken cancellationToken)
        {
            var inlineKeyboard = new InlineKeyboardMarkup(new[]
            {
                new[] { InlineKeyboardButton.WithCallbackData("По лекарству", "history_by_medicine") },
                new[] { InlineKeyboardButton.WithCallbackData("По курсу", "history_by_course") },
            });
            await _botClient.SendMessage(chatId, "Как вы хотите отфильтровать историю?", replyMarkup: inlineKeyboard, cancellationToken: cancellationToken);
        }

        private async Task SendMedicineSelectionForHistory(long chatId, Guid userId, IMedicineService medicineService, CancellationToken cancellationToken)
        {
            var medicines = await medicineService.GetMedicinesByUserId(userId);
            if (!medicines.Any())
            {
                await _botClient.SendMessage(chatId, "У вас нет лекарств для просмотра истории.", cancellationToken: cancellationToken);
                return;
            }

            var buttons = medicines.Select(m => new[] { InlineKeyboardButton.WithCallbackData(m.Name, $"history_medicine_{m.Id}") }).ToArray();
            var inlineKeyboard = new InlineKeyboardMarkup(buttons);

            await _botClient.SendMessage(chatId, "Выберите лекарство для просмотра истории:", replyMarkup: inlineKeyboard, cancellationToken: cancellationToken);
        }

        private async Task SendCourseSelectionForHistory(long chatId, Guid userId, ICourseService courseService, CancellationToken cancellationToken)
        {
            var courses = await courseService.GetAllCoursesForUserAsync(userId);
            if (courses.Any())
            {
                var buttons = courses.Select(c => InlineKeyboardButton.WithCallbackData(c.Name, $"history_course_{c.Id}")).ToList();
                var inlineKeyboard = new InlineKeyboardMarkup(buttons.Select(b => new[] { b }));
                await _botClient.SendMessage(chatId, "Выберите курс для просмотра истории:", replyMarkup: inlineKeyboard, cancellationToken: cancellationToken);
            }
            else
            {
                await _botClient.SendMessage(chatId, "У вас нет добавленных курсов.", cancellationToken: cancellationToken);
            }
        }
        
        private async Task SendActionLogs(long chatId, Core.Models.User user, string entityType, Guid entityId, IActionLogService actionLogService, CancellationToken cancellationToken)
        {
            try
            {
                var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(user.TimeZoneId ?? "UTC");
                var logs = await actionLogService.GetRelatedEntityLogsAsync(entityId, entityType, user.Id);
                
                if (!logs.Any())
                {
                    await _botClient.SendMessage(chatId, "История действий для выбранной сущности пуста.", cancellationToken: cancellationToken);
                    return;
                }

                var sb = new StringBuilder("История действий:\n");
                foreach (var log in logs.OrderByDescending(l => l.Timestamp))
                {
                    var localTime = TimeZoneInfo.ConvertTimeFromUtc(log.Timestamp, timeZoneInfo);
                    sb.AppendLine($"{localTime:dd.MM.yyyy HH:mm} - {log.Description}");
                }

                await _botClient.SendMessage(chatId, sb.ToString(), cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении истории действий для пользователя {user.Id}");
                await _botClient.SendMessage(chatId, "Произошла ошибка при получении истории действий. Пожалуйста, попробуйте позже.", cancellationToken: cancellationToken);
            }
        }
        
        private string TranslateIntakeStatus(Core.Enums.IntakeStatusEnum.IntakeStatus status)
        {
            return status switch
            {
                Core.Enums.IntakeStatusEnum.IntakeStatus.Scheduled => "Запланировано",
                Core.Enums.IntakeStatusEnum.IntakeStatus.Taken => "Принято",
                Core.Enums.IntakeStatusEnum.IntakeStatus.Skipped => "Пропущено",
                Core.Enums.IntakeStatusEnum.IntakeStatus.Missed => "Пропущено",
                _ => status.ToString()
            };
        }

        private Task ErrorHandler(ITelegramBotClient client, Exception exception, CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Произошла ошибка в Telegram Bot");
            return Task.CompletedTask;
        }
    }
}