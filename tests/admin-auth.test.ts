import assert from "node:assert/strict";
import test from "node:test";
import { adminCookie, verifyAdminCookie } from "../lib/admin-auth.ts";

const secret = "a-secure-admin-key-that-is-long-enough";
test("validates only the matching signed admin cookie",()=>{
  assert.equal(verifyAdminCookie(adminCookie(secret),secret),true);
  assert.equal(verifyAdminCookie(`${adminCookie(secret)}x`,secret),false);
});
