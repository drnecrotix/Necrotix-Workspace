import assert from "node:assert/strict";
import test from "node:test";
import { isNewerVersion } from "../lib/update.ts";

test("compares semantic release versions", () => {
  assert.equal(isNewerVersion("0.2.1", "0.2.0"), true);
  assert.equal(isNewerVersion("0.2.0", "0.2.0"), false);
  assert.equal(isNewerVersion("0.1.9", "0.2.0"), false);
  assert.equal(isNewerVersion("1.0.0", "0.9.9"), true);
});
