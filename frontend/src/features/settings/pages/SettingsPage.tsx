import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { useAuthContext } from "contexts/AuthContext";
import { PageHeader } from "shared/components";

export function SettingsPage() {
  const { user } = useAuthContext();
  const [saved, setSaved] = useState(false);
  const [adminName, setAdminName] = useState(user?.fullName || user?.userName || "Admin User");
  const [email, setEmail] = useState(user?.email || "admin@qmri.app");
  const [approvalMode, setApprovalMode] = useState("manual");
  const [defaultRole, setDefaultRole] = useState("USER");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [notifyRequests, setNotifyRequests] = useState(true);
  const [notifyReports, setNotifyReports] = useState(true);
  const [requireStrongPassword, setRequireStrongPassword] = useState(true);
  const [autoArchive, setAutoArchive] = useState(false);

  function handleSave() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Admin profile, security policy and platform defaults."
        actions={
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>
            Save changes
          </Button>
        }
      />

      {saved ? <Alert severity="success" sx={{ mb: 2 }}>Settings saved for this session.</Alert> : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" } }}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            Admin profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Details shown in the admin shell and account menus.
          </Typography>
          <Stack spacing={2}>
            <TextField label="Display name" value={adminName} onChange={(event) => setAdminName(event.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
            <TextField label="Organization" value="Quinnox" fullWidth />
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <SecurityOutlinedIcon color="primary" />
            <Typography variant="h3">Security</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Authentication and session controls for admin-managed access.
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="session-timeout-label">Session timeout</InputLabel>
              <Select
                labelId="session-timeout-label"
                label="Session timeout"
                value={sessionTimeout}
                onChange={(event) => setSessionTimeout(event.target.value)}
              >
                <MenuItem value="15">15 minutes</MenuItem>
                <MenuItem value="30">30 minutes</MenuItem>
                <MenuItem value="60">1 hour</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={requireStrongPassword} onChange={(event) => setRequireStrongPassword(event.target.checked)} />}
              label="Require strong passwords"
            />
            <FormControlLabel
              control={<Switch checked={notifyRequests} onChange={(event) => setNotifyRequests(event.target.checked)} />}
              label="Notify admins about new access requests"
            />
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <TuneOutlinedIcon color="primary" />
            <Typography variant="h3">Platform defaults</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Defaults used when new accounts and assessments are created.
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="approval-mode-label">Access approval mode</InputLabel>
              <Select
                labelId="approval-mode-label"
                label="Access approval mode"
                value={approvalMode}
                onChange={(event) => setApprovalMode(event.target.value)}
              >
                <MenuItem value="manual">Manual admin approval</MenuItem>
                <MenuItem value="domain">Auto-approve trusted domains</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="default-role-label">Default requested role</InputLabel>
              <Select
                labelId="default-role-label"
                label="Default requested role"
                value={defaultRole}
                onChange={(event) => setDefaultRole(event.target.value)}
              >
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={autoArchive} onChange={(event) => setAutoArchive(event.target.checked)} />}
              label="Auto-archive completed assessments after 90 days"
            />
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <NotificationsActiveOutlinedIcon color="primary" />
            <Typography variant="h3">Notifications</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which operational updates admins receive.
          </Typography>
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            <FormControlLabel
              control={<Switch checked={notifyRequests} onChange={(event) => setNotifyRequests(event.target.checked)} />}
              label="Access request updates"
            />
            <FormControlLabel
              control={<Switch checked={notifyReports} onChange={(event) => setNotifyReports(event.target.checked)} />}
              label="Weekly report summaries"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Assessment submission alerts"
            />
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}