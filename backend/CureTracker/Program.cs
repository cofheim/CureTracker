using CureTracker.Application.Services;
using CureTracker.DataAccess.Repositories;
using CureTracker.DataAccess;
using Microsoft.EntityFrameworkCore;
using CureTracker.Core.Interfaces;
using CureTracker.Infrastructure;
using CureTracker.Extensions;

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

// Репозитории
services.AddScoped<IUserRepository, UserRepository>();
services.AddScoped<IMedicineRepository, MedicineRepository>();
services.AddScoped<ICourseRepository, CourseRepository>();
services.AddScoped<IIntakeRepository, IntakeRepository>();
services.AddScoped<IActionLogRepository, ActionLogRepository>();


// Сервисы
services.AddScoped<IUserService, UserService>();
services.AddScoped<IMedicineService, MedicineService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IIntakeService, IntakeService>();
builder.Services.AddScoped<IActionLogService, ActionLogService>();



services.Configure<JwtOptions>(builder.Configuration.GetSection("JwtOptions"));

services.AddApiAuthentification(builder.Configuration, services.BuildServiceProvider().GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtOptions>>());

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseCors(x =>
{
    x.WithOrigins("http://localhost:3000")
     .AllowAnyHeader()
     .AllowAnyMethod();
});

app.Run();
