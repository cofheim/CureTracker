namespace CureTracker.Core.Models
{
    public class User
    {
        const int MAX_NAME_LENGTH = 50;
        const int MAX_EMAIL_LENGTH = 50;
        
        public User(Guid id, string name, string email, string passwordHash)
        {
            Id = id;
            if (string.IsNullOrWhiteSpace(name) || name.Length > MAX_NAME_LENGTH)
            {
                throw new Exception($"Name cannot be empty/null or longer than {MAX_NAME_LENGTH}");
            }
            else if (email.Length > MAX_EMAIL_LENGTH)
            {
                throw new Exception($"Email cannot be longer than {MAX_EMAIL_LENGTH}");
            }
            Name = name;
            Email = email;
            PasswordHash = passwordHash;
        }

        public User(Guid id, string name, string email, string passwordHash, long telegramId) : this(id, name, email, passwordHash)
        {
            TelegramId = telegramId;
        }

        public Guid Id { get; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public long? TelegramId { get; set; }
        public string? ConnectionCode { get; set; } 
        public string? TimeZoneId { get; set; } 
        public string? CountryCode { get; set; } 
        public List<Medicine> Medicines { get; private set; } = new List<Medicine>();

   
        public User(Guid id, string name, string email, string passwordHash, long? telegramId, string? connectionCode, string? timeZoneId, string? countryCode)
            : this(id, name, email, passwordHash)
        {
            TelegramId = telegramId;
            ConnectionCode = connectionCode;
            TimeZoneId = timeZoneId;
            CountryCode = countryCode;
        }
        
        public static User Create(Guid id, string userName, string email, string passwordHash, string? timeZoneId = null, string? countryCode = null) // Добавили опциональный timeZoneId и countryCode
        {
            var user = new User(id, userName, email, passwordHash);
            user.TimeZoneId = timeZoneId; 
            user.CountryCode = countryCode; 
            return user;
        }
    }
}
