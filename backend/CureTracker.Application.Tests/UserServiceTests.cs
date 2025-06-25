using Moq;
using FluentAssertions;
using CureTracker.Application.Services;
using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using Xunit;
using CureTracker.Core.Exceptions;

namespace CureTracker.Application.Tests
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IPasswordHasher> _passwordHasherMock;
        private readonly Mock<IJwtProvider> _jwtProviderMock;
        private readonly Mock<ITimeZoneService> _timeZoneServiceMock;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _passwordHasherMock = new Mock<IPasswordHasher>();
            _jwtProviderMock = new Mock<IJwtProvider>();
            _timeZoneServiceMock = new Mock<ITimeZoneService>();
            _userService = new UserService(
                _userRepositoryMock.Object,
                _passwordHasherMock.Object,
                _jwtProviderMock.Object,
                _timeZoneServiceMock.Object);
        }

        /// <summary>
        /// Тест проверяет, что при регистрации пользователя с уже существующим email
        /// выбрасывается исключение DuplicateEmailException.
        /// </summary>
        [Fact]
        public async Task Register_ShouldThrowDuplicateEmailException_WhenUserWithSameEmailAlreadyExists()
        {
            // Arrange
            var email = "test@test.com";
            var user = User.Create(Guid.NewGuid(), "testuser", email, "password");
            _userRepositoryMock.Setup(r => r.GetUserByEmail(email)).ReturnsAsync(user);

            // Act
            Func<Task> act = async () => await _userService.Register("test", email, "password", "RU");

            // Assert
            await act.Should().ThrowAsync<DuplicateEmailException>();
        }

        /// <summary>
        /// Тест проверяет, что при успешной регистрации нового пользователя
        /// вызывается метод CreateUser репозитория с корректными данными.
        /// </summary>
        [Fact]
        public async Task Register_ShouldCallCreateUser_WhenEmailIsUnique()
        {
            // Arrange
            var email = "test@test.com";
            var password = "password";
            var userName = "testuser";
            var countryCode = "RU";
            var timeZoneId = "Europe/Moscow";
            var hashedPassword = "hashed_password";

            _userRepositoryMock.Setup(r => r.GetUserByEmail(email)).ReturnsAsync((User)null);
            _passwordHasherMock.Setup(p => p.Generate(password)).Returns(hashedPassword);
            _timeZoneServiceMock.Setup(t => t.GetTimeZoneByCountryCode(countryCode)).Returns(timeZoneId);
            
            // Act
            await _userService.Register(userName, email, password, countryCode);

            // Assert
            _userRepositoryMock.Verify(r => r.CreateUser(It.Is<User>(
                u => u.Name == userName &&
                     u.Email == email &&
                     u.PasswordHash == hashedPassword &&
                     u.TimeZoneId == timeZoneId &&
                     u.CountryCode == countryCode)), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что при попытке входа с несуществующим email
        /// выбрасывается исключение с сообщением "Пользователь не найден".
        /// </summary>
        [Fact]
        public async Task Login_ShouldThrowException_WhenUserNotFound()
        {
            // Arrange
            var email = "test@test.com";
            _userRepositoryMock.Setup(r => r.GetUserByEmail(email)).ReturnsAsync((User)null);

            // Act
            Func<Task> act = async () => await _userService.Login(email, "password");

            // Assert
            await act.Should().ThrowAsync<Exception>().WithMessage("Пользователь не найден");
        }

        /// <summary>
        /// Тест проверяет, что при попытке входа с неверным паролем
        /// выбрасывается исключение с сообщением "Неверный пароль".
        /// </summary>
        [Fact]
        public async Task Login_ShouldThrowException_WhenPasswordIsIncorrect()
        {
            // Arrange
            var email = "test@test.com";
            var user = User.Create(Guid.NewGuid(), "testuser", email, "hashed_password");
            _userRepositoryMock.Setup(r => r.GetUserByEmail(email)).ReturnsAsync(user);
            _passwordHasherMock.Setup(p => p.Verify("wrong_password", user.PasswordHash)).Returns(false);

            // Act
            Func<Task> act = async () => await _userService.Login(email, "wrong_password");

            // Assert
            await act.Should().ThrowAsync<Exception>().WithMessage("Неверный пароль");
        }

        /// <summary>
        /// Тест проверяет, что при успешном входе с верными данными
        /// метод возвращает сгенерированный JWT токен.
        /// </summary>
        [Fact]
        public async Task Login_ShouldReturnToken_WhenCredentialsAreCorrect()
        {
            // Arrange
            var email = "test@test.com";
            var password = "password";
            var user = User.Create(Guid.NewGuid(), "testuser", email, "hashed_password");
            var token = "jwt_token";

            _userRepositoryMock.Setup(r => r.GetUserByEmail(email)).ReturnsAsync(user);
            _passwordHasherMock.Setup(p => p.Verify(password, user.PasswordHash)).Returns(true);
            _jwtProviderMock.Setup(p => p.GenerateToken(user)).Returns(token);

            // Act
            var result = await _userService.Login(email, password);

            // Assert
            result.Should().Be(token);
        }
    }
} 