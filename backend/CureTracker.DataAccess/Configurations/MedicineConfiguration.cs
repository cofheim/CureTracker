using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.ChangeTracking;

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
            builder.Property(k => k.Type).IsRequired().HasConversion<string>();


            
            builder.HasOne(m => m.User)
                  .WithMany(u => u.Medicines)
                  .HasForeignKey(m => m.UserId)
                  .IsRequired();

            // Связь с курсами
            builder.HasMany(m => m.Courses)
                  .WithOne(c => c.Medicine)
                  .HasForeignKey(c => c.MedicineId);
        }
    }
}
