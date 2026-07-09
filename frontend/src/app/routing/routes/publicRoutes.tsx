import type { RouteObject } from "react-router-dom";
import { AuthLayout } from "layouts/AuthLayout";
import { LandingPage } from "features/landing/pages/LandingPage";
import { LoginPage } from "features/auth/pages/LoginPage";
import { NotFoundPage } from "pages/NotFoundPage";
import { UnauthorizedPage } from "pages/UnauthorizedPage";
import { RoutePaths } from "shared/constants/routePaths";

export const publicRoutes: RouteObject[] = [
  {
    path: RoutePaths.landing,
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: RoutePaths.login, element: <LoginPage /> },
      { path: RoutePaths.signup, element: <LoginPage /> },
      { path: RoutePaths.adminLogin, element: <LoginPage /> },
      { path: RoutePaths.adminSignup, element: <LoginPage /> },
    ],
  },
  {
    path: RoutePaths.unauthorized,
    element: <UnauthorizedPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
