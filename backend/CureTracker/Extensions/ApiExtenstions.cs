using System.Text;
using CureTracker.Application.Services;
using CureTracker.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CureTracker.Extensions
{
    public static class ApiExtenstions
    {
        public static void AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<ITimeZoneService, TimeZoneService>();
        }

        public static void AddApiAuthentification(
            this IServiceCollection services, 
            IConfiguration configuration,
            IOptions<JwtOptions> jwtOptions)
        {
            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    options.TokenValidationParameters = new() 
                    { 
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwtOptions.Value.SecretKey)),
                        NameClaimType = JwtRegisteredClaimNames.Sub,
                        RoleClaimType = ClaimTypes.Role
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            context.Token = context.Request.Cookies["cookies"];

                            return Task.CompletedTask;
                        }
                    };
                });
            services.AddAuthorization();
        }

    }
}
