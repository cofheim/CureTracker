using Moq;
using FluentAssertions;
using CureTracker.Application.Services;
using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using Xunit;
using System;
using System.Threading.Tasks;

namespace CureTracker.Application.Tests
{
    public class CourseServiceTests
    {
        private readonly Mock<ICourseRepository> _courseRepositoryMock;
        private readonly Mock<IIntakeRepository> _intakeRepositoryMock;
        private readonly Mock<IActionLogService> _actionLogServiceMock;
        private readonly Mock<IActionLogRepository> _actionLogRepositoryMock;
        private readonly Mock<IUserService> _userServiceMock;
        private readonly CourseService _courseService;

        public CourseServiceTests()
        {
            _courseRepositoryMock = new Mock<ICourseRepository>();
            _intakeRepositoryMock = new Mock<IIntakeRepository>();
            _actionLogServiceMock = new Mock<IActionLogService>();
            _actionLogRepositoryMock = new Mock<IActionLogRepository>();
            _userServiceMock = new Mock<IUserService>();

            _courseService = new CourseService(
                _courseRepositoryMock.Object,
                _intakeRepositoryMock.Object,
                _actionLogServiceMock.Object,
                _actionLogRepositoryMock.Object,
                _userServiceMock.Object);
        }

        /// <summary>
        /// Тест проверяет, что метод CreateCourseAsync успешно создает курс
        /// и логирует это действие.
        /// </summary>
        [Fact]
        public async Task CreateCourseAsync_ShouldCreateCourseAndLogAction()
        {
            // Arrange
            var course = new Course(
                Guid.NewGuid(), 
                "Test Course", 
                "Description", 
                1, 
                new List<DateTime> { DateTime.UtcNow.Date.AddHours(10) }, 
                DateTime.UtcNow, 
                DateTime.UtcNow.AddDays(10),
                Guid.NewGuid(), 
                Guid.NewGuid(), 
                Core.Enums.CourseStatusEnum.CourseStatus.Planned, 
                Core.Enums.MedicineIntakeFrequencyEnum.IntakeFrequency.Daily, 
                0, 
                0);

            _courseRepositoryMock.Setup(r => r.CreateAsync(course)).ReturnsAsync(course);

            // Act
            var result = await _courseService.CreateCourseAsync(course);

            // Assert
            result.Should().BeEquivalentTo(course);
            _courseRepositoryMock.Verify(r => r.CreateAsync(course), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(
                It.IsAny<string>(),
                course.UserId,
                course.MedicineId,
                course.Id,
                It.IsAny<Guid?>()), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что метод UpdateCourseAsync успешно обновляет курс,
        /// если пользователь является его владельцем, и логирует действие.
        /// </summary>
        [Fact]
        public async Task UpdateCourseAsync_ShouldUpdateCourseAndLogAction_WhenUserIsOwner()
        {
            // Arrange
            var course = new Course(
                Guid.NewGuid(), "Test Course", "Desc", 1, new List<DateTime> { DateTime.UtcNow },
                DateTime.UtcNow, DateTime.UtcNow.AddDays(1), Guid.NewGuid(), Guid.NewGuid());
            
            _courseRepositoryMock.Setup(r => r.GetByIdAsync(course.Id)).ReturnsAsync(course);
            _courseRepositoryMock.Setup(r => r.UpdateAsync(course)).ReturnsAsync(course);

            // Act
            var result = await _courseService.UpdateCourseAsync(course);

            // Assert
            result.Should().BeEquivalentTo(course);
            _courseRepositoryMock.Verify(r => r.UpdateAsync(course), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(
                It.IsAny<string>(), course.UserId, course.MedicineId, course.Id, It.IsAny<Guid?>()), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что при попытке обновить чужой курс
        /// выбрасывается исключение UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UpdateCourseAsync_ShouldThrowUnauthorizedAccessException_WhenUserIsNotOwner()
        {
            // Arrange
            var course = new Course(
                Guid.NewGuid(), "Test Course", "Desc", 1, new List<DateTime> { DateTime.UtcNow },
                DateTime.UtcNow, DateTime.UtcNow.AddDays(1), Guid.NewGuid(), Guid.NewGuid());
            var otherUserCourse = new Course(
                course.Id, "Test Course", "Desc", 1, new List<DateTime> { DateTime.UtcNow },
                DateTime.UtcNow, DateTime.UtcNow.AddDays(1), Guid.NewGuid(), Guid.NewGuid()); // Same ID, different user
            
            _courseRepositoryMock.Setup(r => r.GetByIdAsync(course.Id)).ReturnsAsync(otherUserCourse);

            // Act
            Func<Task> act = async () => await _courseService.UpdateCourseAsync(course);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedAccessException>();
        }

        /// <summary>
        /// Тест проверяет, что при успешном удалении курса его владельцем
        /// метод возвращает true и логирует действие.
        /// </summary>
        [Fact]
        public async Task DeleteCourseAsync_ShouldReturnTrue_WhenUserIsOwner()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var courseId = Guid.NewGuid();
            var course = new Course(courseId, "Test", "Desc", 1, new List<DateTime>(), DateTime.UtcNow, DateTime.UtcNow.AddDays(1), Guid.NewGuid(), userId);

            _courseRepositoryMock.Setup(r => r.GetByIdAsync(courseId)).ReturnsAsync(course);
            _courseRepositoryMock.Setup(r => r.DeleteAsync(courseId)).ReturnsAsync(true);
            _intakeRepositoryMock.Setup(i => i.GetAllByCourseIdAsync(courseId)).ReturnsAsync(new List<Intake>());

            // Act
            var result = await _courseService.DeleteCourseAsync(courseId, userId);

            // Assert
            result.Should().BeTrue();
            _courseRepositoryMock.Verify(r => r.DeleteAsync(courseId), Times.Once);
            _actionLogRepositoryMock.Verify(a => a.DeleteByCourseIdAsync(courseId), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(It.IsAny<string>(), userId, course.MedicineId, null, null), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что при попытке удалить чужой курс
        /// метод возвращает false.
        /// </summary>
        [Fact]
        public async Task DeleteCourseAsync_ShouldReturnFalse_WhenUserIsNotOwner()
        {
            // Arrange
            var ownerId = Guid.NewGuid();
            var attackerId = Guid.NewGuid();
            var courseId = Guid.NewGuid();
            var course = new Course(courseId, "Test", "Desc", 1, new List<DateTime>(), DateTime.UtcNow, DateTime.UtcNow.AddDays(1), Guid.NewGuid(), ownerId);

            _courseRepositoryMock.Setup(r => r.GetByIdAsync(courseId)).ReturnsAsync(course);

            // Act
            var result = await _courseService.DeleteCourseAsync(courseId, attackerId);

            // Assert
            result.Should().BeFalse();
            _courseRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
        }

        /// <summary>
        /// Тест проверяет, что при попытке удалить несуществующий курс
        /// метод возвращает false.
        /// </summary>
        [Fact]
        public async Task DeleteCourseAsync_ShouldReturnFalse_WhenCourseNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var courseId = Guid.NewGuid();

            _courseRepositoryMock.Setup(r => r.GetByIdAsync(courseId)).ReturnsAsync((Course)null);

            // Act
            var result = await _courseService.DeleteCourseAsync(courseId, userId);

            // Assert
            result.Should().BeFalse();
            _courseRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
        }
    }
} 