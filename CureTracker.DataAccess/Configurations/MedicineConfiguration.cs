using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CureTracker.DataAccess.Configurations
{
    public class MedicineConfiguration : IEntityTypeConfiguration<MedicineEntity>
    {
        public void Configure(EntityTypeBuilder<MedicineEntity> builder)
        {
            builder.HasKey(k => k.Id);

            builder.Property(k => k.Name).IsRequired().HasMaxLength(50);
            builder.Property(k => k.Description).IsRequired().HasMaxLength(250);
            builder.Property(k => k.StorageConditions).IsRequired().HasMaxLength(100);
            builder.Property(k => k.DosagePerTake).IsRequired();
            builder.Property(k => k.TimesADay).IsRequired();
            builder.Property(k => k.StartDate).IsRequired();
            builder.Property(k => k.EndDate).IsRequired();
            builder.Property(k => k.Status).IsRequired().HasConversion<string>();
            builder.Property(k => k.Type).IsRequired().HasConversion<string>();
            builder.Property(k => k.IntakeFrequency).IsRequired().HasConversion<string>();

        }
    }
}
