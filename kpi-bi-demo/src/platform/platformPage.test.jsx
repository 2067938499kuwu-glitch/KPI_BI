import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../App";

afterEach(cleanup);

function openRowDetails(label) {
  const row = screen.getByText(label).closest(".platform-table__row");
  fireEvent.click(within(row).getByRole("button", { name: /详情|处理/ }));
}

describe("KPI_BI 一体化管理平台", () => {
  test("项目管理在同一张台账中合并项目总览与立项，并可配置人员进入任务执行列表", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "主导航" });
    const businessEntries = within(navigation)
      .getAllByRole("button")
      .map((button) => button.textContent.replace("›", ""));

    expect(businessEntries.indexOf("剧本库")).toBe(
      businessEntries.indexOf("选题库") + 1,
    );
    expect(businessEntries.indexOf("项目管理")).toBe(
      businessEntries.indexOf("剧本库") + 1,
    );
    expect(businessEntries.indexOf("任务列表")).toBe(
      businessEntries.indexOf("项目管理") + 1,
    );
    expect(businessEntries).not.toContain("项目立项");
    expect(businessEntries).not.toContain("项目总览");

    fireEvent.click(within(navigation).getByRole("button", { name: "项目管理" }));
    expect(within(navigation).getByRole("button", { name: "项目管理" })).toHaveClass(
      "is-active",
    );
    expect(
      screen.getByRole("heading", { name: "项目总览、立项与任务协同" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "项目总览与立项台账" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "项目总览" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "项目立项" })).toBeNull();
    openRowDetails("《谁说炒菜的不算英雄》");
    const projectDialog = screen.getByRole("dialog", {
      name: "《谁说炒菜的不算英雄》",
    });
    fireEvent.click(within(projectDialog).getByRole("button", { name: "人员配置" }));
    const assignmentDialog = screen.getByRole("dialog", {
      name: "配置项目人员",
    });
    expect(within(assignmentDialog).getByText("按岗位分配执行负责人")).toBeInTheDocument();
    expect(
      within(assignmentDialog).getByRole("button", {
        name: /确认分配并下发/,
      }),
    ).toBeEnabled();
    fireEvent.click(within(assignmentDialog).getByRole("button", { name: "取消" }));

    fireEvent.click(within(navigation).getByRole("button", { name: "任务列表" }));
    expect(within(navigation).getByRole("button", { name: "任务列表" })).toHaveClass(
      "is-active",
    );
    expect(
      screen.getByRole("heading", { name: "项目任务执行列表" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "任务列表" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /编剧/ })).toBeInTheDocument();
    expect(screen.getAllByText("《谁说炒菜的不算英雄》").length).toBeGreaterThan(0);
  });

  test("工作台移除重复风险提醒并使用全宽任务看板", () => {
    render(<App />);

    const taskCard = screen
      .getByRole("heading", { name: "任务清单" })
      .closest(".platform-card");

    expect(taskCard).toHaveClass("platform-workbench-card");
    expect(screen.queryByRole("heading", { name: "业务风险提醒" })).toBeNull();
    expect(document.querySelector(".platform-workbench-aside")).toBeNull();
    expect(document.querySelector(".platform-task-list--board")).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "下属进度" })).toBeNull();
    expect(screen.queryByText("仅展示当前数据范围")).toBeNull();
    expect(screen.getByText("数据状态")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "查看今日待办" })).toBeNull();
    expect(screen.queryByText("今日到期")).toBeNull();
    expect(screen.queryByText("已逾期")).toBeNull();
    expect(screen.getByRole("tab", { name: /待处理/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /退回/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /已完成/ })).toBeInTheDocument();
    expect(within(taskCard).queryByText(/优先级/)).toBeNull();
    expect(within(taskCard).queryByText(/负责人 · /)).toBeNull();
    expect(within(taskCard).getAllByText(/来源 · /).length).toBeGreaterThan(0);
    expect(within(taskCard).queryByText("张小北")).toBeNull();
    expect(within(taskCard).queryByText("APP-021")).toBeNull();
    expect(within(taskCard).queryByText("rv-editor-1")).toBeNull();
    expect(within(taskCard).queryByText("2026-07-emp-011-W30")).toBeNull();
    expect(within(taskCard).getAllByText("PRJ-20260518-0001").length).toBeGreaterThan(0);
  });

  test("工作台任务弹窗仅展示当前任务的主要信息", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "任务工作台" })).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /确认候选人是否进入面试/ }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "确认候选人是否进入面试",
    });
    expect(within(dialog).queryByText(/优先级/)).toBeNull();
    expect(within(dialog).queryByText("周然")).toBeNull();
    expect(within(dialog).getByText("本次任务要求")).toBeInTheDocument();
    expect(within(dialog).getByText("处理角色")).toBeInTheDocument();
    expect(within(dialog).getByText("任务来源")).toBeInTheDocument();
    expect(within(dialog).getByText("任务下发时间")).toBeInTheDocument();
    expect(within(dialog).queryByText("截止时间")).toBeNull();
    expect(within(dialog).queryByText("任务标记")).toBeNull();
    expect(within(dialog).getByText(/结合候选人资料与岗位要求/)).toBeInTheDocument();
    expect(within(dialog).queryByText("当前任务业务信息")).toBeNull();
    expect(within(dialog).queryByText("138****5621")).toBeNull();
    expect(within(dialog).queryByText("任务流转信息")).toBeNull();
    expect(within(dialog).queryByText("负责人已查看")).toBeNull();
    expect(within(dialog).queryByText("系统自动创建")).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /进入业务详情/ }),
    );

    expect(screen.getByRole("button", { name: "招聘管理" })).toHaveClass(
      "is-active",
    );
    expect(
      screen.getByRole("heading", { name: "岗位、候选人与招聘日报" }),
    ).toBeInTheDocument();
  });

  test("不同来源的工作台任务使用统一标题且不展示人员姓名", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /确认候选人是否进入面试/ }),
    );
    let dialog = screen.getByRole("dialog", {
      name: "确认候选人是否进入面试",
    });
    expect(within(dialog).queryByText("周然")).toBeNull();
    expect(within(dialog).getByText("部门负责人")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "稍后处理" }));

    fireEvent.click(
      screen.getByRole("button", { name: /《谁说炒菜的不算英雄》 · 进行.*剧集的上传/ }),
    );
    dialog = screen.getByRole("dialog", { name: /《谁说炒菜的不算英雄》 · 进行.*剧集的上传/ });
    expect(within(dialog).getByText(/PRJ-20260518-0001/)).toBeInTheDocument();
    expect(within(dialog).queryByText("张小北")).toBeNull();
    expect(within(dialog).queryByText("制作环节进度")).toBeNull();
    expect(within(dialog).queryByText("剪辑一审")).toBeNull();
    expect(within(dialog).queryByText("任务流转信息")).toBeNull();
  });

  test("工作台恢复紧凑任务列表且各类任务详情保持精简", () => {
    render(<App />);

    ["绩效任务", "招聘任务", "项目任务", "周报任务", "SSC任务"].forEach((label) => {
      expect(screen.queryByRole("button", { name: new RegExp(`^${label}`) })).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: /进行2026-07绩效评分/ }));
    let dialog = screen.getByRole("dialog", { name: "进行2026-07绩效评分" });
    expect(within(dialog).getByText("绩效任务对象")).toBeInTheDocument();
    expect(within(dialog).getByText("本次任务要求")).toBeInTheDocument();
    expect(within(dialog).queryByText("任务数据摘要")).toBeNull();
    expect(within(dialog).queryByText("组内任务")).toBeNull();
    expect(within(dialog).queryByText("任务流转信息")).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "稍后处理" }));

    fireEvent.click(screen.getAllByRole("button", { name: "提交2026年W30周报" })[0]);
    dialog = screen.getByRole("dialog", { name: "提交2026年W30周报" });
    expect(within(dialog).getByText("本次任务要求")).toBeInTheDocument();
    expect(within(dialog).queryByText("周报内容结构")).toBeNull();
    expect(within(dialog).queryByText("本周成果")).toBeNull();
    expect(within(dialog).queryByText("风险与问题")).toBeNull();
    expect(within(dialog).queryByText("下周计划")).toBeNull();
    expect(within(dialog).queryByText("2026-07-20 至 2026-07-26")).toBeNull();
  });

  test("工作台进入业务详情后自动打开带任务上下文的处理界面", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /确认候选人是否进入面试/ }),
    );
    const workbenchDialog = screen.getByRole("dialog", {
      name: "确认候选人是否进入面试",
    });
    fireEvent.click(
      within(workbenchDialog).getByRole("button", { name: /进入业务详情/ }),
    );

    const dialog = screen.getByRole("dialog", { name: "候选人部门确认" });
    expect(within(dialog).getByText(/招聘 · 确认候选人是否进入面试/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/APP-021/)).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: "提交部门结论" }),
    ).toBeEnabled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "提交部门结论" }),
    );
    expect(screen.queryByRole("dialog", { name: "候选人部门确认" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "已回写来源业务单据",
    );
    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    expect(screen.getByText("周然").closest(".platform-table__row")).toHaveTextContent(
      "待安排面试",
    );
    fireEvent.click(screen.getByRole("button", { name: "统一工作台" }));
    expect(screen.queryByText("确认候选人是否进入面试")).toBeNull();
  });

  test("切换角色后按权限更新导航与工作台待办范围", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("button", { name: /员工/ }));

    expect(screen.getByRole("button", { name: "统一工作台" })).toHaveClass(
      "is-active",
    );
    expect(screen.queryByRole("button", { name: "招聘管理" })).toBeNull();
    expect(screen.queryByRole("button", { name: "系统配置" })).toBeNull();
    expect(screen.getAllByText(/《谁说炒菜的不算英雄》 · 进行\d+-\d+剧集的上传/).length).toBeGreaterThan(0);
    expect(screen.queryByText("确认候选人是否进入面试")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("无权访问");
  });

  test("经营驾驶舱移除头部辅助操作并将分析维度放在标题区", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));

    const heading = screen.getByRole("heading", { name: "跨业务经营总览" });
    const header = heading.closest(".platform-header");
    const tabs = screen.getByRole("tablist", { name: "驾驶舱分析维度" });

    expect(header).toHaveClass("platform-header--dashboard");
    expect(header.nextElementSibling).toBe(tabs);
    expect(screen.queryByRole("region", { name: "当前权限范围" })).toBeNull();
    expect(screen.queryByText("数据状态")).toBeNull();
    expect(screen.queryByRole("button", { name: "指标口径" })).toBeNull();
    expect(screen.queryByRole("button", { name: "按权限导出" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "人员负荷" })).toBeNull();
    expect(screen.queryByText("审计异常")).toBeNull();
    expect(document.querySelectorAll(".platform-metrics > button")).toHaveLength(7);
    expect(screen.queryByText("人员逾期任务")).toBeNull();
    expect(screen.queryByRole("heading", { name: "经营风险清单" })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "月度项目金额与人员消耗趋势" }),
    ).toBeInTheDocument();

    const healthCard = screen
      .getByRole("heading", { name: "内容与项目健康度" })
      .closest(".platform-card");
    ["剧本", "制作", "剪辑", "成片"].forEach((stage) => {
      expect(within(healthCard).getByText(stage)).toBeInTheDocument();
    });
    expect(within(healthCard).queryByText("视频")).toBeNull();
    expect(within(healthCard).queryByText("配音")).toBeNull();
  });

  test("经营驾驶舱非人员绩效页面只保留统计时间筛选", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));

    const expectSinglePeriodFilter = () => {
      const filter = document.querySelector(".platform-filter--period");
      expect(filter).not.toBeNull();
      expect(within(filter).getByRole("group", { name: "统计时间范围" })).toBeInTheDocument();
      expect(within(filter).getByLabelText("统计开始月份")).toHaveValue("2026-03");
      expect(within(filter).getByLabelText("统计结束月份")).toHaveValue("2026-07");
      expect(within(filter).queryByText("部门")).toBeNull();
      expect(within(filter).queryByText("人员 / 岗位")).toBeNull();
      expect(within(filter).queryByText("项目 / 状态")).toBeNull();
      expect(within(filter).queryByText("招聘平台")).toBeNull();
      expect(within(filter).queryByRole("button")).toBeNull();
    };

    expectSinglePeriodFilter();
    fireEvent.click(screen.getByRole("tab", { name: "招聘分析" }));
    expectSinglePeriodFilter();
    fireEvent.click(screen.getByRole("tab", { name: "内容项目" }));
    expectSinglePeriodFilter();

    fireEvent.click(screen.getByRole("tab", { name: "人员绩效" }));
    expect(document.querySelector(".platform-filter--period")).toBeNull();
    expect(screen.getByRole("combobox", { name: "绩效月份" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "部门" })).toBeInTheDocument();
  });

  test("经营总览按时间范围统计项目金额与人员消耗", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));

    const trend = screen
      .getByRole("heading", { name: "月度项目金额与人员消耗趋势" })
      .closest(".platform-card");
    expect(
      within(trend).getByRole("img", { name: "月度项目金额和人员消耗折线图" }),
    ).toBeInTheDocument();
    expect(within(trend).getByText("¥484.99")).toBeInTheDocument();
    expect(within(trend).getByText("¥520.6")).toBeInTheDocument();
    expect(within(trend).getByText("归集项目").closest("div")).toHaveTextContent("9 个");

    fireEvent.change(screen.getByLabelText("统计开始月份"), {
      target: { value: "2026-04" },
    });
    expect(within(trend).getByText("¥398.61")).toBeInTheDocument();
    expect(within(trend).getByText("¥394.1")).toBeInTheDocument();
    expect(within(trend).getByText("归集项目").closest("div")).toHaveTextContent("6 个");
  });

  test("驾驶舱指标可查看计算公式、来源和纳入排除记录", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));
    fireEvent.click(screen.getByRole("button", { name: /本月正式入职/ }));

    const dialog = screen.getByRole("dialog", { name: "本月正式入职" });
    expect(within(dialog).getByText("指标口径与数据来源")).toBeInTheDocument();
    expect(within(dialog).getByText("计算公式")).toBeInTheDocument();
    expect(
      within(dialog).getByText("候选人应聘记录、SSC 人员花名册"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("演示口径 V1.0")).toBeInTheDocument();
  });

  test("员工驾驶舱只展示个人数据，不暴露公司经营总览", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /员工/ }));
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));

    expect(screen.queryByRole("heading", { name: "跨业务经营总览" })).toBeNull();
    expect(screen.queryByText("经营风险清单")).toBeNull();
    expect(screen.getByRole("heading", { name: "人员绩效与周报数据看板" })).toBeInTheDocument();
    expect(screen.getByText("仅展示本人信息")).toBeInTheDocument();
  });

  test("经营驾驶舱以柱状图和折线图展示招聘转化", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));

    expect(
      screen.getByRole("heading", { name: "招聘转化数据统计" }),
    ).toBeInTheDocument();

    const statistics = screen.getByRole("region", {
      name: "招聘转化数据统计",
    });
    expect(within(statistics).getByText("触达总人数")).toBeInTheDocument();
    expect(within(statistics).getByText("整体入职转化率")).toBeInTheDocument();
    expect(within(statistics).getByText("最终入职人数")).toBeInTheDocument();
    expect(
      within(statistics).getByRole("img", {
        name: "招聘转化柱状图和折线图",
      }),
    ).toBeInTheDocument();
    expect(within(statistics).getByText("环节人数")).toBeInTheDocument();
    expect(within(statistics).getByText("相邻转化率")).toBeInTheDocument();
  });

  test("招聘分析展示每个岗位和招聘人员的数据情况", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));
    fireEvent.click(screen.getByRole("tab", { name: "招聘分析" }));

    expect(
      screen.queryByRole("heading", { name: "重点风险" }),
    ).not.toBeInTheDocument();

    const jobsCard = screen
      .getByRole("heading", { name: "岗位招聘情况" })
      .closest(".platform-card");
    const recruitersCard = screen
      .getByRole("heading", { name: "招聘人员数据" })
      .closest(".platform-card");

    expect(jobsCard.querySelector(".platform-table")).toHaveClass("platform-table--single-line");
    expect(recruitersCard.querySelector(".platform-table")).toHaveClass("platform-table--single-line");
    expect(jobsCard.querySelectorAll(".platform-table__row")).toHaveLength(4);
    expect(within(jobsCard).getByText("短剧编剧")).toBeInTheDocument();
    expect(within(jobsCard).getByText("中级剪辑师")).toBeInTheDocument();
    expect(within(jobsCard).getByText("制片经理")).toBeInTheDocument();
    expect(within(jobsCard).getByText("海外发行运营")).toBeInTheDocument();

    expect(
      recruitersCard.querySelectorAll(".platform-table__row"),
    ).toHaveLength(3);
    expect(within(recruitersCard).getByText("陈璐")).toBeInTheDocument();
    expect(within(recruitersCard).getByText("许晴")).toBeInTheDocument();
    expect(within(recruitersCard).getByText("周宁")).toBeInTheDocument();
    expect(within(recruitersCard).queryByText("日报数据状态")).toBeNull();
    expect(within(recruitersCard).queryByText(/已纳入/)).toBeNull();
    const recruiterHead = recruitersCard.querySelector(".platform-table__head");
    expect(recruiterHead?.children).toHaveLength(8);
    expect(recruiterHead?.style.gridTemplateColumns).toBe(
      "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
    );

    const decisionCard = screen
      .getByRole("heading", { name: "招聘流失与面试质量分析" })
      .closest(".platform-card");
    expect(within(decisionCard).getByRole("heading", { name: "简历不通过原因" })).toBeInTheDocument();
    expect(within(decisionCard).getByText("专业技能不匹配")).toBeInTheDocument();
    expect(within(decisionCard).getByRole("heading", { name: "面试不通过原因" })).toBeInTheDocument();
    expect(within(decisionCard).getByText("项目经验不足")).toBeInTheDocument();
    expect(within(decisionCard).getByRole("heading", { name: "Offer 被拒绝原因" })).toBeInTheDocument();
    expect(within(decisionCard).getByText("薪资未达预期")).toBeInTheDocument();
    expect(within(decisionCard).getByRole("heading", { name: "面试官数据" })).toBeInTheDocument();
  });

  test("内容项目按名称匹配外部导入的红果数据并归入对应项目", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));
    fireEvent.click(screen.getByRole("tab", { name: "内容项目" }));

    expect(screen.getByText("项目总数")).toBeInTheDocument();
    expect(screen.getByText("内部 / 外部制作")).toBeInTheDocument();
    expect(screen.getByText("运营数据匹配率")).toBeInTheDocument();
    expect(screen.getByText("1 条已匹配 · 26 条待匹配")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "项目总览台账" }),
    ).toBeInTheDocument();

    const ledger = screen
      .getByRole("heading", { name: "项目总览台账" })
      .closest(".platform-card");
    expect(ledger.querySelector(".platform-table")).toHaveClass("platform-table--single-line");
    expect(
      ledger.querySelector(".platform-table__head").style.gridTemplateColumns,
    ).toContain("minmax(");
    expect(ledger.querySelector(".platform-table").style.minWidth).toBe("1080px");
    expect(ledger.querySelectorAll(".platform-project-ledger-row")).toHaveLength(4);
    expect(within(ledger).getByText("《谁说炒菜的不算英雄》")).toBeInTheDocument();
    expect(within(ledger).getByText("《夏日回响》")).toBeInTheDocument();
    expect(within(ledger).getByText("2026-05-18")).toBeInTheDocument();
    expect(within(ledger).getByText("2026-08-05")).toBeInTheDocument();
    expect(within(ledger).getByText("¥171,000")).toBeInTheDocument();
    expect(within(ledger).queryByText("参与中心")).toBeNull();

    const cityRow = within(ledger)
      .getByText("《谁说炒菜的不算英雄》")
      .closest(".platform-project-ledger-row");
    expect(cityRow.querySelectorAll(".platform-table-inline-cell")).toHaveLength(2);
    expect(within(cityRow).getByText("已匹配 1 条数据")).toBeInTheDocument();
    expect(within(cityRow).getByText(/红果后台导出 · 名称一致/)).toBeInTheDocument();
    fireEvent.click(within(cityRow).getByRole("button", { name: "查看" }));

    const dialog = screen.getByRole("dialog", { name: "《谁说炒菜的不算英雄》" });
    expect(within(dialog).getByText("项目人员消耗金额")).toBeInTheDocument();
    expect(within(dialog).queryByText("参与中心")).toBeNull();
    expect(within(dialog).getAllByText("¥82,000").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("运营导入数据")).toBeInTheDocument();
    expect(within(dialog).getByText(/项目名称“《谁说炒菜的不算英雄》”与红果作品名称一致/)).toBeInTheDocument();
    expect(within(dialog).getByText("匹配成功 · 1 条")).toBeInTheDocument();
    expect(within(dialog).getByText("作品数据.csv")).toBeInTheDocument();
    expect(within(dialog).getByText(/陆运营 上传于 2026-07-08 11:52/)).toBeInTheDocument();

    const uploadTable = within(dialog).getByRole("table", {
      name: "作品数据.csv 数据明细",
    });
    expect(within(uploadTable).getByText("作品名称")).toBeInTheDocument();
    expect(within(uploadTable).getByText("60分钟完播率")).toBeInTheDocument();
    expect(within(uploadTable).getByText("谁说炒菜的不算英雄")).toBeInTheDocument();
    expect(within(uploadTable).getByText("7656651214079151129")).toBeInTheDocument();
    expect(uploadTable.querySelectorAll("tbody tr")).toHaveLength(1);

    fireEvent.click(dialog.querySelector("footer .ghost-chip"));
    const summerRow = within(ledger)
      .getByText("《夏日回响》")
      .closest(".platform-project-ledger-row");
    expect(within(summerRow).getByText("暂无匹配数据")).toBeInTheDocument();
    fireEvent.click(within(summerRow).getByRole("button", { name: "查看" }));
    const unmatchedDialog = screen.getByRole("dialog", { name: "《夏日回响》" });
    expect(within(unmatchedDialog).getByText("未匹配到同名运营数据")).toBeInTheDocument();
  });

  test("招聘拒绝面试时原因必填，候选人主档可保留多条应聘记录", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    openRowDetails("周然");

    const dialog = screen.getByRole("dialog", { name: "周然" });
    expect(within(dialog).getByText("岗位应聘记录")).toBeInTheDocument();
    expect(within(dialog).getByText("内容策划")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "不进入面试" }));

    const drawerBody = dialog.querySelector(".platform-drawer__body");
    const drawerFooter = dialog.querySelector("footer");
    const submit = within(dialog).getByRole("button", {
      name: "确认结论并保留审计记录",
    });
    expect(
      within(drawerBody).queryByRole("button", {
        name: "确认结论并保留审计记录",
      }),
    ).toBeNull();
    expect(
      within(drawerFooter).getByRole("button", {
        name: "确认结论并保留审计记录",
      }),
    ).toBe(submit);
    expect(submit).toBeDisabled();
    fireEvent.change(
      within(dialog).getByRole("combobox", { name: "原因分类 *" }),
      { target: { value: "经验不匹配" } },
    );
    fireEvent.change(
      within(dialog).getByPlaceholderText("补充具体事实或候选人反馈，便于后续复盘"),
      {
        target: { value: "岗位经验与当前要求不匹配" },
      },
    );
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(
      within(dialog).getByText("流程已结束：不进入面试"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭" }));
    expect(
      screen.getByText("周然").closest(".platform-table__row"),
    ).toHaveTextContent("不进入面试");
  });

  test("招聘简历库展示每位候选人的全部应聘情况并支持结果筛选", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));

    const resumeLibrary = screen
      .getByRole("heading", { name: "招聘简历库" })
      .closest(".platform-card");
    const zhouRanRow = within(resumeLibrary)
      .getByText("周然")
      .closest(".platform-table__row");

    expect(zhouRanRow).toHaveTextContent("短剧编剧");
    expect(zhouRanRow).toHaveTextContent("待部门确认");
    expect(zhouRanRow).toHaveTextContent("内容策划");
    expect(zhouRanRow).toHaveTextContent("待面试反馈");
    expect(zhouRanRow).toHaveTextContent("中级剪辑师");
    expect(zhouRanRow).toHaveTextContent("不合适");
    expect(zhouRanRow).toHaveTextContent("专业技能不匹配");

    fireEvent.click(
      within(resumeLibrary).getByRole("button", { name: /不合适.*应聘记录/ }),
    );
    const filteredZhouRanRow = within(resumeLibrary)
      .getByText("周然")
      .closest(".platform-table__row");
    expect(filteredZhouRanRow).toHaveTextContent("不进入面试");
    expect(filteredZhouRanRow).not.toHaveTextContent("待部门确认");

    fireEvent.change(
      within(resumeLibrary).getByRole("combobox", {
        name: "招聘结果 / 进度",
      }),
      { target: { value: "offer" } },
    );
    const offerRow = within(resumeLibrary)
      .getByText("林澈")
      .closest(".platform-table__row");
    expect(offerRow).toHaveTextContent("Offer已发");
    expect(offerRow).toHaveTextContent("待候选人确认");
    expect(offerRow).not.toHaveTextContent("Offer已拒绝");
  });

  test("招聘管理页头不再显示招聘统计周期", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));

    expect(
      screen.queryByRole("region", { name: "招聘统计周期" }),
    ).toBeNull();
    expect(screen.queryByText("数据状态")).toBeNull();
    expect(screen.getByRole("tab", { name: "岗位与需求4" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "简历库 / 候选人4" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "招聘日报3" })).toBeInTheDocument();
  });

  test("招聘岗位与候选人表格使用单行台账并保留横向滚动", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));

    const jobsCard = screen
      .getByRole("heading", { name: "招聘岗位与需求" })
      .closest(".platform-card");
    const jobsTable = jobsCard.querySelector(".platform-table");
    expect(jobsTable).toHaveClass(
      "platform-table--single-line",
      "recruitment-management-table",
      "recruitment-jobs-table",
    );
    expect(jobsTable).toHaveStyle({ minWidth: "1550px" });
    const jobRow = within(jobsCard)
      .getByText("短剧编剧")
      .closest(".platform-table__row");
    expect(jobRow.querySelectorAll(".platform-table-inline-cell")).toHaveLength(3);

    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    const candidatesCard = screen
      .getByRole("heading", { name: "招聘简历库" })
      .closest(".platform-card");
    const candidatesTable = candidatesCard.querySelector(".platform-table");
    expect(candidatesTable).toHaveClass(
      "platform-table--single-line",
      "recruitment-management-table",
      "recruitment-candidates-table",
    );
    expect(candidatesTable).toHaveStyle({ minWidth: "1840px" });
    const candidateRow = within(candidatesCard)
      .getByText("周然")
      .closest(".platform-table__row");
    expect(candidateRow.querySelectorAll(".platform-table-inline-cell")).toHaveLength(3);
    expect(candidateRow.querySelector(".recruitment-application-overview")).toBeInTheDocument();
  });

  test("岗位与候选人目录分别支持按年月日筛选", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));

    const jobsPeriod = screen.getByRole("region", {
      name: "岗位与需求时间筛选",
    });
    expect(
      within(jobsPeriod).getByRole("button", { name: "月" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(jobsPeriod).getByRole("button", { name: "年" }));
    fireEvent.change(within(jobsPeriod).getByLabelText("岗位与需求选择年份"), {
      target: { value: "2025" },
    });
    expect(screen.getByRole("tab", { name: "岗位与需求0" })).toBeInTheDocument();
    expect(screen.getByText("当前时间范围没有招聘岗位")).toBeInTheDocument();

    fireEvent.click(within(jobsPeriod).getByRole("button", { name: "日" }));
    fireEvent.change(within(jobsPeriod).getByLabelText("岗位与需求选择日期"), {
      target: { value: "2026-07-17" },
    });
    expect(within(jobsPeriod).getByText("2026-07-17")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "岗位与需求4" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    const candidatesPeriod = screen.getByRole("region", {
      name: "简历库 / 候选人时间筛选",
    });
    expect(
      within(candidatesPeriod).getByRole("button", { name: "月" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(
      within(candidatesPeriod).getByRole("button", { name: "日" }),
    );
    fireEvent.change(
      within(candidatesPeriod).getByLabelText("简历库 / 候选人选择日期"),
      { target: { value: "2026-07-14" } },
    );
    expect(within(candidatesPeriod).getByText("2026-07-14")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /岗位与需求/ }));
    expect(
      within(screen.getByRole("region", { name: "岗位与需求时间筛选" }))
        .getByRole("button", { name: "日" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("招聘日报按人员查看招聘信息、历史记录与贴图", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("tab", { name: "招聘日报3" }));

    expect(screen.getByRole("heading", { name: "日报" })).toBeInTheDocument();
    expect(screen.queryByText("日报提交与流程差异")).toBeNull();
    expect(screen.queryByText(/项差异|无差异/)).toBeNull();
    ["回复", "获取简历", "有效简历", "邀约"].forEach((label) => {
      expect(screen.queryByText(label, { exact: true })).toBeNull();
    });
    expect(screen.getByRole("button", { name: /Offer发放/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查看陈璐日报" }));
    const dialog = screen.getByRole("dialog", { name: "陈璐的招聘日报" });
    expect(
      within(dialog).getByRole("region", { name: "招聘日报数据" }),
    ).toBeInTheDocument();
    ["回复", "获取简历", "有效简历", "邀约"].forEach((label) => {
      expect(within(dialog).queryByText(label, { exact: true })).toBeNull();
    });
    expect(within(dialog).getByText("Offer 发放")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "历史日报" })).toBeInTheDocument();
    expect(within(dialog).getByText("陈璐-BOSS直聘-沟通记录.png")).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "查看图片陈璐-BOSS直聘-沟通记录.png",
      }),
    );
    expect(
      within(dialog).getAllByRole("img", { name: "陈璐-BOSS直聘-沟通记录.png" }),
    ).toHaveLength(2);
  });

  test("填写日报时上传图片并提交", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("tab", { name: "招聘日报3" }));
    fireEvent.click(screen.getByRole("button", { name: "填写日报" }));

    const dialog = screen.getByRole("dialog", { name: "填写日报" });
    ["回复数", "获取简历", "有效简历", "邀约"].forEach((label) => {
      expect(within(dialog).queryByText(label, { exact: true })).toBeNull();
    });
    expect(within(dialog).getByText("Offer 发放")).toBeInTheDocument();
    const file = new File(["daily-image"], "7月15日招聘日报.png", {
      type: "image/png",
    });
    fireEvent.change(within(dialog).getByLabelText("上传日报贴图"), {
      target: { files: [file] },
    });
    expect(within(dialog).getByText("7月15日招聘日报.png")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "提交正式日报" }));
    expect(screen.queryByRole("dialog", { name: "填写日报" })).toBeNull();
    expect(screen.getByRole("tab", { name: "招聘日报4" })).toBeInTheDocument();
  });

  test("第一轮面试排期后直接进入面试结果并可推进到 Offer 待发", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    openRowDetails("周然");

    const dialog = screen.getByRole("dialog", { name: "周然" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "进入面试", exact: true }),
    );
    expect(
      within(dialog).getByText("当前节点：待安排面试"),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "确认第 1/1 轮面试安排",
      }),
    );
    expect(
      within(dialog.querySelector(".platform-drawer__body")).queryByRole(
        "button",
        { name: /确认并推进至「待面试反馈」/ },
      ),
    ).toBeNull();
    expect(
      within(dialog.querySelector("footer")).getByRole("button", {
        name: /确认并推进至「待面试反馈」/,
      }),
    ).toBeInTheDocument();
    fireEvent.change(
      within(dialog).getByRole("combobox", {
        name: "第 1/1 轮面试官 *",
      }),
      { target: { value: "江晚" } },
    );
    fireEvent.change(within(dialog).getByLabelText("第 1/1 轮面试时间 *"), {
      target: { value: "2026-07-16T14:00" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: /确认并推进至「待面试反馈」/,
      }),
    );
    expect(
      within(dialog).getByText("当前节点：待面试反馈"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", {
        name: "登记第 1/1 轮面试完成",
      }),
    ).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "面试通过" }));

    expect(within(dialog).getByText("当前节点：Offer待发")).toBeInTheDocument();
    expect(within(dialog).getByText("第 1 轮面试通过")).toBeInTheDocument();
  });

  test("多轮面试按岗位配置逐轮排期，最后一轮通过后进入 Offer", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    openRowDetails("顾言");

    const dialog = screen.getByRole("dialog", { name: "顾言" });
    expect(within(dialog).getByText("面试：第 1/2 轮")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "面试通过" }));
    expect(
      within(dialog).getByText("当前节点：待安排面试"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", {
        name: "确认第 2/2 轮面试安排",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "确认第 2/2 轮面试安排",
      }),
    );
    fireEvent.change(
      within(dialog).getByRole("combobox", { name: "第 2/2 轮面试官 *" }),
      { target: { value: "李晓言" } },
    );
    fireEvent.change(within(dialog).getByLabelText("第 2/2 轮面试时间 *"), {
      target: { value: "2026-07-18T10:30" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: /确认并推进至「待面试反馈」/,
      }),
    );
    expect(within(dialog).getByText("2026-07-18 10:30")).toBeInTheDocument();
    expect(
      within(dialog).getByText("当前节点：待面试反馈"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "面试通过" }));

    expect(within(dialog).getByText("当前节点：Offer待发")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("region", { name: "面试轮次记录" }),
    ).toHaveTextContent("第 1 轮");
    expect(
      within(dialog).getByRole("region", { name: "面试轮次记录" }),
    ).toHaveTextContent("第 2 轮");
  });

  test("到岗状态读取 SSC 花名册且不再展示 15 天观察", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    expect(screen.getByText("SSC 到岗人员")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    openRowDetails("苏冉");

    const dialog = screen.getByRole("dialog", { name: "苏冉" });
    expect(within(dialog).getByText("SSC 到岗状态：实习期")).toBeInTheDocument();
    expect(within(dialog).getByText("到岗状态（SSC）")).toBeInTheDocument();
    expect(within(dialog).queryByText("ZY20260715")).toBeNull();
    expect(within(dialog).queryByText(/15\s*天/)).toBeNull();
  });

  test("SSC 建档消息可即时回写到岗状态但不展示员工编号", () => {
    render(<App />);

    fireEvent(
      window,
      new MessageEvent("message", {
        origin: window.location.origin,
        data: {
          type: "ssc-recruitment-linked",
          candidateId: "CAN-026",
          applicationId: "APP-026",
          employee: {
            no: "ZY20260716",
            date: "2026-07-16",
            status: "实习期",
            regular: "实习期",
          },
        },
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("tab", { name: /简历库 \/ 候选人/ }));
    openRowDetails("顾言");

    const dialog = screen.getByRole("dialog", { name: "顾言" });
    expect(within(dialog).getByText("SSC 到岗状态：实习期")).toBeInTheDocument();
    expect(within(dialog).queryByText("ZY20260716")).toBeNull();
  });

  test("新增岗位回显部门负责人，上传候选人后直接进入待部门确认", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("button", { name: "新增岗位" }));
    const jobDialog = screen.getByRole("dialog", { name: "新增招聘岗位" });
    fireEvent.change(
      within(jobDialog).getByRole("combobox", { name: "所属部门 *" }),
      { target: { value: "经营管理部" } },
    );
    expect(
      within(jobDialog).getByRole("textbox", { name: "部门负责人" }),
    ).toHaveValue("陈雨");
    fireEvent.change(
      within(jobDialog).getByRole("combobox", { name: "职位 *" }),
      { target: { value: "数据分析师" } },
    );
    fireEvent.change(
      within(jobDialog).getByRole("textbox", { name: "招聘负责人 *" }),
      { target: { value: "陈璐" } },
    );
    fireEvent.change(
      within(jobDialog).getByRole("combobox", { name: "面试轮次 *" }),
      { target: { value: "3" } },
    );
    ["江晚", "李晓言", "沈婉瑶"].forEach((interviewer, index) => {
      fireEvent.change(
        within(jobDialog).getByRole("combobox", {
          name: `第 ${index + 1} 轮面试官 *`,
        }),
        { target: { value: interviewer } },
      );
    });
    fireEvent.click(
      within(jobDialog).getByRole("button", { name: "创建岗位" }),
    );

    const jobRow = screen
      .getByText("数据分析师")
      .closest(".platform-table__row");
    expect(jobRow).toHaveTextContent("3 轮");
    fireEvent.click(within(jobRow).getByRole("button", { name: "上传候选人" }));
    const candidateDialog = screen.getByRole("dialog", {
      name: "上传候选人并创建应聘记录",
    });
    fireEvent.change(
      within(candidateDialog).getByRole("textbox", { name: "候选人姓名 *" }),
      { target: { value: "赵新" } },
    );
    fireEvent.change(
      within(candidateDialog).getByRole("textbox", { name: "手机号 *" }),
      { target: { value: "13900000000" } },
    );
    fireEvent.change(
      within(candidateDialog).getByRole("textbox", { name: "邮箱 *" }),
      { target: { value: "zhao@example.com" } },
    );
    fireEvent.change(screen.getByLabelText("候选人简历"), {
      target: {
        files: [new File(["resume"], "zhao.pdf", { type: "application/pdf" })],
      },
    });
    fireEvent.click(
      within(candidateDialog).getByRole("button", { name: "上传并进入待部门确认" }),
    );

    const createdCandidateDialog = screen.getByRole("dialog", { name: "赵新" });
    expect(
      within(createdCandidateDialog).getByText("当前节点：待部门确认"),
    ).toBeInTheDocument();
    expect(within(createdCandidateDialog).getByText("陈雨")).toBeInTheDocument();
    fireEvent.click(
      within(createdCandidateDialog).getByRole("button", { name: "zhao.pdf" }),
    );
    expect(
      screen.getByRole("dialog", { name: "候选人简历" }),
    ).toBeInTheDocument();
  });

  test("上传候选人时提示重复联系方式、人员信息和面试岗位，并二次确认关联主档", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));

    const jobRow = screen
      .getByText("短剧编剧")
      .closest(".platform-table__row");
    fireEvent.click(within(jobRow).getByRole("button", { name: "上传候选人" }));

    const candidateDialog = screen.getByRole("dialog", {
      name: "上传候选人并创建应聘记录",
    });
    fireEvent.change(
      within(candidateDialog).getByRole("textbox", { name: "候选人姓名 *" }),
      { target: { value: "周然" } },
    );
    fireEvent.change(
      within(candidateDialog).getByRole("textbox", { name: "手机号 *" }),
      { target: { value: "138****5621" } },
    );
    fireEvent.change(
      within(candidateDialog).getByRole("textbox", { name: "邮箱 *" }),
      { target: { value: "zhou.ran+new@example.com" } },
    );
    fireEvent.change(within(candidateDialog).getByLabelText("候选人简历"), {
      target: {
        files: [new File(["resume"], "zhou-ran-new.pdf", { type: "application/pdf" })],
      },
    });
    fireEvent.click(
      within(candidateDialog).getByRole("button", { name: "上传并进入待部门确认" }),
    );

    const duplicateDialog = screen.getByRole("dialog", {
      name: "发现重复候选人信息",
    });
    expect(within(duplicateDialog).getByText("周然")).toBeInTheDocument();
    expect(within(duplicateDialog).getByText("手机号重复")).toBeInTheDocument();
    expect(within(duplicateDialog).getByText("138****5621")).toBeInTheDocument();
    expect(within(duplicateDialog).getByText("zhou.ran@example.com")).toBeInTheDocument();
    expect(within(duplicateDialog).getByText("面试岗位")).toBeInTheDocument();
    expect(
      within(duplicateDialog).getAllByText(/短剧编剧/).length,
    ).toBeGreaterThan(0);

    fireEvent.click(
      within(duplicateDialog).getByRole("button", { name: "返回修改" }),
    );
    expect(screen.queryByRole("dialog", { name: "发现重复候选人信息" })).toBeNull();
    expect(
      screen.getByRole("dialog", { name: "上传候选人并创建应聘记录" }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(candidateDialog).getByRole("button", { name: "上传并进入待部门确认" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "发现重复候选人信息" })).getByRole(
        "button",
        { name: "确认继续上传" },
      ),
    );

    const linkedCandidateDialog = screen.getByRole("dialog", { name: "周然" });
    expect(within(linkedCandidateDialog).getByText("当前节点：待部门确认")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "简历库 / 候选人4" })).toBeInTheDocument();
  });

  test("选题库不提供立项操作且剧本库可跳转项目管理完成立项", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));
    const topicRow = screen
      .getByText("《无声档案》")
      .closest(".platform-topic-table__row");
    expect(within(topicRow).queryByRole("button", { name: "立项" })).not.toBeInTheDocument();
    expect(
      within(topicRow).getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["编辑", "评估"]);

    fireEvent.click(screen.getByRole("button", { name: "剧本库" }));

    expect(screen.getByRole("heading", { name: "剧本库" })).toBeInTheDocument();
    const scriptRow = screen
      .getByText("《无声档案》")
      .closest(".platform-script-table__row");
    expect(scriptRow).toHaveTextContent("无声档案-第12集-修订稿.docx");
    fireEvent.click(within(scriptRow).getByRole("button", { name: "立项" }));

    const projectDialog = screen.getByRole("dialog", { name: "新建项目" });
    expect(within(projectDialog).getByLabelText("项目名称")).toHaveValue("《无声档案》");
    expect(within(projectDialog).getByLabelText("集数")).toHaveValue(60);
    expect(within(projectDialog).getByText("剧本库已关联")).toBeInTheDocument();
    expect(within(projectDialog).getByText("无声档案-第12集-修订稿.docx")).toBeInTheDocument();
    fireEvent.click(within(projectDialog).getByRole("button", { name: "确认立项" }));

    const createdRow = screen
      .getAllByText("《无声档案》")
      .map((element) => element.closest(".platform-production-table__row"))
      .find(Boolean);
    expect(createdRow).toHaveTextContent(/PRJ-\d{8}-\d{4}/);
    expect(createdRow).toHaveTextContent("选题库");

    fireEvent.click(screen.getByRole("button", { name: "选题库" }));
    const evaluatedRow = screen
      .getByText("《无声档案》")
      .closest(".platform-topic-table__row");
    expect(evaluatedRow).toHaveTextContent("已评估");
    expect(evaluatedRow).not.toHaveTextContent("已转项目");
  });

  test("选题状态仅保留待评估已评估未通过且评估通过后自动进入剧本库", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));

    const statusTabs = screen.getByRole("tablist", { name: "选题状态筛选" });
    expect(
      within(statusTabs)
        .getAllByRole("tab")
        .map((tab) => tab.textContent.replace(/\d+/g, "")),
    ).toEqual(["全部", "待评估", "已评估", "未通过"]);
    expect(within(statusTabs).queryByText("已转项目")).not.toBeInTheDocument();

    const pendingRow = screen
      .getByText("《夏日回响》")
      .closest(".platform-topic-table__row");
    fireEvent.click(within(pendingRow).getByRole("button", { name: "评估" }));
    const reviewDialog = screen.getByRole("dialog", { name: "《夏日回响》" });
    fireEvent.click(within(reviewDialog).getByRole("button", { name: "评估通过" }));

    expect(pendingRow).toHaveTextContent("已评估");
    fireEvent.click(screen.getByRole("button", { name: "剧本库" }));
    expect(
      screen.getByText("《夏日回响》").closest(".platform-script-table__row"),
    ).not.toBeNull();
  });

  test("剧本库仅接收 DOCX 并在确认前按集拆分预览", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "剧本库" }));
    const scriptRow = screen
      .getByText("《无声档案》")
      .closest(".platform-script-table__row");
    fireEvent.click(within(scriptRow).getByRole("button", { name: "更新" }));

    const uploadDrawer = screen.getByRole("dialog", { name: "上传与管理剧本" });
    const file = new File([
      "第8集：追踪\n第8集正文\n第9集：线索\n第9集正文\n第10集：交锋\n第10集正文\n第11集：转折\n第11集正文\n第12集：证词\n第12集正文",
    ], "无声档案-第8至12集.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.change(within(uploadDrawer).getByLabelText("上传剧本文件"), {
      target: { files: [file] },
    });

    expect(await within(uploadDrawer).findByText("拆分预览")).toBeInTheDocument();
    expect(within(uploadDrawer).getByText("识别 5 集 · 规则识别 · 0 处异常")).toBeInTheDocument();
    const confirm = within(uploadDrawer).getByRole("button", { name: "确认并立即生效" });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(within(uploadDrawer).getByText(/拆分内容已立即生效/)).toBeInTheDocument();

    fireEvent.click(within(uploadDrawer).getByRole("button", { name: "完成" }));
    fireEvent.click(within(scriptRow).getByRole("button", { name: "版本" }));
    const history = screen.getByRole("dialog", { name: "剧本版本记录" });
    expect(within(history).getByText("无声档案-第8至12集.docx")).toBeInTheDocument();
  });

  test("项目立项表单替换剧本后同步生成剧本库新版本", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "剧本库" }));
    const scriptRow = screen
      .getByText("《无声档案》")
      .closest(".platform-script-table__row");
    fireEvent.click(within(scriptRow).getByRole("button", { name: "立项" }));

    const projectDialog = screen.getByRole("dialog", { name: "新建项目" });
    const replacement = new File(["shared script"], "无声档案-立项终稿.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.change(within(projectDialog).getByLabelText("上传剧本"), {
      target: { files: [replacement] },
    });
    expect(within(projectDialog).getByText("无声档案-立项终稿.docx")).toBeInTheDocument();
    fireEvent.click(within(projectDialog).getByRole("button", { name: "确认立项" }));

    fireEvent.click(screen.getByRole("button", { name: "剧本库" }));
    const linkedRow = screen
      .getByText("《无声档案》")
      .closest(".platform-script-table__row");
    expect(linkedRow).toHaveTextContent("无声档案-立项终稿.docx");
    expect(linkedRow).toHaveTextContent("已立项");
    fireEvent.click(within(linkedRow).getByRole("button", { name: "版本" }));
    const history = screen.getByRole("dialog", { name: "剧本版本记录" });
    expect(within(history).getByText("无声档案-立项终稿.docx")).toBeInTheDocument();
    expect(within(history).getByText("V03")).toBeInTheDocument();
  });

  test("选题库表格合并提交与审核信息并为长项目编码预留独立列", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));

    expect(
      screen.queryByRole("tablist", { name: "选题管理视图" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".platform-topic-table")).toHaveClass(
      "platform-table--single-line",
    );

    const returnedRow = screen
      .getByText("《十分钟便利店》")
      .closest(".platform-topic-table__row");
    expect(returnedRow).not.toBeNull();
    expect(
      returnedRow.querySelector(".platform-topic-table__submission"),
    ).toHaveTextContent("沈婉瑶");
    expect(returnedRow).not.toHaveTextContent(/版本 V\d+/);
    expect(
      returnedRow.querySelector(".platform-topic-table__review"),
    ).toHaveTextContent("未通过评估人 · 林制作");
    expect(within(returnedRow).getByRole("button", { name: "编辑" })).toBeEnabled();
    expect(within(returnedRow).getByRole("button", { name: "评估" })).toBeEnabled();
    expect(within(returnedRow).queryByRole("button", { name: "立项" })).not.toBeInTheDocument();

    const linkedRow = screen
      .getByText("《谁说炒菜的不算英雄》")
      .closest(".platform-topic-table__row");
    const projectLink = linkedRow.querySelector(
      ".platform-topic-table__project-link",
    );
    expect(projectLink).toHaveAttribute("title", expect.stringMatching(/^PRJ-/));
    expect(linkedRow.querySelector(".platform-topic-table__updated")).toHaveTextContent(
      "2026-07-13 18:06",
    );
    expect(linkedRow.querySelector(".platform-topic-table__created")).toHaveTextContent(
      "2026-06-28 15:32",
    );
  });

  test("编辑选题保存后直接回写台账且不生成版本", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));

    const topicRow = screen
      .getByText("《十分钟便利店》")
      .closest(".platform-topic-table__row");
    fireEvent.click(within(topicRow).getByRole("button", { name: "编辑" }));

    const editDialog = screen.getByRole("dialog", { name: "编辑选题" });
    fireEvent.change(within(editDialog).getByLabelText("编辑选题摘要"), {
      target: { value: "更新后的便利店选题摘要。" },
    });
    fireEvent.change(within(editDialog).getByLabelText("上传选题附件"), {
      target: {
        files: [new File(["edited"], "edited-topic.pdf", { type: "application/pdf" })],
      },
    });
    expect(within(editDialog).getByText("edited-topic.pdf")).toBeInTheDocument();
    fireEvent.click(within(editDialog).getByRole("button", { name: "保存修改" }));

    expect(topicRow).toHaveTextContent("更新后的便利店选题摘要。");
    expect(topicRow).not.toHaveTextContent(/版本 V\d+/);
    expect(topicRow).toHaveTextContent("未通过");
    fireEvent.click(within(topicRow).getByRole("button", { name: "编辑" }));
    expect(
      within(screen.getByRole("dialog", { name: "编辑选题" })).getByText(
        "edited-topic.pdf",
      ),
    ).toBeInTheDocument();
  });

  test("新建选题可指定评估人、上传附件并在详情中查看预览", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));
    fireEvent.click(screen.getByRole("button", { name: "新建选题" }));

    const createDialog = screen.getByRole("dialog", { name: "新建选题" });
    expect(within(createDialog).queryByLabelText("模板")).toBeNull();
    fireEvent.change(within(createDialog).getByLabelText("选题名称"), {
      target: { value: "《附件选题》" },
    });
    fireEvent.change(within(createDialog).getByLabelText("题材类型"), {
      target: { value: "都市剧情" },
    });
    fireEvent.change(within(createDialog).getByLabelText("目标受众"), {
      target: { value: "青年用户" },
    });
    fireEvent.change(within(createDialog).getByLabelText("评估人"), {
      target: { value: "林制作" },
    });
    fireEvent.change(within(createDialog).getByLabelText("选题摘要"), {
      target: { value: "用于验证选题附件创建与预览链路。" },
    });
    const attachment = new File(["topic attachment"], "topic-brief.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(within(createDialog).getByLabelText("上传选题附件"), {
      target: { files: [attachment] },
    });
    expect(within(createDialog).getByText("topic-brief.pdf")).toBeInTheDocument();
    fireEvent.click(within(createDialog).getByRole("button", { name: "提交选题" }));

    const createdRow = screen
      .getByText("《附件选题》")
      .closest(".platform-topic-table__row");
    expect(createdRow).toHaveTextContent("评估人 · 林制作");
    expect(createdRow).toHaveTextContent("用于验证选题附件创建与预览链路。");
    fireEvent.click(within(createdRow).getByRole("button", { name: "评估" }));

    const detailDialog = screen.getByRole("dialog", { name: "《附件选题》" });
    expect(within(detailDialog).getByText("选题摘要")).toBeInTheDocument();
    expect(
      within(detailDialog).getByText("用于验证选题附件创建与预览链路。"),
    ).toBeInTheDocument();
    expect(within(detailDialog).getByText("topic-brief.pdf")).toBeInTheDocument();
    expect(within(detailDialog).getByText(/PDF 文件/)).toBeInTheDocument();
    fireEvent.click(
      within(detailDialog).getByRole("button", { name: "查看 / 预览附件" }),
    );

    const previewDialog = screen.getByRole("dialog", { name: "选题附件" });
    expect(within(previewDialog).getAllByText("topic-brief.pdf").length).toBeGreaterThan(0);
    expect(within(previewDialog).getByText("PDF 文件")).toBeInTheDocument();
  });

  test("长选题摘要支持字数统计并在详情中展开和收起", () => {
    const longSummary = `第一段：用于说明选题背景与核心创意。\n\n第二段：${"补充人物关系、故事方向与制作建议。".repeat(16)}`;
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));
    fireEvent.click(screen.getByRole("button", { name: "新建选题" }));

    const createDialog = screen.getByRole("dialog", { name: "新建选题" });
    fireEvent.change(within(createDialog).getByLabelText("选题名称"), {
      target: { value: "《长摘要选题》" },
    });
    fireEvent.change(within(createDialog).getByLabelText("选题摘要"), {
      target: { value: longSummary },
    });
    expect(
      within(createDialog).getByText(`${longSummary.length}/5000 字`),
    ).toBeInTheDocument();
    fireEvent.click(within(createDialog).getByRole("button", { name: "提交选题" }));

    const createdRow = screen
      .getByText("《长摘要选题》")
      .closest(".platform-topic-table__row");
    expect(createdRow.querySelector(".platform-topic-table__summary")).toHaveAttribute(
      "title",
      longSummary,
    );
    fireEvent.click(within(createdRow).getByRole("button", { name: "评估" }));

    const detailDialog = screen.getByRole("dialog", { name: "《长摘要选题》" });
    const toggle = within(detailDialog).getByRole("button", {
      name: "展开完整摘要",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(
      within(detailDialog).getByRole("button", { name: "收起摘要" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("外部制作立项时将内部环节切换为必填合同上传", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "剧本库" }));
    const scriptRow = screen
      .getByText("《无声档案》")
      .closest(".platform-script-table__row");
    fireEvent.click(within(scriptRow).getByRole("button", { name: "立项" }));

    const dialog = screen.getByRole("dialog", { name: "新建项目" });
    fireEvent.change(within(dialog).getByLabelText("制作方式"), {
      target: { value: "外部制作" },
    });

    expect(within(dialog).queryByText("内部启用环节")).toBeNull();
    expect(within(dialog).getByText("上传合同")).toBeInTheDocument();
    expect(within(dialog).getByText("外部制作仅需配置制片")).toBeInTheDocument();
    expect(
      within(dialog).getByText("制片", {
        selector: ".platform-project-role-card > header > strong",
      }),
    ).toBeInTheDocument();
    ["编剧", "制作", "剪辑"].forEach((role) => {
      expect(
        within(dialog).queryByText(role, {
          selector: ".platform-project-role-card > header > strong",
        }),
      ).toBeNull();
    });
    const createButton = within(dialog).getByRole("button", {
      name: "确认立项",
    });
    expect(createButton).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText("外部承制方公司名"), {
      target: { value: "云帆传媒" },
    });
    expect(within(dialog).getByLabelText("外部承制方对应账号")).toHaveValue(
      "YF-CZ-002",
    );
    expect(within(dialog).getByLabelText("外部承制方对应账号")).toHaveAttribute(
      "readonly",
    );
    fireEvent.change(within(dialog).getByLabelText("外部承制方联系人"), {
      target: { value: "周岚" },
    });
    fireEvent.change(within(dialog).getByLabelText("外部承制方联系方式"), {
      target: { value: "zhou.lan@yunfan.example" },
    });
    expect(within(dialog).getByText("剧本共享范围")).toBeInTheDocument();
    expect(within(dialog).getByText("立项前必须明确共享范围")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByLabelText("共享全部剧本"));

    const contract = new File(["contract"], "external-contract.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(within(dialog).getByLabelText("上传合同"), {
      target: { files: [contract] },
    });

    expect(within(dialog).getByText("external-contract.pdf")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "查看合同" }));
    const draftPreview = screen.getByRole("dialog", { name: "制作合同" });
    expect(within(draftPreview).getByText("external-contract.pdf")).toBeInTheDocument();
    expect(within(draftPreview).getByText("PDF 合同")).toBeInTheDocument();
    fireEvent.click(within(draftPreview).getByRole("button", { name: "完成查看" }));

    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);
    const projectRow = screen
      .getAllByText("《无声档案》")
      .map((element) => element.closest(".platform-production-table__row"))
      .find((row) => row?.textContent.includes("外部制作"));
    const projectId = projectRow.children[1].textContent;
    fireEvent.click(within(projectRow).getByRole("button", { name: "详情" }));
    const projectDialog = screen.getByRole("dialog", { name: "《无声档案》" });
    expect(within(projectDialog).getByText("合同已归档")).toBeInTheDocument();
    expect(within(projectDialog).getByText("external-contract.pdf")).toBeInTheDocument();
    expect(within(projectDialog).getByText("云帆传媒")).toBeInTheDocument();
    expect(within(projectDialog).getByText("YF-CZ-002")).toBeInTheDocument();
    expect(within(projectDialog).getByText("周岚")).toBeInTheDocument();
    expect(within(projectDialog).getByText("zhou.lan@yunfan.example")).toBeInTheDocument();
    expect(within(projectDialog).getByText("全部剧本 · 第 1–60 集")).toBeInTheDocument();
    fireEvent.click(
      within(projectDialog).getByRole("button", {
        name: "查看全部内容编码",
      }),
    );
    const contentPreview = screen.getByRole("dialog", {
      name: "内容编码全部预览",
    });
    expect(within(contentPreview).getByText(`${projectId}-SC-0001`)).toBeInTheDocument();
    expect(
      within(contentPreview).getByText(`${projectId}-VD-0001`),
    ).toBeInTheDocument();
    expect(within(contentPreview).queryByText(`${projectId}-SC-0001-V01`)).toBeNull();
    expect(within(contentPreview).queryByText("版本编码")).toBeNull();
    expect(within(contentPreview).queryByText("当前状态")).toBeNull();
    fireEvent.click(within(contentPreview).getByRole("button", { name: "完成查看" }));
    expect(within(projectDialog).queryByText("新增剧本")).toBeNull();
    expect(within(projectDialog).queryByText("新增视频")).toBeNull();
    expect(within(projectDialog).queryByText("生成新版本")).toBeNull();
    expect(
      within(projectDialog).queryByRole("button", {
        name: /为 .*?-VD-\d+ 生成新版本/,
      }),
    ).toBeNull();
    fireEvent.click(
      within(projectDialog).getByRole("button", { name: "查看合同" }),
    );
    expect(screen.getByRole("dialog", { name: "制作合同" })).toBeInTheDocument();
  });

  test("独立创建外部项目同样要求合同并支持上传后查看", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));
    fireEvent.click(screen.getByRole("button", { name: "新建项目" }));

    const dialog = screen.getByRole("dialog", { name: "新建项目" });
    fireEvent.change(within(dialog).getByLabelText("项目名称"), {
      target: { value: "《外部测试项目》" },
    });
    fireEvent.change(within(dialog).getByLabelText("制作方式"), {
      target: { value: "外部制作" },
    });
    const createButton = within(dialog).getByRole("button", { name: "确认立项" });
    expect(within(dialog).getByText("上传合同")).toBeInTheDocument();
    expect(createButton).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText("外部承制方公司名"), {
      target: { value: "拾光影视" },
    });
    fireEvent.change(within(dialog).getByLabelText("外部承制方联系人"), {
      target: { value: "陈辰" },
    });
    fireEvent.change(within(dialog).getByLabelText("外部承制方联系方式"), {
      target: { value: "13900001234" },
    });
    fireEvent.click(within(dialog).getByLabelText("共享指定一卡"));
    expect(within(dialog).getByLabelText("选择共享的一卡")).toBeInTheDocument();
    expect(createButton).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("选择共享的一卡"), {
      target: { value: "1" },
    });

    fireEvent.change(within(dialog).getByLabelText("上传合同"), {
      target: {
        files: [
          new File(["contract"], "standalone-contract.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        ],
      },
    });
    expect(createButton).toBeEnabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "查看合同" }));
    const preview = screen.getByRole("dialog", { name: "制作合同" });
    expect(within(preview).getByText("standalone-contract.docx")).toBeInTheDocument();
    expect(within(preview).getByText("Word 合同")).toBeInTheDocument();
  });

  test("新建项目按立项设计展示预算、周期、岗位工期、审核人与剧本上传", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));
    fireEvent.click(screen.getByRole("button", { name: "新建项目" }));

    const dialog = screen.getByRole("dialog", { name: "新建项目" });
    expect(within(dialog).getByLabelText("集数")).toHaveValue(3);
    expect(within(dialog).getByLabelText("项目总预算")).toHaveValue(100000);
    expect(within(dialog).getByLabelText("每集预算")).toHaveValue("¥33333.33");
    expect(within(dialog).getByLabelText("预计开始时间")).toHaveValue("2026-07-21");
    expect(within(dialog).getByLabelText("预计完成时间")).toHaveValue("2026-08-31");
    ["编剧", "制作", "剪辑", "制片"].forEach((role) => {
      expect(within(dialog).getByText(role, { selector: ".platform-project-role-card > header > strong" })).toBeInTheDocument();
      expect(within(dialog).getByLabelText(`${role}人员1`)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(`${role}工期1`)).toBeInTheDocument();
    });

    fireEvent.click(within(dialog).getByLabelText("编剧是否审核"));
    fireEvent.change(within(dialog).getByLabelText("编剧审核人"), {
      target: { value: "江晚" },
    });
    expect(within(dialog).getByLabelText("编剧审核人")).toHaveValue("江晚");

    fireEvent.change(within(dialog).getByLabelText("上传剧本"), {
      target: {
        files: [new File(["script"], "project-script.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })],
      },
    });
    expect(within(dialog).getByText("project-script.docx")).toBeInTheDocument();
  });

  test("项目详情保持只读，点击编辑项目后打开同款完整表单并可保存", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));
    openRowDetails("《谁说炒菜的不算英雄》");

    const detailDialog = screen.getByRole("dialog", { name: "《谁说炒菜的不算英雄》" });
    expect(within(detailDialog).queryByLabelText("项目名称")).toBeNull();
    expect(within(detailDialog).getByRole("heading", { name: "参与人员及对应工期" })).toBeInTheDocument();
    expect(within(detailDialog).getAllByText("第 1–40 集")).toHaveLength(4);
    expect(within(detailDialog).getByText("默认前 3 集")).toBeInTheDocument();
    expect(within(detailDialog).getByText("PRJ-20260518-0001-SC-0003")).toBeInTheDocument();
    expect(within(detailDialog).queryByText("PRJ-20260518-0001-SC-0004")).toBeNull();
    fireEvent.click(within(detailDialog).getByRole("button", { name: "查看全部内容编码" }));
    const contentPreview = screen.getByRole("dialog", { name: "内容编码全部预览" });
    expect(within(contentPreview).getByText("PRJ-20260518-0001-SC-0040")).toBeInTheDocument();
    expect(within(contentPreview).queryByText("版本编码")).toBeNull();
    fireEvent.click(within(contentPreview).getByRole("button", { name: "完成查看" }));
    expect(within(detailDialog).getByRole("button", { name: "编辑项目" })).toBeInTheDocument();
    fireEvent.click(within(detailDialog).getByRole("button", { name: "编辑项目" }));

    const editDialog = screen.getByRole("dialog", { name: "编辑项目" });
    expect(within(editDialog).getByLabelText("项目名称")).toHaveValue("《谁说炒菜的不算英雄》");
    expect(within(editDialog).getByLabelText("集数")).toHaveValue(40);
    expect(within(editDialog).getByLabelText("项目总预算")).toHaveValue(260000);
    expect(within(editDialog).getByLabelText("编剧人员1")).toHaveValue("张小北");
    fireEvent.change(within(editDialog).getByLabelText("项目名称"), {
      target: { value: "《谁说炒菜的都是英雄》" },
    });
    fireEvent.click(within(editDialog).getByRole("button", { name: "保存修改" }));

    expect(screen.getByText("《谁说炒菜的都是英雄》")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("项目信息已更新");
  });

  test("内部项目按启用环节算术平均展示整体进度", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));
    openRowDetails("《谁说炒菜的不算英雄》");

    const dialog = screen.getByRole("dialog", { name: "《谁说炒菜的不算英雄》" });
    expect(
      within(dialog).getByText("40% + 60% + 80% ÷ 3 = 60%"),
    ).toBeInTheDocument();
    expect(within(dialog).getAllByText("制作").length).toBeGreaterThan(0);
    expect(within(dialog).queryByText("视频")).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "进度 +10%" })).toBeNull();
    expect(within(dialog).getByText(/环节进度由系统根据任务完成情况自动同步/)).toBeInTheDocument();
    expect(within(dialog).getByText("延期")).toBeInTheDocument();
  });

  test("外部制作项目不展示或汇总进度，仅展示开始与预计完成时间", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));

    const projectRow = screen
      .getByText("《夏日回响》")
      .closest(".platform-production-table__row");
    expect(projectRow).toHaveTextContent("外部制作");
    expect(projectRow).toHaveTextContent("不统计");
    expect(projectRow.querySelector(".platform-progress")).toBeNull();

    fireEvent.click(within(projectRow).getByRole("button", { name: "详情" }));
    const dialog = screen.getByRole("dialog", { name: "《夏日回响》" });
    expect(within(dialog).getByText("2026-06-12")).toBeInTheDocument();
    expect(within(dialog).getByText("2026-08-18")).toBeInTheDocument();
    expect(within(dialog).queryByText("整体进度")).toBeNull();
    expect(within(dialog).queryByText("异常标记")).toBeNull();
    expect(within(dialog).queryByText(/外部整体进度/)).toBeNull();
    expect(dialog.querySelector(".platform-progress")).toBeNull();
    expect(within(dialog).getByText("XY-CZ-001")).toBeInTheDocument();
    expect(within(dialog).getByText("138 0571 6628")).toBeInTheDocument();
    expect(within(dialog).getByText("全部剧本 · 第 1–36 集")).toBeInTheDocument();
    expect(
      dialog.querySelectorAll(".platform-project-role-card > header > strong"),
    ).toHaveLength(1);
    expect(
      dialog.querySelector(".platform-project-role-card > header > strong"),
    ).toHaveTextContent("制片");
  });

  test("项目管理表格按指定字段顺序单行展示，并仅保留详情与删除操作", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));

    const projectRow = screen
      .getByText("《谁说炒菜的不算英雄》")
      .closest(".platform-production-table__row");
    expect(projectRow).not.toBeNull();
    expect(projectRow.closest(".platform-production-table")).toHaveClass(
      "platform-table--single-line",
    );
    const table = projectRow.closest(".platform-production-table");
    expect(
      Array.from(table.querySelectorAll(".platform-table__head span")).map(
        (item) => item.textContent,
      ),
    ).toEqual([
      "项目名称",
      "项目编号",
      "来源",
      "制作方式",
      "题材",
      "负责人",
      "状态",
      "集数",
      "预计完成时间",
      "整体进度",
      "成本执行",
      "操作",
    ]);
    expect(projectRow.children).toHaveLength(12);
    expect(projectRow).toHaveTextContent(
      "《谁说炒菜的不算英雄》PRJ-20260518-0001选题库内部制作现实题材沈婉瑶进行中40 集2026-08-0560%",
    );
    expect(
      projectRow.querySelector(".platform-production-table__cost"),
    ).toHaveTextContent("¥171,000/ ¥260,000 · 66%");
    expect(
      within(projectRow).getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["详情", "删除"]);
    expect(within(projectRow).queryByRole("button", { name: "人员配置" })).toBeNull();
  });

  test("项目删除需要二次确认，并从项目台账移除记录", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));

    const projectRow = screen
      .getByText("《谁说炒菜的不算英雄》")
      .closest(".platform-production-table__row");
    fireEvent.click(within(projectRow).getByRole("button", { name: "删除" }));

    const deleteDialog = screen.getByRole("dialog", { name: "删除项目" });
    expect(within(deleteDialog).getByText(/原选题仍保持已评估/)).toBeInTheDocument();
    fireEvent.click(within(deleteDialog).getByRole("button", { name: "确认删除" }));

    expect(screen.queryByText("《谁说炒菜的不算英雄》")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("关联选题保持已评估");
  });

  test("内部短剧成本录入会形成真实成本并同步经营驾驶舱", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目管理" }));
    openRowDetails("《谁说炒菜的不算英雄》");

    const dialog = screen.getByRole("dialog", { name: "《谁说炒菜的不算英雄》" });
    expect(within(dialog).queryByRole("spinbutton", { name: "人力成本" })).toBeNull();
    expect(within(dialog).getByText("详情页仅展示当前成本；点击底部“编辑项目”后可修改。")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "编辑项目" }));
    const editDialog = screen.getByRole("dialog", { name: "编辑项目" });
    fireEvent.change(
      within(editDialog).getByRole("spinbutton", { name: "编辑人力成本" }),
      { target: { value: "100000" } },
    );
    fireEvent.change(
      within(editDialog).getByRole("spinbutton", { name: "编辑算力成本" }),
      { target: { value: "60000" } },
    );
    fireEvent.change(
      within(editDialog).getByRole("spinbutton", { name: "编辑投流成本" }),
      { target: { value: "40000" } },
    );
    fireEvent.click(within(editDialog).getByRole("button", { name: "保存修改" }));

    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));
    expect(screen.getByText("内部短剧真实成本")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "内容项目" }));

    const costCard = screen
      .getByRole("heading", { name: "内部短剧真实成本构成" })
      .closest(".platform-card");
    expect(within(costCard).getByText("¥498,000")).toBeInTheDocument();
    expect(within(costCard).getByText("人力成本")).toBeInTheDocument();
    expect(within(costCard).getByText("算力成本")).toBeInTheDocument();
    expect(within(costCard).getByText("投流成本")).toBeInTheDocument();
  });
});
