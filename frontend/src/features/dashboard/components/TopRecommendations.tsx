import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { alpha } from "@mui/material/styles";
import { EmptyState } from "shared/components";
import { semanticTokens, neutralTokens } from "app/theme/tokens/palette";
import type { RecommendationItem } from "../assessmentData";

const priorityColor: Record<RecommendationItem["priority"], string> = {
  Critical: semanticTokens.errorMain,
  High: semanticTokens.warningMain,
  Medium: semanticTokens.infoMain,
  Low: neutralTokens.ink500,
};

export function TopRecommendations({ items }: { items: RecommendationItem[] }) {
  return (
    <Card sx={{ height: "100%", p: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Top recommendations
      </Typography>
      {items.length === 0 ? (
        <EmptyState title="No recommendations" description="Recommendations appear after assessments are scored." />
      ) : (
        <Stack spacing={2}>
          {items.map((item) => (
            <Stack key={item.id} direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ color: "primary.main", mt: 0.25 }}>
                <LightbulbOutlinedIcon fontSize="small" />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Chip
                    size="small"
                    label={item.priority}
                    sx={{
                      bgcolor: alpha(priorityColor[item.priority], 0.12),
                      color: priorityColor[item.priority],
                      fontWeight: 600,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.category}
                  </Typography>
                </Stack>
                <Typography variant="body2">{item.text}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}
