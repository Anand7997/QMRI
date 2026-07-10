import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthGuard } from "app/routing/guards/AuthGuard";
import { RoleGuard } from "app/routing/guards/RoleGuard";
import { AdminLayout } from "layouts/AdminLayout";
import { UserLayout } from "layouts/UserLayout";
import { DashboardPage } from "features/dashboard/pages/DashboardPage";
import { UserDashboardPage } from "features/dashboard/pages/UserDashboardPage";
import { AuthenticationDashboardPage } from "features/authentication/pages/AuthenticationDashboardPage";
import { AssessmentListPage } from "features/assessments/pages/AssessmentListPage";
import { ExamTakersPage } from "features/assessments/pages/ExamTakersPage";
import { QuestionBankPage } from "features/question-bank/pages/QuestionBankPage";
import { StructurePage } from "features/catalog/pages/StructurePage";
import { ReportsPage } from "features/reports/pages/ReportsPage";
import { UserReportsPage } from "features/reports/pages/UserReportsPage";
import { SettingsPage } from "features/settings/pages/SettingsPage";
import { UserSettingsPage } from "features/settings/pages/UserSettingsPage";
import { MyAssessmentsPage } from "features/assignments/pages/MyAssessmentsPage";
import { HistoryPage } from "features/assignments/pages/HistoryPage";
import { ProfilePage } from "features/profile/pages/ProfilePage";
import { RoutePaths } from "shared/constants/routePaths";

export const privateRoutes: RouteObject[] = [
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard allowedRoles={["ADMIN"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: RoutePaths.dashboard, element: <DashboardPage /> },
              { path: RoutePaths.authentication, element: <AuthenticationDashboardPage /> },
              { path: RoutePaths.assessments, element: <AssessmentListPage /> },
              { path: RoutePaths.examTakers, element: <ExamTakersPage /> },
              { path: RoutePaths.questionBank, element: <QuestionBankPage /> },
              { path: RoutePaths.structure, element: <StructurePage /> },
              { path: RoutePaths.reports, element: <ReportsPage /> },
              { path: RoutePaths.settings, element: <SettingsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={["USER"]} />,
        children: [
          {
            path: "portal",
            element: <UserLayout />,
            children: [
              { index: true, element: <Navigate to={RoutePaths.portalDashboard} replace /> },
              { path: RoutePaths.portalDashboard, element: <UserDashboardPage /> },
              { path: RoutePaths.portalAssessments, element: <MyAssessmentsPage /> },
              { path: RoutePaths.portalHistory, element: <HistoryPage /> },
              { path: RoutePaths.portalReports, element: <UserReportsPage /> },
              { path: RoutePaths.portalProfile, element: <ProfilePage /> },
              { path: RoutePaths.portalSettings, element: <UserSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
];