import { describe, expect, test } from "vitest";
import { WEEKLY_STATUS, deriveWeeklyStatus, getLeaderWeeklyView, getOverdueMinutes, reopenWeeklyReport, submitWeeklyReport } from "./weeklyLogic";

const deadline = "2026-07-13T10:00:00+08:00";
const beforeDeadline = "2026-07-13T09:30:00+08:00";
const afterDeadline = "2026-07-13T11:30:00+08:00";
const base = { id: "weekly-1", name: "林制片", deadline, version: 0, versions: [], operationLogs: [] };
const payload = { originalContent: "本周完成实际工作", achievements: ["实际成果"], risks: [], nextPlan: ["下周计划"] };

describe("weekly report workflow", () => {
  test("supports submit V1 and update V2 before the deadline", () => {
    const first = submitWeeklyReport(base, payload, { now: beforeDeadline, expectedVersion: 0, requestId: "r1" });
    const second = submitWeeklyReport(first.record, { ...payload, originalContent: "更新后的周报" }, { now: beforeDeadline, expectedVersion: 1, requestId: "r2" });
    expect(first.record.versions[0]).toMatchObject({ reportVersion: 1, status: WEEKLY_STATUS.submitted });
    expect(second.record.versions[1]).toMatchObject({ reportVersion: 2, originalContent: "更新后的周报" });
    expect(second.record.operationLogs.at(-1).action).toBe("更新周报");
  });

  test("locks a submitted report after the deadline and allows Leader to reopen it", () => {
    const submitted = submitWeeklyReport(base, payload, { now: beforeDeadline, expectedVersion: 0 }).record;
    expect(deriveWeeklyStatus(submitted, afterDeadline)).toBe(WEEKLY_STATUS.locked);
    expect(submitWeeklyReport(submitted, payload, { now: afterDeadline, expectedVersion: 1 }).code).toBe("LOCKED");
    expect(reopenWeeklyReport(submitted, { roleId: "employee", operator: "林制片", now: afterDeadline, reason: "修改" }).code).toBe("FORBIDDEN");
    const reopened = reopenWeeklyReport(submitted, { roleId: "leader", operator: "江晚", now: afterDeadline, reason: "补充证明材料" });
    expect(reopened.record.state).toBe(WEEKLY_STATUS.revisionRequested);
    const late = submitWeeklyReport(reopened.record, payload, { now: afterDeadline, expectedVersion: 2 });
    expect(late.record.state).toBe(WEEKLY_STATUS.overdueSubmitted);
  });

  test("hides draft content from Leader and allows reminders", () => {
    const view = getLeaderWeeklyView({ ...base, draftContent: "不可见草稿" }, beforeDeadline);
    expect(view).toMatchObject({ status: WEEKLY_STATUS.draft, canViewContent: false, canRemind: true, content: null });
  });

  test("rejects duplicate requests and stale versions", () => {
    const submitted = submitWeeklyReport(base, payload, { now: beforeDeadline, expectedVersion: 0, requestId: "same" }).record;
    expect(submitWeeklyReport(submitted, payload, { now: beforeDeadline, expectedVersion: 1, requestId: "same" }).code).toBe("DUPLICATE");
    expect(submitWeeklyReport(submitted, payload, { now: beforeDeadline, expectedVersion: 0, requestId: "new" }).code).toBe("VERSION_CONFLICT");
  });

  test("calculates deterministic overdue duration", () => {
    expect(getOverdueMinutes(deadline, afterDeadline)).toBe(90);
  });
});
