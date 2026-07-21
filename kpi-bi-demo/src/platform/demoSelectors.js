const FUNNEL_FIELDS = [
  ["打招呼", "hello"],
  ["面试", "interview"],
  ["通过", "passed"],
  ["Offer发放", "offer"],
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
    ["已评估", "已通过", "已通过待立项", "已转项目"].includes(topic.status),
  ).length;
  return {
    total: topics.length,
    pending: topics.filter((topic) => ["待评估", "待审核"].includes(topic.status)).length,
    approved,
    returned: topics.filter((topic) => ["未通过", "已退回"].includes(topic.status)).length,
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
  const progressProjects = projects.filter(
    (project) => project.mode !== "外部制作",
  );
  const delayed = progressProjects.filter((project) =>
    (project.flags ?? []).some((flag) => String(flag).includes("延期")),
  );
  const averageProgress = progressProjects.length
    ? Math.round(
        progressProjects.reduce(
          (sum, project) => {
            const stages = project.stages ?? [];
            const progress = stages.length
              ? stages.reduce(
                  (stageTotal, stage) => stageTotal + Number(stage.progress ?? 0),
                  0,
                ) / stages.length
              : Number(project.progress ?? 0);
            return sum + progress;
          },
          0,
        ) / progressProjects.length,
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

function dashboardMonthRange(startMonth, endMonth) {
  if (!/^\d{4}-\d{2}$/.test(startMonth) || !/^\d{4}-\d{2}$/.test(endMonth)) return [];
  if (startMonth > endMonth) return [];
  const [startYear, startValue] = startMonth.split("-").map(Number);
  const [endYear, endValue] = endMonth.split("-").map(Number);
  const months = [];
  let year = startYear;
  let month = startValue;
  while (year < endYear || (year === endYear && month <= endValue)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

export function selectMonthlyConsumptionTrend(
  {
    projectConsumptionRecords = [],
    personnelConsumptionSnapshots = [],
  } = {},
  startMonth,
  endMonth,
) {
  return dashboardMonthRange(startMonth, endMonth).map((month) => {
    const monthlyProjects = projectConsumptionRecords.filter(
      (record) => String(record.createdAt ?? "").slice(0, 7) === month,
    );
    const monthlyPersonnelRecords = personnelConsumptionSnapshots
      .filter((snapshot) => snapshot.snapshotMonth === month)
      .flatMap((snapshot) => snapshot.records ?? []);
    return {
      month,
      label: `${Number(month.slice(5))}月`,
      projectCount: monthlyProjects.length,
      projectAmount: monthlyProjects.reduce(
        (sum, record) => sum + Number(record.cost ?? 0),
        0,
      ),
      personnelCost: monthlyPersonnelRecords.reduce(
        (sum, record) => sum + Number(record.totalCost ?? 0),
        0,
      ),
      personnelCount: monthlyPersonnelRecords.filter(
        (record) => Number(record.totalCost ?? 0) > 0,
      ).length,
    };
  });
}

export function normalizeOperationMatchName(value = "") {
  return String(value)
    .normalize("NFKC")
    .trim()
    .replace(/^[《〈「『【〔（(\s]+|[》〉」』】〕）)\s]+$/g, "")
    .replace(/[\s\u3000]+/g, "")
    .toLocaleLowerCase("zh-CN");
}

export function selectMatchedOperationUploads(project, uploads = []) {
  if (!project) return [];
  const projectName = normalizeOperationMatchName(project.name);
  if (!projectName) return [];

  return uploads.flatMap((upload) => {
    const records = (upload.records ?? []).filter(
      (record) => normalizeOperationMatchName(record.name) === projectName,
    );
    return records.length
      ? [{ ...upload, importedRecordCount: upload.records?.length ?? 0, records }]
      : [];
  });
}

export function selectOperationMatchingSummary(projects = [], uploads = []) {
  const matches = projects.map((project) => ({
    project,
    uploads: selectMatchedOperationUploads(project, uploads),
  }));
  const matchedRecords = matches.reduce(
    (total, item) =>
      total + item.uploads.reduce(
        (subtotal, upload) => subtotal + upload.records.length,
        0,
      ),
    0,
  );
  const totalImportedRecords = uploads.reduce(
    (total, upload) => total + (upload.records?.length ?? 0),
    0,
  );
  return {
    matches,
    matchedProjects: matches.filter((item) => item.uploads.length > 0).length,
    matchedRecords,
    totalImportedRecords,
    unmatchedRecords: Math.max(0, totalImportedRecords - matchedRecords),
    matchRate: totalImportedRecords
      ? Math.round((matchedRecords / totalImportedRecords) * 100)
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

export function selectWorkbenchTasks({
  candidates = [],
  topics = [],
  projects = [],
  reviews = [],
  weeklyReports = [],
  people = [],
  referenceDate = "2026-07-20",
}) {
  const recruitmentTaskConfig = {
    待部门确认: {
      title: "确认候选人是否进入面试",
      assigneeRole: "部门负责人",
      requirement: "结合候选人资料与岗位要求，确认是否进入面试；不进入时需填写原因。",
    },
    待安排面试: {
      title: "确认候选人面试的时间以及面试官",
      assigneeRole: "招聘负责人",
      requirement: "确认面试轮次、面试时间和面试官，完成后进入面试反馈节点。",
    },
    待面试反馈: {
      title: "提交候选人面试反馈",
      assigneeRole: "面试官",
      requirement: "提交面试结论和可追溯的反馈说明，确认是否进入下一招聘节点。",
    },
    Offer待发: {
      title: "确认是否发放 Offer",
      assigneeRole: "招聘负责人",
      requirement: "复核面试结论与录用条件，确认是否向候选人发放 Offer。",
    },
    Offer已发: {
      title: "确认是否已接受（同步到 SSC）",
      assigneeRole: "招聘负责人",
      requirement: "确认候选人是否接受 Offer；接受后将入职建档任务同步至 SSC。",
    },
  };
  const recruitmentTasks = candidates.flatMap((candidate) =>
    (candidate.applications ?? [])
      .filter((application) => recruitmentTaskConfig[application.status])
      .map((application) => {
        const config = recruitmentTaskConfig[application.status];
        const owner = application.status === "待部门确认"
          ? application.departmentLeader || application.interviewer || candidate.owner
          : application.status === "待面试反馈"
            ? application.interviewer || candidate.owner
            : candidate.owner || application.interviewer;
        return {
          id: `WB-${application.id}`,
          businessId: application.id,
          sourceType: "recruitment",
          sourceId: application.id,
          module: "招聘",
          title: config.title,
          owner,
          assigneeRole: config.assigneeRole,
          status: "待处理",
          issuedAt: application.updatedAt || candidate.updatedAt || "待记录",
          destination: "recruitment",
          description: `当前招聘申请处于“${application.status}”节点，需完成${config.title}。`,
          detail: {
            subjectLabel: "招聘流程",
            subject: config.title,
            summary: `${application.job || "当前岗位"}的招聘申请处于“${application.status}”节点。`,
            requirement: config.requirement,
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
        };
      }),
  );

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
        const action = {
          编剧: "上传",
          制作: "制作",
          剪辑: "剪辑",
          制片: "审核",
        }[assignment.role] || assignment.role;
        const batchStart = Math.min(
          Math.max(Number(assignment.completed) + 1, 1),
          assignment.total,
        );
        const batchEnd = Math.min(batchStart + 5, assignment.total);
        const title = `${project.name} · 进行${batchStart}-${batchEnd}剧集的${action}`;
        return {
          id: `WB-${assignment.id}`,
          businessId: project.projectCode ?? project.id,
          sourceType: "project-assignment",
          sourceId: project.id,
          assignmentId: assignment.id,
          stageName: assignment.stage,
          assignmentRole: assignment.role,
          module: "项目",
          title,
          owner: assignment.owner,
          assigneeRole: `${action}负责人`,
          status: "待处理",
          issuedAt: assignment.issuedAt,
          destination: "tasks",
          description: assignment.requirement,
          detail: {
            subjectLabel: "项目任务",
            subject: title,
            summary: `当前任务处理第 ${batchStart}-${batchEnd} 集，整体完成 ${assignment.completed}/${assignment.total} 集。`,
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

  const performanceActionByStatus = {
    绩效目标待下发: "核对绩效模板与目标权重，完成本月绩效目标下发。",
    待员工确认绩效目标: "逐项确认本月绩效目标；如有异议，需填写具体原因后提交。",
    目标异议处理中: "结合员工异议调整目标内容，并重新下发确认。",
    绩效目标已生效: "持续更新目标执行进展与相关证明材料。",
    待员工填报结果: "填写本月目标完成结果、数据口径与证明材料。",
    待一级领导评分: "依据员工结果与证明材料完成逐项评分和评语。",
    待二级领导复评: "复核一级评分、异常项与评价依据并提交复评结论。",
    待HR复审: "核验评分规则、证明材料与加减分项，提交复审结论。",
    待CEO审批: "审阅最终评分、等级与例外说明，完成最终审批。",
    待反馈与面谈: "完成绩效结果反馈，并记录面谈结论和改进计划。",
    申诉已提交: "受理绩效申诉，核对争议指标、证据与原评分依据。",
    HR调查中: "补充申诉调查结论和证据链，提交后续裁决。",
    待CEO裁决: "审阅申诉调查材料并完成最终裁决。",
  };

  const performanceTasks = reviews
    .filter((review) => review.status && review.status !== "已结束")
    .map((review) => {
      const isAppeal = String(review.status).includes("申诉") || String(review.status).includes("调查") || String(review.status).includes("裁决");
      const cycle = review.cycle || referenceDate.slice(0, 7);
      const isDispute = isAppeal || String(review.status).includes("异议");
      const isScoring = review.status === "待一级领导评分";
      const isAudit = ["待二级领导复评", "待HR复审", "待CEO审批", "待反馈与面谈"].includes(review.status);
      const title = review.status === "绩效目标待下发"
        ? `绩效目标${cycle}待下发`
        : isDispute
          ? `进行${cycle}目标异议处理`
          : isScoring
            ? `进行${cycle}绩效评分`
            : isAudit
              ? `进行${cycle}绩效审核`
              : `确认${cycle}绩效目标`;
      return {
        id: `WB-PERFORMANCE-${review.id}`,
        businessId: review.id,
        sourceType: "performance",
        sourceId: review.id,
        module: "绩效",
        title,
        owner: review.owner,
        assigneeRole: isDispute
          ? "绩效异议处理人"
          : isScoring
            ? "绩效评分人"
            : isAudit
              ? "绩效审核人"
              : "绩效流程处理人",
        dispatcher: review.directLeader || "绩效中心",
        issuedAt: review.lastActionAt,
        status: "待处理",
        destination: "performance",
        quickAction: false,
        description: performanceActionByStatus[review.status] || "进入绩效中心处理当前流程节点。",
        detail: {
          subjectLabel: "绩效任务对象",
          subject: `${cycle}月度绩效`,
          summary: `当前${cycle}绩效流程处于“${review.status}”节点。`,
          requirement: performanceActionByStatus[review.status] || "核对绩效任务信息并完成当前节点处理。",
          fields: [
            { label: "考核周期", value: review.cycle },
            { label: "被考核人", value: review.employee },
            { label: "所属部门", value: review.department },
            { label: "岗位", value: review.role },
            { label: "当前节点", value: review.status },
            { label: "绩效模板", value: review.roleTemplateName },
            { label: "直接上级", value: review.directLeader },
            { label: "间接上级", value: review.indirectLeader },
            { label: "当前处理人", value: review.owner },
            { label: "目标版本", value: review.pendingTargetVersion ? `V${review.pendingTargetVersion}（待确认）` : review.activeTargetVersion ? `V${review.activeTargetVersion}` : "待下发" },
            { label: "证明材料", value: review.evidence },
          ].filter((item) => item.value),
          highlights: review.templateHighlights ?? [],
          noteLabel: isAppeal ? "申诉与调查说明" : "任务备注",
          note: review.comment,
          sourceLabel: "绩效中心 · 月度绩效单",
          updatedAt: review.lastActionAt,
        },
      };
    });

  const peopleById = new Map(people.map((person) => [person.employeeId, person]));
  const currentWeeklyReports = weeklyReports.filter((report) =>
    report.period?.start <= referenceDate && report.period?.end >= referenceDate,
  );
  const weeklyTasks = currentWeeklyReports
    .filter((report) => ["missing", "late"].includes(report.status))
    .map((report) => {
      const person = peopleById.get(report.employeeId) ?? {};
      const isMissing = report.status === "missing";
      return {
        id: `WB-WEEKLY-${report.id}`,
        businessId: report.id,
        sourceType: "weekly",
        sourceId: report.id,
        module: "周报",
        title: isMissing
          ? `提交${report.period.label}周报`
          : `确认${report.period.label}周报补充项`,
        owner: person.name || report.employeeId || "待确认",
        assigneeRole: "周报填报人",
        dispatcher: person.leader || "周报中心",
        issuedAt: report.period.start ? `${report.period.start} 09:00` : "待记录",
        status: "待处理",
        destination: "reports",
        quickAction: false,
        description: isMissing
          ? "补充本周成果、风险问题与下周计划后提交周报。"
          : "核对延迟提交原因，并确认风险与下周计划是否完整。",
        detail: {
          subjectLabel: "周报任务",
          subject: report.period.label,
          summary: `当前周报统计周期为${report.period.start}至${report.period.end}。`,
          requirement: isMissing
            ? "完整填写本周成果、风险与问题、下周计划三个部分，确认内容可追溯后提交。"
            : "补充延迟原因，核对成果、风险和下周计划，并确认正式提交版本。",
          fields: [
            { label: "报告周期", value: report.period.label },
            { label: "起止日期", value: `${report.period.start} 至 ${report.period.end}` },
            { label: "填报人", value: person.name || report.employeeId },
            { label: "所属部门", value: person.department },
            { label: "岗位", value: person.role },
            { label: "直属上级", value: person.leader },
            { label: "提交状态", value: isMissing ? "未提交" : "延迟提交" },
            { label: "提交时间", value: report.submittedAt || "尚未提交" },
          ].filter((item) => item.value),
          contentSections: [
            {
              title: "本周成果",
              items: report.achievements?.length ? report.achievements : ["尚未填写本周成果"],
            },
            {
              title: "风险与问题",
              items: report.risks?.length ? report.risks : ["尚未填写风险与问题"],
            },
            {
              title: "下周计划",
              items: report.nextPlan?.length ? report.nextPlan : ["尚未填写下周计划"],
            },
          ],
          noteLabel: isMissing ? "提交提醒" : "时效提醒",
          note: isMissing ? "当前周期尚未形成正式周报，请在截止时间前完成。" : "该周报晚于规定时间提交，需要确认延迟原因。",
          sourceLabel: "智能周报中心",
          updatedAt: report.submittedAt || "等待提交",
        },
      };
    });

  const sscTasks = candidates.flatMap((candidate) =>
    (candidate.applications ?? [])
      .filter((application) => application.status === "待入职")
      .map((application) => ({
        id: `WB-SSC-${application.id}`,
        businessId: application.id,
        sourceType: "ssc-personnel",
        sourceId: application.id,
        module: "SSC",
        title: "进行人员花名册的添加",
        owner: candidate.owner || "SSC人事专员",
        assigneeRole: "SSC人事专员",
        dispatcher: "招聘管理",
        issuedAt: application.updatedAt || candidate.updatedAt || "待记录",
        status: "待处理",
        destination: "ssc-org",
        quickAction: false,
        description: "候选人已确认接受 Offer，需要在 SSC 建立人员花名册档案。",
        detail: {
          subjectLabel: "SSC 人员档案",
          subject: "人员花名册新增",
          summary: "招聘流程已进入待入职节点，需要补充花名册必填信息。",
          requirement: "在 SSC 服务中心录入人员编号、组织归属、岗位和入职信息，完成花名册建档。",
          sourceLabel: "SSC 服务中心 · 人员花名册",
          updatedAt: application.updatedAt || candidate.updatedAt,
        },
      })),
  );

  return [
    ...performanceTasks,
    ...recruitmentTasks,
    ...projectAssignmentTasks,
    ...weeklyTasks,
    ...sscTasks,
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
