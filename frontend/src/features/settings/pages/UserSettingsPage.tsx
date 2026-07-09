import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
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
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { useAuthContext } from "contexts/AuthContext";
import { PageHeader } from "shared/components";

export function UserSettingsPage() {
  const { user } = useAuthContext();
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(user?.fullName || user?.userName || "Portal User");
  const [email, setEmail] = useState(user?.email || "user@qmri.app");
  const [digest, setDigest] = useState("weekly");
  const [reminders, setReminders] = useState(true);
  const [submissionUpdates, setSubmissionUpdates] = useState(true);
  const [compactTables, setCompactTables] = useState(false);

  function handleSave() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, reminders and workspace preferences."
        actions={
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>
            Save changes
          </Button>
        }
      />

      {saved ? <Alert severity="success" sx={{ mb: 2 }}>Settings saved for this session.</Alert> : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <PersonOutlineOutlinedIcon color="primary" />
            <Typography variant="h3">Profile</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Basic account information used in your QMRI workspace.
          </Typography>
          <Stack spacing={2}>
            <TextField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
            <TextField label="Role" value={(user?.roles ?? ["USER"]).join(", ")} fullWidth disabled />
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <NotificationsNoneOutlinedIcon color="primary" />
            <Typography variant="h3">Notifications</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control reminders for assignments and assessment activity.
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="digest-label">Digest frequency</InputLabel>
              <Select labelId="digest-label" label="Digest frequency" value={digest} onChange={(event) => setDigest(event.target.value)}>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="off">Off</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={reminders} onChange={(event) => setReminders(event.target.checked)} />}
              label="Assessment due-date reminders"
            />
            <FormControlLabel
              control={<Switch checked={submissionUpdates} onChange={(event) => setSubmissionUpdates(event.target.checked)} />}
              label="Submission and scoring updates"
            />
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <TuneOutlinedIcon color="primary" />
            <Typography variant="h3">Workspace preferences</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adjust how assessment lists and report views are displayed.
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={compactTables} onChange={(event) => setCompactTables(event.target.checked)} />}
              label="Use compact table density"
            />
            <FormControl fullWidth>
              <InputLabel id="default-view-label">Default landing page</InputLabel>
              <Select labelId="default-view-label" label="Default landing page" defaultValue="dashboard">
                <MenuItem value="dashboard">Dashboard</MenuItem>
                <MenuItem value="assessments">My assessments</MenuItem>
                <MenuItem value="reports">Reports</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
