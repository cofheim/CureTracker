using Moq;
using FluentAssertions;
using CureTracker.Application.Services;
using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using Xunit;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using static CureTracker.Core.Enums.CourseStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Application.Tests
{
    public class IntakeServiceTests
    {
        private readonly Mock<IIntakeRepository> _intakeRepositoryMock;
        private readonly Mock<ICourseRepository> _courseRepositoryMock;
        private readonly Mock<IActionLogService> _actionLogServiceMock;
        private readonly IntakeService _intakeService;

        public IntakeServiceTests()
        {
            _intakeRepositoryMock = new Mock<IIntakeRepository>();
            _courseRepositoryMock = new Mock<ICourseRepository>();
            _actionLogServiceMock = new Mock<IActionLogService>();
            _intakeService = new IntakeService(_intakeRepositoryMock.Object, _courseRepositoryMock.Object, _actionLogServiceMock.Object);
        }

        /// <summary>
        /// Тест проверяет, что приём лекарства помечается как выполненный,
        /// счётчик принятых доз в курсе увеличивается, и действие логируется.
        /// </summary>
        [Fact]
        public async Task MarkIntakeAsTakenAsync_ShouldMarkIntakeAsTakenAndUpdateCourse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var courseId = Guid.NewGuid();
            var intakeId = Guid.NewGuid();

            var intake = Intake.Create(intakeId, DateTime.UtcNow, Core.Enums.IntakeStatusEnum.IntakeStatus.Scheduled, courseId, userId);
            var course = new Course(courseId, "Test", "Desc", 1, new List<DateTime>(), DateTime.UtcNow, DateTime.UtcNow.AddDays(1), Guid.NewGuid(), userId);
            
            _intakeRepositoryMock.Setup(r => r.GetByIdAsync(intakeId)).ReturnsAsync(intake);
            _intakeRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Intake>())).ReturnsAsync(intake);
            _courseRepositoryMock.Setup(r => r.GetByIdAsync(courseId)).ReturnsAsync(course);
            _courseRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Course>())).ReturnsAsync(course);

            // Act
            var result = await _intakeService.MarkIntakeAsTakenAsync(intakeId, userId);

            // Assert
            result.Status.Should().Be(Core.Enums.IntakeStatusEnum.IntakeStatus.Taken);
            _courseRepositoryMock.Verify(r => r.UpdateAsync(It.Is<Course>(c => c.TakenDosesCount == 1)), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(It.IsAny<string>(), userId, course.MedicineId, courseId, intakeId), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что приём лекарства помечается как пропущенный,
        /// счётчик пропущенных доз в курсе увеличивается, и действие логируется.
        /// </summary>
        [Fact]
        public async Task MarkIntakeAsSkippedAsync_ShouldMarkIntakeAsSkippedAndUpdateCourse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var courseId = Guid.NewGuid();
            var intakeId = Guid.NewGuid();
            var skipReason = "Forgot";

            var intake = Intake.Create(intakeId, DateTime.UtcNow, Core.Enums.IntakeStatusEnum.IntakeStatus.Scheduled, courseId, userId);
            var course = new Course(courseId, "Test", "Desc", 1, new List<DateTime>(), DateTime.UtcNow, DateTime.UtcNow.AddDays(1), Guid.NewGuid(), userId);

            _intakeRepositoryMock.Setup(r => r.GetByIdAsync(intakeId)).ReturnsAsync(intake);
            _intakeRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Intake>())).ReturnsAsync(intake);
            _intakeRepositoryMock.Setup(r => r.SetSkipReasonAsync(intakeId, skipReason)).ReturnsAsync(true);
            _courseRepositoryMock.Setup(r => r.GetByIdAsync(courseId)).ReturnsAsync(course);
            _courseRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Course>())).ReturnsAsync(course);

            // Act
            var result = await _intakeService.MarkIntakeAsSkippedAsync(intakeId, skipReason, userId);

            // Assert
            result.Status.Should().Be(Core.Enums.IntakeStatusEnum.IntakeStatus.Skipped);
            _courseRepositoryMock.Verify(r => r.UpdateAsync(It.Is<Course>(c => c.SkippedDosesCount == 1)), Times.Once);
            _intakeRepositoryMock.Verify(r => r.SetSkipReasonAsync(intakeId, skipReason), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(It.IsAny<string>(), userId, course.MedicineId, courseId, intakeId), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что при попытке отметить чужой приём как выполненный
        /// выбрасывается исключение UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task MarkIntakeAsTakenAsync_ShouldThrowUnauthorizedAccessException_WhenUserIsNotOwner()
        {
            // Arrange
            var ownerId = Guid.NewGuid();
            var attackerId = Guid.NewGuid();
            var intakeId = Guid.NewGuid();
            var intake = Intake.Create(intakeId, DateTime.UtcNow, Core.Enums.IntakeStatusEnum.IntakeStatus.Scheduled, Guid.NewGuid(), ownerId);

            _intakeRepositoryMock.Setup(r => r.GetByIdAsync(intakeId)).ReturnsAsync(intake);

            // Act
            Func<Task> act = async () => await _intakeService.MarkIntakeAsTakenAsync(intakeId, attackerId);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedAccessException>();
        }

        /// <summary>
        /// Тест проверяет, что при попытке отметить чужой приём как пропущенный
        /// выбрасывается исключение UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task MarkIntakeAsSkippedAsync_ShouldThrowUnauthorizedAccessException_WhenUserIsNotOwner()
        {
            // Arrange
            var ownerId = Guid.NewGuid();
            var attackerId = Guid.NewGuid();
            var intakeId = Guid.NewGuid();
            var intake = Intake.Create(intakeId, DateTime.UtcNow, Core.Enums.IntakeStatusEnum.IntakeStatus.Scheduled, Guid.NewGuid(), ownerId);

            _intakeRepositoryMock.Setup(r => r.GetByIdAsync(intakeId)).ReturnsAsync(intake);

            // Act
            Func<Task> act = async () => await _intakeService.MarkIntakeAsSkippedAsync(intakeId, "reason", attackerId);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedAccessException>();
        }
    }
} 