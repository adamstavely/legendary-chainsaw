import type * as UI from "@screens/search-results";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.SearchResultsScreen />;
}
