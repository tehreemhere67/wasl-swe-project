/**
 * Unit tests for src/lib/csrf.ts
 *
 * SRS reference:
 *   NFR-SEC-04 - the system shall resist cross-site request forgery; every
 *                state-changing API route calls isSameOrigin().
 *
 * Run directly:  node tests/csrf.test.ts
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { isSameOrigin } from "../src/lib/csrf.ts";

/** isSameOrigin only reads headers, so a minimal stand-in is enough. */
function request(headers: Record<string, string>): Request {
  return { headers: new Headers(headers) } as unknown as Request;
}

describe("isSameOrigin", () => {
  test("allows a same-origin request (Origin host equals Host)", () => {
    assert.equal(isSameOrigin(request({ origin: "http://localhost:3000", host: "localhost:3000" })), true);
    assert.equal(
      isSameOrigin(request({ origin: "https://wasl.pk", host: "wasl.pk" })),
      true,
    );
  });

  test("allows a proxied request using x-forwarded-host", () => {
    assert.equal(
      isSameOrigin(request({ origin: "https://wasl.pk", "x-forwarded-host": "wasl.pk" })),
      true,
    );
  });

  test("rejects a request from another origin", () => {
    assert.equal(
      isSameOrigin(request({ origin: "https://evil.example", host: "wasl.pk" })),
      false,
    );
  });

  test("rejects a request whose Origin does not match the forwarded host", () => {
    assert.equal(
      isSameOrigin(request({ origin: "https://evil.example", "x-forwarded-host": "wasl.pk" })),
      false,
    );
  });

  test("rejects an unparseable Origin value", () => {
    assert.equal(isSameOrigin(request({ origin: "not a url", host: "wasl.pk" })), false);
  });

  test("rejects a request with an Origin but no host to compare against", () => {
    assert.equal(isSameOrigin(request({ origin: "https://wasl.pk" })), false);
  });

  test("allows a request with no Origin header (same-site cookie is the primary defence)", () => {
    assert.equal(isSameOrigin(request({ host: "wasl.pk" })), true);
  });

  test("the host comparison is case-insensitive, as HTTP hosts are", () => {
    assert.equal(
      isSameOrigin(request({ origin: "https://WASL.pk", host: "wasl.pk" })),
      true,
    );
  });
});
