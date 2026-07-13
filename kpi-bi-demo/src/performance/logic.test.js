import { describe, expect, test } from "vitest";
import {
  REVIEW_STATUS,
  applyWorkflowAction,
  calcRowScore,
  calcScore,
  getGrade,
  getNextReviewStatus,
  getOpenAppealCount,
  getPendingReviewCount,
  getReviewTemplate,
  getWorkflowAction,
  isPendingReviewStatus,
  matchesPerformanceTab,
  matchesTemplateFilter,
  requiresSecondReview,
} from "./logic";
import { performanceTemplate, reviewsSeed } from "./seed";
import {
  ROLE_TEMPLATE_IDS,
  createRowsFromTemplate,
  getRoleTemplate,
  getRoleTemplateOptions,
  roleTemplates,
} from "./roleTemplates";

describe("performance scoring", () => {
  test("defines content-operation role templates with template options", () => {
    expect(roleTemplates.length).toBeGreaterThan(8);
    expect(getRoleTemplateOptions()[0]).toEqual({ value: "all", label: "全部岗位模板" });
    expect(getRoleTemplate(ROLE_TEMPLATE_IDS.editor).businessLines).toEqual(["剪辑中心", "初级剪辑师 / 中级剪辑师"]);
  });

  test("creates weighted rows from the editor template and keeps scoring rules", () => {
    const rows = createRowsFromTemplate(ROLE_TEMPLATE_IDS.editor, {
      editOutput: { selfText: "本月剪辑产出达标", firstScore: 80, secondScore: 70 },
      editQuality: { selfText: "一次通过率稳定", firstScore: 85, secondScore: 75 },
      editEfficiency: { selfText: "按时交付率达标", firstScore: 78, secondScore: 72 },
      editAsset: { selfText: "沉淀高光模板", firstScore: 2, secondScore: 1 },
    });

    const metricRows = rows.filter((row) => row.type !== "section");
    expect(metricRows.map((row) => row.label)).toEqual([
      "剪辑产出总量",
      "返修与一次通过率",
      "按时交付率",
      "方法与素材沉淀",
    ]);
    expect(calcScore({ rows })).toBeCloseTo(79, 1);
  });

  test("matches review template filters and falls back to review template names", () => {
    const review = {
      roleTemplateId: ROLE_TEMPLATE_IDS.producer,
      roleTemplateName: "制片",
    };

    expect(getReviewTemplate(review).name).toBe("制片");
    expect(matchesTemplateFilter(review, "all")).toBe(true);
    expect(matchesTemplateFilter(review, ROLE_TEMPLATE_IDS.producer)).toBe(true);
    expect(matchesTemplateFilter(review, ROLE_TEMPLATE_IDS.editor)).toBe(false);
  });

  test("calculates weighted row scores and final score from leader ratios", () => {
    const review = {
      rows: [
        { type: "weighted", weight: 0.4, firstScore: 75, secondScore: 65 },
        { type: "weighted", weight: 0.3, firstScore: 85, secondScore: 65 },
        { type: "adjustment", firstScore: 3, secondScore: 0 },
      ],
    };

    expect(calcRowScore(review.rows[0])).toBeCloseTo(28.4, 1);
    expect(calcRowScore(review.rows[1])).toBeCloseTo(23.1, 1);
    expect(calcRowScore(review.rows[2])).toBeCloseTo(1.8, 1);
    expect(calcScore(review)).toBeCloseTo(53.3, 1);
  });

  test("supports reviews that only require first-level scoring", () => {
    const review = {
      requiresSecondReview: false,
      status: REVIEW_STATUS.firstReview,
      rows: [
        { type: "weighted", weight: 0.4, firstScore: 80, secondScore: 0 },
        { type: "weighted", weight: 0.3, firstScore: 70, secondScore: 0 },
        { type: "adjustment", firstScore: 2, secondScore: 0 },
      ],
    };

    expect(requiresSecondReview(review)).toBe(false);
    expect(calcScore(review)).toBeCloseTo(55, 1);
    expect(getNextReviewStatus(review)).toBe(REVIEW_STATUS.hrReview);
    expect(getWorkflowAction(review).nextStatus).toBe(REVIEW_STATUS.hrReview);
  });

  test("maps grades and workflow transitions", () => {
    expect(getGrade(92)).toBe("A");
    expect(getGrade(66.8)).toBe("C");
    expect(getNextReviewStatus(REVIEW_STATUS.firstReview)).toBe(REVIEW_STATUS.secondReview);
    expect(getNextReviewStatus(REVIEW_STATUS.feedback)).toBe(REVIEW_STATUS.archived);
  });

  test("advances workflow actions and appends operation logs", () => {
    const review = {
      id: "rv-workflow",
      status: REVIEW_STATUS.targetIssue,
      operationLogs: [],
    };

    expect(getWorkflowAction(review)).toEqual({
      type: "issue_target",
      label: "下发月度OKR",
      nextStatus: REVIEW_STATUS.employeeConfirm,
    });

    const nextReview = applyWorkflowAction(review, {
      type: "issue_target",
      operator: "江晚",
      note: "已按组织层级下发 7 月 OKR",
      actedAt: "2026-07-07 10:20",
    });

    expect(nextReview.status).toBe(REVIEW_STATUS.employeeConfirm);
    expect(nextReview.lastActionName).toBe("下发月度OKR");
    expect(nextReview.operationLogs[0]).toMatchObject({
      action: "下发月度OKR",
      operator: "江晚",
      fromStatus: REVIEW_STATUS.targetIssue,
      toStatus: REVIEW_STATUS.employeeConfirm,
    });
    expect(getWorkflowAction({ status: REVIEW_STATUS.archived })).toBeNull();
  });

  test("maps table tabs to status rules and counts open appeals", () => {
    const reviews = [
      { status: REVIEW_STATUS.firstReview, appealStatus: "无申诉" },
      { status: REVIEW_STATUS.archived, appealStatus: "已结束" },
      { status: REVIEW_STATUS.appealInProgress, appealStatus: "待综合管理中心调查" },
    ];

    expect(matchesPerformanceTab(reviews[0], "pending")).toBe(true);
    expect(matchesPerformanceTab(reviews[1], "archived")).toBe(true);
    expect(matchesPerformanceTab(reviews[2], "appeal")).toBe(true);
    expect(isPendingReviewStatus(REVIEW_STATUS.firstReview)).toBe(true);
    expect(isPendingReviewStatus(REVIEW_STATUS.appealInProgress)).toBe(false);
    expect(getPendingReviewCount(reviews)).toBe(1);
    expect(getOpenAppealCount(reviews)).toBe(1);
  });

  test("seed reviews cover role templates and production workflow metadata", () => {
    expect(performanceTemplate.map((item) => item.section)).toEqual(roleTemplates.map((item) => item.name));
    expect(reviewsSeed.length).toBeGreaterThan(8);
    expect(reviewsSeed[0].status).toBe(REVIEW_STATUS.targetIssue);
    expect(reviewsSeed.every((item) => item.lastActionAt)).toBe(true);
    expect(reviewsSeed.every((item) => item.owner)).toBe(true);
    expect(reviewsSeed.every((item) => Array.isArray(item.operationLogs))).toBe(true);
    expect(reviewsSeed.every((item) => item.rows.some((row) => row.type === "section"))).toBe(true);
  });
});
