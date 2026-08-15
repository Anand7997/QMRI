import { useEffect, useState } from "react";
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
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { useAuthContext } from "contexts/AuthContext";
import { PageHeader } from "shared/components";
import {
  defaultReminderPreferences,
  useReminderPreferences,
  useSaveReminderPreferences,
} from "shared/api/dashboardGovernance";

export function UserSettingsPage() {
  const { user } = useAuthContext();
  const reminderQuery = useReminderPreferences(user?.userId);
  const saveReminder = useSaveReminderPreferences(user?.userId);
  const [saved, setSaved] = useState(false);
  const [digest, setDigest] = useState("weekly");
  const [reminderPreferences, setReminderPreferences] = useState(() => defaultReminderPreferences());
  const [submissionUpdates, setSubmissionUpdates] = useState(true);
  const [compactTables, setCompactTables] = useState(false);

  useEffect(() => {
    if (reminderQuery.data) {
      setReminderPreferences(reminderQuery.data);
    }
  }, [reminderQuery.data]);

  async function handleSave() {
    try {
      await saveReminder.mutateAsync(reminderPreferences);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaved(false);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage your reminders and workspace preferences."
        actions={
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => void handleSave()}>
            Save changes
          </Button>
        }
      />

      {saved ? <Alert severity="success" sx={{ mb: 2 }}>Settings saved.</Alert> : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
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
              control={<Switch checked={reminderPreferences.enabled} onChange={(event) => setReminderPreferences((current) => ({ ...current, enabled: event.target.checked }))} />}
              label="Assessment due-date reminders"
            />
            <TextField
              label="Remind before due date"
              type="number"
              value={reminderPreferences.remindBeforeDays}
              onChange={(event) => setReminderPreferences((current) => ({ ...current, remindBeforeDays: Number(event.target.value) }))}
              inputProps={{ min: 1, max: 30 }}
              helperText="Days before due date to mark an assessment as due soon."
            />
            <TextField
              label="Default due window"
              type="number"
              value={reminderPreferences.defaultDueInDays}
              onChange={(event) => setReminderPreferences((current) => ({ ...current, defaultDueInDays: Number(event.target.value) }))}
              inputProps={{ min: 1, max: 60 }}
              helperText="Days after assignment/start used by the dashboard due-date widget."
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
