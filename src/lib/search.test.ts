import { describe, expect, it } from "vitest";
import { filterByName, findBestNameMatch } from "@/lib/search";

function items(names: string[]) {
  return names.map((name, i) => ({ id: String(i), name }));
}

describe("findBestNameMatch", () => {
  it("returns null for an empty query", () => {
    expect(findBestNameMatch(items(["Alice", "Bob"]), "")).toBeNull();
    expect(findBestNameMatch(items(["Alice", "Bob"]), "   ")).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(findBestNameMatch([], "alice")).toBeNull();
  });

  it("prefers an exact match over a prefix match", () => {
    const list = items(["Al", "Alice"]);
    expect(findBestNameMatch(list, "al")?.name).toBe("Al");
  });

  it("prefers a prefix match over a substring match", () => {
    const list = items(["Micha", "Micha Chan"]);
    expect(findBestNameMatch(list, "micha")?.name).toBe("Micha");
  });

  it("prefers a substring match over a fuzzy match", () => {
    const list = items(["Xavier", "Javier"]);
    expect(findBestNameMatch(list, "avier")?.name).toBe("Xavier");
  });

  it("falls back to the closest edit-distance match with a typo", () => {
    const list = items(["Schuyler", "Bob", "Zoe"]);
    expect(findBestNameMatch(list, "Shuyler")?.name).toBe("Schuyler");
  });

  it("is case-insensitive", () => {
    const list = items(["Alice"]);
    expect(findBestNameMatch(list, "ALICE")?.name).toBe("Alice");
  });
});

describe("filterByName", () => {
  it("returns every item, unfiltered, for an empty query", () => {
    const list = items(["Alice", "Bob"]);
    expect(filterByName(list, "")).toEqual(list);
    expect(filterByName(list, "   ")).toEqual(list);
  });

  it("returns an empty list when nothing contains the query (no fuzzy fallback)", () => {
    const list = items(["Schuyler", "Bob", "Zoe"]);
    expect(filterByName(list, "Shuyler")).toEqual([]);
  });

  it("ranks exact match, then starts-with, then contains", () => {
    const list = items(["Micha Chan", "Al Micha", "Micha"]);
    const result = filterByName(list, "Micha");
    expect(result.map((r) => r.name)).toEqual(["Micha", "Micha Chan", "Al Micha"]);
  });

  it("is case-insensitive", () => {
    const list = items(["Alice", "Bob"]);
    expect(filterByName(list, "ALI").map((r) => r.name)).toEqual(["Alice"]);
  });

  it("sorts ties alphabetically", () => {
    const list = items(["Wei Jie", "Wei Ming"]);
    expect(filterByName(list, "Wei").map((r) => r.name)).toEqual(["Wei Jie", "Wei Ming"]);
  });
});
