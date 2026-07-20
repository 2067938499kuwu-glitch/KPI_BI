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
  test("项目立项可配置人员并进入任务执行列表", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "主导航" });
    const businessEntries = within(navigation)
      .getAllByRole("button")
      .map((button) => button.textContent.replace("›", ""));

    expect(businessEntries.indexOf("项目管理")).toBe(
      businessEntries.indexOf("选题库") + 1,
    );
    expect(businessEntries.indexOf("项目立项")).toBe(
      businessEntries.indexOf("项目管理") + 1,
    );
    expect(businessEntries.indexOf("任务列表")).toBe(
      businessEntries.indexOf("项目立项") + 1,
    );

    fireEvent.click(within(navigation).getByRole("button", { name: "项目立项" }));
    expect(within(navigation).getByRole("button", { name: "项目立项" })).toHaveClass(
      "is-active",
    );
    expect(
      screen.getByRole("heading", { name: "项目台账与人员分配" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "项目立项列表" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "人员配置" })[0]);
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
    expect(screen.getAllByText("《城市边缘》").length).toBeGreaterThan(0);
  });

  test("工作台移除下属进度并让待办与风险卡片使用同一等高布局", () => {
    render(<App />);

    const taskCard = screen
      .getByRole("heading", { name: "跨业务待办" })
      .closest(".platform-card");
    const riskCard = screen
      .getByRole("heading", { name: "业务风险提醒" })
      .closest(".platform-card");

    expect(taskCard).toHaveClass("platform-workbench-card");
    expect(riskCard).toHaveClass("platform-workbench-card");
    expect(document.querySelector(".platform-workbench-aside").children).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "下属进度" })).toBeNull();
    expect(screen.queryByText("仅展示当前数据范围")).toBeNull();
    expect(screen.queryByText("沈婉瑶")).toBeNull();
    expect(screen.queryByText("数据状态")).toBeNull();
    expect(screen.queryByRole("button", { name: "查看今日待办" })).toBeNull();
    expect(within(taskCard).queryByText(/优先级/)).toBeNull();
  });

  test("工作台任务弹窗展示当前任务的真实业务详情", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "今天需要你关注的业务" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /确认候选人是否进入面试/ }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "确认候选人是否进入面试",
    });
    expect(within(dialog).queryByText(/优先级/)).toBeNull();
    expect(within(dialog).getByRole("heading", { name: "周然" })).toBeInTheDocument();
    expect(within(dialog).getByText("本次任务要求")).toBeInTheDocument();
    expect(within(dialog).getByText("当前任务业务信息")).toBeInTheDocument();
    expect(within(dialog).getByText("短剧编剧")).toBeInTheDocument();
    expect(within(dialog).getByText("待部门确认")).toBeInTheDocument();
    expect(within(dialog).getByText("BOSS直聘")).toBeInTheDocument();
    expect(within(dialog).getByText("138****5621")).toBeInTheDocument();
    expect(within(dialog).getByText(/结合候选人资料与岗位要求/)).toBeInTheDocument();
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

  test("不同来源的工作台任务展示各自相关字段", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /修改《十分钟便利店》选题方案/ }),
    );
    let dialog = screen.getByRole("dialog", {
      name: "修改《十分钟便利店》选题方案",
    });
    expect(within(dialog).getByText("都市轻喜")).toBeInTheDocument();
    expect(within(dialog).getByText("18-35岁职场人")).toBeInTheDocument();
    expect(within(dialog).getByText("缺少成本与场景可行性说明")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "稍后处理" }));

    fireEvent.click(
      screen.getByRole("button", { name: /更新《城市边缘》延期节点/ }),
    );
    dialog = screen.getByRole("dialog", {
      name: "更新《城市边缘》延期节点",
    });
    expect(within(dialog).getByText("PRJ-20260518-0001")).toBeInTheDocument();
    expect(within(dialog).getByText("制作环节进度")).toBeInTheDocument();
    expect(within(dialog).getByText("剪辑一审")).toBeInTheDocument();
    expect(within(dialog).getByText("延期")).toBeInTheDocument();
  });

  test("工作台完整展示五类任务入口以及绩效和周报专属详情", () => {
    render(<App />);

    ["绩效任务", "招聘任务", "选题任务", "项目任务", "周报任务"].forEach((label) => {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}`) })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "陈组长 · 待一级领导评分" }));
    let dialog = screen.getByRole("dialog", { name: "陈组长 · 待一级领导评分" });
    expect(within(dialog).getByText("绩效任务对象")).toBeInTheDocument();
    expect(within(dialog).getByText("任务数据摘要")).toBeInTheDocument();
    expect(within(dialog).getByText("组内任务")).toBeInTheDocument();
    expect(within(dialog).getByText("任务流转信息")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "稍后处理" }));

    fireEvent.click(screen.getByRole("button", { name: /^周报任务/ }));
    fireEvent.click(screen.getByRole("button", { name: "许投流 · 提交2026年W30周报" }));
    dialog = screen.getByRole("dialog", { name: "许投流 · 提交2026年W30周报" });
    expect(within(dialog).getByText("周报内容结构")).toBeInTheDocument();
    expect(within(dialog).getByText("本周成果")).toBeInTheDocument();
    expect(within(dialog).getByText("风险与问题")).toBeInTheDocument();
    expect(within(dialog).getByText("下周计划")).toBeInTheDocument();
    expect(within(dialog).getByText("2026-07-20 至 2026-07-26")).toBeInTheDocument();
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
    expect(screen.getAllByText("为《无声档案》创建项目").length).toBeGreaterThan(0);
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
    expect(screen.queryByText("数据状态")).toBeNull();
    expect(screen.queryByRole("button", { name: "指标口径" })).toBeNull();
    expect(screen.queryByRole("button", { name: "按权限导出" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "人员负荷" })).toBeNull();
    expect(screen.queryByText("审计异常")).toBeNull();
    expect(document.querySelectorAll(".platform-metrics > button")).toHaveLength(7);
    expect(screen.queryByText("人员逾期任务")).toBeNull();

    const healthCard = screen
      .getByRole("heading", { name: "内容与项目健康度" })
      .closest(".platform-card");
    ["剧本", "制作", "剪辑", "成片"].forEach((stage) => {
      expect(within(healthCard).getByText(stage)).toBeInTheDocument();
    });
    expect(within(healthCard).queryByText("视频")).toBeNull();
    expect(within(healthCard).queryByText("配音")).toBeNull();
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

  test("内容项目展示项目总览并将运营数据定位到对应项目", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));
    fireEvent.click(screen.getByRole("tab", { name: "内容项目" }));

    expect(screen.getByText("项目总数")).toBeInTheDocument();
    expect(screen.getByText("内部 / 外部制作")).toBeInTheDocument();
    expect(screen.getByText("运营数据归属率")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "项目总览台账" }),
    ).toBeInTheDocument();

    const ledger = screen
      .getByRole("heading", { name: "项目总览台账" })
      .closest(".platform-card");
    expect(ledger.querySelectorAll(".platform-project-ledger-row")).toHaveLength(4);
    expect(within(ledger).getByText("《城市边缘》")).toBeInTheDocument();
    expect(within(ledger).getByText("《夏日回响》")).toBeInTheDocument();
    expect(within(ledger).getByText("2026-05-18")).toBeInTheDocument();
    expect(within(ledger).getByText("2026-08-05")).toBeInTheDocument();
    expect(within(ledger).getByText("¥171,000")).toBeInTheDocument();
    expect(
      within(ledger).getAllByText("内容中心 · AI制作中心 · 剪辑中心"),
    ).toHaveLength(2);

    const cityRow = within(ledger)
      .getByText("《城市边缘》")
      .closest(".platform-project-ledger-row");
    fireEvent.click(within(cityRow).getByRole("button", { name: /已归属 2 条/ }));

    const dialog = screen.getByRole("dialog", { name: "《城市边缘》" });
    expect(within(dialog).getByText("项目人员消耗金额")).toBeInTheDocument();
    expect(within(dialog).getAllByText("¥82,000").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("运营上传数据")).toBeInTheDocument();
    expect(within(dialog).getByText(/项目编号 PRJ-20260518-0001/)).toBeInTheDocument();
    expect(within(dialog).getByText(/投流日报 · 抖音/)).toBeInTheDocument();
    expect(within(dialog).getByText(/素材表现 · 抖音 \/ 快手/)).toBeInTheDocument();
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

  test("选题审核通过后由立项动作创建唯一项目并回写关联", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));
    fireEvent.click(screen.getByRole("tab", { name: /审核与立项/ }));
    openRowDetails("《无声档案》");

    const dialog = screen.getByRole("dialog", { name: "《无声档案》" });
    expect(within(dialog).getByText("尚未立项")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "选为项目" }));
    expect(within(dialog).getByLabelText("剧本集数")).toHaveValue(3);
    expect(within(dialog).getByLabelText("视频集数")).toHaveValue(3);
    expect(
      within(dialog.querySelector(".platform-drawer__body")).queryByRole(
        "button",
        { name: "创建唯一项目并回写关联" },
      ),
    ).toBeNull();
    expect(
      within(dialog.querySelector("footer")).getByRole("button", {
        name: "创建唯一项目并回写关联",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "创建唯一项目并回写关联" }),
    );

    expect(within(dialog).getAllByText("已转项目").length).toBeGreaterThan(0);
    expect(
      within(dialog).getByText(/^PRJ-\d{8}-\d{4}$/),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "创建唯一项目并回写关联" }),
    ).toBeNull();
  });

  test("选题库表格合并提交与审核信息并为长项目编码预留独立列", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));

    const returnedRow = screen
      .getByText("《十分钟便利店》")
      .closest(".platform-topic-table__row");
    expect(returnedRow).not.toBeNull();
    expect(
      returnedRow.querySelector(".platform-topic-table__submission"),
    ).toHaveTextContent("沈婉瑶版本 V2");
    expect(
      returnedRow.querySelector(".platform-topic-table__review"),
    ).toHaveTextContent("已退回审核人 · 林制作");

    const linkedRow = screen
      .getByText("《城市边缘》")
      .closest(".platform-topic-table__row");
    const projectLink = linkedRow.querySelector(
      ".platform-topic-table__project-link",
    );
    expect(projectLink).toHaveAttribute("title", expect.stringMatching(/^PRJ-/));
    expect(linkedRow.querySelector(".platform-topic-table__updated")).toHaveTextContent(
      "2026-07-13 18:06",
    );
  });

  test("新建选题可指定审核人、上传附件并在详情中查看预览", () => {
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
    fireEvent.change(within(createDialog).getByLabelText("审核人"), {
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
    expect(createdRow).toHaveTextContent("审核人 · 林制作");
    expect(createdRow).toHaveTextContent("用于验证选题附件创建与预览链路。");
    fireEvent.click(within(createdRow).getByRole("button", { name: "详情" }));

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
    fireEvent.click(within(createdRow).getByRole("button", { name: "详情" }));

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
    fireEvent.click(screen.getByRole("button", { name: "选题库" }));
    fireEvent.click(screen.getByRole("tab", { name: /审核与立项/ }));
    openRowDetails("《无声档案》");

    const dialog = screen.getByRole("dialog", { name: "《无声档案》" });
    fireEvent.click(within(dialog).getByRole("button", { name: "选为项目" }));
    fireEvent.change(within(dialog).getByLabelText("制作方式"), {
      target: { value: "外部制作" },
    });

    expect(within(dialog).queryByText("内部启用环节")).toBeNull();
    expect(within(dialog).getByText("上传合同")).toBeInTheDocument();
    const createButton = within(dialog).getByRole("button", {
      name: "创建唯一项目并回写关联",
    });
    expect(createButton).toBeDisabled();

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
    expect(within(dialog).getAllByText("已转项目").length).toBeGreaterThan(0);
    const projectId = within(dialog).getByText(/^PRJ-\d{8}-\d{4}$/).textContent;
    fireEvent.click(
      within(dialog).getByRole("button", { name: "查看关联项目" }),
    );

    const projectRow = screen.getByText(projectId).closest(".platform-table__row");
    fireEvent.click(within(projectRow).getByRole("button", { name: "详情" }));
    const projectDialog = screen.getByRole("dialog", { name: "《无声档案》" });
    expect(within(projectDialog).getByText("合同已归档")).toBeInTheDocument();
    expect(within(projectDialog).getByText("external-contract.pdf")).toBeInTheDocument();
    fireEvent.click(
      within(projectDialog).getByRole("button", {
        name: "查看全部剧本编码",
      }),
    );
    const scriptPreview = screen.getByRole("dialog", {
      name: "剧本编码全部预览",
    });
    expect(within(scriptPreview).getByText(`${projectId}-SC-0001`)).toBeInTheDocument();
    expect(
      within(scriptPreview).getByText(`${projectId}-SC-0001-V01`),
    ).toBeInTheDocument();
    expect(within(scriptPreview).queryByText("当前状态")).toBeNull();
    fireEvent.click(within(scriptPreview).getByRole("button", { name: "完成查看" }));
    fireEvent.click(
      within(projectDialog).getByRole("button", {
        name: "查看全部视频编码",
      }),
    );
    const videoPreview = screen.getByRole("dialog", {
      name: "视频编码全部预览",
    });
    expect(within(videoPreview).getByText(`${projectId}-VD-0001`)).toBeInTheDocument();
    fireEvent.click(within(videoPreview).getByRole("button", { name: "完成查看" }));
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
    fireEvent.click(screen.getByRole("button", { name: "项目总览" }));
    fireEvent.click(screen.getByRole("button", { name: "新建项目" }));

    const dialog = screen.getByRole("dialog", { name: "新建项目" });
    fireEvent.change(within(dialog).getByLabelText("项目名称"), {
      target: { value: "《外部测试项目》" },
    });
    fireEvent.change(within(dialog).getByLabelText("制作方式"), {
      target: { value: "外部制作" },
    });
    const createButton = within(dialog).getByRole("button", { name: "创建项目" });
    expect(within(dialog).getByText("上传合同")).toBeInTheDocument();
    expect(createButton).toBeDisabled();

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

  test("内部项目按启用环节算术平均展示整体进度", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目总览" }));
    openRowDetails("《城市边缘》");

    const dialog = screen.getByRole("dialog", { name: "《城市边缘》" });
    expect(
      within(dialog).getByText("40% + 60% + 80% ÷ 3 = 60%"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("制作")).toBeInTheDocument();
    expect(within(dialog).queryByText("视频")).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "进度 +10%" })).toBeNull();
    expect(within(dialog).getByText(/环节进度由系统根据任务完成情况自动同步/)).toBeInTheDocument();
    expect(within(dialog).getByText("延期")).toBeInTheDocument();
  });

  test("项目制作表格合并来源、负责人和计划信息并保持成本独立展示", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目总览" }));

    const projectRow = screen
      .getByText("《城市边缘》")
      .closest(".platform-production-table__row");
    expect(projectRow).not.toBeNull();
    expect(projectRow.children).toHaveLength(8);
    expect(
      projectRow.querySelector(".platform-production-table__source"),
    ).toHaveTextContent("TOPIC-018内部制作");
    expect(
      projectRow.querySelector(".platform-production-table__owner"),
    ).toHaveTextContent("沈婉瑶进行中");
    expect(
      projectRow.querySelector(".platform-production-table__schedule"),
    ).toHaveTextContent("2026-08-05下一里程碑 · 剪辑一审");
    expect(
      projectRow.querySelector(".platform-production-table__cost"),
    ).toHaveTextContent("¥171,000预算 ¥260,000");
  });

  test("内部短剧成本录入会形成真实成本并同步经营驾驶舱", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目总览" }));
    openRowDetails("《城市边缘》");

    const dialog = screen.getByRole("dialog", { name: "《城市边缘》" });
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: "人力成本" }),
      { target: { value: "100000" } },
    );
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: "算力成本" }),
      { target: { value: "60000" } },
    );
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: "投流成本" }),
      { target: { value: "40000" } },
    );

    expect(within(dialog).getAllByText("¥200,000").length).toBeGreaterThan(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭" }));

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
