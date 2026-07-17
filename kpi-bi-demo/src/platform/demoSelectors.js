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

const PROJECT_TASK_CONFIG = [
  {
    role: "编剧",
    department: "内容中心",
    stage: "剧本",
    requirement: "按项目内容方向完成分集剧本、修改记录与最终交付稿。",
  },
  {
    role: "制作",
    department: "AI制作中心",
    stage: "制作",
    requirement: "完成分镜、画面制作与素材版本整理，按节点提交阶段成果。",
  },
  {
    role: "剪辑",
    department: "剪辑中心",
    stage: "剪辑",
    requirement: "完成粗剪、精剪、字幕与成片复核，提交可审核版本。",
  },
  {
    role: "制片",
    department: "制片中心",
    stage: null,
    requirement: "跟进项目排期、资源协调、验收与风险闭环。",
  },
];

function getAssignmentStatus(progress, issuedAt, projectStatus) {
  if (Number(progress) >= 100 || projectStatus === "已完成") return "已完成";
  if (!issuedAt) return "待下发";
  if (Number(progress) > 0) return "进行中";
  return "待接收";
}

export function selectProjectTaskAssignments(project = {}) {
  const issuedAt =
    project.taskDispatchedAt ||
    (project.status !== "未开始" ? `${project.start || "2026-07-17"} 09:00` : "");
  const episodeTotal = Math.max(
    1,
    Number(project.videoEpisodes) ||
      Number(project.scriptEpisodes) ||
      project.videos?.length ||
      project.scripts?.length ||
      60,
  );
  const stored = project.taskAssignments ?? [];
  const configs = project.mode === "外部制作"
    ? PROJECT_TASK_CONFIG.filter((item) => item.role === "制片")
    : PROJECT_TASK_CONFIG;

  return configs.map((config, index) => {
    const saved = stored.find((item) => item.role === config.role) ?? {};
    const stage = (project.stages ?? []).find(
      (item) => item.name === config.stage,
    );
    const progress = Number(
      saved.progress ??
        stage?.progress ??
        (config.role === "制片" ? project.progress ?? 0 : 0),
    );
    const assignmentIssuedAt = saved.issuedAt ?? issuedAt;
    const owner =
      saved.owner ||
      stage?.owner ||
      (config.role === "制片"
        ? project.liaison || project.owner
        : "待分配");
    const total = Number(saved.total) || (config.role === "制片" ? 4 : episodeTotal);
    return {
      id: saved.id || `${project.id}-TASK-${index + 1}`,
      role: config.role,
      department: saved.department || config.department,
      stage: config.stage,
      owner,
      due: saved.due || project.due || project.deadline || "待排期",
      total,
      completed: Number(saved.completed) || Math.round((total * progress) / 100),
      progress,
      status:
        saved.status ||
        getAssignmentStatus(progress, assignmentIssuedAt, project.status),
      issuedAt: assignmentIssuedAt,
      acceptedAt: saved.acceptedAt || "",
      updatedAt: saved.updatedAt || assignmentIssuedAt,
      requirement: saved.requirement || config.requirement,
    };
  });
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
        owner:
          application.status === "待部门确认"
            ? application.departmentLeader || application.interviewer || candidate.owner
            : application.interviewer || candidate.owner,
        status: "待处理",
        due: application.status === "待部门确认" ? "逾期 1 天" : "今天 18:00",
        flag: application.status === "待部门确认" ? "已逾期" : "今日到期",
        priority: "高",
        destination: "recruitment",
        description: `${candidate.name}应聘${application.job}，需在招聘业务单据中完成当前节点。`,
        detail: {
          subjectLabel: "候选人",
          subject: candidate.name,
          summary: `${candidate.name}通过${candidate.source || "招聘渠道"}应聘${application.job}，当前申请处于“${application.status}”节点。`,
          requirement:
            application.status === "待部门确认"
              ? "结合候选人资料与岗位要求，确认是否进入面试；如不进入面试，需同步填写原因分类和具体说明。"
              : `完成第 ${application.currentInterviewRound || 1}/${application.interviewTotal || application.interviews?.length || 1} 轮面试评价，提交面试结论和可追溯的反馈说明。`,
          fields: [
            { label: "应聘岗位", value: application.job },
            { label: "当前招聘节点", value: application.status },
            application.status === "待部门确认"
              ? {
                  label: "部门负责人",
                  value: application.departmentLeader || application.interviewer || "待分配",
                }
              : { label: "面试负责人", value: application.interviewer || "待分配" },
            { label: "招聘负责人", value: candidate.owner || "待分配" },
            { label: "联系电话", value: candidate.phone },
            { label: "邮箱", value: candidate.email },
            { label: "候选人来源", value: candidate.source },
            application.interviews?.[0]?.interviewAt
              ? {
                  label: "面试时间",
                  value: application.interviews[0].interviewAt.replace("T", " "),
                }
              : null,
          ].filter((item) => item?.value),
          sourceLabel: "招聘申请单",
          updatedAt: candidate.updatedAt,
        },
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
      detail: {
        subjectLabel: "选题方案",
        subject: topic.name,
        summary: topic.summary,
        requirement: "根据退回意见补齐方案内容，检查题材、目标受众与制作可行性后重新提交审核。",
        fields: [
          { label: "选题编号", value: topic.id },
          { label: "题材类型", value: topic.genre },
          { label: "目标受众", value: topic.audience },
          { label: "当前版本", value: `V${topic.version}` },
          { label: "提交人", value: topic.submitter },
          { label: "审核人", value: topic.reviewer },
          { label: "当前状态", value: topic.status },
          { label: "使用模板", value: topic.template },
        ].filter((item) => item.value),
        noteLabel: "退回意见",
        note: topic.reason,
        sourceLabel: "选题单",
        updatedAt: topic.updatedAt,
      },
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
      detail: {
        subjectLabel: "待立项选题",
        subject: topic.name,
        summary: topic.summary,
        requirement: "在选题详情中确认项目负责人、计划周期、制作方式和项目预算，信息完整后创建正式项目。",
        fields: [
          { label: "选题编号", value: topic.id },
          { label: "题材类型", value: topic.genre },
          { label: "目标受众", value: topic.audience },
          { label: "审核状态", value: topic.status },
          { label: "当前版本", value: `V${topic.version}` },
          { label: "方案提交人", value: topic.submitter },
          { label: "审核人", value: topic.reviewer },
          { label: "使用模板", value: topic.template },
        ].filter((item) => item.value),
        sourceLabel: "已通过选题单",
        updatedAt: topic.updatedAt,
      },
    }));

  const projectTasks = projects
    .filter((project) =>
      (project.flags ?? []).some((flag) => String(flag).includes("延期")),
    )
    .map((project) => ({
      id: `WB-${project.id}`,
      businessId: project.projectCode ?? project.id,
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
      detail: {
        subjectLabel: "项目",
        subject: project.name,
        summary: `${project.name}当前处于“${project.status}”状态，下一节点为${project.next || "待确认"}。`,
        requirement: "核对各制作环节的实际完成情况，更新当前节点进度、延期原因与后续处理计划。",
        fields: [
          { label: "项目编号", value: project.projectCode ?? project.id },
          { label: "制作方式", value: project.mode },
          { label: "项目状态", value: project.status },
          { label: "项目负责人", value: project.owner },
          { label: "计划周期", value: `${project.start} 至 ${project.due}` },
          { label: "下一节点", value: project.next },
          { label: "协作中心", value: project.centers?.join("、") },
        ].filter((item) => item.value),
        noteLabel: "当前风险",
        note: project.flags?.join("、"),
        progressItems: (project.stages ?? []).map((stage) => ({
          label: stage.name,
          owner: stage.owner,
          progress: stage.progress,
          status: stage.status,
        })),
        sourceLabel: "项目台账",
        updatedAt: "随项目台账实时更新",
      },
    }));

  const projectAssignmentTasks = projects.flatMap((project) =>
    selectProjectTaskAssignments(project)
      .filter(
        (assignment) =>
          assignment.issuedAt &&
          assignment.owner &&
          assignment.owner !== "待分配" &&
          assignment.status !== "已完成",
      )
      .map((assignment) => {
        const isDelayed = (project.flags ?? []).some((flag) =>
          String(flag).includes("延期"),
        );
        const dueFlag = assignment.due < "2026-07-17"
          ? "已逾期"
          : assignment.due === "2026-07-17"
            ? "今日到期"
            : isDelayed
              ? "延期风险"
              : "按期";
        return {
          id: `WB-${assignment.id}`,
          businessId: project.projectCode ?? project.id,
          sourceType: "project-assignment",
          sourceId: project.id,
          assignmentId: assignment.id,
          stageName: assignment.stage,
          assignmentRole: assignment.role,
          module: "项目",
          title: `${project.name} · ${assignment.role}任务`,
          owner: assignment.owner,
          status: assignment.status,
          due: assignment.due,
          flag: dueFlag,
          priority: isDelayed ? "高" : "普通",
          destination: "tasks",
          description: assignment.requirement,
          detail: {
            subjectLabel: "项目任务",
            subject: `${project.name} · ${assignment.role}`,
            summary: `${assignment.owner}负责${project.name}${assignment.role}任务，当前完成 ${assignment.completed}/${assignment.total}。`,
            requirement: assignment.requirement,
            fields: [
              { label: "项目编号", value: project.projectCode ?? project.id },
              { label: "项目名称", value: project.name },
              { label: "任务类型", value: assignment.role },
              { label: "所属中心", value: assignment.department },
              { label: "任务负责人", value: assignment.owner },
              { label: "计划完成", value: assignment.due },
              { label: "完成进度", value: `${assignment.progress}%` },
              { label: "完成数量", value: `${assignment.completed}/${assignment.total}` },
            ],
            progressItems: [
              {
                label: assignment.role,
                owner: assignment.owner,
                progress: assignment.progress,
                status: assignment.status,
              },
            ],
            sourceLabel: "项目任务单",
            updatedAt: assignment.updatedAt || "随任务列表实时更新",
          },
        };
      }),
  );

  return [
    ...recruitmentTasks,
    ...topicTasks,
    ...topicProjectTasks,
    ...projectAssignmentTasks,
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
