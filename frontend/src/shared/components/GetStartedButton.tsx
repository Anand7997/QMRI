import { type ElementType } from "react";
import { Box, Button, type ButtonProps } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { brandTokens } from "app/theme/tokens/palette";

type GetStartedButtonProps = ButtonProps & {
  component?: ElementType;
  to?: string;
};

export function GetStartedButton({ children = "Get Started", sx, ...props }: GetStartedButtonProps) {
  return (
    <Button
      variant="contained"
      size="large"
      {...props}
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          minHeight: 48,
          px: 3.5,
          pr: 7,
          borderRadius: 2,
          bgcolor: brandTokens.blue700,
          color: "#fff",
          boxShadow: "0 14px 28px rgba(11, 92, 173, 0.28)",
          transition: "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
          "&:hover": {
            bgcolor: brandTokens.blue600,
            boxShadow: "0 18px 36px rgba(11, 92, 173, 0.34)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&:hover .get-started-label": {
            opacity: 0,
          },
          "&:hover .get-started-icon": {
            width: "calc(100% - 8px)",
          },
          "&:active .get-started-icon": {
            transform: "scale(0.96)",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box component="span" className="get-started-label" sx={{ transition: "opacity 500ms ease" }}>
        {children}
      </Box>
      <Box
        component="span"
        className="get-started-icon"
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          bottom: 4,
          zIndex: 1,
          display: "grid",
          placeItems: "center",
          width: "28%",
          minWidth: 38,
          borderRadius: 1.5,
          bgcolor: "rgba(255,255,255,0.18)",
          color: "#fff",
          transition: "width 500ms ease, transform 180ms ease",
        }}
      >
        <ArrowForwardIcon sx={{ fontSize: 18 }} />
      </Box>
    </Button>
  );
}
