export const RoutePaths = {
  root: "/",
  landing: "/",
  login: "/login",
  signup: "/signup",
  adminLogin: "/admin/login",
  adminSignup: "/admin/signup",
  identityLink: "/identity-link",
  dashboard: "/dashboard",
  dashboardRecent: "/dashboard/recent",
  dashboardExport: "/dashboard/export",
  dashboardScoring: "/dashboard/scoring",
  dashboardTemplates: "/dashboard/templates",
  dashboardAudit: "/dashboard/audit",
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
  portalAgentAnalysis: "/portal/assessments/:assessmentId/agent-analysis",
  portalHistory: "/portal/history",
  portalReports: "/portal/reports",
  portalProfile: "/portal/profile",
  portalSettings: "/portal/settings",

  unauthorized: "/unauthorized",
} as const;

export const portalAgentAnalysisPath = (assessmentId: string) =>
RoutePaths.portalAgentAnalysis.replace(":assessmentId", assessmentId);
