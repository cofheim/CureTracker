using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.Core.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using CureTracker.Contracts.UserContracts;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace CureTracker.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserResponse>> GetCurrentUser()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
                {
                    _logger.LogWarning("Failed to get user ID from token claims");
                    return Unauthorized();
                }

                var user = await _userService.GetUserById(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User with ID {userId} not found");
                    return NotFound();
                }

                var response = new UserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.TelegramId
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetCurrentUser: {ex.Message}");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Удаляем cookie с токеном
            HttpContext.Response.Cookies.Delete("cookies", new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.None,
                Secure = true
            });

            return Ok(new { message = "Вы успешно вышли из системы" });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserRequest request)
        {
            try
            {
                _logger.LogInformation($"Attempting to register user with email: {request.Email}");
                await _userService.Register(request.UserName, request.Email, request.Password);
                _logger.LogInformation($"Successfully registered user with email: {request.Email}");
                return Ok();
            }
            catch (DuplicateEmailException ex)
            {
                _logger.LogWarning($"Duplicate email registration attempt: {ex.Email}");
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Registration failed for email {request.Email}. Error: {ex.Message}\nStack trace: {ex.StackTrace}");
                return BadRequest(new { message = $"Произошла ошибка при регистрации: {ex.Message}", details = ex.StackTrace });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserRequest request)
        {
            var token = await _userService.Login(request.Email, request.Password);

            HttpContext.Response.Cookies.Append("cookies", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.None,
                Secure = true,
                Expires = DateTime.Now.AddHours(12)
            });

            return Ok(token);
        }

        [HttpGet]
        public async Task<ActionResult<List<UserResponse>>> GetUsers()
        {
            var users = await _userService.GetAllUsers();

            var response = users.Select(u => new UserResponse(
                u.Id,
                u.Name,
                u.Email,
                u.TelegramId
            )).ToList();

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<UserResponse>> GetUserById(Guid id)
        {
            var user = await _userService.GetUserById(id);

            if (user == null)
                return NotFound();

            var response = new UserResponse(
                user.Id,
                user.Name,
                user.Email,
                user.TelegramId
            );

            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> CreateUser([FromBody] UserRequest request)
        {
            var user = new User(
                Guid.NewGuid(),
                request.Name,
                request.Email,
                request.PasswordHash
            );

            if (request.TelegramId.HasValue)
            {
                user.TelegramId = request.TelegramId;
            }

            var userId = await _userService.CreateUser(user);

            return Ok(userId);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<Guid>> UpdateUser(Guid id, [FromBody] UserRequest request)
        {
            var existingUser = await _userService.GetUserById(id);

            if (existingUser == null)
                return NotFound();

            // Обновляем свойства существующего пользователя
            existingUser.Name = request.Name;
            existingUser.Email = request.Email;
            existingUser.PasswordHash = request.PasswordHash;

            if (request.TelegramId.HasValue)
            {
                existingUser.TelegramId = request.TelegramId;
            }

            var userId = await _userService.UpdateUser(existingUser);

            return Ok(userId);
        }

        [HttpPatch("{id:guid}/telegram")]
        public async Task<ActionResult<Guid>> UpdateUserTelegramId(Guid id, [FromBody] TelegramIdRequest request)
        {
            var userId = await _userService.UpdateUserTelegramId(id, request.TelegramId);
            return Ok(userId);
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<Guid>> DeleteUser(Guid id)
        {
            var userId = await _userService.DeleteUser(id);
            return Ok(userId);
        }

        [HttpPut("update-profile")]
        [Authorize]
        public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
                {
                    _logger.LogWarning("Failed to get user ID from token claims");
                    return Unauthorized();
                }

                var user = await _userService.GetUserById(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User with ID {userId} not found");
                    return NotFound();
                }

                // Проверяем, не занят ли email другим пользователем
                if (user.Email != request.Email)
                {
                    var existingUser = await _userService.GetUserByEmail(request.Email);
                    if (existingUser != null && existingUser.Id != userId)
                    {
                        return Conflict(new { message = "Этот email уже используется другим пользователем" });
                    }
                }

                // Обновляем данные профиля
                user.Name = request.Name;
                user.Email = request.Email;

                // Сохраняем изменения
                await _userService.UpdateUser(user);

                return Ok(new { message = "Профиль успешно обновлен" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in UpdateProfile: {ex.Message}");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpPost("generate-connection-code")]
        [Authorize]
        public async Task<ActionResult<string>> GenerateConnectionCode()
        {
            _logger.LogInformation($"[Controller Action] GenerateConnectionCode called for authenticated user.");
            
            Guid userIdFromClaims;
            try
            {
                userIdFromClaims = GetUserIdFromClaims();
                _logger.LogInformation($"[Controller Action] userIdFromClaims: {userIdFromClaims}");
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning($"[Controller Action] GetUserIdFromClaims failed: {ex.Message}");
                return Unauthorized("Ошибка авторизации: " + ex.Message);
            }
            
            try
            {
                _logger.LogInformation($"[Controller Action] Calling _userService.GenerateConnectionCodeAsync with userId: {userIdFromClaims}");
                var code = await _userService.GenerateConnectionCodeAsync(userIdFromClaims);
                _logger.LogInformation($"[Controller Action] Successfully generated code: {code} for userId: {userIdFromClaims}");
                return Ok(code);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[Controller Action] Error in GenerateConnectionCodeAsync for userId {userIdFromClaims}: {ex.Message}");
                // Check if it's the specific "User not found" exception from the repository/service
                if (ex.Message.Contains("Пользователь с ID") && ex.Message.Contains("не найден"))
                {
                    return NotFound(ex.Message); // Return 404 if user not found
                }
                return StatusCode(500, "Внутренняя ошибка сервера при генерации кода.");
            }
        }

        private Guid GetUserIdFromClaims()
        {
            _logger.LogInformation("[GetUserIdFromClaims] Attempting to get User ID using ClaimTypes.NameIdentifier. Available claims:");
            foreach (var claim in User.Claims) // Оставим логирование всех claims для справки
            {
                _logger.LogInformation($"[GetUserIdFromClaims] Claim Type: {claim.Type}, Value: {claim.Value}");
            }

            var userIdClaimValue = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaimValue))
            {
                _logger.LogWarning("[GetUserIdFromClaims] ClaimTypes.NameIdentifier claim is missing or empty.");
                throw new UnauthorizedAccessException("Не удалось определить идентификатор пользователя (отсутствует ClaimTypes.NameIdentifier).");
            }
            if (!Guid.TryParse(userIdClaimValue, out var userId))
            {
                _logger.LogWarning($"[GetUserIdFromClaims] ClaimTypes.NameIdentifier value is not a valid Guid. Value: {userIdClaimValue}");
                throw new UnauthorizedAccessException($"Не удалось определить идентификатор пользователя (неверный формат ClaimTypes.NameIdentifier: {userIdClaimValue}).");
            }
            _logger.LogInformation($"[GetUserIdFromClaims] Successfully parsed ClaimTypes.NameIdentifier to userId: {userId}");
            return userId;
        }
    }
}
