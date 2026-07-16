using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityLinkClientAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "IdentityLinkConsumedAtUtc",
                schema: "sec",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IdentityLinkExpiresAtUtc",
                schema: "sec",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityLinkTokenHash",
                schema: "sec",
                table: "Users",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdentityLinkConsumedAtUtc",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IdentityLinkExpiresAtUtc",
                schema: "sec",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IdentityLinkTokenHash",
                schema: "sec",
                table: "Users");
        }
    }
}
