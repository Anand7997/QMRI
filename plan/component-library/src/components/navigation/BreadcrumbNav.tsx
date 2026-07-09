import { Breadcrumbs, Link, Typography } from "@mui/material";
import type { BreadcrumbItem } from "../../types/ui";

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
}

export function BreadcrumbNav({ items, onNavigate }: BreadcrumbNavProps) {
  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ py: 1 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.path) {
          return (
            <Typography key={item.id} color="text.primary" variant="body2">
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={item.id}
            component="button"
            type="button"
            underline="hover"
            variant="body2"
            color="inherit"
            onClick={() => onNavigate?.(item.path as string)}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
