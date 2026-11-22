/*
 * <tc-metadata-cleansing-required> in real browsers – the shared document-status checks (doc-stage-kit): its words and name, decorative
 * with neither, pausing off screen, finite motion, dark colours, the React wrapper and axe.
 */
import { afterEach, describe } from "vitest";
import { TcMetadataCleansingRequired } from "../../src/elements/metadata-cleansing-required";
import { MetadataCleansingRequired } from "../../src/elements/react/metadata-cleansing-required";
import { docStageBasics } from "./doc-stage-kit";
import { cleanup } from "./helpers";

afterEach(cleanup);

describe("tc-metadata-cleansing-required", () => {
  docStageBasics({ tag: "tc-metadata-cleansing-required", ui: "mcr", caption: "Metadata cleansing required", css: TcMetadataCleansingRequired.css, moving: "speck", tile: "page", react: MetadataCleansingRequired });
});
