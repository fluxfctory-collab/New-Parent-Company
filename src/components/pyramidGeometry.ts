/**
 * Geometry of the supplied pyramid artwork (public/images/guardian-pyramid.png),
 * measured from its alpha channel by scripts/prepare-pyramid.mjs. Pixel coordinates
 * include the transparent padding, so dividing by the full image size gives normalized
 * coordinates that stay aligned at any rendered width.
 */
import type { Tier } from "../content";

export const PYRAMID = { width: 1254, height: 1254 } as const;

type Point = readonly [number, number];

/**
 * Each tier's outline (outer edge of its gold frame), clockwise from the top-left/tip.
 * The artwork is cropped tight at the foundation's bottom corners, so that tier's line
 * fits end a few pixels outside the image (x −5.6 and 1256), exactly where the frame's
 * edges would meet.
 */
const OUTLINES_PX: Record<Tier, readonly Point[]> = {
  apex: [[627, 67], [918.6, 571], [321.4, 571]],
  middle: [[328.5, 583], [921.9, 583], [1084.9, 877], [161, 877]],
  foundation: [[160, 889], [1091.4, 889], [1256, 1190], [-5.6, 1190]],
};

const norm = ([x, y]: Point): Point => [x / PYRAMID.width, y / PYRAMID.height];

/** Polygon points in a 0–1 × 0–1 coordinate space (SVG viewBox "0 0 1 1"). */
export const tierPoints = (tier: Tier) =>
  OUTLINES_PX[tier].map((p) => norm(p).map((v) => v.toFixed(4)).join(",")).join(" ");

/**
 * Where each connector leaves its tier: the tier's mid-height on the side that faces the
 * company's description (Medical Advisory sits to the left; the others to the right).
 */
export const CONNECTOR_SIDE: Record<Tier, "left" | "right"> = {
  apex: "right",
  middle: "left",
  foundation: "right",
};

export function anchor(tier: Tier): { x: number; y: number } {
  const pts = OUTLINES_PX[tier];
  const top = pts[0][1];
  const bottom = pts[pts.length - 1][1];
  const yMid = (top + bottom) / 2;
  let from: Point;
  let to: Point;
  if (tier === "apex") {
    [from, to] = CONNECTOR_SIDE[tier] === "right" ? [pts[0], pts[1]] : [pts[0], pts[2]];
  } else {
    [from, to] = CONNECTOR_SIDE[tier] === "right" ? [pts[1], pts[2]] : [pts[0], pts[3]];
  }
  const t = (yMid - from[1]) / (to[1] - from[1]);
  const x = from[0] + (to[0] - from[0]) * t;
  return { x: x / PYRAMID.width, y: yMid / PYRAMID.height };
}
