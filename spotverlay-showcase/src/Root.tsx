import React from "react";
import { Composition } from "remotion";
import { Showcase } from "./Showcase";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Showcase"
    component={Showcase}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
  />
);
