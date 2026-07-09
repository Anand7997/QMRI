import {
  Box,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { EmptyState, MaturityChip, StatusChip } from "shared/components";
import type { RecentAssessment } from "../assessmentData";

export function RecentAssessments({ rows }: { rows: RecentAssessment[] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <Stack sx={{ px: 2.5, py: 2 }}>
        <Typography variant="h3">Recent assessments</Typography>
      </Stack>
      {rows.length === 0 ? (
        <EmptyState title="No assessments" description="Create an assessment to see activity here." />
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>Assessment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.title}</TableCell>
                  <TableCell>
                    <StatusChip status={r.status} />
                  </TableCell>
                  <TableCell>{Math.round(r.completionPercentage)}%</TableCell>
                  <TableCell>{r.score == null ? "--" : <MaturityChip score={r.score} />}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{formatDate(r.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
