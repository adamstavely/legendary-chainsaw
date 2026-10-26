// Dev-only page for scripts/compare-lit.mjs (lit-port-plan.md acceptance check 4): every React component that has
// a Lit port, next to the element, with the same props, in both looks and both themes. Each side is screenshotted
// and diffed. With ?demo=<slug>[,<slug>…] the page shows each component's gallery demo instead: the React module
// (the Clean twin for Clean) next to the same demo on the React wrappers inside a look provider.
import { useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import cleanTwins from "virtual:tc-clean";
import "../../tokens/tokens.css";
import { Button as ReactButton } from "../../src/components/button";
import { Combobox as ReactCombobox } from "../../src/components/combobox";
import { DataTable as ReactDataTable } from "../../src/components/data-table";
import { Button, Combobox, DataTable, LookProvider } from "../../src/elements/react";

const people = [
  { value: "ana", label: "Ana Lima", group: "People", hint: "Design" },
  { value: "ben", label: "Ben Ito", group: "People" },
  { value: "bug", label: "Bug", group: "Labels", color: "#d93d42" },
];
const columns = [
  { key: "name", label: "Company", type: "title" as const },
  { key: "stage", label: "Stage", type: "tag" as const },
  { key: "arr", label: "ARR", type: "number" as const },
];
const rows = [
  { id: "a", name: "Acme", stage: "Lead", arr: 1200 },
  { id: "b", name: "Bolt", stage: "Won", arr: 800 },
];

type Case = { id: string; react: (look: "standard" | "clean") => React.ReactNode; lit: (look: "standard" | "clean") => React.ReactNode };
const cases: Case[] = [
  {
    id: "button",
    react: (look) => (
      <div style={{ display: "flex", gap: 8 }}>
        <ReactButton look={look}>Save</ReactButton>
        <ReactButton look={look} variant="secondary">Copy</ReactButton>
        <ReactButton look={look} variant="ghost" size="sm">Ghost</ReactButton>
        <ReactButton look={look} variant="destructive" size="lg">Delete</ReactButton>
      </div>
    ),
    lit: (look) => (
      <div style={{ display: "flex", gap: 8 }}>
        <Button look={look}>Save</Button>
        <Button look={look} variant="secondary">Copy</Button>
        <Button look={look} variant="ghost" size="sm">Ghost</Button>
        <Button look={look} variant="destructive" size="lg">Delete</Button>
      </div>
    ),
  },
  {
    id: "combobox",
    react: (look) => <ReactCombobox look={look} label="Assignees" options={people} defaultValue={["ana", "bug"]} />,
    lit: (look) => <Combobox look={look} label="Assignees" options={people} defaultValue={["ana", "bug"]} />,
  },
  {
    id: "data-table",
    react: (look) => <ReactDataTable look={look} title="Accounts" columns={columns} defaultRows={rows} />,
    lit: (look) => <DataTable look={look} title="Accounts" columns={columns} defaultRows={rows} />,
  },
];

const demos = import.meta.glob<{ default: ComponentType<{ ui: unknown }> }>(["./demos/*.tsx", "./demos/{illustrations,motion}/*.tsx"]);
const reactModules = import.meta.glob(["../../src/components/*.tsx", "../../{illustrations,motion}/*.tsx"]);
/** "<slug>" for a component, "illustrations/<slug>" or "motion/<slug>" for the single-look libraries */
const reactPath = (id: string) => (id.includes("/") ? `../../${id}.tsx` : `../../src/components/${id}.tsx`);
const demoSlugs = new URLSearchParams(location.search).get("demo")?.split(",").filter(Boolean) ?? [];

/** The demo on the React component and on the wrappers, once both modules have loaded */
function demoCase(slug: string, loaded: Record<string, { Demo: ComponentType<{ ui: unknown }>; standard: unknown; clean: unknown; lit: unknown }>): Case {
  const m = loaded[slug];
  return {
    id: slug.replace("/", "-"),
    react: (look) => (m ? <m.Demo ui={look === "clean" ? m.clean : m.standard} /> : null),
    lit: (look) => (m ? <LookProvider look={look}><m.Demo ui={m.lit} /></LookProvider> : null),
  };
}

function Page() {
  const [loaded, setLoaded] = useState<Parameters<typeof demoCase>[1]>({});
  useEffect(() => {
    void Promise.all(
      demoSlugs.map(async (slug) => {
        const [demo, standard, clean, lit] = await Promise.all([
          demos[`./demos/${slug}.tsx`]!(),
          reactModules[reactPath(slug)]!(),
          cleanTwins[slug] ? cleanTwins[slug]() : reactModules[reactPath(slug)]!(),
          import("../../src/elements/react"),
        ]);
        return [slug, { Demo: demo.default, standard, clean, lit }] as const;
      }),
    ).then((list) => {
      setLoaded(Object.fromEntries(list));
      document.body.dataset.ready = "true";
    });
  }, []);
  const shown = demoSlugs.length ? demoSlugs.map((s) => demoCase(s, loaded)) : cases;
  return (
    <>
      {shown.flatMap((c) =>
        (["standard", "clean"] as const).flatMap((look) =>
          (["light", "dark"] as const).map((theme) => (
            <div key={`${c.id}-${look}-${theme}`} className="pair" data-theme={theme} data-tc-theme={theme} id={`${c.id}-${look}-${theme}`}>
              <div className="side" data-side="react">{c.react(look)}</div>
              <div className="side" data-side="lit">{c.lit(look)}</div>
            </div>
          )),
        ),
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Page />);
