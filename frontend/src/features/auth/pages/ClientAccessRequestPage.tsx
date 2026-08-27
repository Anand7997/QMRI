import { type FormEvent, useState } from "react";
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
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { requestClientAccess } from "shared/api/auth";
import { RoutePaths } from "shared/constants/routePaths";
import { QmriLogo } from "shared/components";
import { brandTokens, neutralTokens } from "app/theme/tokens/palette";

type Feedback = { severity: "error" | "info" | "success"; message: string };
type ApiErrorBody = { code?: string; message?: string };

export function ClientAccessRequestPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setEmailError(null);

    const normalizedEmail = email.trim();
    const validationMessage = getEmailValidationMessage(normalizedEmail);

    if (validationMessage) {
      setEmailError(validationMessage);
      setFeedback({ severity: "error", message: validationMessage });
      return;
    }

    setSubmitting(true);
    try {
      await requestClientAccess({ email: normalizedEmail });
      setRequestSubmitted(true);
      setFeedback({
        severity: "success",
        message:
          "Your request has been submitted. The review and approval process may take some time. You will receive your qMRI assessment access link by email.",
      });
    } catch (error) {
      const apiError = getApiError(error);
      setRequestSubmitted(false);
      setFeedback({
        severity: "error",
        message: apiError?.message ?? "Unable to submit the access request right now.",
      });
    } finally {
      setSubmitting(false);
    }
  }

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
          <Card sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <QmriLogo to={RoutePaths.landing} size="md" />

              <Box>
                <Typography variant="h1" sx={{ fontSize: { xs: "1.9rem", sm: "2.25rem" }, fontWeight: 900, lineHeight: 1.1 }}>
                  Request assessment access
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: neutralTokens.ink500, lineHeight: 1.65 }}>
                  Please provide the email address where you would like to receive your qMRI assessment
                </Typography>
              </Box>

              {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}

              {!requestSubmitted ? (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    <TextField
                      label="Email ID"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailError(null);
                      }}
                      autoComplete="email"
                      autoFocus
                      fullWidth
                      required
                      error={Boolean(emailError)}
                      helperText={emailError}
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
              ) : null}
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

function getEmailValidationMessage(value: string): string | null {
  if (!value) {
    return "Enter your email address.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Email is not valid.";
  }

  return null;
}
