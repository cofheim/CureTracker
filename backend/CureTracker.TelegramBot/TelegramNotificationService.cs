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
using static CureTracker.Core.Enums.IntakeStatusEnum;

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

            if (update.Type == UpdateType.Message && update.Message?.Text != null)
            {
                var message = update.Message;
                var chatId = message.Chat.Id;
                var text = message.Text;

                _logger.LogInformation($"Получено сообщение от {chatId}: {text}");

                var user = await userService.GetUserByTelegramId(chatId);

                if (text.StartsWith("/start"))
                {
                    if (user != null)
                    {
                        await SendMainMenu(chatId, $"Добро пожаловать, {user.Name}! Чем я могу помочь?", cancellationToken);
                    }
                    else
                    {
                        await _botClient.SendMessage(chatId, "Добро пожаловать в CureTracker Bot! Пожалуйста, введите код связи, который вы получили в приложении CureTracker.", cancellationToken: cancellationToken);
                    }
                }
                else if (user == null)
                {
                    var code = text.Trim();
                    var userByCode = await userService.GetUserByConnectionCodeAsync(code);
                    if (userByCode != null)
                    {
                        try
                        {
                            await userService.UpdateUserTelegramId(userByCode.Id, chatId);
                            await _botClient.SendMessage(
                                chatId: chatId,
                                text: "Ваш аккаунт успешно связан с CureTracker! Теперь вы будете получать напоминания о приеме лекарств.",
                                cancellationToken: cancellationToken);
                            await SendMainMenu(chatId, "Чем я могу помочь?", cancellationToken);
                            _logger.LogInformation($"Аккаунт пользователя {userByCode.Id} связан с Telegram ID {chatId}");
                        }
                        catch (Core.Exceptions.TelegramIdAlreadyLinkedException ex)
                        {
                            _logger.LogWarning(ex, $"Попытка привязать уже связанный Telegram ID {chatId} к пользователю {userByCode.Id}");
                            await _botClient.SendMessage(
                                chatId: chatId,
                                text: "Этот Telegram-аккаунт уже привязан к другому пользователю в системе. Если вы хотите привязать его к текущему аккаунту CureTracker, сначала отвяжите его от предыдущего в настройках того аккаунта или обратитесь в поддержку.",
                                cancellationToken: cancellationToken);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Ошибка при обновлении Telegram ID для пользователя {userByCode.Id}");
                            await _botClient.SendMessage(
                                chatId: chatId,
                                text: "Произошла ошибка при попытке связать ваш аккаунт. Пожалуйста, попробуйте позже или обратитесь в поддержку.",
                                cancellationToken: cancellationToken);
                        }
                    }
                    else
                    {
                        await _botClient.SendMessage(chatId, "Неверный код. Пожалуйста, проверьте код в приложении CureTracker и попробуйте снова.", cancellationToken: cancellationToken);
                    }
                }
                else // User is authenticated, process menu commands
                {
                    switch (text)
                    {
                        case "💊 Лекарства":
                            await SendMedicinesList(chatId, user.Id, medicineService, cancellationToken);
                            break;
                        case "Приёмы на сегодня":
                            await SendTodayIntakes(chatId, user.Id, intakeService, courseService, cancellationToken);
                            break;
                        case "❓ Помощь":
                            await SendHelpMessage(chatId, cancellationToken);
                            break;
                        case "🗑️ Очистить чат":
                            await _botClient.SendMessage(chatId, "История очищена.", replyMarkup: new ReplyKeyboardRemove(), cancellationToken: cancellationToken);
                            await SendMainMenu(chatId, "Чем я могу помочь?", cancellationToken);
                            break;
                        default:
                            await _botClient.SendMessage(chatId, "Неизвестная команда. Пожалуйста, используйте меню.", cancellationToken: cancellationToken);
                            break;
                    }
                }
            }
            else if (update.Type == UpdateType.CallbackQuery && update.CallbackQuery != null)
            {
                var callbackQuery = update.CallbackQuery;
                var chatId = callbackQuery.Message.Chat.Id;
                var callbackData = callbackQuery.Data;

                _logger.LogInformation($"Получен CallbackQuery от {chatId} с данными: {callbackData}");

                if (string.IsNullOrEmpty(callbackData))
                {
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка: Пустые данные обратного вызова.", cancellationToken: cancellationToken);
                    return;
                }

                var parts = callbackData.Split('_');
                if (parts.Length != 3 || !parts[0].Equals("intake"))
                {
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка: Неверный формат данных обратного вызова.", cancellationToken: cancellationToken);
                    _logger.LogWarning($"Неверный формат callbackData: {callbackData}");
                    return;
                }

                var action = parts[1];
                if (!Guid.TryParse(parts[2], out var intakeId))
                {
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка: Неверный ID приема.", cancellationToken: cancellationToken);
                    _logger.LogWarning($"Не удалось распарсить intakeId из callbackData: {callbackData}");
                    return;
                }

                try
                {
                    long telegramChatId = callbackQuery.From.Id;
                    var appUser = await userService.GetUserByTelegramId(telegramChatId);

                    if (appUser == null)
                    {
                        await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка: Ваш Telegram аккаунт не связан с пользователем в системе.", cancellationToken: cancellationToken, showAlert: true);
                        _logger.LogWarning($"Пользователь с Telegram ID {telegramChatId} не найден в системе для callbackData: {callbackData}");
                        return;
                    }

                    var intake = await intakeService.GetIntakeByIdAsync(intakeId, appUser.Id);

                    if (intake == null)
                    {
                        await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка: Прием лекарства не найден или у вас нет к нему доступа.", cancellationToken: cancellationToken, showAlert: true);
                        _logger.LogWarning($"Прием лекарства с ID {intakeId} не найден для пользователя {appUser.Id} (callbackData: {callbackData})");
                        return;
                    }

                    string responseText = string.Empty;
                    bool success = false;

                    if (action.Equals("taken"))
                    {
                        await intakeService.MarkIntakeAsTakenAsync(intakeId, appUser.Id);
                        responseText = "Прием отмечен как 'Принято'.";
                        _logger.LogInformation($"Прием {intakeId} отмечен как 'Принято' для пользователя {appUser.Id}");
                        success = true;
                    }
                    else if (action.Equals("skipped"))
                    {
                        await intakeService.MarkIntakeAsSkippedAsync(intakeId, "Пропущено через Telegram", appUser.Id);
                        responseText = "Прием отмечен как 'Пропущено'.";
                        _logger.LogInformation($"Прием {intakeId} отмечен как 'Пропущено' для пользователя {appUser.Id}");
                        success = true;
                    }
                    else
                    {
                        responseText = "Ошибка: Неизвестное действие.";
                        _logger.LogWarning($"Неизвестное действие '{action}' в callbackData: {callbackData}");
                    }

                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, responseText, cancellationToken: cancellationToken, showAlert: !success);

                    if (success && callbackQuery.Message != null)
                    {
                        string originalMessageText = callbackQuery.Message.Text ?? string.Empty;
                        string newText = $"{originalMessageText}\nСтатус: {responseText}";

                        await _botClient.EditMessageText(
                            chatId: chatId,
                            messageId: callbackQuery.Message.MessageId,
                            text: newText,
                            replyMarkup: null,
                            cancellationToken: cancellationToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Ошибка при обработке CallbackQuery для intakeId {intakeId}");
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Произошла ошибка при обработке вашего запроса.", cancellationToken: cancellationToken);
                }
            }
        }

        private async Task SendMainMenu(long chatId, string text, CancellationToken cancellationToken)
        {
            var replyKeyboardMarkup = new ReplyKeyboardMarkup(new[]
            {
                new KeyboardButton[] { "Приёмы на сегодня", "💊 Лекарства" },
                new KeyboardButton[] { "❓ Помощь", "🗑️ Очистить чат" }
            })
            {
                ResizeKeyboard = true
            };

            await _botClient.SendMessage(
                chatId: chatId,
                text: text,
                replyMarkup: replyKeyboardMarkup,
                cancellationToken: cancellationToken);
        }

        private async Task SendMedicinesList(long chatId, Guid userId, IMedicineService medicineService, CancellationToken cancellationToken)
        {
            var medicines = await medicineService.GetMedicinesByUserId(userId);
            if (medicines.Any())
            {
                var messageBuilder = new StringBuilder();
                messageBuilder.AppendLine("Ваши лекарства:");
                foreach (var medicine in medicines)
                {
                    messageBuilder.AppendLine($"- *{medicine.Name}* ({medicine.DosagePerTake} мг)");
                }
                await _botClient.SendMessage(chatId, messageBuilder.ToString(), parseMode: ParseMode.Markdown, cancellationToken: cancellationToken);
            }
            else
            {
                await _botClient.SendMessage(chatId, "У вас пока нет добавленных лекарств.", cancellationToken: cancellationToken);
            }
        }

        private async Task SendTodayIntakes(long chatId, Guid userId, IIntakeService intakeService, ICourseService courseService, CancellationToken cancellationToken)
        {
            var today = DateTime.UtcNow;
            var intakes = await intakeService.GetScheduledIntakesForDateRangeAsync(userId, today.Date, today.Date.AddDays(1).AddTicks(-1));

            if (intakes.Any())
            {
                var messageBuilder = new StringBuilder();
                messageBuilder.AppendLine("Приёмы на сегодня:");
                foreach (var intake in intakes.OrderBy(i => i.ScheduledTime))
                {
                    var course = await courseService.GetCourseByIdAsync(intake.CourseId, userId);
                    var medicineName = course?.Medicine?.Name ?? "неизвестное лекарство";

                    var status = intake.Status switch
                    {
                        IntakeStatus.Scheduled => "Запланировано",
                        IntakeStatus.Taken => "Принято",
                        IntakeStatus.Missed => "Пропущено",
                        IntakeStatus.Skipped => "Пропущено (намеренно)",
                        _ => ""
                    };
                    var localTime = TimeZoneInfo.ConvertTimeFromUtc(intake.ScheduledTime, TimeZoneInfo.Local);
                    messageBuilder.AppendLine($"- *{localTime:HH:mm}* - {medicineName} ({status})");
                }
                await _botClient.SendMessage(chatId, messageBuilder.ToString(), parseMode: ParseMode.Markdown, cancellationToken: cancellationToken);
            }
            else
            {
                await _botClient.SendMessage(chatId, "На сегодня у вас нет запланированных приёмов.", cancellationToken: cancellationToken);
            }
        }

        private async Task SendHelpMessage(long chatId, CancellationToken cancellationToken)
        {
            var helpText = "CureTracker - это приложение для контроля за приёмом лекарств.\n\n" +
                           "Используйте кнопки меню для взаимодействия с ботом:\n" +
                           "💊 *Лекарства* - просмотр списка ваших лекарств.\n" +
                           "*Приёмы на сегодня* - просмотр приёмов на сегодня.\n" +
                           "🗑️ *Очистить чат* - сброс диалога.\n\n" +
                           "Уведомления о приёмах будут приходить автоматически.";
            await _botClient.SendMessage(chatId, helpText, parseMode: ParseMode.Markdown, cancellationToken: cancellationToken);
        }

        private Task ErrorHandler(ITelegramBotClient client, Exception exception, CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Ошибка при получении обновлений от Telegram (Polling ErrorHandler)");
            return Task.CompletedTask;
        }
    }
}