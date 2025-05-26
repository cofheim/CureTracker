using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CureTracker.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddTakenDosesCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TakenDosesCount",
                table: "Medicines",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TakenDosesCount",
                table: "Medicines");
        }
    }
}
