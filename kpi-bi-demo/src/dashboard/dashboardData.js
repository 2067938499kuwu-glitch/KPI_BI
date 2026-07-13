const people = [
  ["emp-001", "张小北", "剪辑中心", "中级剪辑师", "江晚"],
  ["emp-002", "周编剧", "编剧中心", "中级编剧", "江晚"],
  ["emp-003", "林制片", "制片中心", "中级制片", "江晚"],
  ["emp-004", "陈组长", "剪辑中心", "剪辑组长", "江晚"],
  ["emp-005", "许投流", "运营增长中心", "中级投流师", "江晚"],
  ["emp-006", "顾商务", "商务部", "中级商务", "沈牧"],
  ["emp-007", "陆运营", "运营增长中心", "国内切片运营", "赵启"],
  ["emp-008", "罗运营", "运营增长中心", "成品剧运营", "赵启"],
  ["emp-009", "何编导", "编剧中心", "编导", "李晓言"],
  ["emp-010", "江晚", "内容运营中心", "内容运营中心总监", "磊姐"],
  ["emp-011", "沈剪辑", "剪辑中心", "高级剪辑师", "周岚"],
  ["emp-012", "唐制片", "制片中心", "执行制片", "林制片"],
  ["emp-013", "魏编剧", "编剧中心", "初级编剧", "李晓言"],
  ["emp-014", "郑商务", "商务部", "初级商务", "沈牧"],
  ["emp-015", "赵投流", "运营增长中心", "高级投流师", "赵启"],
  ["emp-016", "苏财务", "财务中心", "财务分析师", "秦岚"],
  ["emp-017", "秦HR", "人力资源部", "HRBP", "HR-唐宁"],
  ["emp-018", "方运营", "内容运营中心", "内容策划", "江晚"],
];

export const dashboardPeople = people.map(([employeeId, name, department, role, leader]) => ({ employeeId, name, department, role, leader }));

const roleDimensions = {
  剪辑: [["交付产出", 40], ["质量控制", 35], ["协作效率", 25]],
  编剧: [["剧本质量", 50], ["内容产出", 35], ["创新沉淀", 15]],
  制片: [["项目交付", 40], ["进度成本", 35], ["风险协同", 25]],
  投流: [["投放结果", 45], ["复盘质量", 30], ["响应效率", 25]],
  商务: [["业务拓展", 45], ["资源质量", 30], ["成交贡献", 25]],
  运营: [["运营结果", 45], ["内容质量", 30], ["执行效率", 25]],
  管理: [["组织结果", 40], ["流程质量", 30], ["管理沉淀", 30]],
  通用: [["目标达成", 45], ["专业质量", 35], ["协作成长", 20]],
};

function dimensionTemplate(role) {
  if (role.includes("剪辑")) return roleDimensions.剪辑;
  if (role.includes("编剧") || role.includes("编导")) return roleDimensions.编剧;
  if (role.includes("制片")) return roleDimensions.制片;
  if (role.includes("投流")) return roleDimensions.投流;
  if (role.includes("商务")) return roleDimensions.商务;
  if (role.includes("运营") || role.includes("策划")) return roleDimensions.运营;
  if (role.includes("总监")) return roleDimensions.管理;
  return roleDimensions.通用;
}

const scoreMatrix = {
  "2026-05": [88, 86, 91, 89, 83, 85, 84, 87, 82, 92, 88, 80, 79, 81, 86, 84, 85, 83],
  "2026-06": [90, 87, 91, 88, 85, 86, 82, 89, 83, 93, 90, 81, 80, 83, 88, 85, 86, 84],
  "2026-07": [92, 88, 94, 91, 88, 86, 85, 90, 82, 95, 92, 84, 81, 83, 89, 87, 86, 85],
};

function approvalFor(cycle, index) {
  if (cycle === "2026-07" && index === 6) return { requiresCommittee: true, committeeStatus: "pending", returned: false };
  if (cycle === "2026-07" && index === 8) return { requiresCommittee: true, committeeStatus: "returned", returned: true };
  if (cycle === "2026-07" && index === 12) return { requiresCommittee: true, committeeStatus: "pending", returned: false };
  if (index === 1 || index === 15) return { requiresCommittee: false, lastNodeStatus: "approved", returned: false };
  return { requiresCommittee: true, committeeStatus: "approved", returned: false };
}

function createDimensions(person, score, index) {
  return dimensionTemplate(person.role).map(([name, weight], dimensionIndex) => {
    const offset = ((index + dimensionIndex * 2) % 5) - 2;
    const compositeScore = Math.max(60, Math.min(100, Number((score + offset).toFixed(1))));
    return {
      name,
      weight,
      firstScore: Math.max(60, Math.min(100, compositeScore + 1)),
      secondScore: Math.max(60, Math.min(100, compositeScore - 1)),
      score: compositeScore,
      weightedScore: Number((compositeScore * weight / 100).toFixed(1)),
      comment: `${name}完成情况有明确过程记录，按岗位目标与交付质量综合评定。`,
      source: "绩效中心 · 月度审批记录",
    };
  });
}

export const dashboardPerformanceRecords = Object.entries(scoreMatrix).flatMap(([cycle, scores]) =>
  dashboardPeople.map((person, index) => {
    const approvalFlow = approvalFor(cycle, index);
    const effective = approvalFlow.requiresCommittee === false
      ? approvalFlow.lastNodeStatus === "approved"
      : approvalFlow.committeeStatus === "approved";
    return {
      id: `${cycle}-${person.employeeId}`,
      ...person,
      cycle,
      status: effective ? "final_approved" : approvalFlow.returned ? "final_returned" : "final_pending",
      finalScore: scores[index],
      finalScoreEffective: effective,
      finalScoreEffectiveAt: effective ? `${cycle}-28 18:00` : null,
      approvalFlow,
      performanceDimensions: createDimensions(person, scores[index], index),
      updatedAt: "2026-07-13 09:30",
    };
  }),
);

const cycleWeeks = {
  "2026-05": [["W18", "04-27", "05-03"], ["W19", "05-04", "05-10"], ["W20", "05-11", "05-17"], ["W21", "05-18", "05-24"], ["W22", "05-25", "05-31"]],
  "2026-06": [["W23", "06-01", "06-07"], ["W24", "06-08", "06-14"], ["W25", "06-15", "06-21"], ["W26", "06-22", "06-28"], ["W27", "06-29", "07-05"]],
  "2026-07": [["W27", "06-29", "07-05"], ["W28", "07-06", "07-12"], ["W29", "07-13", "07-19"], ["W30", "07-20", "07-26"], ["W31", "07-27", "08-02"]],
};

const statusPatterns = [
  ["normal", "normal", "normal", "normal", "normal"],
  ["normal", "late", "normal", "normal", "normal"],
  ["normal", "normal", "missing", "normal", "normal"],
  ["normal", "normal", "normal", "late", "normal"],
  ["late", "normal", "normal", "missing", "normal"],
  ["normal", "normal", "normal", "normal", "late"],
];

export const dashboardWeeklyReports = Object.entries(cycleWeeks).flatMap(([cycle, weeks]) =>
  dashboardPeople.flatMap((person, personIndex) => {
    if (cycle === "2026-07" && person.employeeId === "emp-016") return [];
    const statuses = statusPatterns[personIndex % statusPatterns.length];
    return weeks.map(([week, start, end], weekIndex) => {
      const status = statuses[weekIndex];
      const achievement = `${person.name}完成${person.role}本周核心交付，并同步过程记录与验收结果。`;
      const risk = status === "missing" ? "周报未提交，暂无原始风险内容。" : (personIndex + weekIndex) % 4 === 0 ? "跨团队依赖尚待确认，已在周报中记录跟进。" : "";
      return {
        id: `${cycle}-${person.employeeId}-${week}`,
        employeeId: person.employeeId,
        cycle,
        period: { label: `${cycle.slice(0, 4)}年${week}`, start: `${cycle.slice(0, 4)}-${start}`, end: `${cycle.slice(0, 4)}-${end}` },
        status,
        submittedAt: status === "normal" ? `${cycle}-${String(Math.min(28, weekIndex * 7 + 5)).padStart(2, "0")} 17:30` : status === "late" ? `${cycle}-${String(Math.min(28, weekIndex * 7 + 7)).padStart(2, "0")} 10:20` : null,
        achievements: status === "missing" ? [] : [achievement],
        risks: risk ? [risk] : [],
        nextPlan: status === "missing" ? [] : [`继续推进${person.role}下周重点任务，完成风险闭环。`],
        originalContent: status === "missing" ? "" : `本周成果：${achievement}\n风险事项：${risk || "暂无"}\n下周计划：继续推进重点任务并完成验收。`,
        sourceModule: "周报中心",
      };
    });
  }),
);

export const dashboardMeta = {
  updatedAt: "2026-07-13 09:30",
  delayed: false,
  sourceNote: "绩效排名仅使用正式生效最终评分；周报仅作事实参考，不参与评分。",
};
