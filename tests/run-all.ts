/**
 * Runs the whole Wasl unit-test suite in a single process.
 *
 *   node tests/run-all.ts
 *
 * `node --test tests/` is the package.json script, but in some sandboxes
 * spawning the per-file test runner children is blocked (EPERM). Importing
 * every test file here exercises the same tests without spawning anything.
 *
 * Only framework-free modules are covered. Modules that import "server-only"
 * (database, sessions, guards, messaging, notifications, audit) need the
 * Next.js runtime and are covered by the manual checks in docs/TRACEABILITY.md.
 */

import "./validation.test.ts";
import "./password.test.ts";
import "./rules.test.ts";
import "./format.test.ts";
import "./csrf.test.ts";
import "./admin.test.ts"; //Member 2 Sprint 1: A-03 account management
import "./i18n.test.ts";
