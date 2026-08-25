# qMRI

qMRI is a full-stack assessment platform for managing quality maturity reviews. It provides an administrator experience for configuring assessments, users, question banks, reporting, and settings, plus a user portal for completing assigned assessments and reviewing results.

## What Is Inside

```text
QMRI
|-- backend      ASP.NET Core 8 API, EF Core, SQL Server, layered architecture
|-- frontend     React 18 + Vite + TypeScript application
|-- tools        Local development and data helper scripts
|-- docs         Project notes and implementation plans
|-- plan.md      Product and architecture blueprint
```

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, MUI, TanStack Query, React Router |
| Backend | ASP.NET Core 8, EF Core, SQL Server, JWT auth, Serilog, Swagger |
| Architecture | API, Application, Domain, Infrastructure, Shared projects |
| Tooling | npm, PowerShell helper scripts, .NET CLI |

## Local Ports

| Service | URL |
| --- | --- |
| Frontend UI | `http://44.216.167.20:8085` |
| Backend API | `http://44.216.167.20:6000` |
| API health check | `http://44.216.167.20:6000/api/v1/health` |
| Swagger UI | `http://44.216.167.20:6000/swagger` |

The frontend development server proxies `/api` requests to the backend, so application code can call `/api/v1/...` without hardcoding the backend origin.

## Prerequisites

- Node.js and npm
- .NET 8 SDK
- SQL Server access matching `backend/src/qMRI.Api/appsettings.Development.json`
- PowerShell for the root development scripts

## Getting Started

Install frontend dependencies:

```powershell
npm --prefix frontend install
```

Restore backend packages:

```powershell
dotnet restore backend/qMRI.sln
```

Start the full local stack:

```powershell
npm run dev
```

Open the UI at:

```text
http://44.216.167.20:8085
```

Stop local dev processes:

```powershell
npm run stop:all
```

## Useful Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts backend and frontend together |
| `npm run dev:backend` | Starts only the ASP.NET Core API |
| `npm run dev:frontend` | Starts only the Vite frontend |
| `npm run stop:all` | Stops qMRI dev processes on the configured ports |
| `npm --prefix frontend run build` | Builds the frontend |
| `dotnet build backend/src/qMRI.Api/qMRI.Api.csproj` | Builds the backend API project |

## Backend Layout

```text
backend/src
|-- qMRI.Api             Controllers, middleware, Swagger, auth wiring
|-- qMRI.Application     Use cases, DTOs, validation, application services
|-- qMRI.Domain          Entities, enums, value objects, domain rules
|-- qMRI.Infrastructure  EF Core, SQL Server persistence, auth services, seed data
|-- qMRI.Shared          Shared contracts, constants, responses, utilities
```

API routes are versioned under `/api/v1`, including:

- `/api/v1/auth`
- `/api/v1/assessments`
- `/api/v1/assessment-catalog`
- `/api/v1/scoring-models`
- `/api/v1/users`
- `/api/v1/health`

## Frontend Layout

```text
frontend/src
|-- app          Theme and app-level setup
|-- contexts     React context providers
|-- features     Domain feature screens and flows
|-- layouts      Admin and user portal shells
|-- shared       API clients, reusable components, constants, domain helpers
|-- styles       Global styling
```

Key feature areas include assessments, assignments, authentication, catalog management, dashboard, question bank, reports, settings, and users.

## Validation

Run these checks before pushing significant changes:

```powershell
npm --prefix frontend run build
dotnet build backend/src/qMRI.Api/qMRI.Api.csproj
```

## Configuration Notes

- Development CORS is configured in `backend/src/qMRI.Api/appsettings.Development.json`.
- Backend launch ports are configured in `backend/src/qMRI.Api/Properties/launchSettings.json`.
- The frontend proxy target and UI port are configured in `frontend/vite.config.ts` and `frontend/vite.config.js`.
- Database and JWT development settings live under the backend appsettings files.
- Assessment-link email delivery uses `Email__...` environment variables. Set `Email__Enabled=true`, `Email__Host`, `Email__Port`, `Email__FromAddress`, and SMTP credentials before using Send Mail.

## Troubleshooting

If a port is already in use, stop the local stack:

```powershell
npm run stop:all
```

If the frontend cannot reach the API, confirm that:

- the backend is listening on `http://44.216.167.20:6000`
- the UI is running on `http://44.216.167.20:8085`
- CORS includes `http://44.216.167.20:8085`
- the frontend proxy target points to `http://44.216.167.20:6000`



