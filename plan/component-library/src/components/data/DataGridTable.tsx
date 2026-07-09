import { Box } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
  type GridValidRowModel,
} from "@mui/x-data-grid";

export interface DataGridTableProps<T extends GridValidRowModel> {
  rows: T[];
  columns: GridColDef<T>[];
  loading?: boolean;
  rowCount?: number;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  paginationMode?: "client" | "server";
  sortingMode?: "client" | "server";
  sortModel?: GridSortModel;
  onSortModelChange?: (model: GridSortModel) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  getRowId?: (row: T) => string | number;
}

export function DataGridTable<T extends GridValidRowModel>({
  rows,
  columns,
  loading = false,
  rowCount,
  page,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  paginationMode = "server",
  sortingMode = "server",
  sortModel,
  onSortModelChange,
  onPageChange,
  onPageSizeChange,
  getRowId,
}: DataGridTableProps<T>) {
  const paginationModel: GridPaginationModel = {
    page: Math.max(0, page - 1),
    pageSize,
  };

  return (
    <Box sx={{ height: 560, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount ?? rows.length}
        getRowId={getRowId}
        disableRowSelectionOnClick
        pagination
        paginationMode={paginationMode}
        sortingMode={sortingMode}
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => {
          if (model.page + 1 !== page) {
            onPageChange?.(model.page + 1);
          }

          if (model.pageSize !== pageSize) {
            onPageSizeChange?.(model.pageSize);
          }
        }}
        pageSizeOptions={pageSizeOptions}
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": {
            borderBottom: "1px solid",
            borderColor: "divider",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "action.hover",
          },
        }}
      />
    </Box>
  );
}
