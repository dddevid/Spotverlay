import "./index.css";
import { Composition } from "remotion";
import { SpotverlayTrailer } from "./SpotverlayTrailer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpotverlayTrailer"
        component={SpotverlayTrailer}
        durationInFrames={900} // 15 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
