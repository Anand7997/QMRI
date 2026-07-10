import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "motion/react";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  /** Optional logo rendered centred over the media as the focal point. */
  logoSrc?: string;
  logoAlt?: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const TEXT_BLUE = "#BFDBFE";

/**
 * Scroll-to-expand hero. Wheel/touch drives a 0->1 progress that grows the
 * centred media; at full expansion the page unlocks and `children` fade in.
 * Ported from a Next.js/Tailwind original to this Vite + MUI + motion stack.
 */
export function ScrollExpandMedia({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  logoSrc,
  logoAlt = "Logo",
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => setTouchStartY(0);

    const handleScroll = () => {
      if (!mediaFullyExpanded) window.scrollTo(0, 0);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobile ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobile ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobile ? 180 : 150);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  const isYouTube = mediaSrc.includes("youtube.com");

  return (
    <Box ref={sectionRef} sx={{ transition: "background-color 0.7s ease-in-out", overflowX: "hidden" }}>
      <Box
        component="section"
        sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", minHeight: "100dvh" }}
      >
        <Box sx={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100dvh" }}>
          {/* Background */}
          <motion.div
            style={{ position: "absolute", inset: 0, zIndex: 0, height: "100%" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <Box
              component="img"
              src={bgImageSrc}
              alt="Background"
              sx={{ width: "100vw", height: "100vh", objectFit: "cover", objectPosition: "center" }}
            />
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.35)" }} />
          </motion.div>

          <Box sx={{ position: "relative", zIndex: 10, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100dvh" }}>
              {/* Expanding media */}
              <Box
                sx={{
                  position: "absolute",
                  zIndex: 0,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: "95vw",
                  maxHeight: "85vh",
                  borderRadius: 4,
                  boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
                }}
              >
                {mediaType === "video" ? (
                  isYouTube ? (
                    <Box sx={{ position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
                      <Box
                        component="iframe"
                        src={
                          mediaSrc.includes("embed")
                            ? mediaSrc + (mediaSrc.includes("?") ? "&" : "?") + "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                            : mediaSrc.replace("watch?v=", "embed/") + "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" + mediaSrc.split("v=")[1]
                        }
                        width="100%"
                        height="100%"
                        sx={{ width: "100%", height: "100%", borderRadius: 3, border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <motion.div
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", borderRadius: 12 }}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
                      <Box
                        component="video"
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                        sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 3 }}
                      />
                      <motion.div
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", borderRadius: 12 }}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </Box>
                  )
                ) : (
                  <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                    <Box
                      component="img"
                      src={mediaSrc}
                      alt={title || "Media content"}
                      sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 3 }}
                    />
                    <motion.div
                      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: 12 }}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </Box>
                )}

                {logoSrc && (
                  <Box
                    component="img"
                    src={logoSrc}
                    alt={logoAlt}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 20,
                      width: { xs: "62%", md: "48%" },
                      maxWidth: 460,
                      height: "auto",
                      objectFit: "contain",
                      pointerEvents: "none",
                      filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
                    }}
                  />
                )}

                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 10, mt: 2 }}>
                  {date && (
                    <Typography sx={{ fontSize: "1.5rem", color: TEXT_BLUE, transform: `translateX(-${textTranslateX}vw)` }}>
                      {date}
                    </Typography>
                  )}
                  {scrollToExpand && (
                    <Typography sx={{ color: TEXT_BLUE, fontWeight: 500, textAlign: "center", transform: `translateX(${textTranslateX}vw)` }}>
                      {scrollToExpand}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Title */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: { xs: 10, md: 16 },
                  width: "100%",
                  position: "relative",
                  zIndex: 10,
                  mixBlendMode: textBlend ? "difference" : "normal",
                }}
              >
                <Typography
                  component="h2"
                  sx={{ fontSize: { xs: "2.25rem", md: "3rem", lg: "3.75rem" }, fontWeight: 700, color: TEXT_BLUE, transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </Typography>
                <Typography
                  component="h2"
                  sx={{ fontSize: { xs: "2.25rem", md: "3rem", lg: "3.75rem" }, fontWeight: 700, color: TEXT_BLUE, textAlign: "center", transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </Typography>
              </Box>
            </Box>

            {/* Revealed content */}
            <motion.section
              style={{ display: "flex", flexDirection: "column", width: "100%" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default ScrollExpandMedia;
