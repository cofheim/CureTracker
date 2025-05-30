using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CureTracker.DataAccess.Configurations
{
    public class IntakeConfiguration : IEntityTypeConfiguration<IntakeEntity>
    {
        public void Configure(EntityTypeBuilder<IntakeEntity> builder)
        {
            builder.HasKey(k => k.Id);

            builder.Property(k => k.ScheduledTime).IsRequired();
            builder.Property(k => k.ActualTime);
            builder.Property(k => k.Status).IsRequired().HasConversion<string>();
            builder.Property(k => k.SkipReason).HasMaxLength(250);

            // Связь с курсом
            builder.HasOne(i => i.Course)
                  .WithMany(c => c.Intakes)
                  .HasForeignKey(i => i.CourseId)
                  .IsRequired();

            // Связь с пользователем
            builder.HasOne(i => i.User)
                  .WithMany()
                  .HasForeignKey(i => i.UserId)
                  .IsRequired();
        }
    }
} 