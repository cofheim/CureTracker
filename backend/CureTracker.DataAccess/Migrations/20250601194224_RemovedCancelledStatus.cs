using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CureTracker.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class RemovedCancelledStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Courses\" SET \"Status\" = 'Completed' WHERE \"Status\" = 'Cancelled';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Если вы хотите предусмотреть откат миграции, 
            // здесь можно добавить SQL для возвращения статуса 'Cancelled'.
            // Например: migrationBuilder.Sql("UPDATE \"Courses\" SET \"Status\" = 'Cancelled' WHERE /* какое-то условие, если это возможно */;");
            // Однако, поскольку мы избавляемся от статуса 'Cancelled', откат может быть нетривиальным
            // или нежелательным. Оставляем пустым, если откат не предусмотрен.
        }
    }
}
