using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardGovernanceSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DashboardSettings",
                schema: "asmt",
                columns: table => new
                {
                    DashboardSettingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SettingKey = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ValueJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DashboardSettings", x => x.DashboardSettingId);
                });

            migrationBuilder.CreateTable(
                name: "GovernanceAuditEntries",
                schema: "asmt",
                columns: table => new
                {
                    GovernanceAuditEntryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Actor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Action = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    EntityName = table.Column<string>(type: "nvarchar(240)", maxLength: 240, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    HappenedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GovernanceAuditEntries", x => x.GovernanceAuditEntryId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DashboardSettings_SettingKey_UserId",
                schema: "asmt",
                table: "DashboardSettings",
                columns: new[] { "SettingKey", "UserId" },
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GovernanceAuditEntries_EntityType",
                schema: "asmt",
                table: "GovernanceAuditEntries",
                column: "EntityType");

            migrationBuilder.CreateIndex(
                name: "IX_GovernanceAuditEntries_HappenedAtUtc",
                schema: "asmt",
                table: "GovernanceAuditEntries",
                column: "HappenedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DashboardSettings",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "GovernanceAuditEntries",
                schema: "asmt");
        }
    }
}
