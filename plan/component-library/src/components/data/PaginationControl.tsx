import { Box, TablePagination } from "@mui/material";

export interface PaginationControlProps {
  page: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function PaginationControl({
  page,
  pageSize,
  totalCount,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationControlProps) {
  return (
    <Box display="flex" justifyContent="flex-end">
      <TablePagination
        component="div"
        count={totalCount}
        page={Math.max(0, page - 1)}
        onPageChange={(_, nextPage) => onPageChange(nextPage + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
        rowsPerPageOptions={pageSizeOptions}
      />
    </Box>
  );
}
