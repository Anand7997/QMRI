export const RoutePaths = {
  root: "/",
  landing: "/",
  login: "/login",
  signup: "/signup",
  adminLogin: "/admin/login",
  adminSignup: "/admin/signup",
  dashboard: "/dashboard",
  authentication: "/authentication",
  assessments: "/assessments",
  examTakers: "/exam-takers",
  questionBank: "/question-bank",
  structure: "/structure",
  reports: "/reports",
  settings: "/settings",

  // User portal
  portalDashboard: "/portal/dashboard",
  portalAssessments: "/portal/my-assessments",
  portalHistory: "/portal/history",
  portalReports: "/portal/reports",
  portalProfile: "/portal/profile",
  portalSettings: "/portal/settings",

  unauthorized: "/unauthorized",
} as const;