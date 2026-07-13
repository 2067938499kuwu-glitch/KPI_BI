import { describe, expect, test } from "vitest";
import { dashboardPerformanceRecords, dashboardWeeklyReports } from "./dashboardData";
import {
  buildCompanyRankings,
  filterByRole,
  getComparisonState,
  getDashboardSummary,
  getDefaultCycle,
  isFinalScoreEffective,
  mergePerformanceDimensions,
  reconcileComparisonSelection,
  sortByCompanyRank,
  sortHistoryChronologically,
  summarizeWeeklyReports,
  toggleComparisonSelection,
  withPeriodChanges,
} from "./dashboardLogic";

describe("dashboard final score and ranking rules", () => {
  test("only scores approved by the final node enter formal ranking", () => {
    expect(isFinalScoreEffective({ finalScore: 90, approvalFlow: { requiresCommittee: true, committeeStatus: "approved" } })).toBe(true);
    expect(isFinalScoreEffective({ finalScore: 99, approvalFlow: { requiresCommittee: true, committeeStatus: "pending" } })).toBe(false);
    expect(isFinalScoreEffective({ finalScore: 99, approvalFlow: { requiresCommittee: true, committeeStatus: "returned", returned: true } })).toBe(false);
  });

  test("a special flow without committee becomes effective after its last node approves", () => {
    expect(isFinalScoreEffective({ finalScore: 88, approvalFlow: { requiresCommittee: false, lastNodeStatus: "approved" } })).toBe(true);
    expect(isFinalScoreEffective({ finalScore: 88, approvalFlow: { requiresCommittee: false, lastNodeStatus: "pending" } })).toBe(false);
  });

  test("uses competition ranking for tied scores", () => {
    const ranked = buildCompanyRankings([
      { employeeId: "a", cycle: "2026-07", finalScore: 95, finalScoreEffective: true },
      { employeeId: "b", cycle: "2026-07", finalScore: 92, finalScoreEffective: true },
      { employeeId: "c", cycle: "2026-07", finalScore: 92, finalScoreEffective: true },
      { employeeId: "d", cycle: "2026-07", finalScore: 88, finalScoreEffective: true },
    ], "2026-07");
    expect(Object.fromEntries(ranked.map((item) => [item.employeeId, item.companyRank]))).toEqual({ a: 1, b: 2, c: 2, d: 4 });
  });

  test("sorts the personnel list by company rank ascending and keeps incomplete records last", () => {
    const sorted = sortByCompanyRank([
      { employeeId: "c", companyRank: 8, finalScore: 88 },
      { employeeId: "d", companyRank: null, finalScore: 99 },
      { employeeId: "a", companyRank: 1, finalScore: 95 },
      { employeeId: "b", companyRank: 2, finalScore: 92 },
    ]);
    expect(sorted.map((item) => item.employeeId)).toEqual(["a", "b", "c", "d"]);
  });

  test("sorts performance history from oldest to newest so the latest month is rightmost", () => {
    const sorted = sortHistoryChronologically([
      { cycle: "2026-07" },
      { cycle: "2026-05" },
      { cycle: "2026-06" },
    ]);
    expect(sorted.map((item) => item.cycle)).toEqual(["2026-05", "2026-06", "2026-07"]);
  });

  test("leader scope preserves company rank instead of reranking the team", () => {
    const global = buildCompanyRankings(dashboardPerformanceRecords, "2026-07");
    const leader = filterByRole(global, "leader");
    expect(leader.find((item) => item.employeeId === "emp-001").companyRank)
      .toBe(global.find((item) => item.employeeId === "emp-001").companyRank);
  });

  test("employee only sees self while HR and CEO see company data", () => {
    const ranked = buildCompanyRankings(dashboardPerformanceRecords, "2026-07");
    expect(filterByRole(ranked, "employee").map((item) => item.employeeId)).toEqual(["emp-001"]);
    expect(filterByRole(ranked, "hr")).toHaveLength(18);
    expect(filterByRole(ranked, "ceo")).toHaveLength(18);
  });

  test("default cycle is the latest month with an effective score and period changes synchronize", () => {
    expect(getDefaultCycle(dashboardPerformanceRecords)).toBe("2026-07");
    const current = withPeriodChanges(dashboardPerformanceRecords, "2026-07", "2026-06");
    expect(current).toHaveLength(18);
    expect(current.find((item) => item.employeeId === "emp-001").scoreChange).toBe(2);
  });
});

describe("dashboard permissions, comparison and weekly reports", () => {
  test("comparison accepts 2 to 5 people and prevents a sixth selection", () => {
    expect(getComparisonState(["a"]).canStart).toBe(false);
    expect(getComparisonState(["a", "b"]).canStart).toBe(true);
    expect(toggleComparisonSelection(["a", "b", "c", "d", "e"], "f")).toEqual(["a", "b", "c", "d", "e"]);
  });

  test("role or month changes remove stale and unauthorized selections", () => {
    const visible = buildCompanyRankings(dashboardPerformanceRecords, "2026-07");
    expect(reconcileComparisonSelection(["emp-001", "emp-018"], visible, "2026-07", "leader")).toEqual(["emp-001"]);
    expect(reconcileComparisonSelection(["emp-001"], visible, "2026-07", "employee")).toEqual([]);
  });

  test("weekly on-time rate uses all report weeks and returns null with no reports", () => {
    expect(summarizeWeeklyReports([{ status: "normal" }, { status: "late" }, { status: "missing" }]).onTimeRate).toBeCloseTo(33.3, 1);
    expect(summarizeWeeklyReports([]).onTimeRate).toBeNull();
  });

  test("weekly reports never modify performance scores", () => {
    const before = dashboardPerformanceRecords.find((item) => item.employeeId === "emp-001" && item.cycle === "2026-07").finalScore;
    getDashboardSummary(dashboardPerformanceRecords, dashboardWeeklyReports, "2026-07", "ceo");
    expect(dashboardPerformanceRecords.find((item) => item.employeeId === "emp-001" && item.cycle === "2026-07").finalScore).toBe(before);
  });

  test("missing role dimensions are not represented as zero", () => {
    const records = [
      { performanceDimensions: [{ name: "内容质量", score: 90 }] },
      { performanceDimensions: [{ name: "成交贡献", score: 88 }] },
    ];
    const merged = mergePerformanceDimensions(records);
    expect(merged.find((item) => item.name === "内容质量").values[1]).toMatchObject({ applicable: false, score: null });
  });
});
