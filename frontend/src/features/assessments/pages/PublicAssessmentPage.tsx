import { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createPublicAssessmentSession } from "shared/api/auth";
import { useAuthContext } from "contexts/AuthContext";
import { PUBLIC_ASSESSMENT_NAVIGATION_SOURCE } from "shared/constants/assessmentNavigation";
import { RoutePaths } from "shared/constants/routePaths";
import { brandTokens } from "app/theme/tokens/palette";

export function PublicAssessmentPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void createPublicAssessmentSession()
      .then((session) => {
        login(session);
        navigateToAssessment(session.assessment.assessmentId);
      })
      .catch(() => {
        setError("We could not start the assessment right now. Please try opening the link again.");
      });
  }, [login, navigate]);

  function navigateToAssessment(assessmentId: string) {
    navigate(RoutePaths.portalAssessments, {
      replace: true,
      state: {
        assessmentId,
        resume: true,
        source: PUBLIC_ASSESSMENT_NAVIGATION_SOURCE,
      },
    });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: brandTokens.blue50, display: "grid", placeItems: "center", px: 2 }}>
      <Container maxWidth="sm">
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Box component="img" src="/qascan-logo.svg" alt="QAScan" sx={{ width: { xs: 132, sm: 168 }, height: "auto" }} />
          {error ? (
            <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
          ) : (
            <>
              <CircularProgress />
              <Typography variant="h2">Preparing your assessment...</Typography>
              <Typography color="text.secondary">Your private assessment session is being created. No account or approval is required.</Typography>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
