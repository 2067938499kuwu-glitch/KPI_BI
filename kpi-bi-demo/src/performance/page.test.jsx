import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../App";
import { REVIEW_STATUS } from "./logic";

afterEach(() => {
  cleanup();
});

describe("performance center page shell", () => {
  test("shows the assessment ledger with the previous list columns", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));

    expect(screen.queryByText("月度绩效流程")).toBeNull();
    expect(screen.getByText("人员绩效列表")).toBeInTheDocument();
    expect(screen.queryByText("组织绩效层级")).toBeNull();
    expect(screen.getAllByRole("button", { name: "下发月度OKR" }).length).toBeGreaterThan(0);
    expect(screen.getByText("OKR确认")).toBeInTheDocument();
    expect(screen.getByText("结果补充")).toBeInTheDocument();
    expect(screen.getAllByText("一级评分").length).toBeGreaterThan(0);
    expect(screen.getAllByText("二级评分").length).toBeGreaterThan(0);
    expect(screen.getByText("加减项")).toBeInTheDocument();
    expect(screen.getByText("流程状态")).toBeInTheDocument();
    expect(screen.getByText("申诉状态")).toBeInTheDocument();
  });

  test("shows appealed reviews in the 申诉中 tab after department filtering", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));
    const appealButton = screen.getAllByRole("button", { name: "发起申诉" }).find((button) => !button.disabled);
    expect(appealButton).toBeTruthy();
    fireEvent.click(appealButton);

    fireEvent.change(screen.getByLabelText("申诉事项与原因"), {
      target: { value: "对评分结果存在异议，需要复核绩效任务达成举证" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交申诉" }));

    fireEvent.change(screen.getByLabelText("归属部门"), {
      target: { value: "运营增长中心" },
    });
    fireEvent.click(screen.getByRole("button", { name: /申诉中/ }));

    expect(screen.getAllByText("绩效申诉处理中").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "申诉受理" }).length).toBeGreaterThan(0);
  });

  test("shows the performance ledger without role-template filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));

    expect(screen.queryByLabelText("岗位模板")).toBeNull();
    expect(screen.getByLabelText("月份")).toBeInTheDocument();
    expect(screen.getByLabelText("归属部门")).toBeInTheDocument();
    expect(screen.getByLabelText("人员")).toBeInTheDocument();
    expect(screen.getByLabelText("等级")).toBeInTheDocument();
    expect(screen.getByLabelText("状态")).toBeInTheDocument();
  });

  test("shows actionable buttons for HR review and committee approval stages", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));

    fireEvent.change(screen.getByLabelText("状态"), {
      target: { value: REVIEW_STATUS.hrReview },
    });
    expect(screen.getAllByRole("button", { name: "HR复审提交委员会" }).some((button) => !button.disabled)).toBe(true);

    fireEvent.change(screen.getByLabelText("状态"), {
      target: { value: REVIEW_STATUS.committeeApproval },
    });
    expect(screen.getAllByRole("button", { name: "委员会审批" }).some((button) => !button.disabled)).toBe(true);
  });

  test("opens role-template metric detail in a modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));
    fireEvent.click(screen.getAllByRole("button", { name: "详情" })[0]);

    expect(screen.getByText("岗位模板明细")).toBeInTheDocument();
    expect(screen.getAllByText("剪辑中心").length).toBeGreaterThan(0);
    expect(screen.getByText("初级剪辑师 / 中级剪辑师")).toBeInTheDocument();
    expect(screen.getByText("剪辑产出总量")).toBeInTheDocument();
    expect(screen.getByText("返修与一次通过率")).toBeInTheDocument();
  });

  test("opens issue modal and submits monthly performance assignment", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));

    fireEvent.click(screen.getAllByRole("button", { name: "下发月度OKR" })[0]);
    expect(screen.getByText("快速下发月度 OKR")).toBeInTheDocument();
    expect(screen.getByText("成员选择")).toBeInTheDocument();
    expect(screen.getAllByText(/OKR 配置/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "全选可选成员" }));
    fireEvent.click(screen.getByRole("button", { name: "校验并下发" }));

    expect(screen.getAllByText("待人员OKR确认").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已确认").length).toBeGreaterThan(0);
  });
});
