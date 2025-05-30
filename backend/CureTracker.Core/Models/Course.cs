using static CureTracker.Core.Enums.CourseStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Core.Models
{
    public class Course
    {
        const int MAX_NAME_LENGTH = 50;
        const int MAX_DESCRIPTION_LENGTH = 250;

        public Course(Guid id,
            string name,
            string description,
            int timesADay,
            List<DateTime> timesOfTaking,
            DateTime startDate,
            DateTime endDate,
            Guid medicineId,
            Guid userId,
            CourseStatus status = CourseStatus.Planned,
            IntakeFrequency intakeFrequency = IntakeFrequency.Daily,
            int takenDosesCount = 0,
            int skippedDosesCount = 0)
        {
            Id = id;
            Name = name;
            Description = description;
            TimesADay = timesADay;
            TimesOfTaking = timesOfTaking;
            StartDate = startDate;
            EndDate = endDate;
            MedicineId = medicineId;
            UserId = userId;
            Status = status;
            IntakeFrequency = intakeFrequency;
            TakenDosesCount = takenDosesCount;
            SkippedDosesCount = skippedDosesCount;
        }

        public Guid Id { get; }
        public string Name { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public int TimesADay { get; private set; } = 0; // сколько раз в день
        public List<DateTime> TimesOfTaking { get; private set; } = new List<DateTime>(); // времена приёма лекарства
        public DateTime StartDate { get; private set; } = DateTime.UtcNow; // время начала приёма
        public DateTime EndDate { get; private set; } = DateTime.UtcNow.AddDays(1); // время конца приёма
        public CourseStatus Status { get; private set; } = CourseStatus.Planned; // статус курса: запланирован, в процессе и т.д.
        public IntakeFrequency IntakeFrequency { get; private set; } = IntakeFrequency.Daily; // как часто принимать лекарство
        public int TakenDosesCount { get; private set; } = 0; // количество принятых доз
        public int SkippedDosesCount { get; private set; } = 0; // количество пропущенных доз

        // связь с лекарством
        public Guid MedicineId { get; private set; }
        public Medicine? Medicine { get; private set; }

        // связь с пользователем
        public Guid UserId { get; private set; }
        public User? User { get; private set; }

        // связь с приемами лекарств
        public List<Intake> Intakes { get; private set; } = new List<Intake>();

        public static (Course Course, string Error) Create(Guid id,
            string name,
            string description,
            int timesADay,
            List<DateTime> timesOfTaking,
            DateTime startDate,
            DateTime endDate,
            Guid medicineId,
            Guid userId,
            CourseStatus status = CourseStatus.Planned,
            IntakeFrequency intakeFrequency = IntakeFrequency.Daily)
        {
            var error = string.Empty;

            if (string.IsNullOrEmpty(name) || name.Length > MAX_NAME_LENGTH)
                error = $"Name cannot be empty or longer than {MAX_NAME_LENGTH} symbols";
            else if (description.Length > MAX_DESCRIPTION_LENGTH)
                error = $"Description cannot be longer than {MAX_DESCRIPTION_LENGTH} symbols";
            else if (timesADay < 0)
                error = "Times A Day field cannot be less than 0";
            else if (timesOfTaking.Count != timesADay)
                error = "Number of taking times must match Times A Day value";
            else if (startDate > endDate)
                error = "Start Date cannot be later than End Date";
            else if (medicineId == Guid.Empty)
                error = "Medicine ID cannot be empty";
            else if (userId == Guid.Empty)
                error = "User ID cannot be empty";

            return error != string.Empty
                ? (new Course(Guid.Empty, "", "", 0, new List<DateTime>(), DateTime.MinValue, DateTime.MinValue, Guid.Empty, Guid.Empty), error)
                : (new Course(id, name, description, timesADay, timesOfTaking, startDate, endDate, medicineId, userId, status, intakeFrequency), error);
        }
    }
}
