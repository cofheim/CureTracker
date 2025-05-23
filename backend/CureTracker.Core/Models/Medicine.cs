using static CureTracker.Core.Enums.MedicineTypeEnum;
using static CureTracker.Core.Enums.MedicineStatusEnum;
using static CureTracker.Core.Enums.MedicineIntakeFrequencyEnum;

namespace CureTracker.Core.Models
{

    public class Medicine
    {
        #region consts
        const int MAX_NAME_LENGTH = 50;
        const int MAX_DESCRIPTION_LENGTH = 250;
        const int MAX_STORAGE_CONDITIONS_LENGTH = 100;
        #endregion

        public Medicine(Guid id,
            string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            int timesADay,
            List<DateTime> timesOfTaking,
            DateTime startDate,
            DateTime endDate,
            MedicineType type,
            Status status,
            IntakeFrequency intakeFrequency,
            Guid userId)
        {
            Id = id;
            Name = name;
            Description = description;
            DosagePerTake = dosagePerTake;
            StorageConditions = storageConditions;
            TimesADay = timesADay;
            TimesOfTaking = timesOfTaking;
            StartDate = startDate;
            EndDate = endDate;
            Type = type;
            Status = status;
            IntakeFrequency = intakeFrequency;
            UserId = userId;
        }

        #region Props
        public Guid Id { get; }
        public string Name { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty; 
        public int DosagePerTake { get; private set; } = 0; // доза за 1 приём
        public string StorageConditions { get; private set; } = string.Empty; // условия хранения
        public int TimesADay { get; private set; } = 0; // сколько раз в день
        public List<DateTime> TimesOfTaking { get; private set; } = new List<DateTime>(); // времена приёма лекарства
        public DateTime StartDate { get; private set; } = DateTime.UtcNow; // время начала приёма
        public DateTime EndDate { get; private set; } = DateTime.UtcNow.AddDays(1); // время конца приёма
        public MedicineType Type { get; private set; } = MedicineType.Other; // форма лекарства
        public Status Status { get; private set; } = Status.Planned; // статус приёма: запланирован, в процессе и т.д.
        public IntakeFrequency IntakeFrequency { get; private set; } = IntakeFrequency.Daily; // как часто принимать лекарство

        // связь с пользователем
        public Guid UserId { get; private set; } // ID пользователя
        public User? User { get; private set; }  // Навигационное свойство


        #endregion


        // создание лекарства с валидацией
        public static (Medicine Medicine, string Error) Create(Guid id,
            string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            int timesADay,
            List<DateTime> timesOfTaking,
            DateTime startDate,
            DateTime endDate,
            MedicineType type,
            Status status,
            IntakeFrequency intakeFrequency,
            Guid userId)
        {
            var error = string.Empty;

            if (string.IsNullOrEmpty(name) || name.Length > MAX_NAME_LENGTH)
                error = $"Name cannot be empty or longer than {MAX_NAME_LENGTH} symbols";
            else if (description.Length > MAX_DESCRIPTION_LENGTH)
                error = $"Description cannot be longer than {MAX_DESCRIPTION_LENGTH} symbols";
            else if (string.IsNullOrEmpty(storageConditions) || storageConditions.Length > MAX_STORAGE_CONDITIONS_LENGTH)
                error = $"Storage Conditions field cannot be empty or longer than {MAX_STORAGE_CONDITIONS_LENGTH} symbols";
            else if (startDate > endDate)
                error = "Start Date cannot be later than End Date or End Date cannot be earlier than Start Date";
            else if (dosagePerTake < 0)
                error = "Dosage Per Take cannot be less than 0";
            else if (timesADay < 0)
                error = "Time A Day field cannot be less than 0";
            else if (timesOfTaking.Count != timesADay)
                error = "Number of taking times must match Times A Day value";
            else if (userId == Guid.Empty)
                error = "User ID cannot be empty";

            var medicine = new Medicine(id,
                name,
                description,
                dosagePerTake,
                storageConditions,
                timesADay,
                timesOfTaking,
                startDate,
                endDate,
                type,
                status,
                intakeFrequency,
                userId);

            return (medicine, error);
        }
    }
}
