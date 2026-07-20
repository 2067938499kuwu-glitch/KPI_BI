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
        offer: 3,
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
        offer: 999,
        accepted: 999,
        onboarded: 999,
        difference: 9,
      },
    ];

    const funnel = selectRecruitmentFunnel(reports);
    const summary = selectRecruitmentSummary({ reports });

    expect(funnel[0]).toMatchObject({ label: "打招呼", value: 100 });
    expect(funnel.map((item) => item.label)).toEqual([
      "打招呼",
      "面试",
      "通过",
      "Offer发放",
      "Offer接受",
      "入职",
    ]);
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
        title: "确认候选人是否进入面试",
        assigneeRole: "部门负责人",
        status: "待处理",
        issuedAt: "待记录",
      }),
    ]);
    expect(tasks[0]).not.toHaveProperty("due");
    expect(tasks[0]).not.toHaveProperty("flag");

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
    ).toEqual([
      expect.objectContaining({
        title: "确认候选人面试的时间以及面试官",
        assigneeRole: "招聘负责人",
      }),
    ]);
  });

  test("工作台可从绩效与周报来源生成专属任务详情", () => {
    const tasks = selectWorkbenchTasks({
      reviews: [
        {
          id: "RV-1",
          employee: "张小北",
          department: "剪辑中心",
          role: "中级剪辑师",
          cycle: "2026-07",
          status: "待员工填报结果",
          owner: "张小北",
          directLeader: "江晚",
          indirectLeader: "磊姐",
          roleTemplateName: "剪辑岗位绩效模板",
          evidence: "剪辑交付记录",
          lastActionAt: "2026-07-20 09:00",
        },
      ],
      weeklyReports: [
        {
          id: "WR-1",
          employeeId: "emp-001",
          period: {
            label: "2026年W30",
            start: "2026-07-20",
            end: "2026-07-26",
          },
          status: "missing",
          achievements: [],
          risks: [],
          nextPlan: [],
        },
      ],
      people: [
        {
          employeeId: "emp-001",
          name: "张小北",
          department: "剪辑中心",
          role: "中级剪辑师",
          leader: "江晚",
        },
      ],
    });

    expect(tasks.map((task) => task.module)).toEqual(["绩效", "周报"]);
    expect(tasks.map((task) => task.title)).toEqual([
      "确认2026-07绩效目标",
      "提交2026年W30周报",
    ]);
    expect(tasks.map((task) => task.status)).toEqual(["待处理", "待处理"]);
    expect(tasks.map((task) => task.issuedAt)).toEqual([
      "2026-07-20 09:00",
      "2026-07-20 09:00",
    ]);
    expect(tasks[0].detail.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "绩效模板", value: "剪辑岗位绩效模板" }),
      ]),
    );
    expect(tasks[1]).toMatchObject({
      title: "提交2026年W30周报",
      assigneeRole: "周报填报人",
      dispatcher: "江晚",
      detail: {
        contentSections: expect.arrayContaining([
          expect.objectContaining({ title: "本周成果" }),
          expect.objectContaining({ title: "风险与问题" }),
          expect.objectContaining({ title: "下周计划" }),
        ]),
      },
    });
  });

  test("工作台映射招聘、项目与 SSC 的统一任务标题", () => {
    const recruitmentAndSscTasks = selectWorkbenchTasks({
      candidates: [
        {
          owner: "招聘负责人",
          updatedAt: "2026-07-20 09:00",
          applications: [
            { id: "APP-1", job: "编剧", status: "待部门确认" },
            { id: "APP-2", job: "编剧", status: "待安排面试" },
            { id: "APP-3", job: "编剧", status: "待面试反馈" },
            { id: "APP-4", job: "编剧", status: "Offer待发" },
            { id: "APP-5", job: "编剧", status: "Offer已发" },
            { id: "APP-6", job: "编剧", status: "待入职" },
          ],
        },
      ],
      projects: [
        {
          id: "PRJ-1",
          projectCode: "PRJ-001",
          name: "《示例项目》",
          mode: "内部制作",
          status: "进行中",
          start: "2026-07-01",
          videoEpisodes: 24,
          taskAssignments: [
            { role: "编剧", owner: "负责人A", issuedAt: "2026-07-01 09:00", completed: 6, total: 24 },
            { role: "制作", owner: "负责人B", issuedAt: "2026-07-01 09:00", completed: 0, total: 24 },
            { role: "剪辑", owner: "负责人C", issuedAt: "2026-07-01 09:00", completed: 12, total: 24 },
            { role: "制片", owner: "负责人D", issuedAt: "2026-07-01 09:00", completed: 18, total: 24 },
          ],
        },
      ],
    });

    expect(recruitmentAndSscTasks.map((task) => task.title)).toEqual(
      expect.arrayContaining([
        "确认候选人是否进入面试",
        "确认候选人面试的时间以及面试官",
        "提交候选人面试反馈",
        "确认是否发放 Offer",
        "确认是否已接受（同步到 SSC）",
        "《示例项目》 · 进行7-12剧集的上传",
        "《示例项目》 · 进行1-6剧集的制作",
        "《示例项目》 · 进行13-18剧集的剪辑",
        "《示例项目》 · 进行19-24剧集的审核",
        "进行人员花名册的添加",
      ]),
    );
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
