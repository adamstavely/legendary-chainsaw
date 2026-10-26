import type * as UI from "@motion/shimmer-loader";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Skeleton, ShimmerText } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 20 }}>
      <div
        style={{
          borderRadius: "var(--tc-card-radius, 16px)",
          padding: 16,
          background: "var(--tc-surface-raised, light-dark(#ffffff, #19191b))",
          boxShadow: "var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)))",
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton circle width={40} />
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <Skeleton width="45%" height={12} />
            <Skeleton width="30%" height={10} />
          </div>
        </div>
        <Skeleton height={140} radius={10} />
        <div style={{ display: "grid", gap: 8 }}>
          <Skeleton />
          <Skeleton />
          <Skeleton width="70%" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton width={72} height={28} radius={8} />
          <Skeleton width={72} height={28} radius={8} />
        </div>
      </div>
      <div style={{ fontSize: "var(--tc-font-size-lg-plus, 15px)", fontWeight: "var(--tc-font-weight-medium, 500)" }}>
        <ShimmerText>Thinking…</ShimmerText>
      </div>
    </div>
  );
}
