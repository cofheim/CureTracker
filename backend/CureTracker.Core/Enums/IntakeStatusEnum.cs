using System.Text.Json.Serialization;

namespace CureTracker.Core.Enums
{
    public class IntakeStatusEnum
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum IntakeStatus 
        {
            Scheduled,
            Taken,
            Missed,
            Skipped
        }
    }
}
