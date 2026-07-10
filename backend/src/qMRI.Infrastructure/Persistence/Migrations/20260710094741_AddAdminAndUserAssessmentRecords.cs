using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminAndUserAssessmentRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Admin_record",
                schema: "asmt",
                columns: table => new
                {
                    AdminRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedByUserName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    AssignedByFullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedToUserName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    AssignedToFullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AssignedDepartments = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    AssignedQuestionIds = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Admin_record", x => x.AdminRecordId);
                    table.ForeignKey(
                        name: "FK_Admin_record_Assessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalSchema: "asmt",
                        principalTable: "Assessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Admin_record_Users_AssignedByUserId",
                        column: x => x.AssignedByUserId,
                        principalSchema: "sec",
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Admin_record_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalSchema: "sec",
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_record",
                schema: "asmt",
                columns: table => new
                {
                    UserRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RecordDateUtc = table.Column<DateTime>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_record", x => x.UserRecordId);
                    table.ForeignKey(
                        name: "FK_user_record_Assessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalSchema: "asmt",
                        principalTable: "Assessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_record_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "sec",
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Admin_record_AssessmentId",
                schema: "asmt",
                table: "Admin_record",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Admin_record_AssignedAtUtc",
                schema: "asmt",
                table: "Admin_record",
                column: "AssignedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Admin_record_AssignedByUserId",
                schema: "asmt",
                table: "Admin_record",
                column: "AssignedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Admin_record_AssignedToUserId",
                schema: "asmt",
                table: "Admin_record",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_record_AssessmentId",
                schema: "asmt",
                table: "user_record",
                column: "AssessmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_record_RecordDateUtc",
                schema: "asmt",
                table: "user_record",
                column: "RecordDateUtc");

            migrationBuilder.CreateIndex(
                name: "IX_user_record_UserId",
                schema: "asmt",
                table: "user_record",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Admin_record",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "user_record",
                schema: "asmt");
        }
    }
}
