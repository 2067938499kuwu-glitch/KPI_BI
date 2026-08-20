import { describe, expect, test } from "vitest";
import {
  REVIEW_STATUS,
  applyWorkflowAction,
  calcAdjustmentScore,
  calcBaseScore,
  calcRowScore,
  calcScore,
  canPerformReviewAction,
  confirmTargetVersion,
  createTargetChange,
  getGrade,
  getNextReviewStatus,
  getOpenAppealCount,
  getPendingReviewCount,
  getReviewTemplate,
  getWorkflowAction,
  isPendingReviewStatus,
  matchesPerformanceTab,
  matchesTemplateFilter,
  materializeTargetRows,
  raiseTargetDispute,
  rejectTargetVersion,
  resolveAppealResult,
  returnResultForSupplement,
  updateAssistanceConfiguration,
  validateAdjustmentEvidence,
  validateAdjustmentTotal,
  validateTargetWeights,
} from "./logic";
import {
  FULL_FLOW_TEST_REVIEW_ID,
  createFullFlowTestReview,
  performanceTemplate,
  reviewsSeed,
} from "./seed";
import {
  ROLE_TEMPLATE_IDS,
  createRowsFromTemplate,
  getRoleTemplate,
  getRoleTemplateOptions,
  roleTemplates,
} from "./roleTemplates";

const actedAt = "2026-07-13 10:00";

describe("绩效目标与评分纯函数", () => {
  test("岗位模板仍复用现有多岗位结构", () => {
    expect(roleTemplates.length).toBeGreaterThan(8);
    expect(getRoleTemplateOptions()[0]).toEqual({ value: "all", label: "全部岗位模板" });
    expect(getRoleTemplate(ROLE_TEMPLATE_IDS.editor).businessLines).toEqual(["剪辑中心", "初级剪辑师 / 中级剪辑师"]);
    const editorRows = createRowsFromTemplate(ROLE_TEMPLATE_IDS.editor);
    const firstMetric = editorRows.find((row) => row.type === "weighted");
    expect(firstMetric.standards.map((standard) => standard.label)).toEqual(["优秀", "良好", "合格", "待提升"]);
    expect(firstMetric.standards.every((standard) => standard.scoreRange && standard.description)).toBe(true);
  });

  test("岗位通用目标与个人目标共同校验100%，加减分不参与", () => {
    expect(validateTargetWeights([
      { type: "weighted", origin: "template", weight: 80 },
      { type: "weighted", origin: "personal", weight: 20 },
      { type: "adjustment", weight: 99 },
    ])).toMatchObject({ total: 100, valid: true });
    expect(validateTargetWeights([
      { type: "weighted", origin: "template", weight: 70 },
      { type: "weighted", origin: "personal", weight: 20 },
    ])).toMatchObject({ total: 90, valid: false });
  });

  test("开启协助评分时按一级40%、协助20%、BP40%合成，加减分直接计入", () => {
    const review = {
      subjectType: "employee",
      assistScoreEnabled: true,
      rows: [
        { type: "weighted", weight: 0.4, firstScore: 75, assistScore: 65, bpScore: 80 },
        { type: "weighted", weight: 0.3, firstScore: 85, assistScore: 65, bpScore: 75 },
        { type: "adjustment", adjustmentScore: 3, firstScore: 3, assistScore: -8, bpScore: -6, reason: "交付奖励", evidence: "验收记录" },
      ],
    };
    expect(calcRowScore(review.rows[0], review)).toBe(30);
    expect(calcRowScore(review.rows[1], review)).toBe(23.1);
    expect(calcBaseScore(review)).toBe(53.1);
    expect(calcAdjustmentScore(review)).toBe(3);
    expect(calcScore(review)).toBe(56.1);
  });

  test("不开启协助评分时一级与BP各50%，BP本人由老板100%评分", () => {
    expect(calcScore({ requiresSecondReview: false, rows: [
      { type: "weighted", weight: 1, firstScore: 80, bpScore: 80 },
      { type: "adjustment", adjustmentScore: 30 },
    ] })).toBe(100);
    expect(calcScore({ requiresSecondReview: false, rows: [
      { type: "weighted", weight: 1, firstScore: 5, bpScore: 5 },
      { type: "adjustment", adjustmentScore: -20 },
    ] })).toBe(0);
    expect(calcScore({ subjectType: "bp", rows: [{ type: "weighted", weight: 1, firstScore: 82 }, { type: "adjustment", adjustmentScore: 2 }] })).toBe(84);
    expect(getNextReviewStatus({ status: REVIEW_STATUS.firstReview, requiresSecondReview: false })).toBe(REVIEW_STATUS.hrReview);
    expect(getNextReviewStatus({ status: REVIEW_STATUS.firstReview, subjectType: "bp" })).toBe(REVIEW_STATUS.committeeApproval);
  });

  test("加减分累计限制在-10至+10", () => {
    expect(validateAdjustmentTotal([{ type: "adjustment", firstScore: 6 }, { type: "adjustment", firstScore: 4 }])).toMatchObject({ total: 10, valid: true });
    expect(validateAdjustmentTotal([{ type: "adjustment", firstScore: 11 }])).toMatchObject({ total: 11, valid: false });
    expect(validateAdjustmentTotal([{ type: "adjustment", firstScore: -10.01 }])).toMatchObject({ valid: false });
    expect(validateAdjustmentTotal([{ type: "adjustment", label: "工作态度", minScore: -3, maxScore: 3, secondScore: 4 }], "secondScore")).toMatchObject({ valid: false, reason: "“工作态度”评分必须在-3至3分之间" });
  });

  test("任一级出现非零加减分时整组共用材料至少上传一个文件", () => {
    const rows = [
      { type: "adjustment", firstScore: 0, secondScore: 0 },
      { type: "adjustment", firstScore: 0, secondScore: 2 },
    ];
    expect(validateAdjustmentEvidence(rows, [], ["firstScore"])).toMatchObject({ required: false, valid: true });
    expect(validateAdjustmentEvidence(rows, [], ["firstScore", "secondScore"])).toMatchObject({ required: true, valid: false });
    expect(validateAdjustmentEvidence(rows, [{ name: "复评材料.pdf" }], ["firstScore", "secondScore"])).toMatchObject({ required: true, valid: true });
  });

  test.each([
    [100, "S"], [80, "S"], [79.99, "A"], [70, "A"], [69.99, "B"],
    [60, "B"], [59.99, "C"], [55, "C"], [54.99, "D"],
  ])("分数%s对应等级%s", (score, grade) => expect(getGrade(score)).toBe(grade));

  test("目标下发与委员会操作使用统一文案并追加日志", () => {
    const review = { id: "rv-workflow", status: REVIEW_STATUS.targetIssue, operationLogs: [] };
    expect(getWorkflowAction(review)).toEqual({ type: "issue_target", label: "下发月度绩效目标", nextStatus: REVIEW_STATUS.employeeConfirm });
    const next = applyWorkflowAction(review, { type: "issue_target", operator: "江晚", note: "下发7月目标", actedAt });
    expect(next.status).toBe(REVIEW_STATUS.employeeConfirm);
    expect(next.operationLogs[0]).toMatchObject({ action: "下发月度绩效目标", operator: "江晚" });
    expect(getWorkflowAction({ status: REVIEW_STATUS.hrReview }).label).toBe("BP评分与评语");
    expect(getWorkflowAction({ status: REVIEW_STATUS.committeeApproval }).label).toBe("绩效委员会审核");
    expect(getWorkflowAction({ status: REVIEW_STATUS.appealSubmitted })).toEqual({ type: "accept_appeal", label: "受理绩效申诉", nextStatus: REVIEW_STATUS.appealInvestigation });
    expect(getWorkflowAction({ status: REVIEW_STATUS.appealInvestigation })).toEqual({ type: "adjudicate_appeal", label: "填写处理记录并提交绩效委员会", nextStatus: REVIEW_STATUS.appealInProgress });
    expect(getWorkflowAction({ status: REVIEW_STATUS.appealInProgress }).label).toBe("绩效委员会复核申诉");
  });

  test("员工提出异议后回到Leader并可重新确认", () => {
    const review = { id: "rv-dispute", employee: "张小北", directLeader: "江晚", status: REVIEW_STATUS.employeeConfirm, version: 1, operationLogs: [] };
    expect(raiseTargetDispute(review, { reason: "目标范围需调整", operator: "张小北", actedAt, expectedVersion: 1 }).review).toMatchObject({ status: REVIEW_STATUS.targetDispute, owner: "江晚", version: 2 });
    expect(raiseTargetDispute(review, { reason: "", operator: "张小北", actedAt, expectedVersion: 1 })).toMatchObject({ ok: false, code: "VALIDATION" });
  });

  test("目标变更生成V2，员工确认后V1归档", () => {
    const targets = [
      { id: "delivery", name: "调整后的交付目标", dimensionName: "本月重点", type: "weighted", origin: "template", weight: 80, standards: [{ id: "s1", label: "达标", scoreRange: "80-100", description: "按调整后的目标交付" }] },
      { id: "growth", name: "调整后的成长目标", dimensionName: "个人成长", type: "weighted", origin: "personal", weight: 20 },
    ];
    const review = { id: "rv-change", status: REVIEW_STATUS.resultEntry, activeTargetVersion: 1, version: 3, rows: [{ key: "delivery", label: "原交付目标", selfText: "已填写结果" }], targetVersions: [{ version: 1, status: "已生效" }], operationLogs: [] };
    const changed = createTargetChange(review, { reason: "项目范围调整", targets, operator: "江晚", actedAt, expectedVersion: 3 });
    expect(changed.review).toMatchObject({ pendingTargetVersion: 2, activeTargetVersion: 1, status: REVIEW_STATUS.employeeConfirm });
    expect(changed.review.targetVersions.map((item) => item.status)).toEqual(["已生效", "待员工确认"]);
    const confirmed = confirmTargetVersion(changed.review, { operator: "张小北", actedAt, expectedVersion: 4 });
    expect(confirmed.review).toMatchObject({ activeTargetVersion: 2, pendingTargetVersion: null, status: REVIEW_STATUS.resultEntry });
    expect(confirmed.review.targetVersions.map((item) => item.status)).toEqual(["已归档", "已生效"]);
    expect(confirmed.review.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "delivery", label: "调整后的交付目标", section: "本月重点", weight: 0.8, selfText: "已填写结果" }),
      expect.objectContaining({ key: "growth", label: "调整后的成长目标", section: "个人成长", weight: 0.2 }),
    ]));
    expect(confirmed.review.rows[0].standards[0].description).toBe("按调整后的目标交付");
  });

  test("下发目标快照可完整转换为后续填报与评分行", () => {
    const rows = materializeTargetRows([
      { id: "custom-delivery", dimensionName: "自定义交付维度", name: "本月定制交付", weight: 65, requirement: "完成本月定制内容", standards: [{ id: "excellent", label: "优秀", scoreRange: "90-100", description: "超额完成定制内容" }], source: "月度下发目标" },
      { id: "custom-quality", dimensionName: "自定义质量维度", name: "本月定制质量", weight: 35, requirement: "达到定制质量要求", standards: [] },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ key: "custom-delivery", label: "本月定制交付", section: "自定义交付维度", standard: "完成本月定制内容", weight: 0.65, type: "metric" });
    expect(rows[0].standards).toEqual([{ id: "excellent", label: "优秀", scoreRange: "90-100", description: "超额完成定制内容" }]);
    expect(rows[1]).toMatchObject({ label: "本月定制质量", section: "自定义质量维度", weight: 0.35 });
  });

  test("员工拒绝V2时V1继续生效且历史版本保留", () => {
    const review = { id: "rv-reject", status: REVIEW_STATUS.employeeConfirm, version: 2, activeTargetVersion: 1, pendingTargetVersion: 2, targetVersions: [{ version: 1, status: "已生效" }, { version: 2, status: "待员工确认" }], operationLogs: [] };
    const result = rejectTargetVersion(review, { reason: "资源未同步", operator: "张小北", actedAt, expectedVersion: 2 });
    expect(result.review).toMatchObject({ activeTargetVersion: 1, pendingTargetVersion: null, status: REVIEW_STATUS.resultEntry });
    expect(result.review.targetVersions.map((item) => item.status)).toEqual(["已生效", "已拒绝"]);
  });

  test("Leader退回结果只改变流程状态并保留员工原始行", () => {
    const rows = [{ id: "target-1", selfText: "员工原始填报", evidence: "附件A" }];
    const result = returnResultForSupplement({ id: "rv-return", status: REVIEW_STATUS.firstReview, version: 1, rows, operationLogs: [] }, { reason: "证明材料不足", operator: "江晚", actedAt });
    expect(result.review).toMatchObject({ status: REVIEW_STATUS.resultEntry, resultStatus: "已退回补充", rows });
    expect(result.review.operationLogs[0].snapshot.rows).toEqual(rows);
  });

  test("申诉成立生成新的结果版本且原V1归档", () => {
    const review = { id: "rv-appeal", status: REVIEW_STATUS.appealInProgress, version: 5, rows: [], resultVersions: [{ version: 1, score: 68, grade: "B", status: "已生效" }], operationLogs: [] };
    const result = resolveAppealResult(review, { decision: "approved", correctedScore: 72, reason: "新证据成立", operator: "CEO", actedAt });
    expect(result.review).toMatchObject({ status: REVIEW_STATUS.archived, appealStatus: "申诉成立" });
    expect(result.review.resultVersions).toEqual([
      expect.objectContaining({ version: 1, status: "已归档", score: 68 }),
      expect.objectContaining({ version: 2, status: "已生效", score: 72, grade: "A" }),
    ]);
  });

  test("各角色只能执行自己的流程节点且Leader受责任范围限制", () => {
    const review = { employee: "张小北", directLeader: "江晚", indirectLeader: "林总" };
    expect(canPerformReviewAction("employee", "confirm_target", review, "张小北")).toBe(true);
    expect(canPerformReviewAction("employee", "confirm_target", review, "其他员工")).toBe(false);
    expect(canPerformReviewAction("leader", "first_score", review, "江晚")).toBe(true);
    expect(canPerformReviewAction("leader", "first_score", review, "其他Leader")).toBe(false);
    expect(canPerformReviewAction("hr", "committee_approve", review, "HR-唐宁")).toBe(false);
    expect(canPerformReviewAction("hr", "accept_appeal", review, "HR-唐宁")).toBe(true);
    expect(canPerformReviewAction("hr", "adjudicate_appeal", review, "HR-唐宁")).toBe(true);
    expect(canPerformReviewAction("ceo", "hr_review", review, "CEO")).toBe(false);
    expect(canPerformReviewAction("ceo", "committee_approve", review, "CEO")).toBe(true);
  });

  test("版本冲突阻止重复覆盖", () => {
    const result = confirmTargetVersion({ id: "rv-conflict", status: REVIEW_STATUS.employeeConfirm, version: 2, operationLogs: [] }, { operator: "张小北", actedAt, expectedVersion: 1 });
    expect(result).toMatchObject({ ok: false, code: "VERSION_CONFLICT" });
  });

  test("标签、筛选与种子数据保持可用", () => {
    const review = { roleTemplateId: ROLE_TEMPLATE_IDS.producer, roleTemplateName: "制片" };
    expect(getReviewTemplate(review).name).toBe("制片");
    expect(matchesTemplateFilter(review, ROLE_TEMPLATE_IDS.producer)).toBe(true);
    const reviews = [{ status: REVIEW_STATUS.firstReview }, { status: REVIEW_STATUS.archived }, { status: REVIEW_STATUS.appealSubmitted }];
    expect(matchesPerformanceTab(reviews[0], "pending")).toBe(true);
    expect(matchesPerformanceTab(reviews[2], "appeal")).toBe(true);
    expect(isPendingReviewStatus(REVIEW_STATUS.firstReview)).toBe(true);
    expect(getPendingReviewCount(reviews)).toBe(1);
    expect(getOpenAppealCount(reviews)).toBe(1);
    expect(performanceTemplate.map((item) => item.section)).toEqual(roleTemplates.map((item) => item.name));
    expect(reviewsSeed.length).toBeGreaterThan(8);
    expect(reviewsSeed.every((item) => Array.isArray(item.operationLogs))).toBe(true);
    expect(reviewsSeed.map((item) => item.status)).toEqual(expect.arrayContaining([
      REVIEW_STATUS.targetDispute,
      REVIEW_STATUS.executing,
      REVIEW_STATUS.appealInvestigation,
      REVIEW_STATUS.appealInProgress,
    ]));
  });

  test("岗位模板行仍可参与新评分公式", () => {
    const rows = createRowsFromTemplate(ROLE_TEMPLATE_IDS.editor, {
      editOutput: { firstScore: 80, secondScore: 70 }, editQuality: { firstScore: 85, secondScore: 75 },
      editEfficiency: { firstScore: 78, secondScore: 72 }, editAsset: { firstScore: 2, secondScore: 1 },
    }).map((row) => ({ ...row, assistScore: row.secondScore, bpScore: row.secondScore, adjustmentScore: row.firstScore }));
    expect(calcScore({ rows, assistScoreEnabled: true })).toBeGreaterThan(70);
  });

  test("BP或原下发负责人修改协助评分后清空受影响评分并回到正确节点", () => {
    const review = { id: "rv-assist", employee: "张小北", subjectType: "employee", status: REVIEW_STATUS.committeeApproval, assistScoreEnabled: true, assistReviewer: "王晨", rows: [{ type: "weighted", assistScore: 80, assistComment: "完成", bpScore: 82, bpComment: "完成" }], operationLogs: [], version: 1 };
    const result = updateAssistanceConfiguration(review, { enabled: false, reviewer: "", reason: "协助人岗位调整", operator: "BP-唐宁", actedAt });
    expect(result).toMatchObject({ ok: true, review: { status: REVIEW_STATUS.hrReview, assistScoreEnabled: false, version: 2 } });
    expect(result.review.rows[0]).toMatchObject({ assistScore: "", assistComment: "", bpScore: "", bpComment: "" });
    expect(result.review.operationLogs[0].note).toContain("已清空协助评分与BP评分");
  });

  test("协助评分人不能与被考核人或既有评分人重复", () => {
    const review = { id: "rv-assist-repeat", employee: "张小北", subjectType: "employee", firstReviewer: "江晚", bpReviewer: "BP-唐宁", status: REVIEW_STATUS.firstReview, rows: [], operationLogs: [] };
    expect(updateAssistanceConfiguration(review, { enabled: true, reviewer: "江晚", reason: "测试重复", operator: "BP-唐宁", actedAt })).toMatchObject({ ok: false, code: "VALIDATION" });
    expect(updateAssistanceConfiguration(review, { enabled: true, reviewer: "BP-唐宁", reason: "测试重复", operator: "BP-唐宁", actedAt })).toMatchObject({ ok: false, code: "VALIDATION" });
  });

  test("全流程测试数据可由现有四种角色依次完成所有主流程节点", () => {
    let review = createFullFlowTestReview();
    expect(review).toMatchObject({
      id: FULL_FLOW_TEST_REVIEW_ID,
      employee: "张小北",
      directLeader: "江晚",
      indirectLeader: "磊姐",
      status: REVIEW_STATUS.targetIssue,
      isFullFlowTest: true,
    });
    expect(review.rows.filter((row) => row.type !== "section").every(
      (row) => row.selfText && row.completionNote && row.evidence,
    )).toBe(true);

    const steps = [
      { role: "leader", viewer: "江晚", type: "issue_target", from: REVIEW_STATUS.targetIssue },
      { role: "employee", viewer: "张小北", type: "confirm_target", from: REVIEW_STATUS.employeeConfirm },
      { role: "employee", viewer: "张小北", type: "enter_result", from: REVIEW_STATUS.resultEntry },
      { role: "leader", viewer: "江晚", type: "first_score", from: REVIEW_STATUS.firstReview },
      { role: "leader", viewer: "磊姐", type: "second_review", from: REVIEW_STATUS.secondReview },
      { role: "hr", viewer: "BP-唐宁", type: "hr_review", from: REVIEW_STATUS.hrReview },
      { role: "ceo", viewer: "CEO", type: "committee_approve", from: REVIEW_STATUS.committeeApproval },
      { role: "leader", viewer: "江晚", type: "interview_feedback", from: REVIEW_STATUS.feedback },
    ];

    steps.forEach((step) => {
      expect(review.status).toBe(step.from);
      expect(canPerformReviewAction(step.role, step.type, review, step.viewer)).toBe(true);
      review = applyWorkflowAction(review, {
        type: step.type,
        operator: step.viewer,
        actedAt,
      });
    });
    expect(review.status).toBe(REVIEW_STATUS.archived);
    expect(review.operationLogs).toHaveLength(9);
  });

  test("二级结果审核退回时保留审核结论和退回状态", () => {
    const review = {
      id: "rv-second-review-return",
      status: REVIEW_STATUS.secondReview,
      resultStatus: "已补充",
      rows: [],
      operationLogs: [],
    };
    const next = applyWorkflowAction(review, {
      type: "second_review",
      operator: "二级Leader",
      actedAt,
      nextStatus: REVIEW_STATUS.resultEntry,
      note: "二级结果审核退回员工补充：证明材料口径不完整",
      updates: {
        resultStatus: "已退回补充",
        secondReviewConclusion: "退回员工补充",
        secondReviewComment: "证明材料口径不完整",
      },
    });

    expect(next).toMatchObject({
      status: REVIEW_STATUS.resultEntry,
      resultStatus: "已退回补充",
      secondReviewConclusion: "退回员工补充",
      secondReviewComment: "证明材料口径不完整",
    });
    expect(next.operationLogs[0].note).toContain("二级结果审核退回员工补充");
  });
});
