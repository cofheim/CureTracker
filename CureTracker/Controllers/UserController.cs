using CureTracker.Core.Interfaces;
using CureTracker.Contracts;
using CureTracker.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace CureTracker.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
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
