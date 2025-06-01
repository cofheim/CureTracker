using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using CureTracker.Core.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using CureTracker.Contracts.UserContracts;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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
                Secure = true 
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
    }
}
