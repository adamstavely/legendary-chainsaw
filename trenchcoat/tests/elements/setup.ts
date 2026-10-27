// The elements read every value from the token dictionary, as an app's page would
import "../../tokens/tokens.css";
import { beforeAll } from "vitest";
import { parkPointer } from "./helpers";

// The real pointer outlives a test file; start each file with it out of the way, so no element mounts under it
beforeAll(parkPointer);
