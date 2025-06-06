﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CureTracker.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CureTracker.DataAccess.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<UserEntity>
    {
        public void Configure(EntityTypeBuilder<UserEntity> builder)
        {
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name).IsRequired().HasMaxLength(50);
            builder.Property(x => x.Email).IsRequired().HasMaxLength(50);
            builder.Property(x => x.PasswordHash).IsRequired();
            builder.Property(x => x.TelegramId);
            builder.Property(x => x.ConnectionCode);

            builder.HasMany(u => u.Medicines)
                  .WithOne(m => m.User)
                  .HasForeignKey(m => m.UserId);

            builder.HasMany(u => u.Courses)
                  .WithOne(c => c.User)
                  .HasForeignKey(c => c.UserId);

            builder.HasMany(u => u.Intakes)
                  .WithOne(i => i.User)
                  .HasForeignKey(i => i.UserId);

            builder.HasMany(u => u.ActionLogs)
                  .WithOne(a => a.User)
                  .HasForeignKey(a => a.UserId);
        }
    }
}
