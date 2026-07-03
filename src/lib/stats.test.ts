import { describe, expect, it } from "vitest";
import { averageGamesPlayed, gamesPlayedColorClass } from "@/lib/stats";

describe("averageGamesPlayed", () => {
  it("returns 0 for an empty stats map", () => {
    expect(averageGamesPlayed({})).toBe(0);
  });

  it("averages gamesPlayed across all entries", () => {
    expect(
      averageGamesPlayed({
        a: { gamesPlayed: 2 },
        b: { gamesPlayed: 4 },
      }),
    ).toBe(3);
  });
});

describe("gamesPlayedColorClass", () => {
  it("is neutral when nobody has played yet this session", () => {
    expect(gamesPlayedColorClass(0, 0)).toBe("text-line");
  });

  it("flags zero games as urgent once others have played", () => {
    expect(gamesPlayedColorClass(0, 1.5)).toBe("text-bench");
  });

  it("flags below-average (but nonzero) as catch-up", () => {
    expect(gamesPlayedColorClass(1, 2)).toBe("text-shuttle");
  });

  it("flags at-or-above-average as caught up", () => {
    expect(gamesPlayedColorClass(2, 2)).toBe("text-in");
    expect(gamesPlayedColorClass(3, 2)).toBe("text-in");
  });
});
