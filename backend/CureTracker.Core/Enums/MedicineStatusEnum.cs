using System.Text.Json.Serialization;

namespace CureTracker.Core.Enums
{
    public class MedicineStatusEnum
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum Status
        {
            Planned,
            InProgress,
            Taken,
            Missed,
            Skipped
        }
    }
}
