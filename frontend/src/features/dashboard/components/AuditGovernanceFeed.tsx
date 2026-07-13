import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { EmptyState } from "shared/components";
import {
  clearGovernanceAuditFeed,
  loadGovernanceAuditFeed,
  type GovernanceAuditEntry,
} from "features/dashboard/governance/dashboardGovernanceState";

export function AuditGovernanceFeed() {
  const [entries, setEntries] = useState<GovernanceAuditEntry[]>(() => loadGovernanceAuditFeed());
  const [entityFilter, setEntityFilter] = useState("all");

  const entityTypes = useMemo(() => {
    const values = Array.from(new Set(entries.map((entry) => entry.entityType))).sort((left, right) =>
      left.localeCompare(right),
    );
    return values;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (entityFilter === "all") {
      return entries;
    }

    return entries.filter((entry) => entry.entityType === entityFilter);
  }, [entries, entityFilter]);

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <HistoryEduOutlinedIcon color="primary" />
        <Typography variant="h3">Audit and Governance Feed</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Track who changed question, scoring, template and export settings, and when.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }} sx={{ mb: 1.5 }}>
        <TextField
          select
          size="small"
          label="Entity"
          value={entityFilter}
          onChange={(event) => setEntityFilter(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="all">All entities</MenuItem>
          {entityTypes.map((entityType) => (
            <MenuItem key={entityType} value={entityType}>
              {entityType}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => setEntries(loadGovernanceAuditFeed())}
        >
          Refresh
        </Button>
        <Button
          variant="text"
          color="error"
          startIcon={<DeleteOutlineOutlinedIcon />}
          onClick={() => {
            clearGovernanceAuditFeed();
            setEntries([]);
          }}
        >
          Clear feed
        </Button>
      </Stack>

      {filteredEntries.length === 0 ? (
        <Box sx={{ py: 1 }}>
          <EmptyState
            title="No governance events"
            description="Events are added when policy/template/question/export actions are saved."
          />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.slice(0, 80).map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{formatDateTime(entry.happenedAtUtc)}</TableCell>
                  <TableCell>{entry.actor}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Chip size="small" label={entry.entityType} variant="outlined" />
                      <Typography variant="body2">{entry.entityName}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {entry.details || "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
