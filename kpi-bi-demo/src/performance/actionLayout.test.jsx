import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../App";

afterEach(cleanup);

describe("performance action column", () => {
  test("shows all role-related actions, disables unavailable ones, and puts details last", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));

    const findStandardZhangRow = () => screen.getAllByText("张小北")
      .map((name) => name.closest(".admin-table__row--performance-ledger"))
      .find((row) => !within(row).queryByText("全流程测试"));
    const ceoRow = findStandardZhangRow();
    const ceoButtons = within(within(ceoRow).getByLabelText("张小北绩效操作")).getAllByRole("button");
    expect(ceoButtons.map((button) => button.textContent.trim())).toEqual([
      "绩效委员会审批",
      "绩效委员会复核申诉",
      "详情",
    ]);
    expect(ceoButtons[0]).toBeDisabled();
    expect(ceoButtons[1]).toBeDisabled();
    expect(ceoButtons[2]).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Leader团队负责人" }));
    const leaderRow = findStandardZhangRow();
    const leaderButtons = within(within(leaderRow).getByLabelText("张小北绩效操作")).getAllByRole("button");

    expect(leaderButtons.map((button) => button.textContent.trim())).toEqual([
      "下发月度绩效目标",
      "调整并重新下发",
      "一级评分与评语",
      "反馈与面谈记录",
      "变更目标",
      "提供评分依据",
      "详情",
    ]);
    expect(leaderButtons[0]).toHaveClass("performance-row-action--workflow");
    expect(leaderButtons[0]).toBeEnabled();
    leaderButtons.slice(1, -1).forEach((button) => expect(button).toBeDisabled());
    expect(leaderButtons.at(-1)).toHaveClass("performance-row-action--detail");

    fireEvent.click(screen.getByRole("button", { name: "HR组织视图" }));
    const hrRow = findStandardZhangRow();
    const hrButtons = within(within(hrRow).getByLabelText("张小北绩效操作")).getAllByRole("button");
    expect(hrButtons.map((button) => button.textContent.trim())).toEqual([
      "HR复审并提交绩效委员会",
      "受理绩效申诉",
      "裁定并提交绩效委员会",
      "详情",
    ]);

    document.querySelectorAll(".performance-row-actions").forEach((group) => {
      const buttons = within(group).getAllByRole("button");
      expect(buttons.at(-1)).toHaveTextContent("详情");
    });
  });
});
