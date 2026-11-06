// The spot illustrations imported from the package ("trenchcoat/illustrations/spot/<folder>/<name>.svg") are URLs,
// as the bundler's asset handling makes them – the package path resolves to the .svg itself, past vite/client's "*.svg"
declare module "trenchcoat/illustrations/spot/*" {
  const url: string;
  export default url;
}
