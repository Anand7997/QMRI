import type { ReactNode } from "react";
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
} from "@mui/material";
import type { CardProps } from "@mui/material";

export interface AppCardProps extends CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  isLoading?: boolean;
  children?: ReactNode;
}

export function AppCard({
  title,
  subtitle,
  actions,
  footer,
  isLoading = false,
  children,
  ...props
}: AppCardProps) {
  return (
    <Card {...props}>
      {(title || subtitle || actions) && (
        <CardHeader title={title} subheader={subtitle} action={actions} />
      )}

      <CardContent>
        {isLoading ? (
          <Stack spacing={1.25}>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rounded" height={52} />
            <Skeleton variant="rounded" height={52} />
          </Stack>
        ) : (
          children
        )}
      </CardContent>

      {footer && <CardActions>{footer}</CardActions>}
    </Card>
  );
}
