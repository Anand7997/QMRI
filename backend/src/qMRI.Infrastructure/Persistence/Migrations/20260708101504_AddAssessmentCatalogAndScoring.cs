using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace qMRI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAssessmentCatalogAndScoring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "asmt");

            migrationBuilder.CreateTable(
                name: "Categories",
                schema: "asmt",
                columns: table => new
                {
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "ScoringModels",
                schema: "asmt",
                columns: table => new
                {
                    ScoringModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScoringModels", x => x.ScoringModelId);
                });

            migrationBuilder.CreateTable(
                name: "Modules",
                schema: "asmt",
                columns: table => new
                {
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Modules", x => x.ModuleId);
                    table.ForeignKey(
                        name: "FK_Modules_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "asmt",
                        principalTable: "Categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Assessments",
                schema: "asmt",
                columns: table => new
                {
                    AssessmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScoringModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SubmittedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScoredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assessments", x => x.AssessmentId);
                    table.ForeignKey(
                        name: "FK_Assessments_ScoringModels_ScoringModelId",
                        column: x => x.ScoringModelId,
                        principalSchema: "asmt",
                        principalTable: "ScoringModels",
                        principalColumn: "ScoringModelId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Assessments_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "sec",
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MaturityBands",
                schema: "asmt",
                columns: table => new
                {
                    MaturityBandId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScoringModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MinScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    MaxScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Level = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Label = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TmmiLevel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaturityBands", x => x.MaturityBandId);
                    table.ForeignKey(
                        name: "FK_MaturityBands_ScoringModels_ScoringModelId",
                        column: x => x.ScoringModelId,
                        principalSchema: "asmt",
                        principalTable: "ScoringModels",
                        principalColumn: "ScoringModelId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScoringRules",
                schema: "asmt",
                columns: table => new
                {
                    ScoringRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScoringModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Answer = table.Column<int>(type: "int", nullable: false),
                    Points = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScoringRules", x => x.ScoringRuleId);
                    table.ForeignKey(
                        name: "FK_ScoringRules_ScoringModels_ScoringModelId",
                        column: x => x.ScoringModelId,
                        principalSchema: "asmt",
                        principalTable: "ScoringModels",
                        principalColumn: "ScoringModelId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubModules",
                schema: "asmt",
                columns: table => new
                {
                    SubModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubModules", x => x.SubModuleId);
                    table.ForeignKey(
                        name: "FK_SubModules_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalSchema: "asmt",
                        principalTable: "Modules",
                        principalColumn: "ModuleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Recommendations",
                schema: "asmt",
                columns: table => new
                {
                    RecommendationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recommendations", x => x.RecommendationId);
                    table.ForeignKey(
                        name: "FK_Recommendations_Assessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalSchema: "asmt",
                        principalTable: "Assessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Recommendations_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "asmt",
                        principalTable: "Categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Recommendations_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalSchema: "asmt",
                        principalTable: "Modules",
                        principalColumn: "ModuleId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentScores",
                schema: "asmt",
                columns: table => new
                {
                    AssessmentScoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Scope = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SubModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Score = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    AnsweredCount = table.Column<int>(type: "int", nullable: false),
                    QuestionCount = table.Column<int>(type: "int", nullable: false),
                    MaturityLevel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CalculatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentScores", x => x.AssessmentScoreId);
                    table.ForeignKey(
                        name: "FK_AssessmentScores_Assessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalSchema: "asmt",
                        principalTable: "Assessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssessmentScores_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "asmt",
                        principalTable: "Categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssessmentScores_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalSchema: "asmt",
                        principalTable: "Modules",
                        principalColumn: "ModuleId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssessmentScores_SubModules_SubModuleId",
                        column: x => x.SubModuleId,
                        principalSchema: "asmt",
                        principalTable: "SubModules",
                        principalColumn: "SubModuleId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Questions",
                schema: "asmt",
                columns: table => new
                {
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Guidance = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.QuestionId);
                    table.ForeignKey(
                        name: "FK_Questions_SubModules_SubModuleId",
                        column: x => x.SubModuleId,
                        principalSchema: "asmt",
                        principalTable: "SubModules",
                        principalColumn: "SubModuleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentResponses",
                schema: "asmt",
                columns: table => new
                {
                    AssessmentResponseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Answer = table.Column<int>(type: "int", nullable: false),
                    Points = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    Findings = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    AnsweredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentResponses", x => x.AssessmentResponseId);
                    table.ForeignKey(
                        name: "FK_AssessmentResponses_Assessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalSchema: "asmt",
                        principalTable: "Assessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssessmentResponses_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalSchema: "asmt",
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentResponses_AssessmentId_QuestionId",
                schema: "asmt",
                table: "AssessmentResponses",
                columns: new[] { "AssessmentId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentResponses_QuestionId",
                schema: "asmt",
                table: "AssessmentResponses",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_ScoringModelId",
                schema: "asmt",
                table: "Assessments",
                column: "ScoringModelId");

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_Status",
                schema: "asmt",
                table: "Assessments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_UserId",
                schema: "asmt",
                table: "Assessments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScores_AssessmentId_Scope",
                schema: "asmt",
                table: "AssessmentScores",
                columns: new[] { "AssessmentId", "Scope" });

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScores_CategoryId",
                schema: "asmt",
                table: "AssessmentScores",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScores_ModuleId",
                schema: "asmt",
                table: "AssessmentScores",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScores_SubModuleId",
                schema: "asmt",
                table: "AssessmentScores",
                column: "SubModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Code",
                schema: "asmt",
                table: "Categories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MaturityBands_ScoringModelId_SortOrder",
                schema: "asmt",
                table: "MaturityBands",
                columns: new[] { "ScoringModelId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Modules_CategoryId_Code",
                schema: "asmt",
                table: "Modules",
                columns: new[] { "CategoryId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Questions_SubModuleId",
                schema: "asmt",
                table: "Questions",
                column: "SubModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_AssessmentId",
                schema: "asmt",
                table: "Recommendations",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_CategoryId",
                schema: "asmt",
                table: "Recommendations",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_ModuleId",
                schema: "asmt",
                table: "Recommendations",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_ScoringModels_Name",
                schema: "asmt",
                table: "ScoringModels",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScoringRules_ScoringModelId_Answer",
                schema: "asmt",
                table: "ScoringRules",
                columns: new[] { "ScoringModelId", "Answer" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubModules_ModuleId_Code",
                schema: "asmt",
                table: "SubModules",
                columns: new[] { "ModuleId", "Code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssessmentResponses",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "AssessmentScores",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "MaturityBands",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "Recommendations",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "ScoringRules",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "Questions",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "Assessments",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "SubModules",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "ScoringModels",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "Modules",
                schema: "asmt");

            migrationBuilder.DropTable(
                name: "Categories",
                schema: "asmt");
        }
    }
}
