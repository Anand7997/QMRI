import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "contexts/AuthContext";
import { loginWithIdentityLink } from "shared/api/auth";
import { ASSESSMENT_LINK_NAVIGATION_SOURCE } from "shared/constants/assessmentNavigation";
import { RoutePaths } from "shared/constants/routePaths";

export function IdentityLinkLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Checking your identity link...");
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function exchangeLink() {
      if (!token) {
        setStatus("error");
        setMessage("This identity link is missing its access key.");
        return;
      }

      try {
        const response = await loginWithIdentityLink({ token });
        if (cancelled) {
          return;
        }

        login({
          accessToken: response.accessToken,
          accessTokenExpiresAtUtc: response.accessTokenExpiresAtUtc,
          user: response.user,
        });
        navigate(RoutePaths.portalAssessments, {
          replace: true,
          state: { resume: true, source: ASSESSMENT_LINK_NAVIGATION_SOURCE },
        });
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("This identity link has expired or is no longer valid.");
        }
      }
    }

    void exchangeLink();

    return () => {
      cancelled = true;
    };
  }, [login, navigate, token]);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
      <Stack
        spacing={2.25}
        alignItems="center"
        sx={{
          width: "min(100%, 460px)",
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            bgcolor: "rgba(37, 99, 235, 0.08)",
            border: "1px solid",
            borderColor: "rgba(37, 99, 235, 0.18)",
          }}
        >
          {status === "loading" ? <CircularProgress size={24} /> : <LinkOutlinedIcon />}
        </Box>
        <Box>
          <Typography variant="h3">Identity Link</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {message}
          </Typography>
        </Box>
        {status === "error" ? <Alert severity="error">Ask your administrator to generate a fresh identity link.</Alert> : null}
        {status === "error" ? (
          <Button variant="contained" onClick={() => navigate(RoutePaths.login, { replace: true })}>
            Go to sign in
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
