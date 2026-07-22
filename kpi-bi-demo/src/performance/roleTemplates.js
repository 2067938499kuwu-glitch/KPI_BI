export const ROLE_TEMPLATE_IDS = {
  editor: "editor",
  editorLead: "editor_lead",
  chiefEditor: "chief_editor",
  screenwriter: "screenwriter",
  director: "director",
  producer: "producer",
  trafficOperator: "traffic_operator",
  finishedDramaOperator: "finished_drama_operator",
  overseasOperator: "overseas_operator",
  domesticClipOperator: "domestic_clip_operator",
  businessMiddle: "business_middle",
  businessJunior: "business_junior",
  contentDirector: "content_director",
};

const internalSource = "日报周报 / 项目统筹表 / 提交记录 / 评审记录 / 表格导入";
const proofSource = "员工填报 / 附件证明 / 负责人评价 / HR核验";

function createPerformanceStandards(standard) {
  return [
    { id: "excellent", label: "优秀", scoreRange: "80分（含）-100分", description: `${standard}，完成度显著高于岗位基准，结果和过程证明完整。` },
    { id: "good", label: "良好", scoreRange: "70分（含）-80分", description: `${standard}，达到岗位要求并稳定完成核心交付。` },
    { id: "qualified", label: "合格", scoreRange: "60分（含）-70分", description: `${standard}，基本达到岗位基准，存在少量延期或质量问题。` },
    { id: "improve", label: "待提升", scoreRange: "60分以下", description: `${standard}，未达到岗位基准，需要说明原因并制定改进计划。` },
  ];
}

function metric(key, label, weight, source, standard, businessLine) {
  return { key, label, weight, source, standard, standards: createPerformanceStandards(standard), type: "weighted", businessLine };
}

function adjustment(key, label, standard) {
  return { key, label, source: proofSource, standard, type: "adjustment" };
}

export const roleTemplates = [
  {
    id: ROLE_TEMPLATE_IDS.editor,
    name: "剪辑师",
    businessLines: ["剪辑中心", "初级剪辑师 / 中级剪辑师"],
    dimensions: [
      { name: "产量维度（40%）", items: [metric("editOutput", "剪辑产出总量", 0.4, internalSource, "统计剪辑产出、素材交付数量与任务完成数。")] },
      { name: "质量维度（30%）", items: [metric("editQuality", "返修与一次通过率", 0.3, "审核记录 / 上级评价 / 协作评价", "统计返修次数、一次通过率、大问题次数和协作方质量评价。")] },
      { name: "效率维度（30%）", items: [metric("editEfficiency", "按时交付率", 0.3, "任务截止时间 / 提交时间 / 项目记录", "统计按时交付率、延期次数与平均交付周期。")] },
    ],
    adjustments: [adjustment("editAsset", "方法与素材沉淀", "可复用剪辑模板、素材库、节奏方法可加分；版本混乱或重复返工可减分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.editorLead,
    name: "剪辑组长",
    businessLines: ["剪辑中心", "组长"],
    dimensions: [
      { name: "产量维度（40%）", items: [metric("teamEditOutput", "个人与组内产出", 0.4, internalSource, "统计个人剪辑产出、组内任务完成量与交付稳定性。")] },
      { name: "质量维度（30%）", items: [metric("teamEditQuality", "组内返修控制", 0.3, "审核记录 / 协作评价", "统计组内返修率、一次通过率与重大问题控制。")] },
      { name: "效率维度（30%）", items: [metric("teamEditEfficiency", "任务分配与响应", 0.3, "项目记录 / 任务记录", "评估组内按时交付率、任务分配合理性与问题响应速度。")] },
    ],
    adjustments: [adjustment("teamEditEnablement", "管理沉淀", "剪辑提效技巧、通用素材库、SOP、组员带动可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.chiefEditor,
    name: "主编",
    businessLines: ["编剧中心", "主编"],
    dimensions: [
      { name: "质量维度（50%）", items: [metric("chiefScriptQuality", "剧本质量评价", 0.5, "剧本提交记录 / 评审记录 / 上级评价", "统计剧本等级、重大问题次数、评审结果与质量评价。")] },
      { name: "产出维度（50%）", items: [metric("chiefScriptOutput", "团队剧本产出", 0.5, "工作平台记录 / 剧本产出登记表", "统计团队剧本产出完成率、提交数量与项目推进数量。")] },
    ],
    adjustments: [adjustment("chiefReviewSupport", "评审与带教贡献", "主编评审、改稿指导、方法沉淀和新人带教可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.screenwriter,
    name: "编剧",
    businessLines: ["编剧中心", "初级编剧 / 中级编剧"],
    dimensions: [
      { name: "质量维度（50%）", items: [metric("scriptQuality", "剧本等级与返修", 0.5, "主编初评 / 总监复评 / 剧本记录", "统计剧本等级、重大问题次数、主编初评和总监复评。")] },
      { name: "产出维度（50%）", items: [metric("scriptOutput", "剧本产出完成率", 0.5, "剧本产出登记表 / 日报周报 / 提交记录", "统计剧本产出完成率、提交数量和按期提交情况。")] },
    ],
    adjustments: [adjustment("scriptInnovation", "题材与结构创新", "可复用设定、爆点结构、题材创新可加分；逻辑漏洞或拖延改稿可减分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.director,
    name: "编导",
    businessLines: ["编剧中心", "编导"],
    dimensions: [
      { name: "工作量维度（50%）", items: [metric("directorWorkload", "分镜创作量", 0.5, "分镜登记表 / 提交记录", "统计分镜创作量、分镜提交数量与项目参与数量。")] },
      { name: "质量维度（50%）", items: [metric("directorQuality", "分镜质量评价", 0.5, "评审记录 / 上级评价 / 协作反馈", "统计项目评审结论、分镜大问题次数和协作方反馈。")] },
    ],
    adjustments: [adjustment("directorCoordination", "现场与跨组协作", "主动补齐拍摄/制作信息、提升协作效率可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.producer,
    name: "制片",
    businessLines: ["制片中心", "初级制片 / 中级制片 / 执行制片 / 总制片"],
    dimensions: [
      { name: "质量维度（45%）", items: [metric("producerQuality", "选题与成片质量", 0.45, "选题登记表 / 项目信息记录 / 评审记录", "统计选题评审通过率、成片问题次数和项目执行问题次数。")] },
      { name: "效率维度（35%）", items: [metric("producerEfficiency", "项目进度管控", 0.35, "项目统筹表 / 任务记录", "统计项目进度管控、延期次数与节点按时完成率。")] },
      { name: "工作量维度（20%）", items: [metric("producerWorkload", "选题与项目管理量", 0.2, "选题登记表 / 项目统筹表", "统计选题提报量、项目管理数量和审核数量。")] },
    ],
    adjustments: [adjustment("producerRisk", "风险处理与资源协调", "提前识别制作风险、协调资源或沉淀流程可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.trafficOperator,
    name: "投流师",
    businessLines: ["运营增长中心", "初级投流师 / 中级投流师"],
    dimensions: [
      { name: "工作量维度（40%）", items: [metric("trafficWorkload", "投放任务处理量", 0.4, "工作平台记录 / 提交记录 / 日报周报", "统计目标任务完成量、投放任务处理量与素材测试数量。")] },
      { name: "质量维度（40%）", items: [metric("trafficQuality", "投放与复盘质量", 0.4, "上级评价 / 协作评价 / 复盘材料", "评估投放质量、复盘质量和问题判断准确性。")] },
      { name: "效率维度（20%）", items: [metric("trafficEfficiency", "响应与迭代速度", 0.2, "任务记录 / 提交记录", "统计投放响应时效、迭代速度和复盘按时率。")] },
    ],
    adjustments: [adjustment("trafficIndependent", "独立处理能力", "中级投流师对消耗目标管理、复杂问题判断和复盘沉淀可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.finishedDramaOperator,
    name: "成品剧运营",
    businessLines: ["运营增长中心", "初级 / 中级成品剧运营"],
    dimensions: [
      { name: "工作量维度（25%）", items: [metric("finishedWorkload", "上架任务完成率", 0.25, "日报周报 / 平台记录导入", "统计上架任务完成率与上架数量。")] },
      { name: "质量维度（50%）", items: [metric("finishedQuality", "上架信息准确率", 0.5, "上架检查记录 / 上级评价 / 协作评价", "统计上架信息准确率、返工次数和零返工情况。")] },
      { name: "效率维度（25%）", items: [metric("finishedEfficiency", "上架时效达标率", 0.25, "任务记录 / 上架记录", "统计上架时效达标率与平均处理周期。")] },
    ],
    adjustments: [adjustment("finishedSupport", "异常处理与资料沉淀", "主动处理上架异常、沉淀检查清单可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.overseasOperator,
    name: "海外成品剧与切片运营",
    businessLines: ["运营增长中心", "海外成品剧 / 切片方向"],
    dimensions: [
      { name: "工作量维度（30%）", items: [metric("overseasWorkload", "上架与发布量", 0.3, "日报周报 / 发布记录导入", "统计成品剧上架完成率和切片素材日均发布量。")] },
      { name: "质量维度（45%）", items: [metric("overseasQuality", "上架与素材质量", 0.45, "上级评价 / 协作评价 / 人工导入或附件", "评估上架信息准确率、素材质量和切片播放说明。")] },
      { name: "效率维度（25%）", items: [metric("overseasEfficiency", "发布节奏稳定性", 0.25, "任务记录 / 日报周报", "统计上架时效达标率和发布节奏稳定性。")] },
    ],
    adjustments: [adjustment("overseasProof", "人工证明质量", "一期不接外部平台API，截图、表格和说明完整可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.domesticClipOperator,
    name: "国内切片运营",
    businessLines: ["运营增长中心", "国内切片方向"],
    dimensions: [
      { name: "工作量维度（40%）", items: [metric("domesticWorkload", "切片发布与账号维护", 0.4, "账号运营记录 / 日报周报", "统计切片素材日均发布量和账号维护数量。")] },
      { name: "质量维度（35%）", items: [metric("domesticQuality", "切片质量与增长说明", 0.35, "人工导入 / 截图附件 / 上级评价", "评估切片平均播放量说明、粉丝环比增长说明和内容质量。")] },
      { name: "效率维度（25%）", items: [metric("domesticEfficiency", "多账号管理稳定性", 0.25, "账号运营记录 / 任务记录", "统计发布及时性、异常处理效率和多账号并发稳定性。")] },
    ],
    adjustments: [adjustment("domesticAccountAsset", "账号方法沉淀", "账号运营方法、素材复盘、异常处理经验沉淀可加分。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.businessMiddle,
    name: "商务-中级",
    businessLines: ["商务部", "中级商务"],
    dimensions: [
      { name: "工作量维度（60%）", items: [metric("businessMiddleWorkload", "资源触达与跟进", 0.6, "个人日报周报 / 资源触达记录 / 沟通记录", "统计剧本资源触达、承制资源触达、二次跟进和深度沟通次数。")] },
      { name: "质量维度（40%）", items: [metric("businessMiddleQuality", "资源质量与入库", 0.4, "个人提报记录 / 上级评价 / 入库记录", "统计剧本评审通过率、意向资源入库数量和资源质量评价。")] },
    ],
    adjustments: [adjustment("businessMiddleDeal", "合同成交加分", "合同成交单个最高+5，累计最高+10，需提供合同或审批证明。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.businessJunior,
    name: "商务-初级",
    businessLines: ["商务部", "初级商务"],
    dimensions: [
      { name: "工作量维度（60%）", items: [metric("businessJuniorWorkload", "IP与资源触达", 0.6, "个人日报周报 / 触达记录 / 沟通记录", "统计IP资源触达、承制资源触达、有效沟通和跟进次数。")] },
      { name: "质量维度（40%）", items: [metric("businessJuniorQuality", "资源有效性", 0.4, "个人提报记录 / 上级评价 / 入库记录", "统计有效资源数量、资源匹配度和信息完整度。")] },
    ],
    adjustments: [adjustment("businessJuniorDeal", "IP成交加分", "IP成交单个最高+5，累计最高+10，需提供成交证明。")],
  },
  {
    id: ROLE_TEMPLATE_IDS.contentDirector,
    name: "内容运营中心总监",
    businessLines: ["内容运营中心", "中心总监"],
    dimensions: [
      { name: "组织结果维度（40%）", items: [metric("directorResult", "中心任务达成", 0.4, "中心月度看板 / 项目统筹表 / HR汇总", "统计内容经营中心整体任务达成、关键项目推进和结果稳定性。")] },
      { name: "流程质量维度（30%）", items: [metric("directorProcess", "流程完整与异常控制", 0.3, "流程记录 / 异常台账 / 复盘材料", "评估绩效流程完整性、异常控制和跨中心协同质量。")] },
      { name: "管理沉淀维度（30%）", items: [metric("directorManagement", "组织方法沉淀", 0.3, "制度文档 / 会议纪要 / 上级评价", "评估岗位模板、SOP、复盘机制和团队带教沉淀。")] },
    ],
    adjustments: [adjustment("directorSpecial", "重大贡献与风险", "重大业务贡献可加分；关键流程失控或重大争议可减分。")],
  },
];

export function getRoleTemplate(templateId) {
  return roleTemplates.find((template) => template.id === templateId) ?? null;
}

export function getRoleTemplateOptions() {
  return [
    { value: "all", label: "全部岗位模板" },
    ...roleTemplates.map((template) => ({ value: template.id, label: template.name })),
  ];
}

export function createRowsFromTemplate(templateId, values = {}) {
  const template = getRoleTemplate(templateId);
  if (!template) return [];

  return [
    ...template.dimensions.flatMap((dimension) => [
      { type: "section", key: dimension.name, title: dimension.name },
      ...dimension.items.map((item) => createMetricRow(item, values[item.key])),
    ]),
    ...(template.adjustments?.length
      ? [
          { type: "section", key: "加减分项（-10 至 10 分）", title: "加减分项（-10 至 10 分）" },
          ...template.adjustments.map((item) => createMetricRow(item, values[item.key])),
        ]
      : []),
  ];
}

function createMetricRow(item, value = {}) {
  return {
    ...item,
    selfText: value.selfText ?? "",
    firstScore: value.firstScore ?? 0,
    firstComment: value.firstComment ?? "",
    secondScore: value.secondScore ?? 0,
    secondComment: value.secondComment ?? "",
    completionNote: value.completionNote ?? "",
    evidence: value.evidence ?? "",
  };
}
