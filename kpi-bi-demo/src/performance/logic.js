import { getRoleTemplate } from "./roleTemplates";

export const performanceScoreRatio = {
  firstLeader: 0.6,
  secondLeader: 0.4,
};

export function requiresSecondReview(review) {
  return review?.requiresSecondReview !== false;
}

export const REVIEW_STATUS = {
  targetIssue: "月度OKR待下发",
  employeeConfirm: "待人员OKR确认",
  executing: "数据收集中",
  resultEntry: "待结果补充",
  firstReview: "待一级领导评分",
  secondReview: "待二级领导复评",
  hrReview: "待HR复审",
  committeeApproval: "待委员会审批",
  feedback: "待反馈与面谈",
  appealInProgress: "绩效申诉处理中",
  archived: "已结束",
};

export const WORKFLOW_ACTIONS = {
  [REVIEW_STATUS.targetIssue]: { type: "issue_target", label: "下发月度OKR", nextStatus: REVIEW_STATUS.employeeConfirm },
  [REVIEW_STATUS.employeeConfirm]: { type: "confirm_target", label: "人员OKR确认", nextStatus: REVIEW_STATUS.executing },
  [REVIEW_STATUS.executing]: { type: "finish_execution", label: "完成数据收集汇总", nextStatus: REVIEW_STATUS.resultEntry },
  [REVIEW_STATUS.resultEntry]: { type: "enter_result", label: "补充结果值", nextStatus: REVIEW_STATUS.firstReview },
  [REVIEW_STATUS.firstReview]: { type: "first_score", label: "一级评分与评语", nextStatus: REVIEW_STATUS.secondReview },
  [REVIEW_STATUS.secondReview]: { type: "second_review", label: "二级复评与评语", nextStatus: REVIEW_STATUS.hrReview },
  [REVIEW_STATUS.hrReview]: { type: "hr_review", label: "HR复审提交委员会", nextStatus: REVIEW_STATUS.committeeApproval },
  [REVIEW_STATUS.committeeApproval]: { type: "committee_approve", label: "委员会审批", nextStatus: REVIEW_STATUS.feedback },
  [REVIEW_STATUS.feedback]: { type: "interview_feedback", label: "反馈与面谈记录", nextStatus: REVIEW_STATUS.archived },
  [REVIEW_STATUS.appealInProgress]: { type: "resolve_appeal", label: "申诉受理", nextStatus: REVIEW_STATUS.archived },
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
  REVIEW_STATUS.executing,
  REVIEW_STATUS.resultEntry,
  REVIEW_STATUS.firstReview,
  REVIEW_STATUS.secondReview,
  REVIEW_STATUS.hrReview,
  REVIEW_STATUS.committeeApproval,
  REVIEW_STATUS.feedback,
]);

export function calcRowComposite(row, review) {
  if (!requiresSecondReview(review)) return row.firstScore;
  return row.firstScore * performanceScoreRatio.firstLeader + row.secondScore * performanceScoreRatio.secondLeader;
}

export function calcRowScore(row, review) {
  if (row.type === "section") return 0;
  const composite = calcRowComposite(row, review);
  if (row.type === "adjustment") return Number(composite.toFixed(1));
  return Number((composite * (row.weight ?? 0)).toFixed(1));
}

export function calcBaseScore(review) {
  return review.rows.reduce((sum, row) => sum + calcRowScore(row, review), 0);
}

export function calcScore(review) {
  return Number(calcBaseScore(review).toFixed(1));
}

export function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
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
  if (status === REVIEW_STATUS.employeeConfirm) return REVIEW_STATUS.executing;
  if (status === REVIEW_STATUS.executing) return REVIEW_STATUS.resultEntry;
  if (status === REVIEW_STATUS.resultEntry) return REVIEW_STATUS.firstReview;
  if (status === REVIEW_STATUS.firstReview) return requiresSecondReview(reviewOrStatus) ? REVIEW_STATUS.secondReview : REVIEW_STATUS.hrReview;
  if (status === REVIEW_STATUS.secondReview) return REVIEW_STATUS.hrReview;
  if (status === REVIEW_STATUS.hrReview) return REVIEW_STATUS.committeeApproval;
  if (status === REVIEW_STATUS.committeeApproval) return REVIEW_STATUS.feedback;
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
    confirmStatus: toStatus === REVIEW_STATUS.employeeConfirm ? "待OKR确认" : review.confirmStatus,
    resultStatus: toStatus === REVIEW_STATUS.resultEntry ? "待补充" : review.resultStatus,
    feedbackStatus: action.updates?.feedbackStatus ?? (toStatus === REVIEW_STATUS.archived && fromStatus === REVIEW_STATUS.feedback ? "已面谈" : review.feedbackStatus),
    committeeStatus: action.updates?.committeeStatus ?? (fromStatus === REVIEW_STATUS.committeeApproval && toStatus === REVIEW_STATUS.feedback ? "已审批" : review.committeeStatus),
    appealStatus: action.updates?.appealStatus ?? (fromStatus === REVIEW_STATUS.appealInProgress ? "已裁定" : review.appealStatus),
  };
}

export function isPendingReviewStatus(status) {
  return pendingReviewStatuses.has(status);
}

export function isOpenAppealReview(review) {
  return review.status === REVIEW_STATUS.appealInProgress;
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
