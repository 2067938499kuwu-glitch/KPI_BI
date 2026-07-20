import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../App";
import { REVIEW_STATUS } from "./logic";

afterEach(cleanup);

function openPerformance() {
  fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));
}

function switchRole(name) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("绩效中心交互与权限", () => {
  test("一体化导航完整且默认进入工作台", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "统一工作台" })).toHaveClass("is-active");
    expect(screen.getByRole("button", { name: "经营驾驶舱" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "绩效中心" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "周报" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "招聘管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选题库" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "项目总览" })).toBeInTheDocument();
    expect(screen.getByText("SSC服务中心")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "组织架构与花名册" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "人事表格管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "人事模板管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "系统配置" })).toBeInTheDocument();
    const navigationLabels = within(screen.getByRole("navigation", { name: "主导航" })).getAllByRole("button").map((button) => button.textContent.trim());
    expect(navigationLabels.indexOf("成本与工时")).toBeGreaterThan(navigationLabels.indexOf("作品库"));
  });

  test("目录标题支持独立折叠与展开", () => {
    render(<App />);
    const navigation = screen.getByRole("navigation", { name: "主导航" });
    const contentGroup = within(navigation).getByRole("button", { name: "内容与项目" });

    expect(contentGroup).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(contentGroup);
    expect(contentGroup).toHaveAttribute("aria-expanded", "false");
    expect(within(navigation).queryByRole("button", { name: "选题库" })).toBeNull();
    expect(within(navigation).getByRole("button", { name: "统一工作台" })).toBeInTheDocument();

    const aiGroup = within(navigation).getByRole("button", { name: "AI与资源" });
    fireEvent.click(aiGroup);
    fireEvent.click(aiGroup);
    const resourceGroup = within(navigation).getByRole("button", { name: "资源中心" });
    expect(resourceGroup).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(resourceGroup);
    expect(resourceGroup).toHaveAttribute("aria-expanded", "false");
    expect(within(navigation).queryByRole("button", { name: "模型列表" })).toBeNull();
    expect(within(navigation).getByRole("button", { name: "智能体管理" })).toBeInTheDocument();

    fireEvent.click(contentGroup);
    const projectGroup = within(navigation).getByRole("button", { name: "项目管理" });
    expect(projectGroup).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(projectGroup);
    expect(projectGroup).toHaveAttribute("aria-expanded", "false");
    expect(within(navigation).queryByRole("button", { name: "项目立项" })).toBeNull();
    expect(within(navigation).getByRole("button", { name: "项目总览" })).toBeInTheDocument();
  });

  test.each(["成本与工时", "交付中心", "作品库"])(
    "%s 仅展示空白页面",
    (label) => {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: label }));
      const blankPage = screen.getByLabelText(label, { selector: ".blank-directory-page" });
      expect(blankPage).toBeEmptyDOMElement();
      expect(blankPage.closest(".content")).toHaveClass("content--blank-directory");
    },
  );

  test("模型列表按照参考页面展示完整数据", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "模型列表" }));

    expect(screen.getByPlaceholderText("输入模型名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加模型" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "模型列表" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(21);
    expect(screen.getAllByText("GPT-5", { selector: "td" })).toHaveLength(2);
    expect(screen.getByText("hailuo-02-pro")).toBeInTheDocument();
    expect(screen.getByText("共 36 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("模型列表", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("智能体管理按照参考页面展示画布与智能体", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "智能体管理" }));

    expect(screen.getByPlaceholderText("输入漫画名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建画布" })).toBeInTheDocument();
    const canvasTable = screen.getByRole("table", { name: "画布列表" });
    const agentTable = screen.getByRole("table", { name: "智能体列表" });
    expect(within(canvasTable).getAllByRole("row")).toHaveLength(2);
    expect(within(agentTable).getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("漫画主体拆分")).toBeInTheDocument();
    expect(screen.getAllByText("运镜智能体", { selector: "td" })).toHaveLength(2);
    expect(screen.getAllByText("转韩漫提示词", { selector: "td" })).toHaveLength(2);
    expect(screen.getAllByText("拆角色场景道具", { selector: "td" })).toHaveLength(2);
    expect(screen.getByText("共 1 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("智能体管理", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("素材库按照参考页面展示筛选、卡片和分页", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "素材库" }));

    expect(screen.getByPlaceholderText("搜索")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /分类编辑/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /上传素材/ })).toBeInTheDocument();
    expect(screen.getAllByTestId("asset-library-card")).toHaveLength(20);
    expect(screen.getByText("青萝")).toBeInTheDocument();
    expect(screen.getByText("军报")).toBeInTheDocument();
    expect(screen.getByText("共 2801 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("素材库", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("项目题材按照参考页面展示筛选、题材表格和分页", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目题材" }));

    expect(screen.getByPlaceholderText("输入题材名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增题材" })).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "项目题材列表" })).getAllByRole("row")).toHaveLength(18);
    expect(screen.getByText("财务工时专用")).toBeInTheDocument();
    expect(screen.getByText("动作")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /题材\d+可用状态/ })).toHaveLength(17);
    expect(screen.getByText("共 17 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("项目题材", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("用户可见绩效页面不再出现旧术语", () => {
    render(<App />);
    openPerformance();
    expect(document.body.textContent).not.toContain("OKR");
    expect(document.body.textContent).not.toContain("委员会");
    expect(screen.getByText("综合绩效完成度")).toBeInTheDocument();
    expect(screen.getByText("评分未完成")).toBeInTheDocument();
    expect(screen.getByText("平均分")).toBeInTheDocument();
    expect(screen.getByText("最高 / 最低")).toBeInTheDocument();
    expect(screen.queryByText("周报按时提交率")).toBeNull();
    expect(screen.queryByText("周报逾期人数")).toBeNull();
  });

  test("顶部指标卡是不可点击的展示卡片", () => {
    render(<App />);
    openPerformance();
    const card = screen.getByText("综合绩效完成度").closest("article");
    expect(card).toHaveClass("performance-summary-card");
    expect(card?.tagName).toBe("ARTICLE");
    expect(within(card).queryByRole("button")).toBeNull();
    expect(within(card).getByText("15").tagName).toBe("STRONG");
    expect(within(card).getByLabelText("完成率 83.3%")).toBeInTheDocument();
    expect(screen.getByText("88.7")).toBeInTheDocument();
  });

  test("指标卡不随状态页签与等级筛选改变", () => {
    render(<App />);
    openPerformance();
    const before = screen.getByText("综合绩效完成度").parentElement?.textContent;
    fireEvent.change(screen.getByLabelText("等级筛选"), { target: { value: "S" } });
    fireEvent.click(screen.getByRole("button", { name: /已结束/ }));
    expect(screen.getByText("综合绩效完成度").parentElement?.textContent).toBe(before);
  });

  test("等级筛选支持正序和倒序展示", () => {
    render(<App />);
    openPerformance();
    const gradeSelect = screen.getByLabelText("等级筛选");
    expect(screen.getByRole("option", { name: "等级正序（D→S）" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "等级倒序（S→D）" })).toBeInTheDocument();
    fireEvent.change(gradeSelect, { target: { value: "grade_desc" } });
    expect(gradeSelect).toHaveValue("grade_desc");
  });

  test("HR和CEO不能互相代办审批节点", () => {
    render(<App />);
    switchRole("HR组织视图");
    openPerformance();
    fireEvent.change(screen.getByLabelText("状态"), { target: { value: REVIEW_STATUS.hrReview } });
    expect(screen.getAllByRole("button", { name: "HR复审并提交CEO" }).some((button) => !button.disabled)).toBe(true);

    switchRole("CEO经营驾驶舱");
    fireEvent.change(screen.getByLabelText("状态"), { target: { value: REVIEW_STATUS.hrReview } });
    expect(screen.getAllByRole("button", { name: "HR复审并提交CEO" }).every((button) => button.disabled)).toBe(true);
    fireEvent.change(screen.getByLabelText("状态"), { target: { value: REVIEW_STATUS.committeeApproval } });
    expect(screen.getAllByRole("button", { name: "CEO审批" }).some((button) => !button.disabled)).toBe(true);
  });

  test("员工视图只显示本人且不能发起他人流程", () => {
    render(<App />);
    switchRole("员工个人工作台");
    openPerformance();
    expect(screen.getByText("张小北")).toBeInTheDocument();
    expect(screen.queryByText("周编剧")).toBeNull();
    expect(screen.getAllByRole("button", { name: "下发月度绩效目标" }).every((button) => button.disabled)).toBe(true);
  });

  test("Leader按部门岗位选择模板，并在草案中编辑后下发", () => {
    render(<App />);
    switchRole("Leader团队负责人");
    openPerformance();
    fireEvent.click(screen.getAllByRole("button", { name: "下发月度绩效目标" }).find((button) => !button.disabled));
    expect(screen.getByRole("heading", { name: "下发月度绩效目标" })).toBeInTheDocument();
    expect(screen.getByText("岗位通用绩效目标")).toBeInTheDocument();
    expect(screen.getByText("个人月度重点目标")).toBeInTheDocument();
    expect(screen.getByText("独立加减分项")).toBeInTheDocument();
    expect(screen.getAllByText("模板必选").length).toBeGreaterThan(0);
    expect(screen.getAllByText("独立计分").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("当前部门岗位模板")).toHaveValue("template-edit-middle");
    expect(screen.getByRole("option", { name: "剪辑中心 · 中级剪辑师" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回列表" }));
    expect(screen.getByText("人员绩效列表")).toBeInTheDocument();
  });

  test("HR可按部门和岗位创建绩效模板，Leader看不到维护入口", () => {
    render(<App />);
    switchRole("HR组织视图");
    openPerformance();
    fireEvent.click(screen.getByRole("button", { name: "绩效模板下发" }));
    expect(screen.getByRole("dialog", { name: "维护岗位绩效目标模板" })).toBeInTheDocument();
    expect(screen.getByLabelText("模板所属部门")).toBeInTheDocument();
    expect(screen.queryByLabelText("适用岗位")).toBeNull();
    expect(screen.queryByLabelText("模板名称")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "新建部门" }));
    fireEvent.change(screen.getByLabelText("新部门名称"), { target: { value: "测试部门" } });
    fireEvent.click(screen.getByRole("button", { name: "确认新建部门" }));
    expect(screen.getByRole("option", { name: "测试部门" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ 新增必选目标" }));
    expect(screen.getByDisplayValue("新增绩效目标")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭模板维护" }));
    switchRole("Leader团队负责人");
    expect(screen.queryByRole("button", { name: "绩效模板下发" })).toBeNull();
  });

  test("详情展示目标版本、结果版本和评分拆分", () => {
    render(<App />);
    openPerformance();
    fireEvent.click(screen.getAllByRole("button", { name: "详情" })[0]);
    expect(screen.getByRole("button", { name: "导出Excel" })).toBeInTheDocument();
    expect(screen.getByText("绩效目标版本")).toBeInTheDocument();
    expect(screen.getByText("绩效结果版本")).toBeInTheDocument();
    expect(screen.getByText("基础绩效分")).toBeInTheDocument();
    expect(screen.getAllByText("加减分").length).toBeGreaterThan(0);
  });
});
