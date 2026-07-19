using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using qMRI.Infrastructure.Persistence;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(qMRIDbContext))]
    [Migration("20260716120000_AddIdentityLinkClientAccess")]
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
