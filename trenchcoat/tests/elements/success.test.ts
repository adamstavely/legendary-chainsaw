/*
 * <tc-success> in real browsers – the shared document-status checks (doc-stage-kit): its words and name, decorative
 * with neither, pausing off screen, finite motion, dark colours, the React wrapper and axe.
 */
import { afterEach, describe } from "vitest";
import { TcSuccess } from "../../src/elements/success";
import { Success } from "../../src/elements/react/success";
import { docStageBasics } from "./doc-stage-kit";
import { cleanup } from "./helpers";

afterEach(cleanup);

describe("tc-success", () => {
  docStageBasics({ tag: "tc-success", ui: "scs", caption: "Success", css: TcSuccess.css, moving: "tick", tile: "page", react: Success });
});
