const FUNNEL_FIELDS = [
  ["打招呼", "hello"],
  ["回复", "reply"],
  ["获取简历", "resume"],
  ["有效简历", "valid"],
  ["邀约", "invite"],
  ["面试", "interview"],
  ["通过", "passed"],
  ["Offer接受", "accepted"],
  ["入职", "onboarded"],
];

export function selectIncludedRecruitmentReports(reports = []) {
  return reports.filter(
    (report) => report.status === "已提交" && Number(report.screenshots) > 0,
  );
}

export function selectRecruitmentFunnel(reports = []) {
  const included = selectIncludedRecruitmentReports(reports);
  const totals = included.reduce((result, report) => {
    FUNNEL_FIELDS.forEach(([, field]) => {
      result[field] += Number(report[field] ?? 0);
    });
    return result;
  }, Object.fromEntries(FUNNEL_FIELDS.map(([, field]) => [field, 0])));

  return FUNNEL_FIELDS.map(([label, field], index) => {
    const previous = index ? totals[FUNNEL_FIELDS[index - 1][1]] : 0;
    const value = totals[field];
    return {
      label,
      field,
      value,
      rate: index === 0 ? "100%" : previous ? `${((value / previous) * 100).toFixed(1)}%` : "0%",
    };
  });
}

export function selectRecruitmentSummary({ jobs = [], candidates = [], reports = [] }) {
  const applications = candidates.flatMap((candidate) => candidate.applications ?? []);
  const included = selectIncludedRecruitmentReports(reports);
  const funnel = selectRecruitmentFunnel(reports);
  const activeJobs = jobs.filter((job) => job.status === "招聘中");
  const need = activeJobs.reduce((sum, job) => sum + Number(job.need ?? 0), 0);
  const onboarded = activeJobs.reduce(
    (sum, job) => sum + Number(job.onboarded ?? 0),
    0,
  );
  return {
    funnel,
    includedReports: included,
    excludedReports: reports.filter((report) => !included.includes(report)),
    activeJobs: activeJobs.length,
    need,
    onboarded,
    gap: Math.max(0, need - onboarded),
    pendingDepartment: applications.filter(
      (application) => application.status === "待部门确认",
    ).length,
    officialHires: applications.filter((application) =>
      ["实习期", "已转正"].includes(application.status),
    ).length,
    reportDifferences: included.reduce(
      (sum, report) => sum + Number(report.difference ?? 0),
      0,
    ),
  };
}

export function selectRecruitmentDecisionAnalysis(candidates = []) {
  const applications = candidates.flatMap((candidate) =>
    (candidate.applications ?? []).map((application) => ({
      ...application,
      candidateName: candidate.name,
    })),
  );
  const rejectionStages = ["resume", "interview", "offer"];
  const reasons = Object.fromEntries(
    rejectionStages.map((stage) => {
      const stageApplications = applications.filter(
        (application) => application.rejection?.stage === stage,
      );
      const categoryTotals = stageApplications.reduce((totals, application) => {
        const category = application.rejection?.category || "未分类";
        totals[category] = (totals[category] ?? 0) + 1;
        return totals;
      }, {});
      const categories = Object.entries(categoryTotals)
        .map(([category, count]) => ({
          category,
          count,
          rate: stageApplications.length
            ? Math.round((count / stageApplications.length) * 100)
            : 0,
        }))
        .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category, "zh-CN"));
      return [
        stage,
        {
          stage,
          total: stageApplications.length,
          categories,
        },
      ];
    }),
  );

  const interviewRecords = applications.flatMap((application) => {
    if (application.interviews?.length) {
      return application.interviews.map((interview) => ({
        ...interview,
        applicationStatus: application.status,
      }));
    }
    return application.interviewer && application.interviewer !== "待分配"
      ? [
          {
            round: application.currentInterviewRound ?? 1,
            interviewer: application.interviewer,
            status:
              application.status === "面试未通过"
                ? "未通过"
                : application.status === "待面试反馈"
                  ? "待反馈"
                  : "待安排",
            applicationStatus: application.status,
          },
        ]
      : [];
  });
  const interviewerNames = [
    ...new Set(
      interviewRecords
        .map((record) => record.interviewer)
        .filter((name) => name && name !== "待分配"),
    ),
  ];
  const interviewers = interviewerNames
    .map((interviewer) => {
      const records = interviewRecords.filter(
        (record) => record.interviewer === interviewer,
      );
      const completed = records.filter((record) =>
        ["已通过", "未通过"].includes(record.status),
      );
      const passed = completed.filter((record) => record.status === "已通过").length;
      const failed = completed.filter((record) => record.status === "未通过").length;
      return {
        interviewer,
        assigned: records.length,
        completed: completed.length,
        passed,
        failed,
        passRate: completed.length ? Math.round((passed / completed.length) * 100) : null,
        rounds: [...new Set(records.map((record) => record.round ?? 1))].sort(
          (left, right) => left - right,
        ),
      };
    })
    .sort((left, right) => right.completed - left.completed || right.assigned - left.assigned);

  return { reasons, interviewers };
}

export function selectTopicSummary(topics = []) {
  const converted = topics.filter((topic) => Boolean(topic.projectId)).length;
  const approved = topics.filter((topic) =>
    ["已通过", "已通过待立项", "已转项目"].includes(topic.status),
  ).length;
  return {
    total: topics.length,
    pending: topics.filter((topic) => topic.status === "待审核").length,
    approved,
    returned: topics.filter((topic) => topic.status === "已退回").length,
    converted,
    conversionRate: approved ? Math.round((converted / approved) * 100) : 0,
  };
}

export function selectProjectCostBreakdown(project = {}) {
  const isInternal = project.mode === "内部制作";
  const hasStructuredCost = ["manpowerCost", "computeCost", "trafficCost"].some(
    (field) => Object.prototype.hasOwnProperty.call(project, field),
  );
  const manpowerCost = isInternal
    ? Number(
        project.manpowerCost ??
          (hasStructuredCost ? 0 : project.actual ?? 0),
      )
    : 0;
  const computeCost = isInternal ? Number(project.computeCost ?? 0) : 0;
  const trafficCost = isInternal ? Number(project.trafficCost ?? 0) : 0;
  const total = isInternal
    ? manpowerCost + computeCost + trafficCost
    : Number(project.actual ?? 0);

  return { manpowerCost, computeCost, trafficCost, total };
}

export function selectProjectSummary(projects = []) {
  const running = projects.filter((project) => project.status === "进行中");
  const completed = projects.filter((project) => project.status === "已完成");
  const delayed = projects.filter((project) =>
    (project.flags ?? []).some((flag) => String(flag).includes("延期")),
  );
  const averageProgress = projects.length
    ? Math.round(
        projects.reduce((sum, project) => sum + Number(project.progress ?? 0), 0) /
          projects.length,
      )
    : 0;
  const totalBudget = projects.reduce(
    (sum, project) => sum + Number(project.budget ?? 0),
    0,
  );
  const costBreakdowns = projects.map(selectProjectCostBreakdown);
  const totalActual = costBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.total,
    0,
  );
  const internalCostBreakdowns = projects
    .filter((project) => project.mode === "内部制作")
    .map(selectProjectCostBreakdown);
  const manpowerCost = internalCostBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.manpowerCost,
    0,
  );
  const computeCost = internalCostBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.computeCost,
    0,
  );
  const trafficCost = internalCostBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.trafficCost,
    0,
  );
  return {
    total: projects.length,
    running: running.length,
    completed: completed.length,
    delayed: delayed.length,
    averageProgress,
    internal: projects.filter((project) => project.mode === "内部制作").length,
    external: projects.filter((project) => project.mode === "外部制作").length,
    totalBudget,
    totalActual,
    internalActual: manpowerCost + computeCost + trafficCost,
    manpowerCost,
    computeCost,
    trafficCost,
    costExecutionRate: totalBudget
      ? Math.round((totalActual / totalBudget) * 100)
      : 0,
  };
}

export function selectWorkbenchTasks({ candidates = [], topics = [], projects = [] }) {
  const recruitmentTasks = candidates.flatMap((candidate) =>
    (candidate.applications ?? [])
      .filter((application) =>
        ["待部门确认", "待面试反馈"].includes(application.status),
      )
      .map((application) => ({
        id: `WB-${application.id}`,
        businessId: application.id,
        sourceType: "recruitment",
        sourceId: application.id,
        module: "招聘",
        title:
          application.status === "待部门确认"
            ? "确认候选人是否进入面试"
            : "提交候选人面试反馈",
        owner: application.interviewer || candidate.owner,
        status: "待处理",
        due: application.status === "待部门确认" ? "逾期 1 天" : "今天 18:00",
        flag: application.status === "待部门确认" ? "已逾期" : "今日到期",
        priority: "高",
        destination: "recruitment",
        description: `${candidate.name}应聘${application.job}，需在招聘业务单据中完成当前节点。`,
      })),
  );

  const topicTasks = topics
    .filter((topic) => topic.status === "已退回")
    .map((topic) => ({
      id: `WB-${topic.id}`,
      businessId: topic.id,
      sourceType: "topic",
      sourceId: topic.id,
      module: "选题",
      title: `修改${topic.name}选题方案`,
      owner: topic.submitter,
      status: "已退回",
      due: "明天 12:00",
      flag: "已退回",
      priority: "高",
      destination: "topics",
      description: topic.reason || "按审核意见补充选题信息后重新提交。",
    }));

  const topicProjectTasks = topics
    .filter((topic) => topic.status === "已通过待立项" && !topic.projectId)
    .map((topic) => ({
      id: `WB-PROJECT-${topic.id}`,
      businessId: topic.id,
      sourceType: "topic-project",
      sourceId: topic.id,
      module: "选题",
      title: `为${topic.name}创建项目`,
      owner: topic.submitter,
      status: "待处理",
      due: "今天 18:00",
      flag: "今日到期",
      priority: "普通",
      destination: "topics",
      quickAction: false,
      description: "该选题已审核通过，需要在选题详情中配置负责人、预算和制作方式后创建项目。",
    }));

  const projectTasks = projects
    .filter((project) =>
      (project.flags ?? []).some((flag) => String(flag).includes("延期")),
    )
    .map((project) => ({
      id: `WB-${project.id}`,
      businessId: project.id,
      sourceType: "project",
      sourceId: project.id,
      module: "项目",
      title: `更新${project.name}延期节点`,
      owner: project.owner,
      status: "待处理",
      due: "今天 18:00",
      flag: "今日到期",
      priority: "高",
      destination: "projects",
      description: "更新当前制作环节进度与风险说明，数据将同步到项目台账和驾驶舱。",
    }));

  return [
    ...recruitmentTasks,
    ...topicTasks,
    ...topicProjectTasks,
    ...projectTasks,
  ];
}

export function createMetricDefinition({
  label,
  value,
  unit,
  meta,
  tone,
  target,
  formula,
  sources,
  included,
  excluded = 0,
  updatedAt,
}) {
  return {
    label,
    value,
    unit,
    meta,
    tone,
    target,
    provenance: {
      formula,
      sources,
      included,
      excluded,
      updatedAt,
      version: "演示口径 V1.0",
    },
  };
}
