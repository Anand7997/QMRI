import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { login as loginRequest, register as registerRequest } from "shared/api/auth";
import { useAuthContext } from "contexts/AuthContext";
import { RoutePaths } from "shared/constants/routePaths";
import { brandTokens, neutralTokens } from "app/theme/tokens/palette";
import { QmriLogo } from "shared/components";

type Mode = "signin" | "signup";
type Audience = "admin" | "user";
type Feedback = { severity: "error" | "info" | "success"; message: string };
type ApiErrorBody = { code?: string; message?: string };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuthContext();

  const audience: Audience = location.pathname.startsWith("/admin") ? "admin" : "user";
  const initialMode: Mode = location.pathname.endsWith("signup") ? "signup" : "signin";
  const [mode, setMode] = useState<Mode>(initialMode);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setFeedback(null);
    setRequestSent(false);
  }, [initialMode]);

  const paths = useMemo(
    () =>
      audience === "admin"
        ? { signin: RoutePaths.adminLogin, signup: RoutePaths.adminSignup }
        : { signin: RoutePaths.login, signup: RoutePaths.signup },
    [audience],
  );

  const redirectTarget = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    const authPaths: string[] = [paths.signin, paths.signup];
    if (from && !authPaths.includes(from)) {
      return from;
    }
    return null;
  }, [location.state, paths]);

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);

    if (!identifier.trim() || !password) {
      setFeedback({ severity: "error", message: "Enter your email/username and password." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await loginRequest({
        userNameOrEmail: identifier.trim(),
        password,
      });

      const isAdminUser = response.user.roles.some((role) => role.toUpperCase() === "ADMIN");

      if (audience === "admin" && !isAdminUser) {
        setFeedback({ severity: "error", message: "This account does not have administrator access." });
        setSubmitting(false);
        return;
      }

      if (audience === "user" && isAdminUser) {
        setFeedback({ severity: "error", message: "Administrator accounts must sign in from the Admin page." });
        setSubmitting(false);
        return;
      }

      login({
        accessToken: response.accessToken,
        accessTokenExpiresAtUtc: response.accessTokenExpiresAtUtc,
        user: response.user,
      });

      const fallback = isAdminUser ? RoutePaths.dashboard : RoutePaths.portalDashboard;
      navigate(redirectTarget ?? fallback, { replace: true });
    } catch (err) {
      const apiError = getApiError(err);

      if (apiError?.code === "ApprovalPending") {
        setFeedback({
          severity: "info",
          message: apiError.message ?? "Your request has been sent to admin and needs approval before you can sign in.",
        });
      } else if (apiError?.code === "AccessDisabled") {
        setFeedback({
          severity: "error",
          message: apiError.message ?? "This account is not active. Please contact your administrator.",
        });
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        setFeedback({ severity: "error", message: "Invalid email/username or password." });
      } else {
        setFeedback({ severity: "error", message: "Unable to sign in right now. Please try again." });
      }
      logout();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);

    if (!fullName.trim() || !userName.trim() || !email.trim() || !signUpPassword) {
      setFeedback({ severity: "error", message: "Complete all fields to request access." });
      return;
    }

    if (signUpPassword.length < 8) {
      setFeedback({ severity: "error", message: "Password must be at least 8 characters." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await registerRequest({
        fullName: fullName.trim(),
        userName: userName.trim(),
        email: email.trim(),
        password: signUpPassword,
        requestedRole: audience === "admin" ? "ADMIN" : "USER",
      });

      setRequestSent(true);
      setSignUpPassword("");
      setFeedback({
        severity: "success",
        message: response.message || "Your request has been sent to admin. You can sign in after approval.",
      });
    } catch (err) {
      const apiError = getApiError(err);
      setFeedback({
        severity: "error",
        message: apiError?.message ?? "Unable to submit your access request right now.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isAdmin = audience === "admin";
  const heading =
    mode === "signin"
      ? isAdmin
        ? "Administrator sign in"
        : "Welcome back"
      : isAdmin
        ? "Request admin access"
        : "Create your account";
  const subheading =
    mode === "signin"
      ? isAdmin
        ? "Sign in to the QMRI administration console."
        : "Sign in to your QMRI workspace."
      : isAdmin
        ? "Submit an administrator access request for approval."
        : "Submit a user access request for approval.";

  return (
    <Box>
      {isAdmin ? (
        <Chip
          icon={<AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18 }} />}
          label="Administrator"
          size="small"
          sx={{
            mb: 2,
            bgcolor: brandTokens.blue50,
            color: brandTokens.blue700,
            fontWeight: 700,
          }}
        />
      ) : null}

      <Typography variant="h1" sx={{ fontSize: "1.75rem", fontWeight: 700 }}>
        {heading}
      </Typography>
      <Typography variant="body1" sx={{ mt: 1, color: neutralTokens.ink500 }}>
        {subheading}
      </Typography>

      <Tabs
        value={mode}
        onChange={(_, value: Mode) => {
          navigate(value === "signup" ? paths.signup : paths.signin, {
            replace: true,
            state: location.state,
          });
        }}
        sx={{ mt: 3, mb: 1, borderBottom: `1px solid ${neutralTokens.line300}` }}
      >
        <Tab label="Sign In" value="signin" sx={{ cursor: "pointer" }} />
        <Tab label="Sign Up" value="signup" sx={{ cursor: "pointer" }} />
      </Tabs>

      {mode === "signin" ? (
        <Box component="form" onSubmit={handleSignIn} sx={{ mt: 3 }} noValidate>
          <Stack spacing={2.5}>
            {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}

            <TextField
              label="Email or username"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
              fullWidth
              required
              disabled={submitting}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
              required
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                      sx={{ cursor: "pointer" }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ minHeight: 48, cursor: "pointer" }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSignUp} sx={{ mt: 3 }} noValidate>
          <Stack spacing={2.5}>
            {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}
            {!requestSent ? (
              <Alert severity="info">
                {isAdmin
                  ? "Admin access requests must be approved by an existing administrator."
                  : "After signup, your request is sent to admin. You can use your dashboard only after approval."}
              </Alert>
            ) : null}

            <TextField
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              autoFocus
              fullWidth
              required
              disabled={submitting || requestSent}
            />
            <TextField
              label="Username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoComplete="username"
              fullWidth
              required
              disabled={submitting || requestSent}
            />
            <TextField
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              fullWidth
              required
              disabled={submitting || requestSent}
            />
            <TextField
              label="Password"
              type="password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              autoComplete="new-password"
              fullWidth
              required
              disabled={submitting || requestSent}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting || requestSent}
              sx={{ minHeight: 48, cursor: requestSent ? "default" : "pointer" }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : "Request Access"}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate(paths.signin, { replace: true })}
              sx={{ cursor: "pointer" }}
            >
              Already approved? Sign in
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function getApiError(error: unknown): ApiErrorBody | null {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return null;
  }

  return error.response?.data ?? null;
}


