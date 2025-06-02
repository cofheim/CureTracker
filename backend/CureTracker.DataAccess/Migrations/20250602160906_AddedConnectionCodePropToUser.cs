using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CureTracker.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddedConnectionCodePropToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConnectionCode",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConnectionCode",
                table: "Users");
        }
    }
}
