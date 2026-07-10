import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import { GetStartedButton, MetricTile, QmriLogo } from "shared/components";
import { brandTokens, neutralTokens, semanticTokens } from "app/theme/tokens/palette";
import { RoutePaths } from "shared/constants/routePaths";
import { ScrollExpandMedia } from "../components/ScrollExpandMedia";
import { TextParallaxContent } from "../components/TextParallaxContent";

const heroBgImage =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80";
const heroMediaImage =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80";

const stats = [
  { label: "Analysis & solution effort", value: 50, icon: <SpeedOutlinedIcon fontSize="inherit" />, sub: "reduction", accent: brandTokens.blue600 },
  { label: "Resolution time", value: 95, icon: <TimelapseOutlinedIcon fontSize="inherit" />, sub: "improvement", accent: semanticTokens.successMain },
  { label: "Support efficiency", value: 30, icon: <SupportAgentOutlinedIcon fontSize="inherit" />, sub: "improvement", accent: semanticTokens.warningMain },
];

const method = [
  {
    icon: AssessmentOutlinedIcon,
    title: "Measures",
    body: "Capture quality maturity across teams, practices, tools and governance using a structured assessment model.",
    color: brandTokens.blue600,
  },
  {
    icon: InsightsOutlinedIcon,
    title: "Recommend",
    body: "Translate responses into maturity bands, priority gaps and practical next actions for improvement.",
    color: semanticTokens.warningMain,
  },
  {
    icon: RocketLaunchOutlinedIcon,
    title: "Implement",
    body: "Move from scorecards to execution with approved access, dashboards and focused recommendation tracking.",
    color: semanticTokens.successMain,
  },
];

const capabilities = [
  { icon: FactCheckOutlinedIcon, title: "Governed question bank", body: "Consistent categories, modules and sub-modules keep each assessment comparable." },
  { icon: RouteOutlinedIcon, title: "Maturity path", body: "Scores map into Testing, QA, QE and IQ bands so progress is easy to read." },
  { icon: VerifiedUserOutlinedIcon, title: "Approved access", body: "Admins approve users first, keeping dashboards and reports controlled." },
  { icon: AutoFixHighOutlinedIcon, title: "Action focus", body: "Recommendations point teams toward the strongest improvement opportunities." },
];

const bands = ["Testing", "Quality Assurance", "Quality Engineering", "Intelligent Quality"];

export function LandingPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: neutralTokens.surface0, color: neutralTokens.ink900 }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${neutralTokens.line300}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between", minHeight: 68 }}>
            <QmriLogo size="md" />
            <Button
              component={RouterLink}
              to={RoutePaths.adminLogin}
              startIcon={<AdminPanelSettingsOutlinedIcon />}
              sx={{
                minHeight: 44,
                px: 2.25,
                borderRadius: 999,
                color: "#fff",
                fontWeight: 800,
                background: `linear-gradient(135deg, ${brandTokens.blue700} 0%, ${brandTokens.blue500} 100%)`,
                boxShadow: "0 14px 28px rgba(21, 101, 192, 0.28)",
                "&:hover": {
                  background: `linear-gradient(135deg, ${brandTokens.blue700} 0%, ${brandTokens.blue600} 100%)`,
                  boxShadow: "0 18px 34px rgba(21, 101, 192, 0.34)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Admin
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <ScrollExpandMedia
        mediaType="image"
        mediaSrc={heroMediaImage}
        bgImageSrc={heroBgImage}
        logoSrc="/qmri-logo-cutout.png"
        logoAlt="QMRI - Quinnox Measures, Recommend and Implement"
        title="Accelerate Success"
        date="Measure . Recommend . Implement"
        scrollToExpand="Scroll to explore QMRI"
        textBlend
      >
        <Box sx={{ bgcolor: neutralTokens.surface0, color: neutralTokens.ink900, pt: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg" sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
            <Typography variant="overline" sx={{ color: brandTokens.blue600, fontWeight: 800, letterSpacing: "0.08em" }}>
              Quinnox Measures, Recommend and Implement
            </Typography>
            <Typography variant="h1" sx={{ mt: 1.5, mx: "auto", maxWidth: 820, fontSize: { xs: "1.75rem", md: "2.5rem" }, fontWeight: 800 }}>
              A quality maturity engine that moves teams from assessment to action.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2.5, mx: "auto", maxWidth: 720, color: neutralTokens.ink500, fontSize: "1.0625rem", lineHeight: 1.75 }}>
              We empower businesses to drive agility through connected experiences - measuring quality capability,
              recommending the right priorities, and implementing a clear path to stronger engineering maturity.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mt: 4 }}>
              <GetStartedButton component={RouterLink} to={RoutePaths.signup}>
                Get Started
              </GetStartedButton>
              <Button
                component={RouterLink}
                to={RoutePaths.login}
                variant="outlined"
                size="large"
                startIcon={<LoginOutlinedIcon />}
                sx={{ minHeight: 48, px: 3, borderRadius: 999, fontWeight: 800, borderColor: brandTokens.blue300, color: brandTokens.blue700 }}
              >
                Sign In
              </Button>
            </Stack>
          </Container>

          <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 } }}>
            <Grid container spacing={2}>
              {stats.map((s) => (
                <Grid item xs={12} sm={4} key={s.label}>
                  <MetricTile
                    label={s.label}
                    value={s.value}
                    accent={s.accent}
                    icon={s.icon}
                    format={(n) => `${Math.round(n)}%`}
                    sub={<Typography variant="body2" color="text.secondary">{s.sub}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>
          </Container>

          <TextParallaxContent />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, mt: { xs: 4, md: 6 } }}>
        <Stack spacing={1} sx={{ textAlign: "center", mb: { xs: 4, md: 5 } }}>
          <Typography variant="overline" sx={{ color: brandTokens.blue600, fontWeight: 800, letterSpacing: "0.08em" }}>
            The QMRI method
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 800 }}>
            Measure. Recommend. Implement.
          </Typography>
          <Typography variant="body1" sx={{ mx: "auto", maxWidth: 680, color: neutralTokens.ink500, lineHeight: 1.75 }}>
            The three moves behind QMRI - Quinnox Measures, Recommend and Implement - turning quality signals into
            prioritised action.
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          {method.map((item) => {
            const Icon = item.icon;
            return (
              <Grid item xs={12} md={4} key={item.title}>
                <Card sx={{ p: 3, height: "100%", borderRadius: 2, boxShadow: "0 18px 42px rgba(16,24,40,0.14)" }}>
                  <Stack spacing={2}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: `${item.color}14`, color: item.color }}>
                      <Icon />
                    </Box>
                    <Typography variant="h3">{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {item.body}
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={5}>
            <Typography variant="overline" sx={{ color: brandTokens.blue600, fontWeight: 700 }}>
              Maturity model
            </Typography>
            <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 800 }}>
              Built for repeatable quality decisions.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, color: neutralTokens.ink500, lineHeight: 1.75 }}>
              QMRI gives administrators a controlled way to validate users, run assessments, score capability and turn
              results into practical implementation work.
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 3 }}>
              {bands.map((band, index) => (
                <Stack key={band} direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: brandTokens.blue50, color: brandTokens.blue700, fontWeight: 700 }}>
                    {index + 1}
                  </Box>
                  <Typography variant="body1" fontWeight={700}>{band}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid item xs={12} sm={6} key={item.title}>
                    <Card sx={{ p: 2.5, minHeight: 178, borderRadius: 2 }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ width: 42, height: 42, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: brandTokens.blue50, color: brandTokens.blue600 }}>
                          <Icon />
                        </Box>
                        <Typography variant="h3">{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                          {item.body}
                        </Typography>
                      </Stack>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ bgcolor: neutralTokens.ink900, color: "#fff" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 7 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Box>
              <Typography variant="h1" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 800 }}>
                Start the maturity journey with QMRI.
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, color: "rgba(255,255,255,0.72)" }}>
                Sign up, wait for admin approval, and enter your user dashboard once validated.
              </Typography>
            </Box>
            <GetStartedButton component={RouterLink} to={RoutePaths.signup} sx={{ bgcolor: "#fff", color: neutralTokens.ink900, boxShadow: "none", "&:hover": { bgcolor: brandTokens.blue50, color: neutralTokens.ink900 } }}>
              Get Started
            </GetStartedButton>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ borderTop: `1px solid ${neutralTokens.line300}` }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ py: 3 }}>
            <QmriLogo size="md" />
            <Typography variant="body2" sx={{ color: neutralTokens.ink500 }}>
              (c) {new Date().getFullYear()} QMRI - Quinnox. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
        </Box>
      </ScrollExpandMedia>
    </Box>
  );
}










