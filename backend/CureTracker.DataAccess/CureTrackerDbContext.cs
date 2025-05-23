

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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new MedicineConfiguration());
        }
    }
}
