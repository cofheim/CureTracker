using CureTracker.Application.Services;
using CureTracker.DataAccess.Repositories;
using CureTracker.DataAccess;
using Microsoft.EntityFrameworkCore;
using CureTracker.Core.Interfaces;

var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;


services.AddControllers();
services.AddEndpointsApiExplorer();
services.AddSwaggerGen();

services.AddDbContext<CureTrackerDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString(nameof(CureTrackerDbContext)));
});

services.AddScoped<IMedicineService, MedicineService>();
services.AddScoped<IMedicineRepository, MedicineRepository>();

services.AddScoped<IUserRepository, UserRepository>();
services.AddScoped<IUserService, UserService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
