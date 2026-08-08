import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import React from "react";
import "./index.css";

const MOCK_TITLE_1 = "Get Lucky (feat. Pharrell Williams)";
const MOCK_ARTIST_1 = "Daft Punk";
const MOCK_TITLE_2 = "Blinding Lights";
const MOCK_ARTIST_2 = "The Weeknd";

const SpotverlayCard: React.FC<{ title: string; artist: string; color1: string; color2: string; scale?: number }> = ({ title, artist, color1, color2, scale = 1 }) => {
  return (
    <div className="card playing show" style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}>
      <div className="art-wrap" style={{ background: `linear-gradient(45deg, ${color1}, ${color2})` }}></div>
      <div className="info">
        <div className="title">{title}</div>
        <div className="artist">{artist}</div>
      </div>
      <div className="eq">
        <span style={{ animationDelay: '-0.9s' }}></span>
        <span style={{ animationDelay: '-0.6s' }}></span>
        <span style={{ animationDelay: '-0.3s' }}></span>
        <span style={{ animationDelay: '0s' }}></span>
      </div>
    </div>
  );
};

const Background = () => {
  const frame = useCurrentFrame();
  const rotate = interpolate(frame, [0, 900], [0, 90]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0f12" }}>
      <div className="bg-gradient-1" style={{ transform: `rotate(${rotate}deg)` }} />
      <div className="bg-gradient-2" style={{ transform: `rotate(${-rotate}deg)` }} />
    </AbsoluteFill>
  );
};

export const SpotverlayTrailer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- SCENE 1: Teaser (Macro Zoom) ---
  const scaleMacro = interpolate(frame, [0, 180], [3.5, 4.5], { extrapolateRight: "clamp" });
  const xMacro = interpolate(frame, [0, 180], [500, 600], { extrapolateRight: "clamp" });
  const yMacro = interpolate(frame, [0, 180], [300, 400], { extrapolateRight: "clamp" });
  const opacityText1 = spring({ frame: frame - 30, fps, config: { damping: 12 } });

  // --- SCENE 2: Reveal ---
  // Camera zooms out from macro to normal
  const scaleOut = spring({ frame: frame - 170, fps, config: { damping: 14, stiffness: 80 } });
  const currentScale = interpolate(scaleOut, [0, 1], [scaleMacro, 1]);
  const currentX = interpolate(scaleOut, [0, 1], [xMacro, 0]);
  const currentY = interpolate(scaleOut, [0, 1], [yMacro, 0]);
  
  // Texts for Reveal
  const text2_1 = spring({ frame: frame - 220, fps, config: { damping: 12 } });
  const text2_2 = spring({ frame: frame - 280, fps, config: { damping: 12 } });
  const text2_3 = spring({ frame: frame - 340, fps, config: { damping: 12 } });
  const fadeOutText2 = spring({ frame: frame - 400, fps, config: { damping: 12 } });

  // --- SCENE 3: Feature (Song Change) ---
  const slideOutAnim = spring({ frame: frame - 420, fps, config: { damping: 14, stiffness: 120 } });
  const slideInAnim = spring({ frame: frame - 470, fps, config: { damping: 14, stiffness: 120 } });
  
  const translateX = interpolate(slideOutAnim, [0, 1], [0, 400]) - interpolate(slideInAnim, [0, 1], [400, 0]);

  // --- SCENE 4: Outro ---
  const blurOutro = interpolate(frame, [660, 720], [0, 20], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacityOutro = interpolate(frame, [660, 720], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  const logoScale = spring({ frame: frame - 700, fps, config: { damping: 12, stiffness: 100 } });

  return (
    <AbsoluteFill>
      <Background />
      
      {/* Container simulating screen boundaries, affected by global camera */}
      <AbsoluteFill style={{ filter: `blur(${blurOutro}px)`, opacity: opacityOutro }}>
        {/* Global Camera Transform */}
        <div style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%', 
          transform: `translate(${currentX}px, ${currentY}px) scale(${currentScale})`,
          transformOrigin: 'top right'
        }}>
          {/* Card Wrapper */}
          <div style={{ position: "absolute", top: 40, right: 40, transform: `translateX(${translateX}px)` }}>
            {frame < 450 ? (
              <SpotverlayCard title={MOCK_TITLE_1} artist={MOCK_ARTIST_1} color1="#1ED760" color2="#1a1a20" />
            ) : (
              <SpotverlayCard title={MOCK_TITLE_2} artist={MOCK_ARTIST_2} color1="#ff0000" color2="#330000" />
            )}
          </div>
        </div>
      </AbsoluteFill>

      {/* OVERLAY TEXTS */}
      
      {/* Scene 1 Text */}
      <Sequence from={0} durationInFrames={175}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: 100, 
            fontWeight: 700,
            opacity: opacityText1,
            transform: `translateY(${interpolate(opacityText1, [0, 1], [50, 0])}px)`,
            textShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}>
            Meet Spotverlay.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2 Text */}
      <Sequence from={175} durationInFrames={235}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: 1 - fadeOutText2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            <h1 style={{ color: 'white', fontSize: 80, fontWeight: 700, opacity: text2_1, transform: `translateY(${interpolate(text2_1, [0, 1], [30, 0])}px)` }}>Zero Setup.</h1>
            <h1 style={{ color: 'white', fontSize: 80, fontWeight: 700, opacity: text2_2, transform: `translateY(${interpolate(text2_2, [0, 1], [30, 0])}px)` }}>Seamless.</h1>
            <h1 style={{ color: '#1ED760', fontSize: 80, fontWeight: 700, opacity: text2_3, transform: `translateY(${interpolate(text2_3, [0, 1], [30, 0])}px)` }}>Always on Top.</h1>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4 Outro Text */}
      <Sequence from={700}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ transform: `scale(${logoScale})`, textAlign: 'center' }}>
            <h1 style={{ color: 'white', fontSize: 130, fontWeight: 800, margin: 0, letterSpacing: '-2px' }}>Spotverlay</h1>
            <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 40, fontWeight: 500, margin: '20px 0 0 0' }}>Available on GitHub</h2>
          </div>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};
