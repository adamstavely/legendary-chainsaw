// Types for tests/browser-features.test.ts
export const TABLE: { features: { id: string; pattern: string; sample: string; watch?: boolean; versions: Record<string, string | null> }[] };
export function allSlugs(): string[];
export function usersOf(slugs: string[]): Map<string, string[]>;
