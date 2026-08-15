import {
  Box,
  Button,
  Card,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, StatusChip } from "shared/components";
import type { RecentAssessment } from "../assessmentData";

const unknownAssignedByValue = "__unknown_assigned_by__";

function assignedByLabel(row: RecentAssessment) {
  return row.assignedByFullName?.trim() || row.assignedByUserName?.trim() || "Unknown";
}

export function RecentAssessments({ rows }: { rows: RecentAssessment[] }) {
  const [assignedByFilter, setAssignedByFilter] = useState<string>("all");

  const assignedByOptions = useMemo(() => {
    const options = new Map<string, { label: string; count: number }>();

    rows.forEach((row) => {
      if (row.assignedByUserId) {
        const existing = options.get(row.assignedByUserId);
        options.set(row.assignedByUserId, {
          label: assignedByLabel(row),
          count: (existing?.count ?? 0) + 1,
        });
        return;
      }

      const existing = options.get(unknownAssignedByValue);
      options.set(unknownAssignedByValue, {
        label: "Unknown",
        count: (existing?.count ?? 0) + 1,
      });
    });

    return Array.from(options.entries())
      .map(([value, option]) => ({ value, ...option }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (assignedByFilter === "all") {
      return rows;
    }

    if (assignedByFilter === unknownAssignedByValue) {
      return rows.filter((row) => !row.assignedByUserId);
    }

    return rows.filter((row) => row.assignedByUserId === assignedByFilter);
  }, [assignedByFilter, rows]);

  useEffect(() => {
    if (assignedByFilter === "all") {
      return;
    }

    if (!assignedByOptions.some((option) => option.value === assignedByFilter)) {
      setAssignedByFilter("all");
    }
  }, [assignedByFilter, assignedByOptions]);

  return (
    <Card sx={{ height: "100%" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2 }}
      >
        <Typography variant="h3">Recent assessments</Typography>
        {rows.length > 0 ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              select
              size="small"
              label="Assigned by"
              value={assignedByFilter}
              onChange={(event) => setAssignedByFilter(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All admins ({rows.length})</MenuItem>
              {assignedByOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </MenuItem>
              ))}
            </TextField>
            {assignedByFilter !== "all" ? (
              <Button variant="text" onClick={() => setAssignedByFilter("all")}>
                Clear
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
      {rows.length === 0 ? (
        <EmptyState title="No assessments" description="Create an assessment to see activity here." />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          title="No recent assessments for this admin"
          description="Change the Assigned by filter to view other activity."
        />
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow>
                <TableCell>Assessment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Assigned by</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.title}</TableCell>
                  <TableCell>
                    <StatusChip status={r.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.takenPeopleCount}/{r.assignedPeopleCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.takenPeopleCount}/{r.assignedPeopleCount} people taken exam
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {assignedByLabel(r)}
                    </Typography>
                    {r.assignedByUserName ? (
                      <Typography variant="caption" color="text.secondary">
                        {r.assignedByUserName}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{formatDate(r.createdAtUtc)}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{formatDate(r.submittedAtUtc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
