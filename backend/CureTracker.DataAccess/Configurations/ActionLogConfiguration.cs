using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CureTracker.DataAccess.Configurations
{
    public class ActionLogConfiguration : IEntityTypeConfiguration<ActionLogEntity>
    {
        public void Configure(EntityTypeBuilder<ActionLogEntity> builder)
        {
            builder.HasKey(k => k.Id);

            builder.Property(k => k.Description).IsRequired().HasMaxLength(500);
            builder.Property(k => k.Timestamp).IsRequired();

            builder.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .IsRequired();

            builder.HasOne(a => a.Medicine)
                  .WithMany()
                  .HasForeignKey(a => a.MedicineId)
                  .IsRequired(false);

            builder.HasOne(a => a.Course)
                  .WithMany()
                  .HasForeignKey(a => a.CourseId)
                  .IsRequired(false);

            builder.HasOne(a => a.Intake)
                  .WithMany()
                  .HasForeignKey(a => a.IntakeId)
                  .IsRequired(false);
        }
    }
} 