/*
 * <tc-metadata-cleansing> in real browsers – the shared document-status checks (doc-stage-kit), then each status: its
 * colours, its corner mark, its words, and a caption of the page's own winning over them.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import { metadataCleansingWords, TcMetadataCleansing, type MetadataCleansingStatus } from "../../src/elements/metadata-cleansing";
import { MetadataCleansing } from "../../src/elements/react/metadata-cleansing";
import { docStageBasics } from "./doc-stage-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const STATUSES: MetadataCleansingStatus[] = ["required", "in-progress", "failed", "success"];

describe("tc-metadata-cleansing", () => {
  docStageBasics({ tag: "tc-metadata-cleansing", ui: "mcl", caption: "Metadata cleansing required", css: TcMetadataCleansing.css, moving: "speck", react: MetadataCleansing });

  test("each status has its own words, colour and mark; the tag stays", async () => {
    const el = await fixture<TcMetadataCleansing>(html`<tc-metadata-cleansing></tc-metadata-cleansing>`);
    const fills = new Set<string>();
    for (const status of STATUSES) {
      el.status = status;
      await settle();
      expect(el.getAttribute("status")).toBe(status);
      expect(el.querySelector(".ui-mcl-caption")!.textContent).toBe(metadataCleansingWords[status]);
      expect(el.getAttribute("aria-label")).toBe(metadataCleansingWords[status]);
      // The tag on the badge in every state
      expect(el.querySelector(".ui-mcl-mark path.ui-mcl-ink")).not.toBeNull();
      // A corner mark for every state but "required", which has its specks instead
      expect(el.querySelector(".ui-mcl-chip") !== null).toBe(status !== "required");
      expect(el.querySelector(".ui-mcl-speck") !== null).toBe(status === "required");
      expect(el.querySelector(".ui-mcl-tick") !== null).toBe(status === "success");
      expect(el.querySelector(".ui-mcl-cross") !== null).toBe(status === "failed");
      expect(el.querySelectorAll(".ui-mcl-pulse").length).toBe(status === "in-progress" ? 3 : 0);
      fills.add(getComputedStyle(el.querySelector(".ui-mcl-badge")!).fill);
    }
    // Four different badge colours
    expect(fills.size).toBe(4);
  });

  test("a caption of the page's own wins over the status's words, and \"\" makes it decorative", async () => {
    const el = await fixture<TcMetadataCleansing>(html`<tc-metadata-cleansing status="success" caption="Tags tidied"></tc-metadata-cleansing>`);
    expect(el.querySelector(".ui-mcl-caption")!.textContent).toBe("Tags tidied");
    el.status = "failed";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Tags tidied");
    el.caption = "";
    await settle();
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.caption = undefined;
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Metadata cleansing failed");
  });

  test("axe: no violations in every status, in both themes", async () => {
    for (const scheme of ["light", "dark"])
      for (const status of STATUSES) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-metadata-cleansing status=${status}></tc-metadata-cleansing></div>`);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => v.id)).toEqual([]);
      }
  });
});
