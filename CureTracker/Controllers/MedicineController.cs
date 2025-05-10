using CureTracker.Application.Services;
using CureTracker.Contracts;
using CureTracker.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Telegram.Bot.Requests.Abstractions;

namespace CureTracker.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MedicineController : ControllerBase
    {
        private readonly IMedicineService _medicineService;

        public MedicineController(IMedicineService medicineService)
        {
            _medicineService = medicineService;
        }

        [HttpGet]
        public async Task<ActionResult<List<MedicineResponse>>> GetMedicines()
        {
            var medicines = await _medicineService.GetAllMedicines();

            var response = medicines.Select(z => new MedicineResponse(z.Id,
                z.Name,
                z.Description,
                z.DosagePerTake,
                z.StorageConditions,
                z.TimesADay,
                z.StartDate,
                z.EndDate,
                z.Type,
                z.Status,
                z.IntakeFrequency));

            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> CreateMedicine([FromBody] MedicineRequest request)
        {
            var (medicine, error) = Medicine.Create(Guid.NewGuid(),
                request.name,
                request.description,
                request.dosagePerTake,
                request.storageConditions,
                request.timesADay,
                request.startDate,
                request.endDate,
                request.type,
                request.status,
                request.intakeFrequency);

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
            var medicineId = await _medicineService.UpdateMedicine(id, request.name,
                request.description,
                request.dosagePerTake,
                request.storageConditions,
                request.timesADay,
                request.startDate,
                request.endDate,
                request.type,
                request.status,
                request.intakeFrequency);

            return Ok(medicineId);
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<Guid>> DeleteMedicine(Guid id)
        {
            return Ok(await _medicineService.DeleteMedicine(id));
        }
    }
}
