import { Link as RouterLink, Outlet } from "react-router-dom";
import { Box, Container, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { brandTokens, neutralTokens } from "app/theme/tokens/palette";
import { RoutePaths } from "shared/constants/routePaths";
import { QmriLogo } from "shared/components";

const highlights = [
  "Governed maturity assessments",
  "Configurable scoring & maturity bands",
  "Prioritised, actionable recommendations",
  "Role-based, JWT-secured access",
];

export function AuthLayout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: neutralTokens.surface1 }}>
      {/* Brand panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          width: "44%",
          p: 6,
          color: "#fff",
          background: `linear-gradient(160deg, ${brandTokens.blue700} 0%, ${brandTokens.blue500} 100%)`,
        }}
      >
        <QmriLogo to={RoutePaths.landing} size="md" light />

        <Box>
          <Typography variant="h1" sx={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 }}>
            Elevate your quality maturity.
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: "rgba(255,255,255,0.85)", maxWidth: 420 }}>
            Sign in to assess capability, benchmark against maturity bands and act on the
            recommendations that matter most.
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 4 }}>
            {highlights.map((item) => (
              <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                <CheckCircleOutlineIcon sx={{ fontSize: 20, color: "rgba(255,255,255,0.9)" }} />
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.92)" }}>
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          © {new Date().getFullYear()} QMRI · Quinnox
        </Typography>
      </Box>

      {/* Form panel */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column", py: 4 }}>
          <Stack
            component={RouterLink}
            to={RoutePaths.landing}
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{
              textDecoration: "none",
              color: neutralTokens.ink500,
              cursor: "pointer",
              width: "fit-content",
              "&:hover": { color: brandTokens.blue600 },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Back to home
            </Typography>
          </Stack>

          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{ width: "100%", maxWidth: 420 }}>
              <Outlet />
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}



