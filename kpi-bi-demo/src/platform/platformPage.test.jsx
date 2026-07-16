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
  });

  test("工作台任务只能进入来源业务页面处理", () => {
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
    expect(
      within(dialog).getByText(/任务只能在来源业务页面完成/),
    ).toBeInTheDocument();
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
    expect(
      within(dialog).getByText(/招聘 · APP-021/),
    ).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "工作台" }));
    expect(screen.queryByText("确认候选人是否进入面试")).toBeNull();
  });

  test("切换角色后按权限更新导航与工作台待办范围", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("button", { name: /员工/ }));

    expect(screen.getByRole("button", { name: "工作台" })).toHaveClass(
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
    expect(within(dialog).getByText("运营上传数据")).toBeInTheDocument();
    expect(within(dialog).getByText(/projectId = PRJ-009/)).toBeInTheDocument();
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

    const submit = within(dialog).getByRole("button", {
      name: "确认结论并保留审计记录",
    });
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

  test("招聘可从部门确认连续推进到 Offer 待发", () => {
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
        name: /确认并推进至「已安排面试」/,
      }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "登记第 1/1 轮面试完成",
      }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: /确认并推进至「待面试反馈」/,
      }),
    );
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
        name: /确认并推进至「已安排面试」/,
      }),
    );
    expect(within(dialog).getByText("2026-07-18 10:30")).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "登记第 2/2 轮面试完成",
      }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: /确认并推进至「待面试反馈」/,
      }),
    );
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
    expect(within(dialog).getByText("ZY20260715")).toBeInTheDocument();
    expect(within(dialog).queryByText(/15\s*天/)).toBeNull();
  });

  test("SSC 建档消息可即时回写招聘人员的员工编号和到岗状态", () => {
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
    expect(within(dialog).getByText("ZY20260716")).toBeInTheDocument();
  });

  test("可新增岗位并上传候选人简历后创建待筛选应聘记录", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "招聘管理" }));
    fireEvent.click(screen.getByRole("button", { name: "新增岗位" }));
    const jobDialog = screen.getByRole("dialog", { name: "新增招聘岗位" });
    fireEvent.change(
      within(jobDialog).getByRole("combobox", { name: "所属部门 *" }),
      { target: { value: "经营管理部" } },
    );
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
      within(candidateDialog).getByRole("button", { name: "上传并进入待筛选" }),
    );

    const createdCandidateDialog = screen.getByRole("dialog", { name: "赵新" });
    expect(
      within(createdCandidateDialog).getByText("当前节点：待筛选"),
    ).toBeInTheDocument();
    fireEvent.click(
      within(createdCandidateDialog).getByRole("button", { name: "zhao.pdf" }),
    );
    expect(
      screen.getByRole("dialog", { name: "候选人简历" }),
    ).toBeInTheDocument();
  });

  test("选题审核通过后由立项动作创建唯一项目并回写关联", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题管理" }));
    fireEvent.click(screen.getByRole("tab", { name: /审核与立项/ }));
    openRowDetails("《无声档案》");

    const dialog = screen.getByRole("dialog", { name: "《无声档案》" });
    expect(within(dialog).getByText("尚未立项")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "选为项目" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "创建唯一项目并回写关联" }),
    );

    expect(within(dialog).getAllByText("已转项目").length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/^PRJ-\d{6}$/)).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "创建唯一项目并回写关联" }),
    ).toBeNull();
  });

  test("外部制作立项时将内部环节切换为必填合同上传", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选题管理" }));
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
    const projectId = within(dialog).getByText(/^PRJ-\d{6}$/).textContent;
    fireEvent.click(
      within(dialog).getByRole("button", { name: "查看关联项目" }),
    );

    const projectRow = screen.getByText(projectId).closest(".platform-table__row");
    fireEvent.click(within(projectRow).getByRole("button", { name: "详情" }));
    const projectDialog = screen.getByRole("dialog", { name: "《无声档案》" });
    expect(within(projectDialog).getByText("合同已归档")).toBeInTheDocument();
    expect(within(projectDialog).getByText("external-contract.pdf")).toBeInTheDocument();
    fireEvent.click(
      within(projectDialog).getByRole("button", { name: "查看合同" }),
    );
    expect(screen.getByRole("dialog", { name: "制作合同" })).toBeInTheDocument();
  });

  test("独立创建外部项目同样要求合同并支持上传后查看", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目制作" }));
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
    fireEvent.click(screen.getByRole("button", { name: "项目制作" }));
    openRowDetails("《城市边缘》");

    const dialog = screen.getByRole("dialog", { name: "《城市边缘》" });
    expect(
      within(dialog).getByText("40% + 60% + 80% ÷ 3 = 60%"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("延期")).toBeInTheDocument();
  });

  test("内部短剧成本录入会形成真实成本并同步经营驾驶舱", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目制作" }));
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
