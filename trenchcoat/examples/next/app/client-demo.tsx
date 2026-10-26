"use client";
import dynamic from "next/dynamic";

export const ClientDemo = dynamic(() => import("./demo").then((m) => m.Demo), {
  ssr: false,
  loading: () => <main style={{ minHeight: 480 }} aria-busy="true" />,
});
