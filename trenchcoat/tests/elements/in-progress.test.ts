/*
 * <tc-in-progress> in real browsers – the shared document-status checks (doc-stage-kit): its words and name, decorative
 * with neither, pausing off screen, finite motion, dark colours, the React wrapper and axe.
 */
import { afterEach, describe } from "vitest";
import { TcInProgress } from "../../src/elements/in-progress";
import { InProgress } from "../../src/elements/react/in-progress";
import { docStageBasics } from "./doc-stage-kit";
import { cleanup } from "./helpers";

afterEach(cleanup);

describe("tc-in-progress", () => {
  docStageBasics({ tag: "tc-in-progress", ui: "inp", caption: "In progress", css: TcInProgress.css, moving: "pulse", tile: "page", react: InProgress });
});
