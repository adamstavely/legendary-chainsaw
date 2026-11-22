/*
 * <tc-failed> in real browsers – the shared document-status checks (doc-stage-kit): its words and name, decorative
 * with neither, pausing off screen, finite motion, dark colours, the React wrapper and axe.
 */
import { afterEach, describe } from "vitest";
import { TcFailed } from "../../src/elements/failed";
import { Failed } from "../../src/elements/react/failed";
import { docStageBasics } from "./doc-stage-kit";
import { cleanup } from "./helpers";

afterEach(cleanup);

describe("tc-failed", () => {
  docStageBasics({ tag: "tc-failed", ui: "fai", caption: "Failed", css: TcFailed.css, moving: "cross", tile: "page", react: Failed });
});
