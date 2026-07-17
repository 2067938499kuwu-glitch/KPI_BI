import { describe, expect, test } from "vitest";
import {
  selectRecruitmentDecisionAnalysis,
  selectRecruitmentFunnel,
  selectRecruitmentSummary,
  selectProjectCostBreakdown,
  selectProjectSummary,
  selectWorkbenchTasks,
} from "./demoSelectors";

describe("演示数据统计选择器", () => {
  test("内部短剧真实成本由人力、算力和投流成本汇总", () => {
    const internalProject = {
      mode: "内部制作",
      budget: 200000,
      actual: 999999,
      manpowerCost: 80000,
      computeCost: 45000,
      trafficCost: 25000,
    };
    const externalProject = {
      mode: "外部制作",
      budget: 100000,
      actual: 60000,
    };

    expect(selectProjectCostBreakdown(internalProject)).toEqual({
      manpowerCost: 80000,
      computeCost: 45000,
      trafficCost: 25000,
      total: 150000,
    });
    expect(selectProjectSummary([internalProject, externalProject])).toMatchObject({
      totalActual: 210000,
      internalActual: 150000,
      manpowerCost: 80000,
      computeCost: 45000,
      trafficCost: 25000,
      costExecutionRate: 70,
    });
  });

  test("招聘漏斗只纳入已提交且截图完整的日报", () => {
    const reports = [
      {
        status: "已提交",
        screenshots: 1,
        hello: 100,
        reply: 50,
        resume: 30,
        valid: 20,
        invite: 10,
        interview: 8,
        passed: 4,
        accepted: 2,
        onboarded: 1,
        difference: 1,
      },
      {
        status: "草稿",
        screenshots: 3,
        hello: 999,
        reply: 999,
        resume: 999,
        valid: 999,
        invite: 999,
        interview: 999,
        passed: 999,
        accepted: 999,
        onboarded: 999,
        difference: 9,
      },
    ];

    const funnel = selectRecruitmentFunnel(reports);
    const summary = selectRecruitmentSummary({ reports });

    expect(funnel[0]).toMatchObject({ label: "打招呼", value: 100 });
    expect(funnel.at(-1)).toMatchObject({ label: "入职", value: 1 });
    expect(summary.includedReports).toHaveLength(1);
    expect(summary.excludedReports).toHaveLength(1);
    expect(summary.reportDifferences).toBe(1);
  });

  test("工作台任务由来源业务状态生成而不是独立台账", () => {
    const tasks = selectWorkbenchTasks({
      candidates: [
        {
          owner: "招聘A",
          applications: [
            {
              id: "APP-1",
              job: "编剧",
              status: "待部门确认",
              departmentLeader: "部门负责人A",
              interviewer: "面试官A",
            },
          ],
        },
      ],
      topics: [],
      projects: [],
    });

    expect(tasks).toEqual([
      expect.objectContaining({
        businessId: "APP-1",
        sourceType: "recruitment",
        sourceId: "APP-1",
        owner: "部门负责人A",
      }),
    ]);

    expect(
      selectWorkbenchTasks({
        candidates: [
          {
            applications: [
              { id: "APP-1", job: "编剧", status: "待安排面试" },
            ],
          },
        ],
        topics: [],
        projects: [],
      }),
    ).toHaveLength(0);
  });

  test("招聘结论按流失原因和面试官结构化汇总", () => {
    const analysis = selectRecruitmentDecisionAnalysis([
      {
        name: "候选人A",
        applications: [
          {
            status: "面试未通过",
            rejection: {
              stage: "interview",
              category: "专业能力不足",
            },
            interviews: [
              { round: 1, interviewer: "面试官A", status: "未通过" },
            ],
          },
        ],
      },
      {
        name: "候选人B",
        applications: [
          {
            status: "Offer已拒绝",
            rejection: { stage: "offer", category: "接受其他 Offer" },
            interviews: [
              { round: 1, interviewer: "面试官A", status: "已通过" },
            ],
          },
        ],
      },
    ]);

    expect(analysis.reasons.interview).toMatchObject({ total: 1 });
    expect(analysis.reasons.offer.categories[0]).toMatchObject({
      category: "接受其他 Offer",
      rate: 100,
    });
    expect(analysis.interviewers[0]).toMatchObject({
      interviewer: "面试官A",
      assigned: 2,
      completed: 2,
      passed: 1,
      failed: 1,
      passRate: 50,
    });
  });
});
