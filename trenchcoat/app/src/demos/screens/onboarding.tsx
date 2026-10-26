import type * as UI from "@screens/onboarding";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.OnboardingScreen />;
}
