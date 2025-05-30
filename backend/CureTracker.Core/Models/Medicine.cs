using static CureTracker.Core.Enums.MedicineTypeEnum;

namespace CureTracker.Core.Models
{
    public class Medicine
    {
        const int MAX_NAME_LENGTH = 50;
        const int MAX_DESCRIPTION_LENGTH = 250;
        const int MAX_STORAGE_CONDITIONS_LENGTH = 100;

        public Medicine(Guid id,
            string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            MedicineType type,
            Guid userId)
        {
            Id = id;
            Name = name;
            Description = description;
            DosagePerTake = dosagePerTake;
            StorageConditions = storageConditions;
            Type = type;
            UserId = userId;
        }

        public Guid Id { get; }
        public string Name { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public int DosagePerTake { get; private set; } = 0; // доза за 1 приём
        public string StorageConditions { get; private set; } = string.Empty; // условия хранения
        public MedicineType Type { get; private set; } = MedicineType.Other; // форма лекарства


        // связь с пользователем
        public Guid UserId { get; private set; } // ID пользователя
        public User? User { get; private set; }  // Навигационное свойство

        // связь с курсами
        public List<Course> Courses { get; private set; } = new List<Course>(); // курсы приема этого лекарства



        // создание лекарства с валидацией
        public static (Medicine Medicine, string Error) Create(Guid id,
            string name,
            string description,
            int dosagePerTake,
            string storageConditions,
            MedicineType type,
            Guid userId)
        {
            var error = string.Empty;

            if (string.IsNullOrEmpty(name) || name.Length > MAX_NAME_LENGTH)
                error = $"Name cannot be empty or longer than {MAX_NAME_LENGTH} symbols";
            else if (description.Length > MAX_DESCRIPTION_LENGTH)
                error = $"Description cannot be longer than {MAX_DESCRIPTION_LENGTH} symbols";
            else if (string.IsNullOrEmpty(storageConditions) || storageConditions.Length > MAX_STORAGE_CONDITIONS_LENGTH)
                error = $"Storage Conditions field cannot be empty or longer than {MAX_STORAGE_CONDITIONS_LENGTH} symbols";
            else if (dosagePerTake < 0)
                error = "Dosage Per Take cannot be less than 0";
            else if (userId == Guid.Empty)
                error = "User ID cannot be empty";

            return error != string.Empty
                ? (new Medicine(Guid.Empty, "", "", 0, "", MedicineType.Other, Guid.Empty), error)
                : (new Medicine(id, name, description, dosagePerTake, storageConditions, type, userId), error);
        }
    }
}
