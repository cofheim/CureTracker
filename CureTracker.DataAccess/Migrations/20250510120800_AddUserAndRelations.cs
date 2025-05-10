using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CureTracker.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAndRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Medicines",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.Sql(@"
                UPDATE ""Medicines"" SET ""Type"" = 
                CASE ""Type"" 
                    WHEN '0' THEN 'Capsule' 
                    WHEN '1' THEN 'Tablet' 
                    WHEN '2' THEN 'Liquid' 
                    WHEN '3' THEN 'Injection' 
                    WHEN '4' THEN 'Powder' 
                    WHEN '5' THEN 'Other' 
                    ELSE 'Other'
                END");

            migrationBuilder.AlterColumn<string>(
                name: "StorageConditions",
                table: "Medicines",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Medicines",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.Sql(@"
                UPDATE ""Medicines"" SET ""Status"" = 
                CASE ""Status"" 
                    WHEN '0' THEN 'Planned' 
                    WHEN '1' THEN 'InProgress' 
                    WHEN '2' THEN 'Taken' 
                    WHEN '3' THEN 'Missed' 
                    WHEN '4' THEN 'Skipped' 
                    ELSE 'Planned'
                END");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Medicines",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "IntakeFrequency",
                table: "Medicines",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.Sql(@"
                UPDATE ""Medicines"" SET ""IntakeFrequency"" = 
                CASE ""IntakeFrequency"" 
                    WHEN '0' THEN 'Daily' 
                    WHEN '1' THEN 'Weekly' 
                    WHEN '2' THEN 'Monthly' 
                    ELSE 'Daily'
                END");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Medicines",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
                
            migrationBuilder.Sql(@"
                UPDATE ""Medicines"" 
                SET ""Name"" = SUBSTRING(""Name"", 1, 50) 
                WHERE LENGTH(""Name"") > 50;

                UPDATE ""Medicines"" 
                SET ""Description"" = SUBSTRING(""Description"", 1, 250) 
                WHERE LENGTH(""Description"") > 250;

                UPDATE ""Medicines"" 
                SET ""StorageConditions"" = SUBSTRING(""StorageConditions"", 1, 100) 
                WHERE LENGTH(""StorageConditions"") > 100;
            ");

            migrationBuilder.AddColumn<DateTime>(
                name: "TimeOfTaking",
                table: "Medicines",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Medicines",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    TelegramId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });
                
            Guid defaultUserId = new Guid("11111111-1111-1111-1111-111111111111");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Name", "Email", "PasswordHash" },
                values: new object[] { defaultUserId, "Default User", "default@example.com", "defaultpasswordhash" }
            );

            migrationBuilder.Sql($"UPDATE \"Medicines\" SET \"UserId\" = '{defaultUserId}'");

            migrationBuilder.CreateIndex(
                name: "IX_Medicines_UserId",
                table: "Medicines",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Medicines_Users_UserId",
                table: "Medicines",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Medicines_Users_UserId",
                table: "Medicines");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Medicines_UserId",
                table: "Medicines");

            migrationBuilder.DropColumn(
                name: "TimeOfTaking",
                table: "Medicines");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Medicines");

            migrationBuilder.AlterColumn<int>(
                name: "Type",
                table: "Medicines",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "StorageConditions",
                table: "Medicines",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Medicines",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Medicines",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<int>(
                name: "IntakeFrequency",
                table: "Medicines",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Medicines",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(250)",
                oldMaxLength: 250);
        }
    }
}
