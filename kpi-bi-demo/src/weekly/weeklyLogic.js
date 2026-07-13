export const WEEKLY_STATUS = {
  draft: "draft",
  submitted: "submitted",
  locked: "locked",
  overdueMissing: "overdue_missing",
  overdueSubmitted: "overdue_submitted",
  revisionRequested: "revision_requested",
};

function toTime(value) {
  return new Date(value).getTime();
}

export function deriveWeeklyStatus(record, now) {
  if (record?.state === WEEKLY_STATUS.revisionRequested) return WEEKLY_STATUS.revisionRequested;
  const deadlinePassed = toTime(now) > toTime(record.deadline);
  const hasSubmittedVersion = Boolean(record?.versions?.length || record?.submitted);
  if (!hasSubmittedVersion) return deadlinePassed ? WEEKLY_STATUS.overdueMissing : WEEKLY_STATUS.draft;
  if (record.state === WEEKLY_STATUS.overdueSubmitted || record.submitted?.status === "late") return WEEKLY_STATUS.overdueSubmitted;
  return deadlinePassed ? WEEKLY_STATUS.locked : WEEKLY_STATUS.submitted;
}

export function submitWeeklyReport(record, payload, { now, expectedVersion, requestId }) {
  const currentVersion = Number(record?.version ?? 0);
  if (expectedVersion != null && Number(expectedVersion) !== currentVersion) return { ok: false, code: "VERSION_CONFLICT", message: "周报版本已更新，请刷新后重试", record };
  if (requestId && record?.lastRequestId === requestId) return { ok: false, code: "DUPLICATE", message: "请勿重复提交", record };
  const currentStatus = deriveWeeklyStatus(record, now);
  if (currentStatus === WEEKLY_STATUS.locked || currentStatus === WEEKLY_STATUS.overdueSubmitted) return { ok: false, code: "LOCKED", message: "截止后周报已锁定，请联系Leader或HR重新开放", record };
  const late = toTime(now) > toTime(record.deadline);
  const reportVersion = (record.versions?.at(-1)?.reportVersion ?? (record.submitted ? 1 : 0)) + 1;
  const status = late ? WEEKLY_STATUS.overdueSubmitted : WEEKLY_STATUS.submitted;
  const submittedAt = String(now);
  const versionEntry = { reportVersion, status, submittedAt, ...payload };
  const action = late ? "逾期补交周报" : reportVersion > 1 ? "更新周报" : "提交周报";
  const next = {
    ...record,
    ...payload,
    state: status,
    submitted: { status: late ? "late" : "normal", submittedAt, achievements: payload.achievements ?? [], risks: payload.risks ?? [], nextPlan: payload.nextPlan ?? [], originalContent: payload.originalContent ?? "", aiUsage: payload.aiUsage ?? "" },
    versions: [...(record.versions ?? []), versionEntry],
    version: currentVersion + 1,
    lastRequestId: requestId ?? null,
    updatedAt: submittedAt,
    operationLogs: [...(record.operationLogs ?? []), { action, operator: record.name, actedAt: submittedAt, fromStatus: currentStatus, toStatus: status, reportVersion }],
  };
  return { ok: true, record: next };
}

export function reopenWeeklyReport(record, { roleId, operator, now, reason }) {
  if (!["leader", "hr"].includes(roleId)) return { ok: false, code: "FORBIDDEN", message: "仅Leader或HR可以重新开放周报", record };
  const currentStatus = deriveWeeklyStatus(record, now);
  if (![WEEKLY_STATUS.locked, WEEKLY_STATUS.overdueSubmitted].includes(currentStatus)) return { ok: false, code: "INVALID_STATE", message: "当前周报无需重新开放", record };
  if (!String(reason || "").trim()) return { ok: false, code: "VALIDATION", message: "请填写重新开放原因", record };
  const next = {
    ...record,
    state: WEEKLY_STATUS.revisionRequested,
    reopenedBy: operator,
    reopenedAt: String(now),
    reopenReason: reason.trim(),
    version: Number(record.version ?? 0) + 1,
    operationLogs: [...(record.operationLogs ?? []), { action: "重新开放周报", operator, actedAt: String(now), note: reason.trim(), fromStatus: currentStatus, toStatus: WEEKLY_STATUS.revisionRequested }],
  };
  return { ok: true, record: next };
}

export function getLeaderWeeklyView(record, now) {
  const status = deriveWeeklyStatus(record, now);
  const draftLike = [WEEKLY_STATUS.draft, WEEKLY_STATUS.overdueMissing].includes(status);
  return {
    status,
    canViewContent: !draftLike,
    canRemind: draftLike,
    content: draftLike ? null : record.submitted?.originalContent ?? record.versions?.at(-1)?.originalContent ?? null,
  };
}

export function getOverdueMinutes(deadline, submittedAt) {
  return Math.max(0, Math.round((toTime(submittedAt) - toTime(deadline)) / 60000));
}
