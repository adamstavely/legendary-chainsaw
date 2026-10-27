import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/index";
import { TermsDialog } from "../../src/elements/react";
import type { TcTermsDialog, TermsAcceptDetail, TermsConsent, TermsSection } from "../../src/elements/terms-dialog";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const long = (n: number) => Array.from({ length: n }, (_, i) => `Paragraph ${i + 1} of the section, long enough to wrap onto a second line in the dialog.`).join("\n\n");
const SECTIONS: TermsSection[] = [
  { id: "about", heading: "About these terms", body: "First paragraph.\n\nSecond paragraph.\n- One\n- Two" },
  { id: "account", heading: "Your account", body: long(8), changed: true },
  { id: "ending", heading: "Ending the agreement", body: long(8) },
];
const CONSENTS: TermsConsent[] = [
  { id: "terms", label: "I agree to the Terms", required: true },
  { id: "updates", label: "Send me product updates", description: "About once a month." },
];

const dlg = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-tdlg__dialog")!;
const doc = (el: Element) => el.querySelector<HTMLElement>(".ui-tdlg__doc")!;
const accept = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-tdlg__accept")!;
const box = (el: Element, id: string) => el.querySelector<HTMLInputElement>(`input[id$="-c-${id}"]`)!;
const tocLinks = (el: Element) => [...el.querySelectorAll<HTMLAnchorElement>(".ui-tdlg__toc-link")];
const why = (el: Element) => el.querySelector<HTMLElement>(".ui-tdlg__why")!;
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

async function opened(extra: Partial<TcTermsDialog> = {}) {
  const el = await fixture<TcTermsDialog>(html`<tc-terms-dialog heading="Terms of Service" version="4.0" effective-date="1 November 2026"></tc-terms-dialog>`);
  Object.assign(el, { sections: SECTIONS, consents: CONSENTS, ...extra });
  el.open = true;
  await settle();
  await frame();
  return el;
}

async function toEnd(el: TcTermsDialog) {
  const d = doc(el);
  d.scrollTop = d.scrollHeight;
  d.dispatchEvent(new Event("scroll"));
  await frame();
  await settle();
}

function check(el: TcTermsDialog, id: string) {
  const input = box(el, id);
  input.click();
  return settle();
}

describe("tc-terms-dialog", () => {
  test("host, both looks, and closed by default", async () => {
    const el = await fixture<TcTermsDialog>(html`<tc-terms-dialog></tc-terms-dialog>`);
    expect(el.dataset.ui).toBe("tdlg");
    expect(el.dataset.look).toBe("standard");
    expect(dlg(el).open).toBe(false);
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
  });

  test("opens as a modal named by its heading, with the version and date, and focus on the text", async () => {
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    const el = await opened();
    const d = dlg(el);
    expect(d.open).toBe(true);
    expect(d.matches(":modal")).toBe(true);
    const title = el.querySelector("h2.tc-head__title")!;
    expect(title.textContent).toBe("Terms of Service");
    expect(d.getAttribute("aria-labelledby")).toBe(title.id);
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Version 4.0 · Effective 1 November 2026");
    expect(document.activeElement).toBe(doc(el));
    expect(doc(el).getAttribute("role")).toBe("region");
    expect(doc(el).getAttribute("aria-label")).toBe("Terms of Service text");
    // The page behind doesn't scroll
    expect(document.documentElement.style.overflow).toBe("hidden");
    el.open = false;
    await settle();
    expect(d.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);
  });

  test("sections: numbered headings, text as paragraphs and lists, rich bodies, Updated marks", async () => {
    const node = document.createElement("p");
    node.innerHTML = 'See the <a href="/privacy">Privacy Policy</a>.';
    const el = await opened({
      sections: [...SECTIONS, { id: "rich", heading: "Rich", body: node }, { id: "tpl", heading: "Template", body: html`<ul><li>From a template</li></ul>` }],
    });
    const titles = [...el.querySelectorAll(".ui-tdlg__section-title")].map((h) => h.textContent!.replace(/\s+/g, " ").trim());
    expect(titles).toEqual(["1. About these terms", "2. Your account Updated", "3. Ending the agreement", "4. Rich", "5. Template"]);
    const first = el.querySelector('.ui-tdlg__section-body[data-section="about"]')!;
    expect([...first.querySelectorAll("p")].map((p) => p.textContent)).toEqual(["First paragraph.", "Second paragraph."]);
    expect([...first.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["One", "Two"]);
    expect(el.querySelector('.ui-tdlg__section-body[data-section="rich"] a')!.getAttribute("href")).toBe("/privacy");
    expect(el.querySelector('.ui-tdlg__section-body[data-section="tpl"] li')!.textContent).toBe("From a template");
    // The jump list names every section and says which changed
    expect(tocLinks(el).map((a) => a.textContent!.replace(/\s+/g, " ").trim())).toEqual([
      "1 About these terms",
      "2 Your account (updated)",
      "3 Ending the agreement",
      "4 Rich",
      "5 Template",
    ]);
    expect(el.querySelector("nav.ui-tdlg__toc")!.getAttribute("aria-label")).toBe("Contents");
    expect(tocLinks(el)[0].getAttribute("aria-current")).toBe("location");
  });

  test("the jump list moves to a section and focuses its heading; the current entry follows the reading", async () => {
    const el = await opened();
    tocLinks(el)[2].click();
    await settle();
    const heading = el.querySelector<HTMLElement>(`[id$="-s-ending"]`)!;
    expect(document.activeElement).toBe(heading);
    await toEnd(el);
    expect(tocLinks(el)[2].getAttribute("aria-current")).toBe("location");
    expect(tocLinks(el).filter((a) => a.hasAttribute("aria-current")).length).toBe(1);
  });

  test("re-acceptance: what changed since the last agreement comes first, linked to its sections", async () => {
    const el = await opened({
      previousVersion: "3.2",
      previousDate: "12 March 2026",
      changes: ["Plain change.", { text: "Accounts close after 2 years idle.", section: "account" }],
    });
    const block = el.querySelector(".ui-tdlg__changes")!;
    expect(block.querySelector("h3")!.textContent).toBe("What's changed");
    expect(block.querySelector(".ui-tdlg__since")!.textContent).toBe("Since you agreed to version 3.2 on 12 March 2026");
    expect([...block.querySelectorAll(".ui-tdlg__change-text")].map((c) => c.textContent)).toEqual(["Plain change.", "Accounts close after 2 years idle."]);
    expect(el.querySelector(".ui-tdlg__pill")!.textContent).toBe("Updated");
    // The block is the first entry of the jump list and of the text
    expect(tocLinks(el)[0].textContent).toContain("What's changed");
    expect(el.querySelector(".ui-tdlg__flow")!.firstElementChild).toBe(block);
    const link = block.querySelector<HTMLAnchorElement>(".ui-tdlg__change-link")!;
    expect(link.textContent!.replace(/\s+/g, " ").trim()).toBe("Read section 2. Your account");
    link.click();
    await settle();
    expect(document.activeElement).toBe(el.querySelector(`[id$="-s-account"]`));
  });

  test("content instead of sections: its headings make the jump list, and it follows changes", async () => {
    const content = document.createElement("div");
    content.innerHTML = "<h2>Scope</h2><p>Text.</p><h2>Data</h2><p>More.</p>";
    const el = await opened({ sections: [], content });
    expect(tocLinks(el).map((a) => a.textContent!.trim())).toEqual(["•Scope", "•Data"]);
    const h = content.querySelector("h2")!;
    expect(h.id).not.toBe("");
    expect(tocLinks(el)[0].getAttribute("href")).toBe(`#${h.id}`);
    content.insertAdjacentHTML("beforeend", "<h2>Contact</h2><p>Write to us.</p>");
    await new Promise((r) => setTimeout(r, 0));
    await settle();
    expect(tocLinks(el).map((a) => a.textContent!.trim())).toEqual(["•Scope", "•Data", "•Contact"]);
  });

  test("Accept waits for the required consent, says why, and pressing it takes focus to what's missing", async () => {
    const el = await opened();
    let accepted = 0;
    el.addEventListener("tc-accept", () => accepted++);
    const a = accept(el);
    expect(a.getAttribute("aria-disabled")).toBe("true");
    expect(a.disabled).toBe(false);
    expect(a.getAttribute("aria-describedby")).toBe(why(el).id);
    expect(why(el).textContent!.trim()).toBe("Check “I agree to the Terms” to accept.");
    expect(box(el, "terms").required).toBe(true);
    expect(box(el, "updates").required).toBe(false);
    a.click();
    await settle();
    expect(accepted).toBe(0);
    expect(document.activeElement).toBe(box(el, "terms"));
    expect(why(el).hasAttribute("data-nudged")).toBe(true);
    expect(box(el, "terms").getAttribute("aria-invalid")).toBe("true");
    expect(el.querySelector(".ui-tdlg__sr[role=status]")!.textContent).toBe("Check “I agree to the Terms” to accept.");
    await check(el, "terms");
    expect(a.hasAttribute("aria-disabled")).toBe(false);
    expect(a.hasAttribute("aria-describedby")).toBe(false);
    expect(why(el).hidden).toBe(true);
    expect(el.querySelector(".ui-tdlg__sr[role=status]")!.textContent).toBe("You can accept now.");
    // An optional consent never holds Accept
    expect(el.consents.filter((c) => !c.required).every((c) => !el.checked[c.id])).toBe(true);
  });

  test("two required consents are counted; a custom reason replaces the sentence", async () => {
    const el = await opened({ consents: [...CONSENTS, { id: "privacy", label: "I agree to the Privacy Policy", required: true }] });
    expect(why(el).textContent!.trim()).toBe("Check the 2 required boxes to accept.");
    el.describeBlocked = ({ missing }) => `Noch ${missing.length} offen.`;
    await settle();
    expect(why(el).textContent!.trim()).toBe("Noch 2 offen.");
  });

  test("require-scroll: Accept also waits until the text has been read to the end", async () => {
    const el = await opened({ requireScroll: true });
    await check(el, "terms");
    expect(accept(el).getAttribute("aria-disabled")).toBe("true");
    expect(why(el).textContent!.trim()).toBe("Read to the end to accept.");
    accept(el).click();
    await settle();
    expect(document.activeElement).toBe(doc(el));
    await toEnd(el);
    expect(accept(el).hasAttribute("aria-disabled")).toBe(false);
    expect(el.querySelector<HTMLElement>(".ui-tdlg__progress-fill")!.style.transform).toBe("scaleX(1)");
  });

  test("require-scroll: text that fits without scrolling counts as read", async () => {
    const el = await opened({ requireScroll: true, sections: [{ id: "a", heading: "Short", body: "One line." }], consents: [] });
    await frame();
    await settle();
    expect(accept(el).hasAttribute("aria-disabled")).toBe(false);
  });

  test("tc-accept carries the version and every consent; unprevented, the dialog closes", async () => {
    const el = await opened();
    const log: unknown[] = [];
    el.addEventListener("tc-accept", (e) => log.push((e as CustomEvent<TermsAcceptDetail>).detail));
    el.addEventListener("tc-open-change", (e) => log.push((e as CustomEvent).detail));
    await check(el, "terms");
    accept(el).click();
    await settle();
    expect(log).toEqual([{ version: "4.0", consents: { terms: true, updates: false } }, { open: false }]);
    expect(el.open).toBe(false);
    expect(dlg(el).open).toBe(false);
  });

  test("tc-accept prevented: the dialog stays open", async () => {
    const el = await opened();
    el.addEventListener("tc-accept", (e) => e.preventDefault());
    await check(el, "terms");
    accept(el).click();
    await settle();
    expect(el.open).toBe(true);
    expect(dlg(el).open).toBe(true);
  });

  test("the app sets pending while it records: Accept shows Saving…, nothing else closes it, then error and retry", async () => {
    const el = await opened();
    let calls = 0;
    el.addEventListener("tc-accept", () => {
      calls++;
      el.pending = true;
    });
    await check(el, "terms");
    accept(el).click();
    await settle();
    expect(el.open).toBe(true);
    expect(accept(el).textContent!.trim()).toBe("Saving…");
    expect(accept(el).getAttribute("aria-disabled")).toBe("true");
    expect(dlg(el).getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-tdlg__decline")!.getAttribute("aria-disabled")).toBe("true");
    expect(box(el, "terms").disabled).toBe(true);
    accept(el).focus();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.open).toBe(true);
    el.pending = false;
    el.error = "We couldn't reach the server.";
    await settle();
    const alert = el.querySelector(".ui-tdlg__error")!;
    expect(alert.getAttribute("role")).toBe("alert");
    expect(alert.textContent).toContain("We couldn't reach the server.");
    expect(document.activeElement).toBe(el.querySelector(".ui-tdlg__retry"));
    (el.querySelector(".ui-tdlg__retry") as HTMLButtonElement).click();
    await settle();
    expect(calls).toBe(2);
  });

  test("recordAcceptance: Saving…, a failure keeps the choices and offers Try again, success closes", async () => {
    const el = await opened();
    const seen: TermsAcceptDetail[] = [];
    let fail = true;
    let release!: () => void;
    el.recordAcceptance = (detail, signal) => {
      seen.push(detail);
      expect(signal).toBeInstanceOf(AbortSignal);
      return new Promise<void>((resolve, reject) => (release = () => (fail ? reject(new Error("offline")) : resolve())));
    };
    await check(el, "terms");
    await check(el, "updates");
    accept(el).click();
    await settle();
    expect(accept(el).textContent!.trim()).toBe("Saving…");
    release();
    await settle();
    await settle();
    expect(el.open).toBe(true);
    expect(el.querySelector(".ui-tdlg__error")!.textContent).toContain("Couldn't record your acceptance. Your choices are kept.");
    expect(box(el, "terms").checked).toBe(true);
    expect(box(el, "updates").checked).toBe(true);
    fail = false;
    (el.querySelector(".ui-tdlg__retry") as HTMLButtonElement).click();
    await settle();
    expect(el.querySelector(".ui-tdlg__error")).toBe(null);
    release();
    await settle();
    await settle();
    expect(el.open).toBe(false);
    expect(seen).toEqual([
      { version: "4.0", consents: { terms: true, updates: true } },
      { version: "4.0", consents: { terms: true, updates: true } },
    ]);
  });

  test("Decline fires tc-decline and closes; prevented it stays; it can be hidden or relabelled", async () => {
    const el = await opened({ declineLabel: "Decline" });
    const decline = () => el.querySelector<HTMLButtonElement>(".ui-tdlg__decline");
    expect(decline()!.textContent!.trim()).toBe("Decline");
    let block = true;
    const got: unknown[] = [];
    el.addEventListener("tc-decline", (e) => {
      got.push((e as CustomEvent).detail);
      if (block) e.preventDefault();
    });
    decline()!.click();
    await settle();
    expect(el.open).toBe(true);
    block = false;
    decline()!.click();
    await settle();
    expect(got).toEqual([{ version: "4.0" }, { version: "4.0" }]);
    expect(el.open).toBe(false);
    el.canDecline = false;
    await settle();
    expect(decline()).toBe(null);
  });

  test("consent changes are cancelable for a controlled host", async () => {
    const el = await opened();
    const seen: unknown[] = [];
    el.addEventListener("tc-consent-change", (e) => {
      seen.push((e as CustomEvent).detail);
      e.preventDefault();
    });
    await check(el, "updates");
    expect(seen).toEqual([{ id: "updates", checked: true, consents: { terms: false, updates: true } }]);
    expect(box(el, "updates").checked).toBe(false);
    expect(el.checked).toEqual({});
    el.checked = { updates: true };
    await settle();
    expect(box(el, "updates").checked).toBe(true);
  });

  test("keyboard: Escape and the close button ask to close; prevented, it stays", async () => {
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    const el = await opened();
    let veto = true;
    let asked = 0;
    el.addEventListener("tc-open-change", (e) => {
      asked++;
      if (veto) e.preventDefault();
    });
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(asked).toBe(1);
    expect(el.open).toBe(true);
    expect(dlg(el).open).toBe(true);
    veto = false;
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(opener);
    el.open = true;
    await settle();
    (el.querySelector(".ui-tdlg__close") as HTMLButtonElement).click();
    await settle();
    expect(el.open).toBe(false);
  });

  test("keyboard: Tab moves from the text to the consents and the actions; Shift+Tab back to the jump list; the page stays inert", async () => {
    const outside = document.body.appendChild(document.createElement("button"));
    const el = await opened();
    expect(document.activeElement).toBe(doc(el));
    const webkit = /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    // WebKit on macOS skips buttons and checkboxes with Tab by default; the order is checked where the browser tabs to them
    if (!webkit) {
      const order: Element[] = [];
      for (let i = 0; i < 4; i++) {
        await userEvent.keyboard("{Tab}");
        order.push(document.activeElement!);
      }
      expect(order).toEqual([box(el, "terms"), box(el, "updates"), el.querySelector(".ui-tdlg__decline"), accept(el)]);
      doc(el).focus();
      await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
      // Narrow, the Contents button; wide, the last entry of the jump list (Firefox on macOS skips links by default)
      const toggle = el.querySelector<HTMLElement>(".ui-tdlg__toc-toggle")!;
      if (getComputedStyle(toggle).display !== "none") expect(document.activeElement).toBe(toggle);
      else if (/Chrome/.test(navigator.userAgent)) expect(document.activeElement).toBe(tocLinks(el).at(-1));
    }
    for (let i = 0; i < 12; i++) {
      await userEvent.keyboard("{Tab}");
      expect(document.activeElement).not.toBe(outside);
    }
  });

  test("blocking: no close button and Escape doesn't close", async () => {
    const el = await opened({ blocking: true, canDecline: false });
    expect(el.querySelector(".ui-tdlg__close")).toBe(null);
    expect(el.querySelector(".ui-tdlg__decline")).toBe(null);
    let asked = 0;
    el.addEventListener("tc-open-change", () => asked++);
    await userEvent.keyboard("{Escape}");
    await settle();
    dlg(el).dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(asked).toBe(0);
    expect(el.open).toBe(true);
    expect(dlg(el).open).toBe(true);
  });

  test("blocking: if the browser closes the dialog anyway, it opens again", async () => {
    const el = await opened({ blocking: true });
    dlg(el).close();
    await frame();
    await settle();
    expect(el.open).toBe(true);
    expect(dlg(el).open).toBe(true);
  });

  test("print and download fire events with the version", async () => {
    const el = await opened({ printable: true, downloadable: true });
    const got: string[] = [];
    el.addEventListener("tc-print", (e) => got.push(`print ${(e as CustomEvent).detail.version}`));
    el.addEventListener("tc-download", (e) => got.push(`download ${(e as CustomEvent).detail.version}`));
    const print = el.querySelector<HTMLButtonElement>(".ui-tdlg__print")!;
    expect(print.getAttribute("aria-label")).toBe("Print");
    print.click();
    el.querySelector<HTMLButtonElement>(".ui-tdlg__download")!.click();
    expect(got).toEqual(["print 4.0", "download 4.0"]);
  });

  test("narrow: the jump list folds into a Contents button; Escape closes the list, not the dialog", async () => {
    const el = await opened();
    dlg(el).style.width = "360px";
    await frame();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-tdlg__toc-toggle")!;
    const list = el.querySelector<HTMLElement>(".ui-tdlg__toc-list")!;
    expect(getComputedStyle(toggle).display).not.toBe("none");
    expect(getComputedStyle(list).display).toBe("none");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe(list.id);
    expect(toggle.textContent!.replace(/\s+/g, " ").trim()).toBe("Contents 1 About these terms");
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(getComputedStyle(list).display).not.toBe("none");
    tocLinks(el)[0].focus();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
    expect(el.open).toBe(true);
    // Picking an entry closes the list too
    toggle.click();
    await settle();
    tocLinks(el)[1].click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  test("a fresh reading each time it opens", async () => {
    const el = await opened({ requireScroll: true });
    await toEnd(el);
    await check(el, "terms");
    expect(accept(el).hasAttribute("aria-disabled")).toBe(false);
    el.open = false;
    await settle();
    el.open = true;
    await settle();
    await frame();
    expect(doc(el).scrollTop).toBe(0);
    expect(why(el).textContent!.trim()).toBe("Read to the end to accept.");
  });

  test("leaving the page closes the modal and releases the scroll lock", async () => {
    const el = await opened();
    expect(document.documentElement.style.overflow).toBe("hidden");
    el.remove();
    expect(document.documentElement.style.overflow).toBe("");
  });

  test("React: section bodies and children render as React content; open, checked and onAccept", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const log: string[] = [];
    function Demo() {
      const [open, setOpen] = React.useState(true);
      const [n, setN] = React.useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement("button", { id: "bump", onClick: () => setN((x) => x + 1) }, `bump ${n}`),
        React.createElement(TermsDialog, {
          open,
          onOpenChange: setOpen,
          heading: "Terms",
          version: "2.0",
          sections: [
            { id: "a", heading: "Plain", body: "Text body." },
            { id: "b", heading: "Rich", body: React.createElement("p", null, "See ", React.createElement("a", { href: "/p" }, `link ${n}`)) },
          ],
          consents: [{ id: "ok", label: "I agree", required: true }],
          defaultChecked: {},
          onAccept: (d: TermsAcceptDetail) => log.push(JSON.stringify(d)),
        }),
      );
    }
    flushSync(() => root.render(React.createElement(Demo)));
    await settle();
    await settle();
    const el = host.querySelector<TcTermsDialog>("tc-terms-dialog")!;
    expect(dlg(el).open).toBe(true);
    expect(el.querySelector('.ui-tdlg__section-body[data-section="b"] a')!.textContent).toBe("link 0");
    expect(el.querySelector('.ui-tdlg__section-body[data-section="a"] p')!.textContent).toBe("Text body.");
    box(el, "ok").click();
    await settle();
    // A parent re-render keeps the uncontrolled consent and updates the React body
    flushSync(() => (host.querySelector("#bump") as HTMLButtonElement).click());
    await settle();
    expect(el.querySelector('.ui-tdlg__section-body[data-section="b"] a')!.textContent).toBe("link 1");
    expect(box(el, "ok").checked).toBe(true);
    accept(el).click();
    await settle();
    await settle();
    expect(log).toEqual(['{"version":"2.0","consents":{"ok":true}}']);
    expect(el.open).toBe(false);
    root.unmount();
  });

  test("React: children as the text – their headings make the jump list", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    flushSync(() =>
      root.render(
        React.createElement(
          TermsDialog,
          { defaultOpen: true, heading: "Privacy Policy" },
          React.createElement("h2", null, "What we collect"),
          React.createElement("p", null, "Very little."),
          React.createElement("h2", null, "Your rights"),
          React.createElement("p", null, "Many."),
        ),
      ),
    );
    await settle();
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    await settle();
    const el = host.querySelector<TcTermsDialog>("tc-terms-dialog")!;
    expect(el.querySelector(".ui-tdlg__content h2")!.textContent).toBe("What we collect");
    expect(tocLinks(el).map((a) => a.textContent!.replace("•", "").trim())).toEqual(["What we collect", "Your rights"]);
    root.unmount();
  });

  for (const scheme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: re-acceptance with consents, a held Accept and an error (${look}, ${scheme})`, async () => {
        const wrap = await fixture(html`<div style=${`color-scheme: ${scheme}`}>
          <tc-terms-dialog look=${look} heading="AI acceptable use policy" version="3.0" effective-date="1 December 2026"
            previous-version="2.1" previous-date="12 March 2026" printable downloadable require-scroll
            error="We couldn't reach the server."></tc-terms-dialog>
        </div>`);
        const el = wrap.querySelector<TcTermsDialog>("tc-terms-dialog")!;
        el.changes = [{ text: "Bulk messages need review.", section: "account" }];
        el.sections = SECTIONS;
        el.consents = CONSENTS;
        el.open = true;
        await settle();
        for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
        await frame();
        const result = await axe.run(dlg(el), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.failureSummary).join("; ")}`)).toEqual([]);
      });
});
