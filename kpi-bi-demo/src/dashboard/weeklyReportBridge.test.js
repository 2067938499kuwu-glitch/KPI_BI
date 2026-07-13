import { describe, expect, test } from "vitest";
import { mergeWeeklyReports, readStoredWeeklyReports, toDashboardWeeklyReport, WEEKLY_REPORT_STORAGE_KEY } from "./weeklyReportBridge";

const baseReport = {
  id: "2026-07-emp-003-W28",
  employeeId: "emp-003",
  cycle: "2026-07",
  period: { label: "2026年W28", start: "2026-07-06", end: "2026-07-12" },
  status: "normal",
  achievements: ["Mock 成果"],
};

test("submitted weekly-page data overrides the matching dashboard mock", () => {
  const stored = {
    ...baseReport,
    draftContent: "草稿",
    submitted: {
      status: "late",
      submittedAt: "2026-07-13 10:20",
      achievements: ["实际成果"],
      risks: ["实际风险"],
      nextPlan: ["实际计划"],
      originalContent: "实际提交原文",
    },
  };
  const [linked] = mergeWeeklyReports([baseReport], [stored]);
  expect(linked).toMatchObject({ status: "late", achievements: ["实际成果"], sourceModule: "周报中心 · 实际填写" });
});

test("an unsubmitted draft is visible as missing and does not enter monthly results", () => {
  expect(toDashboardWeeklyReport({ ...baseReport, draftContent: "尚未提交的内容" })).toMatchObject({
    status: "missing",
    achievements: [],
    risks: [],
    originalContent: "尚未提交的内容",
  });
});

describe("stored weekly records", () => {
  test("returns records from valid storage and tolerates invalid data", () => {
    const validStorage = { getItem: (key) => key === WEEKLY_REPORT_STORAGE_KEY ? JSON.stringify([baseReport]) : null };
    expect(readStoredWeeklyReports(validStorage)).toHaveLength(1);
    expect(readStoredWeeklyReports({ getItem: () => "not-json" })).toEqual([]);
  });
});
