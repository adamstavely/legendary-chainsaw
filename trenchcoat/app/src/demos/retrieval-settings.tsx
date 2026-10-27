import { useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RetrievalEstimate, RetrievalFilterField, RetrievalRerankModel, RetrievalSettingsValue } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/* A help centre's retrieval settings. The pipeline and the foot follow every change: this page stands in for the
   app, working out latency and cost from its own rates (below) – the component only shows what it's given. The
   index was built at 512 / 64, so changing the chunking says the sources will be re-indexed. */

const FIELDS: RetrievalFilterField[] = [
  { id: "collection", label: "Collection", type: "choice", options: ["Help centre", "Policies", "Release notes", "Community"] },
  { id: "language", label: "Language", type: "choice", options: ["English", "German", "French", "Japanese"] },
  { id: "updated", label: "Updated", type: "date" },
  { id: "product", label: "Product", type: "text" },
];
const MODELS: RetrievalRerankModel[] = [
  { id: "cross-small", label: "Cross-encoder · small" },
  { id: "cross-large", label: "Cross-encoder · large" },
];

const PRESETS: { label: string; value: RetrievalSettingsValue }[] = [
  {
    label: "Support answers",
    value: {
      chunkSize: 512,
      chunkOverlap: 64,
      topK: 40,
      threshold: 0.35,
      hybrid: 0.7,
      rerank: true,
      rerankModel: "cross-small",
      topN: 8,
      filters: [
        { id: "f1", field: "language", operator: "is", value: "English" },
        { id: "f2", field: "collection", operator: "is-not", value: "Community" },
      ],
    },
  },
  {
    label: "Fast lookups",
    value: { chunkSize: 512, chunkOverlap: 64, topK: 12, threshold: 0.5, hybrid: 0.4, rerank: false, rerankModel: "cross-small", topN: 4, filters: [] },
  },
  {
    label: "Long policies",
    value: {
      chunkSize: 1024,
      chunkOverlap: 160,
      topK: 80,
      threshold: 0.25,
      hybrid: 0.85,
      rerank: true,
      rerankModel: "cross-large",
      topN: 12,
      filters: [{ id: "f3", field: "updated", operator: "after", value: "2025-01-01" }],
    },
  },
];

/** The app's side: what these settings cost, from made-up rates */
function estimateFor(v: RetrievalSettingsValue): RetrievalEstimate {
  const retrieve = Math.round(38 + v.topK * 0.6 + (v.hybrid > 0 && v.hybrid < 1 ? 22 : 0));
  const filter = 4 + v.filters.length * 3;
  const rerank = v.rerank ? Math.round((v.rerankModel === "cross-large" ? 2.4 : 1.1) * v.topK + 30) : undefined;
  const contextTokens = Math.round(v.topN * v.chunkSize * 0.92);
  const cost = 0.00002 + (v.rerank ? v.topK * (v.rerankModel === "cross-large" ? 0.00006 : 0.00002) : 0) + contextTokens * 0.0000025;
  const latencyMs = retrieve + filter + (rerank ?? 0);
  const note = v.rerank && v.topK > 60 ? `Reranking ${v.topK} chunks is most of the wait – a k of 40 halves it.` : !v.rerank ? "Without reranking the top chunks are the highest scores, as they come." : undefined;
  return { latencyMs, cost, contextTokens, note, stages: { retrieve, filter, ...(rerank !== undefined ? { rerank } : {}) } };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RetrievalSettings } = ui;
  const [pick, setPick] = useState(0);
  const [value, setValue] = useState<RetrievalSettingsValue>(PRESETS[0].value);
  const estimate = useMemo(() => estimateFor(value), [value]);
  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 12 }}>
      <RetrievalSettings
        title="Retrieval"
        description="Help centre index · 4 sources"
        value={value}
        onChange={setValue}
        filterFields={FIELDS}
        rerankModels={MODELS}
        indexed={{ chunkSize: 512, chunkOverlap: 64 }}
        estimate={estimate}
        name="retrieval"
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            style={buttonSm}
            aria-pressed={i === pick}
            onClick={() => {
              setPick(i);
              setValue(p.value);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
