using System.Text.Json.Serialization;

namespace CureTracker.Core.Enums
{
    public  class MedicineTypeEnum
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public enum MedicineType
        {
            Capsule,
            Tablet,
            Liquid,
            Injection,
            Powder,
            Other
        }
    }
}
