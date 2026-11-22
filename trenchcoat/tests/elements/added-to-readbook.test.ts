/*
 * <tc-added-to-readbook> in real browsers – the shared document-status checks (doc-stage-kit): its words and name, decorative
 * with neither, pausing off screen, finite motion, dark colours, the React wrapper and axe.
 */
import { afterEach, describe } from "vitest";
import { TcAddedToReadbook } from "../../src/elements/added-to-readbook";
import { AddedToReadbook } from "../../src/elements/react/added-to-readbook";
import { docStageBasics } from "./doc-stage-kit";
import { cleanup } from "./helpers";

afterEach(cleanup);

describe("tc-added-to-readbook", () => {
  docStageBasics({ tag: "tc-added-to-readbook", ui: "rdb", caption: "Added to Readbook", css: TcAddedToReadbook.css, moving: "tick", tile: "book", react: AddedToReadbook });
});
