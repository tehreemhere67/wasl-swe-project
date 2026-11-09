/**
 * Unit tests for src/lib/format.ts
 *
 * SRS references:
 *   NFR-LOC-05 - dates and times are shown in PKT (Asia/Karachi) on the
 *                Gregorian calendar, consistently in both languages
 *   NFR-LOC-01 - both languages are supported
 *   NFR-ADM-09 - the verification queue shows how long a registration waited
 *
 * Run directly:  node tests/format.test.ts
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  PKT_TIME_ZONE,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatTime,
  relativeTimeParts,
  waitingTimeParts,
} from "../src/lib/format.ts";

// 18:00 in Karachi on 12 November 2026.
const EVENING_IN_PKT = new Date("2026-11-12T18:00:00+05:00");

describe("PKT time zone", () => {
  test("Asia/Karachi is the single configured zone", () => {
    assert.equal(PKT_TIME_ZONE, "Asia/Karachi");
  });

  test("a UTC instant is rendered in PKT, not UTC", () => {
    // 20:30 UTC is 01:30 on the next day in Karachi (UTC+5).
    const boundary = new Date("2026-11-12T20:30:00Z");
    assert.equal(formatDate(boundary), "13 Nov 2026");
    assert.equal(formatDateTime(boundary), "13 Nov 2026, 01:30");
  });
});

describe("formatDate", () => {
  test("renders the day, short month and year", () => {
    assert.equal(formatDate(EVENING_IN_PKT), "12 Nov 2026");
  });

  test("accepts an ISO string", () => {
    assert.equal(formatDate("2026-11-12T18:00:00+05:00"), "12 Nov 2026");
  });

  test("renders Urdu dates in Urdu while keeping the Gregorian year", () => {
    const urdu = formatDate(EVENING_IN_PKT, "ur");
    assert.match(urdu, /2026/);
    assert.match(urdu, /[\u0600-\u06FF]/, "the month name should be Urdu script");
  });

  test("returns an em dash for empty or invalid input", () => {
    assert.equal(formatDate(null), "—");
    assert.equal(formatDate(undefined), "—");
    assert.equal(formatDate("not-a-date"), "—");
  });
});

describe("formatDateTime", () => {
  test("renders date and 24-hour time in PKT", () => {
    assert.equal(formatDateTime(EVENING_IN_PKT), "12 Nov 2026, 18:00");
  });

  test("uses a 24-hour clock, never AM/PM", () => {
    assert.match(formatDateTime(EVENING_IN_PKT), /18:00/);
    assert.equal(formatDateTime(EVENING_IN_PKT).toLowerCase().includes("pm"), false);
  });

  test("returns an em dash for empty or invalid input", () => {
    assert.equal(formatDateTime(null), "—");
    assert.equal(formatDateTime("nope"), "—");
  });
});

describe("formatTime", () => {
  test("renders the time only", () => {
    assert.equal(formatTime(EVENING_IN_PKT), "18:00");
  });

  test("renders midnight as 00:00", () => {
    assert.equal(formatTime(new Date("2026-11-12T00:00:00+05:00")), "00:00");
  });

  test("returns an em dash for empty input", () => {
    assert.equal(formatTime(null), "—");
  });
});

describe("relativeTimeParts", () => {
  const now = new Date("2026-11-12T18:00:00.000Z");
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

  test("anything under a minute is 'now'", () => {
    assert.deepEqual(relativeTimeParts(now, now), { unit: "now", count: 0 });
    assert.deepEqual(relativeTimeParts(minutesAgo(0.5), now), { unit: "now", count: 0 });
  });

  test("minutes bucket for under an hour", () => {
    assert.deepEqual(relativeTimeParts(minutesAgo(5), now), { unit: "minutes", count: 5 });
    assert.deepEqual(relativeTimeParts(minutesAgo(59), now), { unit: "minutes", count: 59 });
  });

  test("hours bucket from 60 minutes to under 24 hours", () => {
    assert.deepEqual(relativeTimeParts(minutesAgo(60), now), { unit: "hours", count: 1 });
    assert.deepEqual(relativeTimeParts(minutesAgo(3 * 60), now), { unit: "hours", count: 3 });
    assert.deepEqual(relativeTimeParts(minutesAgo(23 * 60 + 59), now), { unit: "hours", count: 23 });
  });

  test("days bucket from 24 hours", () => {
    assert.deepEqual(relativeTimeParts(minutesAgo(24 * 60), now), { unit: "days", count: 1 });
    assert.deepEqual(relativeTimeParts(minutesAgo(2 * 24 * 60), now), { unit: "days", count: 2 });
  });

  test("a future timestamp is treated as now, never a negative age", () => {
    assert.deepEqual(relativeTimeParts(new Date(now.getTime() + 60_000), now), { unit: "now", count: 0 });
  });

  test("empty input is now", () => {
    assert.deepEqual(relativeTimeParts(null, now), { unit: "now", count: 0 });
  });
});

describe("waitingTimeParts (FR-ADM-09)", () => {
  const now = new Date("2026-11-12T18:00:00.000Z");

  test("splits the wait into whole days and remaining hours", () => {
    const createdAt = new Date(now.getTime() - (2 * 24 + 5) * 3_600_000);
    assert.deepEqual(waitingTimeParts(createdAt, now), { days: 2, hours: 5 });
  });

  test("a registration that just arrived has waited no whole hours", () => {
    assert.deepEqual(waitingTimeParts(new Date(now.getTime() - 30 * 60_000), now), { days: 0, hours: 0 });
  });

  test("a future timestamp never produces a negative wait", () => {
    assert.deepEqual(waitingTimeParts(new Date(now.getTime() + 3_600_000), now), { days: 0, hours: 0 });
  });

  test("accepts an ISO string", () => {
    const createdAt = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    assert.deepEqual(waitingTimeParts(createdAt, now), { days: 0, hours: 3 });
  });
});

describe("formatFileSize", () => {
  test("bytes below 1 KB", () => {
    assert.equal(formatFileSize(512), "512 B");
    assert.equal(formatFileSize(1), "1 B");
  });

  test("kilobytes", () => {
    assert.equal(formatFileSize(1024), "1 KB");
    assert.equal(formatFileSize(1536), "2 KB");
    assert.equal(formatFileSize(1024 * 1024 - 1), "1024 KB");
  });

  test("megabytes with one decimal place", () => {
    assert.equal(formatFileSize(1024 * 1024), "1.0 MB");
    assert.equal(formatFileSize(2.5 * 1024 * 1024), "2.5 MB");
    assert.equal(formatFileSize(5 * 1024 * 1024), "5.0 MB");
  });

  test("zero, negative and non-numeric input is 0 KB", () => {
    assert.equal(formatFileSize(0), "0 KB");
    assert.equal(formatFileSize(-5), "0 KB");
    assert.equal(formatFileSize(Number.NaN), "0 KB");
    assert.equal(formatFileSize(Number.POSITIVE_INFINITY), "0 KB");
  });
});
