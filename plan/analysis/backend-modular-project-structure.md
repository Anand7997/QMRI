# qMRI Backend Modular Project Structure

## Target Architecture Style

- Modular Monolith with Clean Architecture boundaries.
- Feature-first modules across Api, Application, Domain, and Infrastructure.
- Shared cross-cutting concerns centralized in Shared and Api pipeline layers.

## Solution Structure

```text
qMRI.sln
|
|-- src
|   |-- qMRI.Api
|   |   |-- Modules
|   |   |   |-- Authentication
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- IdentityAccess
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- AssessmentCatalog
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- AssessmentStructure
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- QuestionBank
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- AssignmentExecution
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- Scoring
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- Recommendations
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- Reports
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- Analytics
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |   |
|   |   |   |-- Governance
|   |   |   |   |-- Controllers
|   |   |   |   |-- Dtos
|   |   |   |   |-- Filters
|   |   |
|   |   |-- Middleware
|   |   |-- Filters
|   |   |-- CompositionRoot
|   |
|   |-- qMRI.Application
|   |   |-- Modules
|   |   |   |-- Authentication
|   |   |   |   |-- Services
|   |   |   |   |-- Interfaces
|   |   |   |   |-- Dtos
|   |   |   |   |-- Validators
|   |   |   |
|   |   |   |-- IdentityAccess
|   |   |   |   |-- Services
|   |   |   |   |-- Interfaces
|   |   |   |   |-- Dtos
|   |   |   |   |-- Validators
|   |   |   |
|   |   |   |-- AssessmentCatalog
|   |   |   |-- AssessmentStructure
|   |   |   |-- QuestionBank
|   |   |   |-- AssignmentExecution
|   |   |   |-- Scoring
|   |   |   |-- Recommendations
|   |   |   |-- Reports
|   |   |   |-- Analytics
|   |   |   |-- Governance
|   |   |
|   |   |-- Common
|   |       |-- Behaviors
|   |       |-- Exceptions
|   |       |-- Pipeline
|   |
|   |-- qMRI.Domain
|   |   |-- Modules
|   |   |   |-- Authentication
|   |   |   |   |-- Entities
|   |   |   |   |-- ValueObjects
|   |   |   |   |-- Enums
|   |   |   |   |-- Rules
|   |   |   |
|   |   |   |-- IdentityAccess
|   |   |   |-- AssessmentCatalog
|   |   |   |-- AssessmentStructure
|   |   |   |-- QuestionBank
|   |   |   |-- AssignmentExecution
|   |   |   |-- Scoring
|   |   |   |-- Recommendations
|   |   |   |-- Reports
|   |   |   |-- Analytics
|   |   |   |-- Governance
|   |
|   |-- qMRI.Infrastructure
|   |   |-- Modules
|   |   |   |-- Authentication
|   |   |   |   |-- Repositories
|   |   |   |   |-- Persistence
|   |   |   |
|   |   |   |-- IdentityAccess
|   |   |   |-- AssessmentCatalog
|   |   |   |-- AssessmentStructure
|   |   |   |-- QuestionBank
|   |   |   |-- AssignmentExecution
|   |   |   |-- Scoring
|   |   |   |-- Recommendations
|   |   |   |-- Reports
|   |   |   |-- Analytics
|   |   |   |-- Governance
|   |   |
|   |   |-- Persistence
|   |   |   |-- DbContext
|   |   |   |-- Configurations
|   |   |   |-- Migrations
|   |   |
|   |   |-- Security
|   |   |-- Storage
|   |   |-- Observability
|   |
|   |-- qMRI.Shared
|       |-- Contracts
|       |-- Responses
|       |-- Constants
|       |-- Policies
|       |-- Utilities
|
|-- tests
|   |-- qMRI.UnitTests
|   |-- qMRI.IntegrationTests
|   |-- qMRI.ApiTests
```

## Module Breakdown

### 1. Authentication

Responsibilities: User login, token issuance, token refresh, logout, current-user context, account lockout checks.

Entities: UserCredential, RefreshToken, AuthSession, LoginAttempt.

Services: AuthenticationService, TokenService, SessionService, PasswordPolicyService.

Repositories: IUserRepository, IRefreshTokenRepository, ILoginAttemptRepository.

Controllers: AuthController.

DTOs: LoginRequest, RefreshTokenRequest, LogoutRequest, AuthTokenResponse, CurrentUserResponse.

Validators: LoginRequestValidator, RefreshTokenRequestValidator, LogoutRequestValidator.

Middleware: JwtAuthenticationMiddleware, CorrelationIdMiddleware.

Filters: AuthErrorMappingFilter, RateLimitActionFilter.

### 2. IdentityAccess

Responsibilities: User management, role management, permission assignment, account status changes, security governance.

Entities: User, Role, Permission, UserRole, RolePermission.

Services: UserService, RoleService, PermissionService, AccessPolicyService.

Repositories: IUserRepository, IRoleRepository, IPermissionRepository, IUserRoleRepository, IRolePermissionRepository.

Controllers: UsersController, RolesController, PermissionsController.

DTOs: UserListItem, UserDetail, CreateUserRequest, UpdateUserRequest, RoleDetail, CreateRoleRequest, UpdateRoleRequest.

Validators: CreateUserValidator, UpdateUserValidator, CreateRoleValidator, UpdateRoleValidator, DeactivateUserValidator.

Middleware: AuthorizationMiddleware, CorrelationIdMiddleware.

Filters: PermissionPolicyFilter, ConcurrencyFilter.

### 3. AssessmentCatalog

Responsibilities: Assessment family lifecycle, version lifecycle, publish and archive workflow, assessment metadata governance.

Entities: Assessment, AssessmentVersion, AssessmentStatus.

Services: AssessmentCatalogService, AssessmentVersionService, PublishValidationService.

Repositories: IAssessmentRepository, IAssessmentVersionRepository.

Controllers: AssessmentsController, AssessmentVersionsController.

DTOs: AssessmentListItem, AssessmentDetail, CreateAssessmentRequest, UpdateAssessmentRequest, CreateVersionRequest, PublishRequest, ArchiveRequest.

Validators: CreateAssessmentValidator, UpdateAssessmentValidator, CreateVersionValidator, PublishAssessmentValidator, ArchiveVersionValidator.

Middleware: ValidationExceptionMiddleware, CorrelationIdMiddleware.

Filters: DraftOnlyMutationFilter, PublishPrecheckFilter.

### 4. AssessmentStructure

Responsibilities: Hierarchy authoring for intensity, pillar, module, sub module, checkpoint, and version-bound questions; reorder operations.

Entities: AssessmentIntensity, AssessmentPillar, Module, SubModule, Checkpoint, AssessmentQuestion.

Services: StructureAuthoringService, WeightValidationService, SequenceReorderService.

Repositories: IAssessmentIntensityRepository, IAssessmentPillarRepository, IModuleRepository, ISubModuleRepository, ICheckpointRepository, IAssessmentQuestionRepository.

Controllers: AssessmentStructureController, ModulesController, SubModulesController, CheckpointsController, AssessmentQuestionsController.

DTOs: StructureTreeResponse, ModuleDto, SubModuleDto, CheckpointDto, AssessmentQuestionDto, ReorderItemsRequest.

Validators: ModuleValidator, SubModuleValidator, CheckpointValidator, AssessmentQuestionValidator, ReorderItemsValidator, WeightRulesValidator.

Middleware: ValidationExceptionMiddleware, CorrelationIdMiddleware.

Filters: DraftVersionEnforcementFilter, WeightTotalFilter.

### 5. QuestionBank

Responsibilities: Reusable question governance, response scale management, question usage policy across versions.

Entities: QuestionBankItem, QuestionType, ResponseScale, ResponseScaleOption.

Services: QuestionBankService, ResponseScaleService, QuestionUsagePolicyService.

Repositories: IQuestionBankRepository, IResponseScaleRepository, IResponseScaleOptionRepository.

Controllers: QuestionBankController, ResponseScalesController.

DTOs: QuestionBankItemDto, CreateQuestionBankItemRequest, UpdateQuestionBankItemRequest, ResponseScaleDto, ResponseScaleOptionDto.

Validators: QuestionBankItemValidator, ResponseScaleValidator, ResponseScaleOptionValidator.

Middleware: ValidationExceptionMiddleware, CorrelationIdMiddleware.

Filters: PublishedReferenceLockFilter, SoftDeleteReasonFilter.

### 6. AssignmentExecution

Responsibilities: Assignment listing, start/resume workflow, response save, submit, reopen, progress tracking, declaration checks.

Entities: AssignmentBatch, AssessmentAssignment, UserResponse, UserResponseOption, ResponseAttachment, Submission.

Services: AssignmentService, ResponseService, SubmissionService, ProgressCalculationService, ReopenPolicyService.

Repositories: IAssignmentBatchRepository, IAssessmentAssignmentRepository, IUserResponseRepository, IUserResponseOptionRepository, ISubmissionRepository.

Controllers: MyAssignmentsController, AssignmentsController, ResponsesController, SubmissionsController.

DTOs: AssignedAssessmentDto, AssignmentDetailDto, AssignmentWorkspaceDto, SaveResponsesRequest, SaveResponsesResponse, SubmitAssessmentRequest, SubmissionResultDto, ReopenAssignmentRequest.

Validators: SaveResponsesValidator, SubmitAssessmentValidator, ReopenAssignmentValidator, ResponseShapeValidator.

Middleware: AssignmentOwnershipMiddleware, CorrelationIdMiddleware.

Filters: AssignmentStateFilter, DeclarationRequiredFilter.

### 7. Scoring

Responsibilities: Score execution, score rollups by hierarchy, maturity level calculation, score run persistence.

Entities: ScoringModel, MaturityLevel, ScoreRun, ScoreResult.

Services: ScoringEngineService, ScoreAggregationService, MaturityBandService, ScoreRunService.

Repositories: IScoringModelRepository, IMaturityLevelRepository, IScoreRunRepository, IScoreResultRepository.

Controllers: ScoresController, ScoringModelsController.

DTOs: AssessmentScoreSummaryDto, ScoreResultDto, ScoreRunDto, ScoringModelDto.

Validators: ScoreRunRequestValidator, ScoringModelValidator.

Middleware: ValidationExceptionMiddleware, CorrelationIdMiddleware.

Filters: AssignmentSubmittedFilter, AssignmentScoredFilter.

### 8. Recommendations

Responsibilities: Rule authoring, recommendation generation from scores, recommendation snapshot persistence.

Entities: RecommendationRule, GeneratedRecommendation, RecommendationPriority.

Services: RecommendationRuleService, RecommendationGenerationService, RecommendationScopeService.

Repositories: IRecommendationRuleRepository, IGeneratedRecommendationRepository.

Controllers: RecommendationRulesController, GeneratedRecommendationsController.

DTOs: RecommendationRuleDto, CreateRecommendationRuleRequest, UpdateRecommendationRuleRequest, GeneratedRecommendationDto.

Validators: RecommendationRuleValidator, ScoreRangeValidator, RecommendationScopeValidator.

Middleware: ValidationExceptionMiddleware, CorrelationIdMiddleware.

Filters: DraftVersionRuleMutationFilter, AssignmentScoredFilter.

### 9. Reports

Responsibilities: Report generation requests, metadata management, download authorization, export history tracking.

Entities: ReportTemplate, GeneratedReport, ExportHistory, FileAsset.

Services: ReportGenerationService, ReportTemplateService, ReportDownloadService, ExportHistoryService.

Repositories: IReportTemplateRepository, IGeneratedReportRepository, IExportHistoryRepository, IFileAssetRepository.

Controllers: ReportsController, ReportTemplatesController, ExportHistoryController.

DTOs: GenerateReportRequest, GeneratedReportDto, ExportHistoryDto, ReportTemplateDto, FileAssetDto.

Validators: GenerateReportValidator, ReportTemplateValidator, DateRangeValidator.

Middleware: FileDownloadGuardMiddleware, CorrelationIdMiddleware.

Filters: ReportOwnershipFilter, AssignmentScoredFilter.

### 10. Analytics

Responsibilities: Admin and user dashboard projections, maturity trend aggregation, completion and comparison analytics.

Entities: AnalyticsSnapshot, MaturityTrendPoint, CompletionMetric, PillarMetric.

Services: DashboardAnalyticsService, MaturityAnalyticsService, CompletionAnalyticsService, ComparativeAnalyticsService.

Repositories: IAnalyticsReadRepository, IScoreResultReadRepository, IAssignmentReadRepository.

Controllers: DashboardController, AnalyticsController.

DTOs: AdminDashboardSummaryDto, UserDashboardSummaryDto, MaturityTrendDto, PillarAnalyticsDto, CompletionAnalyticsDto.

Validators: DashboardQueryValidator, AnalyticsDateRangeValidator.

Middleware: CorrelationIdMiddleware, ResponseCachingPolicyMiddleware.

Filters: AnalyticsPermissionFilter.

### 11. Governance

Responsibilities: Platform settings, lookup catalogs, logo and policy controls, file upload policy enforcement.

Entities: ApplicationSettings, PasswordPolicy, FileUploadPolicy, LookupValue, LogoAsset.

Services: SettingsService, LookupCatalogService, BrandingService, FilePolicyService.

Repositories: ISettingsRepository, ILookupRepository, ILogoAssetRepository.

Controllers: SettingsController, LookupsController, BrandingController.

DTOs: ApplicationSettingsDto, UpdateApplicationSettingsRequest, LookupCatalogDto, FileAssetDto.

Validators: ApplicationSettingsValidator, FilePolicyValidator, LogoUploadValidator.

Middleware: MultipartSafetyMiddleware, CorrelationIdMiddleware.

Filters: AdminOnlyFilter, FileTypeAndSizeFilter.

### 12. AuditCompliance

Responsibilities: Audit event persistence, field-level change tracking, audit query and export.

Entities: AuditEvent, AuditChange, AuditActionType.

Services: AuditTrailService, AuditExportService, AuditSearchService.

Repositories: IAuditEventRepository, IAuditChangeRepository.

Controllers: AuditLogsController.

DTOs: AuditEventDto, AuditChangeDto, AuditSearchRequest, AuditExportRequest.

Validators: AuditSearchValidator, AuditExportValidator.

Middleware: AuditEnrichmentMiddleware, CorrelationIdMiddleware.

Filters: AuditableActionFilter, CorrelationIdPropagationFilter.

## Cross-Cutting Pipeline Structure

### Shared Middleware

- CorrelationIdMiddleware
- GlobalExceptionMiddleware
- RequestLoggingMiddleware
- JwtAuthenticationMiddleware
- AuthorizationMiddleware
- AuditEnrichmentMiddleware
- MultipartSafetyMiddleware
- ResponseCachingPolicyMiddleware

### Shared Filters

- ValidationFilter
- ConcurrencyFilter
- PermissionPolicyFilter
- OwnershipFilter
- SoftDeleteReasonFilter
- AssignmentStateFilter
- DraftVersionEnforcementFilter
- AuditableActionFilter

## Registration Structure

```text
qMRI.Api/CompositionRoot
|-- DependencyRegistration
|-- ModuleRegistration
|-- PipelineRegistration
```

```text
qMRI.Application/Common/Pipeline
|-- ValidationBehavior
|-- TransactionBehavior
|-- AuditBehavior
|-- PerformanceBehavior
```

## Tests Structure By Module

```text
tests
|-- qMRI.UnitTests
|   |-- Modules
|   |   |-- Authentication
|   |   |-- IdentityAccess
|   |   |-- AssessmentCatalog
|   |   |-- AssessmentStructure
|   |   |-- QuestionBank
|   |   |-- AssignmentExecution
|   |   |-- Scoring
|   |   |-- Recommendations
|   |   |-- Reports
|   |   |-- Analytics
|   |   |-- Governance
|   |   |-- AuditCompliance
|
|-- qMRI.IntegrationTests
|   |-- Modules
|   |   |-- Authentication
|   |   |-- IdentityAccess
|   |   |-- AssessmentCatalog
|   |   |-- AssessmentStructure
|   |   |-- QuestionBank
|   |   |-- AssignmentExecution
|   |   |-- Scoring
|   |   |-- Recommendations
|   |   |-- Reports
|   |   |-- Analytics
|   |   |-- Governance
|   |   |-- AuditCompliance
|
|-- qMRI.ApiTests
    |-- Modules
        |-- Authentication
        |-- IdentityAccess
        |-- AssessmentCatalog
        |-- AssessmentStructure
        |-- QuestionBank
        |-- AssignmentExecution
        |-- Scoring
        |-- Recommendations
        |-- Reports
        |-- Analytics
        |-- Governance
        |-- AuditCompliance
```
