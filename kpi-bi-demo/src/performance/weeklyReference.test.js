import { describe, expect, test } from "vitest";
import { buildWeeklyReference } from "./weeklyReference";

const review = { employee: "林制片", cycle: "2026-07" };
const people = [{ employeeId: "emp-003", name: "林制片" }];

describe("performance weekly reference", () => {
  test("uses submitted weekly report facts and ignores missing-week content", () => {
    const result = buildWeeklyReference(review, people, [
      { employeeId: "emp-003", cycle: "2026-07", status: "normal", achievements: ["完成实际交付"], risks: [], sourceModule: "周报中心" },
      { employeeId: "emp-003", cycle: "2026-07", status: "late", achievements: ["完成实际交付"], risks: ["实际风险"], sourceModule: "周报中心 · 实际填写" },
      { employeeId: "emp-003", cycle: "2026-07", status: "missing", achievements: ["不应展示"], risks: ["不应展示"], sourceModule: "周报中心" },
      { employeeId: "emp-004", cycle: "2026-07", status: "normal", achievements: ["他人数据"], risks: [], sourceModule: "周报中心" },
    ]);

    expect(result).toMatchObject({ requiredWeeks: 3, submitted: 2, late: 1, missing: 1, sourceLabel: "周报中心 · 实际填写" });
    expect(result.achievements).toEqual(["完成实际交付"]);
    expect(result.risks).toEqual(["实际风险"]);
    expect(result.weeks).toHaveLength(3);
    expect(result.weeks[2]).toMatchObject({ status: "missing", achievement: "周报未提交", risk: "--" });
  });

  test("returns an empty weekly state when the employee cannot be linked", () => {
    expect(buildWeeklyReference({ employee: "未知人员", cycle: "2026-07" }, people, [])).toMatchObject({
      employeeId: null,
      requiredWeeks: 0,
      submitted: 0,
      sourceLabel: "周报中心",
    });
  });
});
