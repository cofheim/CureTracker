using Moq;
using FluentAssertions;
using CureTracker.Application.Services;
using CureTracker.Core.Interfaces;
using CureTracker.Core.Models;
using Xunit;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace CureTracker.Application.Tests
{
    public class ActionLogServiceTests
    {
        private readonly Mock<IActionLogRepository> _actionLogRepositoryMock;
        private readonly ActionLogService _actionLogService;

        public ActionLogServiceTests()
        {
            _actionLogRepositoryMock = new Mock<IActionLogRepository>();
            _actionLogService = new ActionLogService(_actionLogRepositoryMock.Object);
        }

        /// <summary>
        /// Тест проверяет, что метод LogActionAsync успешно создает запись в логе
        /// и передает ее в репозиторий.
        /// </summary>
        [Fact]
        public async Task LogActionAsync_ShouldCreateAndLogAction()
        {
            // Arrange
            var description = "Test action";
            var userId = Guid.NewGuid();
            _actionLogRepositoryMock.Setup(r => r.CreateAsync(It.IsAny<ActionLog>()))
                .ReturnsAsync((ActionLog log) => log);

            // Act
            var result = await _actionLogService.LogActionAsync(description, userId);

            // Assert
            result.Should().NotBeNull();
            result.Description.Should().Be(description);
            result.UserId.Should().Be(userId);
            _actionLogRepositoryMock.Verify(r => r.CreateAsync(It.Is<ActionLog>(
                log => log.Description == description && log.UserId == userId)), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что метод GetUserActionLogsAsync вызывает репозиторий
        /// с корректными параметрами для пагинации.
        /// </summary>
        [Fact]
        public async Task GetUserActionLogsAsync_ShouldCallRepositoryWithCorrectPagination()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var page = 2;
            var pageSize = 10;
            var offset = (page - 1) * pageSize;

            _actionLogRepositoryMock.Setup(r => r.GetAllByUserIdAsync(userId, pageSize, offset))
                .ReturnsAsync(new List<ActionLog>());

            // Act
            await _actionLogService.GetUserActionLogsAsync(userId, page, pageSize);

            // Assert
            _actionLogRepositoryMock.Verify(r => r.GetAllByUserIdAsync(userId, pageSize, offset), Times.Once);
        }
    }
} 