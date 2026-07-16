import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  Briefcase,
  Buildings,
  CalendarCheck,
  ChartLineUp,
  CheckCircle,
  Clock,
  FileText,
  Funnel,
  Info,
  Lightbulb,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  TrendUp,
  UserCirclePlus,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PersonnelDashboard } from "../dashboard/PersonnelDashboard";
import {
  readSscPersonnel,
  resolveSscEmployment,
  summarizeSscEmployment,
} from "../ssc/sscPersonnelStore";
import {
  createMetricDefinition,
  selectIncludedRecruitmentReports,
  selectRecruitmentDecisionAnalysis,
  selectProjectCostBreakdown,
  selectProjectSummary,
  selectRecruitmentFunnel,
  selectRecruitmentSummary,
  selectTopicSummary,
  selectWorkbenchTasks,
} from "./demoSelectors";

const jobsSeed = [
  {
    id: "JOB-026",
    name: "短剧编剧",
    department: "内容运营中心",
    city: "杭州",
    need: 3,
    onboarded: 1,
    recruiter: "陈璐",
    priority: "高",
    status: "招聘中",
    candidates: 18,
    startDate: "2026-07-01",
    endDate: "2026-07-21",
    cycle: "21天",
    interviewRounds: 1,
    interviewers: ["江晚"],
  },
  {
    id: "JOB-031",
    name: "中级剪辑师",
    department: "剪辑中心",
    city: "上海",
    need: 4,
    onboarded: 2,
    recruiter: "许晴",
    priority: "紧急",
    status: "招聘中",
    candidates: 26,
    startDate: "2026-07-03",
    endDate: "2026-07-21",
    cycle: "18天",
    interviewRounds: 2,
    interviewers: ["沈婉瑶", "李晓言"],
  },
  {
    id: "JOB-035",
    name: "制片经理",
    department: "制片中心",
    city: "杭州",
    need: 1,
    onboarded: 0,
    recruiter: "陈璐",
    priority: "中",
    status: "暂停招聘",
    candidates: 7,
    startDate: "2026-06-15",
    endDate: "2026-07-17",
    cycle: "32天",
    interviewRounds: 3,
    interviewers: ["林制作", "江晚", "陈雨"],
  },
  {
    id: "JOB-039",
    name: "海外发行运营",
    department: "运营增长中心",
    city: "深圳",
    need: 2,
    onboarded: 1,
    recruiter: "周宁",
    priority: "高",
    status: "招聘中",
    candidates: 13,
    startDate: "2026-07-05",
    endDate: "2026-07-21",
    cycle: "16天",
    interviewRounds: 2,
    interviewers: ["赵启", "王敏"],
  },
];

const jobCatalog = {
  内容运营中心: ["短剧编剧", "内容策划", "内容运营"],
  剪辑中心: ["中级剪辑师", "高级剪辑师", "剪辑组长"],
  制片中心: ["制片经理", "执行制片", "制片助理"],
  运营增长中心: ["海外发行运营", "增长运营", "投放运营"],
  经营管理部: ["数据分析师", "经营分析师"],
};

const candidatesSeed = [
  {
    id: "CAN-021",
    name: "周然",
    phone: "138****5621",
    email: "zhou.ran@example.com",
    source: "BOSS直聘",
    applications: [
      {
        id: "APP-021",
        job: "短剧编剧",
        status: "待部门确认",
        interviewer: "江晚",
      },
      {
        id: "APP-034",
        job: "内容策划",
        status: "已安排面试",
        interviewer: "李晓言",
      },
      {
        id: "APP-041",
        job: "中级剪辑师",
        status: "不进入面试",
        interviewer: "沈婉瑶",
        rejection: {
          stage: "resume",
          category: "专业技能不匹配",
          detail: "作品集中的剪辑节奏与岗位要求存在差距。",
        },
      },
    ],
    owner: "陈璐",
    updatedAt: "2026-07-14 15:10",
    duplicate: "已关联主档",
  },
  {
    id: "CAN-026",
    name: "顾言",
    phone: "186****1098",
    email: "gu.yan@example.com",
    source: "猎聘",
    applications: [
      {
        id: "APP-026",
        job: "中级剪辑师",
        status: "待面试反馈",
        interviewer: "沈婉瑶",
        interviewTotal: 2,
        currentInterviewRound: 1,
        interviewers: ["沈婉瑶", "李晓言"],
        interviews: [
          {
            round: 1,
            interviewer: "沈婉瑶",
            interviewAt: "2026-07-16T14:00",
            status: "待反馈",
          },
        ],
      },
      {
        id: "APP-046",
        job: "短剧编剧",
        status: "面试未通过",
        interviewer: "江晚",
        rejection: {
          stage: "interview",
          category: "项目经验不足",
          detail: "缺少完整负责商业短剧项目的经验。",
          round: 1,
        },
        interviews: [
          { round: 1, interviewer: "江晚", status: "未通过" },
        ],
      },
    ],
    owner: "许晴",
    updatedAt: "2026-07-14 14:32",
    duplicate: "无重复",
  },
  {
    id: "CAN-031",
    name: "林澈",
    phone: "159****7712",
    email: "lin.che@example.com",
    source: "内推",
    applications: [
      {
        id: "APP-031",
        job: "制片经理",
        status: "Offer已发",
        interviewer: "林制作",
      },
      {
        id: "APP-049",
        job: "海外发行运营",
        status: "Offer已拒绝",
        interviewer: "王敏",
        rejection: {
          stage: "offer",
          category: "薪资未达预期",
          detail: "候选人期望薪资超出当前岗位预算。",
        },
        interviews: [
          { round: 1, interviewer: "赵启", status: "已通过" },
          { round: 2, interviewer: "王敏", status: "已通过" },
        ],
      },
    ],
    owner: "陈璐",
    updatedAt: "2026-07-14 13:08",
    duplicate: "无重复",
  },
  {
    id: "CAN-038",
    name: "苏冉",
    phone: "137****3156",
    email: "su.ran@example.com",
    source: "BOSS直聘",
    applications: [
      {
        id: "APP-038",
        job: "海外发行运营",
        status: "实习期",
        interviewer: "赵启",
        sscEmployeeNo: "ZY20260715",
      },
    ],
    owner: "周宁",
    updatedAt: "2026-07-14 11:26",
    duplicate: "邮箱相似",
  },
];

const recruitmentDailySeed = [
  {
    id: "RD-0714-01",
    date: "2026-07-14",
    recruiter: "陈璐",
    platform: "BOSS直聘",
    job: "中级剪辑师",
    hello: 120,
    reply: 36,
    resume: 20,
    valid: 12,
    invite: 8,
    interview: 6,
    passed: 3,
    offer: 2,
    accepted: 1,
    onboarded: 1,
    screenshots: 2,
    status: "已提交",
    difference: 1,
  },
  {
    id: "RD-0714-02",
    date: "2026-07-14",
    recruiter: "许晴",
    platform: "猎聘",
    job: "制片经理",
    hello: 54,
    reply: 18,
    resume: 11,
    valid: 6,
    invite: 4,
    interview: 2,
    passed: 1,
    offer: 1,
    accepted: 0,
    onboarded: 0,
    screenshots: 1,
    status: "已提交",
    difference: 0,
  },
  {
    id: "RD-0714-03",
    date: "2026-07-14",
    recruiter: "周宁",
    platform: "BOSS直聘",
    job: "海外发行运营",
    hello: 86,
    reply: 28,
    resume: 15,
    valid: 9,
    invite: 5,
    interview: 3,
    passed: 1,
    offer: 0,
    accepted: 0,
    onboarded: 0,
    screenshots: 0,
    status: "草稿",
    difference: 2,
  },
];

const topicsSeed = [
  {
    id: "TOPIC-026",
    name: "《无声档案》",
    template: "编剧模板",
    genre: "悬疑短剧",
    audience: "都市女性",
    submitter: "张小北",
    version: 3,
    status: "已通过待立项",
    reviewer: "江晚",
    updatedAt: "2026-07-14 15:26",
    projectId: null,
    reason: "",
    summary: "以声音证据为核心线索的都市悬疑短剧，突出低成本场景与高密度反转。",
  },
  {
    id: "TOPIC-031",
    name: "《十分钟便利店》",
    template: "制片模板",
    genre: "都市轻喜",
    audience: "18-35岁职场人",
    submitter: "沈婉瑶",
    version: 2,
    status: "已退回",
    reviewer: "林制作",
    updatedAt: "2026-07-14 13:42",
    projectId: null,
    reason: "缺少成本与场景可行性说明",
    summary: "发生在深夜便利店中的单元轻喜剧，通过陌生人短暂相遇呈现都市情绪。",
  },
  {
    id: "TOPIC-018",
    name: "《城市边缘》",
    template: "编剧模板",
    genre: "现实题材",
    audience: "泛都市用户",
    submitter: "江晚",
    version: 4,
    status: "已转项目",
    reviewer: "CEO",
    updatedAt: "2026-07-13 18:06",
    projectId: "PRJ-009",
    reason: "",
    summary: "关注城市边缘职业群体的现实题材项目，采用内部并行制作。",
  },
  {
    id: "TOPIC-036",
    name: "《夏日回响》",
    template: "制片模板",
    genre: "青春情感",
    audience: "年轻女性",
    submitter: "林制作",
    version: 1,
    status: "待审核",
    reviewer: "江晚",
    updatedAt: "2026-07-14 10:18",
    projectId: null,
    reason: "",
    summary: "以海滨小城为背景的青春情感故事，计划评估外部制作方案。",
  },
];

const projectsSeed = [
  {
    id: "PRJ-009",
    name: "《城市边缘》",
    topic: "TOPIC-018",
    mode: "内部制作",
    owner: "沈婉瑶",
    status: "进行中",
    flags: ["延期"],
    start: "2026-05-18",
    due: "2026-08-05",
    centers: ["内容中心", "AI制作中心", "剪辑中心"],
    budget: 260000,
    actual: 171000,
    manpowerCost: 82000,
    computeCost: 54000,
    trafficCost: 35000,
    next: "剪辑一审",
    stages: [
      { name: "剧本", owner: "张小北", progress: 40, status: "进行中" },
      { name: "视频", owner: "林制作", progress: 60, status: "进行中" },
      { name: "剪辑", owner: "沈婉瑶", progress: 80, status: "进行中" },
    ],
  },
  {
    id: "PRJ-012",
    name: "《夏日回响》",
    topic: "TOPIC-036",
    mode: "外部制作",
    owner: "林制作",
    status: "进行中",
    flags: [],
    start: "2026-06-12",
    due: "2026-08-18",
    centers: ["制片中心", "运营增长中心"],
    budget: 180000,
    actual: 126000,
    next: "样片交付",
    vendor: "星云影业",
    contact: "王澜",
    liaison: "林制作",
    progress: 65,
    contract: {
      name: "夏日回响外部制作合同.pdf",
      size: 1864200,
      type: "application/pdf",
      uploadedAt: "2026-06-12 10:30",
      previewText: "甲方委托星云影业完成《夏日回响》短剧制作。合同约定样片、成片和最终交付三个里程碑，并明确制作周期、验收标准、知识产权及付款节点。",
    },
  },
  {
    id: "PRJ-015",
    name: "《无声档案》",
    topic: "TOPIC-026",
    mode: "内部制作",
    owner: "沈婉瑶",
    status: "未开始",
    flags: [],
    start: "2026-07-28",
    due: "2026-09-02",
    centers: ["内容中心", "AI制作中心", "剪辑中心"],
    budget: 220000,
    actual: 0,
    manpowerCost: 0,
    computeCost: 0,
    trafficCost: 0,
    next: "项目启动",
    stages: [
      { name: "剧本", owner: "张小北", progress: 0, status: "未开始" },
      { name: "视频", owner: "林制作", progress: 0, status: "未开始" },
      { name: "剪辑", owner: "沈婉瑶", progress: 0, status: "未开始" },
    ],
  },
  {
    id: "PRJ-006",
    name: "《记忆修复师》",
    topic: "TOPIC-011",
    mode: "内部制作",
    owner: "江晚",
    status: "已完成",
    flags: ["历史延期"],
    start: "2026-03-06",
    due: "2026-06-30",
    centers: ["内容中心", "制片中心", "剪辑中心", "运营增长中心"],
    budget: 310000,
    actual: 298000,
    manpowerCost: 136000,
    computeCost: 94000,
    trafficCost: 68000,
    next: "项目复盘",
    stages: [
      { name: "剧本", owner: "周编剧", progress: 100, status: "已完成" },
      { name: "视频", owner: "林制作", progress: 100, status: "已完成" },
      { name: "剪辑", owner: "陈组长", progress: 100, status: "已完成" },
    ],
  },
];

const operationUploadsSeed = [
  {
    id: "OPS-0714-01",
    projectId: "PRJ-009",
    type: "投流日报",
    channel: "抖音",
    cycle: "2026-07-14",
    uploader: "赵启航",
    uploadedAt: "2026-07-14 20:18",
    summary: "消耗 ¥32,800 · ROI 1.84 · 新增付费 1,206",
  },
  {
    id: "OPS-0713-04",
    projectId: "PRJ-009",
    type: "素材表现",
    channel: "抖音 / 快手",
    cycle: "2026-W28",
    uploader: "陆运营",
    uploadedAt: "2026-07-13 18:42",
    summary: "在投素材 18 条 · 高潜素材 5 条 · 完播率 31.6%",
  },
  {
    id: "OPS-0714-02",
    projectId: "PRJ-012",
    type: "渠道日报",
    channel: "TikTok",
    cycle: "2026-07-14",
    uploader: "罗语萱",
    uploadedAt: "2026-07-14 19:36",
    summary: "曝光 186 万 · 点击率 4.8% · 预约 8,920",
  },
  {
    id: "OPS-0712-03",
    projectId: "PRJ-012",
    type: "受众洞察",
    channel: "TikTok / Reels",
    cycle: "2026-W28",
    uploader: "罗语萱",
    uploadedAt: "2026-07-12 17:08",
    summary: "核心受众 18–34 岁 · 女性占比 67% · 高潜地区 4 个",
  },
  {
    id: "OPS-0702-01",
    projectId: "PRJ-006",
    type: "上线复盘",
    channel: "全渠道",
    cycle: "2026-06",
    uploader: "赵启航",
    uploadedAt: "2026-07-02 16:20",
    summary: "累计播放 3,860 万 · ROI 2.16 · 回收周期 23 天",
  },
  {
    id: "OPS-0630-02",
    projectId: "PRJ-006",
    type: "用户反馈",
    channel: "抖音 / 红果",
    cycle: "2026-06",
    uploader: "陆运营",
    uploadedAt: "2026-06-30 21:05",
    summary: "有效评论 12,430 条 · 正向 78% · 高频议题 6 个",
  },
];

const DEMO_DATA_STORAGE_KEY = "kpi-bi:demo-domain-data:v2";

function cloneDemoValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function enrichCandidateApplications(candidates, jobs) {
  return candidates.map((candidate) => ({
    ...candidate,
    applications: candidate.applications.map((application) => {
      if (application.version) return application;
      const interviewTotal =
        jobs.find((job) => job.name === application.job)?.interviewRounds ?? 1;
      const interviewStatus =
        application.status === "已安排面试"
          ? "已安排"
          : application.status === "待面试反馈"
            ? "待反馈"
            : null;
      return {
        ...application,
        interviewTotal,
        currentInterviewRound: 1,
        interviews: interviewStatus
          ? [
              {
                round: 1,
                interviewer: application.interviewer,
                interviewAt: "2026-07-16T14:00",
                status: interviewStatus,
              },
            ]
          : [],
        version: 1,
        history: [
          {
            time: "2026-07-14 09:30",
            action: "进入当前节点",
            operator: candidate.owner,
            note: `当前状态：${application.status}`,
          },
        ],
      };
    }),
  }));
}

function createDemoDataSnapshot() {
  const jobs = cloneDemoValue(jobsSeed);
  return {
    jobs,
    candidates: enrichCandidateApplications(
      cloneDemoValue(candidatesSeed),
      jobs,
    ),
    recruitmentDailyReports: cloneDemoValue(recruitmentDailySeed),
    topics: cloneDemoValue(topicsSeed),
    projects: cloneDemoValue(projectsSeed),
    operationUploads: cloneDemoValue(operationUploadsSeed),
    updatedAt: "2026-07-16 09:00",
  };
}

function hydrateStoredDemoData(stored = {}) {
  const base = createDemoDataSnapshot();
  const storedProjects = stored.projects ?? base.projects;
  const projects = storedProjects.map((project) => {
    const seedProject = base.projects.find((item) => item.id === project.id);
    const merged = { ...seedProject, ...project };
    if (merged.mode !== "外部制作") return merged;
    return {
      ...merged,
      progress: Number(merged.progress ?? 0),
      due: merged.due ?? merged.deadline ?? "待排期",
      next: merged.next ?? "供应商启动",
      vendor: merged.vendor ?? "待录入",
      contact: merged.contact ?? "待录入",
      liaison: merged.liaison ?? merged.owner ?? "待分配",
    };
  });
  return { ...base, ...stored, projects };
}

const DemoDataContext = createContext(null);

export function DemoDataProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const stored =
        import.meta.env.MODE === "test"
          ? null
          : window.localStorage.getItem(DEMO_DATA_STORAGE_KEY);
      if (stored) return hydrateStoredDemoData(JSON.parse(stored));
    } catch {
      // Storage may be unavailable in a restricted preview; the in-memory demo still works.
    }
    return createDemoDataSnapshot();
  });

  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    try {
      window.localStorage.setItem(DEMO_DATA_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Keep the demo operational when persistence is unavailable.
    }
  }, [data]);

  useEffect(() => {
    const handleSscRecruitmentLink = (event) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !== "ssc-recruitment-linked"
      )
        return;
      const { candidateId, applicationId, employee } = event.data;
      if (!candidateId || !applicationId || !employee?.no) return;
      const status =
        employee.status === "已离职"
          ? "已离职"
          : employee.regular === "已转正"
            ? "已转正"
            : "实习期";
      const now = new Date().toLocaleString("zh-CN", { hour12: false });
      setData((current) => ({
        ...current,
        updatedAt: now,
        candidates: current.candidates.map((candidate) =>
          candidate.id !== candidateId
            ? candidate
            : {
                ...candidate,
                updatedAt: now,
                applications: candidate.applications.map((application) =>
                  application.id !== applicationId
                    ? application
                    : {
                        ...application,
                        status,
                        sscEmployeeNo: employee.no,
                        onboardAt: employee.date ?? application.onboardAt,
                        employmentSource: "SSC花名册",
                        version: Number(application.version ?? 1) + 1,
                        history: [
                          ...(application.history ?? []),
                          {
                            time: now,
                            action: "SSC完成员工建档并关联",
                            operator: "SSC服务中心",
                            note: `员工编号：${employee.no}`,
                          },
                        ],
                      },
                ),
              },
        ),
      }));
    };
    window.addEventListener("message", handleSscRecruitmentLink);
    return () => window.removeEventListener("message", handleSscRecruitmentLink);
  }, []);

  const patchCollection = (key, next) => {
    setData((current) => ({
      ...current,
      [key]: typeof next === "function" ? next(current[key]) : next,
      updatedAt: "2026-07-16 09:30",
    }));
  };

  const value = useMemo(
    () => ({
      ...data,
      setJobs: (next) => patchCollection("jobs", next),
      setCandidates: (next) => patchCollection("candidates", next),
      setRecruitmentDailyReports: (next) =>
        patchCollection("recruitmentDailyReports", next),
      setTopics: (next) => patchCollection("topics", next),
      setProjects: (next) => patchCollection("projects", next),
      setOperationUploads: (next) => patchCollection("operationUploads", next),
      resetDemoData: () => setData(createDemoDataSnapshot()),
      createProjectFromTopic: (topicId, projectDraft = {}) => {
        const projectId = `PRJ-${String(Date.now()).slice(-6)}`;
        setData((current) => {
          const topic = current.topics.find((item) => item.id === topicId);
          if (!topic || topic.projectId) return current;
          const mode = projectDraft.mode ?? "内部制作";
          const owner = projectDraft.owner ?? topic.submitter;
          const due = projectDraft.deadline ?? "2026-08-31";
          const project = {
            id: projectId,
            name: topic.name,
            mode,
            owner,
            status: "未开始",
            progress: 0,
            start: "2026-07-16",
            due,
            deadline: due,
            budget: Number(projectDraft.budget) || 120000,
            actual: 0,
            manpowerCost: 0,
            computeCost: 0,
            trafficCost: 0,
            topicId: topic.id,
            topic: topic.id,
            contract: mode === "外部制作" ? projectDraft.contract ?? null : null,
            centers:
              mode === "内部制作"
                ? ["内容中心", "AI制作中心", "剪辑中心"]
                : ["制片中心"],
            next: mode === "内部制作" ? "项目启动" : "供应商启动",
            vendor: mode === "外部制作" ? "待录入" : undefined,
            contact: mode === "外部制作" ? "待录入" : undefined,
            liaison: mode === "外部制作" ? owner : undefined,
            flags: [],
            stages:
              mode === "内部制作"
                ? [
                    { name: "剧本", owner: topic.submitter, progress: 0, status: "未开始" },
                    { name: "视频", owner: "待分配", progress: 0, status: "未开始" },
                    { name: "剪辑", owner: "待分配", progress: 0, status: "未开始" },
                  ]
                : [],
          };
          return {
            ...current,
            topics: current.topics.map((item) =>
              item.id === topicId
                ? { ...item, status: "已转项目", projectId }
                : item,
            ),
            projects: [...current.projects, project],
            updatedAt: "2026-07-16 09:30",
          };
        });
        return projectId;
      },
      completeWorkbenchTask: (task, payload = {}) => {
        if (!task?.sourceType || !task.sourceId) return false;
        setData((current) => {
          if (task.sourceType === "recruitment") {
            return {
              ...current,
              candidates: current.candidates.map((candidate) => ({
                ...candidate,
                applications: candidate.applications.map((application) =>
                  application.id === task.sourceId
                    ? {
                        ...application,
                        status:
                          payload.decision === "不进入面试"
                            ? "不进入面试"
                            : payload.decision === "面试未通过"
                              ? "面试未通过"
                              : payload.decision === "面试通过"
                                ? "Offer待发"
                                : "待安排面试",
                        version: Number(application.version ?? 1) + 1,
                        history: [
                          ...(application.history ?? []),
                          {
                            time: "2026-07-16 09:30",
                            action: payload.decision || "进入面试",
                            operator: task.owner,
                            note: payload.note || "由统一工作台进入来源业务处理",
                          },
                        ],
                      }
                    : application,
                ),
              })),
              updatedAt: "2026-07-16 09:30",
            };
          }
          if (task.sourceType === "topic") {
            return {
              ...current,
              topics: current.topics.map((topic) =>
                topic.id === task.sourceId
                  ? {
                      ...topic,
                      status: "待审核",
                      reason: "",
                      version: Number(topic.version ?? 1) + 1,
                      updatedAt: "2026-07-16 09:30",
                    }
                  : topic,
              ),
              updatedAt: "2026-07-16 09:30",
            };
          }
          if (task.sourceType === "project") {
            return {
              ...current,
              projects: current.projects.map((project) => {
                if (project.id !== task.sourceId) return project;
                const pending = project.stages.find((stage) => stage.progress < 100);
                if (!pending) return project;
                const stages = project.stages.map((stage) =>
                  stage.name === pending.name
                    ? {
                        ...stage,
                        progress: Math.min(100, stage.progress + 10),
                        status: stage.progress + 10 >= 100 ? "已完成" : "进行中",
                      }
                    : stage,
                );
                return {
                  ...project,
                  stages,
                  progress: Math.round(
                    stages.reduce((sum, stage) => sum + stage.progress, 0) /
                      stages.length,
                  ),
                };
              }),
              updatedAt: "2026-07-16 09:30",
            };
          }
          return current;
        });
        return ["recruitment", "topic", "project"].includes(task.sourceType);
      },
    }),
    [data],
  );

  return (
    <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const value = useContext(DemoDataContext);
  if (!value) throw new Error("useDemoData must be used inside DemoDataProvider");
  return value;
}

const dailyReports = [
  {
    id: "DAY-0714-01",
    date: "2026-07-14",
    name: "张小北",
    department: "剪辑中心",
    summary: "完成《城市边缘》第 3 集精剪与字幕校对",
    outcomes: 3,
    risk: "有风险",
    ai: "AI辅助字幕整理",
    status: "已提交",
    version: "V1",
    time: "18:05",
  },
  {
    id: "DAY-0714-02",
    date: "2026-07-14",
    name: "林制作",
    department: "制片中心",
    summary: "完成分镜校对与外部供应商排期确认",
    outcomes: 2,
    risk: "无风险",
    ai: "未使用AI",
    status: "草稿",
    version: "V1",
    time: "--",
  },
  {
    id: "DAY-0714-03",
    date: "2026-07-14",
    name: "沈婉瑶",
    department: "剪辑中心",
    summary: "更新剪辑任务并处理两项返修",
    outcomes: 4,
    risk: "有风险",
    ai: "AI辅助镜头检索",
    status: "已退回",
    version: "V2",
    time: "17:42",
  },
];

const weeklyReports = [
  {
    id: "WEEK-029-01",
    cycle: "2026-W29",
    name: "张小北",
    source: "已汇总 5 篇日报",
    risks: 1,
    version: "V1",
    status: "待确认",
    submittedAt: "--",
  },
  {
    id: "WEEK-029-02",
    cycle: "2026-W29",
    name: "沈婉瑶",
    source: "已汇总 5 篇日报",
    risks: 2,
    version: "V2",
    status: "已退回",
    submittedAt: "2026-07-14 17:42",
  },
  {
    id: "WEEK-028-01",
    cycle: "2026-W28",
    name: "江晚",
    source: "已汇总 5 篇日报",
    risks: 0,
    version: "V1",
    status: "已归档",
    submittedAt: "2026-07-11 18:03",
  },
];

const auditLogs = [
  {
    time: "2026-07-14 15:26",
    type: "选题",
    id: "TOPIC-026",
    action: "审核通过",
    operator: "江晚",
    role: "选题审核人",
    from: "待审核",
    to: "已通过待立项",
    version: "V3",
    requestId: "REQ-7F28A1",
    result: "成功",
  },
  {
    time: "2026-07-14 15:08",
    type: "招聘",
    id: "APP-021",
    action: "部门确认面试",
    operator: "江晚",
    role: "部门负责人",
    from: "待部门确认",
    to: "待安排面试",
    version: "V2",
    requestId: "REQ-49BC12",
    result: "成功",
  },
  {
    time: "2026-07-14 14:51",
    type: "项目",
    id: "PRJ-009",
    action: "更新环节进度",
    operator: "沈婉瑶",
    role: "项目负责人",
    from: "剪辑70%",
    to: "剪辑80%",
    version: "V8",
    requestId: "REQ-62D1E0",
    result: "成功",
  },
  {
    time: "2026-07-14 14:20",
    type: "绩效",
    id: "PERF-018",
    action: "重复提交",
    operator: "张小北",
    role: "普通人员",
    from: "V3",
    to: "V3",
    version: "V3",
    requestId: "REQ-8845D2",
    result: "冲突",
  },
];

function formatMoney(value) {
  return `¥${Number(value).toLocaleString("zh-CN")}`;
}

function safeRate(value, base) {
  if (!base) return "—";
  return `${Math.round((value / base) * 1000) / 10}%`;
}

function projectProgress(project) {
  if (project.mode === "外部制作") return project.progress;
  if (!project.stages?.length) return 0;
  return Math.round(
    project.stages.reduce((sum, item) => sum + item.progress, 0) /
      project.stages.length,
  );
}

function statusTone(status = "") {
  if (/退回|逾期|未通过|未提交|冲突|阻塞|失败|不进入/.test(status))
    return "danger";
  if (/完成|通过|已提交|归档|成功|在岗|已转/.test(status)) return "success";
  if (/待|进行|招聘中|已安排|Offer/.test(status)) return "primary";
  if (/暂停|草稿|未开始/.test(status)) return "warning";
  return "neutral";
}

function PlatformHeader({
  eyebrow,
  title,
  description,
  actions,
  meta = "数据更新于 2026-07-14 21:09",
}) {
  const hideSide = eyebrow === "经营驾驶舱";
  return (
    <header
      className={`platform-header ${hideSide ? "platform-header--dashboard" : ""}`}
    >
      <div className="platform-header__copy">
        <span className="platform-header__icon">
          <ChartLineUp size={22} weight="duotone" />
        </span>
        <div>
          <span className="platform-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {hideSide ? null : (
        <div className="platform-header__side">
          <div className="platform-header__meta">
            <small>数据状态</small>
            <strong>{meta}</strong>
          </div>
          {actions}
        </div>
      )}
    </header>
  );
}

function PlatformTabs({ items, value, onChange, ariaLabel = "页面视图" }) {
  return (
    <div className="platform-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          aria-selected={value === item.id}
          className={value === item.id ? "is-active" : ""}
          key={item.id}
          onClick={() => onChange(item.id)}
          role="tab"
          type="button"
        >
          {item.label}
          {item.count !== undefined ? <span>{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

function PlatformBadge({ children, tone }) {
  return (
    <span
      className={`platform-badge platform-badge--${tone ?? statusTone(String(children))}`}
    >
      {children}
    </span>
  );
}

function PlatformMetrics({ items, onSelect }) {
  return (
    <section className="platform-metrics">
      {items.map((item, index) => {
        const content = (
          <>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.unit ? <b>{item.unit}</b> : null}
              <small>{item.meta}</small>
            </div>
            <i aria-hidden="true">
              {item.icon ?? String(index + 1).padStart(2, "0")}
            </i>
          </>
        );
        return onSelect || item.target ? (
          <button
            className={`platform-metric platform-metric--${item.tone ?? "blue"}`}
            key={item.label}
            onClick={() => onSelect?.(item)}
            type="button"
          >
            {content}
          </button>
        ) : (
          <article
            className={`platform-metric platform-metric--${item.tone ?? "blue"}`}
            key={item.label}
          >
            {content}
          </article>
        );
      })}
    </section>
  );
}

function MetricProvenanceDrawer({ metric, onClose, onNavigate }) {
  if (!metric) return null;
  const provenance = metric.provenance ?? {};
  return (
    <PlatformDrawer
      title={metric.label}
      subtitle="指标口径与数据来源"
      onClose={onClose}
      footer={
        metric.target ? (
          <button
            className="primary-btn"
            onClick={() => onNavigate?.(metric.target)}
            type="button"
          >
            进入来源业务
            <ArrowRight size={16} />
          </button>
        ) : null
      }
    >
      <PlatformNotice>
        当前展示值由来源业务数据实时计算；正式环境只需替换数据适配器，指标公式保持不变。
      </PlatformNotice>
      <div className="platform-detail-grid">
        <div>
          <span>当前值</span>
          <strong>{metric.value}{metric.unit ?? ""}</strong>
        </div>
        <div>
          <span>口径版本</span>
          <strong>{provenance.version ?? "演示口径 V1.0"}</strong>
        </div>
        <div>
          <span>纳入记录</span>
          <strong>{provenance.included ?? "按来源记录计算"}</strong>
        </div>
        <div>
          <span>排除记录</span>
          <strong>{provenance.excluded ?? 0}</strong>
        </div>
        <div>
          <span>数据更新时间</span>
          <strong>{provenance.updatedAt ?? "2026-07-16 09:30"}</strong>
        </div>
      </div>
      <section className="platform-detail-section">
        <h3>计算公式</h3>
        <p>{provenance.formula ?? metric.meta}</p>
      </section>
      <section className="platform-detail-section">
        <h3>数据来源</h3>
        <p>{(provenance.sources ?? ["来源业务单据"]).join("、")}</p>
      </section>
    </PlatformDrawer>
  );
}

function PlatformFilter({ children, actions }) {
  return (
    <section className="platform-filter">
      <div className="platform-filter__fields">{children}</div>
      <div className="platform-filter__actions">{actions}</div>
    </section>
  );
}

function PlatformCard({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`platform-card ${className}`.trim()}>
      <header>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function PlatformEmpty({
  title = "暂无符合条件的数据",
  description = "调整筛选条件后重试。",
}) {
  return (
    <div className="platform-empty">
      <MagnifyingGlass size={30} weight="duotone" />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function PlatformDrawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}) {
  return (
    <div
      className="platform-drawer-mask"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        aria-label={title}
        aria-modal="true"
        className={`platform-drawer ${wide ? "is-wide" : ""}`}
        role="dialog"
      >
        <header>
          <div>
            <span>业务详情</span>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button
            aria-label="关闭"
            className="platform-icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>
        <div className="platform-drawer__body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </aside>
    </div>
  );
}

function formatContractSize(size = 0) {
  return `${Math.max(Number(size) / 1024 / 1024, 0.01).toFixed(2)} MB`;
}

function ContractUploadField({ file, error, onChange, onError, onView }) {
  return (
    <div className="platform-form-field is-wide">
      <span>
        上传合同 <b>*</b>
      </span>
      <div className="platform-contract-upload-shell">
        <label className="platform-contract-upload">
          <span className="platform-contract-upload__icon">
            <FileText size={20} weight="duotone" />
          </span>
          <span className="platform-contract-upload__copy">
            <strong>{file?.name ?? "选择外部制作合同"}</strong>
            <small>
              {file
                ? `${formatContractSize(file.size)} · 点击可重新选择`
                : "支持 PDF、DOC、DOCX，单个文件不超过 20 MB"}
            </small>
          </span>
          <span className="platform-contract-upload__action">
            {file ? "更换文件" : "选择文件"}
          </span>
          <input
            accept=".pdf,.doc,.docx"
            aria-label="上传合同"
            className="platform-contract-upload__input"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              const extension = selectedFile?.name.split(".").pop()?.toLowerCase();
              if (selectedFile && !["pdf", "doc", "docx"].includes(extension)) {
                onChange(null);
                onError("合同仅支持 PDF、DOC、DOCX 格式");
                return;
              }
              if (selectedFile && selectedFile.size > 20 * 1024 * 1024) {
                onChange(null);
                onError("合同文件不能超过 20 MB");
                return;
              }
              onChange(selectedFile);
              onError("");
            }}
            type="file"
          />
        </label>
        {file ? (
          <button
            className="ghost-chip platform-contract-upload__view"
            onClick={onView}
            type="button"
          >
            查看合同
          </button>
        ) : null}
      </div>
      {error ? (
        <small className="platform-contract-upload__error" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}

function ContractPreviewDrawer({ contract, context, onClose }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const isPdf =
    contract?.type === "application/pdf" ||
    contract?.name?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    const isPreviewableFile =
      typeof Blob !== "undefined" && contract?.file instanceof Blob;
    if (!isPreviewableFile || typeof URL.createObjectURL !== "function") {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(contract.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [contract?.file]);

  if (!contract) return null;
  return (
    <PlatformDrawer
      wide
      title="制作合同"
      subtitle={`${context} · ${contract.name}`}
      onClose={onClose}
      footer={
        <button className="primary-btn" onClick={onClose} type="button">
          完成查看
        </button>
      }
    >
      <div className="platform-contract-preview__meta">
        <div>
          <span>文件名称</span>
          <strong>{contract.name}</strong>
        </div>
        <div>
          <span>文件大小</span>
          <strong>{formatContractSize(contract.size)}</strong>
        </div>
        <div>
          <span>文件类型</span>
          <strong>{isPdf ? "PDF 合同" : "Word 合同"}</strong>
        </div>
        <div>
          <span>上传时间</span>
          <strong>{contract.uploadedAt ?? "本次立项"}</strong>
        </div>
      </div>
      <PlatformNotice>
        合同查看仅限当前授权数据范围；正式环境需记录查看与下载审计日志。
      </PlatformNotice>
      {isPdf && previewUrl ? (
        <iframe
          className="platform-contract-preview__frame"
          src={previewUrl}
          title={`${contract.name} 内容预览`}
        />
      ) : contract.previewText ? (
        <article className="platform-contract-preview__document">
          <FileText size={30} weight="duotone" />
          <span>合同内容预览</span>
          <h3>{contract.name.replace(/\.[^.]+$/, "")}</h3>
          <p>{contract.previewText}</p>
        </article>
      ) : previewUrl ? (
        <div className="platform-contract-preview__fallback">
          <FileText size={34} weight="duotone" />
          <strong>Word 合同已就绪</strong>
          <p>浏览器无法稳定内嵌 Word 内容，请打开原文件查看完整合同。</p>
          <a className="primary-btn" href={previewUrl} rel="noreferrer" target="_blank">
            打开原文件
          </a>
        </div>
      ) : (
        <PlatformNotice tone="warning">
          当前演示数据仅保留附件信息，原始文件尚未接入文件存储服务。
        </PlatformNotice>
      )}
    </PlatformDrawer>
  );
}

function PlatformNotice({ children, tone = "info" }) {
  return (
    <div className={`platform-notice platform-notice--${tone}`}>
      <Info size={18} weight="fill" />
      <span>{children}</span>
    </div>
  );
}

function ProgressBar({ value, label }) {
  return (
    <div className="platform-progress">
      <div>
        <i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <strong>{label ?? `${value}%`}</strong>
    </div>
  );
}

function DataTable({ columns, children, minWidth = 980 }) {
  return (
    <div className="platform-table-wrap">
      <div className="platform-table" style={{ minWidth }}>
        <div
          className="platform-table__head"
          style={{
            gridTemplateColumns: columns
              .map((item) => item.width ?? "1fr")
              .join(" "),
          }}
        >
          {columns.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

const roleScopeConfig = {
  employee: {
    name: "员工",
    scope: "本人参与的业务与待办",
    actions: "可填报、确认、提交与查看本人记录",
  },
  leader: {
    name: "团队负责人",
    scope: "内容运营中心组织子树",
    actions: "可查看部门任务、部门确认与评分处理",
  },
  hr: {
    name: "HR",
    scope: "公司级人效与招聘授权范围",
    actions: "可复审、管理招聘流程与查看组织数据",
  },
  ceo: {
    name: "CEO",
    scope: "公司级经营数据范围",
    actions: "可查看经营指标、审批与处理关键风险",
  },
};

export function RoleScopeBanner({ activeRole = "employee", page }) {
  const scope = roleScopeConfig[activeRole] ?? roleScopeConfig.employee;
  return (
    <section className="platform-role-scope" aria-label="当前权限范围">
      <div>
        <span>当前角色</span>
        <strong>{scope.name}</strong>
      </div>
      <div>
        <span>数据范围</span>
        <strong>{scope.scope}</strong>
      </div>
      <p>
        {scope.actions} · 当前页面：{page}
      </p>
    </section>
  );
}

const taskOperationConfig = {
  绩效: {
    title: "绩效结果填报",
    prompt: "补充结果说明与证明材料后提交评分流程。",
    field: "结果与证明说明",
    submit: "提交绩效结果",
    roles: ["employee", "leader", "hr", "ceo"],
  },
  招聘: {
    title: "候选人部门确认",
    prompt: "选择是否进入面试；不进入面试时必须填写具体原因。",
    field: "确认意见",
    submit: "提交部门结论",
    roles: ["leader", "hr", "ceo"],
  },
  选题: {
    title: "选题修改与重新提交",
    prompt: "依据退回意见更新方案，提交后自动回写选题版本。",
    field: "修改说明",
    submit: "重新提交选题",
    roles: ["employee", "leader", "hr", "ceo"],
  },
  项目: {
    title: "制作进度更新",
    prompt: "更新环节进度、阻塞原因和预计完成时间。",
    field: "进度与异常说明",
    submit: "提交进度更新",
    roles: ["employee", "leader", "hr", "ceo"],
  },
  周报: {
    title: "周报草稿确认",
    prompt: "补充风险和下周计划后，确认并提交正式周报。",
    field: "补充说明",
    submit: "确认并提交周报",
    roles: ["employee", "leader", "hr", "ceo"],
  },
};

export function BusinessTaskProcessingDrawer({
  activeRole = "employee",
  onClose,
  onComplete,
  task,
}) {
  const [note, setNote] = useState("");
  const isRecruitmentFeedback =
    task.module === "招聘" && /面试反馈/.test(task.title);
  const [decision, setDecision] = useState(
    isRecruitmentFeedback ? "面试通过" : "进入面试",
  );
  const baseConfig = taskOperationConfig[task.module] ?? {
    title: "业务任务处理",
    prompt: task.description,
    field: "处理说明",
    submit: "提交处理结果",
    roles: ["employee", "leader", "hr", "ceo"],
  };
  const config = isRecruitmentFeedback
    ? {
        ...baseConfig,
        title: "候选人面试反馈",
        prompt: "提交面试结论；未通过时必须填写具体原因。",
        field: "面试反馈",
        submit: "提交面试反馈",
      }
    : baseConfig;
  const canOperate = config.roles.includes(activeRole);
  const needsReason =
    task.module === "招聘" && ["不进入面试", "面试未通过"].includes(decision);
  const submit = () => {
    if (!canOperate || (needsReason && !note.trim())) return;
    onComplete(task, { decision, note });
  };
  return (
    <PlatformDrawer
      wide
      title={config.title}
      subtitle={`${task.module} · ${task.businessId} · ${task.title}`}
      onClose={onClose}
      footer={
        <>
          <button className="ghost-chip" onClick={onClose} type="button">
            暂不处理
          </button>
          <button
            className="primary-btn"
            disabled={!canOperate || (needsReason && !note.trim())}
            onClick={submit}
            type="button"
          >
            {config.submit}
          </button>
        </>
      }
    >
      <RoleScopeBanner activeRole={activeRole} page={config.title} />
      <PlatformNotice tone={canOperate ? "info" : "warning"}>
        {canOperate
          ? config.prompt
          : `当前${roleScopeConfig[activeRole]?.name ?? "身份"}无权处理该节点，仅可查看任务详情。`}
      </PlatformNotice>
      <div className="platform-detail-grid">
        <div>
          <span>任务编号</span>
          <strong>{task.id}</strong>
        </div>
        <div>
          <span>任务负责人</span>
          <strong>{task.owner}</strong>
        </div>
        <div>
          <span>基础状态</span>
          <PlatformBadge>{task.status}</PlatformBadge>
        </div>
        <div>
          <span>截止时间</span>
          <strong>{task.due}</strong>
        </div>
      </div>
      {task.module === "招聘" ? (
        <section className="platform-decision-box">
          <label>
            <span>
              {isRecruitmentFeedback ? "面试结论" : "部门结论"} <b>*</b>
            </span>
            <select
              disabled={!canOperate}
              onChange={(event) => setDecision(event.target.value)}
              value={decision}
            >
              {isRecruitmentFeedback ? (
                <>
                  <option>面试通过</option>
                  <option>面试未通过</option>
                </>
              ) : (
                <>
                  <option>进入面试</option>
                  <option>不进入面试</option>
                </>
              )}
            </select>
          </label>
          <label>
            <span>
              {needsReason
                ? isRecruitmentFeedback
                  ? "面试未通过原因"
                  : "不进入面试原因"
                : config.field}
              {needsReason ? <b> *</b> : null}
            </span>
            <textarea
              disabled={!canOperate}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                needsReason
                  ? "必须填写具体原因"
                  : isRecruitmentFeedback
                    ? "填写面试评价与建议"
                    : "填写候选人匹配说明"
              }
              rows={4}
              value={note}
            />
          </label>
        </section>
      ) : (
        <section className="platform-decision-box">
          <label>
            <span>{config.field}</span>
            <textarea
              disabled={!canOperate}
              onChange={(event) => setNote(event.target.value)}
              placeholder="填写本次处理结果、风险或说明"
              rows={5}
              value={note}
            />
          </label>
        </section>
      )}
      <section className="platform-timeline">
        <article>
          <i />
          <div>
            <strong>从统一工作台进入业务处理</strong>
            <span>{task.businessId} · 任务上下文已自动带入</span>
          </div>
        </article>
        <article>
          <i />
          <div>
            <strong>处理完成后自动关闭待办</strong>
            <span>状态、版本和操作记录将同步回工作台</span>
          </div>
        </article>
      </section>
    </PlatformDrawer>
  );
}

export function UnifiedWorkbenchPage({
  goPage,
  activeRole = "ceo",
}) {
  const { candidates, topics, projects, updatedAt } = useDemoData();
  const [tab, setTab] = useState("todo");
  const [selectedTask, setSelectedTask] = useState(null);
  const roleLabel =
    {
      employee: "本人",
      leader: "内容运营中心组织子树",
      hr: "全公司",
      ceo: "全公司",
    }[activeRole] ?? "授权范围";
  const scopedTasks = useMemo(
    () =>
      selectWorkbenchTasks({ candidates, topics, projects })
        .filter((item) => {
          if (activeRole === "employee") return item.owner === "张小北";
          if (activeRole === "leader")
            return ["张小北", "江晚", "林制作", "沈婉瑶"].includes(item.owner);
          if (activeRole === "hr")
            return ["绩效", "招聘", "周报"].includes(item.module);
          return true;
        }),
    [activeRole, candidates, projects, topics],
  );
  const taskCounts = useMemo(
    () => ({
      todo: scopedTasks.filter((item) => item.status !== "已完成").length,
      dueToday: scopedTasks.filter((item) => item.flag === "今日到期").length,
      overdue: scopedTasks.filter((item) => item.flag === "已逾期").length,
      returned: scopedTasks.filter((item) => item.status === "已退回").length,
      done: scopedTasks.filter((item) => item.status === "已完成").length,
    }),
    [scopedTasks],
  );
  const tasks = useMemo(
    () =>
      scopedTasks.filter((item) => {
        if (tab === "overdue") return item.flag === "已逾期";
        if (tab === "returned") return item.status === "已退回";
        if (tab === "done") return item.status === "已完成";
        return item.status !== "已完成";
      }),
    [scopedTasks, tab],
  );

  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="统一工作台"
        title="今天需要你关注的业务"
        description="跨绩效、招聘、选题、项目与周报汇总真实业务待办，工作台本身不允许脱离业务单据完成任务。"
        actions={
          <button
            className="primary-btn"
            onClick={() => setTab("todo")}
            type="button"
          >
            <CalendarCheck size={17} />
            查看今日待办
          </button>
        }
        meta={`当前身份范围：${roleLabel}`}
      />
      <PlatformMetrics
        items={[
          {
            label: "我的待处理",
            value: taskCounts.todo,
            unit: "项",
            meta: `来源业务单据 ${taskCounts.todo} 条`,
            tone: "blue",
          },
          {
            label: "今日到期",
            value: taskCounts.dueToday,
            unit: "项",
            meta: "按业务单据截止时间计算",
            tone: "amber",
          },
          {
            label: "已逾期",
            value: taskCounts.overdue,
            unit: "项",
            meta: "逾期任务自动进入风险清单",
            tone: "red",
          },
          {
            label: "已退回",
            value: taskCounts.returned,
            unit: "项",
            meta: "来源业务退回状态",
            tone: "purple",
          },
          {
            label: "当前已完成",
            value: taskCounts.done,
            unit: "项",
            meta: `数据更新 ${updatedAt}`,
            tone: "green",
          },
        ]}
      />
      <div className="platform-workbench-grid">
        <PlatformCard
          className="platform-workbench-card platform-workbench-card--tasks"
          title="跨业务待办"
          description="基础状态与逾期标记分离展示"
          action={
            <PlatformTabs
              items={[
                { id: "todo", label: "待处理", count: taskCounts.todo },
                { id: "overdue", label: "逾期", count: taskCounts.overdue },
                { id: "returned", label: "退回", count: taskCounts.returned },
                { id: "done", label: "已完成", count: taskCounts.done },
              ]}
              value={tab}
              onChange={setTab}
              ariaLabel="工作台任务筛选"
            />
          }
        >
          <div className="platform-task-list">
            {tasks.map((task) => (
              <article key={task.id}>
                <button
                  className="platform-task-list__main"
                  onClick={() => setSelectedTask(task)}
                  type="button"
                >
                  <span
                    className={`platform-task-priority is-${task.priority === "高" ? "high" : "normal"}`}
                  >
                    <i />
                    {task.priority}优先级
                  </span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {task.module} · {task.businessId}
                    </small>
                  </div>
                  <PlatformBadge>{task.status}</PlatformBadge>
                  <span className={task.flag === "已逾期" ? "is-danger" : ""}>
                    {task.due}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </article>
            ))}
            {!tasks.length ? (
              <PlatformEmpty
                title="当前视图暂无任务"
                description="业务节点完成后，工作台任务会自动同步关闭。"
              />
            ) : null}
          </div>
        </PlatformCard>
        <aside className="platform-workbench-aside">
          <PlatformCard
            className="platform-workbench-card platform-workbench-card--risks"
            title="业务风险提醒"
            description="按影响范围与截止时间排序"
          >
            <div className="platform-alert-list">
              {scopedTasks
                .filter((task) => ["已逾期", "今日到期", "已退回"].includes(task.flag))
                .slice(0, 3)
                .map((task) => (
                  <article key={task.id}>
                    <span className={task.flag === "已逾期" ? "is-red" : "is-amber"}>
                      {task.flag === "已逾期" ? <WarningCircle size={18} /> : <Clock size={18} />}
                    </span>
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.businessId} · {task.description}</p>
                    </div>
                  </article>
                ))}
              {!scopedTasks.length ? (
                <PlatformEmpty title="当前没有业务风险" description="风险提醒随来源业务单据实时更新。" />
              ) : null}
            </div>
          </PlatformCard>
        </aside>
      </div>
      {selectedTask ? (
        <PlatformDrawer
          title={selectedTask.title}
          subtitle={`${selectedTask.module} · ${selectedTask.businessId}`}
          onClose={() => setSelectedTask(null)}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setSelectedTask(null)}
                type="button"
              >
                稍后处理
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  goPage(selectedTask.destination, {
                    task: selectedTask.quickAction === false ? null : selectedTask,
                  });
                  setSelectedTask(null);
                }}
                type="button"
              >
                进入业务详情
                <ArrowRight size={16} />
              </button>
            </>
          }
        >
          <PlatformNotice>
            任务只能在来源业务页面完成。业务操作成功、退回或关闭后，工作台状态将自动同步。
          </PlatformNotice>
          <div className="platform-detail-grid">
            <div>
              <span>当前负责人</span>
              <strong>{selectedTask.owner}</strong>
            </div>
            <div>
              <span>基础状态</span>
              <PlatformBadge>{selectedTask.status}</PlatformBadge>
            </div>
            <div>
              <span>截止时间</span>
              <strong>{selectedTask.due}</strong>
            </div>
            <div>
              <span>异常标记</span>
              <PlatformBadge>{selectedTask.flag}</PlatformBadge>
            </div>
          </div>
          <section className="platform-detail-section">
            <h3>处理说明</h3>
            <p>{selectedTask.description}</p>
          </section>
          <section className="platform-timeline">
            <article>
              <i />
              <div>
                <strong>业务节点生成待办</strong>
                <span>2026-07-14 09:20 · 系统自动创建</span>
              </div>
            </article>
            <article>
              <i />
              <div>
                <strong>负责人已查看</strong>
                <span>2026-07-14 10:06 · {selectedTask.owner}</span>
              </div>
            </article>
          </section>
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

function RecruitmentFunnel({ compact = false, reports = [] }) {
  const recruitmentFunnel = selectRecruitmentFunnel(reports);
  const max = recruitmentFunnel[0].value;
  return (
    <div className={`platform-funnel ${compact ? "is-compact" : ""}`}>
      {recruitmentFunnel.map((item, index) => (
        <button key={item.label} type="button">
          <div style={{ width: `${Math.max(22, (item.value / max) * 100)}%` }}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <small>{index ? `相邻转化 ${item.rate}` : "漏斗起点"}</small>
        </button>
      ))}
    </div>
  );
}

function RecruitmentStatistics({ reports = [] }) {
  const recruitmentFunnel = selectRecruitmentFunnel(reports);
  const total = recruitmentFunnel[0].value;
  const hires = recruitmentFunnel.at(-1).value;
  const overallRate = total ? `${((hires / total) * 100).toFixed(1)}%` : "—";
  const chartData = recruitmentFunnel.map((item) => ({
    stage: item.label,
    count: item.value,
    rate: Number.parseFloat(item.rate),
  }));

  return (
    <section
      className="platform-recruitment-statistics"
      aria-label="招聘转化数据统计"
    >
      <div className="platform-recruitment-statistics__summary">
        <div>
          <span>触达总人数</span>
          <strong>{total}</strong>
          <small>人</small>
        </div>
        <div>
          <span>整体入职转化率</span>
          <strong>{overallRate}</strong>
        </div>
        <div>
          <span>最终入职人数</span>
          <strong>{hires}</strong>
          <small>人</small>
        </div>
      </div>

      <div className="platform-recruitment-statistics__legend" aria-hidden="true">
        <span className="is-count">环节人数</span>
        <span className="is-rate">相邻转化率</span>
      </div>

      <div className="platform-recruitment-statistics__chart-scroll">
        <div
          className="platform-recruitment-statistics__chart"
          role="img"
          aria-label="招聘转化柱状图和折线图"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 20, right: 8, bottom: 4, left: -12 }}
            >
              <CartesianGrid stroke="#e9edf5" strokeDasharray="3 4" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="stage"
                interval={0}
                tick={{ fill: "#68768a", fontSize: 10 }}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                domain={[0, 300]}
                tick={{ fill: "#8a97aa", fontSize: 9 }}
                tickLine={false}
                width={38}
                yAxisId="count"
              />
              <YAxis
                axisLine={false}
                domain={[0, 100]}
                orientation="right"
                tick={{ fill: "#8a97aa", fontSize: 9 }}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                width={42}
                yAxisId="rate"
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #dfe6f2",
                  borderRadius: 10,
                  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.1)",
                  fontSize: 11,
                }}
                formatter={(value, name) => [
                  name === "count" ? `${value} 人` : `${value}%`,
                  name === "count" ? "环节人数" : "相邻转化率",
                ]}
                labelStyle={{ color: "#172033", fontWeight: 700 }}
              />
              <Bar
                dataKey="count"
                fill="#6870df"
                maxBarSize={38}
                radius={[7, 7, 2, 2]}
                yAxisId="count"
              >
                <LabelList
                  dataKey="count"
                  fill="#43506a"
                  fontSize={9}
                  fontWeight={700}
                  position="top"
                />
              </Bar>
              <Line
                activeDot={{ r: 5, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                dataKey="rate"
                dot={{ r: 3, fill: "#fff", stroke: "#f59e0b", strokeWidth: 2 }}
                stroke="#f59e0b"
                strokeWidth={2.5}
                type="monotone"
                yAxisId="rate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function RecruitmentDecisionAnalysis({ candidates = [] }) {
  const analysis = selectRecruitmentDecisionAnalysis(candidates);
  return (
    <div className="recruitment-decision-analysis">
      <div className="recruitment-reason-grid">
        {Object.entries(rejectionStageMeta).map(([stage, meta]) => {
          const stageAnalysis = analysis.reasons[stage];
          return (
            <section className="recruitment-reason-card" key={stage}>
              <header>
                <div>
                  <span>流失节点</span>
                  <h4>{meta.title}</h4>
                </div>
                <strong>{stageAnalysis.total}</strong>
              </header>
              {stageAnalysis.categories.length ? (
                <div className="recruitment-reason-list">
                  {stageAnalysis.categories.map((item) => (
                    <div key={item.category}>
                      <p>
                        <span>{item.category}</span>
                        <b>{item.count} 人 · {item.rate}%</b>
                      </p>
                      <i><em style={{ width: `${item.rate}%` }} /></i>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="recruitment-reason-empty">{meta.empty}</p>
              )}
            </section>
          );
        })}
      </div>
      <section className="recruitment-interviewer-analysis">
        <div className="platform-section-heading">
          <div>
            <h3>面试官数据</h3>
            <p>按每轮实际绑定人员汇总面试分配、完成结果与通过率。</p>
          </div>
          <PlatformBadge tone="primary">
            {analysis.interviewers.length} 位面试官
          </PlatformBadge>
        </div>
        <DataTable
          columns={[
            { label: "面试官", width: "1.2fr" },
            { label: "参与轮次", width: "1.2fr" },
            { label: "已分配", width: "90px" },
            { label: "已完成", width: "90px" },
            { label: "通过", width: "80px" },
            { label: "未通过", width: "80px" },
            { label: "通过率", width: "120px" },
          ]}
          minWidth={760}
        >
          {analysis.interviewers.map((row) => (
            <div
              className="platform-table__row"
              key={row.interviewer}
              style={{
                gridTemplateColumns: "1.2fr 1.2fr 90px 90px 80px 80px 120px",
              }}
            >
              <strong>{row.interviewer}</strong>
              <span>{row.rounds.map((round) => `第${round}轮`).join("、")}</span>
              <span>{row.assigned}</span>
              <span>{row.completed}</span>
              <strong>{row.passed}</strong>
              <span>{row.failed}</span>
              <ProgressBar
                label={row.passRate === null ? "暂无结果" : `${row.passRate}%`}
                value={row.passRate ?? 0}
              />
            </div>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

function ContentProjectOverview({ goPage }) {
  const { projects, operationUploads } = useDemoData();
  const [mode, setMode] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  const selectedUploads = operationUploads.filter(
    (upload) => upload.projectId === selectedProjectId,
  );
  const internalProjects = projects.filter(
    (project) => project.mode === "内部制作",
  );
  const externalProjects = projects.filter(
    (project) => project.mode === "外部制作",
  );
  const productionProjects = projects.filter(
    (project) => project.status === "进行中",
  );
  const completedProjects = projects.filter(
    (project) => project.status === "已完成",
  );
  const projectCostSummary = selectProjectSummary(projects);
  const internalCostSummary = selectProjectSummary(internalProjects);
  const totalBudget = projects.reduce(
    (total, project) => total + project.budget,
    0,
  );
  const totalActual = projectCostSummary.totalActual;
  const projectsWithOperations = new Set(
    operationUploads.map((upload) => upload.projectId),
  ).size;
  const visibleProjects = projects.filter((project) => {
    const matchesMode =
      mode === "all" ||
      project.mode === (mode === "internal" ? "内部制作" : "外部制作");
    const matchesStatus = status === "all" || project.status === status;
    return matchesMode && matchesStatus;
  });
  const modeSummaries = [
    {
      id: "internal",
      label: "内部制作",
      projects: internalProjects,
      detail: "按各中心并行制作环节统计进度",
    },
    {
      id: "external",
      label: "外部制作",
      projects: externalProjects,
      detail: "按供应商整体里程碑统计进度",
    },
  ];

  return (
    <>
      <PlatformMetrics
        items={[
          {
            label: "项目总数",
            value: projects.length,
            unit: "个",
            meta: `制作中 ${productionProjects.length} · 待启动 ${projects.filter((project) => project.status === "未开始").length}`,
            tone: "blue",
          },
          {
            label: "制作中",
            value: productionProjects.length,
            unit: "个",
            meta: "1 个项目存在延期标记",
            tone: "purple",
          },
          {
            label: "已完成",
            value: completedProjects.length,
            unit: "个",
            meta: `项目完成率 ${projects.length ? Math.round((completedProjects.length / projects.length) * 100) : 0}%`,
            tone: "green",
          },
          {
            label: "内部 / 外部制作",
            value: `${internalProjects.length} / ${externalProjects.length}`,
            meta: "制作方式独立标识",
            tone: "cyan",
          },
          {
            label: "项目真实成本",
            value: `${(totalActual / 10000).toFixed(1)}万`,
            meta: `总预算 ${(totalBudget / 10000).toFixed(1)} 万`,
            tone: "amber",
          },
          {
            label: "运营数据归属率",
            value: "100%",
            meta: `${operationUploads.length} / ${operationUploads.length} 条已关联项目`,
            tone: "blue",
          },
        ]}
      />

      <div className="platform-project-summary-grid">
        <PlatformCard
          title="项目状态与周期"
          description="基础状态与延期等异常标记分别统计"
        >
          <div className="platform-project-status-list">
            {[
              {
                label: "制作中",
                value: productionProjects.length,
                meta: "最近截止 08-05",
                tone: "primary",
              },
              {
                label: "待启动",
                value: projects.filter(
                  (project) => project.status === "未开始",
                ).length,
                meta: "最近开始 07-28",
                tone: "warning",
              },
              {
                label: "已完成",
                value: completedProjects.length,
                meta: "最近完成 06-30",
                tone: "success",
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() =>
                  setStatus(
                    item.label === "制作中"
                      ? "进行中"
                      : item.label === "待启动"
                        ? "未开始"
                        : "已完成",
                  )
                }
                type="button"
              >
                <span className={`is-${item.tone}`} />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.meta}</small>
                </div>
                <b>{item.value}</b>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </PlatformCard>

        <PlatformCard
          title="制作方式与成本"
          description="内部、外部制作分别汇总预算和执行成本"
        >
          <div className="platform-project-mode-list">
            {modeSummaries.map((item) => {
              const budget = item.projects.reduce(
                (total, project) => total + project.budget,
                0,
              );
              const actual = item.projects.reduce(
                (total, project) => total + project.actual,
                0,
              );
              const rate = budget ? Math.round((actual / budget) * 100) : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  type="button"
                >
                  <div className="platform-project-mode-list__heading">
                    <span className={`is-${item.id}`}>
                      {item.id === "internal" ? (
                        <Buildings size={18} weight="duotone" />
                      ) : (
                        <Briefcase size={18} weight="duotone" />
                      )}
                    </span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </div>
                    <b>{item.projects.length} 个</b>
                  </div>
                  <ProgressBar value={rate} label={`${rate}%`} />
                  <div className="platform-project-mode-list__cost">
                    <span>已发生 {formatMoney(actual)}</span>
                    <span>预算 {formatMoney(budget)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </PlatformCard>

        <PlatformCard
          title="运营数据归属"
          description="运营上传时以项目编码写入对应项目"
          action={<PlatformBadge tone="success">归属完整</PlatformBadge>}
        >
          <div className="platform-operation-overview">
            <div className="platform-operation-overview__score">
              <div className="platform-donut is-green" style={{ "--value": "100%" }}>
                <b>100%</b>
              </div>
              <div>
                <strong>{operationUploads.length} 条数据已归属</strong>
                <span>覆盖 {projectsWithOperations} / {projects.length} 个项目</span>
              </div>
            </div>
            <div className="platform-operation-overview__types">
              <span>投流 / 渠道日报 <b>2</b></span>
              <span>素材 / 受众洞察 <b>2</b></span>
              <span>复盘 / 用户反馈 <b>2</b></span>
            </div>
            <small>《无声档案》尚未启动，暂无运营上传数据。</small>
          </div>
        </PlatformCard>
      </div>

      <PlatformCard
        className="platform-project-cost-overview"
        title="内部短剧真实成本构成"
        description="项目真实成本由项目制作页录入，并按人力、算力、投流三类实时汇总"
        action={
          <div className="platform-project-cost-overview__total">
            <span>内部短剧合计</span>
            <strong>{formatMoney(internalCostSummary.internalActual)}</strong>
          </div>
        }
      >
        <div className="platform-project-cost-overview__grid">
          {[
            {
              label: "人力成本",
              value: internalCostSummary.manpowerCost,
              note: "编剧、制作、剪辑等人员投入",
              tone: "blue",
            },
            {
              label: "算力成本",
              value: internalCostSummary.computeCost,
              note: "模型生成、渲染与云端算力",
              tone: "purple",
            },
            {
              label: "投流成本",
              value: internalCostSummary.trafficCost,
              note: "渠道投放与流量测试消耗",
              tone: "cyan",
            },
          ].map((item) => {
            const rate = internalCostSummary.internalActual
              ? Math.round((item.value / internalCostSummary.internalActual) * 100)
              : 0;
            return (
              <article className={`is-${item.tone}`} key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <b>{rate}%</b>
                </div>
                <strong>{formatMoney(item.value)}</strong>
                <ProgressBar value={rate} />
                <small>{item.note}</small>
              </article>
            );
          })}
        </div>
      </PlatformCard>

      <PlatformCard
        title="项目总览台账"
        description="按项目查看状态、参与中心、周期、成本及运营数据归属"
        action={
          <PlatformBadge tone="primary">当前 {visibleProjects.length} 个项目</PlatformBadge>
        }
      >
        <div className="platform-project-ledger-toolbar">
          <PlatformTabs
            items={[
              { id: "all", label: "全部项目", count: projects.length },
              {
                id: "internal",
                label: "内部制作",
                count: internalProjects.length,
              },
              {
                id: "external",
                label: "外部制作",
                count: externalProjects.length,
              },
            ]}
            value={mode}
            onChange={setMode}
            ariaLabel="项目制作方式"
          />
          <label>
            <span>项目状态</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="进行中">制作中</option>
              <option value="未开始">待启动</option>
              <option value="已完成">已完成</option>
            </select>
          </label>
        </div>
        <DataTable
          columns={[
            { label: "项目", width: "1.2fr" },
            { label: "状态 / 制作方式", width: "130px" },
            { label: "参与中心", width: "1.25fr" },
            { label: "开始时间 / 截止时间", width: "180px" },
            { label: "整体进度", width: "150px" },
            { label: "实际成本 / 预算", width: "145px" },
            { label: "运营上传数据", width: "145px" },
            { label: "操作", width: "76px" },
          ]}
          minWidth={1160}
        >
          {visibleProjects.map((project) => {
            const uploads = operationUploads.filter(
              (upload) => upload.projectId === project.id,
            );
            const latestUpload = uploads[0];
            return (
              <div
                className="platform-table__row platform-project-ledger-row"
                style={{
                  gridTemplateColumns:
                    "1.2fr 130px 1.25fr 180px 150px 145px 145px 76px",
                }}
                key={project.id}
              >
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.id} · 负责人 {project.owner}</small>
                </div>
                <div className="platform-badge-row">
                  <PlatformBadge>{project.status}</PlatformBadge>
                  <PlatformBadge tone={project.mode === "内部制作" ? "primary" : "neutral"}>
                    {project.mode}
                  </PlatformBadge>
                </div>
                <div>
                  <strong>{project.centers.join(" · ")}</strong>
                  <small>{project.centers.length} 个中心协同</small>
                </div>
                <div className="platform-project-period">
                  <span><i>始</i>{project.start}</span>
                  <span><i>止</i>{project.due}</span>
                </div>
                <ProgressBar value={projectProgress(project)} />
                <div>
                  <strong>{formatMoney(project.actual)}</strong>
                  <small>预算 {formatMoney(project.budget)}</small>
                </div>
                <button
                  className={`platform-operation-link ${uploads.length ? "is-linked" : ""}`}
                  onClick={() => setSelectedProjectId(project.id)}
                  type="button"
                >
                  <strong>{uploads.length ? `已归属 ${uploads.length} 条` : "待运营上传"}</strong>
                  <small>{latestUpload ? `${latestUpload.type} · ${latestUpload.cycle}` : "暂无数据"}</small>
                </button>
                <button
                  className="table-link"
                  onClick={() => setSelectedProjectId(project.id)}
                  type="button"
                >
                  查看
                </button>
              </div>
            );
          })}
        </DataTable>
        {!visibleProjects.length ? <PlatformEmpty /> : null}
      </PlatformCard>

      {selectedProject ? (
        <PlatformDrawer
          wide
          title={selectedProject.name}
          subtitle={`${selectedProject.id} · ${selectedProject.mode} · 运营数据按项目编码归属`}
          onClose={() => setSelectedProjectId(null)}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setSelectedProjectId(null)}
                type="button"
              >
                关闭
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setSelectedProjectId(null);
                  goPage("projects");
                }}
                type="button"
              >
                进入项目制作
              </button>
            </>
          }
        >
          <div className="platform-detail-grid">
            <div>
              <span>项目状态</span>
              <strong>{selectedProject.status}</strong>
            </div>
            <div>
              <span>制作方式</span>
              <strong>{selectedProject.mode}</strong>
            </div>
            <div>
              <span>开始时间</span>
              <strong>{selectedProject.start}</strong>
            </div>
            <div>
              <span>截止时间</span>
              <strong>{selectedProject.due}</strong>
            </div>
            <div>
              <span>参与中心</span>
              <strong>{selectedProject.centers.join("、")}</strong>
            </div>
            <div>
              <span>实际成本 / 预算</span>
              <strong>{formatMoney(selectProjectCostBreakdown(selectedProject).total)} / {formatMoney(selectedProject.budget)}</strong>
            </div>
          </div>
          {selectedProject.mode === "内部制作" ? (
            <section className="platform-detail-section">
              <div className="platform-section-heading">
                <div>
                  <h3>真实成本构成</h3>
                  <p>数据来自项目制作页的内部短剧成本录入。</p>
                </div>
                <strong>{formatMoney(selectProjectCostBreakdown(selectedProject).total)}</strong>
              </div>
              <div className="platform-cost-breakdown-list">
                {[
                  ["人力成本", selectProjectCostBreakdown(selectedProject).manpowerCost],
                  ["算力成本", selectProjectCostBreakdown(selectedProject).computeCost],
                  ["投流成本", selectProjectCostBreakdown(selectedProject).trafficCost],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{formatMoney(value)}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <section className="platform-detail-section">
            <div className="platform-section-heading">
              <div>
                <h3>运营上传数据</h3>
                <p>每条记录均以 projectId = {selectedProject.id} 定位到当前项目</p>
              </div>
              <PlatformBadge tone={selectedUploads.length ? "success" : "warning"}>
                {selectedUploads.length ? `已归属 ${selectedUploads.length} 条` : "暂无数据"}
              </PlatformBadge>
            </div>
            {selectedUploads.length ? (
              <div className="platform-operation-upload-list">
                {selectedUploads.map((upload) => (
                  <article key={upload.id}>
                    <span>
                      <FileText size={18} weight="duotone" />
                    </span>
                    <div>
                      <strong>{upload.type} · {upload.channel}</strong>
                      <p>{upload.summary}</p>
                      <small>{upload.cycle} · {upload.uploader} 上传于 {upload.uploadedAt}</small>
                    </div>
                    <code>{upload.id}</code>
                  </article>
                ))}
              </div>
            ) : (
              <PlatformEmpty
                title="该项目暂无运营上传数据"
                description="项目启动后，运营数据将按项目编码自动归属到这里。"
              />
            )}
          </section>
        </PlatformDrawer>
      ) : null}
    </>
  );
}

function DashboardDomainView({ view, goPage }) {
  const {
    jobs,
    candidates,
    recruitmentDailyReports,
    updatedAt,
  } = useDemoData();
  if (view === "content") return <ContentProjectOverview goPage={goPage} />;
  const sscEmployment = summarizeSscEmployment(readSscPersonnel());
  const recruitmentSummary = selectRecruitmentSummary({
    jobs,
    candidates,
    reports: recruitmentDailyReports,
  });

  const configurations = {
    recruitment: {
      title: "招聘经营分析",
      description: "正式统计仅纳入已提交且截图完整的招聘日报。",
      metrics: [
        {
          label: "本月正式入职",
          value: recruitmentSummary.officialHires,
          unit: "人",
          meta: "候选人到岗状态与 SSC 人员编号关联",
          tone: "blue",
        },
        {
          label: "SSC 到岗状态",
          value: `${sscEmployment.实习期} / ${sscEmployment.已转正} / ${sscEmployment.已离职}`,
          meta: "实习期 / 已转正 / 已离职",
          tone: "green",
        },
        {
          label: "待部门确认",
          value: recruitmentSummary.pendingDepartment,
          unit: "人",
          meta: "来自候选人岗位应聘记录",
          tone: "amber",
        },
        {
          label: "日报流程差异",
          value: recruitmentSummary.reportDifferences,
          unit: "项",
          meta: `纳入 ${recruitmentSummary.includedReports.length} 条，排除 ${recruitmentSummary.excludedReports.length} 条`,
          tone: "red",
        },
      ],
    },
  };
  const config = configurations[view];
  const recruitmentJobRows = jobs.map((job) => ({
    ...job,
    gap: Math.max(0, job.need - job.onboarded),
    completionRate: job.need
      ? Math.round((job.onboarded / job.need) * 100)
      : 0,
  }));
  const recruitmentPeopleRows = [
    ...new Set([
      ...jobs.map((job) => job.recruiter),
      ...recruitmentDailyReports.map((row) => row.recruiter),
    ]),
  ].map((recruiter) => {
    const recruiterJobs = jobs.filter((job) => job.recruiter === recruiter);
    const dailyRows = recruitmentDailyReports.filter(
      (row) => row.recruiter === recruiter,
    );
    const includedDailyRows = selectIncludedRecruitmentReports(dailyRows);
    const totals = includedDailyRows.reduce(
      (result, row) => ({
        hello: result.hello + row.hello,
        valid: result.valid + row.valid,
        interview: result.interview + row.interview,
        accepted: result.accepted + row.accepted,
        onboarded: result.onboarded + row.onboarded,
      }),
      { hello: 0, valid: 0, interview: 0, accepted: 0, onboarded: 0 },
    );
    return {
      recruiter,
      jobCount: recruiterJobs.length,
      ...totals,
      validRate: totals.hello
        ? `${((totals.valid / totals.hello) * 100).toFixed(1)}%`
        : "—",
    };
  });
  return (
    <>
      <PlatformMetrics items={config.metrics} />
      <div className="platform-dashboard-grid platform-dashboard-grid--single">
        <PlatformCard title={config.title} description={config.description}>
          <RecruitmentStatistics reports={recruitmentDailyReports} />
        </PlatformCard>
      </div>
      <div className="platform-dashboard-grid platform-dashboard-grid--single">
        <PlatformCard
          title="招聘流失与面试质量分析"
          description="基于候选人应聘记录中的结构化结论，分析各节点流失原因及面试官结果。"
        >
          <RecruitmentDecisionAnalysis candidates={candidates} />
        </PlatformCard>
      </div>
      <div className="platform-recruitment-breakdowns">
          <PlatformCard
            title="岗位招聘情况"
            description="逐岗位查看招聘需求、人才储备与入职达成情况"
            action={
              <PlatformBadge tone="primary">
                {recruitmentJobRows.length} 个岗位
              </PlatformBadge>
            }
          >
            <DataTable
              columns={[
                { label: "招聘岗位", width: "1.2fr" },
                { label: "部门 / 城市", width: "1.2fr" },
                { label: "招聘负责人", width: "100px" },
                { label: "需求 / 已入职", width: "110px" },
                { label: "招聘缺口", width: "80px" },
                { label: "候选人", width: "80px" },
                { label: "达成率", width: "150px" },
                { label: "招聘周期", width: "90px" },
                { label: "状态", width: "90px" },
              ]}
              minWidth={1050}
            >
              {recruitmentJobRows.map((job) => (
                <div
                  className="platform-table__row"
                  style={{
                    gridTemplateColumns:
                      "1.2fr 1.2fr 100px 110px 80px 80px 150px 90px 90px",
                  }}
                  key={job.id}
                >
                  <div>
                    <strong>{job.name}</strong>
                    <small>{job.id}</small>
                  </div>
                  <div>
                    <span>{job.department}</span>
                    <small>{job.city}</small>
                  </div>
                  <span>{job.recruiter}</span>
                  <strong>
                    {job.need} / {job.onboarded}
                  </strong>
                  <strong className={job.gap > 0 ? "is-risk-number" : ""}>
                    {job.gap}
                  </strong>
                  <span>{job.candidates}</span>
                  <ProgressBar
                    label={`${job.completionRate}%`}
                    value={job.completionRate}
                  />
                  <span>{job.cycle}</span>
                  <PlatformBadge>{job.status}</PlatformBadge>
                </div>
              ))}
            </DataTable>
          </PlatformCard>

          <PlatformCard
            title="招聘人员数据"
            description="按招聘人员汇总负责岗位、招聘工作量与关键转化结果"
            action={
              <PlatformBadge tone="primary">
                {recruitmentPeopleRows.length} 位招聘人员
              </PlatformBadge>
            }
          >
            <div className="platform-recruiter-table">
              <DataTable
                columns={[
                  { label: "招聘人员" },
                  { label: "负责岗位" },
                  { label: "触达人数" },
                  { label: "有效简历" },
                  { label: "面试" },
                  { label: "Offer 接受" },
                  { label: "入职" },
                  { label: "有效简历率" },
                ]}
                minWidth={0}
              >
                {recruitmentPeopleRows.map((row) => (
                  <div
                    className="platform-table__row platform-recruiter-table__row"
                    style={{
                      gridTemplateColumns:
                        "repeat(8, minmax(0, 1fr))",
                    }}
                    key={row.recruiter}
                  >
                    <strong>{row.recruiter}</strong>
                    <span>{row.jobCount}</span>
                    <span>{row.hello}</span>
                    <span>{row.valid}</span>
                    <span>{row.interview}</span>
                    <span>{row.accepted}</span>
                    <strong>{row.onboarded}</strong>
                    <span>{row.validRate}</span>
                  </div>
                ))}
              </DataTable>
            </div>
          </PlatformCard>
      </div>
    </>
  );
}

export function BusinessDashboardPage({ goPage, activeRole, reviews = [] }) {
  const {
    jobs,
    candidates,
    recruitmentDailyReports,
    topics,
    projects,
    updatedAt,
  } = useDemoData();
  const [view, setView] = useState("overview");
  const [selectedMetric, setSelectedMetric] = useState(null);
  const recruitmentSummary = selectRecruitmentSummary({
    jobs,
    candidates,
    reports: recruitmentDailyReports,
  });
  const topicSummary = selectTopicSummary(topics);
  const projectSummary = selectProjectSummary(projects);
  const stageProgress = [
    { label: "剧本", source: "剧本" },
    { label: "制作", source: "视频" },
    { label: "剪辑", source: "剪辑" },
    { label: "成片", source: "配音" },
  ].map(({ label, source }) => {
    const stages = projects
      .flatMap((project) => project.stages ?? [])
      .filter((stage) => stage.name === source);
    return {
      label,
      value: stages.length
        ? Math.round(stages.reduce((sum, stage) => sum + Number(stage.progress ?? 0), 0) / stages.length)
        : 0,
    };
  });
  const completedReviews = reviews.filter((review) =>
    ["已生效", "已归档", "已完成"].some((status) =>
      String(review.status).includes(status),
    ),
  );
  const performanceScores = completedReviews
    .map((review) =>
      Number(review.resultVersions?.at(-1)?.score ?? review.finalScore),
    )
    .filter(Number.isFinite);
  const performanceRate = reviews.length
    ? `${((completedReviews.length / reviews.length) * 100).toFixed(1)}%`
    : "0%";
  const averagePerformance = performanceScores.length
    ? (performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length).toFixed(1)
    : "--";
  const metrics = [
    createMetricDefinition({
      label: "绩效完成率",
      value: performanceRate,
      meta: `已完成 ${completedReviews.length} / ${reviews.length} 人`,
      tone: "blue",
      target: "performance",
      formula: "已生效、已归档或已完成的绩效单数 ÷ 当前权限范围内绩效单总数",
      sources: ["绩效考核单", "绩效流程状态"],
      included: completedReviews.length,
      excluded: Math.max(0, reviews.length - completedReviews.length),
      updatedAt,
    }),
    createMetricDefinition({
      label: "平均绩效得分",
      value: averagePerformance,
      meta: `${performanceScores.length} 份已生效结果`,
      tone: "purple",
      target: "performance",
      formula: "已生效绩效结果得分合计 ÷ 已生效结果数",
      sources: ["绩效结果版本"],
      included: performanceScores.length,
      updatedAt,
    }),
    createMetricDefinition({
      label: "本月正式入职",
      value: recruitmentSummary.officialHires,
      unit: "人",
      meta: "候选人到岗状态与 SSC 人员编号关联",
      tone: "green",
      target: "recruitment",
      formula: "候选人应聘记录中状态为实习期或已转正，且已完成 SSC 到岗关联的人数",
      sources: ["候选人应聘记录", "SSC 人员花名册"],
      included: recruitmentSummary.officialHires,
      updatedAt,
    }),
    createMetricDefinition({
      label: "选题转项目",
      value: topicSummary.converted,
      unit: "个",
      meta: `转化率 ${topicSummary.conversionRate}%`,
      tone: "cyan",
      target: "topics",
      formula: "已生成唯一项目编号的选题数 ÷ 审核通过选题数",
      sources: ["选题库", "项目台账"],
      included: topicSummary.converted,
      updatedAt,
    }),
    createMetricDefinition({
      label: "进行中项目",
      value: projectSummary.running,
      unit: "个",
      meta: `内部 ${projectSummary.internal} · 外部 ${projectSummary.external}`,
      tone: "blue",
      target: "projects",
      formula: "项目台账中状态为进行中的项目数",
      sources: ["项目台账", "项目环节进度"],
      included: projectSummary.running,
      updatedAt,
    }),
    createMetricDefinition({
      label: "内部短剧真实成本",
      value: `${(projectSummary.internalActual / 10000).toFixed(1)}万`,
      meta: `人力 ${(projectSummary.manpowerCost / 10000).toFixed(1)}万 · 算力 ${(projectSummary.computeCost / 10000).toFixed(1)}万 · 投流 ${(projectSummary.trafficCost / 10000).toFixed(1)}万`,
      tone: "amber",
      target: "projects",
      formula: "内部短剧人力成本 + 算力成本 + 投流成本",
      sources: ["项目制作台账", "内部短剧成本录入"],
      included: projectSummary.internal,
      updatedAt,
    }),
    createMetricDefinition({
      label: "延期项目",
      value: projectSummary.delayed,
      unit: "个",
      meta: `${projectSummary.delayed} 个待负责人处理`,
      tone: "red",
      target: "projects",
      formula: "项目风险标签中含延期标记的去重项目数",
      sources: ["项目台账风险标记"],
      included: projectSummary.delayed,
      updatedAt,
    }),
  ];
  if (activeRole === "employee") {
    return (
      <div className="platform-page">
        <PersonnelDashboard activeRole={activeRole} />
      </div>
    );
  }
  if (view === "performance")
    return (
      <div className="platform-page">
        <PersonnelDashboard
          activeRole={activeRole}
          toolbar={
            <PlatformTabs
              items={[
                { id: "overview", label: "经营总览" },
                { id: "performance", label: "人员绩效" },
                { id: "recruitment", label: "招聘分析" },
                { id: "content", label: "内容项目" },
              ]}
              value={view}
              onChange={setView}
              ariaLabel="驾驶舱分析维度"
            />
          }
        />
      </div>
    );
  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="经营驾驶舱"
        title="跨业务经营总览"
        description="统一查看绩效、招聘、选题和项目，并按当前角色的数据范围钻取业务明细。"
        actions={
          <>
            <button className="ghost-chip" type="button">
              <Info size={16} />
              指标口径
            </button>
            <button className="primary-btn" type="button">
              按权限导出
            </button>
          </>
        }
      />
      <PlatformTabs
        items={[
          { id: "overview", label: "经营总览" },
          { id: "performance", label: "人员绩效" },
          { id: "recruitment", label: "招聘分析" },
          { id: "content", label: "内容项目" },
        ]}
        value={view}
        onChange={setView}
        ariaLabel="驾驶舱分析维度"
      />
      <PlatformFilter
        actions={
          <>
            <button className="ghost-chip" type="button">
              重置
            </button>
            <button className="primary-btn" type="button">
              查询
            </button>
          </>
        }
      >
        <label>
          <span>统计时间</span>
          <select defaultValue="2026-07">
            <option>2026-07</option>
            <option>2026-06</option>
          </select>
        </label>
        <label>
          <span>部门</span>
          <select defaultValue="all">
            <option value="all">全部部门</option>
            <option>剪辑中心</option>
            <option>制片中心</option>
          </select>
        </label>
        <label>
          <span>人员 / 岗位</span>
          <input placeholder="输入人员或岗位" />
        </label>
        <label>
          <span>项目 / 状态</span>
          <select defaultValue="all">
            <option value="all">全部项目与状态</option>
            <option>存在异常</option>
          </select>
        </label>
        <label>
          <span>招聘平台</span>
          <select defaultValue="all">
            <option value="all">全部平台</option>
            <option>BOSS直聘</option>
            <option>猎聘</option>
          </select>
        </label>
      </PlatformFilter>
      {view === "overview" ? (
        <>
          <PlatformMetrics
            items={metrics}
            onSelect={setSelectedMetric}
          />
          <div className="platform-dashboard-grid platform-dashboard-grid--overview">
            <PlatformCard
              title="招聘转化数据统计"
              description="柱状图展示环节人数 · 折线图展示相邻转化率"
              action={
                <button
                  className="table-link"
                  onClick={() => goPage("recruitment")}
                  type="button"
                >
                  查看招聘明细
                </button>
              }
            >
              <RecruitmentStatistics reports={recruitmentDailyReports} />
            </PlatformCard>
            <PlatformCard
              title="内容与项目健康度"
              description="内部制作环节并行统计"
              className="platform-card--overview-health"
            >
              <div className="platform-health-grid">
                <article>
                  <div>
                    <span>选题状态</span>
                    <strong>{topicSummary.total}</strong>
                  </div>
                  <div className="platform-donut" style={{ "--value": `${topicSummary.conversionRate}%` }}>
                    <b>{topicSummary.conversionRate}%</b>
                  </div>
                  <small>已转项目 / 审核通过</small>
                </article>
                <article>
                  <div>
                    <span>项目完成率</span>
                    <strong>{projectSummary.averageProgress}%</strong>
                  </div>
                  <div
                    className="platform-donut is-green"
                    style={{ "--value": `${projectSummary.averageProgress}%` }}
                  >
                    <b>{projectSummary.averageProgress}%</b>
                  </div>
                  <small>已完成 / 全部启动项目</small>
                </article>
              </div>
              <div className="platform-horizontal-bars is-compact">
                {stageProgress.map((item) => (
                  <article key={item.label}>
                    <span>{item.label}</span>
                    <ProgressBar value={item.value} />
                    <b>{item.value}%</b>
                  </article>
                ))}
              </div>
            </PlatformCard>
          </div>
          <PlatformCard
            title="经营风险清单"
            description="指标卡和风险行均可继承筛选条件钻取"
          >
            <DataTable
              columns={[
                { label: "业务模块", width: "110px" },
                { label: "风险对象", width: "1.1fr" },
                { label: "异常说明", width: "1.6fr" },
                { label: "负责人", width: "110px" },
                { label: "发现时间", width: "150px" },
                { label: "状态", width: "110px" },
                { label: "操作", width: "72px" },
              ]}
              minWidth={960}
            >
              {[
                {
                  module: "招聘",
                  object: "中级剪辑师",
                  issue: "3 位候选人部门确认已逾期",
                  owner: "陈璐",
                  time: "07-14 15:20",
                  status: "待处理",
                  target: "recruitment",
                },
                {
                  module: "项目",
                  object: "《城市边缘》",
                  issue: "剪辑一审延期，可能影响上线排期",
                  owner: "沈婉瑶",
                  time: "07-14 14:51",
                  status: "处理中",
                  target: "projects",
                },
                {
                  module: "选题",
                  object: "《十分钟便利店》",
                  issue: "退回后 2 天未重新提交",
                  owner: "张小北",
                  time: "07-14 13:42",
                  status: "待处理",
                  target: "topics",
                },
              ].map((row) => (
                <div
                  className="platform-table__row"
                  style={{
                    gridTemplateColumns:
                      "110px 1.1fr 1.6fr 110px 150px 110px 72px",
                  }}
                  key={row.object}
                >
                  <PlatformBadge>{row.module}</PlatformBadge>
                  <strong>{row.object}</strong>
                  <span>{row.issue}</span>
                  <span>{row.owner}</span>
                  <span>{row.time}</span>
                  <PlatformBadge>{row.status}</PlatformBadge>
                  <button
                    className="table-link"
                    onClick={() => goPage(row.target)}
                    type="button"
                  >
                    钻取
                  </button>
                </div>
              ))}
            </DataTable>
          </PlatformCard>
        </>
      ) : (
        <DashboardDomainView view={view} goPage={goPage} />
      )}
      <MetricProvenanceDrawer
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        onNavigate={(target) => {
          setSelectedMetric(null);
          goPage(target);
        }}
      />
    </div>
  );
}

export function ReportsCenterPage() {
  const [view, setView] = useState("daily");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="日报 / 周报中心"
        title="工作记录与版本留痕"
        description="日报按周自动汇总为周报草稿；日报、周报、AI使用与项目数据仅作为绩效证据，不自动改变分数。"
        actions={
          <button
            className="primary-btn"
            onClick={() => setFormOpen(true)}
            type="button"
          >
            <Plus size={16} />
            新建日报
          </button>
        }
      />
      <PlatformNotice>
        已提交内容保留版本；退回修改生成新版本，不覆盖历史快照。
      </PlatformNotice>
      <PlatformMetrics
        items={[
          {
            label: "今日应提交",
            value: 19,
            unit: "人",
            meta: "已提交 16 人",
            tone: "blue",
          },
          {
            label: "今日未提交",
            value: 3,
            unit: "人",
            meta: "截止今天 20:00",
            tone: "amber",
          },
          {
            label: "存在风险日报",
            value: 4,
            unit: "篇",
            meta: "其中 2 项影响项目排期",
            tone: "red",
          },
          {
            label: "本周周报草稿",
            value: 15,
            unit: "份",
            meta: "5 份待本人确认",
            tone: "purple",
          },
          {
            label: "周报已退回",
            value: 2,
            unit: "份",
            meta: "修改后将生成新版本",
            tone: "red",
          },
          {
            label: "AI使用人数",
            value: 12,
            unit: "人",
            meta: "仅记录使用情况",
            tone: "cyan",
          },
        ]}
      />
      <PlatformTabs
        items={[
          { id: "daily", label: "工作日报", count: dailyReports.length },
          { id: "weekly", label: "周报汇总", count: weeklyReports.length },
          { id: "versions", label: "版本记录", count: 7 },
        ]}
        value={view}
        onChange={setView}
        ariaLabel="日报周报视图"
      />
      {view === "daily" ? (
        <PlatformCard
          title="工作日报"
          description="按日期、人员、部门和状态筛选"
        >
          <PlatformFilter
            actions={
              <>
                <button className="ghost-chip" type="button">
                  重置
                </button>
                <button className="primary-btn" type="button">
                  查询
                </button>
              </>
            }
          >
            <label>
              <span>日期</span>
              <input defaultValue="2026-07-14" type="date" />
            </label>
            <label>
              <span>部门</span>
              <select defaultValue="all">
                <option value="all">全部部门</option>
                <option>剪辑中心</option>
                <option>制片中心</option>
              </select>
            </label>
            <label>
              <span>人员</span>
              <input placeholder="输入人员姓名" />
            </label>
            <label>
              <span>状态</span>
              <select defaultValue="all">
                <option value="all">全部状态</option>
                <option>已提交</option>
                <option>草稿</option>
                <option>已退回</option>
              </select>
            </label>
          </PlatformFilter>
          <DataTable
            columns={[
              { label: "日期 / 人员", width: "150px" },
              { label: "部门", width: "120px" },
              { label: "工作内容摘要", width: "1.7fr" },
              { label: "成果", width: "70px" },
              { label: "风险", width: "90px" },
              { label: "AI使用", width: "150px" },
              { label: "状态 / 版本", width: "120px" },
              { label: "操作", width: "72px" },
            ]}
            minWidth={980}
          >
            {dailyReports.map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns:
                    "150px 120px 1.7fr 70px 90px 150px 120px 72px",
                }}
                key={row.id}
              >
                <div>
                  <strong>{row.name}</strong>
                  <small>
                    {row.date} · {row.time}
                  </small>
                </div>
                <span>{row.department}</span>
                <span>{row.summary}</span>
                <strong>{row.outcomes}</strong>
                <PlatformBadge>{row.risk}</PlatformBadge>
                <span>{row.ai}</span>
                <div>
                  <PlatformBadge>{row.status}</PlatformBadge>
                  <small>{row.version}</small>
                </div>
                <button
                  className="table-link"
                  onClick={() => setSelected(row)}
                  type="button"
                >
                  详情
                </button>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "weekly" ? (
        <PlatformCard title="周报汇总" description="员工补充确认后提交正式周报">
          <DataTable
            columns={[
              { label: "周期 / 人员", width: "160px" },
              { label: "自动汇总", width: "1.4fr" },
              { label: "风险数量", width: "90px" },
              { label: "当前版本", width: "90px" },
              { label: "审核状态", width: "120px" },
              { label: "提交时间", width: "160px" },
              { label: "操作", width: "90px" },
            ]}
            minWidth={900}
          >
            {weeklyReports.map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns: "160px 1.4fr 90px 90px 120px 160px 90px",
                }}
                key={row.id}
              >
                <div>
                  <strong>{row.name}</strong>
                  <small>{row.cycle}</small>
                </div>
                <span>{row.source}</span>
                <strong>{row.risks}</strong>
                <span>{row.version}</span>
                <PlatformBadge>{row.status}</PlatformBadge>
                <span>{row.submittedAt}</span>
                <button
                  className="table-link"
                  onClick={() => setSelected(row)}
                  type="button"
                >
                  查看
                </button>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "versions" ? (
        <PlatformCard
          title="版本与操作记录"
          description="每次提交、退回和修改均保存快照"
        >
          <section className="platform-version-timeline">
            {[
              {
                title: "第29周周报 V2",
                meta: "沈婉瑶 · 退回修改",
                time: "2026-07-14 17:42",
                note: "补充项目延期风险和下周纠偏计划",
              },
              {
                title: "第29周周报 V1",
                meta: "沈婉瑶 · 正式提交",
                time: "2026-07-14 16:08",
                note: "由5篇日报汇总，员工补充后提交",
              },
              {
                title: "7月14日日报 V2",
                meta: "张小北 · 重新提交",
                time: "2026-07-14 18:05",
                note: "补充AI使用情况与成果附件",
              },
            ].map((item) => (
              <article key={`${item.title}-${item.time}`}>
                <i />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                  <p>{item.note}</p>
                </div>
                <time>{item.time}</time>
              </article>
            ))}
          </section>
        </PlatformCard>
      ) : null}
      {formOpen ? (
        <PlatformDrawer
          title="新建工作日报"
          subtitle="2026-07-14 · 当前人员"
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setFormOpen(false)}
                type="button"
              >
                保存草稿
              </button>
              <button
                className="primary-btn"
                onClick={() => setFormOpen(false)}
                type="button"
              >
                提交日报
              </button>
            </>
          }
        >
          <div className="platform-form-grid">
            <label className="is-wide">
              <span>今日工作内容</span>
              <textarea
                defaultValue="完成重点任务推进与跨团队沟通。"
                rows={4}
              />
            </label>
            <label>
              <span>成果数量</span>
              <input defaultValue="3" type="number" />
            </label>
            <label>
              <span>风险状态</span>
              <select defaultValue="normal">
                <option value="normal">无风险</option>
                <option value="risk">存在风险</option>
              </select>
            </label>
            <label className="is-wide">
              <span>成果说明</span>
              <textarea placeholder="填写可验证的交付成果" rows={3} />
            </label>
            <label className="is-wide">
              <span>风险与阻塞</span>
              <textarea placeholder="无风险可填写“无”" rows={3} />
            </label>
            <label className="is-wide">
              <span>次日计划</span>
              <textarea placeholder="填写下一工作日计划" rows={3} />
            </label>
            <label className="is-wide">
              <span>AI使用情况</span>
              <input placeholder="工具、使用场景与产出" />
            </label>
          </div>
        </PlatformDrawer>
      ) : null}
      {selected ? (
        <PlatformDrawer
          title={selected.name ?? selected.cycle}
          subtitle={selected.id}
          onClose={() => setSelected(null)}
        >
          <PlatformNotice>
            该记录可作为绩效证据查看，但不会自动改变任何绩效评分。
          </PlatformNotice>
          <div className="platform-detail-grid">
            {Object.entries(selected)
              .slice(1, 9)
              .map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
          </div>
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

function LegacyRecruitmentCenterPage() {
  const [view, setView] = useState("jobs");
  const [candidates, setCandidates] = useState(candidatesSeed);
  const [selected, setSelected] = useState(null);
  const [decisionMode, setDecisionMode] = useState(null);
  const [reason, setReason] = useState("");
  const selectedCurrent =
    candidates.find((item) => item.id === selected?.id) ?? selected;
  const decide = (nextStatus) => {
    if (selectedCurrent.applications[0].status !== "待部门确认") return;
    setCandidates((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              applications: item.applications.map((application, index) =>
                index === 0
                  ? { ...application, status: nextStatus }
                  : application,
              ),
            }
          : item,
      ),
    );
    setDecisionMode(null);
    setReason("");
    setSelected(null);
  };
  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="招聘管理"
        title="岗位、候选人与招聘日报"
        description="候选人主档和岗位应聘记录分层管理，流程结论、招聘工作量与 SSC 到岗状态分别追踪。"
        actions={
          <button className="primary-btn" type="button">
            <Plus size={16} />
            新增招聘需求
          </button>
        }
      />
      <PlatformMetrics
        items={[
          {
            label: "招聘中岗位",
            value: 9,
            unit: "个",
            meta: "紧急岗位 2 个",
            tone: "blue",
          },
          {
            label: "需求总人数",
            value: 18,
            unit: "人",
            meta: "已到岗 7 人",
            tone: "purple",
          },
          {
            label: "招聘缺口",
            value: 11,
            unit: "人",
            meta: "较上周减少 2 人",
            tone: "amber",
          },
          {
            label: "待部门确认",
            value: 12,
            unit: "人",
            meta: "3 人已逾期",
            tone: "red",
          },
          {
            label: "本月正式入职",
            value: 8,
            unit: "人",
            meta: "Offer接受 11 人",
            tone: "green",
          },
          {
            label: "SSC 到岗状态",
            value: "2 / 4 / 0",
            meta: "实习期 / 已转正 / 已离职",
            tone: "cyan",
          },
        ]}
      />
      <PlatformTabs
        items={[
          { id: "jobs", label: "岗位与需求", count: jobsSeed.length },
          {
            id: "candidates",
            label: "简历库 / 候选人",
            count: candidates.length,
          },
          {
            id: "daily",
            label: "招聘日报",
            count: recruitmentDailySeed.length,
          },
        ]}
        value={view}
        onChange={setView}
        ariaLabel="招聘管理视图"
      />
      {view === "jobs" ? (
        <PlatformCard
          title="招聘岗位与需求"
          description="无招聘负责人时禁止启动招聘"
        >
          <PlatformFilter
            actions={
              <>
                <button className="ghost-chip" type="button">
                  重置
                </button>
                <button className="primary-btn" type="button">
                  查询岗位
                </button>
              </>
            }
          >
            <label>
              <span>岗位 / 部门</span>
              <input placeholder="输入岗位或部门" />
            </label>
            <label>
              <span>招聘状态</span>
              <select defaultValue="all">
                <option value="all">全部状态</option>
                <option>招聘中</option>
                <option>暂停招聘</option>
              </select>
            </label>
            <label>
              <span>招聘负责人</span>
              <input placeholder="输入负责人" />
            </label>
            <label>
              <span>优先级</span>
              <select defaultValue="all">
                <option value="all">全部优先级</option>
                <option>紧急</option>
                <option>高</option>
              </select>
            </label>
          </PlatformFilter>
          <DataTable
            columns={[
              { label: "岗位", width: "1.2fr" },
              { label: "部门 / 地点", width: "1.1fr" },
              { label: "需求 / 到岗", width: "110px" },
              { label: "招聘缺口", width: "90px" },
              { label: "负责人", width: "100px" },
              { label: "优先级", width: "90px" },
              { label: "状态", width: "110px" },
              { label: "候选人", width: "90px" },
              { label: "周期", width: "80px" },
              { label: "操作", width: "72px" },
            ]}
            minWidth={1040}
          >
            {jobsSeed.map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns:
                    "1.2fr 1.1fr 110px 90px 100px 90px 110px 90px 80px 72px",
                }}
                key={row.id}
              >
                <div>
                  <strong>{row.name}</strong>
                  <small>{row.id}</small>
                </div>
                <div>
                  <span>{row.department}</span>
                  <small>{row.city}</small>
                </div>
                <strong>
                  {row.need} / {row.onboarded}
                </strong>
                <strong>{row.need - row.onboarded}</strong>
                <span>{row.recruiter}</span>
                <PlatformBadge>{row.priority}</PlatformBadge>
                <PlatformBadge>{row.status}</PlatformBadge>
                <button
                  className="table-link"
                  onClick={() => setView("candidates")}
                  type="button"
                >
                  {row.candidates} 人
                </button>
                <span>{row.cycle}</span>
                <button className="table-link" type="button">
                  详情
                </button>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "candidates" ? (
        <PlatformCard
          title="候选人主档"
          description="同一候选人可拥有多条独立岗位应聘记录"
        >
          <PlatformFilter
            actions={
              <>
                <button className="ghost-chip" type="button">
                  重置
                </button>
                <button className="primary-btn" type="button">
                  查询候选人
                </button>
              </>
            }
          >
            <label>
              <span>姓名 / 手机 / 邮箱</span>
              <input placeholder="优先按手机号查重" />
            </label>
            <label>
              <span>应聘岗位</span>
              <select defaultValue="all">
                <option value="all">全部岗位</option>
                <option>短剧编剧</option>
                <option>中级剪辑师</option>
              </select>
            </label>
            <label>
              <span>当前阶段</span>
              <select defaultValue="all">
                <option value="all">全部阶段</option>
                <option>待部门确认</option>
                <option>待面试反馈</option>
                <option>Offer已发</option>
              </select>
            </label>
            <label>
              <span>招聘负责人</span>
              <input placeholder="输入负责人" />
            </label>
          </PlatformFilter>
          <DataTable
            columns={[
              { label: "候选人", width: "150px" },
              { label: "联系方式", width: "1.3fr" },
              { label: "来源", width: "100px" },
              { label: "应聘岗位", width: "1.25fr" },
              { label: "最高阶段", width: "130px" },
              { label: "负责人", width: "90px" },
              { label: "重复校验", width: "110px" },
              { label: "更新时间", width: "145px" },
              { label: "操作", width: "72px" },
            ]}
            minWidth={1060}
          >
            {candidates.map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns:
                    "150px 1.3fr 100px 1.25fr 130px 90px 110px 145px 72px",
                }}
                key={row.id}
              >
                <div>
                  <strong>{row.name}</strong>
                  <small>
                    {row.id} · {row.applications.length} 个岗位
                  </small>
                </div>
                <div>
                  <span>{row.phone}</span>
                  <small>{row.email}</small>
                </div>
                <span>{row.source}</span>
                <span>
                  {row.applications.map((item) => item.job).join("、")}
                </span>
                <PlatformBadge>{row.applications[0].status}</PlatformBadge>
                <span>{row.owner}</span>
                <PlatformBadge>{row.duplicate}</PlatformBadge>
                <span>{row.updatedAt}</span>
                <button
                  className="table-link"
                  onClick={() => setSelected(row)}
                  type="button"
                >
                  详情
                </button>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "daily" ? (
        <div className="platform-dashboard-grid">
          <PlatformCard
            title="招聘工作量漏斗"
            description="正式口径：已提交且截图完整的招聘日报"
          >
            <RecruitmentFunnel reports={recruitmentDailySeed} />
          </PlatformCard>
          <PlatformCard
            title="日报与流程差异"
            description="流程数据独立展示，不覆盖日报工作量"
          >
            <div className="platform-difference-list">
              {recruitmentDailySeed.map((row) => (
                <article key={row.id}>
                  <div>
                    <strong>
                      {row.recruiter} · {row.platform}
                    </strong>
                    <span>
                      {row.job} · {row.date}
                    </span>
                  </div>
                  <PlatformBadge>{row.status}</PlatformBadge>
                  <span>截图 {row.screenshots} 张</span>
                  <b className={row.difference ? "is-danger" : ""}>
                    {row.difference ? `${row.difference} 项差异` : "无差异"}
                  </b>
                </article>
              ))}
            </div>
            <PlatformNotice tone="warning">
              草稿、退回或缺少必填截图的日报不进入正式经营统计。
            </PlatformNotice>
          </PlatformCard>
        </div>
      ) : null}
      {selectedCurrent ? (
        <PlatformDrawer
          wide
          title={selectedCurrent.name}
          subtitle={`候选人主档 ${selectedCurrent.id} · ${selectedCurrent.source}`}
          onClose={() => {
            setSelected(null);
            setDecisionMode(null);
            setReason("");
          }}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setDecisionMode("reject")}
                type="button"
              >
                不进入面试
              </button>
              <button
                className="primary-btn"
                onClick={() => decide("待安排面试")}
                type="button"
              >
                进入面试
              </button>
            </>
          }
        >
          <PlatformNotice>
            手机号优先、邮箱辅助去重；当前主档已关联{" "}
            {selectedCurrent.applications.length} 条岗位应聘记录。
          </PlatformNotice>
          <div className="platform-detail-grid">
            <div>
              <span>手机号</span>
              <strong>{selectedCurrent.phone}</strong>
            </div>
            <div>
              <span>邮箱</span>
              <strong>{selectedCurrent.email}</strong>
            </div>
            <div>
              <span>招聘负责人</span>
              <strong>{selectedCurrent.owner}</strong>
            </div>
            <div>
              <span>重复校验</span>
              <PlatformBadge>{selectedCurrent.duplicate}</PlatformBadge>
            </div>
          </div>
          <section className="platform-detail-section">
            <h3>岗位应聘记录</h3>
            <div className="platform-application-list">
              {selectedCurrent.applications.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.job}</strong>
                    <span>{item.id}</span>
                  </div>
                  <PlatformBadge>{item.status}</PlatformBadge>
                  <span>面试官：{item.interviewer}</span>
                </article>
              ))}
            </div>
          </section>
          {decisionMode === "reject" ? (
            <section className="platform-decision-box">
              <label>
                <span>
                  不进入面试原因 <b>*</b>
                </span>
                <textarea
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="必须填写具体原因后才能提交"
                  rows={4}
                  value={reason}
                />
              </label>
              <button
                className="primary-btn"
                disabled={!reason.trim()}
                onClick={() => decide("不进入面试")}
                type="button"
              >
                确认结论并生成审计记录
              </button>
            </section>
          ) : null}
          <section className="platform-timeline">
            <article>
              <i />
              <div>
                <strong>候选人主档建立</strong>
                <span>2026-07-10 10:20 · {selectedCurrent.owner}</span>
              </div>
            </article>
            <article>
              <i />
              <div>
                <strong>提交部门确认</strong>
                <span>2026-07-14 09:30 · expectedVersion V2</span>
              </div>
            </article>
          </section>
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

const recruitmentTerminalStatuses = [
  "不进入面试",
  "面试未通过",
  "Offer已拒绝",
];

const rejectionStageMeta = {
  resume: {
    title: "简历不通过原因",
    empty: "暂无简历不通过记录",
  },
  interview: {
    title: "面试不通过原因",
    empty: "暂无面试不通过记录",
  },
  offer: {
    title: "Offer 被拒绝原因",
    empty: "暂无 Offer 被拒绝记录",
  },
};

const rejectionReasonOptions = {
  reject: [
    "经验不匹配",
    "专业技能不匹配",
    "学历或资质不符",
    "薪资期望不匹配",
    "稳定性或到岗时间不符",
    "其他",
  ],
  interviewFail: [
    "专业能力不足",
    "项目经验不足",
    "沟通协作不足",
    "价值观或团队匹配度不足",
    "综合表现未达标",
    "其他",
  ],
  offerReject: [
    "薪资未达预期",
    "接受其他 Offer",
    "岗位或发展方向不匹配",
    "工作地点或通勤原因",
    "家庭或个人原因",
    "入职时间无法协调",
    "其他",
  ],
};

function rejectionStageForMode(mode) {
  if (mode === "reject") return "resume";
  if (mode === "interviewFail") return "interview";
  return "offer";
}

const sscEmploymentStatuses = [
  "实习期",
  "已转正",
  "已离职",
  "SSC待建档",
  "SSC待确认",
];

function interviewRoundText(application) {
  const current = application?.currentInterviewRound ?? 1;
  const total = application?.interviewTotal ?? 1;
  return `第 ${current}/${total} 轮`;
}

function recruitmentAction(status, application) {
  const round = interviewRoundText(application);
  const actions = {
    待筛选: { label: "筛选并提交入库", next: "待部门确认" },
    待部门确认: { label: "进入面试", next: "待安排面试" },
    待安排面试: { label: `确认${round}面试安排`, next: "已安排面试" },
    已安排面试: { label: `登记${round}面试完成`, next: "待面试反馈" },
    Offer待发: { label: "发放 Offer", next: "Offer已发" },
    Offer已发: { label: "确认 Offer 已接受", next: "待入职" },
    待入职: { label: "确认到岗并读取 SSC", next: "SSC到岗状态" },
  };
  return actions[status];
}

function RecruitmentProgress({ application }) {
  const { status } = application;
  const interviewTotal = application.interviewTotal ?? 1;
  const stages = [
    "待筛选",
    "待部门确认",
    ...Array.from(
      { length: interviewTotal },
      (_, index) => `第${index + 1}轮面试`,
    ),
    "Offer",
    "待入职",
    "到岗状态",
  ];
  const currentRound = application.currentInterviewRound ?? 1;
  const index =
    status === "待筛选"
      ? 0
      : status === "待部门确认"
        ? 1
        : ["待安排面试", "已安排面试", "待面试反馈"].includes(status)
          ? 1 + currentRound
          : ["Offer待发", "Offer已发"].includes(status)
            ? 2 + interviewTotal
            : status === "待入职"
              ? 3 + interviewTotal
              : sscEmploymentStatuses.includes(status)
                ? 4 + interviewTotal
                : -1;
  const terminal = recruitmentTerminalStatuses.includes(status);
  const arrived = sscEmploymentStatuses.includes(status);
  return (
    <div className="recruitment-progress" aria-label="招聘流程进度">
      <div>
        {stages.map((stage, stageIndex) => (
          <span
            className={
              terminal ? "" : stageIndex <= index || arrived ? "is-done" : ""
            }
            key={stage}
          >
            <i />
            {stage}
          </span>
        ))}
      </div>
      <small>
        {terminal
          ? `流程已结束：${status}`
          : arrived
            ? `SSC 到岗状态：${status}`
            : `当前节点：${status}`}
      </small>
    </div>
  );
}

export function RecruitmentCenterPage() {
  const {
    jobs,
    setJobs,
    candidates,
    setCandidates,
    recruitmentDailyReports: dailyReportsState,
    setRecruitmentDailyReports: setDailyReportsState,
  } = useDemoData();
  const [view, setView] = useState("jobs");
  const [sscPersonnel, setSscPersonnel] = useState(readSscPersonnel);
  const [selected, setSelected] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [mode, setMode] = useState(null);
  const [note, setNote] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dailyError, setDailyError] = useState("");
  const [jobEditor, setJobEditor] = useState(null);
  const [jobDraft, setJobDraft] = useState({});
  const [candidateEntry, setCandidateEntry] = useState(null);
  const [candidateEntryError, setCandidateEntryError] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [candidateDraft, setCandidateDraft] = useState({});
  const [dailyDraft, setDailyDraft] = useState({
    date: "2026-07-15",
    recruiter: "陈璐",
    platform: "BOSS直聘",
    job: "中级剪辑师",
    hello: 0,
    reply: 0,
    resume: 0,
    valid: 0,
    invite: 0,
    interview: 0,
    passed: 0,
    offer: 0,
    accepted: 0,
    onboarded: 0,
    screenshots: 1,
  });
  const interviewerOptions = [
    ...new Set([
      ...sscPersonnel.map((person) => person.name),
      ...jobs.flatMap((job) => job.interviewers ?? []),
      ...candidates.flatMap((candidate) =>
        (candidate.applications ?? []).flatMap((item) => [
          item.interviewer,
          ...(item.interviewers ?? []),
          ...(item.interviews ?? []).map((interview) => interview.interviewer),
        ]),
      ),
      "江晚",
      "李晓言",
      "沈婉瑶",
      "林制作",
      "赵启",
    ].filter(Boolean)),
  ];
  const jobInterviewersComplete = Array.from(
    { length: Number(jobDraft.interviewRounds) || 1 },
    (_, index) => jobDraft.interviewers?.[index],
  ).every(Boolean);

  useEffect(() => {
    const refreshSscPersonnel = () => setSscPersonnel(readSscPersonnel());
    window.addEventListener("focus", refreshSscPersonnel);
    window.addEventListener("storage", refreshSscPersonnel);
    window.addEventListener("message", refreshSscPersonnel);
    return () => {
      window.removeEventListener("focus", refreshSscPersonnel);
      window.removeEventListener("storage", refreshSscPersonnel);
      window.removeEventListener("message", refreshSscPersonnel);
    };
  }, []);

  const current =
    candidates.find((candidate) => candidate.id === selected?.id) ?? null;
  const application =
    current?.applications.find((item) => item.id === selectedApplicationId) ??
    current?.applications[0] ??
    null;
  const closeDrawer = () => {
    setSelected(null);
    setSelectedApplicationId("");
    setMode(null);
    setNote("");
    setReasonCategory("");
    setInterviewer("");
    setInterviewAt("");
  };
  const loadInterviewDraft = (selectedApplication) => {
    const round = selectedApplication?.currentInterviewRound ?? 1;
    const roundRecord = selectedApplication?.interviews?.find(
      (item) => item.round === round,
    );
    setInterviewer(
      roundRecord?.interviewer ?? selectedApplication?.interviewer ?? "",
    );
    setInterviewAt(
      roundRecord?.interviewAt ?? selectedApplication?.interviewAt ?? "",
    );
  };
  const openCandidate = (
    candidate,
    applicationId = candidate.applications[0]?.id,
  ) => {
    const selectedApplication = candidate.applications.find(
      (item) => item.id === applicationId,
    );
    setSelected(candidate);
    setSelectedApplicationId(applicationId);
    setMode(null);
    setNote("");
    setReasonCategory("");
    loadInterviewDraft(selectedApplication);
  };
  const createCandidate = () => {
    const applicationId = `APP-${Date.now()}`;
    const candidate = {
      id: `CAN-${Date.now()}`,
      name: "新候选人",
      phone: "待补充",
      email: "待补充",
      source: "手动录入",
      owner: "陈璐",
      duplicate: "待校验",
      updatedAt: "刚刚创建",
      applications: [
        {
          id: applicationId,
          job: "待选择岗位",
          status: "待筛选",
          interviewer: "待分配",
          interviewTotal: 1,
          currentInterviewRound: 1,
          interviews: [],
          version: 1,
          history: [
            {
              time: "2026-07-15 10:30",
              action: "创建候选人主档",
              operator: "陈璐",
              note: "等待完成筛选入库",
            },
          ],
        },
      ],
    };
    setCandidates((items) => [candidate, ...items]);
    openCandidate(candidate, applicationId);
  };
  const openJobEditor = (job = null) => {
    setJobEditor(job ? "edit" : "create");
    setJobDraft(
      job
        ? {
            ...job,
            startDate: job.startDate ?? "2026-07-01",
            endDate: job.endDate ?? "2026-08-01",
            interviewers: Array.from(
              { length: job.interviewRounds ?? 1 },
              (_, index) => job.interviewers?.[index] ?? "",
            ),
          }
        : {
            name: "",
            department: "",
            city: "",
            need: 1,
            recruiter: "陈璐",
            priority: "中",
            status: "招聘中",
            interviewRounds: 1,
            interviewers: [""],
            startDate: "2026-07-15",
            endDate: "2026-08-15",
          },
    );
  };
  const saveJob = () => {
    if (
      !jobDraft.name?.trim() ||
      !jobDraft.department?.trim() ||
      !jobDraft.recruiter?.trim() ||
      !jobInterviewersComplete ||
      !jobDraft.startDate ||
      !jobDraft.endDate ||
      jobDraft.endDate < jobDraft.startDate
    )
      return;
    if (jobEditor === "create") {
      setJobs((items) => [
        {
          ...jobDraft,
          id: `JOB-${Date.now()}`,
          need: Number(jobDraft.need) || 1,
          interviewRounds: Number(jobDraft.interviewRounds) || 1,
          interviewers: jobDraft.interviewers.slice(
            0,
            Number(jobDraft.interviewRounds) || 1,
          ),
          onboarded: 0,
          candidates: 0,
          cycle: `${jobDraft.startDate} 至 ${jobDraft.endDate}`,
        },
        ...items,
      ]);
    } else {
      setJobs((items) =>
        items.map((job) =>
          job.id === jobDraft.id
            ? {
                ...job,
                ...jobDraft,
                need: Number(jobDraft.need) || 1,
                interviewRounds: Number(jobDraft.interviewRounds) || 1,
                interviewers: jobDraft.interviewers.slice(
                  0,
                  Number(jobDraft.interviewRounds) || 1,
                ),
                cycle: `${jobDraft.startDate ?? "未设置"} 至 ${jobDraft.endDate ?? "未设置"}`,
              }
            : job,
        ),
      );
    }
    setJobEditor(null);
  };
  const openCandidateEntry = (job = null) => {
    setCandidateEntry(job?.id ?? "manual");
    setCandidateEntryError("");
    setResumeName("");
    setResumeFile(null);
    setCandidateDraft({
      name: "",
      phone: "",
      email: "",
      source: "BOSS直聘",
      jobId: job?.id ?? jobs[0]?.id ?? "",
      owner: job?.recruiter ?? "陈璐",
    });
  };
  const saveCandidateEntry = () => {
    const job = jobs.find((item) => item.id === candidateDraft.jobId);
    if (
      !candidateDraft.name?.trim() ||
      !candidateDraft.phone?.trim() ||
      !candidateDraft.email?.trim() ||
      !job ||
      !resumeName
    ) {
      setCandidateEntryError(
        "请补全候选人姓名、联系方式、应聘岗位并上传简历后再创建。",
      );
      return;
    }
    const applicationId = `APP-${Date.now()}`;
    const candidate = {
      id: `CAN-${Date.now()}`,
      name: candidateDraft.name.trim(),
      phone: candidateDraft.phone.trim(),
      email: candidateDraft.email.trim(),
      source: candidateDraft.source,
      owner: candidateDraft.owner || job.recruiter,
      duplicate: "待校验",
      updatedAt: "刚刚创建",
      resumeName,
      resumeFile,
      applications: [
        {
          id: applicationId,
          job: job.name,
          status: "待筛选",
          interviewer: "待分配",
          interviewTotal: job.interviewRounds ?? 1,
          interviewers: job.interviewers ?? [],
          currentInterviewRound: 1,
          interviews: (job.interviewers ?? []).map((interviewer, index) => ({
            round: index + 1,
            interviewer,
            status: "待安排",
          })),
          version: 1,
          history: [
            {
              time: "2026-07-15 10:30",
              action: "上传简历并创建应聘记录",
              operator: candidateDraft.owner || job.recruiter,
              note: `简历：${resumeName}`,
            },
          ],
        },
      ],
    };
    setCandidates((items) => [candidate, ...items]);
    setJobs((items) =>
      items.map((item) =>
        item.id === job.id
          ? { ...item, candidates: item.candidates + 1 }
          : item,
      ),
    );
    setCandidateEntry(null);
    setView("candidates");
    openCandidate(candidate, applicationId);
  };
  const updateApplication = (nextStatus, action, extra = {}) => {
    if (!current || !application) return;
    const reasonRequired = [
      "不进入面试",
      "面试未通过",
      "Offer已拒绝",
    ].includes(nextStatus);
    if (reasonRequired && (!reasonCategory || !note.trim())) return;
    const rejection = reasonRequired
      ? {
          stage: rejectionStageForMode(mode),
          category: reasonCategory,
          detail: note.trim(),
          ...(mode === "interviewFail"
            ? { round: application.currentInterviewRound ?? 1 }
            : {}),
        }
      : null;
    const now = "2026-07-15 10:30";
    setCandidates((items) =>
      items.map((candidate) =>
        candidate.id !== current.id
          ? candidate
          : {
              ...candidate,
              updatedAt: now,
              applications: candidate.applications.map((item) =>
                item.id !== application.id
                  ? item
                  : {
                      ...item,
                      ...extra,
                      ...(rejection ? { rejection } : {}),
                      status: nextStatus,
                      version: (item.version ?? 1) + 1,
                      history: [
                        ...(item.history ?? []),
                        {
                          time: now,
                          action,
                          operator: candidate.owner,
                          note: rejection
                            ? `${rejection.category}：${rejection.detail}`
                            : note.trim() || `状态更新为${nextStatus}`,
                        },
                      ],
                    },
              ),
            },
      ),
    );
    setMode(null);
    setNote("");
    setReasonCategory("");
  };
  const interviewRecordsWith = (changes) => {
    const round = application?.currentInterviewRound ?? 1;
    const currentRecords = application?.interviews ?? [];
    const existing = currentRecords.find((item) => item.round === round);
    const nextRecord = { round, ...existing, ...changes };
    return existing
      ? currentRecords.map((item) =>
          item.round === round ? nextRecord : item,
        )
      : [...currentRecords, nextRecord];
  };
  const passCurrentInterview = () => {
    if (!application) return;
    const currentRound = application.currentInterviewRound ?? 1;
    const interviewTotal = application.interviewTotal ?? 1;
    const interviews = interviewRecordsWith({ status: "已通过" });
    if (currentRound < interviewTotal) {
      updateApplication(
        "待安排面试",
        `第 ${currentRound} 轮面试通过，进入第 ${currentRound + 1} 轮`,
        {
          currentInterviewRound: currentRound + 1,
          interviews,
          interviewer: "",
          interviewAt: "",
        },
      );
      setInterviewer(application.interviewers?.[currentRound] ?? "");
      setInterviewAt("");
      return;
    }
    updateApplication("Offer待发", `第 ${currentRound} 轮面试通过`, {
      interviews,
    });
  };
  const syncArrivalFromSsc = () => {
    if (!current || !application) return;
    const employment = resolveSscEmployment(
      sscPersonnel,
      current,
      application,
    );
    updateApplication(employment.status, "从 SSC 同步到岗状态", {
      sscEmployeeNo: employment.employee?.no ?? application.sscEmployeeNo,
      onboardAt: employment.employee?.date ?? application.onboardAt,
      employmentSource: "SSC花名册",
    });
  };
  const submitDaily = () => {
    if (!dailyDraft.screenshots) {
      setDailyError("至少上传 1 张工作截图后才能正式提交。 ");
      return;
    }
    setDailyReportsState((items) => [
      {
        ...dailyDraft,
        id: `RD-${Date.now()}`,
        status: "已提交",
        difference: 0,
      },
      ...items,
    ]);
    setDailyOpen(false);
    setDailyError("");
  };
  const stageCount = (status) =>
    candidates.reduce(
      (sum, candidate) =>
        sum +
        candidate.applications.filter((item) => item.status === status).length,
      0,
    );
  const submittedDaily = dailyReportsState.filter(
    (item) => item.status === "已提交" && item.screenshots > 0,
  ).length;
  const sscEmploymentSummary = summarizeSscEmployment(sscPersonnel);
  const selectedAction = application
    ? recruitmentAction(application.status, application)
    : null;
  const currentSscEmployment =
    current && application
      ? resolveSscEmployment(sscPersonnel, current, application)
      : null;
  const needsReason =
    mode === "reject" ||
    mode === "interviewFail" ||
    mode === "offerReject";

  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="招聘管理"
        title="岗位、候选人与招聘日报"
        description="按岗位配置一轮或多轮面试；到岗状态从 SSC 花名册同步。"
        actions={
          <button
            className="primary-btn"
            onClick={() => {
              if (view === "jobs") openJobEditor();
              else openCandidateEntry();
            }}
            type="button"
          >
            <Plus size={16} />
            {view === "jobs" ? "新增岗位" : "上传候选人"}
          </button>
        }
      />
      <PlatformMetrics
        items={[
          {
            label: "招聘中岗位",
            value: jobs.filter((item) => item.status === "招聘中").length,
            unit: "个",
            meta: "按岗位负责人分配",
            tone: "blue",
          },
          {
            label: "待部门确认",
            value: stageCount("待部门确认"),
            unit: "人",
            meta: "结论将生成审计记录",
            tone: "amber",
          },
          {
            label: "待面试反馈",
            value: stageCount("待面试反馈"),
            unit: "人",
            meta: "未通过需填写原因",
            tone: "purple",
          },
          {
            label: "Offer 待跟进",
            value: stageCount("Offer待发") + stageCount("Offer已发"),
            unit: "人",
            meta: "接受后进入入职跟进",
            tone: "blue",
          },
          {
            label: "SSC 到岗人员",
            value:
              sscEmploymentSummary.实习期 +
              sscEmploymentSummary.已转正 +
              sscEmploymentSummary.已离职,
            unit: "人",
            meta: `实习 ${sscEmploymentSummary.实习期} · 转正 ${sscEmploymentSummary.已转正} · 离职 ${sscEmploymentSummary.已离职}`,
            tone: "green",
          },
          {
            label: "正式招聘日报",
            value: submittedDaily,
            unit: "份",
            meta: "已提交且截图完整",
            tone: "cyan",
          },
        ]}
      />
      <PlatformTabs
        items={[
          { id: "jobs", label: "岗位与需求", count: jobs.length },
          {
            id: "candidates",
            label: "简历库 / 候选人",
            count: candidates.length,
          },
          { id: "daily", label: "招聘日报", count: dailyReportsState.length },
        ]}
        value={view}
        onChange={setView}
        ariaLabel="招聘管理视图"
      />
      {view === "jobs" ? (
        <PlatformCard
          title="招聘岗位与需求"
          description="岗位负责人、需求缺口和候选人数量在同一台账中跟踪。"
        >
          <DataTable
            columns={[
              { label: "岗位", width: "1.3fr" },
              { label: "部门 / 地点", width: "1.2fr" },
              { label: "需求 / 到岗", width: "100px" },
              { label: "负责人", width: "100px" },
              { label: "优先级", width: "90px" },
              { label: "状态", width: "100px" },
              { label: "面试流程 / 面试官", width: "170px" },
              { label: "招聘周期", width: "180px" },
              { label: "候选人", width: "80px" },
              { label: "操作", width: "150px" },
            ]}
            minWidth={1250}
          >
            {jobs.map((job) => (
              <div
                className="platform-table__row"
                key={job.id}
                style={{
                  gridTemplateColumns:
                    "1.25fr 1.1fr 100px 100px 90px 100px 170px 180px 80px 150px",
                }}
              >
                <div>
                  <strong>{job.name}</strong>
                  <small>
                    {job.id} · 缺口 {job.need - job.onboarded} 人
                  </small>
                </div>
                <div>
                  <span>{job.department}</span>
                  <small>{job.city}</small>
                </div>
                <strong>
                  {job.need} / {job.onboarded}
                </strong>
                <span>{job.recruiter}</span>
                <PlatformBadge>{job.priority}</PlatformBadge>
                <PlatformBadge>{job.status}</PlatformBadge>
                <div className="recruitment-job-interviewers">
                  <PlatformBadge>{job.interviewRounds ?? 1} 轮</PlatformBadge>
                  <small>{(job.interviewers ?? []).join(" / ") || "待配置"}</small>
                </div>
                <span>
                  {job.startDate && job.endDate
                    ? `${job.startDate} 至 ${job.endDate}`
                    : job.cycle}
                </span>
                <span>{job.candidates} 人</span>
                <div className="table-actions">
                  <button
                    className="table-link"
                    onClick={() => openJobEditor(job)}
                    type="button"
                  >
                    编辑
                  </button>
                  <button
                    className="table-link"
                    disabled={job.status !== "招聘中"}
                    onClick={() => openCandidateEntry(job)}
                    type="button"
                  >
                    上传候选人
                  </button>
                </div>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "candidates" ? (
        <PlatformCard
          title="候选人主档与岗位应聘记录"
          description="一个候选人可以应聘多个岗位；状态推进始终作用于选中的应聘记录。"
        >
          <PlatformFilter
            actions={
              <button
                className="ghost-chip"
                onClick={() => setView("candidates")}
                type="button"
              >
                重置
              </button>
            }
          >
            <label>
              <span>姓名 / 手机 / 邮箱</span>
              <input placeholder="手机号优先去重" />
            </label>
            <label>
              <span>当前节点</span>
              <select defaultValue="all">
                <option value="all">全部节点</option>
                <option>待部门确认</option>
                <option>待面试反馈</option>
                <option>Offer已发</option>
                <option>实习期</option>
                <option>已转正</option>
                <option>已离职</option>
              </select>
            </label>
            <label>
              <span>招聘负责人</span>
              <input placeholder="输入负责人" />
            </label>
          </PlatformFilter>
          <DataTable
            columns={[
              { label: "候选人", width: "150px" },
              { label: "联系方式", width: "1.15fr" },
              { label: "应聘岗位", width: "1.2fr" },
              { label: "当前节点", width: "130px" },
              { label: "负责人", width: "90px" },
              { label: "去重结果", width: "110px" },
              { label: "更新时间", width: "145px" },
              { label: "操作", width: "76px" },
            ]}
            minWidth={1040}
          >
            {candidates.map((candidate) => (
              <div
                className="platform-table__row"
                key={candidate.id}
                style={{
                  gridTemplateColumns:
                    "150px 1.15fr 1.2fr 130px 90px 110px 145px 76px",
                }}
              >
                <div>
                  <strong>{candidate.name}</strong>
                  <small>
                    {candidate.id} · {candidate.applications.length} 条应聘
                  </small>
                </div>
                <div>
                  <span>{candidate.phone || "待补充"}</span>
                  <small>{candidate.email || "待补充"}</small>
                </div>
                <span>
                  {candidate.applications.map((item) => item.job).join("、")}
                </span>
                <PlatformBadge>
                  {candidate.applications[0]?.status}
                </PlatformBadge>
                <span>{candidate.owner}</span>
                <PlatformBadge>{candidate.duplicate ?? "待校验"}</PlatformBadge>
                <span>{candidate.updatedAt ?? "刚刚创建"}</span>
                <button
                  className="table-link"
                  onClick={() => openCandidate(candidate)}
                  type="button"
                >
                  处理
                </button>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "daily" ? (
        <div className="platform-dashboard-grid">
          <PlatformCard
            title="招聘工作量漏斗"
            description="仅已提交且截图完整的日报纳入正式经营统计。"
          >
            <RecruitmentFunnel reports={dailyReportsState} />
          </PlatformCard>
          <PlatformCard
            title="日报提交与流程差异"
            description="日报数据与候选人流程数据分开记录，存在差异时需要复核。"
            action={
              <button
                className="primary-btn"
                onClick={() => setDailyOpen(true)}
                type="button"
              >
                <Plus size={16} />
                填写招聘日报
              </button>
            }
          >
            <div className="platform-difference-list">
              {dailyReportsState.map((row) => (
                <article key={row.id}>
                  <div>
                    <strong>
                      {row.recruiter} · {row.platform}
                    </strong>
                    <span>
                      {row.job} · {row.date}
                    </span>
                  </div>
                  <PlatformBadge>{row.status}</PlatformBadge>
                  <span>截图 {row.screenshots} 张</span>
                  <b className={row.difference ? "is-danger" : ""}>
                    {row.difference ? `${row.difference} 项差异` : "无差异"}
                  </b>
                </article>
              ))}
            </div>
            <PlatformNotice tone="warning">
              草稿、退回或缺少工作截图的日报不会进入正式统计。
            </PlatformNotice>
          </PlatformCard>
        </div>
      ) : null}
      {jobEditor ? (
        <PlatformDrawer
          wide
          title={jobEditor === "create" ? "新增招聘岗位" : "编辑招聘岗位"}
          subtitle="岗位需求、负责人和优先级会影响后续候选人分配"
          onClose={() => setJobEditor(null)}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setJobEditor(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="primary-btn"
                disabled={
                  !jobDraft.name?.trim() ||
                  !jobDraft.department?.trim() ||
                  !jobDraft.recruiter?.trim() ||
                  !jobInterviewersComplete ||
                  !jobDraft.startDate ||
                  !jobDraft.endDate ||
                  jobDraft.endDate < jobDraft.startDate
                }
                onClick={saveJob}
                type="button"
              >
                {jobEditor === "create" ? "创建岗位" : "保存岗位"}
              </button>
            </>
          }
        >
          <PlatformNotice>
            面试轮次按岗位配置；候选人完成最后一轮面试后才进入 Offer。暂停招聘的岗位不能继续新增应聘记录。
          </PlatformNotice>
          <div className="platform-form-grid">
            <label>
              <span>
                所属部门 <b>*</b>
              </span>
              <select
                onChange={(event) =>
                  setJobDraft((item) => ({
                    ...item,
                    department: event.target.value,
                    name: jobCatalog[event.target.value]?.includes(item.name)
                      ? item.name
                      : (jobCatalog[event.target.value]?.[0] ?? ""),
                  }))
                }
                value={jobDraft.department ?? ""}
              >
                <option value="">请选择部门</option>
                {Object.keys(jobCatalog).map((department) => (
                  <option key={department}>{department}</option>
                ))}
              </select>
            </label>
            <label>
              <span>
                职位 <b>*</b>
              </span>
              <select
                disabled={!jobDraft.department}
                onChange={(event) =>
                  setJobDraft((item) => ({ ...item, name: event.target.value }))
                }
                value={jobDraft.name ?? ""}
              >
                <option value="">请选择职位</option>
                {(jobCatalog[jobDraft.department] ?? []).map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </label>
            <label>
              <span>工作地点</span>
              <input
                onChange={(event) =>
                  setJobDraft((item) => ({ ...item, city: event.target.value }))
                }
                placeholder="例如：上海"
                value={jobDraft.city ?? ""}
              />
            </label>
            <label>
              <span>
                招聘开始时间 <b>*</b>
              </span>
              <input
                onChange={(event) =>
                  setJobDraft((item) => ({
                    ...item,
                    startDate: event.target.value,
                  }))
                }
                type="date"
                value={jobDraft.startDate ?? ""}
              />
            </label>
            <label>
              <span>
                招聘截止时间 <b>*</b>
              </span>
              <input
                min={jobDraft.startDate ?? ""}
                onChange={(event) =>
                  setJobDraft((item) => ({
                    ...item,
                    endDate: event.target.value,
                  }))
                }
                type="date"
                value={jobDraft.endDate ?? ""}
              />
            </label>
            <label>
              <span>
                需求人数 <b>*</b>
              </span>
              <input
                min="1"
                onChange={(event) =>
                  setJobDraft((item) => ({ ...item, need: event.target.value }))
                }
                type="number"
                value={jobDraft.need ?? 1}
              />
            </label>
            <label>
              <span>
                面试轮次 <b>*</b>
              </span>
              <select
                onChange={(event) => {
                  const interviewRounds = Number(event.target.value);
                  setJobDraft((item) => ({
                    ...item,
                    interviewRounds,
                    interviewers: Array.from(
                      { length: interviewRounds },
                      (_, index) => item.interviewers?.[index] ?? "",
                    ),
                  }));
                }}
                value={jobDraft.interviewRounds ?? 1}
              >
                {[1, 2, 3, 4, 5].map((rounds) => (
                  <option key={rounds} value={rounds}>
                    {rounds} 轮面试
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                招聘负责人 <b>*</b>
              </span>
              <input
                onChange={(event) =>
                  setJobDraft((item) => ({
                    ...item,
                    recruiter: event.target.value,
                  }))
                }
                placeholder="输入招聘负责人"
                value={jobDraft.recruiter ?? ""}
              />
            </label>
            <label>
              <span>优先级</span>
              <select
                onChange={(event) =>
                  setJobDraft((item) => ({
                    ...item,
                    priority: event.target.value,
                  }))
                }
                value={jobDraft.priority ?? "中"}
              >
                <option>紧急</option>
                <option>高</option>
                <option>中</option>
              </select>
            </label>
            <label>
              <span>招聘状态</span>
              <select
                onChange={(event) =>
                  setJobDraft((item) => ({
                    ...item,
                    status: event.target.value,
                  }))
                }
                value={jobDraft.status ?? "招聘中"}
              >
                <option>招聘中</option>
                <option>暂停招聘</option>
                <option>已关闭</option>
              </select>
            </label>
          </div>
          <section className="recruitment-round-config" aria-label="逐轮面试官配置">
            <div className="platform-section-heading">
              <div>
                <h3>逐轮面试官</h3>
                <p>每一轮都必须从人员名单中选择面试官，创建候选人应聘记录时会自动带入。</p>
              </div>
              <PlatformBadge tone={jobInterviewersComplete ? "success" : "warning"}>
                已配置 {jobDraft.interviewers?.filter(Boolean).length ?? 0} / {jobDraft.interviewRounds ?? 1}
              </PlatformBadge>
            </div>
            <div className="recruitment-round-config__list">
              {Array.from(
                { length: jobDraft.interviewRounds ?? 1 },
                (_, index) => (
                  <label key={index}>
                    <span><b>{index + 1}</b> 第 {index + 1} 轮面试官 <em>*</em></span>
                    <select
                      aria-label={`第 ${index + 1} 轮面试官 *`}
                      onChange={(event) =>
                        setJobDraft((item) => ({
                          ...item,
                          interviewers: Array.from(
                            { length: item.interviewRounds ?? 1 },
                            (_, roundIndex) =>
                              roundIndex === index
                                ? event.target.value
                                : item.interviewers?.[roundIndex] ?? "",
                          ),
                        }))
                      }
                      value={jobDraft.interviewers?.[index] ?? ""}
                    >
                      <option value="">请选择面试官</option>
                      {interviewerOptions.map((person) => (
                        <option key={person}>{person}</option>
                      ))}
                    </select>
                  </label>
                ),
              )}
            </div>
          </section>
        </PlatformDrawer>
      ) : null}
      {candidateEntry ? (
        <PlatformDrawer
          wide
          title="上传候选人并创建应聘记录"
          subtitle="候选人主档 + 岗位应聘记录"
          onClose={() => setCandidateEntry(null)}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setCandidateEntry(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="primary-btn"
                onClick={saveCandidateEntry}
                type="button"
              >
                上传并进入待筛选
              </button>
            </>
          }
        >
          <PlatformNotice>
            手机号优先、邮箱辅助去重。上传简历后创建「待筛选」应聘记录，再进入后续部门确认与面试流程。
          </PlatformNotice>
          <div className="platform-form-grid">
            <label>
              <span>
                候选人姓名 <b>*</b>
              </span>
              <input
                onChange={(event) =>
                  setCandidateDraft((item) => ({
                    ...item,
                    name: event.target.value,
                  }))
                }
                placeholder="输入候选人姓名"
                value={candidateDraft.name ?? ""}
              />
            </label>
            <label>
              <span>
                手机号 <b>*</b>
              </span>
              <input
                onChange={(event) =>
                  setCandidateDraft((item) => ({
                    ...item,
                    phone: event.target.value,
                  }))
                }
                placeholder="用于优先去重"
                value={candidateDraft.phone ?? ""}
              />
            </label>
            <label>
              <span>
                邮箱 <b>*</b>
              </span>
              <input
                onChange={(event) =>
                  setCandidateDraft((item) => ({
                    ...item,
                    email: event.target.value,
                  }))
                }
                placeholder="用于辅助去重"
                value={candidateDraft.email ?? ""}
              />
            </label>
            <label>
              <span>招聘来源</span>
              <select
                onChange={(event) =>
                  setCandidateDraft((item) => ({
                    ...item,
                    source: event.target.value,
                  }))
                }
                value={candidateDraft.source ?? "BOSS直聘"}
              >
                <option>BOSS直聘</option>
                <option>猎聘</option>
                <option>内推</option>
                <option>手动录入</option>
              </select>
            </label>
            <label>
              <span>
                应聘岗位 <b>*</b>
              </span>
              <select
                onChange={(event) => {
                  const job = jobs.find(
                    (item) => item.id === event.target.value,
                  );
                  setCandidateDraft((item) => ({
                    ...item,
                    jobId: event.target.value,
                    owner: job?.recruiter ?? item.owner,
                  }));
                }}
                value={candidateDraft.jobId ?? ""}
              >
                {jobs
                  .filter((job) => job.status === "招聘中")
                  .map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name} · {job.department}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>招聘负责人</span>
              <input
                onChange={(event) =>
                  setCandidateDraft((item) => ({
                    ...item,
                    owner: event.target.value,
                  }))
                }
                value={candidateDraft.owner ?? ""}
              />
            </label>
            <label className="is-wide">
              <span>
                候选人简历 <b>*</b>
              </span>
              <input
                accept=".pdf,.doc,.docx"
                aria-label="候选人简历"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setResumeFile(file);
                  setResumeName(file?.name ?? "");
                }}
                type="file"
              />
              {resumeName ? (
                <small className="recruitment-upload-name">
                  已选择：{resumeName}
                </small>
              ) : (
                <small>支持 PDF、DOC、DOCX 格式</small>
              )}
            </label>
          </div>
          {candidateEntryError ? (
            <PlatformNotice tone="warning">
              {candidateEntryError}
            </PlatformNotice>
          ) : null}
        </PlatformDrawer>
      ) : null}
      {resumePreview ? (
        <PlatformDrawer
          title="候选人简历"
          subtitle={`${resumePreview.name} · ${resumePreview.resumeName}`}
          onClose={() => setResumePreview(null)}
          footer={
            <button
              className="primary-btn"
              onClick={() => setResumePreview(null)}
              type="button"
            >
              完成查看
            </button>
          }
        >
          {resumePreview.resumeFile ? (
            <>
              <PlatformNotice>
                简历查看仅限当前授权数据范围；生产环境应记录查看和下载审计日志。
              </PlatformNotice>
              <a
                className="primary-btn recruitment-resume-open"
                href={URL.createObjectURL(resumePreview.resumeFile)}
                rel="noreferrer"
                target="_blank"
              >
                打开简历文件
              </a>
            </>
          ) : (
            <PlatformNotice tone="warning">
              此历史候选人只保留简历文件名，未保留可预览的原始附件。
            </PlatformNotice>
          )}
        </PlatformDrawer>
      ) : null}
      {current && application ? (
        <PlatformDrawer
          wide
          title={current.name}
          subtitle={`候选人主档 ${current.id} · ${current.source}`}
          onClose={closeDrawer}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={closeDrawer}
                type="button"
              >
                稍后处理
              </button>
              {application.status === "待部门确认" ? (
                <>
                  <button
                    className="ghost-chip"
                    onClick={() => {
                      setMode("reject");
                      setReasonCategory("");
                      setNote("");
                    }}
                    type="button"
                  >
                    不进入面试
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() =>
                      updateApplication("待安排面试", "部门确认进入面试")
                    }
                    type="button"
                  >
                    进入面试
                  </button>
                </>
              ) : application.status === "待面试反馈" ? (
                <>
                  <button
                    className="ghost-chip"
                    onClick={() => {
                      setMode("interviewFail");
                      setReasonCategory("");
                      setNote("");
                    }}
                    type="button"
                  >
                    面试未通过
                  </button>
                  <button
                    className="primary-btn"
                    onClick={passCurrentInterview}
                    type="button"
                  >
                    面试通过
                  </button>
                </>
              ) : application.status === "Offer已发" ? (
                <>
                  <button
                    className="ghost-chip"
                    onClick={() => {
                      setMode("offerReject");
                      setReasonCategory("");
                      setNote("");
                    }}
                    type="button"
                  >
                    Offer 已拒绝
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() =>
                      updateApplication("待入职", "确认 Offer 已接受")
                    }
                    type="button"
                  >
                    确认已接受
                  </button>
                </>
              ) : selectedAction ? (
                <button
                  className="primary-btn"
                  onClick={() => setMode("advance")}
                  type="button"
                >
                  {selectedAction.label}
                </button>
              ) : (
                <button
                  className="primary-btn"
                  onClick={closeDrawer}
                  type="button"
                >
                  完成查看
                </button>
              )}
            </>
          }
        >
          <PlatformNotice>
            操作会更新当前岗位应聘记录，不会覆盖该候选人的其他岗位应聘状态；关键节点将保留版本和处理意见。
          </PlatformNotice>
          <div className="platform-detail-grid">
            <div>
              <span>手机号</span>
              <strong>{current.phone || "待补充"}</strong>
            </div>
            <div>
              <span>邮箱</span>
              <strong>{current.email || "待补充"}</strong>
            </div>
            <div>
              <span>招聘负责人</span>
              <strong>{current.owner}</strong>
            </div>
            <div>
              <span>去重校验</span>
              <PlatformBadge>{current.duplicate ?? "待校验"}</PlatformBadge>
            </div>
            <div>
              <span>候选人简历</span>
              {current.resumeName ? (
                <button
                  className="table-link"
                  onClick={() => setResumePreview(current)}
                  type="button"
                >
                  {current.resumeName}
                </button>
              ) : (
                <strong>历史记录未上传</strong>
              )}
            </div>
            {application.sscEmployeeNo ||
            sscEmploymentStatuses.includes(application.status) ? (
              <div>
                <span>到岗状态（SSC）</span>
                <strong>
                  {currentSscEmployment?.employee
                    ? currentSscEmployment.status
                    : application.status}
                </strong>
                <small>
                  {currentSscEmployment?.employee?.no ??
                    application.sscEmployeeNo ??
                    "SSC 尚未建立员工档案"}
                </small>
              </div>
            ) : null}
          </div>
          <section className="platform-detail-section">
            <div className="platform-section-heading">
              <div>
                <h3>岗位应聘记录</h3>
                <p>选择记录后在下方完成对应流程动作。</p>
              </div>
            </div>
            <div className="platform-application-list">
              {current.applications.map((item) => (
                <button
                  className={item.id === application.id ? "is-selected" : ""}
                  key={item.id}
                  onClick={() => {
                    setSelectedApplicationId(item.id);
                    setMode(null);
                    setNote("");
                    loadInterviewDraft(item);
                  }}
                  type="button"
                >
                  <div>
                    <strong>{item.job}</strong>
                    <span>
                      {item.id} · V{item.version ?? 1}
                    </span>
                  </div>
                  <PlatformBadge>{item.status}</PlatformBadge>
                  <span>
                    面试：第 {item.currentInterviewRound ?? 1}/
                    {item.interviewTotal ?? 1} 轮
                  </span>
                </button>
              ))}
            </div>
          </section>
          <RecruitmentProgress application={application} />
          {application.interviews?.length ? (
            <section
              className="recruitment-interview-rounds"
              aria-label="面试轮次记录"
            >
              {application.interviews.map((item) => (
                <article key={item.round}>
                  <span>第 {item.round} 轮</span>
                  <div>
                    <strong>{item.interviewer || "待分配面试官"}</strong>
                    <small>
                      {item.interviewAt
                        ? item.interviewAt.replace("T", " ")
                        : "待填写面试时间"}
                    </small>
                  </div>
                  <PlatformBadge>{item.status}</PlatformBadge>
                </article>
              ))}
            </section>
          ) : null}
          {mode === "advance" ? (
            <section className="platform-decision-box">
              <PlatformNotice>
                {application.status === "待安排面试"
                  ? `请填写${interviewRoundText(application)}面试官和面试时间后提交安排。`
                  : application.status === "Offer待发"
                    ? "确认 Offer 发放时间及说明后提交。"
                    : application.status === "待入职"
                      ? "到岗状态只读取 SSC 花名册，不在招聘流程中手工维护。"
                      : "请确认本节点已完成。"}
              </PlatformNotice>
              {application.status === "待安排面试" ? (
                <div className="platform-form-grid">
                  <label>
                    <span>
                      {interviewRoundText(application)}面试官 <b>*</b>
                    </span>
                    <select
                      onChange={(event) => setInterviewer(event.target.value)}
                      value={interviewer}
                    >
                      <option value="">请选择面试官</option>
                      {interviewerOptions.map((person) => (
                        <option key={person}>{person}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>
                      {interviewRoundText(application)}面试时间 <b>*</b>
                    </span>
                    <input
                      onChange={(event) => setInterviewAt(event.target.value)}
                      type="datetime-local"
                      value={interviewAt}
                    />
                  </label>
                </div>
              ) : null}
              <label>
                <span>处理说明</span>
                <textarea
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="填写排期、Offer 或入职补充说明"
                  rows={3}
                  value={note}
                />
              </label>
              <button
                className="primary-btn"
                disabled={
                  application.status === "待安排面试" &&
                  (!interviewer.trim() || !interviewAt)
                }
                onClick={() => {
                  if (application.status === "待入职") {
                    syncArrivalFromSsc();
                    return;
                  }
                  const next = selectedAction.next;
                  const action = selectedAction.label;
                  const extra =
                    application.status === "待安排面试"
                      ? {
                          interviewer,
                          interviewAt,
                          interviews: interviewRecordsWith({
                            interviewer,
                            interviewAt,
                            status: "已安排",
                          }),
                        }
                      : application.status === "已安排面试"
                        ? {
                            interviews: interviewRecordsWith({
                              status: "待反馈",
                            }),
                          }
                        : {};
                  updateApplication(next, action, extra);
                }}
                type="button"
              >
                {application.status === "待入职"
                  ? "从 SSC 同步到岗状态"
                  : `确认并推进至「${selectedAction.next}」`}
              </button>
            </section>
          ) : null}
          {needsReason ? (
            <section className="platform-decision-box">
              <label>
                <span>
                  原因分类 <b>*</b>
                </span>
                <select
                  aria-label="原因分类 *"
                  onChange={(event) => setReasonCategory(event.target.value)}
                  value={reasonCategory}
                >
                  <option value="">请选择原因分类</option>
                  {rejectionReasonOptions[mode].map((reasonOption) => (
                    <option key={reasonOption}>{reasonOption}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  {mode === "reject"
                    ? "不进入面试原因"
                    : mode === "interviewFail"
                      ? "面试未通过原因"
                      : "Offer 拒绝原因"}
                  <b> *</b>
                </span>
                <textarea
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="补充具体事实或候选人反馈，便于后续复盘"
                  rows={4}
                  value={note}
                />
              </label>
              <button
                className="primary-btn"
                disabled={!reasonCategory || !note.trim()}
                onClick={() => {
                  const target =
                    mode === "reject"
                      ? "不进入面试"
                      : mode === "interviewFail"
                        ? "面试未通过"
                        : "Offer已拒绝";
                  updateApplication(
                    target,
                    target,
                    mode === "interviewFail"
                      ? { interviews: interviewRecordsWith({ status: "未通过" }) }
                      : {},
                  );
                }}
                type="button"
              >
                确认结论并保留审计记录
              </button>
            </section>
          ) : null}
          <section className="platform-timeline">
            <h3>处理时间线</h3>
            {[...(application.history ?? [])].reverse().map((item, index) => (
              <article key={`${item.time}-${index}`}>
                <i />
                <div>
                  <strong>{item.action}</strong>
                  <span>
                    {item.time} · {item.operator} · {item.note}
                  </span>
                </div>
              </article>
            ))}
          </section>
        </PlatformDrawer>
      ) : null}
      {dailyOpen ? (
        <PlatformDrawer
          wide
          title="填写招聘日报"
          subtitle="日期 + 招聘人员 + 平台 + 岗位"
          onClose={() => setDailyOpen(false)}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setDailyOpen(false)}
                type="button"
              >
                保存草稿
              </button>
              <button
                className="primary-btn"
                onClick={submitDaily}
                type="button"
              >
                提交正式日报
              </button>
            </>
          }
        >
          <PlatformNotice>
            正式提交前必须上传工作截图；提交后该日报进入招聘经营统计。
          </PlatformNotice>
          <div className="platform-form-grid">
            {[
              ["date", "日期", "date"],
              ["recruiter", "招聘人员", "text"],
              ["platform", "招聘平台", "text"],
              ["job", "岗位", "text"],
              ["hello", "打招呼数", "number"],
              ["reply", "回复数", "number"],
              ["resume", "获取简历", "number"],
              ["valid", "有效简历", "number"],
              ["invite", "邀约", "number"],
              ["interview", "面试", "number"],
              ["passed", "面试通过", "number"],
              ["offer", "Offer 发放", "number"],
              ["accepted", "Offer 接受", "number"],
              ["onboarded", "正式入职", "number"],
              ["screenshots", "工作截图数量", "number"],
            ].map(([key, label, type]) => (
              <label key={key}>
                <span>
                  {label}
                  {key === "screenshots" ? <b> *</b> : null}
                </span>
                <input
                  min="0"
                  onChange={(event) =>
                    setDailyDraft((draft) => ({
                      ...draft,
                      [key]:
                        type === "number"
                          ? Number(event.target.value)
                          : event.target.value,
                    }))
                  }
                  type={type}
                  value={dailyDraft[key]}
                />
              </label>
            ))}
          </div>
          {dailyError ? (
            <PlatformNotice tone="warning">{dailyError}</PlatformNotice>
          ) : null}
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

export function TopicCenterPage({ goPage }) {
  const { topics, setTopics, createProjectFromTopic } = useDemoData();
  const [view, setView] = useState("library");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  const [projectMode, setProjectMode] = useState("内部制作");
  const [projectOwner, setProjectOwner] = useState("沈婉瑶");
  const [projectDeadline, setProjectDeadline] = useState("2026-09-02");
  const [projectBudget, setProjectBudget] = useState(220000);
  const [contractFile, setContractFile] = useState(null);
  const [contractError, setContractError] = useState("");
  const [contractPreview, setContractPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [topicDraft, setTopicDraft] = useState({
    name: "",
    template: "编剧模板",
    genre: "",
    audience: "",
    submitter: "张小北",
    summary: "",
  });
  const topicSummary = selectTopicSummary(topics);
  const current = topics.find((item) => item.id === selected?.id) ?? selected;
  const resetProjectDraft = () => {
    setProjectMode("内部制作");
    setProjectOwner("沈婉瑶");
    setProjectDeadline("2026-09-02");
    setProjectBudget(220000);
    setContractFile(null);
    setContractError("");
    setContractPreview(null);
  };
  const updateStatus = (status, extra = {}) => {
    setTopics((items) =>
      items.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              status,
              version: status === "已退回" ? item.version + 1 : item.version,
              ...extra,
            }
          : item,
      ),
    );
    setMode(null);
    setReason("");
  };
  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="选题管理"
        title="选题库、审核与立项"
        description="编剧与制片按固定模板提交；审核通过不自动建项目，执行“选为项目”后才创建唯一项目关联。"
        actions={
          <button className="primary-btn" onClick={() => setCreating(true)} type="button">
            <Plus size={16} />
            新建选题
          </button>
        }
      />
      <PlatformMetrics
        items={[
          {
            label: "本月提交",
            value: topicSummary.total,
            unit: "个",
            meta: "来自选题提交入口",
            tone: "blue",
          },
          {
            label: "待审核",
            value: topicSummary.pending,
            unit: "个",
            meta: "2 个即将超时",
            tone: "amber",
          },
          {
            label: "已通过",
            value: topicSummary.approved,
            unit: "个",
            meta: "其中 6 个待立项",
            tone: "green",
          },
          {
            label: "已退回",
            value: topicSummary.returned,
            unit: "个",
            meta: "平均退回 1.4 次",
            tone: "red",
          },
          {
            label: "已转项目",
            value: topicSummary.converted,
            unit: "个",
            meta: "保留原选题与版本",
            tone: "purple",
          },
          {
            label: "选题转化率",
            value: `${topicSummary.conversionRate}%`,
            meta: "已转项目 ÷ 审核通过",
            tone: "cyan",
          },
        ]}
      />
      <PlatformTabs
        items={[
          { id: "library", label: "选题库", count: topics.length },
          {
            id: "review",
            label: "审核与立项",
            count: topics.filter((item) =>
              ["待审核", "已通过待立项"].includes(item.status),
            ).length,
          },
        ]}
        value={view}
        onChange={setView}
        ariaLabel="选题管理视图"
      />
      <PlatformCard
        title={view === "library" ? "选题库" : "待审核与待立项"}
        description="审核记录、版本、审核人、审核时间与原因永久保留"
      >
        <PlatformFilter
          actions={
            <>
              <button className="ghost-chip" type="button">
                重置
              </button>
              <button className="primary-btn" type="button">
                查询选题
              </button>
            </>
          }
        >
          <label>
            <span>选题名称 / 编号</span>
            <input placeholder="输入关键词" />
          </label>
          <label>
            <span>模板类型</span>
            <select defaultValue="all">
              <option value="all">全部模板</option>
              <option>编剧模板</option>
              <option>制片模板</option>
            </select>
          </label>
          <label>
            <span>审核状态</span>
            <select defaultValue="all">
              <option value="all">全部状态</option>
              <option>待审核</option>
              <option>已退回</option>
              <option>已通过待立项</option>
              <option>已转项目</option>
            </select>
          </label>
          <label>
            <span>提交人 / 审核人</span>
            <input placeholder="输入人员" />
          </label>
        </PlatformFilter>
        <DataTable
          columns={[
            { label: "选题", width: "1.35fr" },
            { label: "模板 / 题材", width: "1.1fr" },
            { label: "目标受众", width: "1.1fr" },
            { label: "提交人", width: "90px" },
            { label: "版本", width: "70px" },
            { label: "状态", width: "130px" },
            { label: "审核人", width: "90px" },
            { label: "关联项目", width: "120px" },
            { label: "更新时间", width: "145px" },
            { label: "操作", width: "72px" },
          ]}
          minWidth={1120}
        >
          {topics
            .filter(
              (item) =>
                view === "library" ||
                ["待审核", "已通过待立项"].includes(item.status),
            )
            .map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns:
                    "1.35fr 1.1fr 1.1fr 90px 70px 130px 90px 120px 145px 72px",
                }}
                key={row.id}
              >
                <div>
                  <strong>{row.name}</strong>
                  <small>{row.id}</small>
                </div>
                <div>
                  <span>{row.template}</span>
                  <small>{row.genre}</small>
                </div>
                <span>{row.audience}</span>
                <span>{row.submitter}</span>
                <strong>V{row.version}</strong>
                <PlatformBadge>{row.status}</PlatformBadge>
                <span>{row.reviewer}</span>
                {row.projectId ? (
                  <button
                    className="table-link"
                    onClick={() => goPage("projects")}
                    type="button"
                  >
                    {row.projectId}
                  </button>
                ) : (
                  <span>—</span>
                )}
                <span>{row.updatedAt}</span>
                <button
                  className="table-link"
                  onClick={() => setSelected(row)}
                  type="button"
                >
                  详情
                </button>
              </div>
            ))}
        </DataTable>
      </PlatformCard>
      {current ? (
        <PlatformDrawer
          wide
          title={current.name}
          subtitle={`${current.id} · ${current.template} · V${current.version}`}
          onClose={() => {
            setSelected(null);
            setMode(null);
            setReason("");
            resetProjectDraft();
          }}
          footer={
            current.status === "待审核" ? (
              <>
                <button
                  className="ghost-chip"
                  onClick={() => setMode("reject")}
                  type="button"
                >
                  退回修改
                </button>
                <button
                  className="primary-btn"
                  onClick={() => updateStatus("已通过待立项")}
                  type="button"
                >
                  审核通过
                </button>
              </>
            ) : current.status === "已通过待立项" ? (
              <button
                className="primary-btn"
                onClick={() => {
                  resetProjectDraft();
                  setMode("project");
                }}
                type="button"
              >
                选为项目
              </button>
            ) : current.projectId ? (
              <button
                className="primary-btn"
                onClick={() => goPage("projects")}
                type="button"
              >
                查看关联项目
              </button>
            ) : null
          }
        >
          <div className="platform-detail-hero">
            <span>
              <Lightbulb size={24} weight="duotone" />
            </span>
            <div>
              <PlatformBadge>{current.status}</PlatformBadge>
              <h3>{current.summary}</h3>
              <p>
                {current.genre} · {current.audience} · 提交人{" "}
                {current.submitter}
              </p>
            </div>
          </div>
          <div className="platform-detail-grid">
            <div>
              <span>当前审核人</span>
              <strong>{current.reviewer}</strong>
            </div>
            <div>
              <span>当前版本</span>
              <strong>V{current.version}</strong>
            </div>
            <div>
              <span>更新时间</span>
              <strong>{current.updatedAt}</strong>
            </div>
            <div>
              <span>关联项目</span>
              <strong>{current.projectId ?? "尚未立项"}</strong>
            </div>
          </div>
          {current.reason ? (
            <PlatformNotice tone="warning">
              最近退回原因：{current.reason}
            </PlatformNotice>
          ) : null}
          {mode === "reject" ? (
            <section className="platform-decision-box">
              <label>
                <span>
                  退回原因 <b>*</b>
                </span>
                <textarea
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="填写具体修改要求"
                  rows={4}
                  value={reason}
                />
              </label>
              <button
                className="primary-btn"
                disabled={!reason.trim()}
                onClick={() => updateStatus("已退回", { reason })}
                type="button"
              >
                确认退回并生成修改任务
              </button>
            </section>
          ) : null}
          {mode === "project" ? (
            <section className="platform-decision-box">
              <div className="platform-form-grid">
                <label>
                  <span>项目负责人</span>
                  <select
                    value={projectOwner}
                    onChange={(event) => setProjectOwner(event.target.value)}
                  >
                    <option>沈婉瑶</option>
                    <option>林制作</option>
                  </select>
                </label>
                <label>
                  <span>制作方式</span>
                  <select
                    value={projectMode}
                    onChange={(event) => {
                      const nextMode = event.target.value;
                      setProjectMode(nextMode);
                      if (nextMode === "内部制作") {
                        setContractFile(null);
                        setContractError("");
                      }
                    }}
                  >
                    <option>内部制作</option>
                    <option>外部制作</option>
                  </select>
                </label>
                <label>
                  <span>预计完成时间</span>
                  <input
                    value={projectDeadline}
                    onChange={(event) => setProjectDeadline(event.target.value)}
                    type="date"
                  />
                </label>
                <label>
                  <span>预计预算</span>
                  <input
                    value={projectBudget}
                    onChange={(event) => setProjectBudget(event.target.value)}
                    type="number"
                  />
                </label>
                {projectMode === "内部制作" ? (
                  <div className="platform-form-field is-wide">
                    <span>内部启用环节</span>
                    <div className="platform-check-row">
                      <label>
                        <input defaultChecked type="checkbox" />
                        剧本
                      </label>
                      <label>
                        <input defaultChecked type="checkbox" />
                        视频
                      </label>
                      <label>
                        <input defaultChecked type="checkbox" />
                        剪辑
                      </label>
                      <label>
                        <input type="checkbox" />
                        配音
                      </label>
                    </div>
                  </div>
                ) : (
                  <ContractUploadField
                    error={contractError}
                    file={contractFile}
                    onChange={setContractFile}
                    onError={setContractError}
                    onView={() =>
                      setContractPreview({
                        name: contractFile.name,
                        size: contractFile.size,
                        type: contractFile.type,
                        file: contractFile,
                      })
                    }
                  />
                )}
              </div>
              <button
                className="primary-btn"
                disabled={projectMode === "外部制作" && !contractFile}
                onClick={() => {
                  createProjectFromTopic(current.id, {
                    mode: projectMode,
                    owner: projectOwner,
                    deadline: projectDeadline,
                    budget: projectBudget,
                    contract: contractFile
                      ? {
                          name: contractFile.name,
                          size: contractFile.size,
                          type: contractFile.type,
                          file: contractFile,
                          uploadedAt: "2026-07-16 09:30",
                        }
                      : null,
                  });
                  setMode(null);
                  resetProjectDraft();
                }}
                type="button"
              >
                创建唯一项目并回写关联
              </button>
            </section>
          ) : null}
          <section className="platform-timeline">
            <article>
              <i />
              <div>
                <strong>V{current.version} 当前版本</strong>
                <span>
                  {current.updatedAt} · {current.submitter}
                </span>
              </div>
            </article>
            <article>
              <i />
              <div>
                <strong>审核记录完整保留</strong>
                <span>
                  expectedVersion V{current.version} · requestId REQ-TOPIC-
                  {current.id.slice(-3)}
                </span>
              </div>
            </article>
          </section>
        </PlatformDrawer>
      ) : null}
      {contractPreview ? (
        <ContractPreviewDrawer
          context={`${current?.name ?? "待立项选题"} · 立项附件`}
          contract={contractPreview}
          onClose={() => setContractPreview(null)}
        />
      ) : null}
      {creating ? (
        <PlatformDrawer
          title="新建选题"
          subtitle="提交后进入统一审核流程"
          onClose={() => setCreating(false)}
          footer={
            <button
              className="primary-btn"
              disabled={!topicDraft.name.trim() || !topicDraft.summary.trim()}
              onClick={() => {
                setTopics((items) => [
                  {
                    ...topicDraft,
                    id: `TOPIC-${Date.now()}`,
                    version: 1,
                    status: "待审核",
                    reviewer: "江晚",
                    updatedAt: "2026-07-16 09:30",
                    projectId: null,
                    reason: "",
                  },
                  ...items,
                ]);
                setCreating(false);
              }}
              type="button"
            >
              提交选题
            </button>
          }
        >
          <div className="platform-form-grid">
            {[
              ["name", "选题名称"],
              ["genre", "题材类型"],
              ["audience", "目标受众"],
              ["submitter", "提交人"],
            ].map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  value={topicDraft[key]}
                  onChange={(event) =>
                    setTopicDraft((draft) => ({ ...draft, [key]: event.target.value }))
                  }
                />
              </label>
            ))}
            <label>
              <span>模板</span>
              <select
                value={topicDraft.template}
                onChange={(event) =>
                  setTopicDraft((draft) => ({ ...draft, template: event.target.value }))
                }
              >
                <option>编剧模板</option>
                <option>制片模板</option>
              </select>
            </label>
            <label className="is-wide">
              <span>选题摘要</span>
              <textarea
                rows={4}
                value={topicDraft.summary}
                onChange={(event) =>
                  setTopicDraft((draft) => ({ ...draft, summary: event.target.value }))
                }
              />
            </label>
          </div>
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

export function ProjectProductionPage() {
  const { projects, setProjects } = useDemoData();
  const [view, setView] = useState("all");
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [contractPreview, setContractPreview] = useState(null);
  const [projectContractError, setProjectContractError] = useState("");
  const [projectDraft, setProjectDraft] = useState({
    name: "",
    mode: "内部制作",
    owner: "沈婉瑶",
    deadline: "2026-08-31",
    budget: 100000,
    manpowerCost: 0,
    computeCost: 0,
    trafficCost: 0,
    contractFile: null,
  });
  const projectSummary = selectProjectSummary(projects);
  const current = projects.find((item) => item.id === selected?.id) ?? selected;
  const currentCost = current ? selectProjectCostBreakdown(current) : null;
  const updateStage = (stageName, progress) =>
    setProjects((items) =>
      items.map((project) =>
        project.id === selected.id
          ? {
              ...project,
              stages: project.stages.map((stage) =>
                stage.name === stageName
                  ? {
                      ...stage,
                      progress,
                      status: progress === 100 ? "已完成" : "进行中",
                    }
                  : stage,
              ),
              status: project.stages.every(
                (stage) =>
                  (stage.name === stageName ? progress : stage.progress) ===
                  100,
              )
                ? "已完成"
                : "进行中",
            }
          : project,
      ),
    );
  const updateInternalCost = (field, value) =>
    setProjects((items) =>
      items.map((project) => {
        if (project.id !== selected.id) return project;
        const currentCosts = selectProjectCostBreakdown(project);
        const nextCosts = {
          manpowerCost: currentCosts.manpowerCost,
          computeCost: currentCosts.computeCost,
          trafficCost: currentCosts.trafficCost,
          [field]: Math.max(0, Number(value) || 0),
        };
        return {
          ...project,
          ...nextCosts,
          actual:
            nextCosts.manpowerCost +
            nextCosts.computeCost +
            nextCosts.trafficCost,
          costUpdatedAt: "2026-07-16 09:30",
        };
      }),
    );
  const visible = projects.filter(
    (project) =>
      view === "all" ||
      project.mode === (view === "internal" ? "内部制作" : "外部制作"),
  );
  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="项目制作管理"
        title="项目台账与并行制作环节"
        description="内部项目按启用环节并行推进，外部项目只维护整体里程碑、进度、成本与内部对接信息。"
        actions={
          <button className="primary-btn" onClick={() => setCreating(true)} type="button">
            <Plus size={16} />
            新建项目
          </button>
        }
      />
      <PlatformMetrics
        items={[
          {
            label: "项目总数",
            value: projectSummary.total,
            unit: "个",
            meta: `内部 ${projectSummary.internal} · 外部 ${projectSummary.external}`,
            tone: "blue",
          },
          {
            label: "进行中",
            value: projectSummary.running,
            unit: "个",
            meta: "本周新增 3 个",
            tone: "purple",
          },
          {
            label: "已完成",
            value: projectSummary.completed,
            unit: "个",
            meta: `平均进度 ${projectSummary.averageProgress}%`,
            tone: "green",
          },
          {
            label: "延期 / 阻塞",
            value: `${projectSummary.delayed} / ${projects.filter((project) => (project.flags ?? []).some((flag) => String(flag).includes("阻塞"))).length}`,
            meta: "独立异常标记",
            tone: "red",
          },
          {
            label: "平均进度",
            value: `${projectSummary.averageProgress}%`,
            meta: "仅统计已启动项目",
            tone: "cyan",
          },
          {
            label: "成本执行率",
            value: `${projectSummary.costExecutionRate}%`,
            meta: `实际 ¥${Math.round(projectSummary.totalActual / 10000)}万 / 预算 ¥${Math.round(projectSummary.totalBudget / 10000)}万`,
            tone: "amber",
          },
        ]}
      />
      <PlatformTabs
        items={[
          { id: "all", label: "项目台账", count: projects.length },
          {
            id: "internal",
            label: "内部制作",
            count: projects.filter((item) => item.mode === "内部制作").length,
          },
          {
            id: "external",
            label: "外部制作",
            count: projects.filter((item) => item.mode === "外部制作").length,
          },
        ]}
        value={view}
        onChange={setView}
        ariaLabel="项目制作视图"
      />
      <PlatformCard
        title="项目列表"
        description="延期、阻塞和退回不替换项目基础状态"
      >
        <PlatformFilter
          actions={
            <>
              <button className="ghost-chip" type="button">
                重置
              </button>
              <button className="primary-btn" type="button">
                查询项目
              </button>
            </>
          }
        >
          <label>
            <span>项目名称 / 编号</span>
            <input placeholder="输入关键词" />
          </label>
          <label>
            <span>制作方式</span>
            <select defaultValue="all">
              <option value="all">全部方式</option>
              <option>内部制作</option>
              <option>外部制作</option>
            </select>
          </label>
          <label>
            <span>基础状态</span>
            <select defaultValue="all">
              <option value="all">全部状态</option>
              <option>进行中</option>
              <option>未开始</option>
              <option>已完成</option>
            </select>
          </label>
          <label>
            <span>异常标记</span>
            <select defaultValue="all">
              <option value="all">全部异常</option>
              <option>延期</option>
              <option>阻塞</option>
              <option>成本超支</option>
            </select>
          </label>
        </PlatformFilter>
        <DataTable
          columns={[
            { label: "项目", width: "1.35fr" },
            { label: "来源选题", width: "110px" },
            { label: "制作方式", width: "110px" },
            { label: "负责人", width: "90px" },
            { label: "基础状态", width: "100px" },
            { label: "整体进度", width: "160px" },
            { label: "异常", width: "110px" },
            { label: "计划完成", width: "110px" },
            { label: "成本", width: "150px" },
            { label: "下一里程碑", width: "110px" },
            { label: "操作", width: "72px" },
          ]}
          minWidth={1210}
        >
          {visible.map((row) => (
            <div
              className="platform-table__row"
              style={{
                gridTemplateColumns:
                  "1.35fr 110px 110px 90px 100px 160px 110px 110px 150px 110px 72px",
              }}
              key={row.id}
            >
              <div>
                <strong>{row.name}</strong>
                <small>{row.id}</small>
              </div>
              <span>{row.topic}</span>
              <PlatformBadge>{row.mode}</PlatformBadge>
              <span>{row.owner}</span>
              <PlatformBadge>{row.status}</PlatformBadge>
              <ProgressBar value={projectProgress(row)} />
              <div className="platform-badge-row">
                {row.flags.length ? (
                  row.flags.map((flag) => (
                    <PlatformBadge key={flag}>{flag}</PlatformBadge>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
              <span>{row.due}</span>
              <div>
                <strong>{formatMoney(row.actual)}</strong>
                <small>/ {formatMoney(row.budget)}</small>
              </div>
              <span>{row.next}</span>
              <button
                className="table-link"
                onClick={() => setSelected(row)}
                type="button"
              >
                详情
              </button>
            </div>
          ))}
        </DataTable>
      </PlatformCard>
      {current ? (
        <PlatformDrawer
          wide
          title={current.name}
          subtitle={`${current.id} · ${current.mode} · 来源 ${current.topic}`}
          onClose={() => setSelected(null)}
        >
          <div className="platform-detail-grid">
            <div>
              <span>项目负责人</span>
              <strong>{current.owner}</strong>
            </div>
            <div>
              <span>基础状态</span>
              <PlatformBadge>{current.status}</PlatformBadge>
            </div>
            <div>
              <span>整体进度</span>
              <strong>{projectProgress(current)}%</strong>
            </div>
            <div>
              <span>异常标记</span>
              <div className="platform-badge-row">
                {current.flags.length
                  ? current.flags.map((flag) => (
                      <PlatformBadge key={flag}>{flag}</PlatformBadge>
                    ))
                  : "无"}
              </div>
            </div>
            <div>
              <span>预计成本</span>
              <strong>{formatMoney(current.budget)}</strong>
            </div>
            <div>
              <span>实际成本</span>
              <strong>{formatMoney(currentCost.total)}</strong>
            </div>
          </div>
          {current.mode === "内部制作" ? (
            <>
              <section className="platform-detail-section platform-project-cost-editor">
                <div className="platform-section-heading">
                  <div>
                    <h3>内部短剧成本录入</h3>
                    <p>三项成本保存后立即计入项目真实成本，并同步经营驾驶舱。</p>
                  </div>
                  <PlatformBadge tone="success">已同步</PlatformBadge>
                </div>
                <div className="platform-project-cost-inputs">
                  {[
                    {
                      field: "manpowerCost",
                      label: "人力成本",
                      note: "编剧、制作、剪辑等内部人力投入",
                    },
                    {
                      field: "computeCost",
                      label: "算力成本",
                      note: "模型生成、渲染与云端算力消耗",
                    },
                    {
                      field: "trafficCost",
                      label: "投流成本",
                      note: "渠道投放、素材测试与流量采买",
                    },
                  ].map((item) => (
                    <label key={item.field}>
                      <span>{item.label}</span>
                      <div className="platform-money-input">
                        <i>¥</i>
                        <input
                          aria-label={item.label}
                          min="0"
                          step="100"
                          type="number"
                          value={currentCost[item.field]}
                          onChange={(event) =>
                            updateInternalCost(item.field, event.target.value)
                          }
                        />
                      </div>
                      <small>{item.note}</small>
                    </label>
                  ))}
                </div>
                <div className="platform-project-cost-total" role="status">
                  <div>
                    <span>项目真实成本</span>
                    <small>人力 + 算力 + 投流</small>
                  </div>
                  <strong>{formatMoney(currentCost.total)}</strong>
                </div>
              </section>
              <section className="platform-detail-section">
              <div className="platform-section-heading">
                <div>
                  <h3>并行制作环节</h3>
                  <p>整体进度 = 所有已启用环节进度的算术平均值</p>
                </div>
                <strong>
                  {current.stages.map((item) => item.progress).join("% + ")}% ÷{" "}
                  {current.stages.length} = {projectProgress(current)}%
                </strong>
              </div>
              <div className="platform-stage-list">
                {current.stages.map((stage) => (
                  <article key={stage.name}>
                    <div>
                      <strong>{stage.name}</strong>
                      <span>负责人：{stage.owner}</span>
                    </div>
                    <PlatformBadge>{stage.status}</PlatformBadge>
                    <ProgressBar value={stage.progress} />
                    <button
                      className="ghost-chip"
                      disabled={stage.progress >= 100}
                      onClick={() =>
                        updateStage(
                          stage.name,
                          Math.min(100, stage.progress + 10),
                        )
                      }
                      type="button"
                    >
                      进度 +10%
                    </button>
                  </article>
                ))}
              </div>
              </section>
            </>
          ) : (
            <section className="platform-detail-section">
              <div className="platform-section-heading">
                <div>
                  <h3>外部制作里程碑</h3>
                  <p>合同、供应商信息和交付节点统一在项目主档中维护。</p>
                </div>
                <PlatformBadge tone={current.contract ? "success" : "warning"}>
                  {current.contract ? "合同已归档" : "合同待补充"}
                </PlatformBadge>
              </div>
              <div className="platform-detail-grid">
                <div>
                  <span>供应商</span>
                  <strong>{current.vendor}</strong>
                </div>
                <div>
                  <span>供应商联系人</span>
                  <strong>{current.contact}</strong>
                </div>
                <div>
                  <span>内部对接人</span>
                  <strong>{current.liaison}</strong>
                </div>
                <div>
                  <span>当前里程碑</span>
                  <strong>{current.next}</strong>
                </div>
              </div>
              <ProgressBar
                value={current.progress}
                label={`外部整体进度 ${current.progress}%`}
              />
              <div className="platform-project-contract">
                <span className="platform-project-contract__icon">
                  <FileText size={22} weight="duotone" />
                </span>
                <div>
                  <span>制作合同</span>
                  <strong>{current.contract?.name ?? "尚未上传合同"}</strong>
                  <small>
                    {current.contract
                      ? `${formatContractSize(current.contract.size)} · ${current.contract.uploadedAt ?? "已归档"}`
                      : "请补充合同后再推进供应商交付"}
                  </small>
                </div>
                <button
                  className="ghost-chip"
                  disabled={!current.contract}
                  onClick={() => setContractPreview(current.contract)}
                  type="button"
                >
                  查看合同
                </button>
              </div>
              <PlatformNotice>
                外部人员本期不登录系统，由内部对接人维护进度、里程碑和成本。
              </PlatformNotice>
            </section>
          )}
          <section className="platform-timeline">
            <article>
              <i />
              <div>
                <strong>最近进度更新</strong>
                <span>
                  2026-07-14 14:51 · {current.owner} · expectedVersion V8
                </span>
              </div>
            </article>
            <article>
              <i />
              <div>
                <strong>项目来源关联</strong>
                <span>{current.topic} · 选题转项目幂等键已记录</span>
              </div>
            </article>
          </section>
        </PlatformDrawer>
      ) : null}
      {contractPreview ? (
        <ContractPreviewDrawer
          context={`${current?.name ?? "外部制作项目"} · 项目归档`}
          contract={contractPreview}
          onClose={() => setContractPreview(null)}
        />
      ) : null}
      {creating ? (
        <PlatformDrawer
          title="新建项目"
          subtitle="独立项目入口；由选题立项的项目会自动带入来源编号"
          onClose={() => setCreating(false)}
          footer={
            <button
              className="primary-btn"
              disabled={
                !projectDraft.name.trim() ||
                !projectDraft.owner.trim() ||
                (projectDraft.mode === "外部制作" && !projectDraft.contractFile)
              }
              onClick={() => {
                setProjects((items) => [
                  {
                    ...projectDraft,
                    budget: Number(projectDraft.budget) || 0,
                    id: `PRJ-${Date.now()}`,
                    status: "未开始",
                    progress: 0,
                    start: "2026-07-16",
                    due: projectDraft.deadline,
                    centers:
                      projectDraft.mode === "内部制作"
                        ? ["内容中心", "AI制作中心", "剪辑中心"]
                        : ["制片中心"],
                    next:
                      projectDraft.mode === "内部制作"
                        ? "项目启动"
                        : "供应商启动",
                    vendor:
                      projectDraft.mode === "外部制作" ? "待录入" : undefined,
                    contact:
                      projectDraft.mode === "外部制作" ? "待录入" : undefined,
                    liaison:
                      projectDraft.mode === "外部制作"
                        ? projectDraft.owner
                        : undefined,
                    contract:
                      projectDraft.mode === "外部制作"
                        ? {
                            name: projectDraft.contractFile.name,
                            size: projectDraft.contractFile.size,
                            type: projectDraft.contractFile.type,
                            file: projectDraft.contractFile,
                            uploadedAt: "2026-07-16 09:30",
                          }
                        : null,
                    actual:
                      projectDraft.mode === "内部制作"
                        ? Number(projectDraft.manpowerCost || 0) +
                          Number(projectDraft.computeCost || 0) +
                          Number(projectDraft.trafficCost || 0)
                        : 0,
                    manpowerCost:
                      projectDraft.mode === "内部制作"
                        ? Number(projectDraft.manpowerCost || 0)
                        : 0,
                    computeCost:
                      projectDraft.mode === "内部制作"
                        ? Number(projectDraft.computeCost || 0)
                        : 0,
                    trafficCost:
                      projectDraft.mode === "内部制作"
                        ? Number(projectDraft.trafficCost || 0)
                        : 0,
                    topicId: null,
                    topic: "独立创建",
                    flags: [],
                    stages:
                      projectDraft.mode === "内部制作"
                        ? [
                            { name: "剧本", owner: projectDraft.owner, progress: 0, status: "未开始" },
                            { name: "视频", owner: "待分配", progress: 0, status: "未开始" },
                            { name: "剪辑", owner: "待分配", progress: 0, status: "未开始" },
                          ]
                        : [],
                    contractFile: undefined,
                  },
                  ...items,
                ]);
                setCreating(false);
              }}
              type="button"
            >
              创建项目
            </button>
          }
        >
          <div className="platform-form-grid">
            <label>
              <span>项目名称</span>
              <input
                value={projectDraft.name}
                onChange={(event) => setProjectDraft((draft) => ({ ...draft, name: event.target.value }))}
              />
            </label>
            <label>
              <span>制作方式</span>
              <select
                value={projectDraft.mode}
                onChange={(event) => {
                  const nextMode = event.target.value;
                  setProjectDraft((draft) => ({
                    ...draft,
                    mode: nextMode,
                    contractFile:
                      nextMode === "内部制作" ? null : draft.contractFile,
                  }));
                  if (nextMode === "内部制作") setProjectContractError("");
                }}
              >
                <option>内部制作</option>
                <option>外部制作</option>
              </select>
            </label>
            <label>
              <span>项目负责人</span>
              <input
                value={projectDraft.owner}
                onChange={(event) => setProjectDraft((draft) => ({ ...draft, owner: event.target.value }))}
              />
            </label>
            <label>
              <span>计划完成</span>
              <input
                type="date"
                value={projectDraft.deadline}
                onChange={(event) => setProjectDraft((draft) => ({ ...draft, deadline: event.target.value }))}
              />
            </label>
            <label>
              <span>预算</span>
              <input
                min="0"
                type="number"
                value={projectDraft.budget}
                onChange={(event) => setProjectDraft((draft) => ({ ...draft, budget: event.target.value }))}
              />
            </label>
            {projectDraft.mode === "内部制作" ? (
              <>
                {[
                  ["manpowerCost", "人力成本"],
                  ["computeCost", "算力成本"],
                  ["trafficCost", "投流成本"],
                ].map(([field, label]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      aria-label={label}
                      min="0"
                      step="100"
                      type="number"
                      value={projectDraft[field]}
                      onChange={(event) =>
                        setProjectDraft((draft) => ({
                          ...draft,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
                <div className="platform-project-cost-preview is-wide">
                  <span>项目初始真实成本</span>
                  <strong>
                    {formatMoney(
                      Number(projectDraft.manpowerCost || 0) +
                        Number(projectDraft.computeCost || 0) +
                        Number(projectDraft.trafficCost || 0),
                    )}
                  </strong>
                  <small>人力成本 + 算力成本 + 投流成本</small>
                </div>
              </>
            ) : (
              <ContractUploadField
                error={projectContractError}
                file={projectDraft.contractFile}
                onChange={(file) =>
                  setProjectDraft((draft) => ({ ...draft, contractFile: file }))
                }
                onError={setProjectContractError}
                onView={() =>
                  setContractPreview({
                    name: projectDraft.contractFile.name,
                    size: projectDraft.contractFile.size,
                    type: projectDraft.contractFile.type,
                    file: projectDraft.contractFile,
                  })
                }
              />
            )}
          </div>
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

export function GovernancePage() {
  const { resetDemoData } = useDemoData();
  const [view, setView] = useState("roles");
  const [resetMessage, setResetMessage] = useState("");
  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="系统配置与审计"
        title="权限、模板、字典与操作留痕"
        description="系统管理员维护基础配置，默认不代行业务审批；所有关键写操作记录版本、幂等键和完整状态变更。"
        actions={
          <>
            <button
              className="ghost-chip"
              onClick={() => {
                resetDemoData();
                setResetMessage("演示业务数据已恢复为初始快照。 ");
              }}
              type="button"
            >
              重置演示数据
            </button>
            <button className="primary-btn" type="button">
              <ShieldCheck size={16} />
              新建授权策略
            </button>
          </>
        }
      />
      {resetMessage ? <div className="platform-access-feedback" role="status">{resetMessage}</div> : null}
      <PlatformMetrics
        items={[
          {
            label: "启用用户",
            value: 126,
            unit: "人",
            meta: "多角色用户 34 人",
            tone: "blue",
          },
          {
            label: "已配置角色",
            value: 11,
            unit: "个",
            meta: "业务角色与数据范围分离",
            tone: "purple",
          },
          {
            label: "缺少负责人节点",
            value: 2,
            unit: "项",
            meta: "已阻止业务推进",
            tone: "red",
          },
          {
            label: "启用模板",
            value: 18,
            unit: "个",
            meta: "绩效 12 · 选题 6",
            tone: "green",
          },
          {
            label: "今日审计事件",
            value: 286,
            unit: "条",
            meta: "写操作 94 条",
            tone: "cyan",
          },
          {
            label: "拒绝 / 冲突",
            value: "1 / 3",
            meta: "均未推进业务状态",
            tone: "amber",
          },
        ]}
      />
      <PlatformTabs
        items={[
          { id: "roles", label: "角色与数据范围" },
          { id: "templates", label: "模板与字典" },
          { id: "audit", label: "审计日志", count: auditLogs.length },
        ]}
        value={view}
        onChange={setView}
        ariaLabel="系统配置视图"
      />
      {view === "roles" ? (
        <div className="platform-dashboard-grid">
          <PlatformCard
            title="业务角色"
            description="人员可兼任多个角色，最终权限为权限点与数据范围的合并"
          >
            <div className="platform-role-list">
              {[
                { name: "普通人员", scope: "本人", permissions: 8, users: 92 },
                {
                  name: "招聘人员",
                  scope: "本人负责的岗位与候选人",
                  permissions: 14,
                  users: 6,
                },
                {
                  name: "部门负责人",
                  scope: "本部门 / 组织子树",
                  permissions: 18,
                  users: 12,
                },
                {
                  name: "选题审核人",
                  scope: "授权选题范围",
                  permissions: 7,
                  users: 5,
                },
                {
                  name: "项目负责人",
                  scope: "本人负责项目",
                  permissions: 16,
                  users: 9,
                },
                {
                  name: "CEO / 经营管理者",
                  scope: "公司级",
                  permissions: 22,
                  users: 2,
                },
              ].map((item) => (
                <article key={item.name}>
                  <span>
                    <ShieldCheck size={18} weight="duotone" />
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.scope}</small>
                  </div>
                  <b>{item.permissions} 个权限点</b>
                  <span>{item.users} 人</span>
                  <button className="table-link" type="button">
                    配置
                  </button>
                </article>
              ))}
            </div>
          </PlatformCard>
          <PlatformCard
            title="独立权限点"
            description="审核、立项和制作方式分配可由不同人员承担"
          >
            <div className="platform-permission-stack">
              {[
                {
                  title: "选题审核",
                  people: "江晚、李晓言",
                  scope: "内容运营中心",
                },
                {
                  title: "选题立项",
                  people: "CEO、林制作",
                  scope: "公司级已通过选题",
                },
                {
                  title: "制作方式分配",
                  people: "林制作",
                  scope: "授权立项项目",
                },
                { title: "绩效最终审批", people: "CEO", scope: "公司级" },
              ].map((item) => (
                <article key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.scope}</span>
                  </div>
                  <PlatformBadge>{item.people}</PlatformBadge>
                </article>
              ))}
            </div>
            <PlatformNotice>
              合并后的权限不得突破任一角色被授权的数据范围；服务端仍需执行行级权限校验。
            </PlatformNotice>
          </PlatformCard>
        </div>
      ) : null}
      {view === "templates" ? (
        <PlatformCard
          title="模板与业务字典"
          description="发布新版本时保留历史版本，不覆盖已引用记录"
        >
          <DataTable
            columns={[
              { label: "类型", width: "120px" },
              { label: "模板 / 字典名称", width: "1.3fr" },
              { label: "适用范围", width: "1.2fr" },
              { label: "当前版本", width: "100px" },
              { label: "状态", width: "100px" },
              { label: "引用数量", width: "90px" },
              { label: "更新时间", width: "150px" },
              { label: "操作", width: "90px" },
            ]}
            minWidth={900}
          >
            {[
              {
                type: "绩效模板",
                name: "剪辑中心·中级剪辑师",
                scope: "剪辑中心",
                version: "V4",
                status: "已发布",
                refs: 18,
                time: "2026-07-08 10:00",
              },
              {
                type: "选题模板",
                name: "编剧固定选题模板",
                scope: "编剧 / 编导",
                version: "V3",
                status: "已发布",
                refs: 24,
                time: "2026-07-12 16:20",
              },
              {
                type: "选题模板",
                name: "制片可行性模板",
                scope: "制片中心",
                version: "V2",
                status: "已发布",
                refs: 11,
                time: "2026-07-10 14:08",
              },
              {
                type: "业务字典",
                name: "项目异常类型",
                scope: "项目制作",
                version: "V5",
                status: "已发布",
                refs: 36,
                time: "2026-07-14 09:42",
              },
            ].map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns:
                    "120px 1.3fr 1.2fr 100px 100px 90px 150px 90px",
                }}
                key={row.name}
              >
                <PlatformBadge>{row.type}</PlatformBadge>
                <strong>{row.name}</strong>
                <span>{row.scope}</span>
                <strong>{row.version}</strong>
                <PlatformBadge>{row.status}</PlatformBadge>
                <span>{row.refs}</span>
                <span>{row.time}</span>
                <button className="table-link" type="button">
                  版本
                </button>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "audit" ? (
        <PlatformCard
          title="关键操作审计"
          description="至少记录业务类型、ID、动作、操作者、角色、前后状态、版本、原因、时间和追踪号"
        >
          <PlatformFilter
            actions={
              <>
                <button className="ghost-chip" type="button">
                  重置
                </button>
                <button className="primary-btn" type="button">
                  查询日志
                </button>
              </>
            }
          >
            <label>
              <span>业务类型 / ID</span>
              <input placeholder="输入业务对象" />
            </label>
            <label>
              <span>动作 / 操作者</span>
              <input placeholder="输入关键词" />
            </label>
            <label>
              <span>结果</span>
              <select defaultValue="all">
                <option value="all">全部结果</option>
                <option>成功</option>
                <option>拒绝</option>
                <option>冲突</option>
              </select>
            </label>
            <label>
              <span>发生时间</span>
              <input defaultValue="2026-07-14" type="date" />
            </label>
          </PlatformFilter>
          <DataTable
            columns={[
              { label: "发生时间", width: "155px" },
              { label: "业务对象", width: "150px" },
              { label: "动作", width: "130px" },
              { label: "操作者 / 角色", width: "1.2fr" },
              { label: "前状态", width: "120px" },
              { label: "后状态", width: "130px" },
              { label: "版本", width: "70px" },
              { label: "requestId", width: "130px" },
              { label: "结果", width: "90px" },
            ]}
            minWidth={1120}
          >
            {auditLogs.map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns:
                    "155px 150px 130px 1.2fr 120px 130px 70px 130px 90px",
                }}
                key={row.requestId}
              >
                <span>{row.time}</span>
                <div>
                  <strong>{row.type}</strong>
                  <small>{row.id}</small>
                </div>
                <strong>{row.action}</strong>
                <div>
                  <span>{row.operator}</span>
                  <small>{row.role}</small>
                </div>
                <span>{row.from}</span>
                <span>{row.to}</span>
                <strong>{row.version}</strong>
                <code>{row.requestId}</code>
                <PlatformBadge>{row.result}</PlatformBadge>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
    </div>
  );
}
