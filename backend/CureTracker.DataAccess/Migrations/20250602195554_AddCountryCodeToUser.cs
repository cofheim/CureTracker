using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CureTracker.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddCountryCodeToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CountryCode",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountryCode",
                table: "Users");
        }
    }
}
