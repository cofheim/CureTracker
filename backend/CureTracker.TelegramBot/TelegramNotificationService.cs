using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using CureTracker.Core.Interfaces;
using Telegram.Bot.Types.ReplyMarkups;
using Telegram.Bot.Polling;

namespace CureTracker.TelegramBot
{
    public class TelegramNotificationService
    {
        private readonly TelegramBotClient _botClient;
        private readonly ILogger<TelegramNotificationService> _logger;
        private readonly IUserService _userService;
        private readonly IIntakeService _intakeService;

        public TelegramNotificationService(IConfiguration configuration, ILogger<TelegramNotificationService> logger, IUserService userService, IIntakeService intakeService)
        {
            var token = configuration.GetSection("TelegramBot:Token").Value;
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogError("Telegram Bot Token is not configured.");
                throw new ArgumentNullException(nameof(token), "Telegram Bot Token cannot be null or empty.");
            }
            _botClient = new TelegramBotClient(token);
            _logger = logger;
            _userService = userService;
            _intakeService = intakeService;
        }

        public async Task SendNotificationAsync(long chatId, string message, Guid intakeId)
        {
            try
            {
                var inlineKeyboard = new InlineKeyboardMarkup(new[]
                {
                    // first row
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
                AllowedUpdates = Array.Empty<UpdateType>() // Получать все типы обновлений
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
            if (update.Type == UpdateType.Message && update.Message?.Text != null)
            {
                var message = update.Message;
                var chatId = message.Chat.Id;
                var text = message.Text;

                _logger.LogInformation($"Получено сообщение от {chatId}: {text}");

                if (text.StartsWith("/start"))
                {
                    await _botClient.SendMessage(chatId, "Добро пожаловать в CureTracker Bot! Пожалуйста, введите код связи, который вы получили в приложении CureTracker.", cancellationToken: cancellationToken);
                }
                else
                {
                    // Предполагаем, что пользователь ввел код связи
                    var code = text.Trim();
                    var user = await _userService.GetUserByConnectionCodeAsync(code);
                    if (user != null)
                    {
                        await _userService.UpdateUserTelegramId(user.Id, chatId);
                        await _botClient.SendMessage(
                            chatId: chatId,
                            text: "Ваш аккаунт успешно связан с CureTracker! Теперь вы будете получать напоминания о приеме лекарств.",
                            replyMarkup: new ReplyKeyboardRemove(),
                            cancellationToken: cancellationToken);
                        _logger.LogInformation($"Аккаунт пользователя {user.Id} связан с Telegram ID {chatId}");
                    }
                    else
                    {
                        await _botClient.SendMessage(chatId, "Неверный код. Пожалуйста, проверьте код в приложении CureTracker и попробуйте снова.", cancellationToken: cancellationToken);
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

                var action = parts[1]; // "taken" or "skipped"
                if (!Guid.TryParse(parts[2], out var intakeId))
                {
                    await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка: Неверный ID приема.", cancellationToken: cancellationToken);
                    _logger.LogWarning($"Не удалось распарсить intakeId из callbackData: {callbackData}");
                    return;
                }

                try
                {
                    long telegramChatId = callbackQuery.From.Id;
                    var appUser = await _userService.GetUserByTelegramId(telegramChatId);

                    if (appUser == null)
                    {
                        await _botClient.AnswerCallbackQuery(callbackQuery.Id, "Ошибка: Ваш Telegram аккаунт не связан с пользователем в системе.", cancellationToken: cancellationToken, showAlert: true);
                        _logger.LogWarning($"Пользователь с Telegram ID {telegramChatId} не найден в системе для callbackData: {callbackData}");
                        return;
                    }

                    var intake = await _intakeService.GetIntakeByIdAsync(intakeId, appUser.Id); // Используем appUser.Id
                    
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
                        await _intakeService.MarkIntakeAsTakenAsync(intakeId, appUser.Id);
                        responseText = "Прием отмечен как 'Принято'.";
                        _logger.LogInformation($"Прием {intakeId} отмечен как 'Принято' для пользователя {appUser.Id}");
                        success = true;
                    }
                    else if (action.Equals("skipped"))
                    {
                        await _intakeService.MarkIntakeAsSkippedAsync(intakeId, "Пропущено через Telegram", appUser.Id);
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

        private Task ErrorHandler(ITelegramBotClient client, Exception exception, CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Ошибка при получении обновлений от Telegram (Polling ErrorHandler)");
            return Task.CompletedTask;
        }
    }
} 