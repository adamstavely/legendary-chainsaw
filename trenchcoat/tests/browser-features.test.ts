/*
 * The browser feature table (scripts/browser-features.json, remediation 6.5) stays honest:
 *   · every feature is found in at least one element – a pattern that matches nothing is a row that can't be right;
 *   · features marked `watch` (in the table, used by no element yet) are found in none – once one is used, the mark
 *     comes off and the feature counts;
 *   · every pattern matches its own sample, so a watched feature's pattern is known to work before anything uses it.
 */
import { describe, expect, test } from "vitest";
import { TABLE, allSlugs, usersOf } from "../scripts/browser-support.mjs";

type Feature = { id: string; pattern: string; sample: string; watch?: boolean; versions: Record<string, string | null> };
const features = (TABLE as { features: Feature[] }).features;
const users = usersOf(allSlugs()) as Map<string, string[]>;

describe("browser feature table", () => {
  test.each(features.filter((f) => !f.watch).map((f) => [f.id]))("%s is used by at least one element", (id) => {
    expect(users.get(id)!.length).toBeGreaterThan(0);
  });
  test.each(features.filter((f) => f.watch).map((f) => [f.id]))("%s is watched and used by no element yet", (id) => {
    expect(users.get(id), "an element uses it now – remove `watch` from its row").toEqual([]);
  });
  test.each(features.map((f) => [f.id, f] as const))("%s matches its sample", (_id, f) => {
    expect(new RegExp(f.pattern, "m").test(f.sample)).toBe(true);
  });
  test.each(features.map((f) => [f.id, f] as const))("%s has a version for every browser", (_id, f) => {
    expect(Object.keys(f.versions).sort()).toEqual(["chrome", "edge", "firefox", "safari", "safari_ios"]);
  });
});
