import { type FormEvent, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { requestClientAccess } from "shared/api/auth";
import { RoutePaths } from "shared/constants/routePaths";
import { QmriLogo } from "shared/components";
import { brandTokens, neutralTokens, semanticTokens } from "app/theme/tokens/palette";

type Feedback = { severity: "error" | "info" | "success"; message: string };
type ApiErrorBody = { code?: string; message?: string };

export function ClientAccessRequestPage() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);

    if (!email.trim()) {
      setFeedback({ severity: "error", message: "Enter your email address." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await requestClientAccess({ email: email.trim() });
      setSubmittedEmail(response.email);
      setFeedback({
        severity: "success",
        message: response.message || "Your request has been sent to the qMRI administrator.",
      });
    } catch (error) {
      const apiError = getApiError(error);
      setSubmittedEmail(null);
      setFeedback({
        severity: "error",
        message: apiError?.message ?? "Unable to submit the access request right now.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const requestComplete = Boolean(submittedEmail);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: brandTokens.blue50,
        display: "flex",
        alignItems: "center",
        py: { xs: 3, md: 6 },
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={2.5}>
          <Stack
            component={RouterLink}
            to={RoutePaths.landing}
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              width: "fit-content",
              color: neutralTokens.ink500,
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": { color: brandTokens.blue600 },
              "&:focus-visible": { outline: `2px solid ${brandTokens.blue500}`, outlineOffset: 3, borderRadius: 1 },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" fontWeight={800}>
              Back to home
            </Typography>
          </Stack>

          <Card sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <QmriLogo to={RoutePaths.landing} size="md" />

              <Box>
                <Typography variant="h1" sx={{ fontSize: { xs: "1.9rem", sm: "2.25rem" }, fontWeight: 900, lineHeight: 1.1 }}>
                  Request assessment access
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: neutralTokens.ink500, lineHeight: 1.65 }}>
                  Enter the email address where your qMRI assessment link should be sent.
                </Typography>
              </Box>

              {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}

              {requestComplete ? (
                <Stack
                  spacing={1.25}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: semanticTokens.successMain,
                    bgcolor: semanticTokens.successSurface,
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon sx={{ color: semanticTokens.successMain }} />
                    <Typography variant="h4">Request received</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Email: {submittedEmail}
                  </Typography>
                </Stack>
              ) : (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    <TextField
                      label="Client email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      autoFocus
                      fullWidth
                      required
                      disabled={submitting}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <EmailOutlinedIcon />}
                      disabled={submitting}
                      sx={{ minHeight: 50, cursor: "pointer", fontWeight: 850 }}
                    >
                      {submitting ? "Submitting..." : "Submit request"}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

function getApiError(error: unknown): ApiErrorBody | null {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return null;
  }

  return error.response?.data ?? null;
}
