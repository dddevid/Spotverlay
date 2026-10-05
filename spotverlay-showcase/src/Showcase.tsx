import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const ACCENT = "#1ED760";
const BG = "#0b0b10";

const Scene: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 10, duration - 10, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 300;
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          left: -250 + Math.sin(t * Math.PI * 2) * 120,
          top: -400 + Math.cos(t * Math.PI * 2) * 80,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30,215,96,0.28) 0%, rgba(30,215,96,0) 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          right: -350 + Math.cos(t * Math.PI * 2) * 120,
          bottom: -500 + Math.sin(t * Math.PI * 2) * 80,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(110,70,230,0.32) 0%, rgba(110,70,230,0) 65%)",
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
    </AbsoluteFill>
  );
};

const Bars: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const heights = [0.35, 0.8, 0.55, 1].map((base, i) => {
    const v = 0.5 + 0.5 * Math.sin(frame / 5 + i * 1.4);
    return size * (0.25 + base * 0.45 + v * 0.3);
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: size * 0.1,
        height: size,
      }}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: size * 0.16,
            height: Math.min(h, size),
            borderRadius: size * 0.08,
            background: ACCENT,
            boxShadow: `0 0 ${size * 0.3}px rgba(30,215,96,0.5)`,
          }}
        />
      ))}
    </div>
  );
};

const Title: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  weight?: number;
  color?: string;
}> = ({ children, delay = 0, size = 72, weight = 700, color = "#fff" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: -size * 0.02,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
      }}
    >
      {children}
    </div>
  );
};

const OverlayCard: React.FC<{
  title: string;
  artist: string;
  c1: string;
  c2: string;
}> = ({ title, artist, c1, c2 }) => {
  const frame = useCurrentFrame();
  const bar = (i: number) =>
    4 + 10 * (0.5 + 0.5 * Math.sin(frame / 3.2 + i * 1.3));
  return (
    <div
      style={{
        width: 340,
        height: 96,
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        alignItems: "center",
        columnGap: 12,
        padding: "10px 12px",
        background: "rgba(28,28,30,0.68)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        backdropFilter: "blur(24px) saturate(160%)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.94)",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(235,235,245,0.6)" }}>{artist}</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 2.5,
              height: bar(i),
              background: ACCENT,
              borderRadius: 1,
              display: "block",
            }}
          />
        ))}
      </div>
    </div>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", gap: 28 }}
    >
      <div style={{ transform: `scale(${0.6 + pop * 0.4})`, opacity: pop }}>
        <Bars size={150} />
      </div>
      <Title size={150} weight={800} delay={8}>
        Spot<span style={{ color: ACCENT }}>verlay</span>
      </Title>
      <Title size={40} weight={500} delay={20} color="rgba(255,255,255,0.6)">
        The always-on-top now playing overlay
      </Title>
    </AbsoluteFill>
  );
};

const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame: frame - 14, fps, config: { damping: 16, stiffness: 110 } });
  const slideOut = interpolate(frame, [88, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const x = (1 - slideIn) * 130 + slideOut * 130;
  const cardOpacity = Math.min(slideIn, 1 - slideOut);
  const swap = interpolate(frame, [48, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const enter = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <Title size={64} weight={700} delay={4}>
          Know what's playing.
        </Title>
        <Title size={64} weight={700} delay={10} color={ACCENT}>
          Never alt-tab.
        </Title>
      </div>
      <div
        style={{
          width: 1280,
          height: 500,
          position: "relative",
          borderRadius: 28,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 50px 120px rgba(0,0,0,0.6)",
          background:
            "radial-gradient(120% 140% at 20% 0%, #2c1f6a 0%, #121326 50%, #07080d 100%)",
          transform: `translateY(${(1 - enter) * 60}px)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 90,
            width: 700,
            height: 330,
            borderRadius: 18,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 120,
            width: 240,
            height: 16,
            borderRadius: 8,
            background: "rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 156,
            width: 420,
            height: 12,
            borderRadius: 6,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 36,
            top: 32,
            transform: `translateX(${x}%) scale(2)`,
            transformOrigin: "top right",
            opacity: cardOpacity,
          }}
        >
          <div style={{ position: "relative" }}>
            <div style={{ opacity: 1 - swap }}>
              <OverlayCard
                title="Blinding Lights"
                artist="The Weeknd"
                c1="#ff3d6e"
                c2="#7a1fa2"
              />
            </div>
            <div style={{ position: "absolute", inset: 0, opacity: swap }}>
              <OverlayCard
                title="Get Lucky"
                artist="Daft Punk"
                c1="#f5b83d"
                c2="#e0502b"
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PLAYERS = [
  { name: "Spotify", color: "#1ED760" },
  { name: "Spotifast", color: "#4cc2ff" },
  { name: "SpotLight", color: "#ffd24c" },
  { name: "Apple Music", color: "#ff4d6d" },
  { name: "Musly", color: "#b388ff" },
];

const Players: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", gap: 70 }}
    >
      <div style={{ textAlign: "center" }}>
        <Title size={84} weight={700} delay={0}>
          Works with your
        </Title>
        <Title size={84} weight={700} delay={6} color={ACCENT}>
          favorite players
        </Title>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {PLAYERS.map((p, i) => {
          const s = spring({
            frame: frame - 18 - i * 6,
            fps,
            config: { damping: 14, stiffness: 140 },
          });
          return (
            <div
              key={p.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "22px 34px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 36,
                fontWeight: 600,
                color: "#fff",
                opacity: s,
                transform: `translateY(${(1 - s) * 50}px) scale(${0.85 + s * 0.15})`,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: p.color,
                  boxShadow: `0 0 20px ${p.color}`,
                }}
              />
              {p.name}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const img = spring({ frame, fps, config: { damping: 18 } });
  const float = Math.sin(frame / 14) * 8;
  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 120,
      }}
    >
      <div
        style={{
          opacity: img,
          transform: `translateY(${(1 - img) * 80 + float}px) rotate(-2deg)`,
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(30,215,96,0.15)",
        }}
      >
        <Img src={staticFile("settings.png")} style={{ height: 640, display: "block" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Title size={84} weight={800} delay={6}>
          Make it yours.
        </Title>
        <Title size={38} weight={500} delay={14} color="rgba(255,255,255,0.65)">
          Any corner. Fade or slide. Always on top.
        </Title>
        <Title size={38} weight={500} delay={22} color="rgba(255,255,255,0.65)">
          Windows · macOS · Linux
        </Title>
        <Title size={44} weight={700} delay={32} color={ACCENT}>
          github.com/dddevid/Spotverlay
        </Title>
      </div>
    </AbsoluteFill>
  );
};

export const Showcase: React.FC = () => (
  <AbsoluteFill style={{ fontFamily }}>
    <Background />
    <Sequence from={0} durationInFrames={80}>
      <Scene duration={80}>
        <Intro />
      </Scene>
    </Sequence>
    <Sequence from={70} durationInFrames={110}>
      <Scene duration={110}>
        <Screen />
      </Scene>
    </Sequence>
    <Sequence from={170} durationInFrames={70}>
      <Scene duration={70}>
        <Players />
      </Scene>
    </Sequence>
    <Sequence from={230} durationInFrames={70}>
      <Scene duration={70}>
        <Outro />
      </Scene>
    </Sequence>
  </AbsoluteFill>
);
