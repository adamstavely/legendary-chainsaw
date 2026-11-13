/*
 * <tc-trust-center> in real browsers: certifications with their status in words, documents to view or request (NDA
 * noted), the DPA, questions as disclosures, the roving keyboard, controlled use, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/trust-center";
import type { TcTrustCenter, TrustCertification, TrustDocument, TrustDocumentOpen, TrustDpaSign, TrustFaq, TrustOpenChange, TrustRequest } from "../../src/elements/trust-center";
import { TrustCenter } from "../../src/elements/react/trust-center";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CERTS: TrustCertification[] = [
  { id: "iso", name: "ISO 27001", status: "certified", period: "2026–2029", auditor: "Halden Assurance" },
  { id: "iso42", name: "ISO 42001", status: "in-progress", period: "Expected Q2 2027" },
  { id: "csa", name: "CSA STAR", status: "planned" },
];
const DOCS: TrustDocument[] = [
  { id: "overview", title: "Security overview", access: "public", href: "#overview", updated: Date.UTC(2026, 9, 2, 12) },
  { id: "pentest", title: "Penetration test summary", access: "request", nda: true },
  { id: "soc", title: "SOC 2 report", access: "requested", nda: true },
  { id: "policies", title: "Security policies", access: "granted" },
];
const FAQS: TrustFaq[] = [
  { id: "train", question: "Is our data used for training?", answer: "No." },
  { id: "where", question: "Where is data stored?", answer: "In the EU or the US." },
];

const doc = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-tcn__doc[data-id="${id}"]`)!;
const faqBtn = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-faq="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcTrustCenter>(
    html`<tc-trust-center look=${look} description="Quanta Workspace." .certifications=${CERTS} .documents=${DOCS} .dpa=${{ status: "not-signed", version: "v3.1" }} .faqs=${FAQS} last-updated=${Date.UTC(2026, 10, 3, 12)}></tc-trust-center>`,
  );

describe("tc-trust-center", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: four named sections; certifications with status in words; one tab stop for documents and one for questions`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("tcn");
      expect(el.dataset.look).toBe(look);
      const sections = [...el.querySelectorAll("section")].map((s) => document.getElementById(s.getAttribute("aria-labelledby")!)!.textContent);
      expect(sections).toEqual(["Certifications and frameworks", "Security documents", "Data Processing Agreement", "Common questions"]);
      expect([...el.querySelectorAll(".ui-tcn__cert")].map((c) => [c.querySelector(".ui-tcn__cert-name")!.textContent, c.querySelector(".ui-tcn__pill")!.textContent!.trim()])).toEqual([
        ["ISO 27001", "Certified"],
        ["ISO 42001", "In progress"],
        ["CSA STAR", "Planned"],
      ]);
      expect(el.querySelector(".ui-tcn__cert")!.querySelector(".ui-tcn__cert-meta")!.textContent).toBe("2026–2029 · Auditor Halden Assurance");
      expect(el.querySelector(".ui-tcn__updated")!.textContent).toMatch(/^Updated /);
      expect(el.querySelectorAll('.ui-tcn__docs [tabindex="0"]')).toHaveLength(1);
      expect(el.querySelectorAll('.ui-tcn__faqs [tabindex="0"]')).toHaveLength(1);
    });
  }

  test("documents: View for public and granted, Request access for the rest, Requested shown, NDA in words", async () => {
    const el = await make();
    const view = doc(el, "overview").querySelector<HTMLAnchorElement>("a.ui-tcn__view")!;
    expect(view.getAttribute("href")).toBe("#overview");
    expect(view.getAttribute("rel")).toBe("noopener noreferrer");
    expect(view.textContent!.replace(/\s+/g, " ").trim()).toBe("View Security overview");
    expect(doc(el, "pentest").querySelector(".ui-tcn__request")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Request access Penetration test summary");
    expect(doc(el, "pentest").querySelector(".ui-tcn__nda")!.textContent).toBe("NDA required");
    expect(doc(el, "soc").querySelector(".ui-tcn__requested")!.textContent).toBe("Requested");
    expect(doc(el, "soc").querySelector("button, a")).toBeNull();
    expect(doc(el, "policies").querySelector("button.ui-tcn__view")).toBeTruthy();
    expect(doc(el, "overview").querySelector(".ui-tcn__doc-meta")!.textContent).toMatch(/Public/);
  });

  test("Request access fires tc-request; unless prevented the document says Requested and focus moves on", async () => {
    const el = await make();
    const seen: TrustRequest[] = [];
    let block = true;
    el.addEventListener("tc-request", (e) => {
      seen.push((e as CustomEvent<TrustRequest>).detail);
      if (block) e.preventDefault();
    });
    doc(el, "pentest").querySelector<HTMLButtonElement>(".ui-tcn__request")!.click();
    await settle();
    expect(seen.map((s) => s.id)).toEqual(["pentest"]);
    expect(doc(el, "pentest").querySelector(".ui-tcn__request")).toBeTruthy();
    block = false;
    doc(el, "pentest").querySelector<HTMLButtonElement>(".ui-tcn__request")!.focus();
    doc(el, "pentest").querySelector<HTMLButtonElement>(".ui-tcn__request")!.click();
    await settle();
    expect(doc(el, "pentest").querySelector(".ui-tcn__requested")!.textContent).toBe("Requested");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Access requested: Penetration test summary");
    await expect.poll(() => document.activeElement?.closest(".ui-tcn__doc")?.getAttribute("data-id")).toBe("overview");
    expect(el.querySelectorAll('.ui-tcn__docs [tabindex="0"]')).toHaveLength(1);
  });

  test("View fires tc-document-open with the safe href; prevented, the link isn't followed", async () => {
    const el = await make();
    const seen: TrustDocumentOpen[] = [];
    el.addEventListener("tc-document-open", (e) => {
      seen.push((e as CustomEvent<TrustDocumentOpen>).detail);
      e.preventDefault();
    });
    const before = location.hash;
    doc(el, "overview").querySelector<HTMLAnchorElement>(".ui-tcn__view")!.click();
    doc(el, "policies").querySelector<HTMLButtonElement>(".ui-tcn__view")!.click();
    await settle();
    expect(seen.map((s) => [s.id, s.href])).toEqual([
      ["overview", "#overview"],
      ["policies", undefined],
    ]);
    expect(location.hash).toBe(before);
  });

  test("an unsafe href isn't used", async () => {
    const el = await fixture<TcTrustCenter>(html`<tc-trust-center .documents=${[{ id: "x", title: "Bad", access: "public", href: "javascript:alert(1)" }]}></tc-trust-center>`);
    expect(doc(el, "x").querySelector("a")).toBeNull();
    expect(doc(el, "x").querySelector("button.ui-tcn__view")).toBeTruthy();
  });

  test("DPA: Review and sign fires tc-dpa-sign; a signed one says when and by whom", async () => {
    const el = await make();
    const seen: TrustDpaSign[] = [];
    el.addEventListener("tc-dpa-sign", (e) => seen.push((e as CustomEvent<TrustDpaSign>).detail));
    expect(el.querySelector(".ui-tcn__dpa .ui-tcn__pill")!.textContent!.trim()).toBe("Not signed");
    el.querySelector<HTMLButtonElement>(".ui-tcn__sign")!.click();
    expect(seen).toEqual([{ dpa: { status: "not-signed", version: "v3.1" } }]);
    el.dpa = { status: "signed", signedAt: Date.UTC(2026, 10, 12, 12), signedBy: "Priya Shah", href: "#dpa" };
    await settle();
    expect(el.querySelector(".ui-tcn__dpa .ui-tcn__pill")!.textContent!.trim()).toBe("Signed");
    expect(el.querySelector(".ui-tcn__dpa .ui-tcn__doc-desc")!.textContent!.replace(/\s+/g, " ").trim()).toMatch(/^Signed on .+ by Priya Shah$/);
    expect(el.querySelector(".ui-tcn__sign")).toBeNull();
    expect(el.querySelector<HTMLAnchorElement>(".ui-tcn__dpa-view")!.getAttribute("href")).toBe("#dpa");
  });

  test("questions: disclosures with aria-expanded; tc-open-change, and preventDefault keeps them as they were", async () => {
    const el = await make();
    const q = faqBtn(el, "train");
    const panel = document.getElementById(q.getAttribute("aria-controls")!)!;
    expect(q.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);
    const seen: TrustOpenChange[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent<TrustOpenChange>).detail));
    q.click();
    await settle();
    expect(seen).toEqual([{ open: ["train"], id: "train", expanded: true }]);
    expect(q.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    q.click();
    await settle();
    expect(el.open).toEqual(["train"]);
  });

  test("keyboard: arrows, Home and End move within documents' actions and within questions", async () => {
    const el = await make();
    const first = el.querySelector<HTMLElement>('[data-doc="overview"]')!;
    first.focus();
    key(first, "ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.doc).toBe("pentest");
    // Requested has no action: End lands on the last actionable one
    key(document.activeElement!, "End");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.doc).toBe("policies");
    key(document.activeElement!, "Home");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.doc).toBe("overview");
    faqBtn(el, "train").focus();
    key(faqBtn(el, "train"), "ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.faq).toBe("where");
    expect(faqBtn(el, "where").tabIndex).toBe(0);
    expect(faqBtn(el, "train").tabIndex).toBe(-1);
  });

  test("labels rename the words; empty sections are left out", async () => {
    const el = await fixture<TcTrustCenter>(html`<tc-trust-center .certifications=${CERTS} .labels=${{ certified: "Held", certifications: "Standards" }}></tc-trust-center>`);
    expect(el.querySelectorAll("section")).toHaveLength(1);
    expect(el.querySelector(".ui-tcn__section-title")!.textContent).toBe("Standards");
    expect(el.querySelector(".ui-tcn__pill")!.textContent!.trim()).toBe("Held");
  });

  test("narrow: documents keep their action under the text", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-trust-center .documents=${DOCS}></tc-trust-center></div>`);
    const el = wrap.querySelector("tc-trust-center")!;
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(321);
    const row = doc(el, "pentest").getBoundingClientRect();
    expect(doc(el, "pentest").querySelector(".ui-tcn__request")!.getBoundingClientRect().right).toBeLessThanOrEqual(row.right + 1);
  });

  test("React wrapper: uncontrolled questions survive re-renders; onRequest returning false keeps Request access", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(TrustCenter, {
        title: "Security",
        documents: DOCS,
        faqs: FAQS,
        onOpenChange: (open) => void seen.push(open),
        onRequest: (id) => (seen.push(id), false),
        "data-n": n,
      } as React.ComponentProps<typeof TrustCenter>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-trust-center")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Security");
    faqBtn(el, "where").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.open).toEqual(["where"]);
    doc(el, "pentest").querySelector<HTMLButtonElement>(".ui-tcn__request")!.click();
    await settle();
    expect(doc(el, "pentest").querySelector(".ui-tcn__request")).toBeTruthy();
    expect(seen).toEqual([["where"], "pentest"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled questions stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[][] = [];
    await act(async () => root.render(React.createElement(TrustCenter, { faqs: FAQS, open: [], onOpenChange: (o) => void asked.push(o) })));
    await settle();
    const el = host.querySelector("tc-trust-center")!;
    faqBtn(el, "train").click();
    await settle();
    expect(asked).toEqual([["train"]]);
    expect(el.open).toEqual([]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-trust-center .certifications=${CERTS} .documents=${DOCS} .dpa=${{ status: "not-signed" }} .faqs=${FAQS} .open=${["train"]} last-updated=${Date.UTC(2026, 10, 3)}></tc-trust-center>
        <tc-trust-center look="clean" .certifications=${CERTS} .documents=${DOCS} .dpa=${{ status: "signed", signedAt: Date.UTC(2026, 10, 1), href: "#dpa" }} .faqs=${FAQS}></tc-trust-center>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
