import { describe, expect, it } from "vitest";
import { squareCropRect } from "@/lib/image";

describe("squareCropRect", () => {
  it("centers a square crop within a landscape image", () => {
    const { sx, sy, side } = squareCropRect(400, 200);
    expect(side).toBe(200);
    expect(sx).toBe(100);
    expect(sy).toBe(0);
  });

  it("centers a square crop within a portrait image", () => {
    const { sx, sy, side } = squareCropRect(200, 400);
    expect(side).toBe(200);
    expect(sx).toBe(0);
    expect(sy).toBe(100);
  });

  it("returns the full frame for an already-square image", () => {
    const { sx, sy, side } = squareCropRect(300, 300);
    expect(side).toBe(300);
    expect(sx).toBe(0);
    expect(sy).toBe(0);
  });
});
