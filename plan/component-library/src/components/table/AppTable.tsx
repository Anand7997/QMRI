import type { ReactNode } from "react";
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { TableColumn } from "../../types/ui";

export interface AppTableProps<T> {
  columns: Array<TableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  dense?: boolean;
}

export function AppTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyState,
  onRowClick,
  dense = false,
}: AppTableProps<T>) {
  const hasData = rows.length > 0;

  return (
    <TableContainer component={Paper}>
      <Table size={dense ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={String(column.key)}
                align={column.align ?? "left"}
                sx={{ width: column.width }}
              >
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                {columns.map((column) => (
                  <TableCell key={`${String(column.key)}-${index}`}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading &&
            hasData &&
            rows.map((row) => (
              <TableRow
                hover
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                sx={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((column) => {
                  const key = String(column.key);
                  const value = (row as Record<string, unknown>)[key];
                  const content = column.render ? column.render(row) : String(value ?? "-");

                  return (
                    <TableCell key={`${rowKey(row)}-${key}`} align={column.align ?? "left"}>
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

          {!isLoading && !hasData && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                {emptyState ?? (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      No records found.
                    </Typography>
                  </Box>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
