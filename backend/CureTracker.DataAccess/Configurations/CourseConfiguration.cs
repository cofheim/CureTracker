using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace CureTracker.DataAccess.Configurations
{
    public class CourseConfiguration : IEntityTypeConfiguration<CourseEntity>
    {
        public void Configure(EntityTypeBuilder<CourseEntity> builder)
        {
            builder.HasKey(k => k.Id);

            builder.Property(k => k.Name).IsRequired().HasMaxLength(50);
            builder.Property(k => k.Description).IsRequired().HasMaxLength(250);
            builder.Property(k => k.TimesADay).IsRequired();
            builder.Property(k => k.StartDate).IsRequired();
            builder.Property(k => k.EndDate).IsRequired();
            builder.Property(k => k.Status).IsRequired().HasConversion<string>();
            builder.Property(k => k.IntakeFrequency).IsRequired().HasConversion<string>();
            builder.Property(k => k.TakenDosesCount).IsRequired();
            builder.Property(k => k.SkippedDosesCount).IsRequired();

            // Конвертация списка DateTime в JSON для хранения в БД
            var property = builder.Property(c => c.TimesOfTaking)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<List<DateTime>>(v, (JsonSerializerOptions)null)
                )
                .IsRequired();
                
            property.Metadata.SetValueComparer(new ValueComparer<List<DateTime>>(
                (c1, c2) => c1.SequenceEqual(c2),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList()
            ));

            // Связь с лекарством
            builder.HasOne(c => c.Medicine)
                  .WithMany()
                  .HasForeignKey(c => c.MedicineId)
                  .IsRequired();

            // Связь с пользователем
            builder.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .IsRequired();

            // Связь с приемами лекарств
            builder.HasMany(c => c.Intakes)
                  .WithOne(i => i.Course)
                  .HasForeignKey(i => i.CourseId);
        }
    }
} 