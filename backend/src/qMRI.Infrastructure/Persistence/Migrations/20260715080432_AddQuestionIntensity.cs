using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionIntensity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Intensity",
                schema: "asmt",
                table: "Questions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AlterColumn<int>(
                name: "Intensity",
                schema: "asmt",
                table: "Questions",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Intensity",
                schema: "asmt",
                table: "Questions");
        }
    }
}

