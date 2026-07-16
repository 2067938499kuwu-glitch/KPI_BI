
import { Children, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  ChartLineUp,
  ClipboardText,
  Database,
  FileCsv,
  GearSix,
  House,
  Lightbulb,
  Trophy,
  UsersThree,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  applyWorkflowAction,
  calcAdjustmentScore,
  calcBaseScore,
  calcRowScore,
  calcScore,
  canPerformReviewAction,
  confirmTargetVersion,
  createTargetChange,
  getGrade,
  getLevelLabel,
  getNextReviewStatus,
  getOpenAppealCount,
  getReviewTemplate,
  calcRowComposite,
  getStatusCount,
  getWorkflowAction,
  REVIEW_STATUS,
  isOpenAppealReview,
  isPendingReviewStatus,
  matchesPerformanceTab,
  rejectTargetVersion,
  resolveAppealResult,
  requiresSecondReview,
  validateAdjustmentTotal,
  validateTargetWeights,
} from "./performance/logic";
import { performanceFocusOptions, reviewsSeed } from "./performance/seed";
import { HONGGUO_REQUIRED_COLUMNS, parseHongguoCsv } from "./performance/hongguo";
import { dashboardPeople, dashboardWeeklyReports } from "./dashboard/dashboardData";
import {
  mergeWeeklyReports,
  readStoredWeeklyReports,
  WEEKLY_REPORT_STORAGE_KEY,
  WEEKLY_REPORT_UPDATED_EVENT,
} from "./dashboard/weeklyReportBridge";
import { buildWeeklyReference } from "./performance/weeklyReference";
import {
  BusinessTaskProcessingDrawer,
  BusinessDashboardPage,
  DemoDataProvider,
  GovernancePage,
  ProjectProductionPage,
  RecruitmentCenterPage,
  RoleScopeBanner,
  ReportsCenterPage,
  TopicCenterPage,
  UnifiedWorkbenchPage,
  useDemoData,
} from "./platform/IntegratedPlatform";
import { SscDataMaintenancePage } from "./ssc/SscDataMaintenancePage";

const CURRENT_MONTH = "2026-07";

const defaultPerformanceCategories = [
  { id: "result", name: "结果产出", weight: 35, requirement: "按岗位月度任务完成量、核心交付数量和目标达成情况评分。", origin: "template", mandatory: true, type: "weighted" },
  { id: "quality", name: "工作质量", weight: 25, requirement: "按返修次数、一次通过率、重大问题次数、评审结论和协作方评价评分。", origin: "template", mandatory: true, type: "weighted" },
  { id: "efficiency", name: "工作效率", weight: 20, requirement: "按按时交付率、延期次数、响应时效、平均处理周期评分。", origin: "template", mandatory: true, type: "weighted" },
  { id: "monthly-focus", name: "个人月度重点目标", weight: 20, requirement: "结合本月重点项目填写可量化目标、交付标准和截止时间。", origin: "personal", mandatory: false, type: "weighted" },
  { id: "adjustment", name: "加减分项", weight: 0, requirement: "累计范围-10至+10；每条均需填写原因和证明材料。", origin: "adjustment", mandatory: true, type: "adjustment" },
];

function clonePerformanceCategories(categories = defaultPerformanceCategories) {
  return categories.map((item) => ({ ...item }));
}

const departmentPerformanceTemplatesSeed = [
  { id: "template-edit-middle", department: "剪辑中心", role: "中级剪辑师", name: "剪辑中心·中级剪辑师月度绩效模板", categories: clonePerformanceCategories() },
  { id: "template-edit-lead", department: "剪辑中心", role: "剪辑组长", name: "剪辑中心·剪辑组长月度绩效模板", categories: clonePerformanceCategories([{ ...defaultPerformanceCategories[0], name: "团队与个人交付", weight: 35 }, { ...defaultPerformanceCategories[1], name: "质量与返修控制", weight: 25 }, { ...defaultPerformanceCategories[2], name: "任务分配与响应", weight: 20 }, ...defaultPerformanceCategories.slice(3)]) },
  { id: "template-writing-middle", department: "编剧中心", role: "中级编剧", name: "编剧中心·中级编剧月度绩效模板", categories: clonePerformanceCategories([{ ...defaultPerformanceCategories[0], name: "剧本产出", weight: 35 }, { ...defaultPerformanceCategories[1], name: "剧本质量", weight: 25 }, { ...defaultPerformanceCategories[2], name: "按期交稿", weight: 20 }, ...defaultPerformanceCategories.slice(3)]) },
  { id: "template-production-middle", department: "制片中心", role: "中级制片", name: "制片中心·中级制片月度绩效模板", categories: clonePerformanceCategories([{ ...defaultPerformanceCategories[0], name: "项目交付", weight: 35 }, { ...defaultPerformanceCategories[1], name: "制作质量", weight: 25 }, { ...defaultPerformanceCategories[2], name: "进度与成本", weight: 20 }, ...defaultPerformanceCategories.slice(3)]) },
  { id: "template-growth-middle", department: "运营增长中心", role: "中级投流师", name: "运营增长中心·中级投流师月度绩效模板", categories: clonePerformanceCategories([{ ...defaultPerformanceCategories[0], name: "投放结果", weight: 35 }, { ...defaultPerformanceCategories[1], name: "素材与账户质量", weight: 25 }, { ...defaultPerformanceCategories[2], name: "投放响应效率", weight: 20 }, ...defaultPerformanceCategories.slice(3)]) },
  { id: "template-business-middle", department: "商务部", role: "中级商务", name: "商务部·中级商务月度绩效模板", categories: clonePerformanceCategories([{ ...defaultPerformanceCategories[0], name: "商务结果", weight: 35 }, { ...defaultPerformanceCategories[1], name: "客户与合同质量", weight: 25 }, { ...defaultPerformanceCategories[2], name: "商机推进效率", weight: 20 }, ...defaultPerformanceCategories.slice(3)]) },
  { id: "template-content-director", department: "内容运营中心", role: "内容运营中心总监", name: "内容运营中心·总监月度绩效模板", categories: clonePerformanceCategories([{ ...defaultPerformanceCategories[0], name: "经营结果", weight: 35 }, { ...defaultPerformanceCategories[1], name: "内容质量", weight: 25 }, { ...defaultPerformanceCategories[2], name: "组织协同效率", weight: 20 }, ...defaultPerformanceCategories.slice(3)]) },
];

const roleAccess = {
  employee: { viewerName: "张小北", roleName: "员工", viewMode: "self", issueMode: "none" },
  leader: { viewerName: "江晚", roleName: "Leader", viewMode: "subtree", issueMode: "direct" },
  hr: { viewerName: "HR-唐宁", roleName: "HR", viewMode: "all", issueMode: "none" },
  ceo: { viewerName: "CEO", roleName: "老板 / 总经理", viewMode: "all", issueMode: "none" },
};

const issueDepartmentAlias = {
  编剧中心: "内容中心",
  内容运营中心: "内容经营中心",
};

const issueOrgTreeTemplate = {
  name: "内容经营中心",
  children: [
    { name: "内容中心", children: [{ name: "主编" }, { name: "中级编剧" }, { name: "初级编剧" }, { name: "编导" }] },
    {
      name: "AI制作中心",
      children: [
        { name: "一组", children: [{ name: "组长" }, { name: "组员" }] },
        { name: "二组", children: [{ name: "组长" }, { name: "组员" }] },
        { name: "三组", children: [{ name: "组长" }, { name: "组员" }] },
      ],
    },
    { name: "制片中心", children: [{ name: "执行制片" }, { name: "总制片" }] },
    { name: "剪辑中心", children: [{ name: "初级" }, { name: "中级" }, { name: "组长" }] },
    {
      name: "运营增长中心",
      children: [
        { name: "海外短剧发行运营", children: [{ name: "中级" }, { name: "高级" }] },
        { name: "国内短剧发行运营", children: [{ name: "中级" }, { name: "高级" }] },
        { name: "海外媒体运营（素材/切片）", children: [{ name: "中级" }, { name: "高级" }] },
        { name: "国内媒体运营（素材/切片）", children: [{ name: "中级" }, { name: "高级" }] },
      ],
    },
    { name: "商务部", children: [{ name: "初级" }, { name: "中级" }, { name: "高级（总监）" }] },
  ],
};

const processNodes = [
  "月度绩效目标下发",
  "员工确认绩效目标",
  "员工填报完成结果",
  "一级领导评分及评论",
  "二级领导复评及评论",
  "HR复审",
  "CEO审批",
  "反馈与面谈",
  "绩效申诉",
];

const sidebarGroups = [
  {
    label: "总览",
    items: [
      { id: "workspace", label: "工作台", icon: House },
      { id: "dashboard", label: "经营驾驶舱", icon: ChartLineUp },
    ],
  },
  {
    label: "人效管理",
    items: [
      { id: "performance", label: "绩效中心", icon: Trophy },
      { id: "reports", label: "周报", icon: ClipboardText },
    ],
  },
  {
    label: "业务管理",
    items: [
      { id: "recruitment", label: "招聘管理", icon: UsersThree },
      { id: "topics", label: "选题管理", icon: Lightbulb },
      { id: "projects", label: "项目制作", icon: Briefcase },
    ],
  },
  {
    label: "SSC服务中心",
    items: [
      { id: "ssc-org", label: "组织架构与花名册", icon: UsersThree },
      { id: "ssc-tables", label: "表格管理", icon: Database },
      { id: "ssc-templates", label: "模板管理", icon: FileCsv },
    ],
  },
  {
    label: "系统",
    items: [
      { id: "governance", label: "系统配置", icon: GearSix },
    ],
  },
];

const roles = [
  { id: "employee", label: "员工", badge: "个人工作台" },
  { id: "leader", label: "Leader", badge: "团队负责人" },
  { id: "hr", label: "HR", badge: "组织视图" },
  { id: "ceo", label: "CEO", badge: "经营驾驶舱" },
];

const SSC_ACCESS_ROLES = ["hr", "ceo"];

const platformPageAccess = {
  workspace: ["employee", "leader", "hr", "ceo"],
  dashboard: ["employee", "leader", "hr", "ceo"],
  performance: ["employee", "leader", "hr", "ceo"],
  reports: ["employee", "leader", "hr", "ceo"],
  recruitment: ["leader", "hr", "ceo"],
  topics: ["employee", "leader", "hr", "ceo"],
  projects: ["employee", "leader", "hr", "ceo"],
  "ssc-org": SSC_ACCESS_ROLES,
  "ssc-tables": SSC_ACCESS_ROLES,
  "ssc-templates": SSC_ACCESS_ROLES,
  governance: ["hr", "ceo"],
};

const sscPageViews = {
  "ssc-org": "org",
  "ssc-tables": "tables",
  "ssc-templates": "templates",
};

function canAccessPlatformPage(roleId, pageId) {
  return platformPageAccess[pageId]?.includes(roleId) ?? false;
}

const projects = [
  { id: "p1", name: "星际边缘", stage: "制作中", progress: 85, roi: 92, risk: "高", owner: "张艺谦" },
  { id: "p2", name: "山海之门", stage: "制作中", progress: 62, roi: 78, risk: "中", owner: "李晓言" },
  { id: "p3", name: "记忆修复师", stage: "待上线", progress: 100, roi: 105, risk: "低", owner: "王思远" },
  { id: "p4", name: "虚拟制片平台", stage: "筹备中", progress: 44, roi: 80, risk: "中", owner: "刘雨桐" },
];

const reports = [
  { id: "r1", name: "张小北", team: "后期制作组", role: "中级剪辑师", status: "已提交", cycle: "2026-W28", achievements: "预告片交付完成", dailySummary: "完成预告片镜头精剪、字幕校对和音画同步复核，已提交最终交付版本。", aiUsage: "使用 AI 降噪、镜头粗剪和字幕校对，完成 12 条素材处理。", risks: "无重大风险", nextPlan: "推进下周重点素材交付", submittedAt: "2026-07-10 17:20" },
  { id: "r2", name: "王芳", team: "AI制作组", role: "AI制作师", status: "待批阅", cycle: "2026-W28", achievements: "角色一致性提升", dailySummary: "完成角色一致性比对、分镜补全和素材版本复核，已同步问题清单。", aiUsage: "使用生成式工具完成角色一致性比对与分镜补全。", risks: "角色一致性复核需等待素材版本确认", nextPlan: "完成待确认素材的二次复核", submittedAt: "2026-07-10 16:45" },
  { id: "r3", name: "高欣怡", team: "人力资源部", role: "HRBP", status: "草稿", cycle: "2026-W28", achievements: "招聘推进至终面", dailySummary: "完成候选人面试反馈汇总、招聘进度跟进及组织周报风险整理。", aiUsage: "使用 AI 汇总候选人面试反馈与周报风险。", risks: "终面排期需与业务负责人确认", nextPlan: "推进终面安排并补齐岗位需求", submittedAt: "2026-07-10 15:30" },
  { id: "r4", name: "陈组长", team: "剪辑中心", role: "剪辑组长", status: "已提交", cycle: "2026-W28", achievements: "完成组内交付排期与质量复盘", dailySummary: "完成 3 个项目节点排期校准，复盘返修问题并安排成员专项跟进。", aiUsage: "使用 AI 汇总日报、识别延期风险并生成周会纪要。", risks: "两名成员下周存在交付节点重叠", nextPlan: "调整排期并跟进关键镜头质量", submittedAt: "2026-07-10 18:05" },
  { id: "r5", name: "许俊流", team: "编剧中心", role: "中级编剧", status: "已提交", cycle: "2026-W28", achievements: "完成两集剧本修改与角色弧光梳理", dailySummary: "完成第 11、12 集剧本修改，梳理角色冲突线并提交制片评审。", aiUsage: "使用 AI 进行台词节奏检查和剧情冲突点提取。", risks: "第 12 集结尾需等待导演意见", nextPlan: "根据评审意见完成终稿", submittedAt: "2026-07-10 17:40" },
  { id: "r6", name: "赵启航", team: "运营增长中心", role: "发行运营", status: "待批阅", cycle: "2026-W28", achievements: "完成海外渠道素材投放复盘", dailySummary: "完成 4 个渠道素材投放复盘，整理高转化素材特征并同步制作团队。", aiUsage: "使用 AI 聚类评论反馈并生成素材优化建议。", risks: "两个渠道的预算调整尚未确认", nextPlan: "跟进预算确认并完成新一轮素材测试", submittedAt: "2026-07-10 16:20" },
  { id: "r7", name: "顾商务", team: "商务部", role: "商务专员", status: "已提交", cycle: "2026-W28", achievements: "完成品牌合作方案初稿", dailySummary: "完成两家品牌合作需求沟通，整理报价与资源置换方案初稿。", aiUsage: "使用 AI 汇总客户会议纪要并生成合作方案大纲。", risks: "客户对排期和资源置换比例仍有分歧", nextPlan: "推进方案确认与合同条款沟通", submittedAt: "2026-07-10 17:10" },
  { id: "r8", name: "林抒言", team: "制片中心", role: "执行制片", status: "已提交", cycle: "2026-W28", achievements: "完成拍摄资源排期与预算核对", dailySummary: "完成场地、演员和设备资源排期核对，补齐预算差异说明。", aiUsage: "使用 AI 识别预算表差异并生成场景资源清单。", risks: "外景场地档期存在替补方案需求", nextPlan: "锁定场地并更新拍摄执行表", submittedAt: "2026-07-10 18:15" },
  { id: "r9", name: "罗语萱", team: "运营增长中心", role: "发行运营", status: "已提交", cycle: "2026-W27", achievements: "完成第一轮渠道素材测试", dailySummary: "完成第一轮渠道素材测试与归因分析，输出高点击素材清单。", aiUsage: "使用 AI 汇总测试数据并生成归因说明。", risks: "暂无重大风险", nextPlan: "扩展高潜渠道并复盘素材表现", submittedAt: "2026-07-03 17:35" },
  { id: "r10", name: "陆运营", team: "内容经营中心", role: "内容运营", status: "已提交", cycle: "2026-W27", achievements: "完成作品上线节奏规划", dailySummary: "完成作品上线节奏与内容排期规划，协调制作和发行资源。", aiUsage: "使用 AI 提取用户评论主题并辅助内容排期。", risks: "暂无重大风险", nextPlan: "跟进上线物料与渠道排期", submittedAt: "2026-07-03 18:00" },
];

function getWeekRangeLabel(cycle) {
  const [yearPart, weekPart] = cycle.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (!year || !week) return cycle;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const start = new Date(jan4.getTime() + ((week - 1) * 7 - (jan4Day - 1)) * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return `${start.getUTCMonth() + 1}月${start.getUTCDate()}日~${end.getUTCMonth() + 1}月${end.getUTCDate()}日`;
}

const taskRows = [
  { id: "t1", name: "星际边缘主预告精剪", status: "进行中", owner: "张小北", dueDate: "2026-07-05" },
  { id: "t2", name: "山海之门角色一致性复核", status: "待审核", owner: "王芳", dueDate: "2026-07-03" },
  { id: "t3", name: "虚拟制片平台需求冻结", status: "待处理", owner: "刘雨桐", dueDate: "2026-07-08" },
  { id: "t4", name: "记忆修复师上线复盘整理", status: "已完成", owner: "王思远", dueDate: "2026-06-30" },
];

function getStatusTone(status) {
  if (status.includes("待")) return "field-pill--warning";
  if (status.includes("已") || status.includes("结束")) return "field-pill--success";
  if (status.includes("申诉")) return "field-pill--danger";
  return "field-pill--neutral";
}

function SectionCard({ title, action, children, className = "" }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <div className="section-card__header">
        <h3>{title}</h3>
        {typeof action === "string" || typeof action === "number" ? <span className="section-card__action">{action}</span> : action ?? null}
      </div>
      {children}
    </section>
  );
}

function PageIntro({ title, description, actions, chips }) {
  return (
    <div className="page-intro">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions || chips?.length ? (
        <div className="page-intro__side">
          {actions ? <div>{actions}</div> : null}
          {chips?.length ? (
            <div className="page-intro__chips">
              {chips.map((chip) => <span key={chip}>{chip}</span>)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FilterBar({ fields, actions }) {
  return (
    <section className="section-card section-card--filter">
      <div className="filter-grid">{Children.toArray(fields)}</div>
      {actions ? <div className="filter-actions">{Children.toArray(actions)}</div> : null}
    </section>
  );
}

function getActionTimestamp() {
  return new Date().toLocaleString("zh-CN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(/\//g, "-");
}

function normalizeScore(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 0;
  return Math.max(-10, Math.min(100, numberValue));
}

function getWorkflowDefaultDraft(review, action) {
  if (!review || !action) return { rows: [] };
  return {
    rows: review.rows.map((row) => ({ ...row })),
    resultSummary: review.resultSummary ?? "",
    targetDecision: "confirm",
    targetDisputeReason: "",
    targetChangeReason: review.targetDisputeReason ?? "",
    firstDecision: "score",
    returnReason: "",
    hrReviewComment: review.hrReviewComment ?? "",
    hrDecision: "submit",
    committeeDecision: "approve",
    committeeComment: review.committeeComment ?? "",
    interviewSummary: review.interviewSummary ?? "",
    improvementPlan: review.improvementPlan ?? "",
    appealInvestigation: review.appealInvestigation ?? "",
    leaderAppealEvidence: review.leaderAppealEvidence ?? "",
    appealResolution: review.appealResolution ?? "",
    appealDecision: "rejected",
    correctedScore: review.resultVersions?.at(-1)?.score ?? calcScore(review),
  };
}

function getWorkflowSubmitPayload(review, action, draft) {
  const updates = {};
  let nextStatus = action.nextStatus;
  let note = "";

  if (["enter_result", "first_score", "second_review", "reissue_target", "change_target"].includes(action.type)) {
    updates.rows = draft.rows;
  }

  if (action.type === "confirm_target") {
    if (draft.targetDecision === "reject_change") {
      const result = rejectTargetVersion(review, { reason: draft.targetDisputeReason, operator: review.employee, actedAt: getActionTimestamp(), expectedVersion: review.version });
      if (!result.ok) return { validationError: result.message };
      return { replaceReview: result.review };
    } else if (draft.targetDecision === "dispute") {
      if (!draft.targetDisputeReason.trim()) return { validationError: "请填写绩效目标异议原因" };
      nextStatus = REVIEW_STATUS.targetDispute;
      updates.targetDisputeReason = draft.targetDisputeReason.trim();
      updates.owner = review.directLeader;
      note = `员工提出绩效目标异议：${draft.targetDisputeReason.trim()}`;
    } else if (review.pendingTargetVersion && review.targetVersions?.length) {
      const result = confirmTargetVersion(review, { operator: review.employee, actedAt: getActionTimestamp(), expectedVersion: review.version });
      if (!result.ok) return { validationError: result.message };
      return { replaceReview: result.review };
    } else {
      updates.confirmStatus = "绩效目标已确认";
      updates.activeTargetVersion = review.pendingTargetVersion ?? 1;
      updates.pendingTargetVersion = null;
      updates.targetVersions = (review.targetVersions?.length ? review.targetVersions : [{ version: 1, targets: review.assignedCategories ?? [] }]).map((item) => ({ ...item, status: item.version === (review.pendingTargetVersion ?? 1) ? "已生效" : item.status }));
      nextStatus = REVIEW_STATUS.resultEntry;
      note = `员工确认绩效目标V${review.pendingTargetVersion ?? 1}，目标已生效。`;
    }
  }

  if (action.type === "reissue_target" || action.type === "change_target") {
    const targets = draft.rows.filter((row) => row.type !== "section").map((row) => ({ ...row, weight: row.type === "adjustment" ? 0 : Number(row.weight || 0) * 100 }));
    const result = createTargetChange(review, { reason: draft.targetChangeReason, targets, operator: review.directLeader, actedAt: getActionTimestamp(), expectedVersion: review.version });
    if (!result.ok) return { validationError: result.message };
    return { replaceReview: result.review };
  }

  if (action.type === "finish_execution") {
    updates.resultSummary = draft.resultSummary;
    updates.resultStatus = "待补充";
    note ||= `数据收集完成：${draft.resultSummary || "已完成月度数据汇总，进入结果补充。"}`;
  }

  if (action.type === "enter_result") {
    const incomplete = draft.rows.filter((row) => row.type !== "section" && row.type !== "adjustment").some((row) => !String(row.selfText || "").trim() || !String(row.completionNote || "").trim() || !String(row.evidence || "").trim());
    if (incomplete) return { validationError: "请逐项目标填写实际完成结果、完成情况说明和证明材料" };
    updates.resultStatus = "已补充";
    note ||= "员工已逐项目标提交实际完成结果、完成说明、证明材料和引用信息。";
  }

  if (action.type === "first_score") {
    if (draft.firstDecision === "return") {
      if (!draft.returnReason.trim()) return { validationError: "请填写退回员工补充的原因" };
      nextStatus = REVIEW_STATUS.resultEntry;
      updates.resultStatus = "已退回补充";
      updates.resultReturnReason = draft.returnReason.trim();
      note = `证明材料不足，退回员工补充：${draft.returnReason.trim()}`;
    } else {
      const adjustmentValidation = validateAdjustmentTotal(draft.rows);
      if (!adjustmentValidation.valid) return { validationError: adjustmentValidation.reason };
      const invalidAdjustment = draft.rows.some((row) => row.type === "adjustment" && Number(row.firstScore || 0) !== 0 && (!String(row.firstComment || "").trim() || !String(row.evidence || "").trim()));
      if (invalidAdjustment) return { validationError: "每条加减分必须填写原因和证明材料" };
      note ||= "一级负责人已完成评分、评语和加减分录入。";
    }
  }

  if (action.type === "second_review") {
    note ||= "二级负责人已完成复评与评语。";
  }

  if (action.type === "hr_review") {
    updates.hrReviewComment = draft.hrReviewComment;
    if (draft.hrDecision === "return") {
      if (!draft.hrReviewComment.trim()) return { validationError: "请填写HR退回原因" };
      nextStatus = REVIEW_STATUS.firstReview;
      updates.hrReviewStatus = "已退回";
      note ||= `HR退回评分补充：${draft.hrReviewComment || "请补齐评分依据与佐证材料。"}`;
    } else {
      updates.hrReviewStatus = "已复审";
      note ||= `HR复审通过：${draft.hrReviewComment || "材料完整，提交CEO审批。"}`;
    }
  }

  if (action.type === "committee_approve") {
    updates.committeeComment = draft.committeeComment;
    if (draft.committeeDecision === "return") {
      if (!draft.committeeComment.trim()) return { validationError: "请填写CEO退回原因" };
      nextStatus = REVIEW_STATUS.firstReview;
      updates.committeeStatus = "已退回";
      note ||= `CEO退回Leader重新评分：${draft.committeeComment}`;
    } else {
      updates.committeeStatus = "已审批";
      updates.resultVersions = review.resultVersions?.length ? review.resultVersions : [{ version: 1, score: calcScore({ ...review, rows: draft.rows }), grade: getGrade(calcScore({ ...review, rows: draft.rows })), status: "已生效", operator: "CEO", actedAt: getActionTimestamp() }];
      note ||= `CEO审批通过：${draft.committeeComment || "同意绩效结果进入面谈反馈。"}`;
    }
  }

  if (action.type === "interview_feedback") {
    updates.interviewSummary = draft.interviewSummary;
    updates.improvementPlan = draft.improvementPlan;
    updates.feedbackStatus = "已面谈";
    note ||= `面谈完成：${draft.interviewSummary || "已完成绩效反馈与改进计划沟通。"}`;
  }

  if (action.type === "investigate_appeal") {
    if (!draft.appealInvestigation.trim()) return { validationError: "请填写HR申诉调查记录" };
    updates.appealInvestigation = draft.appealInvestigation.trim();
    updates.appealStatus = "待CEO裁决";
    nextStatus = REVIEW_STATUS.appealInProgress;
    note = `HR完成申诉调查：${draft.appealInvestigation.trim()}`;
  }

  if (action.type === "provide_appeal_evidence") {
    if (!draft.leaderAppealEvidence.trim()) return { validationError: "请填写原评分依据" };
    const actedAt = getActionTimestamp();
    return { replaceReview: { ...review, leaderAppealEvidence: draft.leaderAppealEvidence.trim(), version: Number(review.version ?? 1) + 1, operationLogs: [...(review.operationLogs ?? []), { id: `${review.id}-log-${(review.operationLogs?.length ?? 0) + 1}`, action: "Leader提供原评分依据", operator: review.directLeader, actedAt, note: draft.leaderAppealEvidence.trim(), fromStatus: review.status, toStatus: review.status }] } };
  }

  if (action.type === "resolve_appeal") {
    const result = resolveAppealResult(review, { decision: draft.appealDecision, correctedScore: draft.correctedScore, reason: draft.appealResolution, operator: "CEO", actedAt: getActionTimestamp() });
    if (!result.ok) return { validationError: result.message };
    return { replaceReview: result.review };
  }

  return { nextStatus, note, updates };
}

function AppealPage({ review, onBack, onSave }) {
  const [draft, setDraft] = useState({
    reason: review.appealReason ?? "",
    evidence: review.appealEvidence ?? "",
    expectedResolution: review.expectedResolution ?? "",
  });

  return (
    <div className="workflow-page appeal-page">
      <div className="workflow-page__header">
        <button className="ghost-chip" onClick={onBack} type="button">返回列表</button>
        <div>
          <strong>{review.employee} 绩效申诉</strong>
          <div className="workflow-header-meta">
            <span>{review.department}</span>
            <span>{review.role}</span>
            <span>{review.cycle}</span>
          </div>
        </div>
        <button className="primary-btn" onClick={() => onSave(review.id, draft)} type="button">提交申诉</button>
      </div>
      <div className="appeal-page__notice">员工需在知晓结果后 2 个工作日内提交，综合管理中心 2 个工作日内完成调查协调。</div>
      <label className="form-block"><span>申诉事项与原因</span><textarea rows={4} value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} /></label>
      <label className="form-block"><span>绩效数据举证</span><textarea rows={4} value={draft.evidence} onChange={(e) => setDraft({ ...draft, evidence: e.target.value })} /></label>
      <label className="form-block"><span>建议解决方案</span><textarea rows={3} value={draft.expectedResolution} onChange={(e) => setDraft({ ...draft, expectedResolution: e.target.value })} /></label>
    </div>
  );
}

function getReviewMetricRows(review, categories = []) {
  if (review?.rows?.length) {
    let currentSection = "";
    return review.rows.reduce((items, row) => {
      if (row.type === "section") {
        currentSection = row.label;
        return items;
      }
      return [...items, { ...row, section: currentSection }];
    }, []);
  }

  return categories.map((category) => ({
    key: category.id,
    label: category.name,
    section: category.name,
    standard: category.requirement,
    source: "月度绩效目标 / 任务记录 / 佐证材料",
    weight: Number(category.weight || 0) / 100,
    type: category.id === "adjustment" ? "adjustment" : "metric",
    selfText: "",
    firstScore: "",
    secondScore: "",
    firstComment: "",
    secondComment: "",
  }));
}

function getScoreBands(row) {
  const standard = row.standard || row.requirement || "按岗位月度绩效目标完成情况、交付质量、过程记录和佐证材料综合评定。";
  return [
    `S（80-100分）：${standard}`,
    `A（70-不足80分）：达到岗位要求，核心交付完成，过程记录完整。`,
    `B（60-不足70分）：基本完成月度要求，存在少量延期或质量问题。`,
    `C（55-不足60分）：部分目标未达成，需要明确改进计划。`,
    `D（不足55分）：未达到当月要求，需补充原因、证明材料与改进计划。`,
  ];
}

function getEmployeeReferenceData(review) {
  if (!review) return null;
  const seed = [...review.employee].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const scriptSubmit = 32 + (seed % 28);
  const repeatSubmit = 2 + (seed % 7);
  const storyboardTotal = 680 + (seed % 420);
  const usableStoryboard = Math.round(storyboardTotal * (0.72 + (seed % 14) / 100));
  const usableMinutes = Math.round((usableStoryboard / 18) * 10) / 10;
  const cost = 12800 + (seed % 46) * 620;
  const projectNames = ["短剧主线脚本", "AI分镜生成", "红果素材复盘"].map((name, index) => `${name}-${review.employee.slice(0, 1)}${index + 1}`);
  const materialPublished = 28 + (seed % 42);
  const auditPassed = Math.round(materialPublished * (0.76 + (seed % 12) / 100));
  const issueCount = Math.max(1, repeatSubmit - 1);
  const projectCost = (multiplier) => Math.round(cost * multiplier);
  const projectSubmitDuration = (base) => `${Math.round((base + (seed % 18) / 10) * 10) / 10}小时`;
  const projectGenerateDuration = (base) => `${Math.round((base + (seed % 16) / 10) * 10) / 10}小时`;
  const hongguoMetrics = (index, multiplier) => ({
    workEpisodes: `${12 + index * 6 + (seed % 8)}集`,
    workDuration: `${Math.round((120 + index * 55 + (seed % 46)) * multiplier)}分钟`,
    clickRate: `${Math.min(98, 42 + index * 9 + (seed % 22))}%`,
    firstEpisodeCompletion: `${Math.min(96, 38 + index * 8 + (seed % 24))}%`,
    tenMinuteCompletion: `${Math.min(92, 34 + index * 7 + (seed % 20))}%`,
    thirtyMinuteCompletion: `${Math.min(86, 28 + index * 6 + (seed % 18))}%`,
    sixtyMinuteCompletion: `${Math.min(78, 18 + index * 5 + (seed % 16))}%`,
    averageEpisodesPlayed: `${Math.round((2.4 + index * 1.1 + (seed % 18) / 10) * 10) / 10}集`,
  });

  return {
    projectSummary: [
      { label: "参与项目", value: `${projectNames.length}个`, note: "按项目汇总" },
      { label: "待补充数据", value: `${issueCount}项`, note: "需完善原因或佐证" },
      { label: "可用素材", value: `${usableStoryboard + auditPassed}条`, note: "进入评分参考" },
      { label: "消耗金额", value: `¥${cost.toLocaleString("zh-CN")}`, note: "模型与制作成本" },
    ],
    projectRows: [
      {
        project: projectNames[0],
        owner: review.employee,
        status: "已交付",
        scriptChapters: scriptSubmit,
        repeatSubmits: repeatSubmit,
        generationCount: Math.round(storyboardTotal * 0.38),
        generationDuration: projectGenerateDuration(11.2),
        usableStoryboards: Math.round(usableStoryboard * 0.34),
        usableDuration: `${Math.round(usableMinutes * 0.34 * 10) / 10}分钟`,
        cost: projectCost(0.32),
        submitDuration: projectSubmitDuration(8.5),
        rejectedOnce: Math.max(1, seed % 4),
        rejectedTwice: seed % 3,
        rejectedThird: seed % 2,
        ...hongguoMetrics(0, 0.92),
      },
      {
        project: projectNames[1],
        owner: review.employee,
        status: "进行中",
        scriptChapters: Math.round(scriptSubmit * 0.45),
        repeatSubmits: Math.max(1, repeatSubmit - 2),
        generationCount: storyboardTotal,
        generationDuration: projectGenerateDuration(18.6),
        usableStoryboards: usableStoryboard,
        usableDuration: `${usableMinutes}分钟`,
        cost: projectCost(0.48),
        submitDuration: projectSubmitDuration(14.2),
        rejectedOnce: Math.max(0, (seed + 1) % 5),
        rejectedTwice: (seed + 1) % 3,
        rejectedThird: 0,
        ...hongguoMetrics(1, 1.18),
      },
      {
        project: projectNames[2],
        owner: review.employee,
        status: "待复核",
        scriptChapters: Math.max(8, scriptSubmit - 20),
        repeatSubmits: Math.max(1, repeatSubmit - 3),
        generationCount: Math.round(storyboardTotal * 0.24),
        generationDuration: projectGenerateDuration(7.4),
        usableStoryboards: auditPassed,
        usableDuration: `${Math.round(usableMinutes * 0.22 * 10) / 10}分钟`,
        cost: projectCost(0.2),
        submitDuration: projectSubmitDuration(5.8),
        rejectedOnce: Math.max(0, (seed + 2) % 4),
        rejectedTwice: (seed + 2) % 2,
        rejectedThird: seed % 2,
        ...hongguoMetrics(2, 1.34),
      },
    ],
  };
}

function getHongguoProjectRecords(hongguoUploads) {
  return hongguoUploads
    .flatMap((upload) => upload.records.map((record) => ({ ...record, uploadName: upload.fileName, importedAt: upload.importedAt })));
}

function escapeExcelXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildExcelWorksheet(name, headers, rows) {
  const serializeRow = (cells) => `<Row>${cells.map((cell) => `<Cell><Data ss:Type="String">${escapeExcelXml(cell)}</Data></Cell>`).join("")}</Row>`;
  return `<Worksheet ss:Name="${escapeExcelXml(name)}"><Table>${serializeRow(headers)}${rows.map(serializeRow).join("")}</Table></Worksheet>`;
}

function exportPerformanceDetailExcel(review, hongguoUploads = []) {
  const projectData = getEmployeeReferenceData(review);
  const weeklyReports = mergeWeeklyReports(
    dashboardWeeklyReports,
    readStoredWeeklyReports(window.localStorage),
  );
  const weeklyReference = buildWeeklyReference(review, dashboardPeople, weeklyReports);
  const metricRows = getReviewMetricRows(review);
  const hongguoRecords = getHongguoProjectRecords(hongguoUploads);
  const targetVersions = review.targetVersions?.length ? review.targetVersions : [{ version: 1, status: "已生效", operator: review.directLeader, actedAt: review.lastActionAt, changeReason: "首次下发", targets: review.rows }];
  const sheets = [
    buildExcelWorksheet("基本信息", ["字段", "内容"], [
      ["姓名", review.employee], ["部门", review.department], ["岗位", review.role], ["考核周期", review.cycle],
      ["岗位模板", getReviewTemplate(review).name], ["流程状态", review.status], ["目标版本", `V${review.activeTargetVersion ?? 1}`],
      ["申诉状态", review.appealStatus], ["基础绩效分", calcBaseScore(review)], ["加减分", calcAdjustmentScore(review)],
      ["最终绩效分", calcScore(review)], ["绩效等级", getGrade(calcScore(review))], ["直属Leader", review.directLeader],
      ["二级Leader", review.indirectLeader], ["最后操作时间", review.lastActionAt], ["导出时间", getActionTimestamp()],
    ]),
    buildExcelWorksheet("评分明细", ["分组", "指标", "类型", "权重", "评定标准", "数据来源", "完成结果", "完成说明", "证明材料", "一级评分", "一级评语", "二级评分", "二级评语", "综合得分", "计入结果"], metricRows.map((row) => [
      row.section, row.label, row.type === "adjustment" ? "加减分" : "绩效目标", row.type === "adjustment" ? "--" : `${Number(row.weight || 0) * 100}%`, row.standard,
      row.source, row.selfText, row.completionNote, row.evidence, row.firstScore, row.firstComment, row.secondScore, row.secondComment,
      Number(calcRowComposite(row, review).toFixed(2)), calcRowScore(row, review),
    ])),
    buildExcelWorksheet("目标版本", ["版本", "状态", "变更原因", "操作人", "操作时间", "目标数量", "目标摘要"], targetVersions.map((version) => [
      `V${version.version}`, version.status, version.changeReason || "首次下发", version.operator || review.directLeader, version.actedAt || review.lastActionAt,
      version.targets?.filter((item) => item.type !== "section").length ?? 0,
      (version.targets ?? []).filter((item) => item.type !== "section").map((item) => `${item.label || item.name}（${item.type === "adjustment" ? "加减分" : `${Number(item.weight || 0) * (Number(item.weight || 0) <= 1 ? 100 : 1)}%`}）`).join("；"),
    ])),
    buildExcelWorksheet("结果版本", ["版本", "最终分", "等级", "状态", "裁决/说明", "操作人", "操作时间"], (review.resultVersions?.length ? review.resultVersions : [["--", "--", "--", "未生成", "当前流程尚未生成正式绩效结果版本", "--", "--"]]).map((version) => Array.isArray(version) ? version : [
      `V${version.version}`, version.score, version.grade, version.status, version.reason || version.appealDecision || "正式绩效结果", version.operator || "系统", version.actedAt || review.lastActionAt,
    ])),
    buildExcelWorksheet("周报参考", ["周次", "周期", "状态", "提交时间", "本周成果", "风险事项", "下周计划", "来源"], weeklyReference.weeks.map((week) => [
      week.label, week.dateRange, week.status === "normal" ? "按时提交" : week.status === "late" ? "逾期提交" : "未提交", week.submittedAt || "--", week.achievement, week.risk, week.nextPlan || "--", weeklyReference.sourceLabel,
    ])),
    buildExcelWorksheet("项目参考数据", ["项目名称", "负责人", "状态", "剧本提交章数", "重复提交次数", "生成总次数", "生成总时长", "可用分镜数", "可用总时长", "消费金额", "提交总时长", "驳回1次", "驳回2次", "驳回3次及以上", "作品集数", "作品总时长", "累计点击率", "首集完播", "10分钟完播", "30分钟完播", "60分钟完播", "人均播放集数"], (projectData?.projectRows ?? []).map((project) => [
      project.project, project.owner, project.status, project.scriptChapters, project.repeatSubmits, project.generationCount, project.generationDuration, project.usableStoryboards, project.usableDuration, project.cost, project.submitDuration, project.rejectedOnce, project.rejectedTwice, project.rejectedThird, project.workEpisodes, project.workDuration, project.clickRate, project.firstEpisodeCompletion, project.tenMinuteCompletion, project.thirtyMinuteCompletion, project.sixtyMinuteCompletion, project.averageEpisodesPlayed,
    ])),
    buildExcelWorksheet("红果数据", ["导入文件", "导入时间", ...HONGGUO_REQUIRED_COLUMNS], hongguoRecords.map((record) => [record.uploadName, record.importedAt, ...HONGGUO_REQUIRED_COLUMNS.map((column) => record[column] ?? "")])),
    buildExcelWorksheet("操作日志", ["操作", "操作人", "操作时间", "原状态", "目标状态", "备注"], (review.operationLogs ?? []).map((log) => [log.action, log.operator, log.actedAt, log.fromStatus, log.toStatus, log.note || ""])),
  ];
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets.join("")}</Workbook>`;
  const blob = new Blob([`\uFEFF${workbook}`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${review.employee}-${review.cycle}-绩效详情.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function PerformanceReferencePanel({ review, hongguoUploads = [] }) {
  const [weeklyRevision, setWeeklyRevision] = useState(0);
  const data = getEmployeeReferenceData(review);
  const weeklyReference = useMemo(() => {
    const reports = mergeWeeklyReports(
      dashboardWeeklyReports,
      readStoredWeeklyReports(typeof window === "undefined" ? null : window.localStorage),
    );
    return buildWeeklyReference(review, dashboardPeople, reports);
  }, [review, weeklyRevision]);
  const hongguoRecords = getHongguoProjectRecords(hongguoUploads);

  useEffect(() => {
    const refreshWeeklyReference = () => setWeeklyRevision((value) => value + 1);
    const handleStorage = (event) => {
      if (event.key === WEEKLY_REPORT_STORAGE_KEY) refreshWeeklyReference();
    };
    const handleMessage = (event) => {
      if (event.origin === window.location.origin && event.data?.type === WEEKLY_REPORT_UPDATED_EVENT) refreshWeeklyReference();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", refreshWeeklyReference);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", refreshWeeklyReference);
    };
  }, []);

  if (!data) return null;

  return (
    <div className="performance-reference-panel">
      <section className="weekly-reference-compact" aria-label="当月周报记录">
        <div className="weekly-reference-compact__header">
          <div>
            <strong>当月周报</strong>
            <span>{review.cycle} · 数据来源：{weeklyReference.sourceLabel}</span>
          </div>
          <div className="weekly-reference-compact__status" aria-label="周报提交概况">
            <span>已提交 <b>{weeklyReference.submitted}/{weeklyReference.requiredWeeks}</b></span>
            {weeklyReference.late ? <span>逾期 <b>{weeklyReference.late}</b></span> : null}
            {weeklyReference.missing ? <span>未提交 <b>{weeklyReference.missing}</b></span> : null}
          </div>
        </div>
        {weeklyReference.weeks.length ? (
          <div className="weekly-reference-list">
            {weeklyReference.weeks.map((week) => (
              <div className="weekly-reference-list__row" key={week.id}>
                <div className="weekly-reference-list__period"><b>{week.label}</b><span>{week.dateRange}</span></div>
                <span className={`weekly-reference-list__status is-${week.status}`}>{week.status === "normal" ? "按时" : week.status === "late" ? "逾期" : "未提交"}</span>
                <p><b>本周成果</b>{week.achievement}</p>
                <p><b>风险事项</b>{week.risk}</p>
              </div>
            ))}
          </div>
        ) : <p className="weekly-reference-empty">该员工当月暂无周报记录</p>}
      </section>
      <div className="project-data-table-wrap">
        <table className="project-data-table">
          <thead>
            <tr className="project-data-table__group-row">
              <th rowSpan={2}>项目名称</th>
              <th rowSpan={2}>状态</th>
              <th colSpan={2}>编剧</th>
              <th colSpan={5}>制作</th>
              <th colSpan={4}>剪辑</th>
              <th colSpan={8}>红果数据</th>
            </tr>
            <tr>
              <th>剧本提交章数</th>
              <th>重复提交次数</th>
              <th>生成总次数</th>
              <th>生成总时长</th>
              <th>可用分镜数</th>
              <th>可用总时长</th>
              <th>消费金额</th>
              <th>提交总时长</th>
              <th>驳回1次</th>
              <th>驳回2次</th>
              <th>驳回3次及以上</th>
              <th>作品集数</th>
              <th>作品总时长</th>
              <th>累计点击率</th>
              <th>首集完播进度</th>
              <th>10分钟完播率</th>
              <th>30分钟完播率</th>
              <th>60分钟完播率</th>
              <th>人均播放集数</th>
            </tr>
          </thead>
          <tbody>
            {data.projectRows.map((project) => (
              <tr key={project.project}>
                <td>
                  <strong>{project.project}</strong>
                  <span>负责人：{project.owner}</span>
                </td>
                <td><b className="project-status-pill">{project.status}</b></td>
                <td>{project.scriptChapters}章</td>
                <td>{project.repeatSubmits}次</td>
                <td>{project.generationCount}次</td>
                <td>{project.generationDuration}</td>
                <td>{project.usableStoryboards}张</td>
                <td>{project.usableDuration}</td>
                <td>¥{project.cost.toLocaleString("zh-CN")}</td>
                <td>{project.submitDuration}</td>
                <td>{project.rejectedOnce}次</td>
                <td>{project.rejectedTwice}次</td>
                <td>{project.rejectedThird}次</td>
                <td>{project.workEpisodes}</td>
                <td>{project.workDuration}</td>
                <td>{project.clickRate}</td>
                <td>{project.firstEpisodeCompletion}</td>
                <td>{project.tenMinuteCompletion}</td>
                <td>{project.thirtyMinuteCompletion}</td>
                <td>{project.sixtyMinuteCompletion}</td>
                <td>{project.averageEpisodesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hongguoRecords.length ? (
        <section className="hongguo-reference">
          <div className="hongguo-reference__header">
            <div>
              <strong>红果作品数据</strong>
              <span>已导入 {hongguoRecords.length} 条作品记录，可参考点击率与各阶段完播率评分</span>
            </div>
            <b className="field-pill field-pill--success">已上传</b>
          </div>
          <div className="hongguo-reference__table-wrap">
            <table className="hongguo-reference__table">
              <thead><tr><th>作品名称</th><th>剧目类型 / 体裁</th><th>发布时间</th><th>集数</th><th>累计点击率</th><th>首集完播</th><th>10分钟</th><th>30分钟</th><th>60分钟</th><th>人均播放</th></tr></thead>
              <tbody>{hongguoRecords.map((record) => <tr key={`${record.uploadName}-${record.id}`}><td><strong>{record["作品名称"]}</strong><small>{record["作品ID"]}</small></td><td>{record["剧目类型"]} / {record["剧目体裁"]}</td><td>{record["发布时间"]}</td><td>{record["作品集数"]}</td><td>{record["累计点击率"]}</td><td>{record["首集完播进度"]}</td><td>{record["10分钟完播率"]}</td><td>{record["30分钟完播率"]}</td><td>{record["60分钟完播率"]}</td><td>{record["人均播放集数"]}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function OkrSheetPreview({ review, categories, actionType = "readonly", rows: controlledRows, onRowsChange }) {
  const rows = controlledRows ?? getReviewMetricRows(review, categories);
  const displayRows = rows.some((row) => row.type === "section")
    ? rows.reduce((items, row) => {
        if (row.type === "section") return items;
        return [...items, row];
      }, [])
    : rows;
  const needsSecondReview = requiresSecondReview(review);
  const title = review ? `${review.roleTemplateName} 绩效目标评分表` : "月度绩效目标下发模板";
  const totalScore = review ? calcScore({ ...review, rows }) : null;
  const totalGrade = totalScore === null ? "--" : `${getGrade(totalScore)}-${getLevelLabel(totalScore)}`;
  const employeePlaceholder = actionType === "enter_result" || actionType === "finish_execution" ? "员工填写完成情况、核心数据、未完成原因与佐证说明" : "员工确认后填写本月完成情况";
  const firstPlaceholder = actionType === "first_score" ? "一级评分" : "待一级上级评分";
  const secondPlaceholder = needsSecondReview ? (actionType === "second_review" ? "二级评分" : "待二级上级评分") : "无需二级评分";
  const canEditResult = actionType === "enter_result";
  const canEditFirst = actionType === "first_score";
  const canEditSecond = actionType === "second_review" && needsSecondReview;
  const updateRow = (key, patch) => {
    if (!onRowsChange) return;
    onRowsChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  return (
    <div className="okr-sheet-card">
      <div className="okr-sheet-card__header">
        <div>
          <strong>{title}</strong>
          <span>{review ? `${review.employee} / ${review.department} / ${review.cycle}` : "岗位通用目标与个人月度目标确认后，由员工逐项填报完成结果"}</span>
        </div>
        <div className="okr-sheet-card__summary">
          {review ? <span><small>最终绩效分</small><strong>{Number(totalScore.toFixed(2))}<em>分</em></strong><i>{totalGrade}</i></span> : null}
          <b>{review ? review.status : "待下发"}</b>
        </div>
      </div>
      <div className="okr-sheet-scroll">
        <table className="okr-sheet-table">
          <thead>
            <tr>
              <td>指标名称</td>
              <td>评定标准</td>
              <td>数据来源</td>
              <td>权重</td>
              <td>完成情况（被考核人自填）</td>
              <td>第一级上级评分</td>
              <td>评语</td>
              <td>第二级上级评分</td>
              <td>评语</td>
              <td>单项综合得分</td>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => {
              const rowComposite = review ? calcRowComposite(row, review) : "";
              return (
                <tr key={row.key ?? row.id ?? row.label}>
                  <td>
                    <strong>{row.label}</strong>
                    <small>{row.section}</small>
                  </td>
                  <td>
                    <div className="okr-score-bands">
                      {getScoreBands(row).map((band) => <p key={band}>{band}</p>)}
                    </div>
                  </td>
                  <td>{row.source || "月度绩效目标 / 工作平台记录 / 负责人评价"}</td>
                  <td>{row.type === "adjustment" ? "加减分" : `${Math.round((row.weight ?? 0) * 100)}%`}</td>
                  <td className="okr-sheet-table__completion">
                    <span className="okr-inline-label">员工填写</span>
                    <textarea
                      disabled={!canEditResult}
                      value={row.selfText ?? ""}
                      onChange={(event) => updateRow(row.key, { selfText: event.target.value })}
                      placeholder={employeePlaceholder}
                      rows={4}
                    />
                    {canEditResult && row.type !== "adjustment" ? <>
                      <textarea value={row.completionNote ?? ""} onChange={(event) => updateRow(row.key, { completionNote: event.target.value })} placeholder="完成情况说明（必填）" rows={2} />
                      <textarea value={row.evidence ?? ""} onChange={(event) => updateRow(row.key, { evidence: event.target.value })} placeholder="证明材料（必填）" rows={2} />
                      <input value={row.reference ?? ""} onChange={(event) => updateRow(row.key, { reference: event.target.value })} placeholder="引用项目、任务或周报" />
                    </> : null}
                  </td>
                  <td><input disabled={!canEditFirst} value={row.firstScore ?? ""} onChange={(event) => updateRow(row.key, { firstScore: normalizeScore(event.target.value) })} placeholder={firstPlaceholder} type="number" /></td>
                  <td><textarea disabled={!canEditFirst} value={row.firstComment ?? ""} onChange={(event) => updateRow(row.key, { firstComment: event.target.value })} placeholder={row.type === "adjustment" ? "加减分原因（必填）" : "一级评语"} rows={4} />{canEditFirst && row.type === "adjustment" ? <input value={row.evidence ?? ""} onChange={(event) => updateRow(row.key, { evidence: event.target.value })} placeholder="加减分证明材料（必填）" /> : null}</td>
                  <td><input value={needsSecondReview ? row.secondScore ?? "" : ""} disabled={!canEditSecond} onChange={(event) => updateRow(row.key, { secondScore: normalizeScore(event.target.value) })} placeholder={secondPlaceholder} type="number" /></td>
                  <td><textarea value={needsSecondReview ? row.secondComment ?? "" : ""} disabled={!canEditSecond} onChange={(event) => updateRow(row.key, { secondComment: event.target.value })} placeholder={needsSecondReview ? "二级评语" : "无需二级评语"} rows={4} /></td>
                  <td><strong>{rowComposite === "" ? "--" : Number(rowComposite.toFixed(1))}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HongguoUploadModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState("");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseHongguoCsv(String(reader.result ?? ""));
        setFileName(file.name);
        setRecords(parsed.records);
        setError("");
      } catch (parseError) {
        setFileName(file.name);
        setRecords([]);
        setError(parseError.message || "文件解析失败，请检查导出格式。");
      }
    };
    reader.onerror = () => setError("文件读取失败，请重新选择 CSV 文件。");
    reader.readAsText(file, "utf-8");
  };

  const submit = () => {
    if (!records.length) return;
    onImport({
      fileName,
      records,
      importedAt: getActionTimestamp(),
    });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="modal hongguo-upload-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div><strong>上传红果数据</strong><span>导入运营从红果后台导出的作品数据 CSV，以作品名称和作品 ID 自动关联项目。</span></div>
          <button aria-label="关闭上传窗口" className="icon-btn" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <div className="modal__body hongguo-upload-modal__body">
          <div className="hongguo-upload-dropzone">
            <FileCsv size={28} weight="duotone" />
            <strong>{fileName || "选择红果作品数据 CSV"}</strong>
            <span>需包含 {HONGGUO_REQUIRED_COLUMNS.length} 个导出字段，将自动校验作品、点击率和完播指标。</span>
            <label className="primary-btn primary-btn--compact" htmlFor="hongguo-csv-file"><UploadSimple size={16} weight="bold" />选择CSV文件</label>
            <input accept=".csv,text/csv" id="hongguo-csv-file" onChange={handleFileChange} type="file" />
          </div>
          {error ? <p className="hongguo-upload-error">{error}</p> : null}
          {records.length ? <div className="hongguo-upload-preview"><div><strong>解析成功</strong><span>{records.length} 条作品记录将按作品名称和作品 ID 关联到项目数据。</span></div><div className="hongguo-upload-preview__table-wrap"><table><thead><tr><th>作品名称</th><th>作品ID</th><th>累计点击率</th><th>首集完播</th><th>60分钟完播</th></tr></thead><tbody>{records.slice(0, 5).map((record) => <tr key={record.id}><td>{record["作品名称"]}</td><td>{record["作品ID"]}</td><td>{record["累计点击率"]}</td><td>{record["首集完播进度"]}</td><td>{record["60分钟完播率"]}</td></tr>)}</tbody></table></div>{records.length > 5 ? <small>仅预览前 5 条记录。</small> : null}</div> : null}
        </div>
        <div className="action-row"><button className="ghost-chip" onClick={onClose} type="button">取消</button><button className="primary-btn" disabled={!records.length} onClick={submit} type="button">确认导入</button></div>
      </div>
    </div>
  );
}

function WorkflowActionPage({ review, action, onBack, onSubmit, hongguoUploads }) {
  const [draft, setDraft] = useState(() => getWorkflowDefaultDraft(review, action));
  const [submitError, setSubmitError] = useState("");
  if (!review || !action) return null;
  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = () => {
    const payload = getWorkflowSubmitPayload(review, action, draft);
    if (payload.validationError) {
      setSubmitError(payload.validationError);
      return;
    }
    setSubmitError("");
    onSubmit(payload);
  };

  return (
    <div className="workflow-page">
      <div className="workflow-page__header">
        <button className="ghost-chip" onClick={onBack} type="button">返回列表</button>
        <div className="workflow-page__title-line">
          <strong>{action.label}处理</strong>
          <div className="workflow-header-meta">
            <span>考核人：{review.employee}</span>
            <span>考核周期：{review.cycle}</span>
          </div>
        </div>
        <button className="primary-btn" onClick={submit} type="button">确认提交</button>
      </div>
      <div className="workflow-form-panel">
        {submitError ? <div className="performance-template-warning" role="alert">{submitError}，已保留当前填写内容。</div> : null}
        {action.type === "confirm_target" ? <>
          <div className="form-grid"><label><span>确认结论</span><select value={draft.targetDecision} onChange={(event) => updateDraft("targetDecision", event.target.value)}><option value="confirm">确认绩效目标</option><option value="dispute">提出异议</option>{review.activeTargetVersion ? <option value="reject_change">拒绝本次目标变更</option> : null}</select></label></div>
          {draft.targetDecision !== "confirm" ? <label className="form-block"><span>{draft.targetDecision === "dispute" ? "异议原因" : "拒绝原因"}</span><textarea rows={3} value={draft.targetDisputeReason} onChange={(event) => updateDraft("targetDisputeReason", event.target.value)} placeholder="必填；说明需要调整的目标、权重或交付标准" /></label> : null}
        </> : null}
        {["reissue_target", "change_target"].includes(action.type) ? <label className="form-block"><span>变更原因</span><textarea rows={3} value={draft.targetChangeReason} onChange={(event) => updateDraft("targetChangeReason", event.target.value)} placeholder="必填；提交后生成新的待确认版本，历史版本不会被覆盖" /></label> : null}
        {action.type === "finish_execution" ? (
          <label className="form-block"><span>数据收集说明</span><textarea rows={3} value={draft.resultSummary} onChange={(event) => updateDraft("resultSummary", event.target.value)} placeholder="说明已汇总的数据来源、缺失项和下一步补充要求" /></label>
        ) : null}
        {action.type === "first_score" ? <>
          <div className="form-grid"><label><span>结果审核结论</span><select value={draft.firstDecision} onChange={(event) => updateDraft("firstDecision", event.target.value)}><option value="score">信息完整，进入评分</option><option value="return">证明材料不足，退回员工补充</option></select></label></div>
          {draft.firstDecision === "return" ? <label className="form-block"><span>退回原因</span><textarea rows={3} value={draft.returnReason} onChange={(event) => updateDraft("returnReason", event.target.value)} placeholder="必填；员工原始填报内容将保留" /></label> : null}
        </> : null}
        {action.type === "hr_review" ? (
          <>
            <div className="form-grid">
              <label><span>处理结论</span><select value={draft.hrDecision} onChange={(event) => updateDraft("hrDecision", event.target.value)}><option value="submit">提交CEO审批</option><option value="return">退回Leader重新评分</option></select></label>
            </div>
            <label className="form-block"><span>HR复审意见</span><textarea rows={4} value={draft.hrReviewComment} onChange={(event) => updateDraft("hrReviewComment", event.target.value)} placeholder="填写材料核验、加减分核对及需CEO关注的问题" /></label>
          </>
        ) : null}
        {action.type === "committee_approve" ? (
          <>
            <div className="form-grid">
              <label><span>审批结论</span><select value={draft.committeeDecision} onChange={(event) => updateDraft("committeeDecision", event.target.value)}><option value="approve">审批通过</option><option value="return">退回Leader重新评分</option></select></label>
            </div>
            <label className="form-block"><span>CEO审批意见</span><textarea rows={4} value={draft.committeeComment} onChange={(event) => updateDraft("committeeComment", event.target.value)} placeholder="填写审批意见；退回时必须说明Leader需要修正的内容" /></label>
          </>
        ) : null}
        {action.type === "interview_feedback" ? (
          <>
            <label className="form-block"><span>面谈纪要</span><textarea rows={4} value={draft.interviewSummary} onChange={(event) => updateDraft("interviewSummary", event.target.value)} placeholder="记录绩效沟通结论、员工反馈和确认情况" /></label>
            <label className="form-block"><span>改进计划</span><textarea rows={3} value={draft.improvementPlan} onChange={(event) => updateDraft("improvementPlan", event.target.value)} placeholder="填写下月改进事项、责任人和跟进节点" /></label>
          </>
        ) : null}
        {action.type === "investigate_appeal" ? <label className="form-block"><span>HR调查记录</span><textarea rows={4} value={draft.appealInvestigation} onChange={(event) => updateDraft("appealInvestigation", event.target.value)} placeholder="记录申诉材料核验、Leader原评分依据和调查结论" /></label> : null}
        {action.type === "provide_appeal_evidence" ? <label className="form-block"><span>原评分依据</span><textarea rows={4} value={draft.leaderAppealEvidence} onChange={(event) => updateDraft("leaderAppealEvidence", event.target.value)} placeholder="填写原评分、评语、加减分和证明材料依据" /></label> : null}
        {action.type === "resolve_appeal" ? (
          <>
            <div className="form-grid">
              <label><span>CEO裁决结论</span><select value={draft.appealDecision} onChange={(event) => updateDraft("appealDecision", event.target.value)}><option value="rejected">驳回</option><option value="partial">部分成立</option><option value="approved">成立</option></select></label>
              {draft.appealDecision !== "rejected" ? <label><span>修正后分数</span><input min="0" max="100" type="number" value={draft.correctedScore} onChange={(event) => updateDraft("correctedScore", Number(event.target.value))} /></label> : null}
            </div>
            <label className="form-block"><span>CEO裁决理由</span><textarea rows={3} value={draft.appealResolution} onChange={(event) => updateDraft("appealResolution", event.target.value)} placeholder="必填；说明证据判断、是否调整分数及最终结论" /></label>
          </>
        ) : null}
      </div>
      <PerformanceReferencePanel review={review} hongguoUploads={hongguoUploads} />
      <OkrSheetPreview review={review} actionType={action.type} rows={draft.rows} onRowsChange={(rows) => updateDraft("rows", rows)} />
    </div>
  );
}

function RuleModal({ onClose }) {
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div>
            <strong>绩效制度规则</strong>
            <span>月度绩效只允许下发当月及未来月份，历史月份不可补发。</span>
          </div>
          <button className="icon-btn" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <div className="modal__body">
          <div className="rule-list">
            <div><b>查看范围</b><span>上级可查看直属下级与跨级下级；员工仅查看本人；HR 与老板可查看全公司。</span></div>
            <div><b>下发范围</b><span>下发人员只能选择自己权限范围内的下级人员，不能越权下发。</span></div>
            <div><b>绩效模板</b><span>默认提供六大类绩效，支持新增、编辑、删除绩效项及占比。</span></div>
            <div><b>流程规则</b><span>月度绩效目标下发并由员工确认后，员工逐项填报结果，再进入一二级评分、HR复审、CEO审批、反馈面谈和申诉处理。</span></div>
          </div>
          <div className="action-row">
            <button className="primary-btn" onClick={onClose} type="button">知道了</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TargetTemplateModal({ templates, departments, onSave, onCreate, onClose }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) ?? templates[0];
  const [draft, setDraft] = useState(() => ({ ...selectedTemplate, categories: clonePerformanceCategories(selectedTemplate?.categories) }));
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [departmentError, setDepartmentError] = useState("");

  useEffect(() => {
    const next = templates.find((item) => item.id === selectedTemplateId) ?? templates[0];
    setDraft({ ...next, categories: clonePerformanceCategories(next?.categories) });
  }, [selectedTemplateId, templates]);

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateCategory = (categoryId, key, value) => setDraft((current) => ({
    ...current,
    categories: current.categories.map((item) => item.id === categoryId ? { ...item, [key]: value } : item),
  }));
  const addTemplateTarget = () => setDraft((current) => {
    const nextIndex = current.categories.filter((item) => item.origin === "template").length + 1;
    return {
      ...current,
      categories: [...current.categories, {
        id: `template-custom-${nextIndex}`,
        name: "新增绩效目标",
        weight: 0,
        requirement: "请填写目标要求和衡量标准。",
        origin: "template",
        mandatory: true,
        type: "weighted",
      }],
    };
  });
  const createDepartment = () => {
    const department = newDepartmentName.trim();
    if (!department) {
      setDepartmentError("请输入部门名称");
      return;
    }
    if (departments.includes(department)) {
      updateDraft("department", department);
      setNewDepartmentName("");
      setDepartmentError("");
      setCreatingDepartment(false);
      return;
    }
    const next = onCreate({
      department,
      role: draft.role || "通用岗位",
      name: `${department}月度绩效模板`,
      categories: clonePerformanceCategories(draft.categories),
    });
    setSelectedTemplateId(next.id);
    setNewDepartmentName("");
    setDepartmentError("");
    setCreatingDepartment(false);
  };
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="modal target-template-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="维护岗位绩效目标模板">
        <div className="modal__header target-template-modal__header"><div><strong>维护部门岗位绩效模板</strong></div><button aria-label="关闭模板维护" className="icon-btn" onClick={onClose} type="button"><X size={18} /></button></div>
        <div className="modal__body target-template-modal__body">
          <section className="template-management-section" aria-label="模板范围">
            <div className="template-management-section__head"><div><strong>模板范围</strong><span>每个部门和岗位分别维护，避免跨岗位复用错误指标。</span></div><span className="field-pill field-pill--primary">HR维护</span></div>
            <div className="template-management-fields">
            <label><span>所属部门</span><div className="template-department-picker"><select aria-label="模板所属部门" value={draft.department ?? ""} onChange={(event) => updateDraft("department", event.target.value)}>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="ghost-chip" onClick={() => { setCreatingDepartment(true); setDepartmentError(""); }} type="button">新建部门</button></div></label>
            {creatingDepartment ? <div className="template-new-department"><input aria-label="新部门名称" autoFocus onChange={(event) => setNewDepartmentName(event.target.value)} placeholder="请输入部门名称" value={newDepartmentName} /><button className="primary-btn" onClick={createDepartment} type="button">确认新建部门</button><button className="table-link" onClick={() => { setCreatingDepartment(false); setDepartmentError(""); }} type="button">取消</button>{departmentError ? <small>{departmentError}</small> : null}</div> : null}
            </div>
          </section>
          <section className="template-management-section template-management-section--metrics" aria-label="模板必选目标">
            <div className="template-management-section__head"><div><strong>模板必选目标</strong><span>这些指标下发后不可删除；权重需与个人月度目标共同校验。</span></div><span className="template-management-section__count">{draft.categories?.filter((item) => item.origin === "template").length ?? 0} 项</span></div>
            <div className="performance-category-table target-template-metrics"><div className="performance-category-table__head"><span>模板必选目标</span><span>默认权重</span><span>目标要求</span></div>{draft.categories?.filter((item) => item.origin === "template").map((target) => <div className="performance-category-table__row" key={target.id}><input aria-label={`模板目标名称-${target.id}`} value={target.name} onChange={(event) => updateCategory(target.id, "name", event.target.value)} /><input aria-label={`模板目标权重-${target.id}`} min="0" max="100" type="number" value={target.weight} onChange={(event) => updateCategory(target.id, "weight", Number(event.target.value))} /><textarea aria-label={`模板目标要求-${target.id}`} rows={3} value={target.requirement} onChange={(event) => updateCategory(target.id, "requirement", event.target.value)} /></div>)}<button className="ghost-chip target-template-metrics__add" onClick={addTemplateTarget} type="button">+ 新增必选目标</button></div>
          </section>
        </div>
        <div className="target-template-modal__footer"><span>保存后仅更新当前模板，不会覆盖已下发的历史绩效目标。</span><div className="action-row"><button className="primary-btn" onClick={() => onSave(draft)} type="button">保存当前模板</button></div></div>
      </div>
    </div>
  );
}

function getIssueOrgName(item) {
  return issueDepartmentAlias[item.department] ?? item.department;
}

function createIssueOrgNode(template, path = []) {
  const nextPath = [...path, template.name];
  return {
    name: template.name,
    path: nextPath,
    key: nextPath.join("/"),
    children: (template.children ?? []).map((child) => createIssueOrgNode(child, nextPath)),
    directItems: [],
    itemIds: [],
  };
}

function getIssueOrgPath(item) {
  const orgName = getIssueOrgName(item);
  const role = item.role;
  if (orgName === "内容中心") {
    if (role.includes("主编")) return ["内容中心", "主编"];
    if (role.includes("编导")) return ["内容中心", "编导"];
    if (role.includes("初级")) return ["内容中心", "初级编剧"];
    return ["内容中心", "中级编剧"];
  }
  if (orgName === "AI制作中心") {
    const group = role.includes("二组") ? "二组" : role.includes("三组") ? "三组" : "一组";
    return ["AI制作中心", group, role.includes("组长") ? "组长" : "组员"];
  }
  if (orgName === "制片中心") {
    return ["制片中心", role.includes("总") ? "总制片" : "执行制片"];
  }
  if (orgName === "剪辑中心") {
    if (role.includes("组长")) return ["剪辑中心", "组长"];
    if (role.includes("初级")) return ["剪辑中心", "初级"];
    return ["剪辑中心", "中级"];
  }
  if (orgName === "运营增长中心") {
    const line = role.includes("海外")
      ? (role.includes("素材") || role.includes("切片") ? "海外媒体运营（素材/切片）" : "海外短剧发行运营")
      : (role.includes("媒体") || role.includes("素材") || role.includes("切片") || role.includes("成品") ? "国内媒体运营（素材/切片）" : "国内短剧发行运营");
    return ["运营增长中心", line, role.includes("高级") || role.includes("总监") ? "高级" : "中级"];
  }
  if (orgName === "商务部") {
    if (role.includes("初级")) return ["商务部", "初级"];
    if (role.includes("高级") || role.includes("总监")) return ["商务部", "高级（总监）"];
    return ["商务部", "中级"];
  }
  return ["运营增长中心", "国内短剧发行运营", role.includes("总监") || role.includes("高级") ? "高级" : "中级"];
}

function findOrCreateIssueNode(root, path) {
  return path.reduce((node, segment) => {
    let child = node.children.find((item) => item.name === segment);
    if (!child) {
      child = createIssueOrgNode({ name: segment }, node.path);
      node.children.push(child);
    }
    return child;
  }, root);
}

function rollupIssueOrgNode(node) {
  const childIds = node.children.flatMap((child) => rollupIssueOrgNode(child));
  node.itemIds = [...new Set([...childIds, ...node.directItems.map((item) => item.id)])];
  return node.itemIds;
}

function buildIssueOrgTree(items) {
  const root = createIssueOrgNode(issueOrgTreeTemplate);
  items.forEach((item) => {
    const leaf = findOrCreateIssueNode(root, getIssueOrgPath(item));
    leaf.directItems.push(item);
  });
  rollupIssueOrgNode(root);
  return root;
}

function getIssueSelectedCount(node, selectedIssueIds) {
  return node.itemIds.filter((id) => selectedIssueIds.includes(id)).length;
}

function IssueCascadeColumn({
  title,
  nodes,
  activeKey,
  selectedIssueIds,
  onChoose,
  onSelectGroup,
  onClearGroup,
}) {
  return (
    <div className="issue-cascade__column">
      <div className="issue-cascade__column-title">{title}</div>
      <div className="issue-cascade__options">
        {nodes.map((node) => {
          const selectedCount = getIssueSelectedCount(node, selectedIssueIds);
          const totalCount = node.itemIds.length;
          const isActive = activeKey === node.key;
          const isChecked = totalCount > 0 && selectedCount === totalCount;
          const isPartial = selectedCount > 0 && selectedCount < totalCount;
          return (
            <div key={node.key} className={`issue-cascade__option ${isActive ? "is-active" : ""} ${isChecked ? "is-checked" : ""} ${isPartial ? "is-partial" : ""} ${!totalCount ? "is-empty" : ""}`}>
              <label className="issue-cascade__check" onClick={(event) => event.stopPropagation()}>
                <input
                  aria-label={`选择${node.name}`}
                  checked={isChecked}
                  disabled={!totalCount}
                  onChange={() => (isChecked ? onClearGroup(node.itemIds) : onSelectGroup(node.itemIds))}
                  type="checkbox"
                />
              </label>
              <button className="issue-cascade__option-main" onClick={() => onChoose(node)} type="button">
                <span>
                  <strong>{node.name}</strong>
                  <small>{totalCount ? `${selectedCount} / ${totalCount} 人` : "暂无人员"}</small>
                </span>
                <b>{node.children.length ? "›" : selectedCount ? "已选" : ""}</b>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IssueOrgTree({
  nodes,
  activeIssuePath,
  selectedIssueIds,
  onChoose,
  onSelectGroup,
  onClearGroup,
  depth = 0,
}) {
  return (
    <ul className={`issue-launch-tree issue-launch-tree--depth-${depth}`}>
      {nodes.map((node) => {
        const selectedCount = getIssueSelectedCount(node, selectedIssueIds);
        const totalCount = node.itemIds.length;
        const isExpanded = activeIssuePath[depth] === node.key;
        const isChecked = totalCount > 0 && selectedCount === totalCount;
        const isPartial = selectedCount > 0 && selectedCount < totalCount;
        const hasChildren = node.children.length > 0;
        return (
          <li key={node.key} className={`${isExpanded ? "is-expanded" : ""} ${isChecked ? "is-checked" : ""} ${isPartial ? "is-partial" : ""} ${!totalCount ? "is-empty" : ""}`}>
            <div className="issue-launch-tree__row">
              <button aria-label={`${isExpanded ? "收起" : "展开"}${node.name}`} className={`issue-launch-tree__expander ${hasChildren ? "has-children" : ""}`} onClick={() => hasChildren && onChoose(node, depth)} type="button" />
              <label className="issue-launch-tree__check" onClick={(event) => event.stopPropagation()}><input aria-label={`选择${node.name}`} checked={isChecked} disabled={!totalCount} onChange={() => (isChecked ? onClearGroup(node.itemIds) : onSelectGroup(node.itemIds))} type="checkbox" /></label>
              <button className="issue-launch-tree__name" onClick={() => onChoose(node, depth)} type="button"><i className={hasChildren ? "is-folder" : ""}>{hasChildren ? "-" : ""}</i><strong>{node.name}</strong></button>
              <span>{totalCount ? `${selectedCount}/${totalCount}` : "0/0"}</span>
            </div>
            {hasChildren && isExpanded ? <IssueOrgTree activeIssuePath={activeIssuePath} depth={depth + 1} nodes={node.children} onChoose={onChoose} onClearGroup={onClearGroup} onSelectGroup={onSelectGroup} selectedIssueIds={selectedIssueIds} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

function IssuePeoplePanel({
  node,
  selectedIssueIds,
  toggleIssueTarget,
  onSelectGroup,
  onClearGroup,
}) {
  if (!node) {
    return (
      <div className="issue-people-panel">
        <div className="issue-people-panel__empty">
          <strong>选择左侧分类</strong>
          <span>按中心、岗位或小组定位人员后，可在这里勾选下发对象。</span>
        </div>
      </div>
    );
  }

  const selectedCount = node.itemIds.filter((id) => selectedIssueIds.includes(id)).length;
  const totalCount = node.itemIds.length;
  const isChecked = totalCount > 0 && selectedCount === totalCount;
  const childPeople = node.children.flatMap((child) => child.directItems);
  const visiblePeople = node.directItems.length ? node.directItems : childPeople;

  const toggleNode = () => {
    if (!totalCount) return;
    isChecked ? onClearGroup(node.itemIds) : onSelectGroup(node.itemIds);
  };

  return (
    <div className="issue-people-panel">
      <div className="issue-people-panel__header">
        <div>
          <strong>{node.name}</strong>
          <span>{totalCount ? `当前分类 ${totalCount} 人，已选 ${selectedCount} 人` : "当前分类暂无可下发人员"}</span>
        </div>
        <button className="table-link" disabled={!totalCount} onClick={toggleNode} type="button">{isChecked ? "取消本组" : "选择本组"}</button>
      </div>
      {visiblePeople.length ? (
        <div className="issue-people-list">
          {visiblePeople.map((item) => (
            <label key={item.id} className={`issue-people-card ${selectedIssueIds.includes(item.id) ? "is-selected" : ""}`}>
              <input checked={selectedIssueIds.includes(item.id)} onChange={() => toggleIssueTarget(item.id)} type="checkbox" />
              <span className="issue-people-card__main">
                <strong>{item.employee}</strong>
                <small>{item.department} / {item.role} / {requiresSecondReview(item) ? `二级：${item.indirectLeader}` : "一级评分"}</small>
              </span>
              <b className={`field-pill ${getStatusTone(item.status)}`}>{item.status}</b>
            </label>
          ))}
        </div>
      ) : (
        <div className="issue-people-panel__empty">
          <strong>继续选择下一级</strong>
          <span>该分类下还有下级分组，选择具体岗位或小组后即可查看人员。</span>
        </div>
      )}
    </div>
  );
}

function LegacyIssuePerformancePage({
  access,
  issueMonth,
  setIssueMonth,
  isPastIssueMonth,
  currentMonth,
  selectedIssueIds,
  visibleIssueCandidates,
  toggleIssueTarget,
  categoryTemplates,
  categoryTotalWeight,
  updateCategory,
  addCategory,
  removeCategory,
  onSelectVisible,
  onClearSelection,
  onSelectGroup,
  onClearGroup,
  onSubmit,
  onClose,
}) {
  const issueOrgTree = useMemo(() => buildIssueOrgTree(visibleIssueCandidates), [visibleIssueCandidates]);
  const [activeIssuePath, setActiveIssuePath] = useState([]);
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const selectedIssueSignature = useMemo(() => [...selectedIssueIds].sort().join("|"), [selectedIssueIds]);
  const issueColumns = useMemo(() => {
    const columns = [{ title: "一级分类", nodes: issueOrgTree.children }];
    let currentNodes = issueOrgTree.children;
    activeIssuePath.forEach((key, index) => {
      const node = currentNodes.find((item) => item.key === key);
      if (node?.children.length) {
        columns.push({ title: index === 0 ? "二级分类" : "细分岗位", nodes: node.children });
        currentNodes = node.children;
      }
    });
    return columns;
  }, [activeIssuePath, issueOrgTree]);
  const activeIssueNode = useMemo(() => {
    let currentNodes = issueOrgTree.children;
    let currentNode = null;
    activeIssuePath.forEach((key) => {
      currentNode = currentNodes.find((item) => item.key === key) ?? currentNode;
      currentNodes = currentNode?.children ?? [];
    });
    return currentNode;
  }, [activeIssuePath, issueOrgTree]);
  const activeIssueNodes = useMemo(() => {
    const nodes = [];
    let currentNodes = issueOrgTree.children;
    activeIssuePath.forEach((key) => {
      const currentNode = currentNodes.find((item) => item.key === key);
      if (currentNode) {
        nodes.push(currentNode);
        currentNodes = currentNode.children;
      }
    });
    return nodes;
  }, [activeIssuePath, issueOrgTree]);
  const selectedIssueItems = useMemo(
    () => visibleIssueCandidates.filter((item) => selectedIssueIds.includes(item.id)),
    [selectedIssueIds, visibleIssueCandidates],
  );
  const selectedDepartmentCount = useMemo(
    () => new Set(selectedIssueItems.map((item) => getIssueOrgName(item))).size,
    [selectedIssueItems],
  );
  const canSubmitIssue = !isPastIssueMonth && selectionConfirmed && selectedIssueIds.length > 0 && access.issueMode !== "none" && categoryTotalWeight === 100;
  useEffect(() => {
    setActiveIssuePath([]);
  }, [issueOrgTree]);
  useEffect(() => {
    setSelectionConfirmed(false);
  }, [selectedIssueSignature]);

  const chooseIssueNode = (node, columnIndex) => {
    setActiveIssuePath((current) => [...current.slice(0, columnIndex), node.key]);
  };

  return (
    <div className="workflow-page issue-page">
      <div className="workflow-page__header">
        <button className="ghost-chip" onClick={onClose} type="button">返回列表</button>
        <div>
          <strong>绩效下发</strong>
          <div className="workflow-header-meta">
            <span>{access.roleName}</span>
            <span>{access.issueMode === "none" ? "当前身份无下发权限" : "选择下级人员并配置本月绩效模板"}</span>
          </div>
        </div>
        <button className="primary-btn" disabled={!canSubmitIssue} onClick={onSubmit} type="button">确认下发</button>
      </div>
      <div className="performance-assign-panel__header">
        <div>
          <strong>每月绩效分配</strong>
          <span>先按组织架构确认下发人员，再进入绩效模板编辑。</span>
        </div>
        <div className="performance-assign-panel__month">
          <label>
            <span>下发月份</span>
            <input type="month" min={currentMonth} value={issueMonth} onChange={(event) => setIssueMonth(event.target.value)} />
          </label>
        </div>
      </div>
      <div className="performance-assign-steps">
        <span className={`performance-assign-step ${!selectionConfirmed ? "is-active" : "is-done"}`}><b>1</b>选择人员范围</span>
        <span className={`performance-assign-step ${selectionConfirmed ? "is-active" : ""}`}><b>2</b>编辑绩效模板</span>
      </div>
      {isPastIssueMonth ? <p className="performance-warning">不能下发过去月份，请选择 {CURRENT_MONTH} 或未来月份。</p> : null}
      <div className={`performance-assign-panel__body ${selectionConfirmed ? "" : "performance-assign-panel__body--selecting"}`.trim()}>
        <div className="performance-recipient-box">
          <div className="performance-recipient-box__header">
            <div>
              <strong>绩效下发人员分配</strong>
              <span>{selectionConfirmed ? `已确认 ${selectedIssueIds.length} 人，模板将按此范围下发` : "按组织架构选择人员，确认后进入模板编辑"}</span>
            </div>
            {selectionConfirmed ? <button className="table-link" onClick={() => setSelectionConfirmed(false)} type="button">重新选择</button> : null}
          </div>
          <div className="issue-allocation-summary">
            <div className="issue-allocation-stat issue-allocation-stat--primary">
              <span>可选人员</span>
              <strong>{visibleIssueCandidates.length}</strong>
            </div>
            <div className="issue-allocation-stat">
              <span>{selectionConfirmed ? "已确认" : "已选择"}</span>
              <strong>{selectedIssueIds.length}</strong>
            </div>
            <div className="issue-allocation-stat">
              <span>涉及组织</span>
              <strong>{selectedDepartmentCount}</strong>
            </div>
          </div>
          <div className="issue-path-bar">
            <span>当前路径</span>
            <strong>{activeIssueNodes.length ? activeIssueNodes.map((node) => node.name).join(" / ") : "全部组织"}</strong>
          </div>
          {selectedIssueItems.length ? (
            <div className="issue-selected-strip">
              <span>已选人员</span>
              <div>
                {selectedIssueItems.slice(0, 6).map((item) => (
                  selectionConfirmed
                    ? <b key={item.id}>{item.employee}</b>
                    : <button key={item.id} className="issue-selected-chip" onClick={() => toggleIssueTarget(item.id)} type="button">{item.employee}<i>移除</i></button>
                ))}
                {selectedIssueItems.length > 6 ? <b>+{selectedIssueItems.length - 6}</b> : null}
              </div>
            </div>
          ) : null}
          <div className="performance-recipient-tools">
            {selectionConfirmed ? (
              <div className="issue-selection-locked">人员范围已锁定，需调整时请点击“重新选择”。</div>
            ) : (
              <>
                <button className="table-link" disabled={!visibleIssueCandidates.length} onClick={onSelectVisible} type="button">全选当前筛选</button>
                <button className="table-link" disabled={!selectedIssueIds.length} onClick={onClearSelection} type="button">清空选择</button>
                <button className="primary-btn primary-btn--compact" disabled={!selectedIssueIds.length} onClick={() => setSelectionConfirmed(true)} type="button">确定选择</button>
              </>
            )}
          </div>
          <div className="issue-org-tree">
            {visibleIssueCandidates.length ? (
              <div className="issue-cascade">
                <div className="issue-cascade__columns">
                  {issueColumns.map((column, index) => (
                    <IssueCascadeColumn
                      key={column.title}
                      title={column.title}
                      nodes={column.nodes}
                      activeKey={activeIssuePath[index]}
                      selectedIssueIds={selectedIssueIds}
                      onChoose={(node) => chooseIssueNode(node, index)}
                      onSelectGroup={onSelectGroup}
                      onClearGroup={onClearGroup}
                    />
                  ))}
                </div>
                <IssuePeoplePanel
                  node={activeIssueNode}
                  selectedIssueIds={selectedIssueIds}
                  toggleIssueTarget={toggleIssueTarget}
                  onSelectGroup={onSelectGroup}
                  onClearGroup={onClearGroup}
                />
              </div>
            ) : (
              <div className="empty-state empty-state--compact">
                <strong>暂无可下发人员</strong>
                <span>当前身份没有直属下级或下发权限。</span>
              </div>
            )}
          </div>
        </div>
        {selectionConfirmed ? <div className="performance-category-box">
          <div className="performance-category-box__header">
            <strong>六大类绩效模板</strong>
            <span className={categoryTotalWeight === 100 ? "score-positive" : "score-negative"}>当前占比 {categoryTotalWeight}%</span>
            <button className="table-link" onClick={addCategory} type="button">新增绩效项</button>
          </div>
          {categoryTotalWeight !== 100 ? <div className="performance-template-warning">占比需调整为 100% 后才能确认下发。</div> : null}
          <div className="performance-category-table">
            <div className="performance-category-table__head">
              <span>绩效类别</span>
              <span>占比</span>
              <span>默认要求</span>
              <span>操作</span>
            </div>
            {categoryTemplates.map((category) => (
              <div key={category.id} className="performance-category-table__row">
                <input value={category.name} onChange={(event) => updateCategory(category.id, "name", event.target.value)} />
                <input min="0" max="100" type="number" value={category.weight} onChange={(event) => updateCategory(category.id, "weight", Number(event.target.value))} />
                <textarea rows={2} value={category.requirement} onChange={(event) => updateCategory(category.id, "requirement", event.target.value)} />
                <button className="table-link table-link--danger" disabled={categoryTemplates.length <= 1} onClick={() => removeCategory(category.id)} type="button">删除</button>
              </div>
            ))}
          </div>
        </div> : null}
      </div>
    </div>
  );
}

function IssuePerformancePage({
  access,
  issueMonth,
  isPastIssueMonth,
  selectedIssueIds,
  visibleIssueCandidates,
  availableRoleTemplates,
  activeRoleTemplateId,
  onActiveRoleTemplateChange,
  toggleIssueTarget,
  categoryTemplates,
  categoryTotalWeight,
  updateCategory,
  addCategory,
  removeCategory,
  onSelectVisible,
  onClearSelection,
  onSelectGroup,
  onClearGroup,
  onSubmit,
  onClose,
}) {
  const issueOrgTree = useMemo(() => buildIssueOrgTree(visibleIssueCandidates), [visibleIssueCandidates]);
  const [activeIssuePath, setActiveIssuePath] = useState([]);
  const [deadline, setDeadline] = useState("2026-07-31");
  const issueColumns = useMemo(() => {
    const columns = [{ title: "组织范围", nodes: issueOrgTree.children }];
    let nodes = issueOrgTree.children;
    activeIssuePath.forEach((key, index) => {
      const node = nodes.find((item) => item.key === key);
      if (node?.children.length) {
        columns.push({ title: index === 0 ? "下级组织" : "岗位 / 小组", nodes: node.children });
        nodes = node.children;
      }
    });
    return columns;
  }, [activeIssuePath, issueOrgTree]);
  const activeIssueNode = useMemo(() => {
    let nodes = issueOrgTree.children;
    let node = null;
    activeIssuePath.forEach((key) => {
      node = nodes.find((item) => item.key === key) ?? node;
      nodes = node?.children ?? [];
    });
    return node;
  }, [activeIssuePath, issueOrgTree]);
  const activePathLabel = activeIssuePath.length ? activeIssuePath.map((key) => key.split("/").at(-1)).join(" / ") : "请选择组织范围";
  const selectedIssueItems = useMemo(() => visibleIssueCandidates.filter((item) => selectedIssueIds.includes(item.id)), [selectedIssueIds, visibleIssueCandidates]);
  const selectedGroupCount = useMemo(() => new Set(selectedIssueItems.map((item) => getIssueOrgName(item))).size, [selectedIssueItems]);
  const canSubmit = !isPastIssueMonth && selectedIssueIds.length > 0 && categoryTotalWeight === 100 && Boolean(deadline) && access.issueMode !== "none";
  const chooseIssueNode = (node, columnIndex) => setActiveIssuePath((current) => [...current.slice(0, columnIndex), node.key]);
  const balanceWeights = () => {
    const weightedTargets = categoryTemplates.filter((category) => category.type !== "adjustment");
    const base = Math.floor(100 / weightedTargets.length);
    const remainder = 100 - base * weightedTargets.length;
    weightedTargets.forEach((category, index) => updateCategory(category.id, "weight", base + (index < remainder ? 1 : 0)));
  };
  const adjustWeight = (categoryId, amount) => {
    const category = categoryTemplates.find((item) => item.id === categoryId);
    if (!category) return;
    updateCategory(categoryId, "weight", Math.max(0, Math.min(100, Number(category.weight || 0) + amount)));
  };
  const activeGroupName = activeIssueNode?.name ?? "制片组";
  const selectedCount = selectedIssueIds.length;

  return (
    <div className="issue-launch-page">
      <h2 className="issue-launch-page__title">下发月度绩效目标</h2>
      <div className="issue-launch-page__toolbar">
        <button className="ghost-chip" onClick={onClose} type="button">返回列表</button>
        <span>下发月度绩效目标</span>
      </div>
      {isPastIssueMonth ? <p className="performance-warning">不能下发过去月份，请选择 {currentMonth} 或未来月份。</p> : null}
      <main className="issue-launch-grid">
        <section className="issue-launch-panel issue-launch-panel--org">
          <div className="issue-launch-panel__head"><div><strong>下发对象</strong><span>选择组织与成员范围</span></div><b>{selectedGroupCount || 0} 个组</b></div>
          <div className="issue-launch-selection"><strong>{selectedCount}</strong><span>名员工</span><button className="table-link" disabled={!selectedCount} onClick={onClearSelection} type="button">清空</button></div>
          <label className="issue-launch-search"><span>搜索组织名称</span><input placeholder="搜索组织名称" /></label>
          <div className="issue-launch-selection-hint"><span>勾选组织时</span><b>包含下级</b><small>仅直属</small></div>
          <label className="issue-launch-select-all"><input checked={selectedCount === visibleIssueCandidates.length && visibleIssueCandidates.length > 0} onChange={() => selectedCount === visibleIssueCandidates.length ? onClearSelection() : onSelectVisible()} type="checkbox" /><span>自动跳过已下发、停用人员</span></label>
          <div className="issue-launch-panel__tools"><span>组织架构</span><small>{activePathLabel}</small></div>
          <div className="issue-launch-org-columns"><IssueOrgTree activeIssuePath={activeIssuePath} nodes={issueOrgTree.children} onChoose={chooseIssueNode} onClearGroup={onClearGroup} onSelectGroup={onSelectGroup} selectedIssueIds={selectedIssueIds} /></div>
          <div className="issue-launch-panel__foot"><span>人员选择已拆分至中栏</span><button className="table-link" type="button">全部展开</button></div>
        </section>
        <section className="issue-launch-panel issue-launch-panel--people">
          <div className="issue-launch-panel__head"><div><strong>成员选择</strong><span>{activeIssueNode ? `${activeIssueNode.name} 范围内成员` : `${activeGroupName} · 选择组织后查看可下发成员`}</span></div><b>小组</b></div>
          <div className="issue-launch-people-summary"><span>组负责人</span><strong>{access.viewerName}</strong><span>当前选择</span><b>{selectedCount} 人</b></div>
          <label className="issue-launch-search"><span>搜索姓名、岗位或工号</span><input placeholder="搜索姓名、岗位或工号" /></label>
          <div className="issue-launch-people-actions"><button className="table-link" disabled={!visibleIssueCandidates.length} onClick={onSelectVisible} type="button">全选可选成员</button><span>可选择</span><b>已选择</b></div>
          <IssuePeoplePanel node={activeIssueNode} onClearGroup={onClearGroup} onSelectGroup={onSelectGroup} selectedIssueIds={selectedIssueIds} toggleIssueTarget={toggleIssueTarget} />
          <div className="issue-launch-panel__foot"><strong>已选 {selectedCount} 人</strong><button className="ghost-chip" disabled={!selectedCount} onClick={onClearSelection} type="button">查看全部已选</button></div>
        </section>
        <section className="issue-launch-panel issue-launch-panel--config">
          <section className="issue-launch-config-banner"><div><span>绩</span><div><strong>{activeGroupName} · 绩效目标配置</strong><small>系统按部门和岗位带出HR维护的模板；Leader仅编辑本次下发草案，不会覆盖HR模板。</small></div></div><div className="issue-launch-config-stats"><div><span>已选人员</span><strong>{selectedCount} 人</strong></div><div><span>直属Leader</span><strong>{access.viewerName}</strong></div><div><span>目标版本</span><strong>待下发V1</strong></div></div></section>
          <section className="issue-launch-content-card">
            <div className="issue-launch-content-card__head"><div><strong>绩效目标</strong><span>岗位通用目标与个人月度目标共同参与100%权重校验；加减分独立计算。</span></div><div className="issue-launch-weight"><button className="ghost-chip" onClick={balanceWeights} type="button">平均分配</button><b className={categoryTotalWeight === 100 ? "is-valid" : "is-invalid"}>合计 {categoryTotalWeight}%</b><i><em style={{ width: `${Math.min(100, categoryTotalWeight)}%` }} /></i></div></div>
            <label className="issue-launch-template-selector"><span>当前部门岗位模板</span><select aria-label="当前部门岗位模板" value={activeRoleTemplateId} onChange={(event) => onActiveRoleTemplateChange(event.target.value)}>{availableRoleTemplates.map((template) => <option key={template.id} value={template.id}>{template.department} · {template.role}</option>)}</select><small>下发时会分别应用所选员工对应部门和岗位的模板；当前编辑仅作用于当前岗位的本月草案。</small></label>
            <div className="issue-launch-metrics"><div className="issue-launch-metrics__head"><span>目标名称</span><span>权重</span><span>目标要求</span><span>操作</span></div>{[
              { key: "template", label: "岗位通用绩效目标", hint: "HR模板必选项" },
              { key: "personal", label: "个人月度重点目标", hint: "Leader可新增、编辑和删除" },
              { key: "adjustment", label: "独立加减分项", hint: "不参与100%权重校验" },
            ].map((group) => <div className="issue-launch-target-group" key={group.key}><div className="issue-launch-target-group__title"><strong>{group.label}</strong><span>{group.hint}</span></div>{categoryTemplates.filter((category) => category.origin === group.key).map((category) => <div className="issue-launch-metrics__row" key={category.id}><input disabled={category.mandatory} onChange={(event) => updateCategory(category.id, "name", event.target.value)} value={category.name} />{category.type === "adjustment" ? <span className="issue-launch-independent">独立计分</span> : <div className="issue-launch-stepper"><button onClick={() => adjustWeight(category.id, -5)} type="button">-</button><input max="100" min="0" onChange={(event) => updateCategory(category.id, "weight", Number(event.target.value))} type="number" value={category.weight} /><button onClick={() => adjustWeight(category.id, 5)} type="button">+</button></div>}<textarea disabled={category.type === "adjustment"} onChange={(event) => updateCategory(category.id, "requirement", event.target.value)} rows={2} value={category.requirement} /><button className="table-link table-link--danger" disabled={category.mandatory} onClick={() => removeCategory(category.id)} type="button">{category.mandatory ? "模板必选" : "删除"}</button></div>)}</div>)}</div>
            <div className="issue-launch-content-card__foot"><button className="ghost-chip" onClick={addCategory} type="button">+ 新增个人月度目标</button><span className={categoryTotalWeight === 100 ? "score-positive" : "score-negative"}>{categoryTotalWeight === 100 ? "权重校验通过" : `权重合计${categoryTotalWeight}%，需调整为100%`}</span></div>
          </section>
          {categoryTotalWeight !== 100 ? <p className="performance-template-warning">请将权重调整为 100% 后再下发。</p> : null}
        </section>
      </main>
      <footer className="issue-launch-footer"><div><span className="issue-launch-footer__check">✓</span><div><strong>{canSubmit ? `${selectedGroupCount} 个组 · ${selectedCount} 人可下发` : "请完成成员选择、权重校验与截止时间设置"}</strong><span>将应用当前方案与绩效周期 {issueMonth}，截止 {deadline || "未设置"}。</span></div></div><div><button className="ghost-chip" onClick={onClose} type="button">保存草稿</button><button className="primary-btn" disabled={!canSubmit} onClick={() => onSubmit({ deadline })} type="button">校验并下发</button></div></footer>
    </div>
  );
}

function PerformanceDetailPage({ review, onBack, hongguoUploads }) {
  if (!review) return null;

  return (
    <div className="workflow-page performance-detail-page">
      <div className="workflow-page__header">
        <button className="ghost-chip" onClick={onBack} type="button">返回列表</button>
        <div>
          <strong>{review.employee} 绩效详情</strong>
          <div className="workflow-header-meta">
            <span>{review.department}</span>
            <span>{review.role}</span>
            <span>{review.cycle}</span>
          </div>
        </div>
        <button className="ghost-chip" onClick={() => exportPerformanceDetailExcel(review, hongguoUploads)} type="button"><FileCsv size={16} weight="bold" />导出Excel</button>
      </div>
      <div className="performance-detail-summary">
        <div><small>岗位模板</small><strong>{getReviewTemplate(review).name}</strong></div>
        <div><small>岗位层级</small><strong>{review.roleTemplateName}</strong></div>
        <div><small>基础绩效分</small><strong>{calcBaseScore(review)}</strong></div>
        <div><small>加减分</small><strong>{calcAdjustmentScore(review)}</strong></div>
        <div><small>最终绩效分</small><strong>{calcScore(review)} / {getGrade(calcScore(review))}</strong></div>
        <div><small>流程状态</small><strong>{review.status}</strong></div>
        <div><small>申诉状态</small><strong>{review.appealStatus}</strong></div>
      </div>
      <section className="performance-version-panel">
        <div className="performance-version-panel__header"><strong>绩效目标版本</strong><span>当前生效V{review.activeTargetVersion ?? 1} · 历史版本永久保留</span></div>
        <div className="performance-version-list">{(review.targetVersions?.length ? review.targetVersions : [{ version: 1, status: "已生效", operator: review.directLeader, actedAt: review.lastActionAt, changeReason: "首次下发" }]).map((version) => <article key={version.version}><b>V{version.version}</b><span className="field-pill field-pill--neutral">{version.status}</span><p>{version.changeReason || "首次下发"}</p><small>{version.operator || review.directLeader} · {version.actedAt || review.lastActionAt}</small></article>)}</div>
        <div className="performance-version-panel__header performance-version-panel__header--result"><strong>绩效结果版本</strong><span>申诉修正只新增版本，不覆盖原结果</span></div>
        {review.resultVersions?.length ? <div className="performance-version-list performance-version-list--result">{review.resultVersions.map((version) => <article key={version.version}><b>结果V{version.version}</b><span>{version.score}分 · {version.grade}级</span><p>{version.reason || version.appealDecision || "正式绩效结果"}</p><small>{version.operator || "系统"} · {version.actedAt || review.lastActionAt}</small></article>)}</div> : <p className="performance-version-empty">当前流程尚未生成正式绩效结果版本</p>}
      </section>
      <PerformanceReferencePanel review={review} hongguoUploads={hongguoUploads} />
      <div className="performance-detail-title">
        <div>
          <strong>岗位模板明细</strong>
          <span>{review.sheetMeta}</span>
        </div>
        {review.businessLines?.length ? (
          <div className="performance-business-lines">
            {review.businessLines.map((line) => <span key={line}>{line}</span>)}
          </div>
        ) : null}
      </div>
      <div className="template-metric-list">
        {review.rows.map((row) => (
          row.type === "section" ? <div key={row.key} className="template-metric-section">{row.title}</div> : (
            <div key={row.key} className="template-metric-row">
              <div className="template-metric-row__main">
                <strong>{row.label}</strong>
                <span>{row.standard}</span>
                <small>数据来源：{row.source}</small>
              </div>
              <div className="template-metric-row__scores">
                <b>{row.type === "adjustment" ? "加减分" : `${Math.round((row.weight ?? 0) * 100)}%`}</b>
                <span>{requiresSecondReview(review) ? "两级评分制" : "一级评分制"}</span>
                <span>综合 {Number(calcRowComposite(row, review).toFixed(1))}</span>
                <span>计入 {calcRowScore(row, review)}</span>
              </div>
              <p>{row.selfText || "暂无员工结果录入"}</p>
            </div>
          )
        ))}
      </div>
      <div className="operation-log-panel">
        <div className="operation-log-panel__header">
          <strong>操作记录</strong>
          <span>{review.operationLogs?.length ?? 0} 条</span>
        </div>
        <div className="operation-log-list">
          {(review.operationLogs ?? []).map((log) => (
            <div key={log.id} className="operation-log-item">
              <b>{log.action}</b>
              <span>{log.operator}</span>
              <small>{log.actedAt}</small>
              <p>{log.fromStatus} → {log.toStatus}；{log.note || "无补充说明"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformanceCenter({ reviews, onSave, onBatchIssue, onSaveAppeal, activeRole, departmentTemplates, onSaveDepartmentTemplate, onCreateDepartmentTemplate }) {
  const [activeTab, setActiveTab] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState({
    cycle: "all",
    status: "all",
    department: "all",
    grade: "all",
    employee: "",
  });
  const [selectedReviewId, setSelectedReviewId] = useState(reviews[0]?.id ?? null);
  const [workflowDialog, setWorkflowDialog] = useState(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [detailReviewId, setDetailReviewId] = useState(null);
  const [appealReviewId, setAppealReviewId] = useState(null);
  const [hongguoUploadOpen, setHongguoUploadOpen] = useState(false);
  const [hongguoUploads, setHongguoUploads] = useState([]);
  const [actionFeedback, setActionFeedback] = useState("");
  const [issueMonth] = useState(CURRENT_MONTH);
  const [selectedIssueIds, setSelectedIssueIds] = useState([]);
  const [activeRoleTemplateId, setActiveRoleTemplateId] = useState(departmentTemplates[0]?.id ?? "");
  const [leaderTemplateDrafts, setLeaderTemplateDrafts] = useState({});
  const pageSize = 10;
  const access = roleAccess[activeRole?.id ?? "ceo"] ?? roleAccess.ceo;
  const canViewReview = (review) => {
    if (access.viewMode === "all") return true;
    if (access.viewMode === "self") return review.employee === access.viewerName;
    return review.directLeader === access.viewerName || (requiresSecondReview(review) && review.indirectLeader === access.viewerName) || review.owner === access.viewerName;
  };
  const canIssueReview = (review) => {
    if (access.issueMode === "direct") return review.directLeader === access.viewerName && review.status === REVIEW_STATUS.targetIssue;
    return false;
  };
  const canOperateWorkflow = (review, action) => {
    if (!review || !action) return false;
    if (action.type === "issue_target") return canIssueReview(review);
    return canPerformReviewAction(activeRole?.id ?? "ceo", action.type, review, access.viewerName);
  };
  const canStartAppeal = (review) => (
    activeRole?.id === "employee"
    && review.employee === access.viewerName
    && [REVIEW_STATUS.feedback, REVIEW_STATUS.archived].includes(review.status)
    && ["无申诉", "申诉驳回", "申诉部分成立", "申诉成立"].includes(review.appealStatus)
  );
  const scopedReviews = useMemo(() => reviews.filter(canViewReview), [reviews, access.viewerName, access.viewMode]);
  const issueCandidates = useMemo(() => scopedReviews.filter(canIssueReview), [scopedReviews, access.viewerName, access.issueMode]);
  const cycles = useMemo(() => [...new Set(scopedReviews.map((item) => item.cycle))], [scopedReviews]);
  const departments = useMemo(() => [...new Set(scopedReviews.map((item) => item.department))], [scopedReviews]);
  const availableRoleTemplates = useMemo(() => {
    const candidates = selectedIssueIds.length
      ? issueCandidates.filter((item) => selectedIssueIds.includes(item.id))
      : issueCandidates;
    const pairs = new Set(candidates.map((item) => `${item.department}::${item.role}`));
    const matching = departmentTemplates.filter((template) => pairs.has(`${template.department}::${template.role}`));
    return matching.length ? matching : departmentTemplates;
  }, [departmentTemplates, issueCandidates, selectedIssueIds]);
  const activeRoleTemplate = availableRoleTemplates.find((item) => item.id === activeRoleTemplateId) ?? availableRoleTemplates[0] ?? departmentTemplates[0];
  const categoryTemplates = leaderTemplateDrafts[activeRoleTemplate?.id] ?? clonePerformanceCategories(activeRoleTemplate?.categories);

  const matchesStatusView = (review, view) => {
    if (view === "all") return true;
    if (view === "targetIssue") return review.status === REVIEW_STATUS.targetIssue;
    if (Object.values(REVIEW_STATUS).includes(view)) return review.status === view;
    return matchesPerformanceTab(review, view);
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPageIndex(0);
  };

  const updateTab = (tab) => {
    setActiveTab(tab);
    setPageIndex(0);
  };

  const filteredReviews = useMemo(() => {
    const isGradeSort = ["grade_asc", "grade_desc"].includes(filters.grade);
    const rankByGrade = { D: 1, C: 2, B: 3, A: 4, S: 5 };
    const isResultEntered = (item) => ![REVIEW_STATUS.targetIssue, REVIEW_STATUS.employeeConfirm, REVIEW_STATUS.targetDispute, REVIEW_STATUS.executing, REVIEW_STATUS.resultEntry].includes(item.status);
    const result = scopedReviews.filter((item) => {
      if (!matchesStatusView(item, filters.status)) return false;
      if (filters.cycle !== "all" && item.cycle !== filters.cycle) return false;
      if (filters.department !== "all" && item.department !== filters.department) return false;
      if (!isGradeSort && filters.grade !== "all" && getGrade(calcScore(item)) !== filters.grade) return false;
      if (filters.employee.trim() && !item.employee.includes(filters.employee.trim())) return false;
      return true;
    });
    if (!isGradeSort) return result;
    return [...result].sort((left, right) => {
      const leftRank = isResultEntered(left) ? rankByGrade[getGrade(calcScore(left))] : 0;
      const rightRank = isResultEntered(right) ? rankByGrade[getGrade(calcScore(right))] : 0;
      if (leftRank === 0 && rightRank !== 0) return 1;
      if (rightRank === 0 && leftRank !== 0) return -1;
      const direction = filters.grade === "grade_asc" ? 1 : -1;
      if (leftRank !== rightRank) return (leftRank - rightRank) * direction;
      return left.employee.localeCompare(right.employee, "zh-CN");
    });
  }, [filters, scopedReviews]);

  const metricScopeReviews = useMemo(() => scopedReviews.filter((item) => {
    const metricCycle = filters.cycle === "all" ? CURRENT_MONTH : filters.cycle;
    if (item.cycle !== metricCycle) return false;
    if (filters.department !== "all" && item.department !== filters.department) return false;
    if (filters.employee.trim() && !item.employee.includes(filters.employee.trim())) return false;
    return true;
  }), [filters.cycle, filters.department, filters.employee, scopedReviews]);

  const tabReviews = useMemo(
    () => filteredReviews.filter((item) => matchesStatusView(item, activeTab)),
    [activeTab, filteredReviews],
  );

  const totalPages = Math.max(1, Math.ceil(tabReviews.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const visibleReviews = useMemo(
    () => tabReviews.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize),
    [safePageIndex, tabReviews],
  );

  const pendingCount = getStatusCount(filteredReviews, "pending");
  const archivedCount = getStatusCount(filteredReviews, "archived");
  const appealCount = getOpenAppealCount(filteredReviews);
  const targetIssueCount = filteredReviews.filter((item) => item.status === REVIEW_STATUS.targetIssue).length;
  const hrReviewCount = filteredReviews.filter((item) => item.status === REVIEW_STATUS.hrReview).length;
  const committeeApprovalCount = filteredReviews.filter((item) => item.status === REVIEW_STATUS.committeeApproval).length;
  const secondReviewCount = filteredReviews.filter((item) => item.status === REVIEW_STATUS.secondReview).length;
  const feedbackCount = filteredReviews.filter((item) => item.status === REVIEW_STATUS.feedback).length;
  const confirmationRate = metricScopeReviews.length ? Math.round((metricScopeReviews.filter((item) => ![REVIEW_STATUS.targetIssue, REVIEW_STATUS.employeeConfirm, REVIEW_STATUS.targetDispute].includes(item.status)).length / metricScopeReviews.length) * 100) : 0;
  const scoredRate = metricScopeReviews.length ? Math.round((metricScopeReviews.filter((item) => [
    REVIEW_STATUS.hrReview,
    REVIEW_STATUS.committeeApproval,
    REVIEW_STATUS.feedback,
    REVIEW_STATUS.archived,
  ].includes(item.status)).length / metricScopeReviews.length) * 100) : 0;
  const topGradeCount = metricScopeReviews.filter((item) => getGrade(calcScore(item)) === "S").length;
  const focusTabs = [
    { value: "all", label: "全部流程", count: filteredReviews.length },
    { value: "targetIssue", label: "绩效目标待下发", count: targetIssueCount },
    { value: "pending", label: "待处理", count: pendingCount },
    { value: REVIEW_STATUS.hrReview, label: "HR复审", count: hrReviewCount },
    { value: REVIEW_STATUS.committeeApproval, label: "CEO审批", count: committeeApprovalCount },
    { value: "appeal", label: "申诉中", count: appealCount },
    { value: "archived", label: "已结束", count: archivedCount },
  ];

  useEffect(() => {
    if (pageIndex !== safePageIndex) {
      setPageIndex(safePageIndex);
    }
  }, [pageIndex, safePageIndex]);

  useEffect(() => {
    if (activeRoleTemplate && activeRoleTemplate.id !== activeRoleTemplateId) {
      setActiveRoleTemplateId(activeRoleTemplate.id);
    }
  }, [activeRoleTemplate, activeRoleTemplateId]);

  const openWorkflowDialog = (review) => {
    const action = getWorkflowAction(review);
    if (!action) return;
    if (!canOperateWorkflow(review, action)) {
      setActionFeedback(`当前${access.roleName}身份无权处理“${action.label}”节点。`);
      return;
    }
    setActionFeedback("");
    setSelectedReviewId(review.id);
    setWorkflowDialog({ reviewId: review.id, action, note: "" });
  };

  const openTargetChange = (review) => {
    const action = { type: "change_target", label: "发起绩效目标变更", nextStatus: REVIEW_STATUS.employeeConfirm };
    if (!canOperateWorkflow(review, action)) {
      setActionFeedback("无权限：仅该员工直属Leader可以发起目标变更。");
      return;
    }
    setActionFeedback("");
    setSelectedReviewId(review.id);
    setWorkflowDialog({ reviewId: review.id, action, note: "" });
  };

  const openAppealEvidence = (review) => {
    const action = { type: "provide_appeal_evidence", label: "提供原评分依据", nextStatus: review.status };
    if (!canOperateWorkflow(review, action)) {
      setActionFeedback("无权限：仅原评分直属Leader可以提供评分依据。");
      return;
    }
    setWorkflowDialog({ reviewId: review.id, action, note: "" });
  };

  const submitWorkflowDialog = (payload = {}) => {
    const targetReview = reviews.find((item) => item.id === workflowDialog.reviewId);
    if (!targetReview) return;
    if (!canOperateWorkflow(targetReview, workflowDialog.action)) {
      setActionFeedback(`提交失败：当前${access.roleName}身份无权处理该节点。`);
      return;
    }
    if (payload.replaceReview) {
      onSave(payload.replaceReview);
      setSelectedReviewId(payload.replaceReview.id);
      setWorkflowDialog(null);
      setActionFeedback("操作成功，版本和日志已更新。");
      return;
    }
    const nextReview = applyWorkflowAction(targetReview, {
      type: workflowDialog.action.type,
      operator: access.viewerName,
      note: payload.note || `${workflowDialog.action.label}已处理，表格内信息已同步确认。`,
      actedAt: getActionTimestamp(),
      nextStatus: payload.nextStatus,
      updates: payload.updates,
    });
    onSave(nextReview);
    setSelectedReviewId(nextReview.id);
    setWorkflowDialog(null);
    setActionFeedback("操作成功，流程状态与操作日志已更新。");
  };

  const workflowDialogReview = workflowDialog ? reviews.find((item) => item.id === workflowDialog.reviewId) : null;
  const detailReview = detailReviewId ? reviews.find((item) => item.id === detailReviewId) : null;
  const appealReview = appealReviewId ? reviews.find((item) => item.id === appealReviewId) : null;
  const calcLeaderScore = (review, level) => {
    if (!review?.rows?.length) return "--";
    const score = review.rows.reduce((sum, row) => {
      if (row.type === "section") return sum;
      const raw = level === "first" ? row.firstScore : row.secondScore;
      if (row.type === "adjustment") return level === "first" ? sum + Number(raw || 0) : sum;
      return sum + raw * (row.weight ?? 0);
    }, 0);
    return Number(score.toFixed(1));
  };
  const isPastIssueMonth = issueMonth < CURRENT_MONTH;
  const categoryWeightValidation = validateTargetWeights(categoryTemplates);
  const categoryTotalWeight = categoryWeightValidation.total;
  const visibleIssueCandidates = useMemo(() => issueCandidates.filter((item) => {
    if (filters.department !== "all" && item.department !== filters.department) return false;
    if (filters.employee.trim() && !item.employee.includes(filters.employee.trim())) return false;
    return true;
  }), [filters.department, filters.employee, issueCandidates]);
  const toggleIssueTarget = (reviewId) => {
    setSelectedIssueIds((current) => (
      current.includes(reviewId)
        ? current.filter((item) => item !== reviewId)
        : [...current, reviewId]
    ));
  };
  const updateCategory = (categoryId, key, value) => {
    if (!activeRoleTemplate) return;
    setLeaderTemplateDrafts((current) => {
      const categories = current[activeRoleTemplate.id] ?? clonePerformanceCategories(activeRoleTemplate.categories);
      return { ...current, [activeRoleTemplate.id]: categories.map((item) => item.id === categoryId ? { ...item, [key]: value } : item) };
    });
  };
  const addCategory = () => {
    if (!activeRoleTemplate) return;
    const nextIndex = categoryTemplates.length + 1;
    setLeaderTemplateDrafts((current) => ({
      ...current,
      [activeRoleTemplate.id]: [...categoryTemplates, { id: `custom-${Date.now()}`, name: `个人月度目标${nextIndex}`, weight: 0, requirement: "请输入目标、验收标准和截止时间。", origin: "personal", mandatory: false, type: "weighted" }],
    }));
  };
  const removeCategory = (categoryId) => {
    if (!activeRoleTemplate) return;
    setLeaderTemplateDrafts((current) => ({ ...current, [activeRoleTemplate.id]: categoryTemplates.filter((item) => item.id !== categoryId || item.mandatory) }));
  };
  const selectVisibleIssueCandidates = () => {
    setSelectedIssueIds((current) => [...new Set([...current, ...visibleIssueCandidates.map((item) => item.id)])]);
  };
  const selectIssueGroup = (reviewIds) => {
    setSelectedIssueIds((current) => [...new Set([...current, ...reviewIds])]);
  };
  const clearIssueGroup = (reviewIds) => {
    setSelectedIssueIds((current) => current.filter((id) => !reviewIds.includes(id)));
  };
  const openIssueDialog = (review) => {
    if (access.issueMode === "none") {
      setActionFeedback(`当前${access.roleName}身份无权下发绩效目标。`);
      return;
    }
    if (review && canIssueReview(review)) {
      setSelectedIssueIds([review.id]);
      const template = departmentTemplates.find((item) => item.department === review.department && item.role === review.role);
      if (template) setActiveRoleTemplateId(template.id);
    }
    setIssueDialogOpen(true);
  };
  const submitBatchIssue = (issueOptions = {}) => {
    if (access.issueMode === "none" || isPastIssueMonth || !selectedIssueIds.length || !categoryWeightValidation.valid) {
      setActionFeedback(access.issueMode === "none" ? "无权限：仅直属Leader可以下发绩效目标。" : categoryWeightValidation.reason);
      return;
    }
    const categoriesByReview = Object.fromEntries(selectedIssueIds.map((reviewId) => {
      const review = reviews.find((item) => item.id === reviewId);
      const template = departmentTemplates.find((item) => item.department === review?.department && item.role === review?.role);
      const categories = template?.id === activeRoleTemplate?.id ? categoryTemplates : (leaderTemplateDrafts[template?.id] ?? clonePerformanceCategories(template?.categories));
      return [reviewId, { categories, templateId: template?.id, templateName: template?.name }];
    }));
    onBatchIssue(selectedIssueIds, {
      cycle: issueMonth,
      categories: categoryTemplates,
      categoriesByReview,
      operator: access.viewerName,
      deadline: issueOptions.deadline,
      notifyMode: issueOptions.notifyMode ?? "站内信 + 待办",
    });
    setSelectedIssueIds([]);
    setActiveTab("pending");
    setIssueDialogOpen(false);
    setActionFeedback("绩效目标下发成功，已生成待员工确认版本V1。");
  };

  if (issueDialogOpen) {
    return (
      <div className="admin-page performance-console">
        <IssuePerformancePage
          access={access}
          issueMonth={issueMonth}
          isPastIssueMonth={isPastIssueMonth}
          selectedIssueIds={selectedIssueIds}
          visibleIssueCandidates={visibleIssueCandidates}
          availableRoleTemplates={availableRoleTemplates}
          activeRoleTemplateId={activeRoleTemplate?.id ?? ""}
          onActiveRoleTemplateChange={setActiveRoleTemplateId}
          toggleIssueTarget={toggleIssueTarget}
          categoryTemplates={categoryTemplates}
          categoryTotalWeight={categoryTotalWeight}
          updateCategory={updateCategory}
          addCategory={addCategory}
          removeCategory={removeCategory}
          onSelectVisible={selectVisibleIssueCandidates}
          onClearSelection={() => setSelectedIssueIds([])}
          onSelectGroup={selectIssueGroup}
          onClearGroup={clearIssueGroup}
          onSubmit={submitBatchIssue}
          onClose={() => setIssueDialogOpen(false)}
        />
      </div>
    );
  }

  if (workflowDialog && workflowDialogReview && workflowDialog.action) {
    return (
      <div className="admin-page performance-console">
        <WorkflowActionPage
          review={workflowDialogReview}
          action={workflowDialog.action}
          onBack={() => setWorkflowDialog(null)}
          onSubmit={submitWorkflowDialog}
          hongguoUploads={hongguoUploads}
        />
      </div>
    );
  }

  if (detailReview) {
    return (
      <div className="admin-page performance-console">
        <PerformanceDetailPage review={detailReview} onBack={() => setDetailReviewId(null)} hongguoUploads={hongguoUploads} />
      </div>
    );
  }

  if (appealReview) {
    return (
      <div className="admin-page performance-console">
        <AppealPage
          review={appealReview}
          onBack={() => setAppealReviewId(null)}
          onSave={(reviewId, appealDraft) => {
            onSaveAppeal(reviewId, appealDraft);
            setAppealReviewId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="admin-page performance-console">
      <section className="platform-header performance-page-intro">
        <div className="platform-header__copy">
          <span className="platform-header__icon"><Trophy size={24} weight="duotone" /></span>
          <div>
            <span className="platform-eyebrow">绩效管理</span>
            <h1>绩效中心</h1>
            <p>统一管理目标下发、结果填报、多级复审、绩效申诉与归档，并保留完整版本和操作记录。</p>
          </div>
        </div>
        <div className="platform-header__side">
          <div className="platform-header__meta"><small>当前考核周期</small><strong>{filters.cycle === "all" ? CURRENT_MONTH : filters.cycle}</strong></div>
          <div className="platform-header__meta"><small>当前数据范围</small><strong>{access.roleName} · {scopedReviews.length} 人</strong></div>
        </div>
      </section>
      <section className="performance-filter-panel">
        <div className="performance-filter-panel__fields">
          <label><span>月份</span><select value={filters.cycle} onChange={(event) => updateFilter("cycle", event.target.value)}><option value="all">全部周期</option>{cycles.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span>归属部门</span><select value={filters.department} onChange={(event) => updateFilter("department", event.target.value)}><option value="all">全部</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span>人员</span><input value={filters.employee} onChange={(event) => updateFilter("employee", event.target.value)} placeholder="请输入人员姓名" /></label>
          <label><span>等级筛选</span><select aria-label="等级筛选" value={filters.grade} onChange={(event) => updateFilter("grade", event.target.value)}><option value="all">全部</option><option value="S">S</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="grade_asc">等级正序（D→S）</option><option value="grade_desc">等级倒序（S→D）</option></select></label>
          <label><span>状态</span><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="all">全部流程</option><option value="targetIssue">绩效目标待下发</option><option value={REVIEW_STATUS.secondReview}>二级复评中</option><option value={REVIEW_STATUS.hrReview}>HR复审中</option><option value={REVIEW_STATUS.committeeApproval}>CEO审批中</option>{performanceFocusOptions.filter((option) => option.value !== "all").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>
        <div className="performance-filter-panel__actions">
          <button className="primary-btn" type="button" onClick={() => setPageIndex(0)}>查询</button>
          <button className="ghost-chip" type="button" onClick={() => { setFilters({ cycle: "all", status: "all", department: "all", grade: "all", employee: "" }); setActiveTab("all"); setPageIndex(0); }}>重置</button>
          <button className="ghost-chip" type="button" onClick={() => setRuleDialogOpen(true)}>制度规则</button>
          {activeRole?.id === "hr" ? <button className="ghost-chip" type="button" onClick={() => setTemplateDialogOpen(true)}>绩效模板下发</button> : null}
          <button className="ghost-chip" type="button" onClick={() => setHongguoUploadOpen(true)}><UploadSimple size={16} weight="bold" />上传红果数据</button>
          {activeRole?.id === "leader" ? <button className="primary-btn" type="button" onClick={() => openIssueDialog()}>下发月度绩效目标</button> : null}
        </div>
      </section>
      {actionFeedback ? <div className="performance-action-feedback" role="status">{actionFeedback}</div> : null}
      <section className="performance-summary-grid">
        <article className="performance-summary-card">
          <span>绩效目标确认率</span>
          <strong>{confirmationRate}%</strong>
          <small>当前周期与当前权限范围</small>
        </article>
        <article className="performance-summary-card">
          <span>评分复审完成率</span>
          <strong>{scoredRate}%</strong>
          <small>一级、二级、HR与CEO进度</small>
        </article>
        <article className="performance-summary-card">
          <span>待受理申诉</span>
          <strong>{metricScopeReviews.filter(isOpenAppealReview).length}</strong>
          <small>员工提交后由HR受理调查</small>
        </article>
        <article className="performance-summary-card">
          <span>S级人数</span>
          <strong>{topGradeCount}人</strong>
          <small>80分及以上</small>
        </article>
      </section>
      <div className="tab-row performance-tab-row">
        {focusTabs.map((tab) => (
          <button
            key={tab.value}
            className={`tab-row__item ${activeTab === tab.value ? "is-active" : ""}`}
            onClick={() => updateTab(tab.value)}
            type="button"
          >
            {tab.label}
            <b>{tab.count}</b>
          </button>
        ))}
      </div>
      <SectionCard title="人员绩效列表" action={`${tabReviews.length} 条记录`}>
        <div className="performance-table-shell">
          <div className="admin-table performance-ledger-table">
            <div className="admin-table__head admin-table__head--performance-ledger">
              <span>考核周期</span>
              <span>被考核人</span>
              <span>部门 / 岗位</span>
              <span>评价关系</span>
              <span>绩效目标确认</span>
              <span>结果补充</span>
              <span>一级评分</span>
              <span>二级评分</span>
              <span>加减分</span>
              <span>综合得分</span>
              <span>绩效等级</span>
              <span>流程状态</span>
              <span>申诉状态</span>
              <span>操作</span>
            </div>
            {visibleReviews.length ? visibleReviews.map((item) => {
              const total = calcScore(item);
              const workflowAction = getWorkflowAction(item);
              const statusIndex = Object.values(REVIEW_STATUS).indexOf(item.status);
              const targetConfirmed = ![REVIEW_STATUS.targetIssue, REVIEW_STATUS.employeeConfirm, REVIEW_STATUS.targetDispute].includes(item.status);
              const targetStatusLabel = item.status === REVIEW_STATUS.targetIssue ? "待下发" : item.status === REVIEW_STATUS.targetDispute ? "异议中" : targetConfirmed ? "已确认" : "待员工确认";
              const resultEntered = ![REVIEW_STATUS.targetIssue, REVIEW_STATUS.employeeConfirm, REVIEW_STATUS.targetDispute, REVIEW_STATUS.executing, REVIEW_STATUS.resultEntry].includes(item.status);
              const firstScore = statusIndex >= Object.values(REVIEW_STATUS).indexOf(REVIEW_STATUS.secondReview) ? calcLeaderScore(item, "first") : "--";
              const needsSecondReview = requiresSecondReview(item);
              const secondScore = needsSecondReview && statusIndex >= Object.values(REVIEW_STATUS).indexOf(REVIEW_STATUS.hrReview) ? calcLeaderScore(item, "second") : "--";
              const adjustment = item.rows.filter((row) => row.type === "adjustment").reduce((sum, row) => sum + calcRowScore(row, item), 0);
              const grade = getGrade(total);
              const workflowDisabled = !workflowAction || !canOperateWorkflow(item, workflowAction);
              const isAppealInProgress = item.status === REVIEW_STATUS.appealInProgress;
              const isArchived = item.status === REVIEW_STATUS.archived;
              const appealDisabled = isAppealInProgress ? workflowDisabled : !canStartAppeal(item);

              return (
                <div key={item.id} className={`admin-table__row admin-table__row--performance-ledger ${selectedReviewId === item.id ? "is-selected" : ""}`}>
                  <div className="admin-table__cell admin-table__cell--primary">
                    <strong>{item.cycle}</strong>
                    <small>月度考核</small>
                  </div>
                  <div className="admin-table__cell admin-table__cell--primary">
                    <strong>{item.employee}</strong>
                    <small>{item.role.includes("组长") || item.role.includes("总监") ? "负责人" : "组员"}</small>
                  </div>
                  <div className="field-stack">
                    <b>{item.department}</b>
                    <small>{item.role} · {getReviewTemplate(item).name}</small>
                  </div>
                  <div className="field-stack">
                    <b>一级：{item.directLeader}</b>
                    <small>{needsSecondReview ? `二级：${item.indirectLeader}` : "一级评分"}</small>
                  </div>
                  <div className="performance-table-status">
                    <b className={`field-pill ${targetConfirmed ? "field-pill--success" : item.status === REVIEW_STATUS.targetDispute ? "field-pill--warning" : "field-pill--neutral"}`}>{targetStatusLabel}</b>
                  </div>
                  <div className="performance-table-status">
                    <b className={`field-pill ${resultEntered ? "field-pill--success" : item.status === REVIEW_STATUS.resultEntry ? "field-pill--primary" : "field-pill--neutral"}`}>{resultEntered ? "已填报" : item.status === REVIEW_STATUS.resultEntry ? "待员工填报" : "未开始"}</b>
                    <small>{resultEntered ? "已提交证明材料" : item.status === REVIEW_STATUS.resultEntry ? "员工处理中" : "--"}</small>
                  </div>
                  <div className="field-stack"><b>{firstScore}</b><small>{firstScore === "--" ? "待评分" : "已保存评语"}</small></div>
                  <div className="field-stack"><b>{needsSecondReview ? secondScore : "无需"}</b><small>{needsSecondReview ? (secondScore === "--" ? "待评分" : "已保存评语") : "一级评分制"}</small></div>
                  <div className="field-stack"><b className={adjustment < 0 ? "score-negative" : "score-positive"}>{adjustment > 0 ? `+${adjustment}` : adjustment}</b><small>-10 至 +10</small></div>
                  <div className="field-stack"><b>{resultEntered ? total : "--"}</b><small>{resultEntered ? "已生成" : "未生成"}</small></div>
                  <span><b className={`field-pill ${grade === "S" ? "field-pill--success" : grade === "D" ? "field-pill--danger" : grade === "C" ? "field-pill--warning" : "field-pill--primary"}`}>{resultEntered ? `${grade}-${getLevelLabel(total)}` : "--"}</b></span>
                  <div className="performance-table-status">
                    <b className={`field-pill ${getStatusTone(item.status)}`}>{item.status}</b>
                  </div>
                  <span><b className={`field-pill ${item.status === REVIEW_STATUS.appealInProgress ? "field-pill--primary" : "field-pill--success"}`}>{item.appealStatus === "无申诉" ? "无申诉" : item.appealStatus}</b></span>
                  <div className="table-actions">
                    <button
                      className="table-link"
                      disabled={workflowDisabled}
                      onClick={() => {
                        if (!workflowAction || workflowDisabled) return;
                        workflowAction.type === "issue_target" ? openIssueDialog(item) : openWorkflowDialog(item);
                      }}
                      type="button"
                    >
                      {workflowAction?.label ?? "流程已完成"}
                    </button>
                    <button
                      className="table-link"
                      disabled={appealDisabled}
                      onClick={() => {
                        if (appealDisabled) return;
                        isAppealInProgress ? openWorkflowDialog(item) : setAppealReviewId(item.id);
                      }}
                      type="button"
                    >
                      {isAppealInProgress ? "处理申诉" : "发起申诉"}
                    </button>
                    {activeRole?.id === "leader" && item.directLeader === access.viewerName && item.activeTargetVersion && !item.pendingTargetVersion ? <button className="table-link" onClick={() => openTargetChange(item)} type="button">变更目标</button> : null}
                    {activeRole?.id === "leader" && item.directLeader === access.viewerName && isOpenAppealReview(item) ? <button className="table-link" onClick={() => openAppealEvidence(item)} type="button">提供评分依据</button> : null}
                    <button className="table-link" onClick={() => { setSelectedReviewId(item.id); setDetailReviewId(item.id); }} type="button">详情</button>
                  </div>
                </div>
              );
            }) : (
              <div className="empty-state">
                <strong>当前筛选条件下没有流程记录</strong>
                <span>请调整周期、状态或部门筛选后继续查看月度绩效台账。</span>
              </div>
            )}
          </div>
        </div>
        <div className="performance-pagination">
          <span>第 {safePageIndex + 1} / {totalPages} 页</span>
          <div className="table-actions">
            <button className="ghost-chip" disabled={safePageIndex === 0} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} type="button">上一页</button>
            <button className="ghost-chip" disabled={safePageIndex >= totalPages - 1} onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))} type="button">下一页</button>
          </div>
        </div>
      </SectionCard>
      {hongguoUploadOpen ? <HongguoUploadModal onClose={() => setHongguoUploadOpen(false)} onImport={(upload) => setHongguoUploads((current) => [...current, { ...upload, id: `hongguo-${Date.now()}` }])} /> : null}
      {ruleDialogOpen ? <RuleModal onClose={() => setRuleDialogOpen(false)} /> : null}
      {templateDialogOpen ? <TargetTemplateModal templates={departmentTemplates} departments={[...new Set([...departments, ...departmentTemplates.map((item) => item.department)])]} onSave={onSaveDepartmentTemplate} onCreate={onCreateDepartmentTemplate} onClose={() => setTemplateDialogOpen(false)} /> : null}
    </div>
  );
}
function WorkbenchPage({ goPage, reviews, role }) {
  const pendingReviews = reviews.filter((item) => isPendingReviewStatus(item.status));
  const openAppealCount = getOpenAppealCount(reviews);
  const pendingWeekly = reports.filter((item) => item.status !== "已提交");
  const highRiskProjects = projects.filter((item) => item.risk === "高");
  const roleContent = {
    employee: {
      description: "聚焦个人待办、需要确认的周报动作，以及和绩效相关的当前优先级。",
      chips: ["个人优先", "今日待办", "列表驱动"],
      actionLabel: "进入任务中心",
      actionPage: "tasks",
      followUpTitle: "我的优先事项",
      highlightsTitle: "协同提醒",
      roleTask: { title: "更新个人任务进度", meta: "补齐任务节点与周报状态，避免后续评估缺少依据", page: "tasks", tone: "green" },
    },
    leader: {
      description: "优先处理团队跟进、项目风险与绩效评估，确保跨组协作节奏稳定。",
      chips: ["团队协同", "风险优先", "列表驱动"],
      actionLabel: "查看项目中心",
      actionPage: "projects",
      followUpTitle: "团队待跟进事项",
      highlightsTitle: "团队动态",
      roleTask: { title: "检查团队周报提交", meta: "跟进未提交成员并同步本周资源安排", page: "weekly", tone: "purple" },
    },
    hr: {
      description: "集中查看组织层面的绩效进度、周报完整性与需协调的高风险事项。",
      chips: ["组织视图", "评估推进", "列表驱动"],
      actionLabel: "进入绩效中心",
      actionPage: "performance",
      followUpTitle: "组织待处理事项",
      highlightsTitle: "组织动态",
      roleTask: { title: "推进待处理绩效闭环", meta: "优先催办未完成评分并准备后续校准", page: "performance", tone: "blue" },
    },
    ceo: {
      description: "集中处理经营跟进、绩效评估、项目风险与周报批阅。",
      chips: ["待处理优先", "跨模块联动", "列表驱动"],
      actionLabel: "进入任务中心",
      actionPage: "tasks",
      followUpTitle: "待跟进事项",
      highlightsTitle: "近期动态",
      roleTask: { title: "汇总本周跨组任务", meta: "任务中心已有 6 项待跟进事项", page: "tasks", tone: "green" },
    },
  }[role?.id ?? "ceo"];
  const followUps = [
    { title: "安排绩效评估面谈", meta: `${pendingReviews[0]?.employee ?? "王芳"}等 ${pendingReviews.length} 人待处理`, page: "performance", tone: "blue" },
    { title: "推进高风险项目纠偏", meta: `${highRiskProjects[0]?.name ?? "星际边缘"}需同步资源与排期`, page: "projects", tone: "orange" },
    { title: "批阅未完成周报", meta: `${pendingWeekly.length} 份周报仍需处理`, page: "weekly", tone: "purple" },
    roleContent.roleTask,
  ];
  const highlights = [
    { title: "绩效提醒", meta: `${pendingReviews[0]?.employee ?? "王芳"}综合分 ${pendingReviews[0] ? calcScore(pendingReviews[0]) : 0}，建议本日完成处理`, page: "performance" },
    { title: "风险项目", meta: `${highRiskProjects[0]?.name ?? "星际边缘"}进度 ${highRiskProjects[0]?.progress ?? 0}% ，需重点关注成本波动`, page: "projects" },
    { title: "周报提醒", meta: `${pendingWeekly.map((item) => item.name).join("、")} 的周报状态需更新`, page: "weekly" },
    { title: "任务同步", meta: openAppealCount ? `${openAppealCount} 份绩效申诉处理中，建议同步跟进调查协调` : "建议在任务中心更新跨部门协作节点与负责人", page: openAppealCount ? "performance" : "tasks" },
  ];
  const overviewCards = [
    { title: "待处理任务", value: followUps.length, meta: "优先处理跨模块事项", page: "tasks", tone: "blue" },
    { title: "待处理绩效", value: pendingReviews.length, meta: "支持直接进入绩效流程", page: "performance", tone: "green" },
    { title: "高风险项目", value: highRiskProjects.length, meta: "需要经营与资源联动", page: "projects", tone: "orange" },
    { title: "待批阅周报", value: pendingWeekly.length, meta: "跟进草稿与待批阅记录", page: "weekly", tone: "purple" },
  ];

  return (
    <div className="admin-page">
      <PageIntro
        title="工作台"
        description={roleContent.description}
        actions={<button className="primary-btn" type="button" onClick={() => goPage(roleContent.actionPage)}>{roleContent.actionLabel}</button>}
        chips={roleContent.chips}
      />
      <section className="admin-overview-grid">
        {overviewCards.map((card) => (
          <button key={card.title} className={`admin-overview-card admin-overview-card--${card.tone}`} onClick={() => goPage(card.page)} type="button">
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <small>{card.meta}</small>
          </button>
        ))}
      </section>
      <div className="admin-two-column">
        <SectionCard title={roleContent.followUpTitle} action="查看全部" className="admin-section">
          <div className="admin-list">
            {followUps.map((item) => (
              <button key={item.title} className="admin-list__item" onClick={() => goPage(item.page)} type="button">
                <div className={`admin-list__badge admin-list__badge--${item.tone}`}>
                  <WarningCircle size={16} weight="duotone" />
                </div>
                <div className="admin-list__content">
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </div>
                <span className="admin-list__link">进入模块</span>
              </button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title={roleContent.highlightsTitle} action="按模块查看" className="admin-section">
          <div className="admin-list">
            {highlights.map((item) => (
              <button key={item.title} className="admin-list__item admin-list__item--soft" onClick={() => goPage(item.page)} type="button">
                <div className="admin-list__content">
                  <span className="admin-list__eyebrow">{item.title}</span>
                  <strong>{item.meta}</strong>
                </div>
                <span className="admin-list__link">查看</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function ProjectsPage() {
  return (
    <div className="admin-page">
      <PageIntro
        title="项目中心"
        description="统一查看项目台账、阶段状态与风险分布，支持运营视角快速筛选与新增项目。"
        actions={<button className="primary-btn" type="button">新建项目</button>}
        chips={["项目台账", "风险跟进", "运营管理"]}
      />
      <FilterBar
        fields={[
          <label key="keyword"><span>项目名称</span><input placeholder="搜索项目名称" /></label>,
          <label key="stage"><span>项目阶段</span><select defaultValue="all"><option value="all">全部阶段</option><option value="active">制作中</option><option value="launch">待上线</option><option value="prep">筹备中</option></select></label>,
          <label key="risk"><span>风险等级</span><select defaultValue="all"><option value="all">全部风险</option><option value="high">高风险</option><option value="medium">中风险</option><option value="low">低风险</option></select></label>,
          <label key="owner"><span>负责人</span><input placeholder="输入负责人" /></label>,
        ]}
        actions={[
          <button key="reset" className="ghost-chip" type="button">重置</button>,
          <button key="search" className="primary-btn" type="button">查询项目</button>,
        ]}
      />
      <SectionCard title="项目列表" action={`${projects.length} 个项目`}>
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--projects">
            <span>项目名称</span>
            <span>阶段</span>
            <span>风险等级</span>
            <span>负责人</span>
          </div>
          {projects.map((project) => (
            <div key={project.id} className="admin-table__row admin-table__row--projects">
              <div className="admin-table__cell admin-table__cell--primary">
                <strong>{project.name}</strong>
                <small>进度 {project.progress}% · ROI {project.roi}%</small>
              </div>
              <span><b className="field-pill field-pill--neutral">{project.stage}</b></span>
              <span><b className={`field-pill ${project.risk === "高" ? "field-pill--danger" : project.risk === "中" ? "field-pill--warning" : "field-pill--success"}`}>{project.risk}风险</b></span>
              <span className="field-inline"><i className="field-dot" />{project.owner}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function TasksPage() {
  return (
    <div className="admin-page">
      <PageIntro
        title="任务中心"
        description="从看板预览切换为运营列表，便于按状态、负责人和时间窗口集中处理任务。"
        actions={<button className="primary-btn" type="button">分派任务</button>}
        chips={["任务台账", "负责人视图", "到期管理"]}
      />
      <FilterBar
        fields={[
          <label key="keyword"><span>任务名称</span><input placeholder="搜索任务名称" /></label>,
          <label key="status"><span>任务状态</span><select defaultValue="all"><option value="all">全部状态</option><option value="todo">待处理</option><option value="doing">进行中</option><option value="review">待审核</option><option value="done">已完成</option></select></label>,
          <label key="owner"><span>负责人</span><input placeholder="输入负责人" /></label>,
          <label key="dueDate"><span>截止时间</span><input type="date" /></label>,
        ]}
        actions={[
          <button key="reset" className="ghost-chip" type="button">清空条件</button>,
          <button key="search" className="primary-btn" type="button">查询任务</button>,
        ]}
      />
      <SectionCard title="任务列表" action={`${taskRows.length} 条任务`}>
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--tasks">
            <span>任务名称</span>
            <span>状态</span>
            <span>负责人</span>
            <span>截止日期</span>
          </div>
          {taskRows.map((task) => (
            <div key={task.id} className="admin-table__row admin-table__row--tasks">
              <div className="admin-table__cell admin-table__cell--primary">
                <strong>{task.name}</strong>
                <small>用于统一跟踪跨组交付节点</small>
              </div>
              <span><b className={`field-pill ${task.status === "已完成" ? "field-pill--success" : task.status === "待审核" ? "field-pill--warning" : task.status === "进行中" ? "field-pill--primary" : "field-pill--neutral"}`}>{task.status}</b></span>
              <span className="field-inline"><i className="field-dot" />{task.owner}</span>
              <span className="field-date">{task.dueDate}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function WeeklyPage() {
  return (
    <section className="weekly-document-page" aria-label="智能周报中心">
      <iframe
        className="weekly-document-page__frame"
        src="/weekly-report.html"
        title="智能周报中心"
      />
    </section>
  );
}

function AppContent() {
  const { completeWorkbenchTask } = useDemoData();
  const [activeRole, setActiveRole] = useState("ceo");
  const [activePage, setActivePage] = useState("workspace");
  const [accessFeedback, setAccessFeedback] = useState("");
  const [entryTask, setEntryTask] = useState(null);
  const [reviews, setReviews] = useState(() => {
    try {
      return import.meta.env.MODE === "test"
        ? reviewsSeed
        : JSON.parse(window.localStorage.getItem("kpi-bi:performance-reviews:v1")) || reviewsSeed;
    } catch {
      return reviewsSeed;
    }
  });
  const [departmentTemplates, setDepartmentTemplates] = useState(departmentPerformanceTemplatesSeed);
  const activeRoleMeta = roles.find((item) => item.id === activeRole);

  useEffect(() => {
    const main = document.querySelector(".app-main");
    if (main) {
      main.scrollTop = 0;
      main.scrollLeft = 0;
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activePage]);

  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    try {
      window.localStorage.setItem("kpi-bi:performance-reviews:v1", JSON.stringify(reviews));
    } catch {
      // The demo remains usable when browser persistence is unavailable.
    }
  }, [reviews]);

  useEffect(() => {
    if (canAccessPlatformPage(activeRole, activePage)) return;
    setActivePage("workspace");
    setEntryTask(null);
    setAccessFeedback(`当前${roleAccess[activeRole]?.roleName ?? "身份"}无权访问该业务页面，已返回工作台。`);
  }, [activePage, activeRole]);

  const goPage = (page, context = {}) => {
    if (!canAccessPlatformPage(activeRole, page)) {
      setEntryTask(null);
      setAccessFeedback(`当前${roleAccess[activeRole]?.roleName ?? "身份"}无权进入该业务页面。`);
      setActivePage("workspace");
      return;
    }
    setAccessFeedback("");
    setEntryTask(context.task ?? null);
    setActivePage(page);
  };

  const completeTask = (task, payload) => {
    const completed = completeWorkbenchTask(task, payload);
    if (!completed) {
      setAccessFeedback(`“${task.title}”需要进入来源业务页面处理。`);
      return;
    }
    setEntryTask(null);
    setAccessFeedback(`“${task.title}”已回写来源业务单据，工作台与驾驶舱已同步更新。`);
  };

  const visibleSidebarGroups = sidebarGroups.map((group) => ({ ...group, items: group.items.filter((item) => canAccessPlatformPage(activeRole, item.id)) })).filter((group) => group.items.length);

  const saveReview = (draft) => {
    setReviews((current) => current.map((item) => (item.id === draft.id ? draft : item)));
  };

  const batchIssueReviews = (reviewIds, payload) => {
    setReviews((current) => current.map((item) => {
      if (!reviewIds.includes(item.id)) return item;
      const nextLogIndex = (item.operationLogs?.length ?? 0) + 1;
      const assignment = payload.categoriesByReview?.[item.id] ?? { categories: payload.categories };
      const assignedCategories = clonePerformanceCategories(assignment.categories);
      return {
        ...item,
        cycle: payload.cycle,
        status: REVIEW_STATUS.employeeConfirm,
        owner: item.employee,
        assignedCategories,
        departmentTemplateId: assignment.templateId ?? null,
        departmentTemplateName: assignment.templateName ?? `${item.department}·${item.role}绩效模板`,
        activeTargetVersion: null,
        pendingTargetVersion: 1,
        targetVersions: [{ version: 1, status: "待员工确认", targets: assignedCategories, operator: payload.operator, actedAt: "2026-07-08 10:00", changeReason: `首次下发，引用${assignment.templateName ?? `${item.department}·${item.role}模板`}` }],
        version: Number(item.version ?? 1) + 1,
        okrDeadline: payload.deadline ?? "",
        okrNotifyMode: payload.notifyMode ?? "站内信 + 待办",
        lastActionAt: "2026-07-08 10:00",
        lastActionName: "批量下发月度绩效目标",
        operationLogs: [
          ...(item.operationLogs ?? []),
          {
            id: `${item.id}-log-${nextLogIndex}`,
            action: "批量下发月度绩效目标",
            operator: payload.operator,
            actedAt: "2026-07-08 10:00",
            note: `已按${payload.cycle}${assignment.templateName ?? `${item.department}·${item.role}模板`}下发绩效目标V1，共${assignedCategories.filter((category) => category.type !== "adjustment").length}项目标；提交截止${payload.deadline || "未设置"}，通知方式${payload.notifyMode || "站内信 + 待办"}。`,
            fromStatus: item.status,
            toStatus: REVIEW_STATUS.employeeConfirm,
          },
        ],
      };
    }));
  };

  const saveDepartmentTemplate = (draft) => {
    setDepartmentTemplates((current) => current.map((item) => item.id === draft.id ? { ...draft, categories: clonePerformanceCategories(draft.categories) } : item));
  };

  const createDepartmentTemplate = (draft) => {
    const next = { ...draft, id: `department-template-${Date.now()}`, categories: clonePerformanceCategories(draft.categories) };
    setDepartmentTemplates((current) => [...current, next]);
    return next;
  };

  const saveAppeal = (reviewId, draft) => {
    setReviews((current) => current.map((item) => (
      item.id === reviewId && activeRole === "employee" && item.employee === roleAccess.employee.viewerName
        ? {
            ...item,
            appealStatus: "待HR调查",
            status: REVIEW_STATUS.appealSubmitted,
            owner: "HR-唐宁",
            appealDate: getActionTimestamp(),
            appealReason: draft.reason,
            appealEvidence: draft.evidence,
            expectedResolution: draft.expectedResolution,
            resultVersions: item.resultVersions?.length ? item.resultVersions : [{ version: 1, score: calcScore(item), grade: getGrade(calcScore(item)), status: "已生效", operator: "CEO", actedAt: item.lastActionAt }],
            version: Number(item.version ?? 1) + 1,
            operationLogs: [
              ...(item.operationLogs ?? []),
              {
                id: `${item.id}-log-${(item.operationLogs?.length ?? 0) + 1}`,
                action: "发起绩效申诉",
                operator: roleAccess[activeRole]?.viewerName ?? item.employee,
                actedAt: getActionTimestamp(),
                note: draft.reason || "员工发起绩效申诉。",
                fromStatus: item.status,
                toStatus: REVIEW_STATUS.appealSubmitted,
              },
            ],
          }
        : item
    )));
  };

  const activeSscView = sscPageViews[activePage];
  const activePageContent = <>{activePage !== "workspace" && activePage !== "reports" ? <RoleScopeBanner activeRole={activeRole} page={sidebarGroups.flatMap((group) => group.items).find((item) => item.id === activePage)?.label ?? "业务页面"} /> : null}{activePage === "workspace" ? <UnifiedWorkbenchPage activeRole={activeRole} goPage={goPage} /> : null}{activePage === "dashboard" ? <BusinessDashboardPage activeRole={activeRole} goPage={goPage} reviews={reviews} /> : null}{activePage === "performance" ? <PerformanceCenter reviews={reviews} onSave={saveReview} onBatchIssue={batchIssueReviews} onSaveAppeal={saveAppeal} activeRole={activeRoleMeta} departmentTemplates={departmentTemplates} onSaveDepartmentTemplate={saveDepartmentTemplate} onCreateDepartmentTemplate={createDepartmentTemplate} /> : null}{activePage === "reports" ? <WeeklyPage /> : null}{activePage === "recruitment" ? <RecruitmentCenterPage /> : null}{activePage === "topics" ? <TopicCenterPage goPage={goPage} /> : null}{activePage === "projects" ? <ProjectProductionPage /> : null}{activeSscView ? <SscDataMaintenancePage view={activeSscView} /> : null}{activePage === "governance" ? <GovernancePage /> : null}</>;

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand__logo"><ChartLineUp size={22} weight="duotone" /></div><div><strong>KPI_BI</strong><span>一体化管理平台</span></div></div><nav className="sidebar__nav" aria-label="主导航">{visibleSidebarGroups.map((group) => <section className="sidebar__group" key={group.label}><span>{group.label}</span>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={`sidebar__item ${activePage === item.id ? "is-active" : ""}`} onClick={() => goPage(item.id)} type="button"><Icon size={19} weight="duotone" />{item.label}</button>; })}</section>)}</nav><div className="role-switcher">{roles.map((role) => <button key={role.id} className={`ghost-chip ${activeRole === role.id ? "ghost-chip--active" : ""}`} onClick={() => setActiveRole(role.id)} type="button"><span>{role.label}</span><small>{role.badge}</small></button>)}</div></aside>
      <div className="app-main">
        <div className="content">{accessFeedback ? <div className="platform-access-feedback" role="status">{accessFeedback}</div> : null}{activePageContent}{entryTask ? <BusinessTaskProcessingDrawer activeRole={activeRole} onClose={() => setEntryTask(null)} onComplete={completeTask} task={entryTask} /> : null}</div>
      </div>
    </main>
  );
}

export function App() {
  return (
    <DemoDataProvider>
      <AppContent />
    </DemoDataProvider>
  );
}
