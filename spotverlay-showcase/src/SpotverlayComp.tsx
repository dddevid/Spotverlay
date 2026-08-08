import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import React from "react";
import "./index.css";

const MOCK_TITLE = "Get Lucky (feat. Pharrell Williams)";
const MOCK_ARTIST = "Daft Punk";

export const SpotverlayComp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide in animation (starts at frame 15)
  const slideIn = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  // Slide out animation (starts at frame 210)
  const slideOut = spring({
    frame: Math.max(0, frame - 210),
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  // Calculate position: moves from right (+400px) to 0, then back to +400px
  const translateX = (1 - slideIn) * 400 + slideOut * 400;

  // Background blur and gradient
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0f12" }}>
      {/* Abstract Background */}
      <div className="bg-gradient-1" />
      <div className="bg-gradient-2" />
      
      {/* Container simulating top-right corner of a screen */}
      <AbsoluteFill style={{ padding: 40 }}>
        <div style={{
          position: "absolute",
          top: 40,
          right: 40,
          transform: `translateX(${translateX}px)`,
          opacity: slideIn - slideOut, // subtle fade combined with slide
        }}>
          {/* The actual Spotverlay Card */}
          <div className="card playing show">
            <div className="art-wrap" style={{ background: 'linear-gradient(45deg, #1ED760, #1a1a20)' }}>
            </div>

            <div className="info">
              <div className="title">{MOCK_TITLE}</div>
              <div className="artist">{MOCK_ARTIST}</div>
            </div>

            <div className="eq">
              <span style={{ animationDelay: '-0.9s' }}></span>
              <span style={{ animationDelay: '-0.6s' }}></span>
              <span style={{ animationDelay: '-0.3s' }}></span>
              <span style={{ animationDelay: '0s' }}></span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
