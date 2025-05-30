using CureTracker.DataAccess.Configurations;
using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace CureTracker.DataAccess
{
    public class CureTrackerDbContext : DbContext
    {
        public CureTrackerDbContext(DbContextOptions options) : base(options)
        {

        }

        public DbSet<MedicineEntity> Medicines { get; set; }
        public DbSet<UserEntity> Users { get; set; }
        public DbSet<CourseEntity> Courses { get; set; }
        public DbSet<IntakeEntity> Intakes { get; set; }
        public DbSet<ActionLogEntity> ActionLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new MedicineConfiguration());
            modelBuilder.ApplyConfiguration(new CourseConfiguration());
            modelBuilder.ApplyConfiguration(new IntakeConfiguration());
            modelBuilder.ApplyConfiguration(new ActionLogConfiguration());
        }
    }
}
