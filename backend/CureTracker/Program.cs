using CureTracker.Application.Services;
using CureTracker.DataAccess.Repositories;
using CureTracker.DataAccess;
using Microsoft.EntityFrameworkCore;
using CureTracker.Core.Interfaces;
using CureTracker.Infrastructure;
using CureTracker.Extensions;
using CureTracker.BackgroundServices;
using CureTracker.TelegramBot;

var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;

services.AddControllers();
services.AddEndpointsApiExplorer();
services.AddSwaggerGen();

services.AddDbContext<CureTrackerDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString(nameof(CureTrackerDbContext)));
});

services.AddScoped<IJwtProvider, JwtProvider>();
services.AddScoped<IPasswordHasher, PasswordHasher>();

services.AddScoped<IUserRepository, UserRepository>();
services.AddScoped<IMedicineRepository, MedicineRepository>();
services.AddScoped<ICourseRepository, CourseRepository>();
services.AddScoped<IIntakeRepository, IntakeRepository>();
services.AddScoped<IActionLogRepository, ActionLogRepository>();

services.AddScoped<IUserService, UserService>();
services.AddScoped<IMedicineService, MedicineService>();
services.AddScoped<ICourseService, CourseService>();
services.AddScoped<IIntakeService, IntakeService>();
services.AddScoped<IActionLogService, ActionLogService>();

services.AddSingleton<TelegramNotificationService>();

services.AddApplicationServices();

services.AddHostedService<CourseStatusUpdateService>();
services.AddHostedService<IntakeReminderService>();
services.AddHostedService<TelegramBotHostedService>();

services.Configure<JwtOptions>(builder.Configuration.GetSection("JwtOptions"));
services.AddApiAuthentification(builder.Configuration, services.BuildServiceProvider().GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtOptions>>());

services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CureTrackerDbContext>();
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
