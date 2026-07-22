import { getRoleTemplate } from "./roleTemplates";

export const performanceScoreRatio = {
  firstLeader: 0.6,
  secondLeader: 0.4,
};

export function requiresSecondReview(review) {
  return review?.requiresSecondReview !== false;
}

export const REVIEW_STATUS = {
  targetIssue: "绩效目标待下发",
  employeeConfirm: "待员工确认绩效目标",
  targetDispute: "目标异议处理中",
  executing: "绩效目标已生效",
  resultEntry: "待员工填报结果",
  firstReview: "待一级领导评分",
  secondReview: "待二级领导复评",
  hrReview: "待HR复审",
  committeeApproval: "待绩效委员会审批",
  feedback: "待反馈与面谈",
  appealSubmitted: "待HR受理",
  appealInvestigation: "HR申诉裁定中",
  appealInProgress: "待绩效委员会复核",
  archived: "已结束",
};

export const WORKFLOW_ACTIONS = {
  [REVIEW_STATUS.targetIssue]: { type: "issue_target", label: "下发月度绩效目标", nextStatus: REVIEW_STATUS.employeeConfirm },
  [REVIEW_STATUS.employeeConfirm]: { type: "confirm_target", label: "确认绩效目标", nextStatus: REVIEW_STATUS.resultEntry },
  [REVIEW_STATUS.targetDispute]: { type: "reissue_target", label: "调整并重新下发", nextStatus: REVIEW_STATUS.employeeConfirm },
  [REVIEW_STATUS.executing]: { type: "start_result_entry", label: "进入结果填报", nextStatus: REVIEW_STATUS.resultEntry },
  [REVIEW_STATUS.resultEntry]: { type: "enter_result", label: "填报完成结果", nextStatus: REVIEW_STATUS.firstReview },
  [REVIEW_STATUS.firstReview]: { type: "first_score", label: "一级评分与评语", nextStatus: REVIEW_STATUS.secondReview },
  [REVIEW_STATUS.secondReview]: { type: "second_review", label: "二级复评与结果审核", nextStatus: REVIEW_STATUS.hrReview },
  [REVIEW_STATUS.hrReview]: { type: "hr_review", label: "HR复审并提交绩效委员会", nextStatus: REVIEW_STATUS.committeeApproval },
  [REVIEW_STATUS.committeeApproval]: { type: "committee_approve", label: "绩效委员会审批", nextStatus: REVIEW_STATUS.feedback },
  [REVIEW_STATUS.feedback]: { type: "interview_feedback", label: "反馈与面谈记录", nextStatus: REVIEW_STATUS.archived },
  [REVIEW_STATUS.appealSubmitted]: { type: "accept_appeal", label: "受理绩效申诉", nextStatus: REVIEW_STATUS.appealInvestigation },
  [REVIEW_STATUS.appealInvestigation]: { type: "adjudicate_appeal", label: "裁定并提交绩效委员会", nextStatus: REVIEW_STATUS.appealInProgress },
  [REVIEW_STATUS.appealInProgress]: { type: "resolve_appeal", label: "绩效委员会复核申诉", nextStatus: REVIEW_STATUS.archived },
};

export const LEVEL_LABEL = {
  excellent: "优秀",
  good: "良好",
  pass: "合格",
  improve: "待提升",
};

const pendingReviewStatuses = new Set([
  REVIEW_STATUS.targetIssue,
  REVIEW_STATUS.employeeConfirm,
  REVIEW_STATUS.targetDispute,
  REVIEW_STATUS.executing,
  REVIEW_STATUS.resultEntry,
  REVIEW_STATUS.firstReview,
  REVIEW_STATUS.secondReview,
  REVIEW_STATUS.hrReview,
  REVIEW_STATUS.committeeApproval,
  REVIEW_STATUS.feedback,
]);

export function calcRowComposite(row, review) {
  if (row.type === "adjustment") return Number(row.firstScore || 0);
  if (!requiresSecondReview(review)) return row.firstScore;
  return row.firstScore * performanceScoreRatio.firstLeader + row.secondScore * performanceScoreRatio.secondLeader;
}

export function calcRowScore(row, review) {
  if (row.type === "section") return 0;
  const composite = calcRowComposite(row, review);
  if (row.type === "adjustment") return Number(composite.toFixed(2));
  return Number((composite * (row.weight ?? 0)).toFixed(2));
}

export function calcBaseScore(review) {
  return Number(review.rows.reduce((sum, row) => row.type === "adjustment" ? sum : sum + calcRowScore(row, review), 0).toFixed(2));
}

export function calcAdjustmentScore(review) {
  return Number(review.rows.reduce((sum, row) => row.type === "adjustment" ? sum + Number(row.firstScore || 0) : sum, 0).toFixed(2));
}

export function calcScore(review) {
  return Number(Math.max(0, Math.min(100, calcBaseScore(review) + calcAdjustmentScore(review))).toFixed(2));
}

export function getGrade(score) {
  if (score >= 80) return "S";
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 55) return "C";
  return "D";
}

export function getLevelLabel(score) {
  if (score >= 80) return LEVEL_LABEL.excellent;
  if (score >= 70) return LEVEL_LABEL.good;
  if (score >= 60) return LEVEL_LABEL.pass;
  return LEVEL_LABEL.improve;
}

export function getNextReviewStatus(reviewOrStatus) {
  const status = typeof reviewOrStatus === "string" ? reviewOrStatus : reviewOrStatus?.status;
  if (status === REVIEW_STATUS.targetIssue) return REVIEW_STATUS.employeeConfirm;
  if (status === REVIEW_STATUS.employeeConfirm) return REVIEW_STATUS.resultEntry;
  if (status === REVIEW_STATUS.targetDispute) return REVIEW_STATUS.employeeConfirm;
  if (status === REVIEW_STATUS.executing) return REVIEW_STATUS.resultEntry;
  if (status === REVIEW_STATUS.resultEntry) return REVIEW_STATUS.firstReview;
  if (status === REVIEW_STATUS.firstReview) return requiresSecondReview(reviewOrStatus) ? REVIEW_STATUS.secondReview : REVIEW_STATUS.hrReview;
  if (status === REVIEW_STATUS.secondReview) return REVIEW_STATUS.hrReview;
  if (status === REVIEW_STATUS.hrReview) return REVIEW_STATUS.committeeApproval;
  if (status === REVIEW_STATUS.committeeApproval) return REVIEW_STATUS.feedback;
  if (status === REVIEW_STATUS.appealSubmitted) return REVIEW_STATUS.appealInvestigation;
  if (status === REVIEW_STATUS.appealInvestigation) return REVIEW_STATUS.appealInProgress;
  if (status === REVIEW_STATUS.feedback || status === REVIEW_STATUS.appealInProgress) return REVIEW_STATUS.archived;
  return status;
}

export function getWorkflowAction(review) {
  const action = WORKFLOW_ACTIONS[review.status];
  if (!action) return null;
  return { ...action, nextStatus: getNextReviewStatus(review) };
}

export function applyWorkflowAction(review, action) {
  const workflowAction = getWorkflowAction(review);
  if (!workflowAction || workflowAction.type !== action.type) return review;

  const fromStatus = review.status;
  const toStatus = action.nextStatus ?? workflowAction.nextStatus;
  const nextLogIndex = (review.operationLogs?.length ?? 0) + 1;
  const actedAt = action.actedAt ?? "2026-07-07 10:00";
  const operator = action.operator ?? "系统操作员";
  const note = action.note ?? "";
  const log = {
    id: `${review.id}-log-${nextLogIndex}`,
    action: workflowAction.label,
    operator,
    actedAt,
    note,
    fromStatus,
    toStatus,
  };

  return {
    ...review,
    ...(action.updates ?? {}),
    status: toStatus,
    lastActionAt: actedAt,
    lastActionName: workflowAction.label,
    operationLogs: [...(review.operationLogs ?? []), log],
    confirmStatus: toStatus === REVIEW_STATUS.employeeConfirm ? "待确认绩效目标" : review.confirmStatus,
    resultStatus: action.updates?.resultStatus ?? (toStatus === REVIEW_STATUS.resultEntry ? "待补充" : review.resultStatus),
    feedbackStatus: action.updates?.feedbackStatus ?? (toStatus === REVIEW_STATUS.archived && fromStatus === REVIEW_STATUS.feedback ? "已面谈" : review.feedbackStatus),
    committeeStatus: action.updates?.committeeStatus ?? (fromStatus === REVIEW_STATUS.committeeApproval && toStatus === REVIEW_STATUS.feedback ? "已审批" : review.committeeStatus),
    appealStatus: action.updates?.appealStatus ?? (fromStatus === REVIEW_STATUS.appealInProgress ? "已裁定" : review.appealStatus),
  };
}

export function isPendingReviewStatus(status) {
  return pendingReviewStatuses.has(status);
}

export function isOpenAppealReview(review) {
  return [REVIEW_STATUS.appealSubmitted, REVIEW_STATUS.appealInvestigation, REVIEW_STATUS.appealInProgress].includes(review.status);
}

export function getPendingReviewCount(reviews) {
  return reviews.filter((review) => isPendingReviewStatus(review.status)).length;
}

export function getOpenAppealCount(reviews) {
  return reviews.filter(isOpenAppealReview).length;
}

export function getStatusCount(reviews, statusKey) {
  if (statusKey === "pending") return getPendingReviewCount(reviews);
  if (statusKey === "appeal") return getOpenAppealCount(reviews);
  if (statusKey === "archived") return reviews.filter((review) => review.status === REVIEW_STATUS.archived).length;
  return reviews.filter((review) => review.status === statusKey).length;
}

export function matchesPerformanceTab(review, tab) {
  if (tab === "pending") return isPendingReviewStatus(review.status);
  if (tab === "appeal") return isOpenAppealReview(review);
  if (tab === "archived") return review.status === REVIEW_STATUS.archived;
  return true;
}

export function getReviewTemplate(review) {
  return getRoleTemplate(review.roleTemplateId) ?? {
    id: review.roleTemplateId ?? "unknown",
    name: review.roleTemplateName ?? review.role ?? "未知岗位模板",
    dimensions: [],
    adjustments: [],
  };
}

export function matchesTemplateFilter(review, templateId) {
  return templateId === "all" || review.roleTemplateId === templateId;
}

export function validateTargetWeights(targets) {
  const weighted = targets.filter((target) => target.type !== "adjustment");
  const total = Number(weighted.reduce((sum, target) => sum + Number(target.weight || 0), 0).toFixed(2));
  return {
    total,
    valid: total === 100,
    reason: total === 100 ? "权重校验通过" : `岗位通用目标与个人月度目标权重合计需为100%，当前为${total}%`,
  };
}

export function validateAdjustmentTotal(rows) {
  const total = Number(rows.filter((row) => row.type === "adjustment").reduce((sum, row) => sum + Number(row.firstScore || 0), 0).toFixed(2));
  return { total, valid: total >= -10 && total <= 10, reason: total >= -10 && total <= 10 ? "加减分校验通过" : "全部加减分累计必须在-10至+10分之间" };
}

export const ROLE_ACTIONS = {
  employee: new Set(["confirm_target", "dispute_target", "start_result_entry", "enter_result", "submit_appeal", "reject_target_change"]),
  leader: new Set(["issue_target", "reissue_target", "change_target", "first_score", "second_review", "return_result", "interview_feedback", "record_adjustment", "provide_appeal_evidence"]),
  hr: new Set(["hr_review", "accept_appeal", "adjudicate_appeal", "manage_exception"]),
  ceo: new Set(["committee_approve", "resolve_appeal"]),
};

export function canPerformReviewAction(roleId, actionType, review, viewerName) {
  if (!ROLE_ACTIONS[roleId]?.has(actionType)) return false;
  if (roleId === "employee") return review?.employee === viewerName;
  if (roleId === "leader") {
    if (actionType === "second_review") return review?.indirectLeader === viewerName;
    return review?.directLeader === viewerName;
  }
  return roleId === "hr" || roleId === "ceo";
}

function versionConflict(review, expectedVersion) {
  return expectedVersion != null && Number(expectedVersion) !== Number(review.version ?? 1);
}

function appendLog(review, entry) {
  return [...(review.operationLogs ?? []), { id: `${review.id}-log-${(review.operationLogs?.length ?? 0) + 1}`, ...entry }];
}

export function raiseTargetDispute(review, { reason, operator, actedAt, expectedVersion }) {
  if (!String(reason || "").trim()) return { ok: false, code: "VALIDATION", message: "请填写绩效目标异议原因", review };
  if (versionConflict(review, expectedVersion)) return { ok: false, code: "VERSION_CONFLICT", message: "目标版本已更新，请刷新后重试", review };
  const next = {
    ...review,
    status: REVIEW_STATUS.targetDispute,
    targetDisputeReason: reason.trim(),
    owner: review.directLeader,
    version: Number(review.version ?? 1) + 1,
  };
  next.operationLogs = appendLog(review, { action: "提出绩效目标异议", operator, actedAt, note: reason.trim(), fromStatus: review.status, toStatus: next.status });
  return { ok: true, review: next };
}

export function createTargetChange(review, { reason, targets, operator, actedAt, expectedVersion }) {
  if (!String(reason || "").trim()) return { ok: false, code: "VALIDATION", message: "请填写目标变更原因", review };
  if (versionConflict(review, expectedVersion)) return { ok: false, code: "VERSION_CONFLICT", message: "目标版本已更新，请刷新后重试", review };
  const validation = validateTargetWeights(targets);
  if (!validation.valid) return { ok: false, code: "VALIDATION", message: validation.reason, review };
  const currentVersion = review.activeTargetVersion ?? review.targetVersions?.at(-1)?.version ?? 1;
  const nextVersion = Math.max(currentVersion, ...(review.targetVersions ?? []).map((item) => item.version), 0) + 1;
  const pending = { version: nextVersion, status: "待员工确认", targets, changeReason: reason.trim(), operator, actedAt };
  const next = {
    ...review,
    status: REVIEW_STATUS.employeeConfirm,
    pendingTargetVersion: nextVersion,
    targetVersions: [...(review.targetVersions ?? []), pending],
    version: Number(review.version ?? 1) + 1,
  };
  next.operationLogs = appendLog(review, { action: "发起绩效目标变更", operator, actedAt, note: `生成待确认V${nextVersion}：${reason.trim()}`, fromStatus: review.status, toStatus: next.status });
  return { ok: true, review: next };
}

export function confirmTargetVersion(review, { operator, actedAt, expectedVersion }) {
  if (versionConflict(review, expectedVersion)) return { ok: false, code: "VERSION_CONFLICT", message: "目标版本已更新，请刷新后重试", review };
  const pendingVersion = review.pendingTargetVersion ?? review.targetVersions?.find((item) => item.status === "待员工确认")?.version ?? 1;
  const versions = (review.targetVersions?.length ? review.targetVersions : [{ version: 1, status: "待员工确认", targets: review.assignedCategories ?? [] }]).map((item) => ({
    ...item,
    status: item.version === pendingVersion ? "已生效" : ["已生效", "待员工确认"].includes(item.status) ? "已归档" : item.status,
    confirmedBy: item.version === pendingVersion ? operator : item.confirmedBy,
    confirmedAt: item.version === pendingVersion ? actedAt : item.confirmedAt,
  }));
  const next = { ...review, status: REVIEW_STATUS.resultEntry, confirmStatus: "绩效目标已确认", activeTargetVersion: pendingVersion, pendingTargetVersion: null, targetVersions: versions, version: Number(review.version ?? 1) + 1 };
  next.operationLogs = appendLog(review, { action: "确认绩效目标", operator, actedAt, note: `V${pendingVersion}已生效，进入结果填报`, fromStatus: review.status, toStatus: next.status });
  return { ok: true, review: next };
}

export function rejectTargetVersion(review, { reason, operator, actedAt, expectedVersion }) {
  if (!String(reason || "").trim()) return { ok: false, code: "VALIDATION", message: "请填写拒绝原因", review };
  if (versionConflict(review, expectedVersion)) return { ok: false, code: "VERSION_CONFLICT", message: "目标版本已更新，请刷新后重试", review };
  const pendingVersion = review.pendingTargetVersion;
  const versions = (review.targetVersions ?? []).map((item) => item.version === pendingVersion ? { ...item, status: "已拒绝", rejectReason: reason.trim(), rejectedAt: actedAt } : item);
  const nextStatus = review.activeTargetVersion ? REVIEW_STATUS.resultEntry : REVIEW_STATUS.targetDispute;
  const next = { ...review, status: nextStatus, pendingTargetVersion: null, targetVersions: versions, version: Number(review.version ?? 1) + 1 };
  next.operationLogs = appendLog(review, { action: "拒绝绩效目标变更", operator, actedAt, note: `${reason.trim()}；原V${review.activeTargetVersion ?? 1}继续生效`, fromStatus: review.status, toStatus: next.status });
  return { ok: true, review: next };
}

export function returnResultForSupplement(review, { reason, operator, actedAt }) {
  if (!String(reason || "").trim()) return { ok: false, code: "VALIDATION", message: "请填写退回补充原因", review };
  const next = { ...review, status: REVIEW_STATUS.resultEntry, resultStatus: "已退回补充", resultReturnReason: reason.trim(), version: Number(review.version ?? 1) + 1 };
  next.operationLogs = appendLog(review, { action: "退回员工补充结果", operator, actedAt, note: reason.trim(), fromStatus: review.status, toStatus: next.status, snapshot: { rows: review.rows } });
  return { ok: true, review: next };
}

export function resolveAppealResult(review, { decision, correctedScore, reason, operator, actedAt }) {
  if (!String(reason || "").trim()) return { ok: false, code: "VALIDATION", message: "请填写绩效委员会复核意见", review };
  if (!["rejected", "partial", "approved"].includes(decision)) return { ok: false, code: "VALIDATION", message: "请选择裁决结论", review };
  if (decision !== "rejected" && (!Number.isFinite(Number(correctedScore)) || Number(correctedScore) < 0 || Number(correctedScore) > 100)) return { ok: false, code: "VALIDATION", message: "修正后分数需在0至100之间", review };
  const originalScore = review.resultVersions?.at(-1)?.score ?? calcScore(review);
  const nextResultVersion = (review.resultVersions?.at(-1)?.version ?? 1) + 1;
  const resultVersions = decision === "rejected" ? (review.resultVersions ?? [{ version: 1, score: originalScore, grade: getGrade(originalScore), status: "已生效" }]) : [
    ...(review.resultVersions ?? [{ version: 1, score: originalScore, grade: getGrade(originalScore), status: "已归档" }]).map((item) => ({ ...item, status: "已归档" })),
    { version: nextResultVersion, score: Number(correctedScore), grade: getGrade(Number(correctedScore)), status: "已生效", appealDecision: decision, reason: reason.trim(), operator, actedAt },
  ];
  const appealStatus = decision === "rejected" ? "申诉驳回" : decision === "partial" ? "申诉部分成立" : "申诉成立";
  const next = { ...review, status: REVIEW_STATUS.archived, appealStatus, resultVersions, version: Number(review.version ?? 1) + 1 };
  next.operationLogs = appendLog(review, { action: "绩效委员会复核申诉", operator, actedAt, note: `${appealStatus}：${reason.trim()}`, fromStatus: review.status, toStatus: next.status, snapshot: { beforeScore: originalScore, afterScore: decision === "rejected" ? originalScore : Number(correctedScore) } });
  return { ok: true, review: next };
}
