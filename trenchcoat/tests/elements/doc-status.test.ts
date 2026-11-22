/*
 * <tc-doc-status> in real browsers – the shared document-status checks (doc-stage-kit), then every status: its words
 * and name, its tile, its drawing, a badge colour of its own per colour group, a caption of the page's own winning
 * over the status's words, and axe for every status in both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import { DOC_STATUSES, docStatusWords, TcDocStatus, type DocStatus } from "../../src/elements/doc-status";
import { DocStatus as DocStatusReact } from "../../src/elements/react/doc-status";
import { docStageBasics } from "./doc-stage-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const STATUSES = Object.keys(DOC_STATUSES) as DocStatus[];

describe("tc-doc-status", () => {
  docStageBasics({ tag: "tc-doc-status", ui: "dst", caption: "In progress", css: TcDocStatus.css, moving: "pulse", react: DocStatusReact });

  test("every status: its words and name, its tile and its drawing", async () => {
    const el = await fixture<TcDocStatus>(html`<tc-doc-status></tc-doc-status>`);
    expect(STATUSES).toHaveLength(44);
    for (const status of STATUSES) {
      el.status = status;
      await settle();
      expect(el.getAttribute("status")).toBe(status);
      expect(el.querySelector(".ui-dst-caption")!.textContent).toBe(docStatusWords[status]);
      expect(el.getAttribute("aria-label")).toBe(docStatusWords[status]);
      // A book only for the reading list
      expect(el.querySelector(".ui-dst-ribbon") !== null).toBe(status === "added-to-readbook");
      // A badge, except Malware Blocked's shield in front of the file
      expect(el.querySelector(".ui-dst-badge") !== null).toBe(status !== "malware-blocked");
      expect(el.querySelector(".ui-dst-ghost") !== null).toBe(status === "preview-unavailable");
      // Redacted's bars sit on the page itself
      expect(el.querySelectorAll(".ui-dst-bar").length).toBe(status === "redacted" ? 3 : 0);
      // Drawn on the page: a password field, a scan bracket
      expect(el.querySelector(".ui-dst-field") !== null).toBe(status === "password-protected");
      expect(el.querySelector(".ui-dst-bracket") !== null).toBe(status === "converting");
      expect(el.querySelector(".ui-dst-shield") !== null).toBe(status === "malware-blocked");
      // Something drawn in ink on it
      expect(el.querySelectorAll(".ui-dst-art :is(.ui-dst-ink, .ui-dst-dot, .ui-dst-bug, .ui-dst-chip-ink)").length).toBeGreaterThan(0);
    }
  });

  test("each colour group has its own badge colour", async () => {
    const el = await fixture<TcDocStatus>(html`<tc-doc-status></tc-doc-status>`);
    const fill = async (s: DocStatus) => {
      el.status = s;
      await settle();
      return getComputedStyle(el.querySelector(".ui-dst-badge")!).fill;
    };
    const groups: DocStatus[] = ["released", "pending-release", "awaiting-review", "in-translation", "in-quality-control", "in-coordination", "processing", "in-progress", "failed", "uploading", "downloading", "metadata-cleansing-required", "working-offline", "preview-unavailable"];
    const fills = new Set<string>();
    for (const s of groups) fills.add(await fill(s));
    expect(fills.size).toBe(groups.length);
    // Statuses that share a meaning share a colour
    expect(await fill("success")).toBe(await fill("released"));
    expect(await fill("metadata-cleansing-failed")).toBe(await fill("failed"));
    expect(await fill("malware-scan")).toBe(await fill("processing"));
    // The new statuses reuse the family's colours
    expect(await fill("draft")).toBe(await fill("working-offline"));
    expect(await fill("expired")).toBe(await fill("metadata-cleansing-required"));
    expect(await fill("awaiting-signature")).toBe(await fill("awaiting-review"));
    expect(await fill("signed")).toBe(await fill("released"));
    expect(await fill("restricted")).toBe(await fill("failed"));
    expect(await fill("scheduled")).toBe(await fill("in-progress"));
    expect(await fill("shared")).toBe(await fill("in-progress"));
    expect(await fill("encrypted")).toBe(await fill("working-offline"));
    expect(await fill("password-protected")).toBe(await fill("locked"));
    expect(await fill("converting")).toBe(await fill("processing"));
    expect(await fill("comment-needed")).toBe(await fill("awaiting-review"));
    expect(await fill("approved")).toBe(await fill("released"));
    expect(await fill("changes-requested")).toBe(await fill("locked"));
    expect(await fill("partially-processed")).toBe(await fill("locked"));
    expect(await fill("legal-hold")).toBe(await fill("awaiting-review"));
  });

  test("an unknown status draws the default; a caption of the page's own wins, and \"\" makes it decorative", async () => {
    const el = await fixture<TcDocStatus>(html`<tc-doc-status status="nope" caption="Tags tidied"></tc-doc-status>`);
    expect(el.querySelector(".ui-dst-caption")!.textContent).toBe("Tags tidied");
    el.caption = undefined;
    await settle();
    expect(el.getAttribute("aria-label")).toBe("In progress");
    el.status = "working-offline";
    el.caption = "";
    await settle();
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("axe: no violations in every status, in both themes", async () => {
    for (const scheme of ["light", "dark"])
      for (const status of STATUSES) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-doc-status status=${status}></tc-doc-status></div>`);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${status}: ${v.id}`)).toEqual([]);
      }
  });
});
