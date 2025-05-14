using System.Text.Json.Serialization;

namespace CureTracker.Core.Enums
{
    public class MedicineIntakeFrequencyEnum
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum IntakeFrequency
        {
            Daily,
            Weekly,
            Monthly
        }
    }
}
