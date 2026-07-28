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
  FileText,
  Image,
  Info,
  Lightbulb,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  Trash,
  Trophy,
  TrendUp,
  UploadSimple,
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
  selectMatchedOperationUploads,
  selectIncludedRecruitmentReports,
  selectMonthlyConsumptionTrend,
  selectOperationMatchingSummary,
  selectRecruitmentDecisionAnalysis,
  selectProjectCostBreakdown,
  selectProjectSummary,
  selectProjectTaskAssignments,
  selectRecruitmentFunnel,
  selectRecruitmentSummary,
  selectTopicSummary,
  selectWorkbenchTasks,
} from "./demoSelectors";
import {
  hongguoWorkColumns,
  hongguoWorkRowsSeed,
} from "./hongguoOperationData";
import {
  applyScriptEpisodeUpload,
  extractDocxText,
  getAffectedScriptCards,
  getScriptCardVersionMap,
  hasScriptCardConflict,
  parseScriptText,
  SCRIPT_DOCX_PATTERN,
  scriptCardNoForEpisode,
  scriptCardRange,
  validateScriptEpisodes,
} from "./scriptLibraryLogic";

const workbenchModuleConfig = {
  绩效: {
    icon: Trophy,
    label: "绩效任务",
    description: "目标确认、结果填报与审批",
    className: "is-performance",
  },
  招聘: {
    icon: UserCirclePlus,
    label: "招聘任务",
    description: "候选人确认与面试反馈",
    className: "is-recruitment",
  },
  选题: {
    icon: Lightbulb,
    label: "选题任务",
    description: "方案修改、评估与立项",
    className: "is-topic",
  },
  项目: {
    icon: Briefcase,
    label: "项目任务",
    description: "角色执行、节点与风险更新",
    className: "is-project",
  },
  周报: {
    icon: CalendarCheck,
    label: "周报任务",
    description: "成果、风险与下周计划",
    className: "is-weekly",
  },
  SSC: {
    icon: Buildings,
    label: "SSC任务",
    description: "人员花名册与入职建档",
    className: "is-ssc",
  },
};

const jobsSeed = [
  {
    id: "JOB-026",
    name: "短剧编剧",
    department: "内容运营中心",
    city: "杭州",
    need: 3,
    onboarded: 1,
    recruiter: "陈璐",
    departmentLeader: "江晚",
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
    departmentLeader: "沈婉瑶",
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
    departmentLeader: "林制作",
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
    departmentLeader: "赵启",
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

const departmentLeaderCatalog = {
  内容运营中心: "江晚",
  剪辑中心: "沈婉瑶",
  制片中心: "林制作",
  运营增长中心: "赵启",
  经营管理部: "陈雨",
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
        status: "待面试反馈",
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
      {
        id: "APP-052",
        job: "增长运营",
        status: "待入职",
        interviewer: "赵启",
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

function normalizeCandidatePhone(value = "") {
  return String(value).replace(/[^\d*]/g, "");
}

function normalizeCandidateEmail(value = "") {
  return String(value).trim().toLocaleLowerCase();
}

function findCandidateDuplicateMatches(candidates, draft) {
  const phone = normalizeCandidatePhone(draft.phone);
  const email = normalizeCandidateEmail(draft.email);

  return candidates.flatMap((candidate) => {
    const fields = [];
    if (phone && normalizeCandidatePhone(candidate.phone) === phone) {
      fields.push("手机号");
    }
    if (email && normalizeCandidateEmail(candidate.email) === email) {
      fields.push("邮箱");
    }
    return fields.length ? [{ candidate, fields }] : [];
  });
}

const recruitmentDailySeed = [
  {
    id: "RD-0714-01",
    date: "2026-07-14",
    recruiter: "陈璐",
    platform: "BOSS直聘",
    job: "中级剪辑师",
    hello: 120,
    interview: 6,
    passed: 3,
    offer: 2,
    accepted: 1,
    onboarded: 1,
    screenshots: 2,
    screenshotFiles: [
      {
        id: "SHOT-RD-0714-01-1",
        name: "陈璐-BOSS直聘-沟通记录.png",
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="#f5f7ff"/><rect x="40" y="36" width="880" height="72" rx="14" fill="#6268df"/><text x="76" y="82" font-family="Arial,sans-serif" font-size="26" fill="white">BOSS直聘 · 招聘沟通日报</text><rect x="40" y="136" width="880" height="420" rx="18" fill="white" stroke="#dce4f2"/><text x="76" y="196" font-family="Arial,sans-serif" font-size="22" fill="#24324a">中级剪辑师</text><text x="76" y="244" font-family="Arial,sans-serif" font-size="18" fill="#66758d">打招呼 120 · 面试 6 · Offer 2</text><rect x="76" y="292" width="680" height="22" rx="11" fill="#dfe4ff"/><rect x="76" y="292" width="520" height="22" rx="11" fill="#6268df"/><rect x="76" y="344" width="680" height="22" rx="11" fill="#e7edf7"/><rect x="76" y="344" width="360" height="22" rx="11" fill="#8d94eb"/></svg>',
        )}`,
      },
      {
        id: "SHOT-RD-0714-01-2",
        name: "陈璐-候选人跟进记录.png",
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="#f3f6fb"/><rect x="42" y="38" width="876" height="524" rx="20" fill="white" stroke="#d9e3f0"/><text x="78" y="96" font-family="Arial,sans-serif" font-size="26" fill="#253552">候选人跟进记录</text><line x1="78" y1="128" x2="882" y2="128" stroke="#e4eaf3"/><text x="78" y="182" font-family="Arial,sans-serif" font-size="18" fill="#617089">面试 6 人 · 通过 3 人 · Offer 2 人</text><circle cx="100" cy="248" r="16" fill="#6268df"/><rect x="136" y="232" width="540" height="18" rx="9" fill="#dfe4ff"/><rect x="136" y="270" width="420" height="14" rx="7" fill="#edf1f7"/><circle cx="100" cy="354" r="16" fill="#8d94eb"/><rect x="136" y="338" width="620" height="18" rx="9" fill="#dfe4ff"/><rect x="136" y="376" width="360" height="14" rx="7" fill="#edf1f7"/></svg>',
        )}`,
      },
    ],
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
    interview: 2,
    passed: 1,
    offer: 1,
    accepted: 0,
    onboarded: 0,
    screenshots: 1,
    screenshotFiles: [
      {
        id: "SHOT-RD-0714-02-1",
        name: "许晴-猎聘-招聘日报.png",
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="#f5f8fc"/><rect x="44" y="42" width="872" height="516" rx="20" fill="white" stroke="#d8e3f0"/><rect x="44" y="42" width="872" height="86" rx="20" fill="#273a58"/><text x="82" y="96" font-family="Arial,sans-serif" font-size="26" fill="white">猎聘 · 制片经理招聘日报</text><text x="82" y="190" font-family="Arial,sans-serif" font-size="20" fill="#31415a">许晴 · 2026-07-14</text><text x="82" y="244" font-family="Arial,sans-serif" font-size="18" fill="#6d7d93">打招呼 54 · 面试 2 · Offer 1</text><rect x="82" y="302" width="760" height="132" rx="16" fill="#eef0ff"/><text x="118" y="358" font-family="Arial,sans-serif" font-size="18" fill="#565dcc">面试 2 人</text><text x="118" y="400" font-family="Arial,sans-serif" font-size="18" fill="#565dcc">Offer 发放 1 人</text></svg>',
        )}`,
      },
    ],
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
    interview: 3,
    passed: 1,
    offer: 0,
    accepted: 0,
    onboarded: 0,
    screenshots: 0,
    screenshotFiles: [],
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
    estimatedEpisodes: 60,
    submitter: "张小北",
    status: "已评估",
    reviewer: "江晚",
    createdAt: "2026-07-02 09:18",
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
    estimatedEpisodes: 24,
    submitter: "沈婉瑶",
    status: "未通过",
    reviewer: "林制作",
    createdAt: "2026-07-03 11:06",
    updatedAt: "2026-07-14 13:42",
    projectId: null,
    reason: "缺少成本与场景可行性说明",
    summary: "发生在深夜便利店中的单元轻喜剧，通过陌生人短暂相遇呈现都市情绪。",
  },
  {
    id: "TOPIC-018",
    name: "《谁说炒菜的不算英雄》",
    template: "编剧模板",
    genre: "现实题材",
    audience: "泛都市用户",
    estimatedEpisodes: 40,
    submitter: "江晚",
    status: "已评估",
    reviewer: "CEO",
    createdAt: "2026-06-28 15:32",
    updatedAt: "2026-07-13 18:06",
    projectId: "PRJ-009",
    reason: "",
    summary: "以烟火餐桌为主线的现实题材项目，采用内部并行制作。",
  },
  {
    id: "TOPIC-036",
    name: "《夏日回响》",
    template: "制片模板",
    genre: "青春情感",
    audience: "年轻女性",
    estimatedEpisodes: 36,
    submitter: "林制作",
    status: "待评估",
    reviewer: "江晚",
    createdAt: "2026-07-04 10:25",
    updatedAt: "2026-07-14 10:18",
    projectId: null,
    reason: "",
    summary: "以海滨小城为背景的青春情感故事，计划评估外部制作方案。",
  },
];

function createSeedScriptEpisodes(total, projectName, overrides = {}) {
  return Array.from({ length: total }, (_, index) => {
    const episodeNo = index + 1;
    return {
      id: `${projectName}-EP-${episodeNo}`,
      episodeNo,
      title: overrides[episodeNo]?.title ?? `${projectName} · 第${episodeNo}集`,
      content: overrides[episodeNo]?.content ?? `第${episodeNo}集示例正文已从原始剧本文档完成结构化入库。`,
      detectedBy: "历史迁移",
      updatedAt: overrides[episodeNo]?.updatedAt ?? "2026-06-30 10:18",
    };
  });
}

function createSeedScriptCardVersions(recordId, episodes, upload, episodeTotal) {
  return Array.from({ length: Math.ceil(episodeTotal / 10) }, (_, index) => {
    const cardNo = index + 1;
    const start = index * 10 + 1;
    const end = Math.min(start + 9, episodeTotal);
    return {
      id: `${recordId}-CARD-${cardNo}-V${upload.version}`,
      cardNo,
      episodeStart: start,
      episodeEnd: end,
      version: upload.version,
      sourceUploadId: upload.id,
      sourceFileName: upload.name,
      uploadedAt: upload.uploadedAt,
      uploadedBy: upload.uploadedBy,
      episodes: episodes.filter((episode) => episode.episodeNo >= start && episode.episodeNo <= end),
    };
  });
}

const script018Upload = {
  id: "SCRIPT-LIB-018-UPLOAD-1",
  scope: "full",
  episodeNo: null,
  name: "谁说炒菜的不算英雄-全剧本-V1.docx",
  size: 2864200,
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  uploadedAt: "2026-06-30 10:18",
  uploadedBy: "江晚",
  version: 1,
};
const script018Episodes = createSeedScriptEpisodes(40, "烟火英雄");
const script026Upload1 = {
  id: "SCRIPT-LIB-026-UPLOAD-1",
  scope: "full",
  episodeNo: null,
  name: "无声档案-完整剧本.docx",
  size: 3268000,
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  uploadedAt: "2026-07-18 15:42",
  uploadedBy: "张小北",
  version: 1,
};
const script026Upload2 = {
  id: "SCRIPT-LIB-026-UPLOAD-2",
  scope: "episode",
  episodeNo: 12,
  name: "无声档案-第12集-修订稿.docx",
  size: 184000,
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  uploadedAt: "2026-07-18 16:20",
  uploadedBy: "张小北",
  version: 2,
};
const script026EpisodesV1 = createSeedScriptEpisodes(60, "无声档案", {
  12: { title: "无声证词", content: "第12集初始版本正文。" },
});
const script026Episodes = script026EpisodesV1.map((episode) => episode.episodeNo === 12
  ? { ...episode, content: "第12集修订后正文，补充关键证词与人物反应。", updatedAt: "2026-07-18 16:20" }
  : episode);
const script026CardVersions = [
  ...createSeedScriptCardVersions("SCRIPT-LIB-026", script026EpisodesV1, script026Upload1, 60),
  {
    id: "SCRIPT-LIB-026-CARD-2-V2",
    cardNo: 2,
    episodeStart: 11,
    episodeEnd: 20,
    version: 2,
    sourceUploadId: script026Upload2.id,
    sourceFileName: script026Upload2.name,
    uploadedAt: script026Upload2.uploadedAt,
    uploadedBy: script026Upload2.uploadedBy,
    episodes: script026Episodes.filter((episode) => episode.episodeNo >= 11 && episode.episodeNo <= 20),
  },
];

const scriptLibrarySeed = [
  {
    id: "SCRIPT-LIB-018",
    topicId: "TOPIC-018",
    status: "已立项",
    projectId: "PRJ-009",
    returnedReason: "",
    updatedAt: "2026-07-13 18:06",
    uploads: [script018Upload],
    episodes: script018Episodes,
    cardVersions: createSeedScriptCardVersions("SCRIPT-LIB-018", script018Episodes, script018Upload, 40),
  },
  {
    id: "SCRIPT-LIB-026",
    topicId: "TOPIC-026",
    status: "待立项",
    projectId: null,
    returnedReason: "",
    updatedAt: "2026-07-18 16:20",
    uploads: [script026Upload1, script026Upload2],
    episodes: script026Episodes,
    cardVersions: script026CardVersions,
  },
];

const TOPIC_SUMMARY_MAX_LENGTH = 5000;
const TOPIC_SUMMARY_COLLAPSE_LENGTH = 240;
const normalizeTopicStatus = (status) =>
  ({
    待审核: "待评估",
    已通过: "已评估",
    已通过待立项: "已评估",
    已转项目: "已评估",
    已退回: "未通过",
  })[status] ?? status;
const topicStatusLabel = normalizeTopicStatus;

const EXTERNAL_VENDOR_COMPANIES = [
  { name: "星云影业", account: "XY-CZ-001" },
  { name: "云帆传媒", account: "YF-CZ-002" },
  { name: "拾光影视", account: "SG-CZ-003" },
];

const externalVendorAccountFor = (companyName) =>
  EXTERNAL_VENDOR_COMPANIES.find((company) => company.name === companyName)
    ?.account ?? "";

const projectsSeed = [
  {
    id: "PRJ-009",
    projectCode: "PRJ-20260518-0001",
    name: "《谁说炒菜的不算英雄》",
    topic: "TOPIC-018",
    genre: "现实题材",
    episodeCount: 40,
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
      { name: "制作", owner: "林制作", progress: 60, status: "进行中" },
      { name: "剪辑", owner: "沈婉瑶", progress: 80, status: "进行中" },
    ],
  },
  {
    id: "PRJ-012",
    projectCode: "PRJ-20260612-0001",
    name: "《夏日回响》",
    topic: "TOPIC-036",
    genre: "青春情感",
    episodeCount: 36,
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
    vendorCompanyName: "星云影业",
    vendorAccount: "XY-CZ-001",
    contact: "王澜",
    vendorContactName: "王澜",
    vendorContactPhone: "138 0571 6628",
    externalScriptShareMode: "all",
    externalScriptCardNo: null,
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
    projectCode: "PRJ-20260728-0001",
    name: "《无声档案》",
    topic: "TOPIC-026",
    genre: "悬疑短剧",
    episodeCount: 60,
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
      { name: "制作", owner: "林制作", progress: 0, status: "未开始" },
      { name: "剪辑", owner: "沈婉瑶", progress: 0, status: "未开始" },
    ],
  },
  {
    id: "PRJ-006",
    projectCode: "PRJ-20260306-0001",
    name: "《记忆修复师》",
    topic: "TOPIC-011",
    genre: "科幻悬疑",
    episodeCount: 60,
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
      { name: "制作", owner: "林制作", progress: 100, status: "已完成" },
      { name: "剪辑", owner: "陈组长", progress: 100, status: "已完成" },
    ],
  },
];

const operationUploadsSeed = [
  {
    id: "OPS-HONGGUO-0708",
    type: "红果作品数据",
    channel: "红果",
    source: "红果后台导出",
    fileName: "作品数据.csv",
    cycle: "2026-02-06 至 2026-07-04",
    uploader: "陆运营",
    uploadedAt: "2026-07-08 11:52",
    summary: `共 ${hongguoWorkRowsSeed.length} 部作品 · ${hongguoWorkColumns.length} 个原始字段`,
    records: hongguoWorkRowsSeed,
  },
];

const projectConsumptionRecordsSeed = [
  { id: "PC-001", projectName: "下山既无敌-终版", episodeCount: 60, cost: 150.78, averageCost: 2.51, createdAt: "2026-04-16 15:17" },
  { id: "PC-002", projectName: "国运食神：废柴少女逆袭记", episodeCount: 30, cost: 121.81, averageCost: 4.06, createdAt: "2026-04-08 14:09" },
  { id: "PC-003", projectName: "海贼王", episodeCount: 3, cost: 104.2, averageCost: 34.73, createdAt: "2026-05-29 14:51" },
  { id: "PC-004", projectName: "下山既无敌（弃）", episodeCount: 60, cost: 48.95, averageCost: 0.82, createdAt: "2026-03-13 16:18" },
  { id: "PC-005", projectName: "玄门重生：开局老婆要离婚", episodeCount: 60, cost: 34.43, averageCost: 0.57, createdAt: "2026-03-16 09:43" },
  { id: "PC-006", projectName: "测试短剧", episodeCount: 6, cost: 14.31, averageCost: 2.39, createdAt: "2026-07-02 18:18" },
  { id: "PC-007", projectName: "入夏", episodeCount: 60, cost: 6.01, averageCost: 0.1, createdAt: "2026-06-03 13:04" },
  { id: "PC-008", projectName: "吴河归魂：我以鬼躯逆仙穹", episodeCount: 30, cost: 3, averageCost: 0.1, createdAt: "2026-03-18 11:17" },
  { id: "PC-009", projectName: "cyp_test", episodeCount: 3, cost: 1.5, averageCost: 0.5, createdAt: "2026-04-09 18:19" },
];

const personnelConsumptionSnapshotsSeed = [
  {
    snapshotMonth: "2026-03",
    records: [
      { username: "王康", videoGenerationCost: 48.95, consumptionCount: 6, totalCost: 48.95, enabled: true, balance: 51.05 },
      { username: "zhizuo1", videoGenerationCost: 43.12, consumptionCount: 21, totalCost: 43.12, enabled: true, balance: 34.14 },
      { username: "布只", videoGenerationCost: 34.43, consumptionCount: 4, totalCost: 34.43, enabled: true, balance: 83.15 },
    ],
  },
  {
    snapshotMonth: "2026-04",
    records: [
      { username: "魏炳源", videoGenerationCost: 150.78, consumptionCount: 16, totalCost: 150.78, enabled: true, balance: 162.73 },
      { username: "乐萍萍", videoGenerationCost: 121.81, consumptionCount: 11, totalCost: 121.81, enabled: true, balance: 190.18 },
    ],
  },
  {
    snapshotMonth: "2026-05",
    records: [
      { username: "zhipian1", videoGenerationCost: 107.2, consumptionCount: 11, totalCost: 107.2, enabled: true, balance: 4.96 },
    ],
  },
  {
    snapshotMonth: "2026-06",
    records: [
      { username: "小柒", videoGenerationCost: 0, consumptionCount: 0, totalCost: 0, enabled: true, balance: 0 },
    ],
  },
  {
    snapshotMonth: "2026-07",
    records: [
      { username: "陈颖鹏", videoGenerationCost: 14.31, consumptionCount: 10, totalCost: 14.31, enabled: true, balance: 85.6 },
    ],
  },
];

const DEMO_DATA_STORAGE_KEY = "kpi-bi:demo-domain-data:v2";

const CONTENT_CODE_CONFIG = {
  scripts: { prefix: "SC", label: "剧本" },
  videos: { prefix: "VD", label: "视频" },
};

function formatProjectCodeDate(value = new Date()) {
  if (typeof value === "string") {
    const matched = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (matched) return `${matched[1]}${matched[2]}${matched[3]}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "20260717";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
}

function clampEpisodeCount(value, fallback = 3) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(9999, Math.max(1, Math.trunc(parsed)));
}

function nextProjectCode(projects, dateValue = new Date()) {
  const datePart = formatProjectCodeDate(dateValue);
  const pattern = new RegExp(`^PRJ-${datePart}-(\\d{4})$`);
  const maxSequence = projects.reduce((max, project) => {
    const match = String(project.projectCode ?? "").match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `PRJ-${datePart}-${String(maxSequence + 1).padStart(4, "0")}`;
}

function buildContentEntries(
  projectCode,
  collection,
  count,
  owner,
  projectStatus = "未开始",
) {
  const config = CONTENT_CODE_CONFIG[collection];
  const status = projectStatus === "已完成" ? "已完成" : projectStatus === "进行中" ? "进行中" : "未开始";
  return Array.from({ length: clampEpisodeCount(count) }, (_, index) => {
    const sequence = index + 1;
    const code = `${projectCode}-${config.prefix}-${String(sequence).padStart(4, "0")}`;
    const versionCode = `${code}-V01`;
    return {
      id: `${collection}-${Date.now()}-${sequence}`,
      code,
      episodeNo: sequence,
      currentVersion: 1,
      versionCode,
      owner: collection === "scripts" ? owner : "待分配",
      status,
      versions: [
        {
          version: 1,
          code: versionCode,
          status: "当前版本",
          createdAt: "2026-07-17 09:30",
        },
      ],
    };
  });
}

function hydrateContentEntries(project, collection) {
  const config = CONTENT_CODE_CONFIG[collection];
  const existing = project[collection] ?? [];
  const targetCount = clampEpisodeCount(
    Math.max(
      Number(
        project[`${collection === "scripts" ? "script" : "video"}Episodes`],
      ) || 0,
      Number(project.episodeCount) || 0,
      existing.length,
      3,
    ),
  );
  const entries = existing.length >= targetCount
    ? existing.slice(0, targetCount)
    : [
        ...existing,
        ...buildContentEntries(
          project.projectCode,
          collection,
          targetCount,
          project.owner,
          project.status,
        ).slice(existing.length),
      ];
  return entries.map((entry, index) => {
    const sequence = Number(entry.episodeNo) || index + 1;
    const code = entry.code ?? `${project.projectCode}-${config.prefix}-${String(sequence).padStart(4, "0")}`;
    const currentVersion = Math.max(1, Number(entry.currentVersion) || 1);
    const versionCode = entry.versionCode ?? `${code}-V${String(currentVersion).padStart(2, "0")}`;
    return {
      ...entry,
      code,
      episodeNo: sequence,
      currentVersion,
      versionCode,
      versions: entry.versions?.length
        ? entry.versions
        : [{ version: currentVersion, code: versionCode, status: "当前版本" }],
    };
  });
}

function hydrateProjectsEncoding(projects) {
  return projects.reduce((result, project) => {
    const normalizedProject = {
      ...project,
      stages: (project.stages ?? []).map((stage) =>
        stage.name === "视频" ? { ...stage, name: "制作" } : stage,
      ),
    };
    const projectCode =
      normalizedProject.projectCode ??
      nextProjectCode(
        result,
        normalizedProject.start ?? normalizedProject.deadline ?? normalizedProject.due,
      );
    const encoded = { ...normalizedProject, projectCode };
    result.push({
      ...encoded,
      scripts: hydrateContentEntries(encoded, "scripts"),
      videos: hydrateContentEntries(encoded, "videos"),
    });
    return result;
  }, []);
}

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
        application.status === "待面试反馈" ? "待反馈" : null;
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
    scriptLibrary: cloneDemoValue(scriptLibrarySeed),
    projects: hydrateProjectsEncoding(cloneDemoValue(projectsSeed)),
    operationUploads: cloneDemoValue(operationUploadsSeed),
    projectConsumptionRecords: cloneDemoValue(projectConsumptionRecordsSeed),
    personnelConsumptionSnapshots: cloneDemoValue(personnelConsumptionSnapshotsSeed),
    updatedAt: "2026-07-16 09:00",
  };
}

function migrateRecruitmentApplication(application) {
  if (application.status !== "已安排面试") return application;
  return {
    ...application,
    status: "待面试反馈",
    interviews: (application.interviews ?? []).map((interview) =>
      interview.status === "已安排"
        ? { ...interview, status: "待反馈" }
        : interview,
    ),
  };
}

function hydrateStoredDemoData(stored = {}) {
  const base = createDemoDataSnapshot();
  const storedCandidates = stored.candidates ?? base.candidates;
  const candidates = [
    ...storedCandidates.map((candidate) => {
      const seedCandidate = base.candidates.find((item) => item.id === candidate.id);
      if (!seedCandidate) {
        return {
          ...candidate,
          applications: (candidate.applications ?? []).map(
            migrateRecruitmentApplication,
          ),
        };
      }
      const storedApplications = candidate.applications ?? [];
      const applications = [
        ...storedApplications.map((application) =>
          migrateRecruitmentApplication({
            ...seedCandidate.applications.find((item) => item.id === application.id),
            ...application,
          }),
        ),
        ...seedCandidate.applications.filter(
          (seedApplication) =>
            !storedApplications.some((item) => item.id === seedApplication.id),
        ),
      ];
      return { ...seedCandidate, ...candidate, applications };
    }),
    ...base.candidates.filter(
      (seedCandidate) =>
        !storedCandidates.some((item) => item.id === seedCandidate.id),
    ),
  ];
  const storedProjects = stored.projects ?? base.projects;
  const projects = hydrateProjectsEncoding(storedProjects.map((project) => {
    const seedProject = base.projects.find((item) => item.id === project.id);
    const merged = {
      ...seedProject,
      ...project,
      name: seedProject?.name ?? project.name,
    };
    if (merged.mode !== "外部制作") return merged;
    return {
      ...merged,
      progress: null,
      due: merged.due ?? merged.deadline ?? "待排期",
      next: merged.next ?? "供应商启动",
      vendor: merged.vendorCompanyName ?? merged.vendor ?? "待录入",
      vendorCompanyName:
        merged.vendorCompanyName ??
        (merged.vendor && merged.vendor !== "待录入" ? merged.vendor : ""),
      vendorAccount:
        merged.vendorAccount ??
        externalVendorAccountFor(merged.vendorCompanyName ?? merged.vendor),
      contact: merged.vendorContactName ?? merged.contact ?? "待录入",
      vendorContactName:
        merged.vendorContactName ??
        (merged.contact && merged.contact !== "待录入" ? merged.contact : ""),
      vendorContactPhone: merged.vendorContactPhone ?? merged.contactPhone ?? "",
      externalScriptShareMode: merged.externalScriptShareMode ?? "all",
      externalScriptCardNo: merged.externalScriptCardNo ?? null,
      liaison: merged.liaison ?? merged.owner ?? "待分配",
    };
  }));
  const storedTopics = stored.topics ?? base.topics;
  const topics = [
    ...storedTopics.map((topic) => {
      const seedTopic = base.topics.find((item) => item.id === topic.id);
      return {
        ...seedTopic,
        ...topic,
        name: seedTopic?.name ?? topic.name,
        summary: seedTopic?.summary ?? topic.summary,
        status: normalizeTopicStatus(topic.status ?? seedTopic?.status),
      };
    }),
    ...base.topics.filter(
      (seedTopic) => !storedTopics.some((topic) => topic.id === seedTopic.id),
    ),
  ];
  const storedScriptLibrary = stored.scriptLibrary ?? base.scriptLibrary;
  const scriptLibrary = [
    ...storedScriptLibrary.map((record) => {
      const seedRecord = base.scriptLibrary.find((item) => item.id === record.id);
      const merged = { ...seedRecord, ...record };
      return {
        ...merged,
        reviewStatus:
          merged.reviewStatus ??
          (merged.status === "已退回"
            ? "已驳回"
            : merged.uploads?.length
              ? "已通过"
              : "未提交"),
        reviewHistory: merged.reviewHistory ?? [],
        downloadRequests: merged.downloadRequests ?? [],
      };
    }),
    ...base.scriptLibrary
      .filter(
        (seedRecord) =>
          !storedScriptLibrary.some((record) => record.id === seedRecord.id),
      )
      .map((seedRecord) => ({
        ...seedRecord,
        reviewStatus: seedRecord.uploads?.length ? "已通过" : "未提交",
        reviewHistory: seedRecord.reviewHistory ?? [],
        downloadRequests: seedRecord.downloadRequests ?? [],
      })),
  ];
  return {
    ...base,
    ...stored,
    candidates,
    projects,
    topics,
    scriptLibrary,
    operationUploads: base.operationUploads,
  };
}

const DemoDataContext = createContext(null);

export function DemoDataProvider({ children }) {
  const [projectInitiationTopicId, setProjectInitiationTopicId] = useState(null);
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
                            note: "已关联 SSC 花名册",
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
      setScriptLibrary: (next) => patchCollection("scriptLibrary", next),
      setProjects: (next) => patchCollection("projects", next),
      setOperationUploads: (next) => patchCollection("operationUploads", next),
      resetDemoData: () => setData(createDemoDataSnapshot()),
      projectInitiationTopicId,
      beginProjectInitiation: (topicId) => setProjectInitiationTopicId(topicId),
      clearProjectInitiation: () => setProjectInitiationTopicId(null),
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
                      status: "待评估",
                      reason: "",
                      version: Number(topic.version ?? 1) + 1,
                      updatedAt: "2026-07-16 09:30",
                    }
                  : topic,
              ),
              updatedAt: "2026-07-16 09:30",
            };
          }
          if (task.sourceType === "project-assignment") {
            return {
              ...current,
              projects: current.projects.map((project) => {
                if (project.id !== task.sourceId) return project;
                const assignments = selectProjectTaskAssignments(project);
                const currentAssignment = assignments.find(
                  (assignment) => assignment.id === task.assignmentId,
                );
                if (!currentAssignment) return project;
                const nextProgress = Math.min(
                  100,
                  Number(payload.progress) || currentAssignment.progress + 20,
                );
                const nextStatus =
                  nextProgress >= 100 ? "已完成" : "进行中";
                const taskAssignments = assignments.map((assignment) =>
                  assignment.id === task.assignmentId
                    ? {
                        ...assignment,
                        progress: nextProgress,
                        completed: Math.min(
                          assignment.total,
                          Math.round((assignment.total * nextProgress) / 100),
                        ),
                        status: nextStatus,
                        acceptedAt:
                          assignment.acceptedAt || "2026-07-17 10:30",
                        updatedAt: "2026-07-17 10:30",
                      }
                    : assignment,
                );
                const stages = (project.stages ?? []).map((stage) =>
                  stage.name === currentAssignment.stage
                    ? {
                        ...stage,
                        owner: currentAssignment.owner,
                        progress: nextProgress,
                        status: nextStatus,
                      }
                    : stage,
                );
                const progress = stages.length
                  ? Math.round(
                      stages.reduce(
                        (sum, stage) => sum + Number(stage.progress ?? 0),
                        0,
                      ) / stages.length,
                    )
                  : project.progress;
                return {
                  ...project,
                  taskAssignments,
                  taskDispatchedAt:
                    project.taskDispatchedAt || "2026-07-17 10:30",
                  stages,
                  progress,
                  status: project.status === "未开始" ? "进行中" : project.status,
                };
              }),
              updatedAt: "2026-07-17 10:30",
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
        return [
          "recruitment",
          "topic",
          "project-assignment",
          "project",
        ].includes(task.sourceType);
      },
    }),
    [data, projectInitiationTopicId],
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
    summary: "完成《谁说炒菜的不算英雄》第 3 集精剪与字幕校对",
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
    from: "待评估",
    to: "已评估",
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
  if (project.mode === "外部制作") return null;
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
      {hideSide || (!meta && !actions) ? null : (
        <div className="platform-header__side">
          {meta ? (
            <div className="platform-header__meta">
              <small>数据状态</small>
              <strong>{meta}</strong>
            </div>
          ) : null}
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

function PlatformFilter({ children, actions, className = "" }) {
  return (
    <section className={`platform-filter ${className}`.trim()}>
      <div className="platform-filter__fields">{children}</div>
      {actions ? <div className="platform-filter__actions">{actions}</div> : null}
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
  className = "",
  ariaHidden = false,
}) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className="platform-drawer-mask"
      inert={ariaHidden || undefined}
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        aria-label={title}
        aria-modal="true"
        className={`platform-drawer ${wide ? "is-wide" : ""} ${className}`.trim()}
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

function PlatformConfirmDialog({ title, description, onClose, footer, children }) {
  return (
    <div className="platform-confirm-mask" role="presentation">
      <section
        aria-label={title}
        aria-modal="true"
        className="platform-confirm-dialog"
        role="dialog"
      >
        <header>
          <span className="platform-confirm-dialog__icon" aria-hidden="true">
            <WarningCircle size={24} weight="fill" />
          </span>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            aria-label="关闭重复信息提示"
            className="platform-icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>
        <div className="platform-confirm-dialog__body">{children}</div>
        <footer>{footer}</footer>
      </section>
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

function topicAttachmentTypeLabel(attachment) {
  const name = attachment?.name?.toLowerCase() ?? "";
  const type = attachment?.type ?? "";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "PDF 文件";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(name)) return "图片文件";
  if (type.startsWith("text/") || /\.(txt|md|csv)$/.test(name)) return "文本文件";
  if (/\.(doc|docx)$/.test(name)) return "Word 文件";
  if (/\.(xls|xlsx)$/.test(name)) return "Excel 文件";
  if (/\.(ppt|pptx)$/.test(name)) return "PowerPoint 文件";
  return "通用文件";
}

function TopicAttachmentUploadField({
  file,
  error,
  onChange,
  onError,
  onRemove,
  onView,
}) {
  return (
    <div className="platform-form-field is-wide">
      <span>选题附件</span>
      <div className="platform-contract-upload-shell">
        <label className="platform-contract-upload">
          <span className="platform-contract-upload__icon">
            <FileText size={20} weight="duotone" />
          </span>
          <span className="platform-contract-upload__copy">
            <strong>{file?.name ?? "选择选题说明或参考文件"}</strong>
            <small>
              {file
                ? `${formatContractSize(file.size)} · 点击可重新选择`
                : "支持 PDF、Word、Excel、PPT、图片和文本，单个文件不超过 20 MB"}
            </small>
          </span>
          <span className="platform-contract-upload__action">
            {file ? "更换文件" : "选择文件"}
          </span>
          <input
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.md,.csv"
            aria-label="上传选题附件"
            className="platform-contract-upload__input"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              const extension = selectedFile?.name.split(".").pop()?.toLowerCase();
              const allowedExtensions = [
                "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
                "png", "jpg", "jpeg", "webp", "txt", "md", "csv",
              ];
              if (selectedFile && !allowedExtensions.includes(extension)) {
                onChange(null);
                onError("附件格式不受支持，请上传文档、表格、演示文稿、图片或文本文件");
                return;
              }
              if (selectedFile && selectedFile.size > 20 * 1024 * 1024) {
                onChange(null);
                onError("附件不能超过 20 MB");
                return;
              }
              onChange(selectedFile);
              onError("");
            }}
            type="file"
          />
        </label>
        {file ? (
          <div className="platform-contract-upload__controls">
            <button
              className="ghost-chip platform-contract-upload__view"
              onClick={onView}
              type="button"
            >
              预览文件
            </button>
            {onRemove ? (
              <button
                className="ghost-chip platform-contract-upload__remove"
                onClick={onRemove}
                type="button"
              >
                移除附件
              </button>
            ) : null}
          </div>
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

function TopicAttachmentPreviewDrawer({ attachment, context, onClose }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const fileType = topicAttachmentTypeLabel(attachment);
  const isImage = fileType === "图片文件";
  const isInlineDocument = ["PDF 文件", "文本文件"].includes(fileType);

  useEffect(() => {
    const isPreviewableFile =
      typeof Blob !== "undefined" && attachment?.file instanceof Blob;
    if (!isPreviewableFile || typeof URL.createObjectURL !== "function") {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(attachment.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment?.file]);

  if (!attachment) return null;
  return (
    <PlatformDrawer
      wide
      title="选题附件"
      subtitle={`${context} · ${attachment.name}`}
      onClose={onClose}
      footer={
        <button className="primary-btn" onClick={onClose} type="button">
          完成查看
        </button>
      }
    >
      <div className="platform-contract-preview__meta">
        <div><span>文件名称</span><strong>{attachment.name}</strong></div>
        <div><span>文件大小</span><strong>{formatContractSize(attachment.size)}</strong></div>
        <div><span>文件类型</span><strong>{fileType}</strong></div>
        <div><span>上传时间</span><strong>{attachment.uploadedAt ?? "本次提交"}</strong></div>
      </div>
      <PlatformNotice>
        附件随选题版本保留；正式环境需记录查看与下载审计日志。
      </PlatformNotice>
      {isImage && previewUrl ? (
        <div className="platform-topic-attachment-preview__image">
          <img alt={`${attachment.name} 内容预览`} src={previewUrl} />
        </div>
      ) : isInlineDocument && previewUrl ? (
        <iframe
          className="platform-contract-preview__frame"
          src={previewUrl}
          title={`${attachment.name} 内容预览`}
        />
      ) : previewUrl ? (
        <div className="platform-contract-preview__fallback">
          <FileText size={34} weight="duotone" />
          <strong>{fileType}已就绪</strong>
          <p>该格式无法稳定内嵌预览，请打开原文件查看完整内容。</p>
          <a className="primary-btn" href={previewUrl} rel="noreferrer" target="_blank">
            打开原文件
          </a>
        </div>
      ) : (
        <PlatformNotice tone="warning">
          当前仅保留附件信息，原始文件尚未接入持久化文件存储。
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

function DataTable({ columns, children, minWidth = 980, className = "" }) {
  return (
    <div className="platform-table-wrap">
      <div className={`platform-table ${className}`.trim()} style={{ minWidth }}>
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
      subtitle={`${task.module}${["选题", "项目"].includes(task.module) ? ` · ${task.businessId}` : ""} · ${task.title}`}
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
          <span>任务负责人</span>
          <strong>{task.owner}</strong>
        </div>
        <div>
          <span>基础状态</span>
          <PlatformBadge>{task.status}</PlatformBadge>
        </div>
        <div>
          <span>任务下发时间</span>
          <strong>{task.issuedAt || "待记录"}</strong>
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
            <span>{["选题", "项目"].includes(task.module) ? `${task.businessId} · ` : ""}任务上下文已自动带入</span>
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

function WorkbenchTaskDetailDrawer({ task, onClose, onEnter }) {
  const detail = task.detail ?? {};
  const moduleConfig = workbenchModuleConfig[task.module] ?? workbenchModuleConfig.项目;
  const ModuleIcon = moduleConfig.icon;

  return (
    <PlatformDrawer
      title={task.title}
      subtitle={`${task.module}${["选题", "项目"].includes(task.module) && task.businessId ? ` · ${task.businessId}` : ""}`}
      onClose={onClose}
      footer={
        <>
          <button className="ghost-chip" onClick={onClose} type="button">
            稍后处理
          </button>
          <button className="primary-btn" onClick={onEnter} type="button">
            进入业务详情
            <ArrowRight size={16} />
          </button>
        </>
      }
    >
      <section className={`platform-task-detail-hero ${moduleConfig.className}`}>
        <span className="platform-task-detail-hero__icon">
          <ModuleIcon size={21} weight="duotone" />
        </span>
        <div>
          <small>{detail.subjectLabel || "任务对象"}</small>
          <h3>{detail.subject || task.title}</h3>
          <p>{detail.summary || task.description}</p>
        </div>
        <div className="platform-task-detail-hero__status">
          <span>{moduleConfig.label}</span>
          <PlatformBadge>{task.status}</PlatformBadge>
        </div>
      </section>

      <div className="platform-task-detail-overview platform-task-detail-overview--three" aria-label="任务关键信息">
        <div>
          <span>处理角色</span>
          <strong>{task.assigneeRole || `${task.module}处理人`}</strong>
        </div>
        <div>
          <span>任务来源</span>
          <strong>{detail.sourceLabel || task.module}</strong>
        </div>
        <div>
          <span>任务下发时间</span>
          <strong>{task.issuedAt || "待记录"}</strong>
        </div>
      </div>

      <section className="platform-task-detail-section is-requirement">
        <header>
          <span><CheckCircle size={17} weight="duotone" /></span>
          <div>
            <h3>本次任务要求</h3>
            <small>完成当前任务时需要处理的具体事项</small>
          </div>
        </header>
        <p>{detail.requirement || task.description}</p>
      </section>

      {detail.note ? (
        <section className="platform-task-detail-note">
          <span><WarningCircle size={18} weight="duotone" /></span>
          <div>
            <strong>{detail.noteLabel || "需要关注"}</strong>
            <p>{detail.note}</p>
          </div>
        </section>
      ) : null}
    </PlatformDrawer>
  );
}

export function UnifiedWorkbenchPage({
  goPage,
  activeRole = "ceo",
  people = [],
  reviews = [],
  weeklyReports = [],
}) {
  const { candidates, topics, projects, updatedAt } = useDemoData();
  const [tab, setTab] = useState("todo");
  const [selectedTask, setSelectedTask] = useState(null);
  const scopedTasks = useMemo(
    () =>
      selectWorkbenchTasks({
        candidates,
        topics,
        projects,
        reviews,
        weeklyReports,
        people,
      })
        .filter((item) => {
          if (activeRole === "employee") return item.owner === "张小北";
          if (activeRole === "leader")
            return ["张小北", "江晚", "林制作", "沈婉瑶"].includes(item.owner);
          if (activeRole === "hr")
            return ["绩效", "招聘", "周报", "SSC"].includes(item.module);
          return true;
        }),
    [activeRole, candidates, people, projects, reviews, topics, weeklyReports],
  );
  const taskCounts = useMemo(
    () => ({
      todo: scopedTasks.filter((item) => item.status === "待处理").length,
      returned: scopedTasks.filter((item) => item.status === "已退回").length,
      done: scopedTasks.filter((item) => item.status === "已完成").length,
    }),
    [scopedTasks],
  );
  const tasks = useMemo(
    () =>
      scopedTasks.filter((item) => {
        if (tab === "returned") return item.status === "已退回";
        if (tab === "done") return item.status === "已完成";
        return item.status === "待处理";
      }),
    [scopedTasks, tab],
  );
  const activeStatusLabel = {
    todo: "待处理",
    returned: "已退回",
    done: "已完成",
  }[tab];

  return (
    <div className="platform-page platform-workbench-page">
      <PlatformHeader
        eyebrow="统一任务中心"
        title="任务工作台"
        description="集中查看绩效、招聘、项目、周报与 SSC 任务，并返回来源业务完成处理。"
        meta={`更新于 ${updatedAt}`}
      />
      <PlatformMetrics
        items={[
          {
            id: "todo",
            label: "我的待处理",
            value: taskCounts.todo,
            unit: "项",
            meta: `来源业务单据 ${taskCounts.todo} 条`,
            tone: "blue",
            icon: <FileText size={19} weight="duotone" />,
          },
          {
            id: "returned",
            label: "已退回",
            value: taskCounts.returned,
            unit: "项",
            meta: "需要修改后重新提交",
            tone: "purple",
            icon: <WarningCircle size={19} weight="duotone" />,
          },
          {
            id: "done",
            label: "当前已完成",
            value: taskCounts.done,
            unit: "项",
            meta: "已完成的来源业务任务",
            tone: "green",
            icon: <CheckCircle size={19} weight="duotone" />,
          },
        ]}
        onSelect={(item) => setTab(item.id)}
      />
      <PlatformCard
        className="platform-workbench-card platform-workbench-card--tasks"
        title="任务清单"
        description="任务按状态归类，点击卡片可查看要求并进入来源业务"
        action={
          <PlatformTabs
            items={[
              { id: "todo", label: "待处理", count: taskCounts.todo },
              { id: "returned", label: "退回", count: taskCounts.returned },
              { id: "done", label: "已完成", count: taskCounts.done },
            ]}
            value={tab}
            onChange={setTab}
            ariaLabel="工作台任务筛选"
          />
        }
      >
        <div className="platform-workbench-list-summary" aria-live="polite">
          <div>
            <span>{activeStatusLabel}</span>
            <strong>{tasks.length} 项任务</strong>
          </div>
          <small>按任务下发时间展示，处理结果会自动同步至工作台</small>
        </div>
        <div
          className={`platform-task-list platform-task-list--board ${tasks.length === 1 ? "is-single" : ""}`.trim()}
        >
          {tasks.map((task) => {
            const moduleConfig = workbenchModuleConfig[task.module] ?? workbenchModuleConfig.项目;
            const TaskIcon = moduleConfig.icon;
            return (
              <article className={moduleConfig.className} key={task.id}>
                <button
                  aria-label={`${task.title}${["选题", "项目"].includes(task.module) && task.businessId ? ` · ${task.businessId}` : ""}`}
                  className="platform-task-list__main"
                  onClick={() => setSelectedTask(task)}
                  type="button"
                >
                  <span className="platform-task-list__icon">
                    <TaskIcon size={20} weight="duotone" />
                  </span>
                  <div className="platform-task-list__content">
                    <div className="platform-task-list__meta">
                      <span>{task.module}</span>
                      {["选题", "项目"].includes(task.module) && task.businessId ? (
                        <i>{task.businessId}</i>
                      ) : null}
                      <time>{task.issuedAt || "待记录"}</time>
                    </div>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <footer>
                      <span>来源 · {task.detail?.sourceLabel || task.module}</span>
                      <PlatformBadge>{task.status}</PlatformBadge>
                      <b>
                        查看详情
                        <ArrowRight size={15} />
                      </b>
                    </footer>
                  </div>
                </button>
              </article>
            );
          })}
          {!tasks.length ? (
            <PlatformEmpty
              title={`当前没有${activeStatusLabel}任务`}
              description="任务状态变化后，工作台会自动同步更新。"
            />
          ) : null}
        </div>
      </PlatformCard>
      {selectedTask ? (
        <WorkbenchTaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEnter={() => {
            goPage(selectedTask.destination, {
              task: selectedTask.quickAction === false ? null : selectedTask,
            });
            setSelectedTask(null);
          }}
        />
      ) : null}
    </div>
  );
}

function RecruitmentFunnel({ compact = false, reports = [] }) {
  const recruitmentFunnel = selectRecruitmentFunnel(reports);
  const max = recruitmentFunnel[0].value || 1;
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

function formatChartMoney(value) {
  const amount = Number(value ?? 0);
  if (amount >= 10000) {
    const tenThousands = amount / 10000;
    return `${Number.isInteger(tenThousands) ? tenThousands : tenThousands.toFixed(1)}万`;
  }
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}千`;
  return amount ? `¥${Number(amount.toFixed(2))}` : "0";
}

function MonthlyProjectFinancialTrend({
  period,
  personnelConsumptionSnapshots = [],
  projectConsumptionRecords = [],
}) {
  const data = selectMonthlyConsumptionTrend(
    { projectConsumptionRecords, personnelConsumptionSnapshots },
    period.start,
    period.end,
  );
  const projectAmount = data.reduce(
    (sum, item) => sum + item.projectAmount,
    0,
  );
  const personnelCost = data.reduce(
    (sum, item) => sum + item.personnelCost,
    0,
  );
  const projectCount = data.reduce(
    (sum, item) => sum + item.projectCount,
    0,
  );

  return (
    <section
      aria-label="月度项目金额与人员消耗趋势"
      className="platform-financial-trend"
    >
      <div className="platform-financial-trend__summary">
        <div>
          <span>范围内项目金额</span>
          <strong>{formatMoney(projectAmount)}</strong>
        </div>
        <div>
          <span>范围内人员消耗</span>
          <strong>{formatMoney(personnelCost)}</strong>
        </div>
        <div>
          <span>归集项目</span>
          <strong>{projectCount}<small> 个</small></strong>
        </div>
      </div>
      <div className="platform-financial-trend__legend" aria-hidden="true">
        <span className="is-project">项目实际金额</span>
        <span className="is-personnel">人员消耗</span>
      </div>
      <div className="platform-financial-trend__chart-scroll">
        <div
          aria-label="月度项目金额和人员消耗折线图"
          className="platform-financial-trend__chart"
          role="img"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              accessibilityLayer
              data={data}
              margin={{ top: 20, right: 18, bottom: 4, left: 0 }}
            >
              <CartesianGrid stroke="#e9edf5" strokeDasharray="3 4" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                interval={0}
                tick={{ fill: "#68768a", fontSize: 10 }}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "#8a97aa", fontSize: 9 }}
                tickFormatter={formatChartMoney}
                tickLine={false}
                width={54}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #dfe6f2",
                  borderRadius: 10,
                  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.1)",
                  fontSize: 11,
                }}
                formatter={(value, name) => [
                  formatMoney(value),
                  name === "projectAmount" ? "项目实际金额" : "人员消耗",
                ]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                labelStyle={{ color: "#172033", fontWeight: 700 }}
              />
              <Line
                activeDot={{ r: 5, fill: "#6268df", stroke: "#fff", strokeWidth: 2 }}
                dataKey="projectAmount"
                dot={{ r: 3.5, fill: "#fff", stroke: "#6268df", strokeWidth: 2 }}
                stroke="#6268df"
                strokeWidth={2.7}
                type="monotone"
              />
              <Line
                activeDot={{ r: 5, fill: "#14b8a6", stroke: "#fff", strokeWidth: 2 }}
                dataKey="personnelCost"
                dot={{ r: 3.5, fill: "#fff", stroke: "#14b8a6", strokeWidth: 2 }}
                stroke="#14b8a6"
                strokeWidth={2.5}
                type="monotone"
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
          className="platform-table--single-line"
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
  const selectedUploads = selectMatchedOperationUploads(
    selectedProject,
    operationUploads,
  );
  const selectedUploadRecords = selectedUploads.flatMap(
    (upload) => upload.records ?? [],
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
  const operationMatchingSummary = selectOperationMatchingSummary(
    projects,
    operationUploads,
  );
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
  const projectLedgerColumns = [
    { label: "项目", width: "minmax(180px, 1.45fr)" },
    { label: "状态 / 制作方式", width: "minmax(120px, 0.82fr)" },
    { label: "开始时间 / 截止时间", width: "minmax(190px, 1.2fr)" },
    { label: "整体进度", width: "minmax(115px, 0.82fr)" },
    { label: "实际成本 / 预算", width: "minmax(145px, 1fr)" },
    { label: "运营匹配数据", width: "minmax(175px, 1.16fr)" },
    { label: "操作", width: "minmax(55px, 0.34fr)" },
  ];
  const projectLedgerGridTemplate = projectLedgerColumns
    .map((column) => column.width)
    .join(" ");

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
            label: "运营数据匹配率",
            value: `${operationMatchingSummary.matchRate}%`,
            meta: `${operationMatchingSummary.matchedRecords} 条已匹配 · ${operationMatchingSummary.unmatchedRecords} 条待匹配`,
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
          title="运营数据名称匹配"
          description="红果数据由其他入口导入，系统按作品名称与项目名称自动匹配"
          action={
            <PlatformBadge tone={operationMatchingSummary.unmatchedRecords ? "warning" : "success"}>
              已匹配 {operationMatchingSummary.matchedRecords} / {operationMatchingSummary.totalImportedRecords}
            </PlatformBadge>
          }
        >
          <div className="platform-operation-overview">
            <div className="platform-operation-overview__score">
              <div className="platform-donut is-green" style={{ "--value": `${operationMatchingSummary.matchRate}%` }}>
                <b>{operationMatchingSummary.matchRate}%</b>
              </div>
              <div>
                <strong>{operationMatchingSummary.matchedRecords} 条作品数据已匹配</strong>
                <span>覆盖 {operationMatchingSummary.matchedProjects} / {projects.length} 个项目</span>
              </div>
            </div>
            <div className="platform-operation-overview__types">
              <span>红果后台导出 <b>{operationUploads.length} 份</b></span>
              <span>已匹配 <b>{operationMatchingSummary.matchedRecords} 条</b></span>
              <span>待匹配 <b>{operationMatchingSummary.unmatchedRecords} 条</b></span>
            </div>
            <small>名称会先去除书名号、空格并统一全半角；匹配成功的数据才进入对应项目。</small>
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
        description="按项目查看状态、周期、成本及红果运营数据名称匹配结果"
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
          className="platform-table--single-line"
          columns={projectLedgerColumns}
          minWidth={1080}
        >
          {visibleProjects.map((project) => {
            const uploads = selectMatchedOperationUploads(
              project,
              operationUploads,
            );
            const latestUpload = uploads[0];
            const uploadedRecordCount = uploads.reduce(
              (total, upload) => total + (upload.records?.length ?? 0),
              0,
            );
            return (
              <div
                className="platform-table__row platform-project-ledger-row"
                style={{
                  gridTemplateColumns: projectLedgerGridTemplate,
                }}
                key={project.id}
              >
                <div className="platform-table-inline-cell">
                  <strong>{project.name}</strong>
                  <small>{project.projectCode}</small>
                  <small>负责人 {project.owner}</small>
                </div>
                <div className="platform-badge-row">
                  <PlatformBadge>{project.status}</PlatformBadge>
                  <PlatformBadge tone={project.mode === "内部制作" ? "primary" : "neutral"}>
                    {project.mode}
                  </PlatformBadge>
                </div>
                <div className="platform-project-period">
                  <span><i>始</i>{project.start}</span>
                  <span><i>止</i>{project.due}</span>
                </div>
                {project.mode === "外部制作" ? (
                  <span className="platform-progress-exempt">不统计</span>
                ) : (
                  <ProgressBar value={projectProgress(project)} />
                )}
                <div className="platform-table-inline-cell">
                  <strong>{formatMoney(project.actual)}</strong>
                  <small>预算 {formatMoney(project.budget)}</small>
                </div>
                <button
                  className={`platform-operation-link ${uploads.length ? "is-linked" : ""}`}
                  onClick={() => setSelectedProjectId(project.id)}
                  type="button"
                >
                  <strong>{uploads.length ? `已匹配 ${uploadedRecordCount} 条数据` : "暂无匹配数据"}</strong>
                  <small>{latestUpload ? `${latestUpload.source} · 名称一致` : "等待同名作品数据"}</small>
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
          subtitle={`${selectedProject.projectCode} · ${selectedProject.mode} · 运营数据按名称自动匹配`}
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
                  goPage("project-management");
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
              <span>实际成本 / 预算</span>
              <strong>{formatMoney(selectProjectCostBreakdown(selectedProject).total)} / {formatMoney(selectedProject.budget)}</strong>
            </div>
            <div>
              <span>项目人员消耗金额</span>
              <strong>
                {selectedProject.mode === "内部制作"
                  ? formatMoney(
                      selectProjectCostBreakdown(selectedProject).manpowerCost,
                    )
                  : "未单独核算"}
              </strong>
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
                <h3>运营导入数据</h3>
                <p>匹配规则：项目名称“{selectedProject.name}”与红果作品名称一致</p>
              </div>
              <PlatformBadge tone={selectedUploads.length ? "success" : "warning"}>
                {selectedUploads.length ? `匹配成功 · ${selectedUploadRecords.length} 条` : "未匹配"}
              </PlatformBadge>
            </div>
            {selectedUploads.length ? (
              <div className="platform-operation-upload-list">
                {selectedUploads.map((upload) => (
                  <section className="platform-operation-upload-batch" key={upload.id}>
                    <header>
                      <span>
                        <FileText size={18} weight="duotone" />
                      </span>
                      <div>
                        <strong>{upload.fileName}</strong>
                        <p>{upload.source} · 本批次匹配 {upload.records.length} 条 / 原文件 {upload.importedRecordCount} 条</p>
                        <small>{upload.cycle} · {upload.uploader} 上传于 {upload.uploadedAt}</small>
                      </div>
                      <PlatformBadge tone="primary">CSV</PlatformBadge>
                    </header>
                    <div className="platform-operation-raw-table-shell">
                      <table
                        aria-label={`${upload.fileName} 数据明细`}
                        className="platform-operation-raw-table"
                      >
                        <thead>
                          <tr>
                            {hongguoWorkColumns.map((column) => (
                              <th key={column.key} style={{ minWidth: column.width }}>
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(upload.records ?? []).map((record) => (
                            <tr key={record.workId}>
                              {hongguoWorkColumns.map((column) => (
                                <td key={column.key}>
                                  {column.key === "coverUrl" ? (
                                    <a
                                      href={record.coverUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      查看封面
                                    </a>
                                  ) : (
                                    record[column.key]
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <PlatformEmpty
                title="未匹配到同名运营数据"
                description="数据在其他入口导入后，系统会按作品名称匹配项目名称；匹配成功后自动展示在这里。"
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
          meta: "候选人到岗状态与 SSC 花名册关联",
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
        hello: result.hello + Number(row.hello ?? 0),
        interview: result.interview + Number(row.interview ?? 0),
        passed: result.passed + Number(row.passed ?? 0),
        offer: result.offer + Number(row.offer ?? 0),
        accepted: result.accepted + Number(row.accepted ?? 0),
        onboarded: result.onboarded + Number(row.onboarded ?? 0),
      }),
      {
        hello: 0,
        interview: 0,
        passed: 0,
        offer: 0,
        accepted: 0,
        onboarded: 0,
      },
    );
    return {
      recruiter,
      jobCount: recruiterJobs.length,
      ...totals,
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
              className="platform-table--single-line"
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
                  </div>
                  <span>{job.department} · {job.city}</span>
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
                className="platform-table--single-line"
                columns={[
                  { label: "招聘人员" },
                  { label: "负责岗位" },
                  { label: "打招呼" },
                  { label: "面试" },
                  { label: "面试通过" },
                  { label: "Offer 发放" },
                  { label: "Offer 接受" },
                  { label: "入职" },
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
                    <span>{row.interview}</span>
                    <span>{row.passed}</span>
                    <span>{row.offer}</span>
                    <span>{row.accepted}</span>
                    <strong>{row.onboarded}</strong>
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
    personnelConsumptionSnapshots,
    projectConsumptionRecords,
    recruitmentDailyReports,
    topics,
    projects,
    updatedAt,
  } = useDemoData();
  const [view, setView] = useState("overview");
  const [statisticsPeriod, setStatisticsPeriod] = useState({
    start: "2026-03",
    end: "2026-07",
  });
  const [selectedMetric, setSelectedMetric] = useState(null);
  const updateStatisticsPeriod = (key, value) => {
    setStatisticsPeriod((current) => {
      const next = { ...current, [key]: value };
      if (key === "start" && value > next.end) next.end = value;
      if (key === "end" && value < next.start) next.start = value;
      return next;
    });
  };
  const recruitmentSummary = selectRecruitmentSummary({
    jobs,
    candidates,
    reports: recruitmentDailyReports,
  });
  const topicSummary = selectTopicSummary(topics);
  const projectSummary = selectProjectSummary(projects);
  const stageProgress = [
    { label: "剧本", source: "剧本" },
    { label: "制作", source: "制作" },
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
      meta: "候选人到岗状态与 SSC 花名册关联",
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
      <PlatformFilter className="platform-filter--period">
        <div
          aria-label="统计时间范围"
          className="platform-period-range"
          role="group"
        >
          <span>统计时间</span>
          <div className="platform-period-range__controls">
            <label>
              <small>开始月份</small>
              <input
                aria-label="统计开始月份"
                max="2026-12"
                min="2026-01"
                onChange={(event) => updateStatisticsPeriod("start", event.target.value)}
                type="month"
                value={statisticsPeriod.start}
              />
            </label>
            <i aria-hidden="true">至</i>
            <label>
              <small>结束月份</small>
              <input
                aria-label="统计结束月份"
                max="2026-12"
                min="2026-01"
                onChange={(event) => updateStatisticsPeriod("end", event.target.value)}
                type="month"
                value={statisticsPeriod.end}
              />
            </label>
          </div>
        </div>
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
                  <small>已关联项目 / 已评估选题</small>
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
            title="月度项目金额与人员消耗趋势"
            description={`${statisticsPeriod.start} 至 ${statisticsPeriod.end} · 项目按创建时间归集消耗成本，人员按导入批次月份汇总总消耗`}
          >
            <MonthlyProjectFinancialTrend
              period={statisticsPeriod}
              personnelConsumptionSnapshots={personnelConsumptionSnapshots}
              projectConsumptionRecords={projectConsumptionRecords}
            />
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
          subtitle={selected.date ?? selected.cycle ?? "记录详情"}
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
                  <small>{row.applications.length} 个岗位</small>
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
          subtitle={`候选人主档 · ${selectedCurrent.source}`}
          onClose={() => {
            setSelected(null);
            setDecisionMode(null);
            setReason("");
          }}
          footer={
            decisionMode === "reject" ? (
              <>
                <button
                  className="ghost-chip"
                  onClick={() => {
                    setDecisionMode(null);
                    setReason("");
                  }}
                  type="button"
                >
                  取消处理
                </button>
                <button
                  className="primary-btn"
                  disabled={!reason.trim()}
                  onClick={() => decide("不进入面试")}
                  type="button"
                >
                  确认结论并生成审计记录
                </button>
              </>
            ) : (
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
            )
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

const recruitmentOfferStatuses = ["Offer待发", "Offer已发", "待入职"];
const recruitmentProgressStatuses = [
  "待部门确认",
  "待安排面试",
  "待面试反馈",
];

const RECRUITMENT_CURRENT_DATE = "2026-07-17";

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function recruitmentPeriodRange(period) {
  if (period.mode === "year") {
    const year = /^\d{4}$/.test(period.year) ? period.year : "2026";
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      label: `${year} 年`,
    };
  }
  if (period.mode === "day") {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(period.day)
      ? period.day
      : RECRUITMENT_CURRENT_DATE;
    return {
      start: day,
      end: day,
      label: day,
    };
  }
  if (period.mode === "week") {
    const weekValue = /^\d{4}-W\d{2}$/.test(period.week) ? period.week : "2026-W29";
    const [yearText, weekText] = weekValue.split("-W");
    const year = Number(yearText);
    const week = Number(weekText);
    const januaryFourth = new Date(Date.UTC(year, 0, 4));
    const januaryFourthDay = januaryFourth.getUTCDay() || 7;
    const monday = new Date(januaryFourth);
    monday.setUTCDate(
      januaryFourth.getUTCDate() - januaryFourthDay + 1 + (week - 1) * 7,
    );
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return {
      start: formatDateOnly(monday),
      end: formatDateOnly(sunday),
      label: `${year} 年第 ${week} 周`,
    };
  }
  const monthValue = /^\d{4}-\d{2}$/.test(period.month) ? period.month : "2026-07";
  const [year, month] = monthValue.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, month, 0));
  return {
    start: `${monthValue}-01`,
    end: formatDateOnly(monthEnd),
    label: `${year} 年 ${month} 月`,
  };
}

function recruitmentDate(value, fallback = RECRUITMENT_CURRENT_DATE) {
  const matched = String(value ?? "").match(/^\d{4}-\d{2}-\d{2}/);
  return matched?.[0] ?? fallback;
}

function dateInRecruitmentPeriod(value, range) {
  const date = recruitmentDate(value);
  return date >= range.start && date <= range.end;
}

function recruitmentRangesOverlap(start, end, range) {
  const normalizedStart = recruitmentDate(start);
  const normalizedEnd = recruitmentDate(end, normalizedStart);
  return normalizedStart <= range.end && normalizedEnd >= range.start;
}

function RecruitmentDirectoryPeriodFilter({
  directory,
  value,
  onChange,
  resultCount,
}) {
  const range = recruitmentPeriodRange(value);
  const selectedLabel =
    value.mode === "year" ? "年份" : value.mode === "month" ? "月份" : "日期";
  return (
    <section
      aria-label={`${directory}时间筛选`}
      className="recruitment-directory-period"
    >
      <div className="recruitment-directory-period__title">
        <span>
          <CalendarCheck size={18} weight="duotone" />
        </span>
        <div>
          <strong>时间筛选</strong>
          <small>{directory}目录</small>
        </div>
      </div>
      <div className="recruitment-directory-period__controls">
        <div
          aria-label={`${directory}时间维度`}
          className="recruitment-directory-period__modes"
          role="group"
        >
          {[
            { id: "year", label: "年" },
            { id: "month", label: "月" },
            { id: "day", label: "日" },
          ].map((item) => (
            <button
              aria-pressed={value.mode === item.id}
              className={value.mode === item.id ? "is-active" : ""}
              key={item.id}
              onClick={() => onChange({ ...value, mode: item.id })}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <label>
          <span>选择{selectedLabel}</span>
          {value.mode === "year" ? (
            <select
              aria-label={`${directory}选择年份`}
              onChange={(event) => onChange({ ...value, year: event.target.value })}
              value={value.year}
            >
              {[2027, 2026, 2025, 2024].map((year) => (
                <option key={year} value={year}>{year} 年</option>
              ))}
            </select>
          ) : (
            <input
              aria-label={`${directory}选择${selectedLabel}`}
              max={value.mode === "month" ? "2027-12" : "2027-12-31"}
              min={value.mode === "month" ? "2024-01" : "2024-01-01"}
              onChange={(event) =>
                onChange({ ...value, [value.mode]: event.target.value })
              }
              type={value.mode === "month" ? "month" : "date"}
              value={value[value.mode]}
            />
          )}
        </label>
        <div className="recruitment-directory-period__range" aria-live="polite">
          <span>当前范围</span>
          <strong>
            {range.start === range.end ? range.start : `${range.start} 至 ${range.end}`}
          </strong>
        </div>
      </div>
      <div className="recruitment-directory-period__result">
        <strong>{resultCount}</strong>
        <span>条结果</span>
      </div>
    </section>
  );
}

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

function recruitmentStatusGroup(status) {
  if (recruitmentTerminalStatuses.includes(status)) return "unsuitable";
  if (recruitmentOfferStatuses.includes(status)) return "offer";
  if (sscEmploymentStatuses.includes(status)) return "onboarded";
  if (recruitmentProgressStatuses.includes(status)) return "progressing";
  return "other";
}

function recruitmentOutcome(application) {
  const group = recruitmentStatusGroup(application.status);
  if (group === "unsuitable") {
    return {
      label: "不合适",
      detail:
        application.rejection?.category ??
        (application.status === "Offer已拒绝" ? "候选人拒绝 Offer" : "未记录原因"),
      tone: "danger",
    };
  }
  if (group === "offer") {
    return {
      label: application.status,
      detail:
        application.status === "Offer待发"
          ? "待下发 Offer"
          : application.status === "Offer已发"
            ? "待候选人确认"
            : "Offer 已接受，等待入职",
      tone: "primary",
    };
  }
  if (group === "onboarded") {
    return {
      label: application.status,
      detail: "到岗信息来自 SSC 花名册",
      tone: application.status === "已离职" ? "neutral" : "success",
    };
  }
  return {
    label: "招聘推进中",
    detail: application.status,
    tone: "primary",
  };
}

function interviewRoundText(application) {
  const current = application?.currentInterviewRound ?? 1;
  const total = application?.interviewTotal ?? 1;
  return `第 ${current}/${total} 轮`;
}

function recruitmentAction(status, application) {
  const round = interviewRoundText(application);
  const actions = {
    待部门确认: { label: "进入面试", next: "待安排面试" },
    待安排面试: { label: `确认${round}面试安排`, next: "待面试反馈" },
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
    status === "待部门确认"
      ? 0
      : ["待安排面试", "待面试反馈"].includes(status)
        ? currentRound
        : ["Offer待发", "Offer已发"].includes(status)
          ? 1 + interviewTotal
          : status === "待入职"
            ? 2 + interviewTotal
            : sscEmploymentStatuses.includes(status)
              ? 3 + interviewTotal
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
  const [dailyScreenshotFiles, setDailyScreenshotFiles] = useState([]);
  const [dailyReportDetail, setDailyReportDetail] = useState(null);
  const [dailyImagePreview, setDailyImagePreview] = useState(null);
  const [jobEditor, setJobEditor] = useState(null);
  const [jobDraft, setJobDraft] = useState({});
  const [candidateEntry, setCandidateEntry] = useState(null);
  const [candidateEntryError, setCandidateEntryError] = useState("");
  const [candidateDuplicateReview, setCandidateDuplicateReview] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [candidateDraft, setCandidateDraft] = useState({});
  const [candidateFilters, setCandidateFilters] = useState({
    keyword: "",
    status: "all",
    owner: "",
  });
  const [directoryPeriods, setDirectoryPeriods] = useState({
    jobs: {
      mode: "month",
      year: "2026",
      month: "2026-07",
      day: RECRUITMENT_CURRENT_DATE,
    },
    candidates: {
      mode: "month",
      year: "2026",
      month: "2026-07",
      day: RECRUITMENT_CURRENT_DATE,
    },
  });
  const dailyReportPeriod = {
    mode: "month",
    year: "2026",
    month: "2026-07",
  };
  const [dailyDraft, setDailyDraft] = useState({
    date: "2026-07-15",
    recruiter: "陈璐",
    platform: "BOSS直聘",
    job: "中级剪辑师",
    hello: 0,
    interview: 0,
    passed: 0,
    offer: 0,
    accepted: 0,
    onboarded: 0,
    screenshots: 0,
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
  const openJobEditor = (job = null) => {
    setJobEditor(job ? "edit" : "create");
    setJobDraft(
      job
        ? {
            ...job,
            departmentLeader:
              job.departmentLeader ?? departmentLeaderCatalog[job.department] ?? "",
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
            departmentLeader: "",
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
      !jobDraft.departmentLeader?.trim() ||
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
    setCandidateDuplicateReview(null);
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
  const closeCandidateEntry = () => {
    setCandidateEntry(null);
    setCandidateDuplicateReview(null);
  };
  const createCandidateEntry = (job, existingCandidateId = "") => {
    const departmentLeader =
      job.departmentLeader ?? departmentLeaderCatalog[job.department] ?? "";
    const applicationId = `APP-${Date.now()}`;
    const application = {
      id: applicationId,
      job: job.name,
      status: "待部门确认",
      departmentLeader,
      interviewer: job.interviewers?.[0] ?? "",
      interviewTotal: job.interviewRounds ?? 1,
      interviewers: job.interviewers ?? [],
      currentInterviewRound: 1,
      interviews: (job.interviewers ?? []).map((interviewer, index) => ({
        round: index + 1,
        interviewer,
        status: "待安排",
      })),
      resumeName,
      resumeFile,
      submittedPhone: candidateDraft.phone.trim(),
      submittedEmail: candidateDraft.email.trim(),
      version: 1,
      history: [
        {
          time: "2026-07-15 10:30",
          action: "上传简历并创建应聘记录",
          operator: candidateDraft.owner || job.recruiter,
          note: `简历：${resumeName}；已提交${departmentLeader || "部门负责人"}进行部门确认`,
        },
      ],
    };
    const existingCandidate = candidates.find(
      (item) => item.id === existingCandidateId,
    );
    const candidate = existingCandidate
      ? {
          ...existingCandidate,
          owner: candidateDraft.owner || job.recruiter,
          duplicate: "已关联主档",
          updatedAt: "刚刚更新",
          resumeName,
          resumeFile,
          applications: [application, ...(existingCandidate.applications ?? [])],
        }
      : {
          id: `CAN-${Date.now()}`,
          name: candidateDraft.name.trim(),
          phone: candidateDraft.phone.trim(),
          email: candidateDraft.email.trim(),
          source: candidateDraft.source,
          owner: candidateDraft.owner || job.recruiter,
          duplicate: "无重复",
          updatedAt: "刚刚创建",
          resumeName,
          resumeFile,
          applications: [application],
        };
    setCandidates((items) =>
      existingCandidate
        ? items.map((item) => (item.id === existingCandidate.id ? candidate : item))
        : [candidate, ...items],
    );
    setJobs((items) =>
      items.map((item) =>
        item.id === job.id
          ? { ...item, candidates: item.candidates + 1 }
          : item,
      ),
    );
    setCandidateEntry(null);
    setCandidateDuplicateReview(null);
    setView("candidates");
    openCandidate(candidate, applicationId);
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
    setCandidateEntryError("");
    const matches = findCandidateDuplicateMatches(candidates, candidateDraft);
    if (matches.length) {
      const preferredMatch =
        matches.find((match) => match.fields.includes("手机号")) ?? matches[0];
      setCandidateDuplicateReview({
        matches,
        preferredCandidateId: preferredMatch.candidate.id,
        job,
      });
      return;
    }
    createCandidateEntry(job);
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
  const openDailyEditor = () => {
    setDailyOpen(true);
    setDailyError("");
    setDailyScreenshotFiles([]);
    setDailyDraft((draft) => ({ ...draft, screenshots: 0 }));
  };
  const handleDailyScreenshotChange = (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const validFiles = selectedFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
    );
    if (validFiles.length !== selectedFiles.length) {
      setDailyError("日报贴图仅支持图片格式，且单张不超过 10 MB。");
    } else {
      setDailyError("");
    }
    const nextFiles = validFiles.map((file, index) => ({
      id: `SHOT-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url:
        typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(file)
          : "",
    }));
    setDailyScreenshotFiles((items) => [...items, ...nextFiles]);
    event.target.value = "";
  };
  const removeDailyScreenshot = (fileId) => {
    setDailyScreenshotFiles((items) => {
      const removed = items.find((item) => item.id === fileId);
      if (removed?.url?.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(removed.url);
      }
      return items.filter((item) => item.id !== fileId);
    });
    setDailyImagePreview((currentPreview) =>
      currentPreview?.id === fileId ? null : currentPreview,
    );
  };
  const submitDaily = () => {
    if (!dailyScreenshotFiles.length) {
      setDailyError("至少上传 1 张日报贴图后才能正式提交。");
      return;
    }
    setDailyReportsState((items) => [
      {
        ...dailyDraft,
        id: `RD-${Date.now()}`,
        screenshots: dailyScreenshotFiles.length,
        screenshotFiles: dailyScreenshotFiles,
        status: "已提交",
      },
      ...items,
    ]);
    setDailyOpen(false);
    setDailyError("");
    setDailyScreenshotFiles([]);
  };
  const jobsPeriodRange = recruitmentPeriodRange(directoryPeriods.jobs);
  const candidatesPeriodRange = recruitmentPeriodRange(directoryPeriods.candidates);
  const dailyReportPeriodRange = recruitmentPeriodRange(dailyReportPeriod);
  const timeScopedJobs = jobs.filter((job) =>
    recruitmentRangesOverlap(job.startDate, job.endDate, jobsPeriodRange),
  );
  const timeScopedCandidates = candidates
    .map((candidate) => {
      const applications = candidate.applications.filter((item) => {
        const historyDates = (item.history ?? []).map((entry) => entry.time);
        return historyDates.length
          ? historyDates.some((date) =>
              dateInRecruitmentPeriod(date, candidatesPeriodRange),
            )
          : dateInRecruitmentPeriod(candidate.updatedAt, candidatesPeriodRange);
      });
      return applications.length ? { ...candidate, applications } : null;
    })
    .filter(Boolean);
  const withDailyScreenshotFiles = (report) => ({
    ...report,
    screenshotFiles:
      report.screenshotFiles ??
      recruitmentDailySeed.find((seedReport) => seedReport.id === report.id)
        ?.screenshotFiles ??
      [],
  });
  const timeScopedDailyReports = dailyReportsState
    .filter((item) => dateInRecruitmentPeriod(item.date, dailyReportPeriodRange))
    .map(withDailyScreenshotFiles);
  const dailyRecruiterSummaries = Object.values(
    timeScopedDailyReports.reduce((summary, report) => {
      const currentSummary = summary[report.recruiter] ?? {
        recruiter: report.recruiter,
        reports: [],
        screenshotCount: 0,
      };
      currentSummary.reports.push(report);
      currentSummary.screenshotCount += report.screenshotFiles?.length ?? report.screenshots ?? 0;
      summary[report.recruiter] = currentSummary;
      return summary;
    }, {}),
  )
    .map((summary) => ({
      ...summary,
      reports: [...summary.reports].sort((left, right) =>
        right.date.localeCompare(left.date),
      ),
    }))
    .sort((left, right) =>
      right.reports[0].date.localeCompare(left.reports[0].date),
    );
  const selectedDailyReports = dailyReportDetail
    ? dailyReportsState
        .filter((report) => report.recruiter === dailyReportDetail.recruiter)
        .map(withDailyScreenshotFiles)
        .sort((left, right) => right.date.localeCompare(left.date))
    : [];
  const selectedDailyReport =
    selectedDailyReports.find(
      (report) => report.id === dailyReportDetail?.reportId,
    ) ?? selectedDailyReports[0] ?? null;
  const timeScopedSscPersonnel = sscPersonnel.filter((person) =>
    dateInRecruitmentPeriod(person.date, candidatesPeriodRange),
  );
  const stageCount = (status) =>
    timeScopedCandidates.reduce(
      (sum, candidate) =>
        sum +
        candidate.applications.filter((item) => item.status === status).length,
      0,
    );
  const candidateApplicationCount = timeScopedCandidates.reduce(
    (sum, candidate) => sum + candidate.applications.length,
    0,
  );
  const candidateStats = {
    total: timeScopedCandidates.length,
    progressing: timeScopedCandidates.reduce(
      (sum, candidate) =>
        sum +
        candidate.applications.filter(
          (item) => recruitmentStatusGroup(item.status) === "progressing",
        ).length,
      0,
    ),
    unsuitable: timeScopedCandidates.reduce(
      (sum, candidate) =>
        sum +
        candidate.applications.filter(
          (item) => recruitmentStatusGroup(item.status) === "unsuitable",
        ).length,
      0,
    ),
    offer: timeScopedCandidates.reduce(
      (sum, candidate) =>
        sum +
        candidate.applications.filter(
          (item) => recruitmentStatusGroup(item.status) === "offer",
        ).length,
      0,
    ),
  };
  const filteredCandidates = timeScopedCandidates
    .map((candidate) => {
      const keyword = candidateFilters.keyword.trim().toLowerCase();
      const owner = candidateFilters.owner.trim().toLowerCase();
      const candidateMatchesKeyword = [
        candidate.id,
        candidate.name,
        candidate.phone,
        candidate.email,
        candidate.source,
        candidate.resumeName,
      ].some((value) => String(value ?? "").toLowerCase().includes(keyword));
      const applications = candidate.applications.filter((item) => {
        const applicationMatchesKeyword = [
          item.job,
          item.status,
          item.rejection?.category,
          item.rejection?.detail,
        ].some((value) => String(value ?? "").toLowerCase().includes(keyword));
        const matchesStatus =
          candidateFilters.status === "all" ||
          recruitmentStatusGroup(item.status) === candidateFilters.status ||
          item.status === candidateFilters.status;
        return (!keyword || candidateMatchesKeyword || applicationMatchesKeyword) && matchesStatus;
      });
      const matchesOwner =
        !owner || String(candidate.owner ?? "").toLowerCase().includes(owner);
      return matchesOwner && applications.length
        ? { ...candidate, visibleApplications: applications }
        : null;
    })
    .filter(Boolean);
  const resetCandidateFilters = () =>
    setCandidateFilters({ keyword: "", status: "all", owner: "" });
  const submittedDaily = timeScopedDailyReports.filter(
    (item) => item.status === "已提交" && item.screenshots > 0,
  ).length;
  const sscEmploymentSummary = summarizeSscEmployment(timeScopedSscPersonnel);
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
  const advanceDisabled =
    application?.status === "待安排面试" &&
    (!interviewer.trim() || !interviewAt);
  const submitAdvance = () => {
    if (!application || !selectedAction || advanceDisabled) return;
    if (application.status === "待入职") {
      syncArrivalFromSsc();
      return;
    }
    const extra =
      application.status === "待安排面试"
        ? {
            interviewer,
            interviewAt,
            interviews: interviewRecordsWith({
              interviewer,
              interviewAt,
              status: "待反馈",
            }),
          }
        : {};
    updateApplication(selectedAction.next, selectedAction.label, extra);
  };
  const submitRecruitmentDecision = () => {
    if (!needsReason || !reasonCategory || !note.trim()) return;
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
  };

  return (
    <div className="platform-page">
      <PlatformHeader
        eyebrow="招聘管理"
        title="岗位、候选人与招聘日报"
        description="按岗位配置一轮或多轮面试；到岗状态从 SSC 花名册同步。"
        meta={null}
        actions={
          <div className="recruitment-header-actions">
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
          </div>
        }
      />
      <PlatformMetrics
        items={[
          {
            label: "招聘中岗位",
            value: timeScopedJobs.filter((item) => item.status === "招聘中").length,
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
          { id: "jobs", label: "岗位与需求", count: timeScopedJobs.length },
          {
            id: "candidates",
            label: "简历库 / 候选人",
            count: timeScopedCandidates.length,
          },
          { id: "daily", label: "招聘日报", count: timeScopedDailyReports.length },
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
          <RecruitmentDirectoryPeriodFilter
            directory="岗位与需求"
            onChange={(nextPeriod) =>
              setDirectoryPeriods((periods) => ({
                ...periods,
                jobs: nextPeriod,
              }))
            }
            resultCount={timeScopedJobs.length}
            value={directoryPeriods.jobs}
          />
          <DataTable
            className="platform-table--single-line recruitment-management-table recruitment-jobs-table"
            columns={[
              { label: "岗位", width: "170px" },
              { label: "部门 / 地点", width: "180px" },
              { label: "需求 / 到岗", width: "100px" },
              { label: "招聘 / 部门负责人", width: "210px" },
              { label: "优先级", width: "90px" },
              { label: "状态", width: "100px" },
              { label: "面试流程 / 面试官", width: "230px" },
              { label: "招聘周期", width: "200px" },
              { label: "候选人", width: "80px" },
              { label: "操作", width: "150px" },
            ]}
            minWidth={1550}
          >
            {timeScopedJobs.map((job) => (
              <div
                className="platform-table__row"
                key={job.id}
                style={{
                  gridTemplateColumns:
                    "170px 180px 100px 210px 90px 100px 230px 200px 80px 150px",
                }}
              >
                <div className="platform-table-inline-cell">
                  <strong>{job.name}</strong>
                  <small>
                    缺口 {job.need - job.onboarded} 人
                  </small>
                </div>
                <div className="platform-table-inline-cell">
                  <span>{job.department}</span>
                  <small>{job.city}</small>
                </div>
                <strong>
                  {job.need} / {job.onboarded}
                </strong>
                <div className="platform-table-inline-cell">
                  <span>{job.recruiter}</span>
                  <small>部门：{job.departmentLeader ?? departmentLeaderCatalog[job.department] ?? "待确认"}</small>
                </div>
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
            {!timeScopedJobs.length ? (
              <PlatformEmpty
                title="当前时间范围没有招聘岗位"
                description="可切换年份、月份或日期查看其他招聘记录。"
              />
            ) : null}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "candidates" ? (
        <PlatformCard
          title="招聘简历库"
          description={`${candidatesPeriodRange.label}共 ${timeScopedCandidates.length} 位候选人、${candidateApplicationCount} 条岗位应聘记录；每条招聘结论均独立保留。`}
        >
          <RecruitmentDirectoryPeriodFilter
            directory="简历库 / 候选人"
            onChange={(nextPeriod) =>
              setDirectoryPeriods((periods) => ({
                ...periods,
                candidates: nextPeriod,
              }))
            }
            resultCount={timeScopedCandidates.length}
            value={directoryPeriods.candidates}
          />
          <div className="recruitment-resume-summary" aria-label="简历库招聘情况概览">
            {[
              { label: "候选人总数", value: candidateStats.total, filter: "all", tone: "blue" },
              { label: "招聘推进中", value: candidateStats.progressing, filter: "progressing", tone: "purple" },
              { label: "不合适", value: candidateStats.unsuitable, filter: "unsuitable", tone: "red" },
              { label: "Offer / 待入职", value: candidateStats.offer, filter: "offer", tone: "green" },
            ].map((item) => (
              <button
                aria-pressed={candidateFilters.status === item.filter}
                className={`recruitment-resume-summary__item recruitment-resume-summary__item--${item.tone} ${candidateFilters.status === item.filter ? "is-active" : ""}`}
                key={item.label}
                onClick={() =>
                  setCandidateFilters((currentFilters) => ({
                    ...currentFilters,
                    status: item.filter,
                  }))
                }
                type="button"
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.filter === "all" ? "人员主档" : "应聘记录"}</small>
              </button>
            ))}
          </div>
          <PlatformFilter
            actions={
              <button
                className="ghost-chip"
                onClick={resetCandidateFilters}
                type="button"
              >
                重置
              </button>
            }
          >
            <label>
              <span>姓名 / 手机 / 邮箱</span>
              <input
                onChange={(event) =>
                  setCandidateFilters((currentFilters) => ({
                    ...currentFilters,
                    keyword: event.target.value,
                  }))
                }
                placeholder="搜索人员、岗位或不合适原因"
                value={candidateFilters.keyword}
              />
            </label>
            <label>
              <span>招聘结果 / 进度</span>
              <select
                onChange={(event) =>
                  setCandidateFilters((currentFilters) => ({
                    ...currentFilters,
                    status: event.target.value,
                  }))
                }
                value={candidateFilters.status}
              >
                <option value="all">全部招聘情况</option>
                <option value="progressing">招聘推进中</option>
                <option value="unsuitable">不合适</option>
                <option value="offer">Offer / 待入职</option>
                <option value="onboarded">已到岗 / 已离职</option>
                <option>待部门确认</option>
                <option>待面试反馈</option>
                <option>Offer已发</option>
                <option>待入职</option>
                <option>实习期</option>
                <option>已转正</option>
                <option>已离职</option>
              </select>
            </label>
            <label>
              <span>招聘负责人</span>
              <input
                onChange={(event) =>
                  setCandidateFilters((currentFilters) => ({
                    ...currentFilters,
                    owner: event.target.value,
                  }))
                }
                placeholder="输入负责人"
                value={candidateFilters.owner}
              />
            </label>
          </PlatformFilter>
          <DataTable
            className="platform-table--single-line recruitment-management-table recruitment-candidates-table"
            columns={[
              { label: "候选人", width: "160px" },
              { label: "联系方式", width: "230px" },
              { label: "岗位招聘情况", width: "430px" },
              { label: "结果说明", width: "420px" },
              { label: "负责人", width: "90px" },
              { label: "来源 / 简历", width: "230px" },
              { label: "更新时间", width: "145px" },
              { label: "操作", width: "76px" },
            ]}
            minWidth={1840}
          >
            {filteredCandidates.map((candidate) => (
              <div
                className="platform-table__row"
                key={candidate.id}
                style={{
                  gridTemplateColumns:
                    "160px 230px 430px 420px 90px 230px 145px 76px",
                }}
              >
                <div className="platform-table-inline-cell">
                  <strong>{candidate.name}</strong>
                  <small>{candidate.applications.length} 条应聘</small>
                </div>
                <div className="platform-table-inline-cell">
                  <span>{candidate.phone || "待补充"}</span>
                  <small>{candidate.email || "待补充"}</small>
                </div>
                <div className="recruitment-application-overview">
                  {candidate.visibleApplications.map((item) => (
                    <button
                      aria-label={`查看 ${candidate.name} 的${item.job}招聘记录`}
                      key={item.id}
                      onClick={() => openCandidate(candidate, item.id)}
                      type="button"
                    >
                      <span>{item.job}</span>
                      <PlatformBadge>{item.status}</PlatformBadge>
                    </button>
                  ))}
                </div>
                <div className="recruitment-outcome-overview">
                  {candidate.visibleApplications.map((item) => {
                    const outcome = recruitmentOutcome(item);
                    return (
                      <div key={item.id}>
                        <PlatformBadge tone={outcome.tone}>{outcome.label}</PlatformBadge>
                        <small>{outcome.detail}</small>
                      </div>
                    );
                  })}
                </div>
                <span>{candidate.owner}</span>
                <div className="platform-table-inline-cell">
                  <span>{candidate.source}</span>
                  <small>{candidate.resumeName ?? "历史简历已归档"}</small>
                </div>
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
            {!filteredCandidates.length ? (
              <PlatformEmpty
                title="没有匹配的候选人"
                description="可重置招聘情况、关键词或负责人后继续查看。"
              />
            ) : null}
          </DataTable>
        </PlatformCard>
      ) : null}
      {view === "daily" ? (
        <div className="platform-dashboard-grid">
          <PlatformCard
            title="招聘工作量漏斗"
            description="仅已提交且截图完整的日报纳入正式经营统计。"
          >
            <RecruitmentFunnel reports={timeScopedDailyReports} />
          </PlatformCard>
          <PlatformCard
            title="日报"
            description="按招聘人员查看当期招聘数据、历史日报与已上传贴图。"
            action={
              <button
                className="primary-btn"
                onClick={openDailyEditor}
                type="button"
              >
                <Plus size={16} />
                填写日报
              </button>
            }
          >
            <div className="recruitment-daily-people">
              {dailyRecruiterSummaries.map((summary) => (
                <article key={summary.recruiter}>
                  <span className="recruitment-daily-people__avatar" aria-hidden="true">
                    {summary.recruiter.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{summary.recruiter}</strong>
                    <span>
                      最近日报：{summary.reports[0].date} · {summary.reports[0].platform}
                    </span>
                    <small>{summary.reports[0].job}</small>
                  </div>
                  <div className="recruitment-daily-people__meta">
                    <strong>{summary.reports.length}</strong>
                    <span>历史日报</span>
                  </div>
                  <div className="recruitment-daily-people__meta">
                    <strong>{summary.screenshotCount}</strong>
                    <span>日报贴图</span>
                  </div>
                  <button
                    aria-label={`查看${summary.recruiter}日报`}
                    className="table-link"
                    onClick={() =>
                      setDailyReportDetail({
                        recruiter: summary.recruiter,
                        reportId: summary.reports[0].id,
                      })
                    }
                    type="button"
                  >
                    查看
                  </button>
                </article>
              ))}
              {!dailyRecruiterSummaries.length ? (
                <PlatformEmpty
                  title="暂无招聘日报"
                  description="填写日报并上传贴图后，可按人员查看历史记录。"
                />
              ) : null}
            </div>
            <PlatformNotice>
              正式日报必须包含至少 1 张日报贴图，提交后可在人员历史中随时查看。
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
                  !jobDraft.departmentLeader?.trim() ||
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
                    departmentLeader:
                      departmentLeaderCatalog[event.target.value] ?? "",
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
              <span>部门负责人</span>
              <input
                aria-label="部门负责人"
                placeholder="选择部门后自动回显"
                readOnly
                value={jobDraft.departmentLeader ?? ""}
              />
              <small>根据所属部门自动带出，候选人上传后将直接提交给该负责人确认。</small>
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
          ariaHidden={Boolean(candidateDuplicateReview)}
          title="上传候选人并创建应聘记录"
          subtitle="候选人主档 + 岗位应聘记录"
          onClose={closeCandidateEntry}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={closeCandidateEntry}
                type="button"
              >
                取消
              </button>
              <button
                className="primary-btn"
                onClick={saveCandidateEntry}
                type="button"
              >
                上传并进入待部门确认
              </button>
            </>
          }
        >
          <PlatformNotice>
            手机号优先、邮箱辅助去重。上传简历后直接创建「待部门确认」应聘记录，并提交对应部门负责人处理。
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
      {candidateDuplicateReview ? (
        <PlatformConfirmDialog
          title="发现重复候选人信息"
          description="手机号或邮箱已存在，请核对重复人员及其面试岗位后再次确认。"
          onClose={() => setCandidateDuplicateReview(null)}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => setCandidateDuplicateReview(null)}
                type="button"
              >
                返回修改
              </button>
              <button
                className="primary-btn"
                onClick={() =>
                  createCandidateEntry(
                    candidateDuplicateReview.job,
                    candidateDuplicateReview.preferredCandidateId,
                  )
                }
                type="button"
              >
                确认继续上传
              </button>
            </>
          }
        >
          <div className="candidate-duplicate-summary">
            <span>本次上传岗位</span>
            <strong>
              {candidateDuplicateReview.job.name} · {candidateDuplicateReview.job.department}
            </strong>
          </div>
          <div className="candidate-duplicate-list">
            {candidateDuplicateReview.matches.map(({ candidate, fields }) => {
              const interviewJobs = [
                ...new Set(
                  (candidate.applications ?? [])
                    .map((application) => application.job)
                    .filter(Boolean),
                ),
              ];
              const isPreferred =
                candidate.id === candidateDuplicateReview.preferredCandidateId;
              return (
                <article
                  className={`candidate-duplicate-card ${isPreferred ? "is-preferred" : ""}`.trim()}
                  key={candidate.id}
                >
                  <header>
                    <div>
                      <strong>{candidate.name}</strong>
                      {isPreferred ? <span>将关联此候选人主档</span> : null}
                    </div>
                    <div className="candidate-duplicate-card__tags">
                      {fields.map((field) => (
                        <span key={field}>{field}重复</span>
                      ))}
                    </div>
                  </header>
                  <dl>
                    <div>
                      <dt>手机号</dt>
                      <dd>{candidate.phone || "未填写"}</dd>
                    </div>
                    <div>
                      <dt>邮箱</dt>
                      <dd>{candidate.email || "未填写"}</dd>
                    </div>
                    <div className="is-wide">
                      <dt>面试岗位</dt>
                      <dd>{interviewJobs.join("、") || "暂无岗位记录"}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
          <p className="candidate-duplicate-hint">
            确认后不会新建重复人员主档；本次简历将作为新岗位应聘记录，进入「待部门确认」。如手机号与邮箱命中不同人员，将优先关联手机号命中的主档。
          </p>
        </PlatformConfirmDialog>
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
          subtitle={`候选人主档 · ${current.source}`}
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
              {mode === "advance" && selectedAction ? (
                <button
                  className="primary-btn"
                  disabled={advanceDisabled}
                  onClick={submitAdvance}
                  type="button"
                >
                  {application.status === "待入职"
                    ? "从 SSC 同步到岗状态"
                    : `确认并推进至「${selectedAction.next}」`}
                </button>
              ) : needsReason ? (
                <button
                  className="primary-btn"
                  disabled={!reasonCategory || !note.trim()}
                  onClick={submitRecruitmentDecision}
                  type="button"
                >
                  确认结论并保留审计记录
                </button>
              ) : application.status === "待部门确认" ? (
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
              <span>部门负责人</span>
              <strong>{application.departmentLeader ?? "待确认"}</strong>
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
                <small>{currentSscEmployment?.employee ? "来源：SSC 花名册" : "SSC 尚未建立员工档案"}</small>
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
                    <span>V{item.version ?? 1}</span>
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
      {dailyReportDetail && selectedDailyReport ? (
        <PlatformDrawer
          wide
          title={`${dailyReportDetail.recruiter}的招聘日报`}
          subtitle={`共 ${selectedDailyReports.length} 份历史日报 · 当前查看 ${selectedDailyReport.date}`}
          onClose={() => {
            setDailyReportDetail(null);
            setDailyImagePreview(null);
          }}
        >
          <section className="recruitment-daily-detail-hero">
            <span className="recruitment-daily-detail-hero__icon">
              <FileText size={24} weight="duotone" />
            </span>
            <div>
              <small>{selectedDailyReport.date} · {selectedDailyReport.platform}</small>
              <h3>{selectedDailyReport.job}</h3>
              <p>{selectedDailyReport.recruiter}提交的招聘工作记录</p>
            </div>
            <PlatformBadge>{selectedDailyReport.status}</PlatformBadge>
          </section>
          <section className="recruitment-daily-kpis" aria-label="招聘日报数据">
            {[
              ["打招呼", selectedDailyReport.hello],
              ["面试", selectedDailyReport.interview],
              ["面试通过", selectedDailyReport.passed],
              ["Offer 发放", selectedDailyReport.offer],
              ["Offer 接受", selectedDailyReport.accepted],
              ["正式入职", selectedDailyReport.onboarded],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value ?? 0}</strong>
              </div>
            ))}
          </section>
          <section className="recruitment-daily-detail-section">
            <header>
              <div>
                <h3>日报贴图</h3>
                <p>点击缩略图可查看完整图片。</p>
              </div>
              <span>{selectedDailyReport.screenshotFiles?.length ?? 0} 张</span>
            </header>
            {selectedDailyReport.screenshotFiles?.length ? (
              <div className="recruitment-daily-gallery">
                {selectedDailyReport.screenshotFiles.map((file) => (
                  <button
                    aria-label={`查看图片${file.name}`}
                    className={dailyImagePreview?.id === file.id ? "is-active" : ""}
                    key={file.id}
                    onClick={() => setDailyImagePreview(file)}
                    type="button"
                  >
                    {file.url ? <img alt={file.name} src={file.url} /> : <Image size={26} />}
                    <span>{file.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <PlatformEmpty
                title="该历史日报未保留贴图"
                description="后续上传的日报贴图会展示在这里。"
              />
            )}
            {dailyImagePreview ? (
              <figure className="recruitment-daily-image-preview">
                {dailyImagePreview.url ? (
                  <img alt={dailyImagePreview.name} src={dailyImagePreview.url} />
                ) : (
                  <Image size={40} />
                )}
                <figcaption>{dailyImagePreview.name}</figcaption>
              </figure>
            ) : null}
          </section>
          <section className="recruitment-daily-detail-section">
            <header>
              <div>
                <h3>历史日报</h3>
                <p>保留该招聘人员的全部历史招聘记录。</p>
              </div>
              <span>{selectedDailyReports.length} 份</span>
            </header>
            <div className="recruitment-daily-history">
              {selectedDailyReports.map((report) => (
                <button
                  aria-pressed={selectedDailyReport.id === report.id}
                  className={selectedDailyReport.id === report.id ? "is-active" : ""}
                  key={report.id}
                  onClick={() => {
                    setDailyReportDetail((detail) => ({ ...detail, reportId: report.id }));
                    setDailyImagePreview(null);
                  }}
                  type="button"
                >
                  <span>{report.date}</span>
                  <strong>{report.platform} · {report.job}</strong>
                  <small>
                    打招呼 {report.hello ?? 0} · 面试 {report.interview ?? 0} · Offer {report.offer ?? 0}
                  </small>
                  <PlatformBadge>{report.status}</PlatformBadge>
                </button>
              ))}
            </div>
          </section>
        </PlatformDrawer>
      ) : null}
      {dailyOpen ? (
        <PlatformDrawer
          wide
          title="填写日报"
          subtitle="日期 + 招聘人员 + 平台 + 岗位"
          onClose={() => {
            setDailyOpen(false);
            setDailyImagePreview(null);
          }}
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
            正式提交前必须上传日报贴图；提交后可按招聘人员查看当前数据与历史记录。
          </PlatformNotice>
          <div className="platform-form-grid">
            {[
              ["date", "日期", "date"],
              ["recruiter", "招聘人员", "text"],
              ["platform", "招聘平台", "text"],
              ["job", "岗位", "text"],
              ["hello", "打招呼数", "number"],
              ["interview", "面试", "number"],
              ["passed", "面试通过", "number"],
              ["offer", "Offer 发放", "number"],
              ["accepted", "Offer 接受", "number"],
              ["onboarded", "正式入职", "number"],
            ].map(([key, label, type]) => (
              <label key={key}>
                <span>
                  {label}
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
          <div className="recruitment-daily-upload">
            <label>
              <span className="recruitment-daily-upload__icon">
                <UploadSimple size={24} weight="duotone" />
              </span>
              <span>
                <strong>上传日报贴图 <b>*</b></strong>
                <small>支持 JPG、PNG、WEBP 等图片格式，可多选，单张不超过 10 MB</small>
              </span>
              <span className="recruitment-daily-upload__action">选择图片</span>
              <input
                accept="image/*"
                aria-label="上传日报贴图"
                multiple
                onChange={handleDailyScreenshotChange}
                type="file"
              />
            </label>
            {dailyScreenshotFiles.length ? (
              <div className="recruitment-daily-upload__files">
                {dailyScreenshotFiles.map((file) => (
                  <article key={file.id}>
                    <button
                      aria-label={`查看图片${file.name}`}
                      onClick={() => setDailyImagePreview(file)}
                      type="button"
                    >
                      {file.url ? <img alt={file.name} src={file.url} /> : <Image size={24} />}
                    </button>
                    <div>
                      <strong>{file.name}</strong>
                      <span>{formatContractSize(file.size)}</span>
                    </div>
                    <button
                      aria-label={`移除图片${file.name}`}
                      className="platform-icon-button"
                      onClick={() => removeDailyScreenshot(file.id)}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
          {dailyImagePreview ? (
            <figure className="recruitment-daily-image-preview is-upload-preview">
              {dailyImagePreview.url ? (
                <img alt={dailyImagePreview.name} src={dailyImagePreview.url} />
              ) : (
                <Image size={40} />
              )}
              <figcaption>{dailyImagePreview.name}</figcaption>
            </figure>
          ) : null}
          {dailyError ? (
            <PlatformNotice tone="warning">{dailyError}</PlatformNotice>
          ) : null}
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

export function TopicCenterPage({ goPage }) {
  const { topics, setTopics, projects } = useDemoData();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  const [topicAttachment, setTopicAttachment] = useState(null);
  const [topicAttachmentError, setTopicAttachmentError] = useState("");
  const [topicAttachmentPreview, setTopicAttachmentPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicEditDraft, setTopicEditDraft] = useState(null);
  const [topicEditAttachment, setTopicEditAttachment] = useState(null);
  const [topicEditAttachmentError, setTopicEditAttachmentError] = useState("");
  const [topicSummaryExpanded, setTopicSummaryExpanded] = useState(false);
  const [topicDraft, setTopicDraft] = useState({
    name: "",
    genre: "",
    audience: "",
    estimatedEpisodes: 12,
    submitter: "张小北",
    reviewer: "江晚",
    summary: "",
  });
  const topicSummary = selectTopicSummary(topics);
  const current = topics.find((item) => item.id === selected?.id) ?? selected;
  const topicSummaryNeedsExpansion = Boolean(
    current?.summary &&
      (current.summary.length > TOPIC_SUMMARY_COLLAPSE_LENGTH ||
        current.summary.split(/\r?\n/).length > 6),
  );
  const linkedProjectCode = (projectId) =>
    projects.find((project) => project.id === projectId)?.projectCode ?? projectId;
  const statusTabItems = [
    { id: "all", label: "全部", count: topics.length },
    {
      id: "pending",
      label: "待评估",
      count: topics.filter((item) => item.status === "待评估").length,
    },
    {
      id: "evaluated",
      label: "已评估",
      count: topics.filter((item) => item.status === "已评估").length,
    },
    {
      id: "returned",
      label: "未通过",
      count: topics.filter((item) => item.status === "未通过").length,
    },
  ];
  const visibleTopics = useMemo(() => {
    return topics.filter((item) => {
      return (
        statusFilter === "all" ||
        (statusFilter === "pending" && item.status === "待评估") ||
        (statusFilter === "evaluated" && item.status === "已评估") ||
        (statusFilter === "returned" && item.status === "未通过")
      );
    });
  }, [statusFilter, topics]);
  const topicTableColumns = [
    { label: "选题信息", width: "minmax(180px, 1.2fr)" },
    { label: "选题摘要", width: "minmax(200px, 1.35fr)" },
    { label: "题材方向", width: "minmax(120px, 0.8fr)" },
    { label: "集数 / 受众", width: "minmax(120px, 0.8fr)" },
    { label: "提交信息", width: "100px" },
    { label: "评估进度", width: "minmax(135px, 0.85fr)" },
    { label: "项目关联", width: "minmax(150px, 0.95fr)" },
    { label: "创建时间", width: "120px" },
    { label: "修改时间", width: "120px" },
    { label: "操作", width: "116px" },
  ];
  const topicTableGrid = topicTableColumns.map((item) => item.width).join(" ");
  const resetTopicDraft = () => {
    setTopicDraft({
      name: "",
      genre: "",
      audience: "",
      estimatedEpisodes: 12,
      submitter: "张小北",
      reviewer: "江晚",
      summary: "",
    });
    setTopicAttachment(null);
    setTopicAttachmentError("");
  };
  const openTopicEditor = (topic) => {
    setEditingTopic(topic);
    setTopicEditDraft({
      name: topic.name,
      genre: topic.genre,
      audience: topic.audience,
      estimatedEpisodes: topic.estimatedEpisodes ?? 1,
      submitter: topic.submitter,
      reviewer: topic.reviewer,
      summary: topic.summary ?? "",
    });
    setTopicEditAttachment(topic.attachment ?? null);
    setTopicEditAttachmentError("");
  };
  const closeTopicEditor = () => {
    setEditingTopic(null);
    setTopicEditDraft(null);
    setTopicEditAttachment(null);
    setTopicEditAttachmentError("");
  };
  const saveTopicEdit = () => {
    if (
      !editingTopic ||
      !topicEditDraft?.name.trim() ||
      !topicEditDraft?.summary.trim() ||
      Number(topicEditDraft.estimatedEpisodes) < 1
    ) return;
    setTopics((items) =>
      items.map((item) =>
        item.id === editingTopic.id
          ? {
              ...item,
              ...topicEditDraft,
              estimatedEpisodes: Number(topicEditDraft.estimatedEpisodes),
              attachment: topicEditAttachment
                ? topicEditAttachment.file
                  ? topicEditAttachment
                  : {
                      name: topicEditAttachment.name,
                      size: topicEditAttachment.size,
                      type: topicEditAttachment.type,
                      file: topicEditAttachment,
                      uploadedAt: "2026-07-21 13:50",
                    }
                : null,
              updatedAt: "2026-07-21 13:50",
            }
          : item,
      ),
    );
    closeTopicEditor();
  };
  const updateStatus = (status, extra = {}) => {
    setTopics((items) =>
      items.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              status,
              ...extra,
            }
          : item,
      ),
    );
    setMode(null);
    setReason("");
  };
  const cancelTopicMode = () => {
    setMode(null);
    setReason("");
  };
  return (
    <div className="platform-page platform-topic-center">
      <PlatformHeader
        eyebrow="选题管理"
        title="选题库与内容评估"
        description="按统一表单提交并指定评估人；评估通过后进入剧本库上传完整或分集剧本，再从剧本库发起项目立项。"
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
            label: "待评估",
            value: topicSummary.pending,
            unit: "个",
            meta: "2 个即将超时",
            tone: "amber",
          },
          {
            label: "已评估",
            value: topicSummary.approved,
            unit: "个",
            meta: "评估通过后自动进入剧本库",
            tone: "green",
          },
          {
            label: "未通过",
            value: topicSummary.returned,
            unit: "个",
            meta: "未通过后进入修改流程",
            tone: "red",
          },
        ]}
      />
      <PlatformCard
        title="选题库"
        description={`共 ${visibleTopics.length} 条结果 · 评估记录、评估人和下游项目关联永久保留`}
      >
        <div className="platform-topic-status-tabs">
          <PlatformTabs
            ariaLabel="选题状态筛选"
            items={statusTabItems}
            onChange={setStatusFilter}
            value={statusFilter}
          />
        </div>
        <DataTable
          columns={topicTableColumns}
          minWidth={1580}
          className="platform-topic-table platform-table--single-line"
        >
          {visibleTopics.length ? visibleTopics.map((row) => (
              <div
                className="platform-table__row platform-topic-table__row"
                style={{ gridTemplateColumns: topicTableGrid }}
                key={row.id}
              >
                <div className="platform-table-inline-cell">
                  <strong>{row.name}</strong>
                  <small>{row.id}</small>
                </div>
                <p className="platform-topic-table__summary" title={row.summary}>
                  {row.summary || "未填写摘要"}
                </p>
                <div className="platform-table-inline-cell">
                  <span>{row.genre}</span>
                  <small>{row.template}</small>
                </div>
                <div className="platform-table-inline-cell">
                  <strong>{row.estimatedEpisodes ?? "待确认"} 集</strong>
                  <small title={row.audience}>{row.audience}</small>
                </div>
                <div className="platform-table-inline-cell platform-topic-table__submission">
                  <span>{row.submitter}</span>
                </div>
                <div className="platform-table-inline-cell platform-topic-table__review">
                  <PlatformBadge>{topicStatusLabel(row.status)}</PlatformBadge>
                  <small>{row.reviewer ? `评估人 · ${row.reviewer}` : "暂未评估"}</small>
                </div>
                <div className="platform-topic-table__project">
                  {row.projectId ? (
                    <button
                      className="table-link platform-topic-table__project-link"
                      onClick={() => goPage("project-management")}
                      title={linkedProjectCode(row.projectId)}
                      type="button"
                    >
                      {linkedProjectCode(row.projectId)}
                    </button>
                  ) : (
                    <>
                      <span>{row.status === "已评估" ? "已进入剧本库" : "暂无关联"}</span>
                      <small>{row.status === "已评估" ? "等待剧本流程" : "—"}</small>
                    </>
                  )}
                </div>
                <span className="platform-topic-table__created">
                  {row.createdAt ?? row.updatedAt}
                </span>
                <span className="platform-topic-table__updated">{row.updatedAt}</span>
                <div className="platform-topic-table__actions">
                  <button
                    className="platform-topic-row-action is-quiet"
                    onClick={() => openTopicEditor(row)}
                    type="button"
                  >
                    编辑
                  </button>
                  <button
                    className="platform-topic-row-action"
                    disabled={!['待评估', '未通过'].includes(row.status)}
                    onClick={() => {
                      setSelected(row);
                      setMode("review");
                      setTopicSummaryExpanded(false);
                    }}
                    type="button"
                  >
                    评估
                  </button>
                </div>
              </div>
            )) : (
              <div className="platform-topic-empty">
                <Lightbulb size={26} weight="duotone" />
                <strong>没有匹配的选题</strong>
                <span>请调整状态或查询条件后重试</span>
              </div>
            )}
        </DataTable>
      </PlatformCard>
      {current ? (
        <PlatformDrawer
          wide
          title={current.name}
          subtitle={`${current.id} · ${current.template}`}
          onClose={() => {
            setSelected(null);
            setMode(null);
            setReason("");
            setTopicSummaryExpanded(false);
          }}
          footer={
            mode === "reject" ? (
              <>
                <button
                  className="ghost-chip"
                  onClick={cancelTopicMode}
                  type="button"
                >
                  取消处理
                </button>
                <button
                  className="primary-btn"
                  disabled={!reason.trim()}
                  onClick={() => updateStatus("未通过", { reason })}
                  type="button"
                >
                  确认未通过并生成修改任务
                </button>
              </>
            ) : mode === "review" || current.status === "待评估" ? (
              <>
                <button
                  className="ghost-chip"
                  onClick={() => setMode("reject")}
                  type="button"
                >
                  标记未通过
                </button>
                <button
                  className="primary-btn"
                  onClick={() => updateStatus("已评估", { reason: "" })}
                  type="button"
                >
                  评估通过
                </button>
              </>
            ) : current.projectId ? (
              <button
                className="primary-btn"
                onClick={() => goPage("project-management")}
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
              <PlatformBadge>{topicStatusLabel(current.status)}</PlatformBadge>
              <small className="platform-detail-hero__eyebrow">选题摘要</small>
              <h3
                className={`platform-topic-detail-summary ${topicSummaryExpanded ? "is-expanded" : ""}`}
              >
                {current.summary || "未填写摘要"}
              </h3>
              {topicSummaryNeedsExpansion ? (
                <button
                  aria-expanded={topicSummaryExpanded}
                  className="table-link platform-topic-detail-summary__toggle"
                  onClick={() => setTopicSummaryExpanded((expanded) => !expanded)}
                  type="button"
                >
                  {topicSummaryExpanded ? "收起摘要" : "展开完整摘要"}
                </button>
              ) : null}
              <p>
                {current.genre} · {current.audience} · 提交人{" "}
                {current.submitter}
              </p>
            </div>
          </div>
          <div className="platform-detail-grid">
            <div>
              <span>当前评估人</span>
              <strong>{current.reviewer}</strong>
            </div>
            <div>
              <span>预计集数</span>
              <strong>{current.estimatedEpisodes ?? "待确认"} 集</strong>
            </div>
            <div>
              <span>创建时间</span>
              <strong>{current.createdAt ?? current.updatedAt}</strong>
            </div>
            <div>
              <span>修改时间</span>
              <strong>{current.updatedAt}</strong>
            </div>
            <div>
              <span>关联项目</span>
              <strong>
                {current.projectId
                  ? linkedProjectCode(current.projectId)
                  : current.status === "已评估"
                    ? "已进入剧本库"
                    : "暂无关联"}
              </strong>
            </div>
          </div>
          <section className="platform-topic-attachment-card">
            <div className="platform-topic-attachment-card__heading">
              <span className="platform-topic-attachment-card__icon">
                <FileText size={20} weight="duotone" />
              </span>
              <div>
                <strong>选题附件</strong>
                <small>附件与选题信息同步保留</small>
              </div>
              <PlatformBadge tone={current.attachment ? "success" : "neutral"}>
                {current.attachment ? "已上传" : "暂无附件"}
              </PlatformBadge>
            </div>
            {current.attachment ? (
              <div className="platform-topic-attachment-card__file">
                <div>
                  <strong>{current.attachment.name}</strong>
                  <small>
                    {topicAttachmentTypeLabel(current.attachment)} · {formatContractSize(current.attachment.size)} · {current.attachment.uploadedAt}
                  </small>
                </div>
                <button
                  className="ghost-chip"
                  onClick={() => setTopicAttachmentPreview(current.attachment)}
                  type="button"
                >
                  查看 / 预览附件
                </button>
              </div>
            ) : (
              <p className="platform-topic-attachment-card__empty">该选题未上传附件。</p>
            )}
          </section>
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
            </section>
          ) : null}
          <section className="platform-timeline">
            <article>
              <i />
              <div>
                <strong>最近修改</strong>
                <span>
                  {current.updatedAt} · {current.submitter}
                </span>
              </div>
            </article>
            <article>
              <i />
              <div>
                <strong>评估记录完整保留</strong>
                <span>按选题编号持续记录评估结果和操作时间</span>
              </div>
            </article>
          </section>
        </PlatformDrawer>
      ) : null}
      {editingTopic && topicEditDraft ? (
        <PlatformDrawer
          title="编辑选题"
          subtitle={`${editingTopic.id} · 修改后同步更新选题信息`}
          onClose={closeTopicEditor}
          footer={
            <>
              <button className="ghost-chip" onClick={closeTopicEditor} type="button">
                取消
              </button>
              <button
                className="primary-btn"
                disabled={
                  !topicEditDraft.name.trim() ||
                  !topicEditDraft.summary.trim() ||
                  Number(topicEditDraft.estimatedEpisodes) < 1
                }
                onClick={saveTopicEdit}
                type="button"
              >
                保存修改
              </button>
            </>
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
                  onChange={(event) =>
                    setTopicEditDraft((draft) => ({
                      ...draft,
                      [key]: event.target.value,
                    }))
                  }
                  value={topicEditDraft[key]}
                />
              </label>
            ))}
            <label>
              <span>预计集数</span>
              <input
                aria-label="编辑预计集数"
                max="9999"
                min="1"
                onChange={(event) =>
                  setTopicEditDraft((draft) => ({
                    ...draft,
                    estimatedEpisodes: Number(event.target.value),
                  }))
                }
                type="number"
                value={topicEditDraft.estimatedEpisodes}
              />
            </label>
            <label>
              <span>评估人</span>
              <select
                onChange={(event) =>
                  setTopicEditDraft((draft) => ({
                    ...draft,
                    reviewer: event.target.value,
                  }))
                }
                value={topicEditDraft.reviewer}
              >
                <option>江晚</option>
                <option>林制作</option>
                <option>沈婉瑶</option>
                <option>CEO</option>
              </select>
            </label>
            <label className="is-wide">
              <span>选题摘要</span>
              <textarea
                aria-label="编辑选题摘要"
                className="platform-topic-summary-input"
                maxLength={TOPIC_SUMMARY_MAX_LENGTH}
                onChange={(event) =>
                  setTopicEditDraft((draft) => ({
                    ...draft,
                    summary: event.target.value,
                  }))
                }
                rows={6}
                value={topicEditDraft.summary}
              />
              <div className="platform-topic-summary-meta">
                <small>保存后同步更新选题信息，原评估与下游项目关联保持不变。</small>
                <strong>{topicEditDraft.summary.length}/{TOPIC_SUMMARY_MAX_LENGTH} 字</strong>
              </div>
            </label>
            <TopicAttachmentUploadField
              error={topicEditAttachmentError}
              file={topicEditAttachment}
              onChange={setTopicEditAttachment}
              onError={setTopicEditAttachmentError}
              onRemove={() => {
                setTopicEditAttachment(null);
                setTopicEditAttachmentError("");
              }}
              onView={() =>
                setTopicAttachmentPreview({
                  name: topicEditAttachment.name,
                  size: topicEditAttachment.size,
                  type: topicEditAttachment.type,
                  file: topicEditAttachment.file ?? topicEditAttachment,
                  uploadedAt: topicEditAttachment.uploadedAt ?? "本次修改",
                })
              }
            />
          </div>
        </PlatformDrawer>
      ) : null}
      {creating ? (
        <PlatformDrawer
          title="新建选题"
          subtitle="提交后进入统一评估流程"
          onClose={() => {
            setCreating(false);
            resetTopicDraft();
          }}
          footer={
            <button
              className="primary-btn"
              disabled={!topicDraft.name.trim() || !topicDraft.summary.trim()}
              onClick={() => {
                setTopics((items) => [
                  {
                    ...topicDraft,
                    template: "自定义提交",
                    id: `TOPIC-${Date.now()}`,
                    status: "待评估",
                    createdAt: "2026-07-16 09:30",
                    attachment: topicAttachment
                      ? {
                          name: topicAttachment.name,
                          size: topicAttachment.size,
                          type: topicAttachment.type,
                          file: topicAttachment,
                          uploadedAt: "2026-07-16 09:30",
                        }
                      : null,
                    updatedAt: "2026-07-16 09:30",
                    projectId: null,
                    reason: "",
                  },
                  ...items,
                ]);
                setCreating(false);
                resetTopicDraft();
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
              <span>预计集数</span>
              <input
                aria-label="预计集数"
                max="9999"
                min="1"
                onChange={(event) =>
                  setTopicDraft((draft) => ({
                    ...draft,
                    estimatedEpisodes: Number(event.target.value),
                  }))
                }
                type="number"
                value={topicDraft.estimatedEpisodes}
              />
            </label>
            <label>
              <span>评估人</span>
              <select
                value={topicDraft.reviewer}
                onChange={(event) =>
                  setTopicDraft((draft) => ({ ...draft, reviewer: event.target.value }))
                }
              >
                <option>江晚</option>
                <option>林制作</option>
                <option>沈婉瑶</option>
                <option>CEO</option>
              </select>
            </label>
            <label className="is-wide">
              <span>选题摘要</span>
              <textarea
                aria-label="选题摘要"
                className="platform-topic-summary-input"
                maxLength={TOPIC_SUMMARY_MAX_LENGTH}
                placeholder="请输入选题背景、核心创意、故事方向等内容，支持分段填写"
                rows={6}
                value={topicDraft.summary}
                onChange={(event) =>
                  setTopicDraft((draft) => ({ ...draft, summary: event.target.value }))
                }
              />
              <div className="platform-topic-summary-meta">
                <small>支持多段文字；输入区域会随内容增高，超过最大高度后可滚动。</small>
                <strong>
                  {topicDraft.summary.length}/{TOPIC_SUMMARY_MAX_LENGTH} 字
                </strong>
              </div>
            </label>
            <TopicAttachmentUploadField
              error={topicAttachmentError}
              file={topicAttachment}
              onChange={setTopicAttachment}
              onError={setTopicAttachmentError}
              onView={() =>
                setTopicAttachmentPreview({
                  name: topicAttachment.name,
                  size: topicAttachment.size,
                  type: topicAttachment.type,
                  file: topicAttachment,
                  uploadedAt: "本次提交",
                })
              }
            />
          </div>
        </PlatformDrawer>
      ) : null}
      {topicAttachmentPreview ? (
        <TopicAttachmentPreviewDrawer
          attachment={topicAttachmentPreview}
          context={current?.name ?? "选题详情"}
          onClose={() => setTopicAttachmentPreview(null)}
        />
      ) : null}
    </div>
  );
}

function latestScriptUpload(record) {
  return [...(record?.uploads ?? [])].sort(
    (left, right) => Number(right.version ?? 0) - Number(left.version ?? 0),
  )[0] ?? null;
}

function sameScriptFile(file, upload) {
  if (!file || !upload) return false;
  return (
    file.name === upload.name &&
    Number(file.size ?? 0) === Number(upload.size ?? 0)
  );
}

function appendSharedScriptVersion(record, topic, file, uploadedBy) {
  if (!record || !topic || !file || sameScriptFile(file, latestScriptUpload(record))) {
    return record;
  }
  const version = Math.max(
    0,
    ...(record.uploads ?? []).map((upload) => Number(upload.version ?? 0)),
  ) + 1;
  const uploadedAt = "2026-07-21 16:40";
  return {
    ...record,
    status: topic.projectId ? "已立项" : "待立项",
    returnedReason: "",
    updatedAt: uploadedAt,
    uploads: [
      ...(record.uploads ?? []),
      {
        id: `${record.id}-UPLOAD-${version}`,
        scope: "full",
        episodeNo: null,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file.file ?? file,
        uploadedAt,
        uploadedBy,
        version,
      },
    ],
  };
}

function isScriptRecordComplete(record, episodeCount) {
  if (record?.episodes?.length) {
    const availableEpisodes = new Set(
      record.episodes.map((episode) => Number(episode.episodeNo)),
    );
    return Array.from(
      { length: clampEpisodeCount(episodeCount) },
      (_, index) => index + 1,
    ).every((episodeNo) => availableEpisodes.has(episodeNo));
  }
  const uploads = record?.uploads ?? [];
  if (uploads.some((upload) => upload.scope === "full")) return true;
  const episodeUploads = new Set(
    uploads
      .filter((upload) => upload.scope === "episode")
      .map((upload) => Number(upload.episodeNo)),
  );
  return Array.from(
    { length: clampEpisodeCount(episodeCount) },
    (_, index) => index + 1,
  ).every((episodeNo) => episodeUploads.has(episodeNo));
}

function scriptLibraryStatus(topic, record) {
  if (topic.projectId || record?.projectId) return "已立项";
  if (record?.pendingReview) return "待审核";
  if (record?.reviewStatus === "已驳回" || record?.status === "已退回") return "已驳回";
  if (
    isScriptRecordComplete(record, topic.estimatedEpisodes) &&
    (record?.reviewStatus === "已通过" || (record?.uploads?.length && !record?.reviewStatus))
  ) {
    return "审核通过";
  }
  if (record?.uploads?.length || record?.episodes?.length) return "待补齐";
  return "待上传";
}

function scriptCoverageLabel(record, episodeCount) {
  if (record?.episodes?.length) {
    const episodeNumbers = new Set(
      record.episodes.map((episode) => Number(episode.episodeNo)),
    );
    const cardCount = new Set(
      [...episodeNumbers].map((episodeNo) => scriptCardNoForEpisode(episodeNo)),
    ).size;
    return `${episodeNumbers.size}/${clampEpisodeCount(episodeCount)} 集 · ${cardCount} 个一卡范围`;
  }
  const uploads = record?.uploads ?? [];
  const latestFull = [...uploads]
    .filter((upload) => upload.scope === "full")
    .sort((left, right) => right.version - left.version)[0];
  const episodeUploads = new Set(
    uploads
      .filter((upload) => upload.scope === "episode")
      .map((upload) => Number(upload.episodeNo)),
  );
  if (latestFull && episodeUploads.size) return "历史整部 + 分集文件（待结构化）";
  if (latestFull) return "历史整部文件（待结构化）";
  if (episodeUploads.size) {
    return `${episodeUploads.size}/${clampEpisodeCount(episodeCount)} 集`;
  }
  return "尚未上传";
}

function displayScriptCardVersions(record, topic) {
  const versions = [...(record?.cardVersions ?? [])];
  const linkedUploadIds = new Set(versions.map((version) => version.sourceUploadId));
  (record?.uploads ?? []).forEach((upload) => {
    if (linkedUploadIds.has(upload.id)) return;
    const episodeTotal = clampEpisodeCount(topic.estimatedEpisodes);
    const cards = upload.scope === "episode"
      ? [scriptCardNoForEpisode(upload.episodeNo)]
      : upload.scope === "split"
        ? getAffectedScriptCards((upload.episodeNos ?? []).map((episodeNo) => ({ episodeNo })))
        : Array.from({ length: Math.ceil(episodeTotal / 10) }, (_, index) => index + 1);
    cards.forEach((cardNo) => {
      const range = scriptCardRange(cardNo, episodeTotal);
      versions.push({
        id: `${upload.id}-CARD-${cardNo}`,
        cardNo,
        episodeStart: range.start,
        episodeEnd: range.end,
        version: upload.version,
        sourceUploadId: upload.id,
        sourceFileName: upload.name,
        uploadedAt: upload.uploadedAt,
        uploadedBy: upload.uploadedBy,
        episodes: (record?.episodes ?? []).filter(
          (episode) => episode.episodeNo >= range.start && episode.episodeNo <= range.end,
        ),
        legacy: true,
      });
    });
  });
  return versions;
}

function ScriptHistoryDrawer({ record, topic, onClose }) {
  const allVersions = displayScriptCardVersions(record, topic);
  const cardNumbers = Array.from(
    new Set(allVersions.map((version) => Number(version.cardNo))),
  ).sort((left, right) => left - right);
  const [selectedCardNo, setSelectedCardNo] = useState(cardNumbers[0] ?? 1);
  const visibleVersions = allVersions
    .filter((version) => Number(version.cardNo) === selectedCardNo)
    .sort((left, right) => Number(right.version) - Number(left.version));
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const selectedVersion = allVersions.find((version) => version.id === selectedVersionId);
  return (
    <PlatformDrawer
      wide
      title="剧本版本记录"
      subtitle={`${topic.name} · ${topic.id}`}
      onClose={onClose}
      footer={
        <button className="primary-btn" onClick={onClose} type="button">
          完成查看
        </button>
      }
    >
      <PlatformNotice>
        “一卡”仅表示每 10 集的版本划分范围，不是页面卡片。历史版本只读，不支持比较、恢复或在线编辑。
      </PlatformNotice>
      <div className="platform-script-card-tabs" role="tablist" aria-label="一卡版本范围">
        {cardNumbers.map((cardNo) => {
          const range = scriptCardRange(cardNo, topic.estimatedEpisodes);
          return (
            <button
              aria-selected={selectedCardNo === cardNo}
              className={selectedCardNo === cardNo ? "is-active" : ""}
              key={cardNo}
              onClick={() => {
                setSelectedCardNo(cardNo);
                setSelectedVersionId(null);
              }}
              role="tab"
              type="button"
            >
              第 {range.start}—{range.end} 集
            </button>
          );
        })}
      </div>
      <div className="platform-script-history">
        {visibleVersions.length ? visibleVersions.map((version, index) => (
          <article key={version.id}>
            <span className="platform-script-history__version">
              V{String(version.version).padStart(2, "0")}
            </span>
            <div>
              <strong>第 {version.episodeStart}—{version.episodeEnd} 集完整版本</strong>
              <small>来源文件</small>
              <span className="platform-script-history__source">{version.sourceFileName}</span>
            </div>
            <div>
              <span>{version.uploadedBy}</span>
              <small>{version.uploadedAt}</small>
            </div>
            <button className="platform-topic-row-action is-quiet" onClick={() => setSelectedVersionId(version.id)} type="button">
              查看内容
            </button>
          </article>
        )) : (
          <PlatformEmpty
            title="该范围暂无历史版本"
            description="上传并确认包含该范围内集数的 DOCX 后，完整版本会显示在这里。"
          />
        )}
      </div>
      {selectedVersion ? (
        <section className="platform-script-history-detail">
          <div className="platform-section-heading">
            <div>
              <h3>V{String(selectedVersion.version).padStart(2, "0")} · 第 {selectedVersion.episodeStart}—{selectedVersion.episodeEnd} 集</h3>
              <p>{selectedVersion.uploadedAt} · {selectedVersion.uploadedBy} · {selectedVersion.sourceFileName}</p>
            </div>
            <PlatformBadge tone="neutral">只读</PlatformBadge>
          </div>
          {selectedVersion.episodes?.length ? (
            <div className="platform-script-version-content">
              {selectedVersion.episodes.map((episode) => (
                <article key={`${selectedVersion.id}-${episode.episodeNo}`}>
                  <strong>第 {episode.episodeNo} 集 · {episode.title}</strong>
                  <p>{episode.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <PlatformNotice tone="warning">
              这是旧数据迁移生成的版本索引，正文尚未结构化；来源文件仍保留为 {selectedVersion.sourceFileName}。
            </PlatformNotice>
          )}
        </section>
      ) : null}
    </PlatformDrawer>
  );
}

export function ScriptLibraryPage({ activeRole = "ceo", goPage }) {
  const {
    topics,
    projects,
    scriptLibrary,
    setScriptLibrary,
    beginProjectInitiation,
  } = useDemoData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [historyTopicId, setHistoryTopicId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadStage, setUploadStage] = useState("idle");
  const [previewEpisodes, setPreviewEpisodes] = useState([]);
  const [previewStrategy, setPreviewStrategy] = useState("");
  const [previewIgnoredPrefix, setPreviewIgnoredPrefix] = useState("");
  const [baselineCardVersions, setBaselineCardVersions] = useState({});
  const [reviewTopicId, setReviewTopicId] = useState(null);
  const [reviewMode, setReviewMode] = useState("approve");
  const [reviewComment, setReviewComment] = useState("");
  const [downloadTopicId, setDownloadTopicId] = useState(null);
  const [downloadPurpose, setDownloadPurpose] = useState("");
  const [downloadApprovalTopicId, setDownloadApprovalTopicId] = useState(null);
  const [downloadApprovalRequestId, setDownloadApprovalRequestId] = useState(null);
  const [downloadApprovalComment, setDownloadApprovalComment] = useState("");
  const [downloadFeedback, setDownloadFeedback] = useState("");
  const viewerName = {
    employee: "张小北",
    leader: "江晚",
    hr: "HR-唐宁",
    ceo: "CEO",
  }[activeRole];
  const canInitiate = ["leader", "ceo"].includes(activeRole);
  const canReviewScript = ["leader", "ceo"].includes(activeRole);
  const canApproveDownload = ["leader", "ceo"].includes(activeRole);
  const canUploadTopic = (topic) =>
    ["leader", "ceo"].includes(activeRole) || topic.submitter === viewerName;

  const approvedTopics = topics.filter((topic) => topic.status === "已评估");
  const recordForTopic = (topicId) =>
    scriptLibrary.find((record) => record.topicId === topicId);
  const isApprovedScript = (topic, record) =>
    Boolean(
      record &&
      !record.pendingReview &&
      isScriptRecordComplete(record, topic.estimatedEpisodes) &&
      (record.reviewStatus === "已通过" || (record.uploads?.length && !record.reviewStatus)),
    );
  const selectedTopic = approvedTopics.find(
    (topic) => topic.id === selectedTopicId,
  );
  const selectedRecord = selectedTopic
    ? recordForTopic(selectedTopic.id)
    : null;
  const historyTopic = approvedTopics.find(
    (topic) => topic.id === historyTopicId,
  );
  const historyRecord = historyTopic ? recordForTopic(historyTopic.id) : null;
  const reviewTopic = approvedTopics.find((topic) => topic.id === reviewTopicId);
  const reviewRecord = reviewTopic ? recordForTopic(reviewTopic.id) : null;
  const downloadTopic = approvedTopics.find((topic) => topic.id === downloadTopicId);
  const downloadRecord = downloadTopic ? recordForTopic(downloadTopic.id) : null;
  const downloadApprovalTopic = approvedTopics.find(
    (topic) => topic.id === downloadApprovalTopicId,
  );
  const downloadApprovalRecord = downloadApprovalTopic
    ? recordForTopic(downloadApprovalTopic.id)
    : null;
  const downloadApprovalRequest = downloadApprovalRecord?.downloadRequests?.find(
    (request) => request.id === downloadApprovalRequestId,
  );
  const projectCodeFor = (topic, record) => {
    const projectId = topic.projectId || record?.projectId;
    return projects.find((project) => project.id === projectId)?.projectCode ?? projectId;
  };
  const rows = approvedTopics.map((topic) => {
    const record = recordForTopic(topic.id);
    return {
      topic,
      record,
      status: scriptLibraryStatus(topic, record),
      latest: latestScriptUpload(record),
    };
  });
  const visibleRows = rows.filter(({ topic, status }) => {
    const keyword = query.trim().toLowerCase();
    const matchesQuery =
      !keyword ||
      topic.name.toLowerCase().includes(keyword) ||
      topic.id.toLowerCase().includes(keyword) ||
      topic.submitter.toLowerCase().includes(keyword);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const completeCount = rows.filter(({ topic, record }) =>
    isApprovedScript(topic, record),
  ).length;
  const pendingDownloadCount = rows.reduce(
    (total, { record }) =>
      total +
      (record?.downloadRequests ?? []).filter((request) => request.status === "待审批").length,
    0,
  );
  const statusTabs = [
    { id: "all", label: "全部", count: rows.length },
    { id: "待上传", label: "待上传", count: rows.filter((row) => row.status === "待上传").length },
    { id: "待审核", label: "待审核", count: rows.filter((row) => row.status === "待审核").length },
    { id: "已驳回", label: "已驳回", count: rows.filter((row) => row.status === "已驳回").length },
    { id: "审核通过", label: "审核通过", count: rows.filter((row) => row.status === "审核通过").length },
    { id: "已立项", label: "已立项", count: rows.filter((row) => row.status === "已立项").length },
  ];

  const closeUploader = () => {
    setSelectedTopicId(null);
    setUploadFile(null);
    setUploadError("");
    setUploadStage("idle");
    setPreviewEpisodes([]);
    setPreviewStrategy("");
    setPreviewIgnoredPrefix("");
    setBaselineCardVersions({});
  };
  const openUploader = (topic) => {
    setSelectedTopicId(topic.id);
    setUploadFile(null);
    setUploadError("");
    setUploadStage("idle");
    setPreviewEpisodes([]);
    setPreviewStrategy("");
    setPreviewIgnoredPrefix("");
    setBaselineCardVersions({});
  };
  const selectUploadFile = async (file) => {
    if (!file) return;
    if (!SCRIPT_DOCX_PATTERN.test(file.name)) {
      setUploadFile(null);
      setUploadStage("idle");
      setUploadError("仅支持 DOCX 格式的剧本文件，不支持 DOC、PDF、TXT 或扫描件。");
      return;
    }
    setUploadFile(file);
    setUploadError("");
    setUploadStage("parsing");
    setPreviewEpisodes([]);
    try {
      const text = await extractDocxText(file);
      const result = parseScriptText(text);
      setPreviewEpisodes(result.episodes);
      setPreviewStrategy(result.strategy);
      setPreviewIgnoredPrefix(result.ignoredPrefix);
      const affectedCards = getAffectedScriptCards(result.episodes);
      setBaselineCardVersions(getScriptCardVersionMap(recordForTopic(selectedTopicId), affectedCards));
      setUploadStage("preview");
    } catch (error) {
      setUploadStage("idle");
      setUploadError(error.message || "文档解析失败，请检查文件后重试。");
    }
  };
  const updatePreviewEpisode = (id, field, value) => {
    setPreviewEpisodes((episodes) => episodes.map((episode) =>
      episode.id === id
        ? { ...episode, [field]: field === "episodeNo" ? Number(value) : value }
        : episode,
    ));
  };
  const removePreviewEpisode = (id) => {
    setPreviewEpisodes((episodes) => episodes.filter((episode) => episode.id !== id));
  };
  const addPreviewEpisode = () => {
    setPreviewEpisodes((episodes) => [
      ...episodes,
      {
        id: `preview-manual-${Date.now()}`,
        episodeNo: (episodes.at(-1)?.episodeNo ?? 0) + 1,
        title: "新增拆分项",
        content: "",
        detectedBy: "人工调整",
      },
    ]);
  };
  const previewIssues = validateScriptEpisodes(
    previewEpisodes,
    selectedTopic?.estimatedEpisodes ?? 1,
  );
  const issuesForEpisode = (episodeId) =>
    previewIssues.filter((issue) => issue.key === episodeId);
  const saveUpload = () => {
    if (!selectedTopic || !uploadFile || previewIssues.length) return;
    const existing = recordForTopic(selectedTopic.id);
    if (hasScriptCardConflict(existing, baselineCardVersions)) {
      setUploadStage("conflict");
      setUploadError("剧本已更新，请刷新后重新上传并确认。");
      return;
    }
    const uploadedAt = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date()).replaceAll("/", "-");
    setUploadStage("saving");
    setScriptLibrary((records) => {
      const recordId =
        existing?.id ?? `SCRIPT-LIB-${selectedTopic.id.replace("TOPIC-", "")}`;
      const pendingReview = {
        id: `${recordId}-REVIEW-${Date.now()}`,
        submittedAt: uploadedAt,
        submittedBy: viewerName,
        status: "待审核",
        file: {
          name: uploadFile.name,
          size: uploadFile.size,
          type: uploadFile.type,
          file: uploadFile,
        },
        episodes: previewEpisodes.map((episode) => ({ ...episode })),
        baselineCardVersions: { ...baselineCardVersions },
      };
      if (!existing) {
        const nextRecord = {
          id: recordId,
          topicId: selectedTopic.id,
          status: "待审核",
          projectId: null,
          returnedReason: "",
          uploads: [],
          episodes: [],
          cardVersions: [],
          reviewStatus: "待审核",
          reviewHistory: [],
          downloadRequests: [],
          pendingReview,
          updatedAt: uploadedAt,
        };
        return [
          ...records,
          nextRecord,
        ];
      }
      return records.map((record) =>
        record.topicId === selectedTopic.id
          ? {
              ...record,
              status: "待审核",
              reviewStatus: "待审核",
              returnedReason: "",
              uploadedAt,
              updatedAt: uploadedAt,
              pendingReview,
            }
          : record,
      );
    });
    setUploadFile(null);
    setUploadError("");
    setUploadStage("success");
  };
  const actionTimestamp = () =>
    new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date()).replaceAll("/", "-");
  const openScriptReview = (topic) => {
    setReviewTopicId(topic.id);
    setReviewMode("approve");
    setReviewComment("");
  };
  const approveScriptReview = () => {
    const pending = reviewRecord?.pendingReview;
    if (!reviewTopic || !pending) return;
    if (hasScriptCardConflict(reviewRecord, pending.baselineCardVersions)) {
      setReviewComment("当前正式剧本已在提交后发生变化，请驳回并由提交人重新生成预览。");
      setReviewMode("reject");
      return;
    }
    const reviewedAt = actionTimestamp();
    setScriptLibrary((records) =>
      records.map((record) => {
        if (record.topicId !== reviewTopic.id || !record.pendingReview) return record;
        const submission = record.pendingReview;
        const applied = applyScriptEpisodeUpload(
          {
            ...record,
            pendingReview: null,
          },
          {
            episodeTotal: reviewTopic.estimatedEpisodes,
            episodes: submission.episodes,
            file: submission.file,
            uploadedAt: submission.submittedAt,
            uploadedBy: submission.submittedBy,
          },
        );
        return {
          ...applied,
          status: "审核通过",
          reviewStatus: "已通过",
          returnedReason: "",
          pendingReview: null,
          lastReviewComment: reviewComment.trim(),
          reviewHistory: [
            ...(record.reviewHistory ?? []),
            {
              id: `${submission.id}-RESULT`,
              submissionId: submission.id,
              decision: "通过",
              comment: reviewComment.trim(),
              reviewedAt,
              reviewedBy: viewerName,
              submittedAt: submission.submittedAt,
              submittedBy: submission.submittedBy,
              fileName: submission.file.name,
            },
          ],
        };
      }),
    );
    setReviewTopicId(null);
    setReviewComment("");
  };
  const rejectScriptReview = () => {
    const pending = reviewRecord?.pendingReview;
    if (!reviewTopic || !pending || !reviewComment.trim()) return;
    const reviewedAt = actionTimestamp();
    setScriptLibrary((records) =>
      records.map((record) =>
        record.topicId === reviewTopic.id && record.pendingReview
          ? {
              ...record,
              status: "已驳回",
              reviewStatus: "已驳回",
              returnedReason: reviewComment.trim(),
              lastRejectedSubmission: {
                ...record.pendingReview,
                rejectedAt: reviewedAt,
                rejectedBy: viewerName,
                comment: reviewComment.trim(),
              },
              pendingReview: null,
              updatedAt: reviewedAt,
              reviewHistory: [
                ...(record.reviewHistory ?? []),
                {
                  id: `${record.pendingReview.id}-RESULT`,
                  submissionId: record.pendingReview.id,
                  decision: "驳回",
                  comment: reviewComment.trim(),
                  reviewedAt,
                  reviewedBy: viewerName,
                  submittedAt: record.pendingReview.submittedAt,
                  submittedBy: record.pendingReview.submittedBy,
                  fileName: record.pendingReview.file.name,
                },
              ],
            }
          : record,
      ),
    );
    setReviewTopicId(null);
    setReviewComment("");
  };
  const openDownloadRequest = (topic) => {
    if (!isApprovedScript(topic, recordForTopic(topic.id))) return;
    setDownloadTopicId(topic.id);
    setDownloadPurpose("");
  };
  const submitDownloadRequest = () => {
    if (!downloadTopic || !downloadRecord || !downloadPurpose.trim()) return;
    const requestedAt = actionTimestamp();
    setScriptLibrary((records) =>
      records.map((record) =>
        record.topicId === downloadTopic.id
          ? {
              ...record,
              downloadRequests: [
                ...(record.downloadRequests ?? []),
                {
                  id: `${record.id}-DOWNLOAD-${Date.now()}`,
                  applicant: viewerName,
                  purpose: downloadPurpose.trim(),
                  status: "待审批",
                  requestedAt,
                  approver: "",
                  approvalComment: "",
                  decidedAt: "",
                },
              ],
            }
          : record,
      ),
    );
    setDownloadTopicId(null);
    setDownloadPurpose("");
    setDownloadFeedback(`“${downloadTopic.name}”下载申请已提交，等待审批。`);
  };
  const openDownloadApproval = (topic, request) => {
    setDownloadApprovalTopicId(topic.id);
    setDownloadApprovalRequestId(request.id);
    setDownloadApprovalComment("");
  };
  const decideDownloadRequest = (decision) => {
    if (
      !downloadApprovalTopic ||
      !downloadApprovalRequest ||
      (decision === "已驳回" && !downloadApprovalComment.trim())
    ) {
      return;
    }
    const decidedAt = actionTimestamp();
    setScriptLibrary((records) =>
      records.map((record) =>
        record.topicId === downloadApprovalTopic.id
          ? {
              ...record,
              downloadRequests: (record.downloadRequests ?? []).map((request) =>
                request.id === downloadApprovalRequest.id
                  ? {
                      ...request,
                      status: decision,
                      approver: viewerName,
                      approvalComment: downloadApprovalComment.trim(),
                      decidedAt,
                    }
                  : request,
              ),
            }
          : record,
      ),
    );
    setDownloadApprovalTopicId(null);
    setDownloadApprovalRequestId(null);
    setDownloadApprovalComment("");
    setDownloadFeedback(
      `“${downloadApprovalTopic.name}”的下载申请已${decision === "已通过" ? "通过" : "驳回"}。`,
    );
  };
  const downloadApprovedScript = (topic, record) => {
    const approvedRequest = [...(record?.downloadRequests ?? [])]
      .reverse()
      .find((request) => request.applicant === viewerName && request.status === "已通过");
    if (!approvedRequest) return;
    const latest = latestScriptUpload(record);
    const storedFile =
      typeof Blob !== "undefined" && latest?.file instanceof Blob
        ? latest.file
        : null;
    const fallbackText = (record?.episodes ?? [])
      .map(
        (episode) =>
          `第${episode.episodeNo}集：${episode.title}\n${episode.content}`,
      )
      .join("\n\n");
    const blob = storedFile ?? new Blob([fallbackText], { type: "text/plain;charset=utf-8" });
    const fileName = storedFile
      ? latest.name
      : `${topic.name.replace(/[《》]/g, "")}-审核通过版.txt`;
    if (typeof URL.createObjectURL === "function") {
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(href);
    }
    setDownloadFeedback(`“${topic.name}”已通过审批，下载文件 ${fileName} 已生成。`);
  };
  const initiateProject = (topic) => {
    beginProjectInitiation(topic.id);
    closeUploader();
    goPage("project-management");
  };
  const selectedComplete = selectedTopic
    ? isScriptRecordComplete(selectedRecord, selectedTopic.estimatedEpisodes)
    : false;

  const tableColumns = [
    { label: "剧本 / 选题", width: "minmax(210px, 1.35fr)" },
    { label: "题材 / 集数", width: "minmax(120px, .75fr)" },
    { label: "上传人", width: "90px" },
    { label: "上传覆盖", width: "minmax(145px, .9fr)" },
    { label: "最新版本", width: "minmax(175px, 1.05fr)" },
    { label: "状态", width: "88px" },
    { label: "关联项目", width: "minmax(170px, 1fr)" },
    { label: "更新时间", width: "135px" },
    { label: "操作", width: "248px" },
  ];
  const tableGrid = tableColumns.map((column) => column.width).join(" ");

  return (
    <div className="platform-page platform-script-library">
      <PlatformHeader
        eyebrow="内容与项目"
        title="剧本库"
        description="承接评估通过的选题，完成 DOCX 拆集预览、剧本审核与下载申请审批，全程保留版本和处理意见。"
      />
      <PlatformMetrics
        items={[
          { label: "入库选题", value: rows.length, unit: "个", meta: "评估通过后自动进入", tone: "blue" },
          { label: "审核通过", value: completeCount, unit: "个", meta: "可立项、可申请下载", tone: "green" },
          { label: "待上传", value: rows.filter((row) => row.status === "待上传").length, unit: "个", meta: "等待提交人或编剧", tone: "amber" },
          { label: "待审核", value: rows.filter((row) => row.status === "待审核").length, unit: "个", meta: "等待 Leader / CEO", tone: "purple" },
          { label: "下载待审批", value: pendingDownloadCount, unit: "个", meta: "审核通过版本", tone: "cyan" },
          { label: "已驳回", value: rows.filter((row) => row.status === "已驳回").length, unit: "个", meta: "批注已反馈提交人", tone: "red" },
        ]}
      />
      {downloadFeedback ? (
        <div className="platform-access-feedback" role="status">
          {downloadFeedback}
        </div>
      ) : null}
      <PlatformCard
        title="选题剧本台账"
        description={`共 ${visibleRows.length} 条结果 · 上传确认后进入审核，通过后才写入正式版本`}
      >
        <PlatformFilter
          actions={
            <button
              className="ghost-chip"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              type="button"
            >
              重置
            </button>
          }
        >
          <label className="platform-script-search">
            <span>剧本 / 选题 / 上传人</span>
            <div>
              <MagnifyingGlass size={16} />
              <input
                aria-label="搜索剧本"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="输入关键词"
                value={query}
              />
            </div>
          </label>
        </PlatformFilter>
        <div className="platform-topic-status-tabs platform-script-status-tabs">
          <PlatformTabs
            ariaLabel="剧本状态筛选"
            items={statusTabs}
            onChange={setStatusFilter}
            value={statusFilter}
          />
        </div>
        <DataTable
          columns={tableColumns}
          minWidth={1510}
          className="platform-script-table platform-table--single-line"
        >
          {visibleRows.length ? visibleRows.map(({ topic, record, status, latest }) => {
            const ownDownloadRequests = (record?.downloadRequests ?? []).filter(
              (request) => request.applicant === viewerName,
            );
            const latestOwnDownloadRequest = ownDownloadRequests.at(-1);
            const pendingApprovalRequest = (record?.downloadRequests ?? []).find(
              (request) => request.status === "待审批" && request.applicant !== viewerName,
            );
            const canUseApprovedScript = isApprovedScript(topic, record);
            return (
              <div
              className="platform-table__row platform-script-table__row"
              key={topic.id}
              style={{ gridTemplateColumns: tableGrid }}
            >
              <div className="platform-table-inline-cell">
                <strong>{topic.name}</strong>
                <small>{topic.id} · {topic.summary}</small>
              </div>
              <div className="platform-table-inline-cell">
                <span>{topic.genre}</span>
                <small>{topic.estimatedEpisodes} 集</small>
              </div>
              <strong>{topic.submitter}</strong>
              <div className="platform-table-inline-cell">
                <span>{scriptCoverageLabel(record, topic.estimatedEpisodes)}</span>
                <small>{(record?.uploads ?? []).length} 次上传</small>
              </div>
              <div className="platform-table-inline-cell">
                <span>
                  {record?.pendingReview
                    ? `待审 · ${record.pendingReview.file.name}`
                    : latest
                      ? `V${String(latest.version).padStart(2, "0")} · ${latest.name}`
                      : "—"}
                </span>
                <small>{record?.pendingReview ? (
                  `${record.pendingReview.episodes.length} 集 · ${record.pendingReview.submittedBy} 已提交`
                ) : latest ? (
                  latest.scope === "full"
                    ? "历史整部文件"
                    : latest.scope === "episode"
                      ? `历史单集 · 第 ${latest.episodeNo} 集`
                      : `${latest.episodeNos?.length ?? 0} 集拆分确认`
                ) : "等待上传"}</small>
              </div>
              <PlatformBadge tone={status === "待审核" ? "primary" : ["审核通过", "已立项"].includes(status) ? "success" : status === "已驳回" ? "warning" : "neutral"}>
                {status}
              </PlatformBadge>
              <div className="platform-table-inline-cell">
                {status === "已立项" ? (
                  <button className="table-link" onClick={() => goPage("project-management")} type="button">
                    {projectCodeFor(topic, record)}
                  </button>
                ) : (
                  <span>尚未立项</span>
                )}
                <small>{status === "已立项" ? "点击查看项目" : "由项目管理生成编号"}</small>
              </div>
              <span>{record?.updatedAt ?? topic.updatedAt}</span>
              <div className="platform-script-table__actions">
                {record?.pendingReview ? (
                  <button
                    className="platform-topic-row-action"
                    disabled={!canReviewScript}
                    onClick={() => openScriptReview(topic)}
                    type="button"
                  >
                    {canReviewScript ? "审核" : "审核中"}
                  </button>
                ) : (
                  <button className="platform-topic-row-action is-quiet" disabled={!canUploadTopic(topic)} onClick={() => openUploader(topic)} type="button">
                    {record?.uploads?.length ? "更新" : "上传"}
                  </button>
                )}
                {canUploadTopic(topic) ? (
                  <button className="platform-topic-row-action is-quiet" onClick={() => setHistoryTopicId(topic.id)} type="button">
                    版本
                  </button>
                ) : null}
                <button
                  className="platform-topic-row-action"
                  disabled={status !== "审核通过" || !canInitiate}
                  onClick={() => initiateProject(topic)}
                  type="button"
                >
                  立项
                </button>
                {canApproveDownload && pendingApprovalRequest ? (
                  <button
                    className="platform-topic-row-action"
                    onClick={() => openDownloadApproval(topic, pendingApprovalRequest)}
                    type="button"
                  >
                    审批下载
                  </button>
                ) : latestOwnDownloadRequest?.status === "已通过" ? (
                  <button
                    className="platform-topic-row-action"
                    onClick={() => downloadApprovedScript(topic, record)}
                    type="button"
                  >
                    下载
                  </button>
                ) : latestOwnDownloadRequest?.status === "待审批" ? (
                  <button className="platform-topic-row-action is-quiet" disabled type="button">
                    申请审批中
                  </button>
                ) : (
                  <button
                    className="platform-topic-row-action is-quiet"
                    disabled={!canUseApprovedScript}
                    onClick={() => openDownloadRequest(topic)}
                    type="button"
                  >
                    {latestOwnDownloadRequest?.status === "已驳回" ? "重新申请" : "申请下载"}
                  </button>
                )}
              </div>
              </div>
            );
          }) : (
            <PlatformEmpty
              title="暂无匹配剧本"
              description="评估通过的选题会自动进入剧本库。"
            />
          )}
        </DataTable>
      </PlatformCard>
      {selectedTopic ? (
        <PlatformDrawer
          wide
          title="上传与管理剧本"
          subtitle={`${selectedTopic.name} · ${selectedTopic.id} · ${selectedTopic.estimatedEpisodes} 集`}
          onClose={closeUploader}
          footer={
            uploadStage === "preview" ? (
              <>
                <button className="ghost-chip" onClick={() => {
                  setUploadFile(null);
                  setPreviewEpisodes([]);
                  setUploadStage("idle");
                }} type="button">取消本次上传</button>
                <button className="primary-btn" disabled={Boolean(previewIssues.length)} onClick={saveUpload} type="button">确认并提交审核</button>
              </>
            ) : uploadStage === "saving" ? (
              <button className="primary-btn" disabled type="button">正在保存…</button>
            ) : uploadStage === "success" ? (
              <button className="primary-btn" onClick={closeUploader} type="button">完成</button>
            ) : uploadStage === "conflict" ? (
              <>
                <button className="ghost-chip" onClick={closeUploader} type="button">关闭</button>
                <button className="primary-btn" onClick={() => openUploader(selectedTopic)} type="button">刷新后重新上传</button>
              </>
            ) : (
              <>
                <button className="ghost-chip" onClick={closeUploader} type="button">关闭</button>
                <button
                  className="primary-btn"
                  disabled={!canInitiate || !selectedComplete || Boolean(selectedTopic.projectId) || scriptLibraryStatus(selectedTopic, selectedRecord) !== "审核通过"}
                  onClick={() => initiateProject(selectedTopic)}
                  type="button"
                >
                  前往项目管理立项
                  <ArrowRight size={16} />
                </button>
              </>
            )
          }
        >
          <div className="platform-detail-hero platform-script-hero">
            <span><FileText size={24} weight="duotone" /></span>
            <div>
              <PlatformBadge tone={selectedComplete ? "success" : "warning"}>
                {selectedRecord?.pendingReview
                  ? "剧本待审核"
                  : selectedComplete
                    ? "正式剧本已完整"
                    : "剧本待补齐"}
              </PlatformBadge>
              <h3>{selectedTopic.name}</h3>
              <p>{selectedTopic.genre} · {selectedTopic.estimatedEpisodes} 集 · 上传人 {selectedTopic.submitter}</p>
            </div>
          </div>
          <PlatformNotice>
            仅支持 DOCX。系统先按“第 X 集”标题拆分，无法确定时使用 AI 辅助；确认后先进入审核，审核通过才写入正式剧本。
          </PlatformNotice>
          <section className="platform-script-upload-panel">
            <div className="platform-project-form__heading">
              <div><span>上传与拆分</span><h3>选择 DOCX 剧本文档</h3></div>
              <small>标题规则优先 · AI 辅助兜底</small>
            </div>
            <label className={`platform-script-dropzone ${uploadFile ? "has-file" : ""}`}>
              <UploadSimple size={22} weight="duotone" />
              <span>
                <strong>{uploadFile?.name ?? "选择 DOCX 剧本文件"}</strong>
                <small>{uploadFile ? formatContractSize(uploadFile.size) : "上传后自动进入拆分预览"}</small>
              </span>
              <input accept=".docx" aria-label="上传剧本文件" disabled={uploadStage === "parsing" || uploadStage === "saving"} onChange={(event) => selectUploadFile(event.target.files?.[0])} type="file" />
            </label>
            {uploadStage === "parsing" ? (
              <div className="platform-script-processing" role="status">
                <span className="platform-script-processing__pulse" />
                <div><strong>正在拆分剧本</strong><small>先识别标准集标题，再处理需要 AI 辅助的边界。</small></div>
              </div>
            ) : null}
            {uploadError ? <PlatformNotice tone="warning">{uploadError}</PlatformNotice> : null}
          </section>
          {uploadStage === "preview" ? (
            <section className="platform-script-preview">
              <div className="platform-section-heading">
                <div>
                  <h3>拆分预览</h3>
                  <p>识别 {previewEpisodes.length} 集 · {previewStrategy} · {previewIssues.length} 处异常</p>
                </div>
                <div className="platform-script-preview__actions">
                  <PlatformBadge tone={previewIssues.length ? "warning" : "success"}>{previewIssues.length ? "需要修正" : "校验通过"}</PlatformBadge>
                  <button className="ghost-chip" onClick={addPreviewEpisode} type="button"><Plus size={14} />添加拆分项</button>
                </div>
              </div>
              {previewIgnoredPrefix ? <PlatformNotice>文档标题或前言不会作为单集正文入库。</PlatformNotice> : null}
              {previewIssues.some((issue) => issue.key === "document") ? (
                <PlatformNotice tone="warning">未识别到单集内容，请添加拆分项并补充集数、标题和正文。</PlatformNotice>
              ) : null}
              <div className="platform-script-preview-list">
                {previewEpisodes.map((episode) => {
                  const episodeIssues = issuesForEpisode(episode.id);
                  return (
                    <article className={episodeIssues.length ? "has-error" : ""} key={episode.id}>
                      <div className="platform-script-preview-row">
                        <label><span>集数</span><input aria-label={`${episode.title}集数`} max={selectedTopic.estimatedEpisodes} min="1" onChange={(event) => updatePreviewEpisode(episode.id, "episodeNo", event.target.value)} type="number" value={episode.episodeNo} /></label>
                        <label><span>标题</span><input aria-label={`第${episode.episodeNo}集标题`} onChange={(event) => updatePreviewEpisode(episode.id, "title", event.target.value)} value={episode.title} /></label>
                        <PlatformBadge tone={episode.detectedBy === "规则识别" ? "neutral" : "primary"}>{episode.detectedBy}</PlatformBadge>
                        <button aria-label={`删除第${episode.episodeNo}集拆分项`} className="platform-icon-btn" onClick={() => removePreviewEpisode(episode.id)} type="button"><Trash size={15} /></button>
                      </div>
                      <label className="platform-script-preview-content"><span>正文</span><textarea aria-label={`第${episode.episodeNo}集正文`} onChange={(event) => updatePreviewEpisode(episode.id, "content", event.target.value)} rows={5} value={episode.content} /></label>
                      {episodeIssues.length ? (
                        <div className="platform-script-preview-errors">
                          {episodeIssues.map((issue) => <span key={`${episode.id}-${issue.type}`}><WarningCircle size={14} />{issue.message}</span>)}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
          {uploadStage === "success" ? (
            <PlatformNotice tone="success">剧本已提交审核；审核通过后才会覆盖匹配集数，并为受影响的每个“一卡”范围生成只读历史版本。</PlatformNotice>
          ) : null}
          {selectedRecord?.returnedReason ? (
            <PlatformNotice tone="warning">最近退回原因：{selectedRecord.returnedReason}</PlatformNotice>
          ) : null}
          <section className="platform-script-current">
            <div className="platform-section-heading">
              <div><h3>当前剧本概览</h3><p>只覆盖本次上传的单集；每 10 集按一个“一卡”范围记录历史。</p></div>
              <button className="ghost-chip" onClick={() => setHistoryTopicId(selectedTopic.id)} type="button">查看版本记录</button>
            </div>
            <div className="platform-detail-grid">
              <div><span>上传覆盖</span><strong>{scriptCoverageLabel(selectedRecord, selectedTopic.estimatedEpisodes)}</strong></div>
              <div><span>一卡版本</span><strong>{selectedRecord?.cardVersions?.length ?? 0} 条</strong></div>
              <div><span>最新文件</span><strong>{latestScriptUpload(selectedRecord)?.name ?? "尚未上传"}</strong></div>
              <div><span>更新时间</span><strong>{selectedRecord?.updatedAt ?? "—"}</strong></div>
            </div>
            {(selectedRecord?.reviewHistory ?? []).length ? (
              <div className="platform-script-review-history">
                <div className="platform-section-heading">
                  <div><h3>审核记录</h3><p>保留每次提交的结论、处理人和批注意见。</p></div>
                </div>
                {[...(selectedRecord.reviewHistory ?? [])].reverse().map((item) => (
                  <article key={item.id}>
                    <PlatformBadge tone={item.decision === "通过" ? "success" : "warning"}>
                      {item.decision}
                    </PlatformBadge>
                    <div>
                      <strong>{item.fileName}</strong>
                      <span>{item.reviewedAt} · {item.reviewedBy}</span>
                      <p>{item.comment || "审核通过，未填写补充意见。"}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </PlatformDrawer>
      ) : null}
      {reviewTopic && reviewRecord?.pendingReview ? (
        <PlatformDrawer
          wide
          title="剧本审核"
          subtitle={`${reviewTopic.name} · ${reviewRecord.pendingReview.file.name}`}
          onClose={() => setReviewTopicId(null)}
          footer={
            <>
              <button className="ghost-chip" onClick={() => setReviewTopicId(null)} type="button">
                取消
              </button>
              <button
                className="platform-danger-btn"
                disabled={reviewMode === "reject" && !reviewComment.trim()}
                onClick={() => {
                  if (reviewMode !== "reject") {
                    setReviewMode("reject");
                    return;
                  }
                  rejectScriptReview();
                }}
                type="button"
              >
                {reviewMode === "reject" ? "确认驳回" : "驳回并批注"}
              </button>
              <button className="primary-btn" onClick={approveScriptReview} type="button">
                审核通过
              </button>
            </>
          }
        >
          <div className="platform-detail-hero platform-script-hero">
            <span><ShieldCheck size={24} weight="duotone" /></span>
            <div>
              <PlatformBadge tone="primary">待审核</PlatformBadge>
              <h3>{reviewTopic.name}</h3>
              <p>
                {reviewRecord.pendingReview.submittedBy} 提交于 {reviewRecord.pendingReview.submittedAt}
              </p>
            </div>
          </div>
          <section className="platform-script-review-summary">
            <div><span>文件</span><strong>{reviewRecord.pendingReview.file.name}</strong></div>
            <div><span>文件大小</span><strong>{formatContractSize(reviewRecord.pendingReview.file.size)}</strong></div>
            <div><span>本次识别</span><strong>{reviewRecord.pendingReview.episodes.length} 集</strong></div>
            <div><span>影响范围</span><strong>{getAffectedScriptCards(reviewRecord.pendingReview.episodes).length} 个“一卡”范围</strong></div>
          </section>
          <section className="platform-script-preview platform-script-review-preview">
            <div className="platform-section-heading">
              <div>
                <h3>提交内容</h3>
                <p>审核通过后仅覆盖本次列出的集数，其余正式剧本保持不变。</p>
              </div>
              <PlatformBadge tone="neutral">只读预览</PlatformBadge>
            </div>
            <div className="platform-script-preview-list">
              {reviewRecord.pendingReview.episodes.map((episode) => (
                <article key={`${reviewRecord.pendingReview.id}-${episode.episodeNo}`}>
                  <div className="platform-script-review-episode-title">
                    <strong>第 {episode.episodeNo} 集 · {episode.title}</strong>
                    <PlatformBadge tone="neutral">{episode.detectedBy}</PlatformBadge>
                  </div>
                  <p>{episode.content}</p>
                </article>
              ))}
            </div>
          </section>
          <section className={`platform-script-review-comment ${reviewMode === "reject" ? "is-required" : ""}`}>
            <label>
              <span>{reviewMode === "reject" ? "驳回批注 *" : "审核意见（选填）"}</span>
              <textarea
                aria-label={reviewMode === "reject" ? "剧本驳回批注" : "剧本审核意见"}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder={reviewMode === "reject" ? "请明确指出需要修改的集数、位置和建议" : "可填写审核通过说明"}
                rows={4}
                value={reviewComment}
              />
            </label>
            {reviewMode === "reject" ? <small>驳回批注会同步给提交人，并保留在审核记录中。</small> : null}
          </section>
        </PlatformDrawer>
      ) : null}
      {downloadTopic && downloadRecord ? (
        <PlatformDrawer
          title="申请下载剧本"
          subtitle={`${downloadTopic.name} · 当前正式审核通过版本`}
          onClose={() => setDownloadTopicId(null)}
          footer={
            <>
              <button className="ghost-chip" onClick={() => setDownloadTopicId(null)} type="button">取消</button>
              <button className="primary-btn" disabled={!downloadPurpose.trim()} onClick={submitDownloadRequest} type="button">提交下载申请</button>
            </>
          }
        >
          <PlatformNotice>
            下载申请只对应当前审核通过版本；后续剧本更新不会自动扩大本次授权范围。
          </PlatformNotice>
          <section className="platform-script-download-card">
            <div><span>剧本</span><strong>{downloadTopic.name}</strong></div>
            <div><span>当前文件</span><strong>{latestScriptUpload(downloadRecord)?.name ?? "结构化剧本"}</strong></div>
            <div><span>申请人</span><strong>{viewerName}</strong></div>
            <div><span>审批人</span><strong>Leader / CEO</strong></div>
          </section>
          <label className="platform-script-download-purpose">
            <span>下载用途 <b>*</b></span>
            <textarea
              aria-label="剧本下载用途"
              onChange={(event) => setDownloadPurpose(event.target.value)}
              placeholder="请说明使用场景、接收对象及必要性"
              rows={5}
              value={downloadPurpose}
            />
          </label>
        </PlatformDrawer>
      ) : null}
      {downloadApprovalTopic && downloadApprovalRequest ? (
        <PlatformDrawer
          title="下载申请审批"
          subtitle={`${downloadApprovalTopic.name} · ${downloadApprovalRequest.applicant}`}
          onClose={() => setDownloadApprovalTopicId(null)}
          footer={
            <>
              <button className="ghost-chip" onClick={() => setDownloadApprovalTopicId(null)} type="button">取消</button>
              <button className="platform-danger-btn" disabled={!downloadApprovalComment.trim()} onClick={() => decideDownloadRequest("已驳回")} type="button">驳回申请</button>
              <button className="primary-btn" onClick={() => decideDownloadRequest("已通过")} type="button">审批通过</button>
            </>
          }
        >
          <section className="platform-script-download-card">
            <div><span>申请人</span><strong>{downloadApprovalRequest.applicant}</strong></div>
            <div><span>申请时间</span><strong>{downloadApprovalRequest.requestedAt}</strong></div>
            <div className="is-wide"><span>下载用途</span><strong>{downloadApprovalRequest.purpose}</strong></div>
            <div><span>正式版本</span><strong>{latestScriptUpload(downloadApprovalRecord)?.name ?? "结构化剧本"}</strong></div>
          </section>
          <label className="platform-script-download-purpose">
            <span>审批意见{downloadApprovalComment.trim() ? "" : "（驳回时必填）"}</span>
            <textarea
              aria-label="下载审批意见"
              onChange={(event) => setDownloadApprovalComment(event.target.value)}
              placeholder="通过可选填，驳回请说明原因"
              rows={5}
              value={downloadApprovalComment}
            />
          </label>
        </PlatformDrawer>
      ) : null}
      {historyTopic ? (
        <ScriptHistoryDrawer
          onClose={() => setHistoryTopicId(null)}
          record={historyRecord}
          topic={historyTopic}
        />
      ) : null}
    </div>
  );
}

const PROJECT_ASSIGNMENT_PEOPLE = {
  编剧: ["张小北", "周编剧", "许俊流", "江晚"],
  制作: ["林制作", "王芳", "刘雨桐", "顾晨"],
  剪辑: ["沈婉瑶", "陈组长", "李晓言", "张小北"],
  制片: ["林制作", "沈婉瑶", "江晚", "罗语萱"],
};

const PROJECT_FORM_ROLES = ["编剧", "制作", "剪辑", "制片"];
const PROJECT_FORM_PEOPLE = Array.from(
  new Set(Object.values(PROJECT_ASSIGNMENT_PEOPLE).flat()),
);

function createProjectStaffing(project, episodeCount) {
  const assignments = project ? selectProjectTaskAssignments(project) : [];
  return PROJECT_FORM_ROLES.map((role, roleIndex) => {
    const saved = project?.staffing?.find((item) => item.role === role);
    if (saved) {
      return {
        ...saved,
        rows: (saved.rows?.length ? saved.rows : [{}]).map((row, rowIndex) => ({
          id: row.id ?? `${role}-person-${rowIndex + 1}`,
          person: row.person ?? "",
          episodeStart: Number(row.episodeStart) || 1,
          episodeEnd: Number(row.episodeEnd) || episodeCount,
          durationDays: row.durationDays ?? "",
        })),
      };
    }
    const assignment = assignments.find((item) => item.role === role);
    return {
      id: `${role}-staffing-${roleIndex + 1}`,
      role,
      reviewEnabled: Boolean(assignment?.reviewEnabled),
      reviewer: assignment?.reviewer ?? "",
      rows: [
        {
          id: `${role}-person-1`,
          person:
            assignment?.owner && assignment.owner !== "待分配"
              ? assignment.owner
              : "",
          episodeStart: 1,
          episodeEnd: episodeCount,
          durationDays: assignment?.durationDays ?? "",
        },
      ],
    };
  });
}

function createProjectFormDraft(project) {
  const episodeCount = clampEpisodeCount(
    project?.episodeCount ??
      project?.videoEpisodes ??
      project?.videos?.length ??
      project?.scriptEpisodes ??
      project?.scripts?.length ??
      3,
  );
  return {
    name: project?.name ?? "",
    genre: project?.genre ?? "都市情感",
    mode: project?.mode ?? "内部制作",
    owner: project?.owner ?? "沈婉瑶",
    start: project?.start ?? "2026-07-21",
    deadline: project?.due ?? project?.deadline ?? "2026-08-31",
    budget: Number(project?.budget ?? 100000),
    episodeCount,
    scriptEpisodes: episodeCount,
    videoEpisodes: episodeCount,
    manpowerCost: Number(project?.manpowerCost ?? 0),
    computeCost: Number(project?.computeCost ?? 0),
    trafficCost: Number(project?.trafficCost ?? 0),
    contractFile: project?.contract ?? null,
    vendorCompanyName:
      project?.vendorCompanyName ??
      (project?.vendor && project.vendor !== "待录入" ? project.vendor : ""),
    vendorAccount:
      project?.vendorAccount ??
      externalVendorAccountFor(project?.vendorCompanyName ?? project?.vendor),
    vendorContactName:
      project?.vendorContactName ??
      (project?.contact && project.contact !== "待录入" ? project.contact : ""),
    vendorContactPhone: project?.vendorContactPhone ?? project?.contactPhone ?? "",
    externalScriptShareMode:
      project?.externalScriptShareMode ??
      (project?.mode === "外部制作" ? "all" : ""),
    externalScriptCardNo: project?.externalScriptCardNo ?? "",
    scriptFile: project?.scriptFile ?? null,
    topicId: project?.topicId ?? null,
    topic: project?.topic ?? (project?.topicId ? project.topicId : "独立创建"),
    scriptLibraryRecordId: project?.scriptLibraryRecordId ?? null,
    staffing: createProjectStaffing(project, episodeCount),
  };
}

function normalizedProjectStaffing(
  staffing = [],
  episodeCount = 1,
  mode = "内部制作",
) {
  const relevantStaffing =
    mode === "外部制作"
      ? staffing.filter((role) => role.role === "制片")
      : staffing;
  return relevantStaffing.map((role) => ({
    ...role,
    reviewer: role.reviewEnabled ? role.reviewer : "",
    rows: role.rows.map((row) => ({
      ...row,
      episodeStart: Math.min(
        episodeCount,
        Math.max(1, Number(row.episodeStart) || 1),
      ),
      episodeEnd: Math.min(
        episodeCount,
        Math.max(1, Number(row.episodeEnd) || episodeCount),
      ),
      durationDays: Math.max(0, Number(row.durationDays) || 0),
    })),
  }));
}

function projectOwnerForRole(staffing, role, fallback = "待分配") {
  return (
    staffing
      .find((item) => item.role === role)
      ?.rows.find((row) => row.person)
      ?.person ?? fallback
  );
}

function buildProjectAssignments(project, draft) {
  const episodeCount = clampEpisodeCount(draft.episodeCount);
  const staffing = normalizedProjectStaffing(
    draft.staffing,
    episodeCount,
    draft.mode,
  );
  const assignmentProject = {
    ...project,
    episodeCount,
    scriptEpisodes: episodeCount,
    videoEpisodes: episodeCount,
    staffing,
  };
  return selectProjectTaskAssignments(assignmentProject).map((assignment) => {
    const roleStaffing = staffing.find((item) => item.role === assignment.role);
    return {
      ...assignment,
      owner: projectOwnerForRole(staffing, assignment.role, assignment.owner),
      due: draft.deadline,
      total: episodeCount,
      reviewEnabled: Boolean(roleStaffing?.reviewEnabled),
      reviewer: roleStaffing?.reviewer ?? "",
      workPlan: roleStaffing?.rows ?? [],
    };
  });
}

function resizeProjectContentEntries(project, collection, count, owner) {
  const nextEntries = buildContentEntries(
    project.projectCode,
    collection,
    count,
    owner,
    project.status,
  );
  return nextEntries.map((entry, index) => project[collection]?.[index] ?? entry);
}

function isProjectFormValid(draft) {
  return Boolean(
    draft?.name?.trim() &&
      draft?.genre &&
      draft?.owner &&
      Number(draft?.episodeCount) > 0 &&
      Number(draft?.budget) >= 0 &&
      draft?.start &&
      draft?.deadline &&
      draft.start <= draft.deadline &&
      (draft.mode !== "外部制作" ||
        (draft.contractFile &&
          draft.vendorCompanyName &&
          draft.vendorAccount &&
          draft.vendorContactName?.trim() &&
          draft.vendorContactPhone?.trim() &&
          draft.externalScriptShareMode &&
          (draft.externalScriptShareMode !== "card" ||
            (Number(draft.externalScriptCardNo) > 0 &&
              Number(draft.externalScriptCardNo) <=
                Math.ceil(Number(draft.episodeCount) / 10))))),
  );
}

function ProjectSetupForm({ draft, setDraft }) {
  const episodeCount = clampEpisodeCount(draft.episodeCount);
  const perEpisodeBudget = episodeCount
    ? Number(draft.budget || 0) / episodeCount
    : 0;
  const ownerOptions = Array.from(
    new Set([draft.owner, ...PROJECT_FORM_PEOPLE].filter(Boolean)),
  );
  const visibleStaffing =
    draft.mode === "外部制作"
      ? draft.staffing.filter((role) => role.role === "制片")
      : draft.staffing;
  const externalScriptCardOptions = Array.from(
    { length: Math.ceil(episodeCount / 10) },
    (_, index) => {
      const cardNo = index + 1;
      return { cardNo, ...scriptCardRange(cardNo, episodeCount) };
    },
  );
  const updateStaffing = (role, updater) =>
    setDraft((current) => ({
      ...current,
      staffing: current.staffing.map((item) =>
        item.role === role ? updater(item) : item,
      ),
    }));
  const updateStaffingRow = (role, rowId, field, value) =>
    updateStaffing(role, (item) => ({
      ...item,
      rows: item.rows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    }));

  return (
    <div className="platform-project-form">
      <section className="platform-project-form__section">
        <div className="platform-project-form__heading">
          <div>
            <span>基础信息</span>
            <h3>项目立项信息</h3>
          </div>
          <small>带 * 的字段为必填项</small>
        </div>
        <div className="platform-project-basics-grid">
          <label>
            <span><b>*</b> 项目名称</span>
            <div className="platform-project-input-counter">
              <input
                aria-label="项目名称"
                maxLength={80}
                placeholder="请输入项目名称"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
              <small>{draft.name.length} / 80</small>
            </div>
          </label>
          <label>
            <span><b>*</b> 题材</span>
            <select
              aria-label="题材"
              value={draft.genre}
              onChange={(event) =>
                setDraft((current) => ({ ...current, genre: event.target.value }))
              }
            >
              <option value="">请选择题材</option>
              <option>都市情感</option>
              <option>现实题材</option>
              <option>悬疑短剧</option>
              <option>青春情感</option>
              <option>古装传奇</option>
              <option>科幻悬疑</option>
            </select>
          </label>
          <label>
            <span><b>*</b> 集数</span>
            <input
              aria-label="集数"
              max="9999"
              min="1"
              placeholder="请输入集数"
              type="number"
              value={draft.episodeCount}
              onChange={(event) => {
                const value = event.target.value;
                const nextCount = clampEpisodeCount(value);
                setDraft((current) => ({
                  ...current,
                  episodeCount: value,
                  scriptEpisodes: value,
                  videoEpisodes: value,
                  staffing: current.staffing.map((role) => ({
                    ...role,
                    rows: role.rows.map((row) => ({
                      ...row,
                      episodeEnd:
                        Number(row.episodeEnd) > nextCount
                          ? nextCount
                          : row.episodeEnd,
                    })),
                  })),
                  externalScriptCardNo:
                    Number(current.externalScriptCardNo) >
                    Math.ceil(nextCount / 10)
                      ? ""
                      : current.externalScriptCardNo,
                }));
              }}
            />
          </label>
          <label>
            <span><b>*</b> 项目总预算</span>
            <input
              aria-label="项目总预算"
              min="0"
              placeholder="请输入项目总预算"
              step="100"
              type="number"
              value={draft.budget}
              onChange={(event) =>
                setDraft((current) => ({ ...current, budget: event.target.value }))
              }
            />
          </label>
          <label>
            <span>每集预算</span>
            <input aria-label="每集预算" readOnly value={perEpisodeBudget ? `¥${perEpisodeBudget.toFixed(2)}` : "—"} />
          </label>
          <label>
            <span><b>*</b> 负责人</span>
            <select
              aria-label="负责人"
              value={draft.owner}
              onChange={(event) =>
                setDraft((current) => ({ ...current, owner: event.target.value }))
              }
            >
              <option value="">请选择负责人</option>
              {ownerOptions.map((person) => <option key={person}>{person}</option>)}
            </select>
          </label>
          <label>
            <span>制作方式</span>
            <select
              aria-label="制作方式"
              value={draft.mode}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  mode: event.target.value,
                  contractFile:
                    event.target.value === "内部制作" ? null : current.contractFile,
                  vendorCompanyName:
                    event.target.value === "内部制作" ? "" : current.vendorCompanyName,
                  vendorAccount:
                    event.target.value === "内部制作" ? "" : current.vendorAccount,
                  vendorContactName:
                    event.target.value === "内部制作" ? "" : current.vendorContactName,
                  vendorContactPhone:
                    event.target.value === "内部制作" ? "" : current.vendorContactPhone,
                  externalScriptShareMode:
                    event.target.value === "内部制作"
                      ? ""
                      : current.externalScriptShareMode,
                  externalScriptCardNo:
                    event.target.value === "内部制作"
                      ? ""
                      : current.externalScriptCardNo,
                }))
              }
            >
              <option>内部制作</option>
              <option>外部制作</option>
            </select>
          </label>
          <div />
          <label>
            <span><b>*</b> 预计开始时间</span>
            <input
              aria-label="预计开始时间"
              type="date"
              value={draft.start}
              onChange={(event) =>
                setDraft((current) => ({ ...current, start: event.target.value }))
              }
            />
          </label>
          <label>
            <span><b>*</b> 预计完成时间</span>
            <input
              aria-label="预计完成时间"
              min={draft.start}
              type="date"
              value={draft.deadline}
              onChange={(event) =>
                setDraft((current) => ({ ...current, deadline: event.target.value }))
              }
            />
          </label>
        </div>
      </section>
      {draft.mode === "外部制作" ? (
        <section className="platform-project-form__section platform-project-vendor-section">
          <div className="platform-project-form__heading">
            <div>
              <span>外部承制方</span>
              <h3>承制公司与联系人</h3>
            </div>
            <small>公司账号由公司后台自动获取</small>
          </div>
          <div className="platform-project-basics-grid">
            <label>
              <span><b>*</b> 外部承制方公司名</span>
              <select
                aria-label="外部承制方公司名"
                value={draft.vendorCompanyName}
                onChange={(event) => {
                  const vendorCompanyName = event.target.value;
                  setDraft((current) => ({
                    ...current,
                    vendorCompanyName,
                    vendorAccount: externalVendorAccountFor(vendorCompanyName),
                  }));
                }}
              >
                <option value="">请从公司后台选择</option>
                {EXTERNAL_VENDOR_COMPANIES.map((company) => (
                  <option key={company.account} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span><b>*</b> 对应账号</span>
              <input
                aria-label="外部承制方对应账号"
                placeholder="选择公司后自动获取"
                readOnly
                value={draft.vendorAccount}
              />
            </label>
            <label>
              <span><b>*</b> 联系人</span>
              <input
                aria-label="外部承制方联系人"
                maxLength={40}
                placeholder="请输入联系人姓名"
                value={draft.vendorContactName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    vendorContactName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span><b>*</b> 联系方式</span>
              <input
                aria-label="外部承制方联系方式"
                maxLength={80}
                placeholder="请输入手机号、座机或邮箱"
                value={draft.vendorContactPhone}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    vendorContactPhone: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="platform-project-vendor-note" role="note">
            <Buildings size={17} weight="duotone" />
            <span>公司名称与账号来自公司后台主数据；账号自动带出且不可在立项中修改。</span>
          </div>
        </section>
      ) : null}
      <section className="platform-project-form__section">
        <div className="platform-project-form__heading">
          <div>
            <span>{draft.mode === "外部制作" ? "内部对接人员" : "参与人员及对应工期"}</span>
            <h3>{draft.mode === "外部制作" ? "制片配置" : "岗位、审核与分集排期"}</h3>
          </div>
          <small>
            {draft.mode === "外部制作"
              ? "外部制作仅需配置制片"
              : "人员配置将同步到项目任务"}
          </small>
        </div>
        <div className="platform-project-staffing">
          {visibleStaffing.map((role) => (
            <article className="platform-project-role-card" key={role.id}>
              <header>
                <strong>{role.role}</strong>
                <label className="platform-project-review-toggle">
                  <span>是否审核</span>
                  <input
                    aria-label={`${role.role}是否审核`}
                    checked={role.reviewEnabled}
                    onChange={(event) =>
                      updateStaffing(role.role, (item) => ({
                        ...item,
                        reviewEnabled: event.target.checked,
                        reviewer: event.target.checked ? item.reviewer : "",
                      }))
                    }
                    type="checkbox"
                  />
                  <i />
                </label>
                <label className="platform-project-reviewer">
                  <span>审核人员</span>
                  <select
                    aria-label={`${role.role}审核人`}
                    disabled={!role.reviewEnabled}
                    value={role.reviewer}
                    onChange={(event) =>
                      updateStaffing(role.role, (item) => ({
                        ...item,
                        reviewer: event.target.value,
                      }))
                    }
                  >
                    <option value="">{role.reviewEnabled ? "请选择审核人员" : "未开启审核"}</option>
                    {PROJECT_FORM_PEOPLE.map((person) => <option key={person}>{person}</option>)}
                  </select>
                </label>
              </header>
              <div className="platform-project-role-card__body">
                <div className="platform-project-role-card__labels" aria-hidden="true">
                  <span>人员</span><span>负责集数</span><span>工期</span><span>操作</span>
                </div>
                {role.rows.map((row, rowIndex) => (
                  <div className="platform-project-staff-row" key={row.id}>
                    <select
                      aria-label={`${role.role}人员${rowIndex + 1}`}
                      value={row.person}
                      onChange={(event) =>
                        updateStaffingRow(role.role, row.id, "person", event.target.value)
                      }
                    >
                      <option value="">选择人员</option>
                      {(PROJECT_ASSIGNMENT_PEOPLE[role.role] ?? PROJECT_FORM_PEOPLE).map(
                        (person) => <option key={person}>{person}</option>,
                      )}
                    </select>
                    <div className="platform-project-episode-range">
                      <input
                        aria-label={`${role.role}负责开始集${rowIndex + 1}`}
                        max={episodeCount}
                        min="1"
                        type="number"
                        value={row.episodeStart}
                        onChange={(event) =>
                          updateStaffingRow(role.role, row.id, "episodeStart", event.target.value)
                        }
                      />
                      <span>至</span>
                      <input
                        aria-label={`${role.role}负责结束集${rowIndex + 1}`}
                        max={episodeCount}
                        min="1"
                        type="number"
                        value={row.episodeEnd}
                        onChange={(event) =>
                          updateStaffingRow(role.role, row.id, "episodeEnd", event.target.value)
                        }
                      />
                      <small>集</small>
                    </div>
                    <div className="platform-project-duration-input">
                      <input
                        aria-label={`${role.role}工期${rowIndex + 1}`}
                        min="0"
                        placeholder="工期"
                        type="number"
                        value={row.durationDays}
                        onChange={(event) =>
                          updateStaffingRow(role.role, row.id, "durationDays", event.target.value)
                        }
                      />
                      <span>天</span>
                    </div>
                    <div className="platform-project-staff-actions">
                      <button
                        aria-label={`${role.role}新增人员`}
                        className="platform-project-row-action"
                        onClick={() =>
                          updateStaffing(role.role, (item) => ({
                            ...item,
                            rows: [
                              ...item.rows,
                              {
                                id: `${role.role}-person-${Date.now()}`,
                                person: "",
                                episodeStart: 1,
                                episodeEnd: episodeCount,
                                durationDays: "",
                              },
                            ],
                          }))
                        }
                        type="button"
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        aria-label={`${role.role}删除人员${rowIndex + 1}`}
                        className="platform-project-row-action is-danger"
                        disabled={role.rows.length === 1}
                        onClick={() =>
                          updateStaffing(role.role, (item) => ({
                            ...item,
                            rows: item.rows.filter((itemRow) => itemRow.id !== row.id),
                          }))
                        }
                        type="button"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="platform-project-script-upload">
        <div>
          <span>立项内容</span>
          <strong>{draft.scriptFile?.name ?? "尚未上传剧本"}</strong>
          <small>
            {draft.scriptLibraryRecordId
              ? "来自剧本库；在此替换会同步生成剧本库新版本"
              : "支持 PDF、DOC、DOCX、TXT，后续可在编辑项目时替换"}
          </small>
        </div>
        {draft.scriptLibraryRecordId ? (
          <PlatformBadge tone="success">剧本库已关联</PlatformBadge>
        ) : null}
        <label>
          <UploadSimple size={16} />
          {draft.scriptFile ? "更换剧本" : "上传剧本"}
          <input
            accept=".pdf,.doc,.docx,.txt"
            aria-label="上传剧本"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                scriptFile: event.target.files?.[0] ?? current.scriptFile,
              }))
            }
            type="file"
          />
        </label>
      </section>
      {draft.mode === "外部制作" ? (
        <section className="platform-project-form__section platform-project-script-share">
          <div className="platform-project-form__heading">
            <div>
              <span>外部共享</span>
              <h3>剧本共享范围</h3>
            </div>
            <small>立项前必须明确共享范围</small>
          </div>
          <div
            aria-label="外部制作剧本共享范围"
            className="platform-project-share-options"
            role="radiogroup"
          >
            <label
              className={draft.externalScriptShareMode === "all" ? "is-active" : ""}
            >
              <input
                aria-label="共享全部剧本"
                checked={draft.externalScriptShareMode === "all"}
                name="external-script-share-mode"
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    externalScriptShareMode: "all",
                    externalScriptCardNo: "",
                  }))
                }
                type="radio"
              />
              <span>
                <strong>全部剧本</strong>
                <small>共享当前项目第 1–{episodeCount} 集的剧本内容</small>
              </span>
            </label>
            <label
              className={draft.externalScriptShareMode === "card" ? "is-active" : ""}
            >
              <input
                aria-label="共享指定一卡"
                checked={draft.externalScriptShareMode === "card"}
                name="external-script-share-mode"
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    externalScriptShareMode: "card",
                    externalScriptCardNo: "",
                  }))
                }
                type="radio"
              />
              <span>
                <strong>指定一卡</strong>
                <small>按每 10 集的“一卡”范围选择需要共享的剧本</small>
              </span>
            </label>
          </div>
          {draft.externalScriptShareMode === "card" ? (
            <label className="platform-project-share-range">
              <span><b>*</b> 选择共享的一卡</span>
              <select
                aria-label="选择共享的一卡"
                value={draft.externalScriptCardNo}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    externalScriptCardNo: event.target.value,
                  }))
                }
              >
                <option value="">请选择剧本范围</option>
                {externalScriptCardOptions.map((option) => (
                  <option key={option.cardNo} value={option.cardNo}>
                    一卡 {option.cardNo} · 第 {option.start}–{option.end} 集
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="platform-project-vendor-note" role="note">
            <FileText size={17} weight="duotone" />
            <span>外部承制方仅能查看本次选定范围内的当前剧本内容，其他分集不共享。</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}

const PROJECT_ROLE_VIEWER = {
  employee: "张小北",
  leader: "江晚",
  hr: "HR-唐宁",
  ceo: "CEO",
};

function ProjectAssignmentDrawer({ project, readOnly, onClose, onSave }) {
  const [assignments, setAssignments] = useState(() =>
    selectProjectTaskAssignments(project),
  );
  const assignedCount = assignments.filter(
    (item) => item.owner && item.owner !== "待分配",
  ).length;
  const updateAssignment = (id, field, value) => {
    setAssignments((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };
  const save = () => {
    const issuedAt = "2026-07-17 10:30";
    onSave(
      assignments.map((item) => ({
        ...item,
        issuedAt,
        updatedAt: issuedAt,
        status:
          item.status === "待下发"
            ? "待接收"
            : item.status,
      })),
    );
  };

  return (
    <PlatformDrawer
      wide
      title={readOnly ? "查看项目分工" : "配置项目人员"}
      subtitle={`${project.projectCode ?? project.id} · ${project.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="ghost-chip" onClick={onClose} type="button">
            {readOnly ? "关闭" : "取消"}
          </button>
          {!readOnly ? (
            <button
              className="primary-btn"
              disabled={assignedCount !== assignments.length}
              onClick={save}
              type="button"
            >
              确认分配并下发
              <ArrowRight size={16} />
            </button>
          ) : null}
        </>
      }
    >
      <PlatformNotice tone={readOnly ? "info" : "warning"}>
        {readOnly
          ? "人员分工来自项目任务单；负责人可在任务列表与个人工作台查看执行要求。"
          : "确认下发后，每位负责人都会收到独立任务，并同步出现在其个人工作台。"}
      </PlatformNotice>
      <div className="platform-assignment-summary">
        <div>
          <span>制作方式</span>
          <strong>{project.mode}</strong>
        </div>
        <div>
          <span>项目负责人</span>
          <strong>{project.owner}</strong>
        </div>
        <div>
          <span>计划完成</span>
          <strong>{project.due}</strong>
        </div>
        <div>
          <span>已配置岗位</span>
          <strong>{assignedCount}/{assignments.length}</strong>
        </div>
      </div>
      <section className="platform-assignment-section">
        <header>
          <div>
            <span>任务链路</span>
            <h3>按岗位分配执行负责人</h3>
          </div>
          <small>立项配置 → 任务下发 → 个人接收 → 执行反馈</small>
        </header>
        <div className="platform-assignment-grid">
          {assignments.map((assignment, index) => (
            <article key={assignment.id}>
              <div className="platform-assignment-grid__title">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{assignment.role}</strong>
                  <small>{assignment.department}</small>
                </div>
                <PlatformBadge>{assignment.status}</PlatformBadge>
              </div>
              <label>
                <span>任务负责人</span>
                <select
                  disabled={readOnly}
                  onChange={(event) =>
                    updateAssignment(assignment.id, "owner", event.target.value)
                  }
                  value={assignment.owner}
                >
                  <option value="待分配">请选择负责人</option>
                  {(PROJECT_ASSIGNMENT_PEOPLE[assignment.role] ?? []).map(
                    (person) => <option key={person}>{person}</option>,
                  )}
                </select>
              </label>
              <label>
                <span>计划完成</span>
                <input
                  disabled={readOnly}
                  onChange={(event) =>
                    updateAssignment(assignment.id, "due", event.target.value)
                  }
                  type="date"
                  value={assignment.due}
                />
              </label>
              <p>{assignment.requirement}</p>
            </article>
          ))}
        </div>
      </section>
    </PlatformDrawer>
  );
}

export function ProjectInitiationPage({ activeRole = "ceo", goPage, embedded = false }) {
  const { projects, setProjects } = useDemoData();
  const [tab, setTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [mode, setMode] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState("");
  const canAssign = ["leader", "ceo"].includes(activeRole);
  const rows = useMemo(
    () =>
      projects.filter((project) => {
        const assignments = selectProjectTaskAssignments(project);
        const matchedKeyword =
          !keyword.trim() ||
          [project.name, project.projectCode, project.owner]
            .join(" ")
            .toLowerCase()
            .includes(keyword.trim().toLowerCase());
        const matchedMode = mode === "all" || project.mode === mode;
        const matchedTab =
          tab === "all" ||
          (tab === "running" && project.status === "进行中") ||
          (tab === "pending" && assignments.some((item) => !item.issuedAt)) ||
          (tab === "completed" && project.status === "已完成");
        return matchedKeyword && matchedMode && matchedTab;
      }),
    [keyword, mode, projects, tab],
  );
  const pendingCount = projects.filter((project) =>
    selectProjectTaskAssignments(project).some((item) => !item.issuedAt),
  ).length;
  const dispatchedCount = projects.filter((project) =>
    selectProjectTaskAssignments(project).every((item) => item.issuedAt),
  ).length;

  const saveAssignments = (projectId, taskAssignments) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project;
        const stages = (project.stages ?? []).map((stage) => {
          const assignment = taskAssignments.find(
            (item) => item.stage === stage.name,
          );
          return assignment ? { ...stage, owner: assignment.owner } : stage;
        });
        return {
          ...project,
          taskAssignments,
          taskDispatchedAt: "2026-07-17 10:30",
          stages,
          next: "等待任务负责人接收",
        };
      }),
    );
    const project = projects.find((item) => item.id === projectId);
    setSelectedProject(null);
    setFeedback(`“${project?.name ?? "项目"}”人员分配已完成，任务已同步至负责人工作台。`);
  };

  return (
    <div className="platform-page platform-project-initiation">
      {!embedded ? (
        <PlatformHeader
          eyebrow="项目立项"
          title="项目台账与人员分配"
          description="在立项阶段完成岗位负责人配置；任务下发后自动进入任务列表与对应人员工作台。"
          actions={
            <button className="primary-btn" onClick={() => goPage?.("tasks")} type="button">
              查看任务列表
              <ArrowRight size={16} />
            </button>
          }
          meta={null}
        />
      ) : null}
      {feedback ? <div className="platform-access-feedback" role="status">{feedback}</div> : null}
      <PlatformMetrics
        items={[
          { label: "全部项目", value: projects.length, unit: "个", meta: "当前项目立项台账", tone: "blue" },
          { label: "待人员配置", value: pendingCount, unit: "个", meta: "尚未正式下发任务", tone: "amber" },
          { label: "已下发任务", value: dispatchedCount, unit: "个", meta: "已同步至个人工作台", tone: "purple" },
          { label: "进行中", value: projects.filter((item) => item.status === "进行中").length, unit: "个", meta: "制作任务持续推进", tone: "green" },
        ]}
      />
      <PlatformCard
        title="项目立项列表"
        description="项目基础信息与任务分配状态统一展示"
        action={
          <PlatformTabs
            ariaLabel="项目立项状态"
            items={[
              { id: "all", label: "全部", count: projects.length },
              { id: "running", label: "进行中", count: projects.filter((item) => item.status === "进行中").length },
              { id: "pending", label: "待分配", count: pendingCount },
              { id: "completed", label: "已完成", count: projects.filter((item) => item.status === "已完成").length },
            ]}
            onChange={setTab}
            value={tab}
          />
        }
      >
        <PlatformFilter
          actions={
            <>
              <button className="ghost-chip" onClick={() => { setKeyword(""); setMode("all"); }} type="button">重置</button>
              <button className="primary-btn" type="button">查询</button>
            </>
          }
        >
          <label>
            <span>项目关键词</span>
            <input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索项目名称 / 编号 / 负责人" value={keyword} />
          </label>
          <label>
            <span>制作方式</span>
            <select onChange={(event) => setMode(event.target.value)} value={mode}>
              <option value="all">全部方式</option>
              <option>内部制作</option>
              <option>外部制作</option>
            </select>
          </label>
        </PlatformFilter>
        <DataTable
          columns={[
            { label: "项目名称", width: "1.45fr" },
            { label: "状态", width: "90px" },
            { label: "制作方式", width: "110px" },
            { label: "项目负责人", width: "110px" },
            { label: "项目预算", width: "110px" },
            { label: "预计完成", width: "120px" },
            { label: "人员配置", width: "145px" },
            { label: "操作", width: "170px" },
          ]}
          minWidth={1080}
        >
          {rows.map((project) => {
            const assignments = selectProjectTaskAssignments(project);
            const assigned = assignments.filter((item) => item.owner !== "待分配").length;
            const issued = assignments.every((item) => item.issuedAt);
            return (
              <div className="platform-table__row platform-project-row" style={{ gridTemplateColumns: "1.45fr 90px 110px 110px 110px 120px 145px 170px" }} key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.projectCode ?? project.id}</small>
                </div>
                <PlatformBadge>{project.status}</PlatformBadge>
                <PlatformBadge tone={project.mode === "内部制作" ? "primary" : "neutral"}>{project.mode}</PlatformBadge>
                <span>{project.owner}</span>
                <strong>{formatMoney(project.budget)}</strong>
                <span>{project.due}</span>
                <div className="platform-assignee-cell">
                  <span>{assigned}/{assignments.length} 人</span>
                  <small>{issued ? "已下发" : "待下发"}</small>
                </div>
                <div className="platform-table-actions">
                  <button className="table-link" onClick={() => setSelectedProject(project)} type="button">{canAssign ? "人员配置" : "查看分工"}</button>
                  <button className="table-link" onClick={() => goPage?.("tasks")} type="button">任务</button>
                </div>
              </div>
            );
          })}
        </DataTable>
        {!rows.length ? <PlatformEmpty title="暂无匹配项目" description="请调整项目名称、制作方式或状态筛选。" /> : null}
      </PlatformCard>
      {selectedProject ? (
        <ProjectAssignmentDrawer
          onClose={() => setSelectedProject(null)}
          onSave={(assignments) => saveAssignments(selectedProject.id, assignments)}
          project={selectedProject}
          readOnly={!canAssign}
        />
      ) : null}
    </div>
  );
}

function TaskCenterDetailDrawer({ assignment, canOperate, onAction, onClose }) {
  const actionLabel = assignment.status === "待接收"
    ? "接收并开始"
    : assignment.status === "待审核"
      ? "审核完成"
      : assignment.status === "已完成"
        ? "任务已完成"
        : "更新任务进度";
  return (
    <PlatformDrawer
      wide
      title={`${assignment.project.name} · ${assignment.role}任务`}
      subtitle={`${assignment.project.projectCode ?? assignment.project.id} · ${assignment.owner}`}
      onClose={onClose}
      footer={
        <>
          <button className="ghost-chip" onClick={onClose} type="button">关闭</button>
          <button className="primary-btn" disabled={!canOperate || assignment.status === "已完成"} onClick={onAction} type="button">{actionLabel}</button>
        </>
      }
    >
      <section className="platform-task-center-hero">
        <div>
          <span>{assignment.role}</span>
          <h3>{assignment.project.name}</h3>
          <p>{assignment.requirement}</p>
        </div>
        <PlatformBadge>{assignment.status}</PlatformBadge>
      </section>
      <div className="platform-assignment-summary">
        <div><span>任务负责人</span><strong>{assignment.owner}</strong></div>
        <div><span>所属中心</span><strong>{assignment.department}</strong></div>
        <div><span>计划完成</span><strong>{assignment.due}</strong></div>
        <div><span>任务数量</span><strong>{assignment.completed}/{assignment.total}</strong></div>
      </div>
      <section className="platform-detail-section">
        <h3>完成进度</h3>
        <ProgressBar value={assignment.progress} />
      </section>
      <PlatformNotice>
        任务来自项目立项人员分配；接收、进度与完成状态会同步回项目台账和个人工作台。
      </PlatformNotice>
    </PlatformDrawer>
  );
}

export function TaskCenterPage({ activeRole = "ceo" }) {
  const { projects, setProjects } = useDemoData();
  const [tab, setTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const viewer = PROJECT_ROLE_VIEWER[activeRole];
  const isEmployee = activeRole === "employee";
  const allAssignments = useMemo(
    () =>
      projects.flatMap((project) =>
        selectProjectTaskAssignments(project)
          .filter((assignment) => assignment.issuedAt)
          .map((assignment) => ({ ...assignment, project })),
      ),
    [projects],
  );
  const scopedAssignments = isEmployee
    ? allAssignments.filter((item) => item.owner === viewer)
    : allAssignments;
  const rows = scopedAssignments.filter((item) => {
    const matchedTab = tab === "all" || item.role === tab;
    const matchedStatus = status === "all" || item.status === status;
    const matchedKeyword =
      !keyword.trim() ||
      [item.project.name, item.project.projectCode, item.owner]
        .join(" ")
        .toLowerCase()
        .includes(keyword.trim().toLowerCase());
    return matchedTab && matchedStatus && matchedKeyword;
  });

  const updateAssignment = (projectId, assignmentId) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project;
        const assignments = selectProjectTaskAssignments(project);
        const target = assignments.find((item) => item.id === assignmentId);
        if (!target) return project;
        const managerApproval = target.status === "待审核" && ["leader", "ceo"].includes(activeRole);
        const nextProgress = managerApproval
          ? 100
          : target.status === "待接收"
            ? 5
            : Math.min(100, target.progress + 20);
        const nextStatus = managerApproval
          ? "已完成"
          : nextProgress >= 100
            ? "待审核"
            : "进行中";
        const taskAssignments = assignments.map((item) =>
          item.id === assignmentId
            ? {
                ...item,
                progress: nextProgress,
                completed: Math.min(item.total, Math.round((item.total * nextProgress) / 100)),
                status: nextStatus,
                acceptedAt: item.acceptedAt || "2026-07-17 10:30",
                updatedAt: "2026-07-17 10:30",
              }
            : item,
        );
        const stages = (project.stages ?? []).map((stage) =>
          stage.name === target.stage
            ? { ...stage, owner: target.owner, progress: nextProgress, status: nextStatus === "待审核" ? "进行中" : nextStatus }
            : stage,
        );
        return {
          ...project,
          taskAssignments,
          stages,
          status: project.status === "未开始" ? "进行中" : project.status,
          progress: stages.length
            ? Math.round(stages.reduce((sum, stage) => sum + Number(stage.progress || 0), 0) / stages.length)
            : project.progress,
        };
      }),
    );
    setSelected(null);
  };

  const canOperateSelected = selected
    ? (isEmployee && selected.owner === viewer) ||
      (["leader", "ceo"].includes(activeRole) && selected.status === "待审核")
    : false;

  return (
    <div className="platform-page platform-task-center">
      <PlatformHeader
        eyebrow="任务中心"
        title={isEmployee ? "我的项目任务" : "项目任务执行列表"}
        description={isEmployee ? "接收立项阶段分配给你的任务，并持续更新执行进度。" : "按岗位查看任务接收、执行、提交与审核状态。"}
        meta={null}
      />
      <PlatformMetrics
        items={[
          { label: "已下发", value: scopedAssignments.length, unit: "项", meta: isEmployee ? "分配给我的项目任务" : "来自项目立项人员配置", tone: "blue" },
          { label: "待接收", value: scopedAssignments.filter((item) => item.status === "待接收").length, unit: "项", meta: "等待负责人确认", tone: "amber" },
          { label: "进行中", value: scopedAssignments.filter((item) => item.status === "进行中").length, unit: "项", meta: "任务正在执行", tone: "purple" },
          { label: "已完成", value: scopedAssignments.filter((item) => item.status === "已完成").length, unit: "项", meta: "已完成审核闭环", tone: "green" },
        ]}
      />
      <PlatformCard
        title="任务列表"
        description="任务状态与项目制作进度保持同步"
        action={
          <PlatformTabs
            ariaLabel="任务类型"
            items={[
              { id: "all", label: "全部", count: scopedAssignments.length },
              ...["编剧", "制作", "剪辑", "制片"].map((role) => ({ id: role, label: role, count: scopedAssignments.filter((item) => item.role === role).length })),
            ]}
            onChange={setTab}
            value={tab}
          />
        }
      >
        <PlatformFilter
          actions={
            <>
              <button className="ghost-chip" onClick={() => { setKeyword(""); setStatus("all"); }} type="button">重置</button>
              <button className="primary-btn" type="button">查询</button>
            </>
          }
        >
          <label>
            <span>项目 / 负责人</span>
            <input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索项目名称、编号或负责人" value={keyword} />
          </label>
          <label>
            <span>任务状态</span>
            <select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="all">全部状态</option>
              <option>待接收</option>
              <option>进行中</option>
              <option>待审核</option>
              <option>已完成</option>
            </select>
          </label>
        </PlatformFilter>
        <DataTable
          columns={[
            { label: "项目任务", width: "1.35fr" },
            { label: "状态", width: "90px" },
            { label: "岗位", width: "80px" },
            { label: "负责人", width: "100px" },
            { label: "预计完成", width: "115px" },
            { label: "实际完成", width: "100px" },
            { label: "完成进度", width: "170px" },
            { label: "操作", width: "120px" },
          ]}
          minWidth={1060}
        >
          {rows.map((assignment) => (
            <div className="platform-table__row platform-task-row" style={{ gridTemplateColumns: "1.35fr 90px 80px 100px 115px 100px 170px 120px" }} key={assignment.id}>
              <div>
                <strong>{assignment.project.name}</strong>
                <small>{assignment.project.projectCode ?? assignment.project.id}</small>
              </div>
              <PlatformBadge>{assignment.status}</PlatformBadge>
              <PlatformBadge tone="primary">{assignment.role}</PlatformBadge>
              <span>{assignment.owner}</span>
              <span>{assignment.due}</span>
              <strong>{assignment.completed}/{assignment.total}</strong>
              <ProgressBar value={assignment.progress} />
              <div className="platform-table-actions">
                <button className="table-link" onClick={() => setSelected(assignment)} type="button">{isEmployee && assignment.owner === viewer ? "处理" : "查看详情"}</button>
              </div>
            </div>
          ))}
        </DataTable>
        {!rows.length ? <PlatformEmpty title="暂无匹配任务" description="任务下发后会自动进入此列表与对应人员工作台。" /> : null}
      </PlatformCard>
      {selected ? (
        <TaskCenterDetailDrawer
          assignment={selected}
          canOperate={canOperateSelected}
          onAction={() => updateAssignment(selected.project.id, selected.id)}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

export function ProjectProductionPage({ activeRole = "ceo", embedded = false, goPage, management = false }) {
  const {
    projects,
    setProjects,
    topics,
    setTopics,
    scriptLibrary,
    setScriptLibrary,
    projectInitiationTopicId,
    clearProjectInitiation,
  } = useDemoData();
  const [view, setView] = useState("all");
  const [selected, setSelected] = useState(null);
  const [assignmentProject, setAssignmentProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectDraft, setEditProjectDraft] = useState(null);
  const [creating, setCreating] = useState(false);
  const [contractPreview, setContractPreview] = useState(null);
  const [contentCodePreview, setContentCodePreview] = useState(null);
  const [projectContractError, setProjectContractError] = useState("");
  const [editContractError, setEditContractError] = useState("");
  const [assignmentFeedback, setAssignmentFeedback] = useState("");
  const [projectDraft, setProjectDraft] = useState(() => createProjectFormDraft());

  useEffect(() => {
    if (!management || !projectInitiationTopicId) return;
    const topic = topics.find((item) => item.id === projectInitiationTopicId);
    const scriptRecord = scriptLibrary.find(
      (record) => record.topicId === projectInitiationTopicId,
    );
    const latestUpload = latestScriptUpload(scriptRecord);
    if (topic && scriptRecord && latestUpload && !topic.projectId) {
      setProjectDraft(
        createProjectFormDraft({
          name: topic.name,
          genre: topic.genre,
          episodeCount: topic.estimatedEpisodes,
          owner: topic.submitter,
          topicId: topic.id,
          topic: topic.id,
          scriptLibraryRecordId: scriptRecord.id,
          scriptFile: latestUpload.file ?? latestUpload,
        }),
      );
      setCreating(true);
      setAssignmentFeedback(`已从剧本库带入“${topic.name}”，请完成立项配置。`);
    }
    clearProjectInitiation();
  }, [management, projectInitiationTopicId]);
  const projectSummary = selectProjectSummary(projects);
  const current = projects.find((item) => item.id === selected?.id) ?? selected;
  const currentCost = current ? selectProjectCostBreakdown(current) : null;
  const currentLinkedTopic = current
    ? topics.find(
        (topic) => topic.id === current.topicId || topic.id === current.topic,
      )
    : null;
  const currentSource = currentLinkedTopic || /^TOPIC-/.test(String(current?.topic ?? ""))
    ? "选题库"
    : "自行创建";
  const currentEpisodeCount = current
    ? clampEpisodeCount(
        current.episodeCount ??
          Math.max(current.scripts?.length ?? 0, current.videos?.length ?? 0),
      )
    : 0;
  const currentStaffing = current
    ? createProjectStaffing(current, currentEpisodeCount).filter(
        (role) => current.mode !== "外部制作" || role.role === "制片",
      )
    : [];
  const currentContentRows = current
    ? Array.from({ length: currentEpisodeCount }, (_, index) => ({
        episodeNo: index + 1,
        scriptCode: current.scripts?.[index]?.code ?? "—",
        videoCode: current.videos?.[index]?.code ?? "—",
      }))
    : [];
  const projectTableColumns = [
    { label: "项目名称", width: "minmax(180px, 1.25fr)" },
    { label: "项目编号", width: "minmax(175px, 1.12fr)" },
    { label: "来源", width: "92px" },
    { label: "制作方式", width: "104px" },
    { label: "题材", width: "minmax(105px, 0.72fr)" },
    { label: "负责人", width: "90px" },
    { label: "状态", width: "86px" },
    { label: "集数", width: "70px" },
    { label: "预计完成时间", width: "120px" },
    { label: "整体进度", width: "minmax(140px, 0.9fr)" },
    { label: "成本执行", width: "minmax(180px, 1.05fr)" },
    { label: "操作", width: "112px" },
  ];
  const projectTableGrid = projectTableColumns.map((item) => item.width).join(" ");
  const visible = projects.filter(
    (project) =>
      view === "all" ||
      project.mode === (view === "internal" ? "内部制作" : "外部制作"),
  );
  const canAssign = ["leader", "ceo"].includes(activeRole);
  const linkedTopicFor = (project) =>
    topics.find(
      (topic) => topic.id === project.topicId || topic.id === project.topic,
    );
  const deleteProject = (project) => {
    const restoresTopic = Boolean(
      project.topicId || /^TOPIC-/.test(String(project.topic ?? "")),
    );
    setProjects((items) => items.filter((item) => item.id !== project.id));
    if (restoresTopic) {
      const topicId = project.topicId || project.topic;
      setTopics((items) =>
        items.map((topic) =>
          topic.id === topicId
            ? { ...topic, projectId: null, status: "已评估" }
            : topic,
        ),
      );
      setScriptLibrary((records) =>
        records.map((record) =>
          record.topicId === topicId
            ? { ...record, projectId: null, status: "待立项" }
            : record,
        ),
      );
    }
    if (selected?.id === project.id) setSelected(null);
    if (assignmentProject?.id === project.id) setAssignmentProject(null);
    setDeletingProject(null);
    setAssignmentFeedback(
      restoresTopic
        ? `“${project.name}”已删除；关联选题保持已评估，项目关联已解除。`
        : `“${project.name}”已删除。`,
    );
  };
  const openProjectEditor = (project) => {
    setEditingProject(project);
    setEditProjectDraft(createProjectFormDraft(project));
    setEditContractError("");
    setSelected(null);
  };
  const saveEditedProject = () => {
    if (!editingProject || !isProjectFormValid(editProjectDraft)) return;
    const episodeCount = clampEpisodeCount(editProjectDraft.episodeCount);
    const staffing = normalizedProjectStaffing(
      editProjectDraft.staffing,
      episodeCount,
      editProjectDraft.mode,
    );
    setProjects((items) =>
      items.map((project) => {
        if (project.id !== editingProject.id) return project;
        const contract =
          editProjectDraft.mode === "外部制作"
            ? editProjectDraft.contractFile?.uploadedAt
              ? editProjectDraft.contractFile
              : {
                  name: editProjectDraft.contractFile.name,
                  size: editProjectDraft.contractFile.size,
                  type: editProjectDraft.contractFile.type,
                  file: editProjectDraft.contractFile,
                  uploadedAt: "2026-07-21 14:40",
                }
            : null;
        const baseStages = editProjectDraft.mode === "内部制作"
          ? (project.stages?.length
              ? project.stages
              : [
                  { name: "剧本", progress: 0, status: "未开始" },
                  { name: "制作", progress: 0, status: "未开始" },
                  { name: "剪辑", progress: 0, status: "未开始" },
                ])
          : [];
        const stages = baseStages.map((stage) => ({
          ...stage,
          owner: projectOwnerForRole(
            staffing,
            stage.name === "剧本" ? "编剧" : stage.name,
            stage.owner,
          ),
        }));
        const nextProject = {
          ...project,
          ...editProjectDraft,
          name: editProjectDraft.name.trim(),
          budget: Number(editProjectDraft.budget) || 0,
          episodeCount,
          scriptEpisodes: episodeCount,
          videoEpisodes: episodeCount,
          start: editProjectDraft.start,
          due: editProjectDraft.deadline,
          deadline: editProjectDraft.deadline,
          contract,
          staffing,
          vendor:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.vendorCompanyName
              : undefined,
          vendorCompanyName:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.vendorCompanyName
              : undefined,
          vendorAccount:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.vendorAccount
              : undefined,
          contact:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.vendorContactName.trim()
              : undefined,
          vendorContactName:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.vendorContactName.trim()
              : undefined,
          vendorContactPhone:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.vendorContactPhone.trim()
              : undefined,
          externalScriptShareMode:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.externalScriptShareMode
              : undefined,
          externalScriptCardNo:
            editProjectDraft.mode === "外部制作" &&
            editProjectDraft.externalScriptShareMode === "card"
              ? Number(editProjectDraft.externalScriptCardNo)
              : undefined,
          liaison:
            editProjectDraft.mode === "外部制作"
              ? editProjectDraft.owner
              : undefined,
          stages,
          progress:
            editProjectDraft.mode === "内部制作"
              ? Number(project.progress ?? 0)
              : null,
          flags: editProjectDraft.mode === "内部制作" ? project.flags : [],
          scripts: resizeProjectContentEntries(
            project,
            "scripts",
            episodeCount,
            editProjectDraft.owner,
          ),
          videos: resizeProjectContentEntries(
            project,
            "videos",
            episodeCount,
            editProjectDraft.owner,
          ),
          actual:
            editProjectDraft.mode === "内部制作"
              ? Number(editProjectDraft.manpowerCost || 0) +
                Number(editProjectDraft.computeCost || 0) +
                Number(editProjectDraft.trafficCost || 0)
              : project.actual,
          contractFile: undefined,
        };
        return {
          ...nextProject,
          taskAssignments: buildProjectAssignments(nextProject, editProjectDraft),
        };
      }),
    );
    const linkedTopic = topics.find(
      (topic) =>
        topic.id === editingProject.topicId || topic.id === editingProject.topic,
    );
    if (
      editProjectDraft.scriptLibraryRecordId &&
      linkedTopic &&
      editProjectDraft.scriptFile
    ) {
      setScriptLibrary((records) =>
        records.map((record) =>
          record.id === editProjectDraft.scriptLibraryRecordId
            ? appendSharedScriptVersion(
                record,
                linkedTopic,
                editProjectDraft.scriptFile,
                activeRole === "ceo" ? "CEO" : editingProject.owner,
              )
            : record,
        ),
      );
    }
    setEditingProject(null);
    setEditProjectDraft(null);
    setAssignmentFeedback(`“${editProjectDraft.name.trim()}”项目信息已更新。`);
  };
  const createStandaloneProject = () => {
    if (!isProjectFormValid(projectDraft)) return;
    const projectId = `project-${Date.now()}`;
    const linkedTopic = projectDraft.topicId
      ? topics.find((topic) => topic.id === projectDraft.topicId)
      : null;
    const episodeCount = clampEpisodeCount(projectDraft.episodeCount);
    const staffing = normalizedProjectStaffing(
      projectDraft.staffing,
      episodeCount,
      projectDraft.mode,
    );
    setProjects((items) => {
      const projectCode = nextProjectCode(items);
      const contract =
        projectDraft.mode === "外部制作"
          ? {
              name: projectDraft.contractFile.name,
              size: projectDraft.contractFile.size,
              type: projectDraft.contractFile.type,
              file: projectDraft.contractFile.file ?? projectDraft.contractFile,
              uploadedAt: projectDraft.contractFile.uploadedAt ?? "2026-07-21 14:40",
            }
          : null;
      const stages = projectDraft.mode === "内部制作"
        ? [
            {
              name: "剧本",
              owner: projectOwnerForRole(staffing, "编剧", "待分配"),
              progress: 0,
              status: "未开始",
            },
            {
              name: "制作",
              owner: projectOwnerForRole(staffing, "制作", "待分配"),
              progress: 0,
              status: "未开始",
            },
            {
              name: "剪辑",
              owner: projectOwnerForRole(staffing, "剪辑", "待分配"),
              progress: 0,
              status: "未开始",
            },
          ]
        : [];
      const project = {
        ...projectDraft,
        id: projectId,
        projectCode,
        name: projectDraft.name.trim(),
        budget: Number(projectDraft.budget) || 0,
        episodeCount,
        scriptEpisodes: episodeCount,
        videoEpisodes: episodeCount,
        status: "未开始",
        progress: projectDraft.mode === "内部制作" ? 0 : null,
        start: projectDraft.start,
        due: projectDraft.deadline,
        deadline: projectDraft.deadline,
        centers:
          projectDraft.mode === "内部制作"
            ? ["内容中心", "AI制作中心", "剪辑中心"]
            : ["制片中心"],
        next: projectDraft.mode === "内部制作" ? "项目启动" : "供应商启动",
        vendor:
          projectDraft.mode === "外部制作"
            ? projectDraft.vendorCompanyName
            : undefined,
        vendorCompanyName:
          projectDraft.mode === "外部制作"
            ? projectDraft.vendorCompanyName
            : undefined,
        vendorAccount:
          projectDraft.mode === "外部制作"
            ? projectDraft.vendorAccount
            : undefined,
        contact:
          projectDraft.mode === "外部制作"
            ? projectDraft.vendorContactName.trim()
            : undefined,
        vendorContactName:
          projectDraft.mode === "外部制作"
            ? projectDraft.vendorContactName.trim()
            : undefined,
        vendorContactPhone:
          projectDraft.mode === "外部制作"
            ? projectDraft.vendorContactPhone.trim()
            : undefined,
        externalScriptShareMode:
          projectDraft.mode === "外部制作"
            ? projectDraft.externalScriptShareMode
            : undefined,
        externalScriptCardNo:
          projectDraft.mode === "外部制作" &&
          projectDraft.externalScriptShareMode === "card"
            ? Number(projectDraft.externalScriptCardNo)
            : undefined,
        liaison: projectDraft.mode === "外部制作" ? projectDraft.owner : undefined,
        contract,
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
        topicId: linkedTopic?.id ?? null,
        topic: linkedTopic?.id ?? "独立创建",
        flags: [],
        staffing,
        scripts: buildContentEntries(
          projectCode,
          "scripts",
          episodeCount,
          projectDraft.owner,
        ),
        videos: buildContentEntries(
          projectCode,
          "videos",
          episodeCount,
          projectDraft.owner,
        ),
        stages,
        contractFile: undefined,
      };
      return [
        {
          ...project,
          taskAssignments: buildProjectAssignments(project, projectDraft),
        },
        ...items,
      ];
    });
    if (linkedTopic) {
      setTopics((items) =>
        items.map((topic) =>
          topic.id === linkedTopic.id
            ? {
                ...topic,
                status: "已评估",
                projectId,
                updatedAt: "2026-07-21 16:40",
              }
            : topic,
        ),
      );
      setScriptLibrary((records) =>
        records.map((record) => {
          if (record.topicId !== linkedTopic.id) return record;
          const syncedRecord = appendSharedScriptVersion(
            record,
            linkedTopic,
            projectDraft.scriptFile,
            activeRole === "ceo" ? "CEO" : projectDraft.owner,
          );
          return {
            ...syncedRecord,
            status: "已立项",
            projectId,
            updatedAt: "2026-07-21 16:40",
          };
        }),
      );
    }
    setCreating(false);
    setProjectDraft(createProjectFormDraft());
    setProjectContractError("");
  };
  const saveAssignments = (projectId, taskAssignments) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) return project;
        const stages = (project.stages ?? []).map((stage) => {
          const assignment = taskAssignments.find((item) => item.stage === stage.name);
          return assignment ? { ...stage, owner: assignment.owner } : stage;
        });
        return {
          ...project,
          taskAssignments,
          taskDispatchedAt: "2026-07-17 10:30",
          stages,
          next: "等待任务负责人接收",
        };
      }),
    );
    const project = projects.find((item) => item.id === projectId);
    setAssignmentProject(null);
    setAssignmentFeedback(`“${project?.name ?? "项目"}”人员配置已完成，任务已同步至负责人工作台。`);
  };
  return (
    <div className="platform-page">
      {!embedded ? (
        <PlatformHeader
          eyebrow={management ? "项目管理" : "项目制作管理"}
          title={management ? "项目总览、立项与任务协同" : "项目台账与并行制作环节"}
          description={management ? "在一份项目台账中统一查看项目信息、人员分配、内部制作进度与成本执行。" : "内部项目按启用环节并行推进；外部项目仅维护开始时间、预计完成时间、合同与对接信息。"}
          actions={
            <>
              {management ? (
                <button className="ghost-chip" onClick={() => goPage?.("tasks")} type="button">
                  查看任务列表
                  <ArrowRight size={16} />
                </button>
              ) : null}
              <button className="primary-btn" onClick={() => setCreating(true)} type="button">
                <Plus size={16} />
                新建项目
              </button>
            </>
          }
        />
      ) : null}
      {assignmentFeedback ? <div className="platform-access-feedback" role="status">{assignmentFeedback}</div> : null}
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
            value: `${projectSummary.delayed} / ${projects.filter((project) => project.mode !== "外部制作" && (project.flags ?? []).some((flag) => String(flag).includes("阻塞"))).length}`,
            meta: "仅统计内部制作项目",
            tone: "red",
          },
          {
            label: "平均进度",
            value: `${projectSummary.averageProgress}%`,
            meta: "仅统计内部制作项目",
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
        title={management ? "项目总览与立项台账" : "项目列表"}
        description={management ? "集中展示项目基础信息、预计完成时间、整体进度与成本执行情况。" : "延期、阻塞和退回不替换项目基础状态"}
        action={embedded ? (
          <button className="primary-btn" onClick={() => setCreating(true)} type="button">
            <Plus size={16} />
            新建项目
          </button>
        ) : null}
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
          columns={projectTableColumns}
          minWidth={1584}
          className="platform-production-table platform-table--single-line"
        >
          {visible.map((row) => {
            const linkedTopic = linkedTopicFor(row);
            const source = linkedTopic || /^TOPIC-/.test(String(row.topic ?? ""))
              ? "选题库"
              : "自行创建";
            const episodeCount =
              Number(row.episodeCount) ||
              Number(linkedTopic?.estimatedEpisodes) ||
              Math.max(row.scripts?.length ?? 0, row.videos?.length ?? 0);
            const costRate = row.budget
              ? Math.round((Number(row.actual || 0) / Number(row.budget)) * 100)
              : 0;
            return (
              <div
                className="platform-table__row platform-production-table__row"
                style={{ gridTemplateColumns: projectTableGrid }}
                key={row.id}
              >
                <strong className="platform-production-table__name">{row.name}</strong>
                <code className="platform-production-table__code">{row.projectCode}</code>
                <PlatformBadge tone={source === "选题库" ? "primary" : "neutral"}>{source}</PlatformBadge>
                <PlatformBadge tone={row.mode === "内部制作" ? "primary" : "neutral"}>{row.mode}</PlatformBadge>
                <span>{row.genre ?? linkedTopic?.genre ?? "待补充"}</span>
                <span>{row.owner}</span>
                <PlatformBadge>{row.status}</PlatformBadge>
                <strong>{episodeCount ? `${episodeCount} 集` : "—"}</strong>
                <span>{row.due ?? row.deadline ?? "待排期"}</span>
                {row.mode === "外部制作" ? (
                  <span className="platform-progress-exempt">不统计</span>
                ) : (
                  <ProgressBar value={projectProgress(row)} />
                )}
                <div className="platform-production-table__cost">
                  <strong>{formatMoney(row.actual)}</strong>
                  <small>/ {formatMoney(row.budget)} · {costRate}%</small>
                </div>
                <div className="platform-table-actions platform-production-table__actions">
                  <button
                    className="table-link"
                    onClick={() => setSelected(row)}
                    type="button"
                  >
                    详情
                  </button>
                  <button
                    className="table-link table-link--danger"
                    onClick={() => setDeletingProject(row)}
                    type="button"
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </DataTable>
      </PlatformCard>
      {current ? (
        <PlatformDrawer
          wide
          title={current.name}
          subtitle={`${current.projectCode} · ${current.mode} · 来源 ${current.topic}`}
          footer={management ? (
            <>
              {canAssign ? (
                <button
                  className="ghost-chip"
                  onClick={() => openProjectEditor(current)}
                  type="button"
                >
                  编辑项目
                </button>
              ) : null}
              <button
                className="primary-btn"
                onClick={() => {
                  setAssignmentProject(current);
                  setSelected(null);
                }}
                type="button"
              >
                {canAssign ? "人员配置" : "查看分工"}
              </button>
            </>
          ) : null}
          onClose={() => {
            setSelected(null);
            setContentCodePreview(null);
          }}
        >
          <div className="platform-detail-grid platform-project-detail-overview">
            <div>
              <span>项目名称</span>
              <strong>{current.name}</strong>
            </div>
            <div>
              <span>项目编号</span>
              <code>{current.projectCode}</code>
            </div>
            <div>
              <span>来源</span>
              <PlatformBadge tone={currentSource === "选题库" ? "primary" : "neutral"}>
                {currentSource}
              </PlatformBadge>
            </div>
            <div>
              <span>制作方式</span>
              <PlatformBadge tone={current.mode === "内部制作" ? "primary" : "neutral"}>
                {current.mode}
              </PlatformBadge>
            </div>
            <div>
              <span>题材</span>
              <strong>{current.genre ?? "待补充"}</strong>
            </div>
            <div>
              <span>项目集数</span>
              <strong>{currentEpisodeCount} 集</strong>
            </div>
            <div>
              <span>项目负责人</span>
              <strong>{current.owner}</strong>
            </div>
            <div>
              <span>基础状态</span>
              <PlatformBadge>{current.status}</PlatformBadge>
            </div>
            <div>
              <span>项目总预算</span>
              <strong>{formatMoney(current.budget)}</strong>
            </div>
            <div>
              <span>每集预算</span>
              <strong>{formatMoney(currentEpisodeCount ? current.budget / currentEpisodeCount : 0)}</strong>
            </div>
            <div>
              <span>实际成本</span>
              <strong>{formatMoney(currentCost.total)}</strong>
            </div>
            <div>
              <span>已上传剧本</span>
              <strong>{current.scriptFile?.name ?? "尚未上传"}</strong>
            </div>
            {current.mode === "内部制作" ? (
              <>
                <div>
                  <span>整体进度</span>
                  <strong>{projectProgress(current)}%</strong>
                </div>
                <div>
                  <span>异常标记</span>
                  <div className="platform-badge-row">
                    {(current.flags ?? []).length
                      ? current.flags.map((flag) => (
                          <PlatformBadge key={flag}>{flag}</PlatformBadge>
                        ))
                      : "无"}
                  </div>
                </div>
              </>
            ) : null}
            <div>
              <span>预计开始时间</span>
              <strong>{current.start ?? "待排期"}</strong>
            </div>
            <div>
              <span>预计完成时间</span>
              <strong>{current.due ?? current.deadline ?? "待排期"}</strong>
            </div>
          </div>
          <section className="platform-detail-section platform-project-staffing-detail">
            <div className="platform-section-heading">
              <div>
                <h3>{current.mode === "外部制作" ? "制片配置" : "参与人员及对应工期"}</h3>
                <p>
                  {current.mode === "外部制作"
                    ? "外部制作仅展示内部制片的对接范围与工期；点击“编辑项目”后可修改。"
                    : "展示当前岗位人员、负责集数、工期与审核设置；点击“编辑项目”后可修改。"}
                </p>
              </div>
              <PlatformBadge tone="neutral">只读</PlatformBadge>
            </div>
            <div className="platform-project-staffing platform-project-staffing--readonly">
              {currentStaffing.map((role) => (
                <article className="platform-project-role-card" key={role.id}>
                  <header>
                    <strong>{role.role}</strong>
                    <PlatformBadge tone={role.reviewEnabled ? "primary" : "neutral"}>
                      {role.reviewEnabled ? "需要审核" : "无需审核"}
                    </PlatformBadge>
                    <span className="platform-project-staffing-reviewer">
                      审核人：{role.reviewEnabled ? role.reviewer || "待配置" : "—"}
                    </span>
                  </header>
                  <div className="platform-project-role-card__body">
                    <div className="platform-project-staff-readonly-labels" aria-hidden="true">
                      <span>人员</span><span>负责集数</span><span>工期</span>
                    </div>
                    {role.rows.map((row) => (
                      <div className="platform-project-staff-readonly-row" key={row.id}>
                        <strong>{row.person || "待分配"}</strong>
                        <span>第 {row.episodeStart}–{row.episodeEnd} 集</span>
                        <span>{Number(row.durationDays) ? `${row.durationDays} 天` : "待排期"}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="platform-detail-section platform-content-codes">
            <div className="platform-section-heading">
              <div>
                <h3>内容编码台账</h3>
                <p>按集展示剧本与视频主编码，默认显示前 3 集，不展示版本编码。</p>
              </div>
              <div className="platform-content-code-heading-actions">
                <PlatformBadge tone="success">默认前 3 集</PlatformBadge>
                {currentContentRows.length > 3 ? (
                  <button
                    aria-label="查看全部内容编码"
                    className="ghost-chip"
                    onClick={() => setContentCodePreview("all")}
                    type="button"
                  >
                    查看全部
                  </button>
                ) : null}
              </div>
            </div>
            <DataTable
              columns={[
                { label: "分集", width: "90px" },
                { label: "剧本编码", width: "1fr" },
                { label: "视频编码", width: "1fr" },
              ]}
              minWidth={720}
            >
              {currentContentRows.slice(0, 3).map((entry) => (
                <div
                  className="platform-table__row platform-content-code-preview__row"
                  key={entry.episodeNo}
                  style={{ gridTemplateColumns: "90px 1fr 1fr" }}
                >
                  <strong>第 {entry.episodeNo} 集</strong>
                  <code>{entry.scriptCode}</code>
                  <code>{entry.videoCode}</code>
                </div>
              ))}
            </DataTable>
          </section>
          {current.mode === "内部制作" ? (
            <>
              <section className="platform-detail-section platform-project-cost-editor">
                <div className="platform-section-heading">
                  <div>
                    <h3>内部短剧成本明细</h3>
                    <p>详情页仅展示当前成本；点击底部“编辑项目”后可修改。</p>
                  </div>
                  <PlatformBadge tone="neutral">只读</PlatformBadge>
                </div>
                <div className="platform-project-cost-inputs is-readonly">
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
                    <article key={item.field}>
                      <span>{item.label}</span>
                      <strong>{formatMoney(currentCost[item.field])}</strong>
                      <small>{item.note}</small>
                    </article>
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
                  <p>环节进度由系统根据任务完成情况自动同步；整体进度取所有已启用环节的算术平均值。</p>
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
                  </article>
                ))}
              </div>
              </section>
            </>
          ) : (
            <section className="platform-detail-section">
              <div className="platform-section-heading">
                <div>
                  <h3>外部制作信息</h3>
                  <p>外部项目不进行进度统计，仅以预计开始时间和预计完成时间作为排期依据。</p>
                </div>
                <PlatformBadge tone={current.contract ? "success" : "warning"}>
                  {current.contract ? "合同已归档" : "合同待补充"}
                </PlatformBadge>
              </div>
              <div className="platform-detail-grid">
                <div>
                  <span>外部承制方公司名</span>
                  <strong>{current.vendorCompanyName || current.vendor || "待补充"}</strong>
                </div>
                <div>
                  <span>对应账号</span>
                  <strong>{current.vendorAccount || "待同步"}</strong>
                </div>
                <div>
                  <span>联系人</span>
                  <strong>{current.vendorContactName || current.contact || "待补充"}</strong>
                </div>
                <div>
                  <span>联系方式</span>
                  <strong>{current.vendorContactPhone || "待补充"}</strong>
                </div>
                <div>
                  <span>剧本共享范围</span>
                  <strong>
                    {current.externalScriptShareMode === "card"
                      ? (() => {
                          const range = scriptCardRange(
                            current.externalScriptCardNo,
                            currentEpisodeCount,
                          );
                          return `一卡 ${current.externalScriptCardNo} · 第 ${range.start}–${range.end} 集`;
                        })()
                      : `全部剧本 · 第 1–${currentEpisodeCount} 集`}
                  </strong>
                </div>
              </div>
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
                外部制作项目不生成进度百分比、进度条或进度异常统计。
              </PlatformNotice>
            </section>
          )}
          <section className="platform-timeline">
            <article>
              <i />
              <div>
                <strong>{current.mode === "外部制作" ? "最近信息更新" : "最近进度更新"}</strong>
                <span>
                  2026-07-14 14:51 · {current.owner} · {current.mode === "外部制作" ? "项目资料已更新" : "expectedVersion V8"}
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
      {editingProject && editProjectDraft ? (
        <PlatformDrawer
          wide
          className="platform-project-editor-drawer"
          title="编辑项目"
          subtitle={`${editingProject.projectCode} · ${editingProject.name}`}
          onClose={() => {
            setEditingProject(null);
            setEditProjectDraft(null);
          }}
          footer={
            <>
              <button
                className="ghost-chip"
                onClick={() => {
                  setEditingProject(null);
                  setEditProjectDraft(null);
                }}
                type="button"
              >
                取消
              </button>
              <button
                className="primary-btn"
                disabled={!isProjectFormValid(editProjectDraft)}
                onClick={saveEditedProject}
                type="button"
              >
                保存修改
              </button>
            </>
          }
        >
          <ProjectSetupForm draft={editProjectDraft} setDraft={setEditProjectDraft} />
          <section className="platform-project-form__section">
            <div className="platform-project-form__heading">
              <div>
                <span>制作配置</span>
                <h3>{editProjectDraft.mode === "内部制作" ? "内部项目成本" : "外部项目合同"}</h3>
              </div>
            </div>
            {editProjectDraft.mode === "内部制作" ? (
              <div className="platform-project-cost-inputs">
                {[
                  ["manpowerCost", "人力成本"],
                  ["computeCost", "算力成本"],
                  ["trafficCost", "投流成本"],
                ].map(([field, label]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      aria-label={`编辑${label}`}
                      min="0"
                      step="100"
                      type="number"
                      value={editProjectDraft[field]}
                      onChange={(event) =>
                        setEditProjectDraft((draft) => ({
                          ...draft,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            ) : (
              <ContractUploadField
                error={editContractError}
                file={editProjectDraft.contractFile}
                onChange={(file) =>
                  setEditProjectDraft((draft) => ({ ...draft, contractFile: file }))
                }
                onError={setEditContractError}
                onView={() => setContractPreview(editProjectDraft.contractFile)}
              />
            )}
          </section>
        </PlatformDrawer>
      ) : null}
      {assignmentProject ? (
        <ProjectAssignmentDrawer
          onClose={() => setAssignmentProject(null)}
          onSave={(assignments) => saveAssignments(assignmentProject.id, assignments)}
          project={assignmentProject}
          readOnly={!canAssign}
        />
      ) : null}
      {deletingProject ? (
        <PlatformDrawer
          title="删除项目"
          subtitle={`即将删除 ${deletingProject.name}`}
          onClose={() => setDeletingProject(null)}
          footer={
            <>
              <button className="ghost-chip" onClick={() => setDeletingProject(null)} type="button">
                取消
              </button>
              <button className="platform-danger-btn" onClick={() => deleteProject(deletingProject)} type="button">
                确认删除
              </button>
            </>
          }
        >
          <PlatformNotice tone="warning">
            删除后，项目任务与制作记录将不再显示；来自选题库的项目会解除关联，原选题仍保持已评估并继续保留在剧本库中。
          </PlatformNotice>
        </PlatformDrawer>
      ) : null}
      {contentCodePreview && current ? (
        <PlatformDrawer
          wide
          title="内容编码全部预览"
          subtitle={`${current.projectCode} · 共 ${currentContentRows.length} 集 · 仅展示每集剧本与视频主编码`}
          onClose={() => setContentCodePreview(null)}
          footer={
            <button
              className="primary-btn"
              onClick={() => setContentCodePreview(null)}
              type="button"
            >
              完成查看
            </button>
          }
        >
          <section className="platform-detail-section platform-content-code-preview">
            <div className="platform-section-heading">
              <div>
                <h3>全部分集编码</h3>
                <p>剧本与视频独立编号；此处不展示版本编码及分集状态。</p>
              </div>
              <PlatformBadge tone="primary">
                {currentContentRows.length} 集
              </PlatformBadge>
            </div>
            <DataTable
              columns={[
                { label: "分集", width: "90px" },
                { label: "剧本编码", width: "1fr" },
                { label: "视频编码", width: "1fr" },
              ]}
              minWidth={720}
            >
              {currentContentRows.map((entry) => (
                <div
                  className="platform-table__row platform-content-code-preview__row"
                  key={entry.episodeNo}
                  style={{ gridTemplateColumns: "90px 1fr 1fr" }}
                >
                  <strong>第 {entry.episodeNo} 集</strong>
                  <code>{entry.scriptCode}</code>
                  <code>{entry.videoCode}</code>
                </div>
              ))}
            </DataTable>
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
          wide
          className="platform-project-editor-drawer"
          title="新建项目"
          subtitle="独立项目入口；由选题立项的项目会自动带入来源编号"
          onClose={() => setCreating(false)}
          footer={
            <>
              <button className="ghost-chip" onClick={() => setCreating(false)} type="button">
                取消
              </button>
              <button
                className="primary-btn"
                disabled={!isProjectFormValid(projectDraft)}
                onClick={createStandaloneProject}
                type="button"
              >
                确认立项
              </button>
            </>
          }
        >
          <ProjectSetupForm draft={projectDraft} setDraft={setProjectDraft} />
          <section className="platform-project-form__section">
            <div className="platform-project-form__heading">
              <div>
                <span>制作配置</span>
                <h3>{projectDraft.mode === "内部制作" ? "内部项目成本" : "外部项目合同"}</h3>
              </div>
            </div>
            {projectDraft.mode === "内部制作" ? (
              <div className="platform-project-cost-inputs">
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
              </div>
            ) : (
              <ContractUploadField
                error={projectContractError}
                file={projectDraft.contractFile}
                onChange={(file) =>
                  setProjectDraft((draft) => ({ ...draft, contractFile: file }))
                }
                onError={setProjectContractError}
                onView={() => setContractPreview(projectDraft.contractFile)}
              />
            )}
          </section>
        </PlatformDrawer>
      ) : null}
    </div>
  );
}

export function ProjectManagementPage({ activeRole = "ceo", goPage }) {
  return <ProjectProductionPage activeRole={activeRole} goPage={goPage} management />;
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
          description="记录业务类型、动作、操作者、角色、前后状态、版本、原因和发生时间"
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
              <span>业务类型</span>
              <input placeholder="输入业务类型" />
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
              { label: "结果", width: "90px" },
            ]}
            minWidth={1120}
          >
            {auditLogs.map((row) => (
              <div
                className="platform-table__row"
                style={{
                  gridTemplateColumns:
                    "155px 150px 130px 1.2fr 120px 130px 70px 90px",
                }}
                key={row.requestId}
              >
                <span>{row.time}</span>
                <strong>{row.type}</strong>
                <strong>{row.action}</strong>
                <div>
                  <span>{row.operator}</span>
                  <small>{row.role}</small>
                </div>
                <span>{row.from}</span>
                <span>{row.to}</span>
                <strong>{row.version}</strong>
                <PlatformBadge>{row.result}</PlatformBadge>
              </div>
            ))}
          </DataTable>
        </PlatformCard>
      ) : null}
    </div>
  );
}
