    FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
    WORKDIR /source

    
    COPY *.sln .
    COPY CureTracker/*.csproj ./CureTracker/
    COPY CureTracker.Application/*.csproj ./CureTracker.Application/
    COPY CureTracker.Core/*.csproj ./CureTracker.Core/
    COPY CureTracker.DataAccess/*.csproj ./CureTracker.DataAccess/
    COPY CureTracker.Infrastructure/*.csproj ./CureTracker.Infrastructure/
    COPY CureTracker.TelegramBot/*.csproj ./CureTracker.TelegramBot/
    RUN dotnet restore "CureTracker.sln"

    COPY . .
    WORKDIR /source/CureTracker

    RUN dotnet publish -c Release -o /app/publish --no-restore

    FROM mcr.microsoft.com/dotnet/aspnet:8.0
    WORKDIR /app
    COPY --from=build /app/publish .

    EXPOSE 8081

    ENTRYPOINT ["dotnet", "CureTracker.dll"]