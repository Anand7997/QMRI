import { useRef, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import { motion, useScroll, useTransform } from "motion/react";
import { brandTokens, neutralTokens } from "app/theme/tokens/palette";
import { RoutePaths } from "shared/constants/routePaths";

const IMG_PADDING = 12;

interface ParallaxSection {
  imgUrl: string;
  subheading: string;
  heading: string;
  lead: string;
  body: string;
  aside: string;
}

/** Quinnox / QMRI themed scroll-parallax sections. Logic ported 1:1 from a
 *  framer-motion/Tailwind original to this motion/react + MUI stack. */
const sections: ParallaxSection[] = [
  {
    imgUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
    subheading: "Measure",
    heading: "Know where you stand.",
    aside: "Measure quality maturity with evidence, not opinion.",
    lead: "TestScan captures capability across teams, practices, tools and governance through a structured, governed assessment - so every result is comparable and defensible.",
    body: "Consistent categories, modules and sub-modules mean each assessment reads the same way. Scores map into Testing, QA, QE and Intelligent Quality bands, giving leaders a single, honest view of where the organisation really is.",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop",
    subheading: "Recommend",
    heading: "Prioritise what matters.",
    aside: "Turn maturity gaps into a ranked improvement agenda.",
    lead: "Responses become maturity bands, priority gaps and practical next actions - the Quinnox way of accelerating success through connected, data-driven decisions.",
    body: "Recommendations point teams toward the strongest improvement opportunities first, so effort lands where it moves the needle. Analysis and solution effort drops by up to 50% when priorities are clear from the start.",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2670&auto=format&fit=crop",
    subheading: "Implement",
    heading: "Turn insight into action.",
    aside: "Move from scorecards to measurable execution.",
    lead: "TestScan closes the loop - approved access, dashboards and focused recommendation tracking take teams from assessment to delivered improvement.",
    body: "Teams see resolution time improve by up to 95% and support efficiency by 30% once recommendations become tracked, owned work. Measure. Recommend. Implement - the full Quinnox maturity journey.",
  },
];

function StickyImage({ imgUrl }: { imgUrl: string }) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["end end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <motion.div
      ref={targetRef}
      style={{
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: `calc(100vh - ${IMG_PADDING * 2}px)`,
        top: IMG_PADDING,
        scale,
        position: "sticky",
        zIndex: 0,
        overflow: "hidden",
        borderRadius: 24,
      }}
    >
      <motion.div
        style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.7)", opacity }}
      />
    </motion.div>
  );
}

function OverlayCopy({ subheading, heading }: { subheading: string; heading: string }) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [250, -250]);
  const opacity = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 1, 0]);

  return (
    <motion.div
      ref={targetRef}
      style={{
        y,
        opacity,
        position: "absolute",
        left: 0,
        top: 0,
        display: "flex",
        height: "100vh",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <Typography sx={{ mb: { xs: 1, md: 2 }, textAlign: "center", fontSize: { xs: "1.25rem", md: "1.875rem" }, textShadow: "0 2px 18px rgba(0,0,0,0.5)" }}>
        {subheading}
      </Typography>
      <Typography sx={{ textAlign: "center", fontWeight: 800, fontSize: { xs: "2.25rem", md: "4.5rem" }, lineHeight: 1.05, textShadow: "0 4px 24px rgba(0,0,0,0.55)" }}>
        {heading}
      </Typography>
    </motion.div>
  );
}

function SectionContent({ lead, body, aside }: Pick<ParallaxSection, "lead" | "body" | "aside">) {
  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: 1024,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
        gap: 4,
        px: 2,
        pb: 12,
        pt: 6,
      }}
    >
      <Typography component="h2" sx={{ gridColumn: { md: "span 4" }, fontSize: { xs: "1.875rem", md: "2rem" }, fontWeight: 800, color: neutralTokens.ink900 }}>
        {aside}
      </Typography>
      <Box sx={{ gridColumn: { md: "span 8" } }}>
        <Typography sx={{ mb: 2.5, fontSize: { xs: "1.25rem", md: "1.5rem" }, color: neutralTokens.ink500, lineHeight: 1.6 }}>
          {lead}
        </Typography>
        <Typography sx={{ mb: 4, fontSize: { xs: "1.25rem", md: "1.5rem" }, color: neutralTokens.ink500, lineHeight: 1.6 }}>
          {body}
        </Typography>
        <Button
          component={RouterLink}
          to={RoutePaths.signup}
          endIcon={<NorthEastIcon />}
          sx={{
            width: { xs: "100%", md: "fit-content" },
            borderRadius: 1.5,
            px: 4.5,
            py: 1.75,
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#fff",
            bgcolor: neutralTokens.ink900,
            "&:hover": { bgcolor: brandTokens.blue700 },
          }}
        >
          Learn more
        </Button>
      </Box>
    </Box>
  );
}

function TextParallaxSection({ imgUrl, subheading, heading, children }: {
  imgUrl: string;
  subheading: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ px: `${IMG_PADDING}px` }}>
      <Box sx={{ position: "relative", height: "150vh" }}>
        <StickyImage imgUrl={imgUrl} />
        <OverlayCopy heading={heading} subheading={subheading} />
      </Box>
      {children}
    </Box>
  );
}

export function TextParallaxContent() {
  return (
    <Box sx={{ bgcolor: neutralTokens.surface0 }}>
      {sections.map((s) => (
        <TextParallaxSection key={s.subheading} imgUrl={s.imgUrl} subheading={s.subheading} heading={s.heading}>
          <SectionContent lead={s.lead} body={s.body} aside={s.aside} />
        </TextParallaxSection>
      ))}
    </Box>
  );
}

export default TextParallaxContent;
