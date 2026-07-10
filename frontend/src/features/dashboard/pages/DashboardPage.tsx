import { Alert, Box, LinearProgress } from "@mui/material";
import { MotionConfig } from "motion/react";
import { useNavigate } from "react-router-dom";
import { RecentAssessments } from "../components/RecentAssessments";
import { Card3DBlock, dashboardBlocks } from "../components/Card3DBlock";
import { MotionReveal } from "../components/dashboardMotion";
import { useAssessmentDashboardData } from "../assessmentData";

export function DashboardPage() {
  const navigate = useNavigate();
  const dashboard = useAssessmentDashboardData();

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        {dashboard.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {dashboard.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load assessment dashboard data.
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          }}
        >
          <MotionReveal sx={{ gridColumn: "1 / -1" }}>
            <RecentAssessments rows={dashboard.recentAssessments} />
          </MotionReveal>

          {dashboardBlocks.map((block) => (
            <Card3DBlock
              key={block.id}
              title={block.title}
              description={block.description}
              icon={block.icon}
              gradient={block.gradient}
              onClick={() => navigate(block.route)}
            />
          ))}
        </Box>
      </Box>
    </MotionConfig>
  );
}
