using CureTracker.Core.Interfaces;
using CureTracker.Contracts;
using CureTracker.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CureTracker.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class MedicineController : ControllerBase
    {
        private readonly IMedicineService _medicineService;
        private readonly IUserService _userService;

        public MedicineController(IMedicineService medicineService, IUserService userService)
        {
            _medicineService = medicineService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<List<MedicineResponse>>> GetMedicines()
        {
            var currentUserId = GetCurrentUserId();
            
            var medicines = await _medicineService.GetMedicinesByUserId(currentUserId);

            var response = medicines.Select(z => new MedicineResponse(
                z.Id,
                z.Name,
                z.Description,
                z.DosagePerTake,
                z.StorageConditions,
                z.TimesADay,
                z.TimesOfTaking,
                z.StartDate,
                z.EndDate,
                z.Type,
                z.Status,
                z.IntakeFrequency));

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<MedicineResponse>> GetMedicineById(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            
            var medicine = await _medicineService.GetMedicineById(id);
            
            if (medicine == null)
            {
                return NotFound();
            }
            
            if (medicine.UserId != currentUserId)
            {
                return Forbid();
            }
            
            var response = new MedicineResponse(
                medicine.Id,
                medicine.Name,
                medicine.Description,
                medicine.DosagePerTake,
                medicine.StorageConditions,
                medicine.TimesADay,
                medicine.TimesOfTaking,
                medicine.StartDate,
                medicine.EndDate,
                medicine.Type,
                medicine.Status,
                medicine.IntakeFrequency);
                
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> CreateMedicine([FromBody] MedicineRequest request)
        {
            var currentUserId = GetCurrentUserId();

            var (medicine, error) = Medicine.Create(
                Guid.NewGuid(),
                request.name,
                request.description,
                request.dosagePerTake,
                request.storageConditions,
                request.timesADay,
                request.timesOfTaking,
                request.startDate,
                request.endDate,
                request.type,
                request.status,
                request.intakeFrequency,
                currentUserId);

            if (!string.IsNullOrEmpty(error))
            {
                return BadRequest(error);
            }

            var medicineId = await _medicineService.CreateMedicine(medicine);

            return Ok(medicineId);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<Guid>> UpdateMedicine(Guid id, [FromBody] MedicineRequest request)
        {
            var currentUserId = GetCurrentUserId();
            
            var existingMedicine = await _medicineService.GetMedicineById(id);
            if (existingMedicine == null)
            {
                return NotFound();
            }
            
            if (existingMedicine.UserId != currentUserId)
            {
                return Forbid();
            }

            var medicineId = await _medicineService.UpdateMedicine(
                id,
                request.name,
                request.description,
                request.dosagePerTake,
                request.storageConditions,
                request.timesADay,
                request.timesOfTaking,
                request.startDate,
                request.endDate,
                request.type,
                request.status,
                request.intakeFrequency,
                currentUserId);

            return Ok(medicineId);
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<Guid>> DeleteMedicine(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            
            var existingMedicine = await _medicineService.GetMedicineById(id);
            if (existingMedicine == null)
            {
                return NotFound();
            }
            
            if (existingMedicine.UserId != currentUserId)
            {
                return Forbid();
            }

            return Ok(await _medicineService.DeleteMedicine(id));
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("User not authenticated properly");
            }

            return Guid.Parse(userIdClaim.Value);
        }
    }
}
