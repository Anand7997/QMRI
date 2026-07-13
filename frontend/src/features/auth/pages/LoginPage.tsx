import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { login as loginRequest, register as registerRequest } from "shared/api/auth";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "contexts/AuthContext";
import { RoutePaths } from "shared/constants/routePaths";
import { brandTokens, neutralTokens, semanticTokens } from "app/theme/tokens/palette";
import {
  InteractiveLoginCharacter,
  type CharacterState,
} from "@/components/ui/interactive-login-character";
import { QmriLogo } from "shared/components";

type Mode = "signin" | "signup";
type Audience = "admin" | "user";
type Feedback = { severity: "error" | "info" | "success"; message: string };
type ApiErrorBody = { code?: string; message?: string };
type ActiveField = "identifier" | "password" | "fullName" | "userName" | "email" | "signUpPassword" | null;

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
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [formMouse, setFormMouse] = useState({ x: 0.5, y: 0.5 });
  const [requestSent, setRequestSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const typingIdleTimer = useRef<number | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setFeedback(null);
    setRequestSent(false);
    setActiveField(null);
    setIsTyping(false);
  }, [initialMode]);

  useEffect(
    () => () => {
      if (typingIdleTimer.current !== null) {
        window.clearTimeout(typingIdleTimer.current);
      }
    },
    [],
  );

  function markTyping() {
    setIsTyping(true);
    if (typingIdleTimer.current !== null) {
      window.clearTimeout(typingIdleTimer.current);
    }
    typingIdleTimer.current = window.setTimeout(() => setIsTyping(false), 900);
  }

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
        ? "Use the secured console entrance for QMRI administrators."
        : "Your workspace is ready. Sign in and continue your maturity journey."
      : isAdmin
        ? "Submit an administrator access request for approval."
        : "Submit a user access request for approval.";

  const characterState: CharacterState = useMemo(() => {
    if (submitting) return "loading";
    if (feedback?.severity === "error") return "error";
    if (feedback?.severity === "success") return "success";
    const isPassword = activeField === "password" || activeField === "signUpPassword";
    const isName =
      activeField === "identifier" ||
      activeField === "userName" ||
      activeField === "email" ||
      activeField === "fullName";
    if (isPassword) return isTyping ? "password-typing" : "password-focus";
    if (isName) return isTyping ? "typing" : "username-focus";
    return "idle";
  }, [submitting, feedback, activeField, isTyping]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isAdmin ? "#0f172a" : brandTokens.blue50,
        display: "flex",
        alignItems: "stretch",
        p: { xs: 1.5, md: 2.5 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: { xs: "calc(100vh - 24px)", md: "calc(100vh - 40px)" },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(360px, 0.95fr) minmax(420px, 1.05fr)" },
          border: 1,
          borderColor: isAdmin ? "rgba(148,163,184,0.22)" : brandTokens.blue100,
          borderRadius: { xs: 3, md: 4 },
          overflow: "hidden",
          bgcolor: neutralTokens.surface0,
        }}
      >
        <AuthVisualPanel audience={audience} characterState={characterState} mouseX={formMouse.x} mouseY={formMouse.y} />

        <Box
          sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setFormMouse({
              x: (e.clientX - r.left) / r.width,
              y: (e.clientY - r.top) / r.height,
            });
          }}
        >
          <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column", py: { xs: 2.5, md: 4 } }}>
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
                "&:focus-visible": { outline: `2px solid ${brandTokens.blue500}`, outlineOffset: 3, borderRadius: 1 },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Back to home
              </Typography>
            </Stack>

            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 3 }}>
              <Box sx={{ width: "100%", maxWidth: 440 }}>
                <Stack spacing={1} alignItems="flex-start">
                  <QmriLogo to={RoutePaths.landing} size="md" />
                  {isAdmin ? (
                    <Chip
                      icon={<AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18 }} />}
                      label="Administrator"
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: brandTokens.blue50,
                        color: brandTokens.blue700,
                        fontWeight: 800,
                      }}
                    />
                  ) : null}
                </Stack>

                <Typography variant="h1" sx={{ mt: 3, fontSize: { xs: "1.85rem", md: "2.25rem" }, fontWeight: 850, lineHeight: 1.08 }}>
                  {heading}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1.25, color: neutralTokens.ink500, lineHeight: 1.65 }}>
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
                  <Tab label="Sign In" value="signin" sx={{ cursor: "pointer", fontWeight: 800 }} />
                  <Tab label="Sign Up" value="signup" sx={{ cursor: "pointer", fontWeight: 800 }} />
                </Tabs>

                {mode === "signin" ? (
                  <Box component="form" onSubmit={handleSignIn} sx={{ mt: 3 }} noValidate>
                    <Stack spacing={2.25}>
                      {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}

                      <TextField
                        label="Email or username"
                        type="text"
                        value={identifier}
                        onFocus={() => setActiveField("identifier")}
                        onBlur={() => setActiveField(null)}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          markTyping();
                        }}
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
                        onFocus={() => setActiveField("password")}
                        onBlur={() => setActiveField(null)}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          markTyping();
                        }}
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

                      <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ minHeight: 50, cursor: "pointer", fontWeight: 850 }}>
                        {submitting ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handleSignUp} sx={{ mt: 3 }} noValidate>
                    <Stack spacing={2.25}>
                      {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}
                      {!requestSent ? (
                        <Alert severity="info">
                          {isAdmin
                            ? "Admin access requests must be approved by an existing administrator."
                            : "After signup, your request is sent to admin. You can use your dashboard only after approval."}
                        </Alert>
                      ) : null}

                      <TextField label="Full name" value={fullName} onFocus={() => setActiveField("fullName")} onBlur={() => setActiveField(null)} onChange={(e) => { setFullName(e.target.value); markTyping(); }} autoComplete="name" autoFocus fullWidth required disabled={submitting || requestSent} />
                      <TextField label="Username" value={userName} onFocus={() => setActiveField("userName")} onBlur={() => setActiveField(null)} onChange={(e) => { setUserName(e.target.value); markTyping(); }} autoComplete="username" fullWidth required disabled={submitting || requestSent} />
                      <TextField label="Work email" type="email" value={email} onFocus={() => setActiveField("email")} onBlur={() => setActiveField(null)} onChange={(e) => { setEmail(e.target.value); markTyping(); }} autoComplete="email" fullWidth required disabled={submitting || requestSent} />
                      <TextField label="Password" type="password" value={signUpPassword} onFocus={() => setActiveField("signUpPassword")} onBlur={() => setActiveField(null)} onChange={(e) => { setSignUpPassword(e.target.value); markTyping(); }} autoComplete="new-password" fullWidth required disabled={submitting || requestSent} />
                      <Button type="submit" variant="contained" size="large" disabled={submitting || requestSent} sx={{ minHeight: 50, cursor: requestSent ? "default" : "pointer", fontWeight: 850 }}>
                        {submitting ? <CircularProgress size={22} color="inherit" /> : "Request Access"}
                      </Button>
                      <Button variant="text" onClick={() => navigate(paths.signin, { replace: true })} sx={{ cursor: "pointer", fontWeight: 800 }}>
                        Already approved? Sign in
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

function AuthVisualPanel({
  audience,
  characterState,
  mouseX,
  mouseY,
}: {
  audience: Audience;
  characterState: CharacterState;
  mouseX: number;
  mouseY: number;
}) {
  const isAdmin = audience === "admin";

  return (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        position: "relative",
        flexDirection: "column",
        justifyContent: "space-between",
        p: { md: 5, lg: 6 },
        overflow: "hidden",
        color: isAdmin ? "#e5edf7" : neutralTokens.ink900,
        bgcolor: isAdmin ? "#101827" : "#ecf7ff",
        borderRight: 1,
        borderColor: isAdmin ? "rgba(148,163,184,0.18)" : brandTokens.blue100,
        "@keyframes floatPanel": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "@keyframes blink": {
          "0%, 88%, 100%": { transform: "scaleY(1)" },
          "92%, 96%": { transform: "scaleY(0.12)" },
        },
        "@keyframes peek": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*": { animation: "none !important", transition: "none !important" },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: isAdmin
            ? "radial-gradient(circle at 20% 20%, rgba(43,136,216,0.24), transparent 32%), radial-gradient(circle at 80% 10%, rgba(14,112,14,0.16), transparent 30%)"
            : "radial-gradient(circle at 25% 18%, #dff1ff 0, transparent 34%), radial-gradient(circle at 78% 26%, #e9f6ec 0, transparent 28%)",
          pointerEvents: "none",
        }}
      />

      <Stack spacing={1.25} sx={{ position: "relative", zIndex: 1 }}>
        <QmriLogo to={RoutePaths.landing} size="md" light={isAdmin} />
        <Typography variant="overline" sx={{ color: isAdmin ? brandTokens.blue300 : brandTokens.blue700, fontWeight: 900 }}>
          {isAdmin ? "Admin console" : "User sign in"}
        </Typography>
      </Stack>

      <Box sx={{ position: "relative", zIndex: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isAdmin ? (
          <AdminSplineScene />
        ) : (
          <InteractiveLoginCharacter state={characterState} mouseX={mouseX} mouseY={mouseY} />
        )}
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography variant="h1" sx={{ fontSize: { md: "2rem", lg: "2.35rem" }, fontWeight: 900, lineHeight: 1.08 }}>
          {isAdmin ? "A quieter gate for platform control." : "A sign-in that pays attention."}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, color: isAdmin ? "rgba(229,237,247,0.72)" : neutralTokens.ink500, maxWidth: 440, lineHeight: 1.65 }}>
          {isAdmin
            ? "Separate access, clear role checks, and a focused route into the QMRI administration workspace."
            : "The little guide follows your field activity while you sign in, then lets you get back to the work that matters."}
        </Typography>
        <Divider sx={{ my: 3, borderColor: isAdmin ? "rgba(148,163,184,0.22)" : brandTokens.blue100 }} />
        <Stack spacing={1.25}>
          {(isAdmin ? ["Role checked at sign in", "JWT-secured session", "Admin routes stay separated"] : ["Resume assigned assessments", "Track due-date urgency", "Review scored reports"]).map((item) => (
            <Stack key={item} direction="row" spacing={1.25} alignItems="center">
              <CheckCircleOutlineIcon sx={{ fontSize: 20, color: isAdmin ? brandTokens.blue300 : semanticTokens.successMain }} />
              <Typography variant="body2" sx={{ fontWeight: 750, color: isAdmin ? "rgba(229,237,247,0.84)" : neutralTokens.ink700 }}>
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function AdminSplineScene() {
  return (
    <Box sx={{ width: "100%", mx: "auto", my: 2 }}>
      <Card className="w-full h-[440px] bg-black/[0.96] relative overflow-hidden border-white/10">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
      </Card>
    </Box>
  );
}

function getApiError(error: unknown): ApiErrorBody | null {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return null;
  }

  return error.response?.data ?? null;
}

