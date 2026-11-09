/**
 * Unit tests for src/lib/auth/password.ts
 *
 * SRS references:
 *   NFR-SEC-01 - passwords shall never be stored or shown in readable form
 *   NFR-SEC-04 - inputs are checked before use
 *
 * The stored value is self-describing:
 *   scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>
 *
 * Run directly:  node tests/password.test.ts
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { hashPassword, randomToken, verifyPassword } from "../src/lib/auth/password.ts";

const PASSWORD = "Wasl-Test-Password-1";

describe("hashPassword", () => {
  test("never returns the password itself (NFR-SEC-01)", async () => {
    const hash = await hashPassword(PASSWORD);
    assert.notEqual(hash, PASSWORD);
    assert.equal(hash.includes(PASSWORD), false);
    assert.equal(hash.toLowerCase().includes("wasl"), false);
  });

  test("stores a scrypt record with its own parameters", async () => {
    const parts = (await hashPassword(PASSWORD)).split("$");
    assert.equal(parts.length, 6);
    assert.equal(parts[0], "scrypt");
    // The cost parameters are stored so they can be raised later without
    // invalidating existing hashes.
    assert.equal(parts[1], "16384");
    assert.equal(parts[2], "8");
    assert.equal(parts[3], "1");
    assert.ok(parts[4].length >= 16, "a salt is present");
    assert.ok(parts[5].length >= 64, "a hash is present");
  });

  test("uses a different salt (and therefore a different hash) every time", async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);
    assert.notEqual(first, second);
    assert.notEqual(first.split("$")[4], second.split("$")[4]);
  });
});

describe("verifyPassword", () => {
  test("accepts the correct password", async () => {
    const hash = await hashPassword(PASSWORD);
    assert.equal(await verifyPassword(PASSWORD, hash), true);
  });

  test("rejects a wrong password", async () => {
    const hash = await hashPassword(PASSWORD);
    assert.equal(await verifyPassword(`${PASSWORD}x`, hash), false);
    assert.equal(await verifyPassword(PASSWORD.toUpperCase(), hash), false);
    assert.equal(await verifyPassword("", hash), false);
  });

  test("rejects a hash that has been tampered with", async () => {
    const hash = await hashPassword(PASSWORD);
    const parts = hash.split("$");
    const bytes = Buffer.from(parts[5], "base64");
    bytes[0] = bytes[0] ^ 0xff;
    parts[5] = bytes.toString("base64");
    assert.equal(await verifyPassword(PASSWORD, parts.join("$")), false);
  });

  test("rejects a malformed stored value instead of throwing", async () => {
    const malformed = [
      "",
      "plaintext",
      "scrypt$16384$8$1$only-five-parts",
      "scrypt$16384$8$1$c2FsdA==$dG9vLXNob3J0", // decoded hash is not 64 bytes
      "md5$16384$8$1$c2FsdA==$aGFzaA==", // unknown algorithm
      "scrypt$abc$8$1$c2FsdA==$aGFzaA==", // non-numeric parameter
      "$$$$$",
    ];
    for (const stored of malformed) {
      assert.equal(await verifyPassword(PASSWORD, stored), false, stored);
    }
  });

  test("rejects null and undefined stored values", async () => {
    assert.equal(await verifyPassword(PASSWORD, null), false);
    assert.equal(await verifyPassword(PASSWORD, undefined), false);
  });

  test("two hashes of the same password both verify", async () => {
    const a = await hashPassword(PASSWORD);
    const b = await hashPassword(PASSWORD);
    assert.equal(await verifyPassword(PASSWORD, a), true);
    assert.equal(await verifyPassword(PASSWORD, b), true);
  });

  test("a hash does not verify against a different password", async () => {
    const hash = await hashPassword("first-password");
    assert.equal(await verifyPassword("second-password", hash), false);
  });
});

describe("randomToken", () => {
  test("returns a URL-safe token of the requested size", () => {
    const token = randomToken();
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    // 32 random bytes encode to 43 base64url characters.
    assert.equal(token.length, 43);
  });

  test("tokens are unique", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => randomToken()));
    assert.equal(tokens.size, 20);
  });

  test("honours a custom byte length", () => {
    assert.equal(randomToken(16).length, 22);
  });
});
