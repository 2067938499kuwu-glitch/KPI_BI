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
  test("导航只保留数据看板、绩效中心和周报，默认进入绩效中心", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "绩效中心" })).toHaveClass("is-active");
    expect(screen.queryByRole("button", { name: "工作台" })).toBeNull();
    expect(screen.queryByRole("button", { name: "项目中心" })).toBeNull();
    expect(screen.queryByRole("button", { name: "任务中心" })).toBeNull();
  });

  test("用户可见绩效页面不再出现旧术语", () => {
    render(<App />);
    openPerformance();
    expect(document.body.textContent).not.toContain("OKR");
    expect(document.body.textContent).not.toContain("委员会");
    expect(screen.getByText("绩效目标确认率")).toBeInTheDocument();
    expect(screen.getByText("S级人数")).toBeInTheDocument();
  });

  test("顶部指标卡是不可点击的展示卡片", () => {
    render(<App />);
    openPerformance();
    const card = screen.getByText("绩效目标确认率").closest("article");
    expect(card).toHaveClass("performance-summary-card");
    expect(card?.tagName).toBe("ARTICLE");
    expect(within(card).queryByRole("button")).toBeNull();
  });

  test("指标卡不随状态页签与等级筛选改变", () => {
    render(<App />);
    openPerformance();
    const before = screen.getByText("绩效目标确认率").parentElement?.textContent;
    fireEvent.change(screen.getByLabelText("等级筛选"), { target: { value: "S" } });
    fireEvent.click(screen.getByRole("button", { name: /已结束/ }));
    expect(screen.getByText("绩效目标确认率").parentElement?.textContent).toBe(before);
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
