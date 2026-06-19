import type { CSSProperties } from "react";

/**
 * 3-column review grid. Pillars stack above left/right fender (repeater) cameras;
 * front stacks above back in the center column when pillars are present.
 */
const CAMERA_GRID_AREA: Record<string, string> = {
  left_pillar: "left-pillar",
  front: "front",
  right_pillar: "right-pillar",
  left_repeater: "left-fender",
  back: "back",
  right_repeater: "right-fender",
};

export const getCameraGridArea = (camera: string) => CAMERA_GRID_AREA[camera];

export const getReviewGridStyle = (cameras: string[]): CSSProperties => {
  const available = new Set(cameras);
  const hasLeftPillar = available.has("left_pillar");
  const hasRightPillar = available.has("right_pillar");

  if (hasLeftPillar && hasRightPillar) {
    return {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      gridTemplateAreas: `
        "left-pillar front right-pillar"
        "left-fender back right-fender"
      `,
    };
  }

  if (hasLeftPillar) {
    return {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      gridTemplateAreas: `
        "left-pillar front front"
        "left-fender back right-fender"
      `,
    };
  }

  if (hasRightPillar) {
    return {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      gridTemplateAreas: `
        "front front right-pillar"
        "left-fender back right-fender"
      `,
    };
  }

  return {
    gridTemplateColumns: "1fr 1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gridTemplateAreas: `
      "front front front"
      "left-fender back right-fender"
    `,
  };
};
