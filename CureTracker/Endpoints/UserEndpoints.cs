using CureTracker.Application.Services;
using CureTracker.Contracts;
using CureTracker.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CureTracker.Endpoints
{
    public static class UserEndpoints
    {
        public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
        {
            app.MapPost("Register", Register);

            app.MapPost("Login", Login);

            return app;
        }

        private static async Task<IResult> Register(RegisterUserRequest request, [FromServices] IUserService userService)
        {
            await userService.Register(request.UserName, request.Email, request.Password);
            return Results.Ok();
        }

        private static async Task<IResult> Login(LoginUserRequest request, [FromServices] IUserService userService)
        {
            var token = await userService.Login(request.Email, request.Password);
            return Results.Ok(token);
        }
    }
}
