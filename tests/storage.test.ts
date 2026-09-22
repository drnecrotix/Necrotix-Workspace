import assert from "node:assert/strict";
import test from "node:test";
import { isPublicAddress, safeFileName } from "../lib/storage.ts";

test("normalizes uploaded file names", () => {
  assert.equal(safeFileName("../client\\brief?.pdf"), "brief-.pdf");
  assert.equal(safeFileName("  project   brief.docx  "), "project brief.docx");
});

test("rejects private and special network destinations", () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.1.2", "::1", "fd00::1", "::ffff:127.0.0.1"]) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("1.1.1.1"), true); assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});
