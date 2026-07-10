using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using qMRI.Infrastructure.Persistence;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(qMRIDbContext))]
    [Migration("20260709143000_AddAssessmentScopeSelection")]
    public partial class AddAssessmentScopeSelection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Departments",
                schema: "asmt",
                table: "Assessments",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedQuestionIds",
                schema: "asmt",
                table: "Assessments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Departments",
                schema: "asmt",
                table: "Assessments");

            migrationBuilder.DropColumn(
                name: "SelectedQuestionIds",
                schema: "asmt",
                table: "Assessments");
        }
    }
}
