using System.Linq;
using NodaTime;
using NodaTime.TimeZones;
using System.Collections.Generic;

namespace CureTracker.Application.Services
{
    public interface ITimeZoneService
    {
        string? GetTimeZoneByCountryCode(string countryCode);
    }

    public class TimeZoneService : ITimeZoneService
    {
        private static readonly TzdbDateTimeZoneSource TzdbSource = TzdbDateTimeZoneSource.Default;
        private static readonly Dictionary<string, string> PreferredTimeZones = new Dictionary<string, string>(System.StringComparer.OrdinalIgnoreCase)
        {
            { "RU", "Europe/Moscow" }
        };

        public string? GetTimeZoneByCountryCode(string countryCode)
        {
            if (string.IsNullOrWhiteSpace(countryCode) || countryCode.Length != 2)
            {
                return null;
            }

            try
            {
                string territoryCode = countryCode.ToUpperInvariant();

                var allCountryZoneIds = TzdbSource.ZoneLocations
                    .Where(loc => loc.CountryCode == territoryCode)
                    .Select(loc => loc.ZoneId)
                    .ToList();

                if (!allCountryZoneIds.Any())
                {
                    return null; 
                }

                if (allCountryZoneIds.Count == 1)
                {
                    return allCountryZoneIds.First(); 
                }

                if (PreferredTimeZones.TryGetValue(territoryCode, out string? preferredZoneId))
                {
                    if (allCountryZoneIds.Contains(preferredZoneId, System.StringComparer.OrdinalIgnoreCase))
                    {
                        return preferredZoneId; 
                    }
                }
                
                return allCountryZoneIds.First(); 
            }
            catch (Exception ex)
            {

                return null; 
            }
        }
    }
} 