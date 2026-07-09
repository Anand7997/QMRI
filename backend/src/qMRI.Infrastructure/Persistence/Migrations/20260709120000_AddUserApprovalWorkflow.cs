using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using qMRI.Infrastructure.Persistence;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(qMRIDbContext))]
    [Migration("20260709120000_AddUserApprovalWorkflow")]
    public partial class AddUserApprovalWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                schema: "sec",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAtUtc",
                schema: "sec",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                schema: "sec",
                table: "Users",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                schema: "sec",
                table: "Users",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "RequestedAtUtc",
                schema: "sec",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<string>(
                name: "RequestedRoleCode",
                schema: "sec",
                table: "Users",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "USER");

            migrationBuilder.Sql(@"
UPDATE [sec].[Users]
SET [FullName] = [UserName]
WHERE [FullName] = N'';");

            migrationBuilder.Sql(@"
UPDATE users
SET [RequestedRoleCode] = N'ADMIN'
FROM [sec].[Users] users
WHERE EXISTS (
    SELECT 1
    FROM [sec].[UserRoles] userRoles
    INNER JOIN [sec].[Roles] roles ON roles.[RoleId] = userRoles.[RoleId]
    WHERE userRoles.[UserId] = users.[UserId]
      AND roles.[Code] = N'ADMIN'
);");

            migrationBuilder.Sql(@"
UPDATE [sec].[Users]
SET [ApprovalStatus] = 1,
    [IsActive] = 1,
    [ApprovedAtUtc] = COALESCE([ApprovedAtUtc], [CreatedAtUtc]),
    [RequestedAtUtc] = [CreatedAtUtc]
WHERE [ApprovalStatus] = 1;");

            migrationBuilder.CreateIndex(
                name: "IX_Users_ApprovalStatus",
                schema: "sec",
                table: "Users",
                column: "ApprovalStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_ApprovalStatus",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ApprovedAtUtc",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "FullName",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RequestedAtUtc",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RequestedRoleCode",
                schema: "sec",
                table: "Users");
        }
    }
}