// The in-memory Clean twins served by vite.config.ts (trenchcoat-clean-twins) while components are ported to Lit
declare module "virtual:tc-clean" {
  const loaders: Record<string, () => Promise<Record<string, unknown>>>;
  export default loaders;
}
