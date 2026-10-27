import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ProviderConnectionCheck, ProviderConnectionCredential, ProviderConnectionOption, ProviderConnectionValue } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A support team connects its assistant to a model deployment. The connection starts on the staging key, which the
   endpoint refuses; pick the production key and test again, and the deployment's models come back. The old key has
   expired, and a deployment name the endpoint doesn't have comes back as unavailable. The "server" below stands in
   for the app's backend – it waits a moment, honours the abort signal, and answers from the config. */

const PROVIDERS: ProviderConnectionOption[] = [
  { id: "azure", label: "Azure OpenAI", endpoint: "https://<resource>.openai.azure.com", deploymentLabel: "Deployment" },
  { id: "openai-compatible", label: "OpenAI-compatible", endpoint: "https://api.example.com/v1", deploymentLabel: "Model" },
  { id: "bedrock", label: "Amazon Bedrock", endpoint: "https://bedrock-runtime.<region>.amazonaws.com", deploymentLabel: "Model" },
];
const CREDENTIALS: ProviderConnectionCredential[] = [
  { id: "kv/support-prod", label: "Production key", hint: "4f2a", expires: "Expires 14 Jan" },
  { id: "kv/support-staging", label: "Staging key", hint: "91c0", expires: "Expires 2 Dec" },
  { id: "kv/support-2024", label: "Old production key", hint: "be17", expires: "Expired 30 Sep", expired: true },
];
const MODELS = [
  { id: "support-assistant", label: "GPT-4o", detail: "128k context" },
  { id: "support-assistant-mini", label: "GPT-4o mini", detail: "128k context" },
  { id: "support-embeddings", label: "text-embedding-3-small", detail: "Embeddings" },
];
const START: ProviderConnectionValue = { provider: "azure", endpoint: "https://northwind-support.openai.azure.com", deployment: "support-assistant", credentialRef: "kv/support-staging" };

/** The app's backend, in miniature: answers after a short wait unless the signal aborts first */
function tryConnection(v: ProviderConnectionValue, signal: AbortSignal): Promise<ProviderConnectionCheck> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const at = new Date();
      const latencyMs = 140 + Math.round(Math.random() * 120);
      if (!v.endpoint.includes("northwind-support")) return resolve({ status: "unreachable", at });
      if (v.credentialRef === "kv/support-2024") return resolve({ status: "expired", at, latencyMs });
      if (v.credentialRef !== "kv/support-prod") return resolve({ status: "auth-failed", at, latencyMs, message: "401 – the key isn't valid for this resource." });
      if (v.deployment && !MODELS.some((m) => m.id === v.deployment)) return resolve({ status: "model-unavailable", at, latencyMs, models: MODELS });
      resolve({ status: "healthy", at, latencyMs, models: MODELS });
    }, 1100);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProviderConnection } = ui;
  const [value, setValue] = useState(START);
  const [check, setCheck] = useState<ProviderConnectionCheck | null>(null);
  const [note, setNote] = useState("Testing with the staging key…");
  const host = useRef<HTMLDivElement>(null);
  const test = (v: ProviderConnectionValue, signal: AbortSignal) => {
    tryConnection(v, signal).then(
      (c) => {
        setCheck(c);
        setNote(c.status === "auth-failed" ? "The staging key is refused here – pick the production key and test again." : c.status === "healthy" ? "Connected. Try the old key, or a deployment name the endpoint doesn't have." : "Pick the production key and the support-assistant deployment to get back to healthy.");
      },
      () => setNote("Test cancelled."),
    );
  };
  // One test on arrival, so the first answer shows without a click
  useEffect(() => {
    const t = setTimeout(() => host.current?.querySelector<HTMLButtonElement>(".ui-prv__test")?.click(), 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={host} style={{ width: "100%", maxWidth: 600, display: "grid", gap: 8 }}>
      <ProviderConnection description="Support assistant · production" providers={PROVIDERS} credentials={CREDENTIALS} value={value} onChange={setValue} check={check} onTest={test} name="provider" />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setValue(START);
            setCheck(null);
            setNote("Back to the staging key – press Test connection.");
          }}
        >
          Start again
        </button>
      </div>
    </div>
  );
}
