import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../App";
import { PersonnelDashboard } from "./PersonnelDashboard";

afterEach(cleanup);

function openDashboard() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "经营驾驶舱" }));
  fireEvent.click(screen.getByRole("tab", { name: "人员绩效" }));
}

describe("personnel performance and weekly dashboard page", () => {
  test("shows company ranking and formal-score states for management", () => {
    openDashboard();
    expect(screen.getByRole("heading", { name: "人员绩效与周报数据看板" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "驾驶舱分析维度" }).closest(".dashboard-title")).toBeInTheDocument();
    expect(screen.getByText("绩效排名列表")).toBeInTheDocument();
    expect(screen.getByText("周报提交概览")).toBeInTheDocument();
    expect(screen.getByText("本月应提交周报")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "详情" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "绩效详情" })).toBeNull();
    expect(screen.queryByRole("button", { name: "查看周报" })).toBeNull();
    expect(screen.getAllByText("最终评分已生效").length).toBeGreaterThan(0);
    expect(screen.getAllByText("评分未完成").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("最终评分状态"), { target: { value: "incomplete" } });
    expect(screen.getByText("最终审批已退回")).toBeInTheDocument();
  });

  test("employee sees only self information and has no comparison", () => {
    openDashboard();
    fireEvent.click(screen.getByRole("button", { name: /员工/ }));
    expect(screen.getByText("我的最终绩效")).toBeInTheDocument();
    expect(screen.queryByText("绩效排名列表")).toBeNull();
    expect(screen.queryByRole("button", { name: "开始对比" })).toBeNull();
    expect(screen.queryByText("顾商务")).toBeNull();
  });

  test("leader can compare two visible people and sees dimension applicability", () => {
    openDashboard();
    fireEvent.click(screen.getByRole("button", { name: /Leader/ }));
    fireEvent.click(screen.getByLabelText("选择张小北"));
    fireEvent.click(screen.getByLabelText("选择周编剧"));
    const compare = screen.getByRole("button", { name: "开始对比" });
    expect(compare).toBeEnabled();
    fireEvent.click(compare);
    const dialog = screen.getByRole("dialog", { name: /多人绩效对比/ });
    expect(within(dialog).getByText("绩效维度横向对比")).toBeInTheDocument();
    expect(within(dialog).getAllByText("该岗位不适用").length).toBeGreaterThan(0);
  });

  test("covers empty, failure and no-permission states", () => {
    const { rerender } = render(<PersonnelDashboard activeRole="ceo" />);
    fireEvent.change(screen.getByLabelText("绩效月份"), { target: { value: "2026-04" } });
    expect(screen.getByText("所选月份没有已生效最终评分")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /统计口径/ }));
    fireEvent.click(screen.getByRole("button", { name: "演示加载失败" }));
    expect(screen.getByText("数据加载失败")).toBeInTheDocument();
    rerender(<PersonnelDashboard activeRole="guest" />);
    expect(screen.getByText("无权限访问")).toBeInTheDocument();
  });
});
