using System.Text.Json.Serialization;

namespace CureTracker.Core.Enums
{
    public class CourseStatusEnum
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum CourseStatus 
        {
            Planned,
            Active,
            Completed
        }
    }
}
