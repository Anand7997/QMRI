import { useEffect, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  /** Optional logo rendered centred over the media as the focal point. */
  logoSrc?: string;
  logoAlt?: string;
  logoSteps?: readonly string[];
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const TEXT_BLUE = "#BFDBFE";

/**
 * Hero banner: a full-viewport media focal point with logo + title over a blurred
 * background, followed by the page content in normal document flow. The page scrolls
 * naturally - no wheel/touch hijacking or scroll-locking.
 */
export function ScrollExpandMedia({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  logoSrc,
  logoAlt = "Logo",
  logoSteps,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) {
  const isYouTube = mediaSrc.includes("youtube.com");

  // scroll-linked split of the two title words - driven by native scroll, never blocks it
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const p = Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";
  const shift = progress * 26; // vw each word travels apart

  return (
    <Box sx={{ overflowX: "hidden" }}>
      <Box
        component="section"
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100dvh - 68px)",
          py: { xs: 4, md: 5 },
        }}
      >
        {/* Background */}
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Box
            component="img"
            src={bgImageSrc}
            alt="Background"
            sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.45)" }} />
        </Box>

        {/* Foreground */}
        <Box
          sx={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            px: 2,
          }}
        >
          {/* Media focal point */}
          <Box
            sx={{
              position: "relative",
              width: { xs: "88vw", md: "min(1040px, 82vw)" },
              height: { xs: 260, sm: 340, md: 440, lg: 520 },
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
            }}
          >
            {mediaType === "video" ? (
              isYouTube ? (
                <Box
                  component="iframe"
                  src={
                    mediaSrc.includes("embed")
                      ? mediaSrc + (mediaSrc.includes("?") ? "&" : "?") + "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                      : mediaSrc.replace("watch?v=", "embed/") + "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" + mediaSrc.split("v=")[1]
                  }
                  sx={{ width: "100%", height: "100%", border: 0, pointerEvents: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
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
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )
            ) : (
              <Box
                component="img"
                src={mediaSrc}
                alt={title || "Media content"}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}

            <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.5)" }} />

            {logoSrc && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 20,
                  width: { xs: "min(64%, 320px)", sm: "min(68%, 400px)", md: "min(58%, 560px)", lg: "min(56%, 620px)" },
                  maxHeight: "90%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "726 / 156",
                    overflow: "hidden",
                    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
                  }}
                >
                  <Box
                    component="img"
                    src={logoSrc}
                    alt={logoAlt}
                    sx={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </Box>

                {logoSteps?.length ? (
                  <Box
                    aria-label={logoSteps.join(", ")}
                    sx={{
                      mt: { xs: 0.75, md: 1.25 },
                      display: "flex",
                      flexWrap: "nowrap",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: { xs: 0.5, sm: 1.25, md: 1.75 },
                      width: { xs: "min(86vw, 430px)", md: "100%" },
                      color: "#eaf6ff",
                      textShadow: "0 2px 10px rgba(0,0,0,0.75)",
                    }}
                  >
                    {logoSteps.map((step, index) => (
                      <Box
                        key={step}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: { xs: 0.5, md: 1.25 },
                          minWidth: 0,
                        }}
                      >
                        {index > 0 ? (
                          <Box
                            aria-hidden="true"
                            sx={{
                              width: 1,
                              height: { xs: 14, md: 22 },
                              bgcolor: "rgba(234,246,255,0.6)",
                            }}
                          />
                        ) : null}
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "0.64rem", sm: "0.82rem", md: "0.95rem" },
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            lineHeight: 1.15,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {step}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null}
              </Box>
            )}
          </Box>

          {/* Title + captions */}
          <Box
            sx={{
              mt: { xs: 2.5, md: 3.5 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              mixBlendMode: textBlend ? "difference" : "normal",
            }}
          >
            {date && (
              <Typography sx={{ fontSize: { xs: "0.95rem", md: "1.15rem" }, color: TEXT_BLUE, letterSpacing: "0.04em" }}>
                {date}
              </Typography>
            )}
            {title && (
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "baseline",
                  gap: { xs: 1.5, md: 3 },
                  width: "100%",
                }}
              >
                <Typography
                  component="h2"
                  sx={{
                    fontSize: { xs: "1.95rem", md: "2.55rem", lg: "3.25rem" },
                    fontWeight: 700,
                    color: TEXT_BLUE,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    transform: `translateX(-${shift}vw)`,
                    willChange: "transform",
                  }}
                >
                  {firstWord}
                </Typography>
                {restOfTitle && (
                  <Typography
                    component="h2"
                    sx={{
                      fontSize: { xs: "1.95rem", md: "2.55rem", lg: "3.25rem" },
                      fontWeight: 700,
                      color: TEXT_BLUE,
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                      transform: `translateX(${shift}vw)`,
                      willChange: "transform",
                    }}
                  >
                    {restOfTitle}
                  </Typography>
                )}
              </Box>
            )}
            {scrollToExpand && (
              <Typography sx={{ mt: 1.25, color: TEXT_BLUE, fontWeight: 500, opacity: 0.85 }}>
                {scrollToExpand}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Page content - normal document flow */}
      <Box component="section" sx={{ width: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}

export default ScrollExpandMedia;
