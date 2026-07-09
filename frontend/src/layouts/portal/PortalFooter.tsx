import { Box, Link, Typography } from "@mui/material";

export function PortalFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        px: 3,
        py: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        © {new Date().getFullYear()} QMRI. All rights reserved.
      </Typography>
      <Typography variant="caption" color="text.secondary">
        <Link href="#" underline="hover" color="inherit">
          Privacy
        </Link>
        {" · "}
        <Link href="#" underline="hover" color="inherit">
          Terms
        </Link>
      </Typography>
    </Box>
  );
}

