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
    public class MedicineServiceTests
    {
        private readonly Mock<IMedicineRepository> _medicineRepositoryMock;
        private readonly Mock<IActionLogService> _actionLogServiceMock;
        private readonly MedicineService _medicineService;

        public MedicineServiceTests()
        {
            _medicineRepositoryMock = new Mock<IMedicineRepository>();
            _actionLogServiceMock = new Mock<IActionLogService>();
            _medicineService = new MedicineService(_medicineRepositoryMock.Object, _actionLogServiceMock.Object);
        }

        /// <summary>
        /// Тест проверяет, что метод CreateMedicine успешно создает лекарство
        /// и логирует это действие.
        /// </summary>
        [Fact]
        public async Task CreateMedicine_ShouldCreateMedicineAndLogAction()
        {
            // Arrange
            var medicineId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var medicine = new Medicine(
                medicineId,
                "Test Medicine",
                "Description",
                1,
                "Storage",
                Core.Enums.MedicineTypeEnum.MedicineType.Tablet,
                userId);
            
            _medicineRepositoryMock.Setup(r => r.Create(medicine)).ReturnsAsync(medicine.Id);

            // Act
            var result = await _medicineService.CreateMedicine(medicine);

            // Assert
            result.Should().Be(medicine.Id);
            _medicineRepositoryMock.Verify(r => r.Create(medicine), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(
                It.IsAny<string>(),
                medicine.UserId,
                medicine.Id,
                null,
                null), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что метод UpdateMedicine успешно обновляет лекарство
        /// и логирует это действие.
        /// </summary>
        [Fact]
        public async Task UpdateMedicine_ShouldUpdateMedicineAndLogAction()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var medicineId = Guid.NewGuid();
            var medicine = new Medicine(medicineId, "Old Name", "Old Desc", 1, "Old Storage", Core.Enums.MedicineTypeEnum.MedicineType.Tablet, userId);

            _medicineRepositoryMock.Setup(r => r.GetById(medicineId)).ReturnsAsync(medicine);
            _medicineRepositoryMock.Setup(r => r.Update(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<Core.Enums.MedicineTypeEnum.MedicineType>(), It.IsAny<Guid>())).ReturnsAsync(medicineId);

            // Act
            var result = await _medicineService.UpdateMedicine(medicineId, "New Name", "New Desc", 2, "New Storage", Core.Enums.MedicineTypeEnum.MedicineType.Liquid, userId);

            // Assert
            result.Should().Be(medicineId);
            _medicineRepositoryMock.Verify(r => r.Update(medicineId, "New Name", "New Desc", 2, "New Storage", Core.Enums.MedicineTypeEnum.MedicineType.Liquid, userId), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(It.IsAny<string>(), userId, medicineId, null, null), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что при попытке обновить несуществующее лекарство
        /// выбрасывается исключение KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UpdateMedicine_ShouldThrowKeyNotFoundException_WhenMedicineNotFound()
        {
            // Arrange
            var medicineId = Guid.NewGuid();
            _medicineRepositoryMock.Setup(r => r.GetById(medicineId)).ReturnsAsync((Medicine)null);

            // Act
            Func<Task> act = async () => await _medicineService.UpdateMedicine(medicineId, "N", "D", 1, "S", Core.Enums.MedicineTypeEnum.MedicineType.Tablet, Guid.NewGuid());

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>();
        }

        /// <summary>
        /// Тест проверяет, что при попытке обновить чужое лекарство
        /// выбрасывается исключение UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UpdateMedicine_ShouldThrowUnauthorizedAccessException_WhenUserIsNotOwner()
        {
            // Arrange
            var ownerId = Guid.NewGuid();
            var attackerId = Guid.NewGuid();
            var medicineId = Guid.NewGuid();
            var medicine = new Medicine(medicineId, "Name", "Desc", 1, "Storage", Core.Enums.MedicineTypeEnum.MedicineType.Tablet, ownerId);
            _medicineRepositoryMock.Setup(r => r.GetById(medicineId)).ReturnsAsync(medicine);

            // Act
            Func<Task> act = async () => await _medicineService.UpdateMedicine(medicineId, "N", "D", 1, "S", Core.Enums.MedicineTypeEnum.MedicineType.Tablet, attackerId);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedAccessException>();
        }

        /// <summary>
        /// Тест проверяет, что метод DeleteMedicine успешно удаляет лекарство
        /// и логирует это действие.
        /// </summary>
        [Fact]
        public async Task DeleteMedicine_ShouldDeleteMedicineAndLogAction()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var medicineId = Guid.NewGuid();
            var medicine = new Medicine(medicineId, "Name", "Desc", 1, "Storage", Core.Enums.MedicineTypeEnum.MedicineType.Tablet, userId);
            
            _medicineRepositoryMock.Setup(r => r.GetById(medicineId)).ReturnsAsync(medicine);
            _medicineRepositoryMock.Setup(r => r.Delete(medicineId)).ReturnsAsync(medicineId);

            // Act
            var result = await _medicineService.DeleteMedicine(medicineId);

            // Assert
            result.Should().Be(medicineId);
            _medicineRepositoryMock.Verify(r => r.Delete(medicineId), Times.Once);
            _actionLogServiceMock.Verify(a => a.LogActionAsync(It.IsAny<string>(), userId, medicineId, null, null), Times.Once);
        }

        /// <summary>
        /// Тест проверяет, что при попытке удалить несуществующее лекарство
        /// выбрасывается исключение KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task DeleteMedicine_ShouldThrowKeyNotFoundException_WhenMedicineNotFound()
        {
            // Arrange
            var medicineId = Guid.NewGuid();
            _medicineRepositoryMock.Setup(r => r.GetById(medicineId)).ReturnsAsync((Medicine)null);

            // Act
            Func<Task> act = async () => await _medicineService.DeleteMedicine(medicineId);

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>();
        }
    }
} 