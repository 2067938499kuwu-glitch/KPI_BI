import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AppealPage, PerformanceDetailPage, WorkflowActionPage } from "../App";
import { getWorkflowAction } from "./logic";
import { reviewsSeed } from "./seed";

afterEach(cleanup);

describe("绩效成绩确认与申诉决定", () => {
  test("默认引导员工确认成绩，并通过二维码签名归档", async () => {
    const review = reviewsSeed.find((item) => item.id === "rv-finished-1");
    const onConfirm = vi.fn();

    render(<AppealPage review={review} onBack={() => {}} onSave={() => {}} onConfirm={onConfirm} />);

    expect(screen.getByText(`${review.employee} 绩效成绩确认`)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "绩效成绩确认决定" })).toBeInTheDocument();
    expect(screen.getByText("绩效评分详细数据")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /确认成绩，不申诉/ })).toHaveClass("is-active");

    fireEvent.click(screen.getByRole("button", { name: "确认成绩并扫码签名" }));
    const dialog = screen.getByRole("dialog", { name: "扫码签名确认绩效成绩" });
    await waitFor(() => expect(screen.getByLabelText("绩效成绩签名二维码")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "完成确认并归档" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "演示：模拟扫码签名完成" }));
    expect(dialog).toHaveTextContent("签名完成");
    fireEvent.click(screen.getByRole("button", { name: "完成确认并归档" }));

    expect(onConfirm).toHaveBeenCalledWith(review.id, expect.objectContaining({
      decision: "confirm_no_appeal",
      decisionLabel: "确认绩效成绩，不发起申诉",
      signer: review.employee,
      signatureMethod: "二维码扫码签名",
      signatureId: expect.stringMatching(/^SIGN-/),
    }));
  });

  test("选择有异议后直接填写在线申诉表再提交", () => {
    const review = reviewsSeed.find((item) => item.id === "rv-finished-1");
    const onSave = vi.fn();

    render(<AppealPage review={review} onBack={() => {}} onSave={onSave} onConfirm={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /对成绩有异议，发起申诉/ }));

    expect(screen.getByRole("region", { name: "在线绩效申诉表" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下载申诉表" })).toBeNull();
    expect(screen.queryByLabelText(/上传填写完成的申诉表/)).toBeNull();
    expect(screen.getByRole("region", { name: `${review.roleTemplateName} 绩效目标评分表` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交绩效申诉" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("申诉内容"), { target: { value: "质量指标评分未计入已完成的复核记录，请重新核验。" } });
    fireEvent.change(screen.getByLabelText("申诉证据清单"), { target: { value: "1. 项目复核记录；2. 任务系统完成日志。" } });

    expect(screen.getByRole("button", { name: "提交绩效申诉" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "提交绩效申诉" }));
    expect(onSave).toHaveBeenCalledWith(review.id, expect.objectContaining({
      appealContent: "质量指标评分未计入已完成的复核记录，请重新核验。",
      appealEvidenceList: "1. 项目复核记录；2. 任务系统完成日志。",
    }));
  });

  test("在线申诉表流转到BP后仅开放受理区域", () => {
    const review = reviewsSeed.find((item) => item.id === "rv-appeal-1");
    const onSubmit = vi.fn();

    render(<WorkflowActionPage action={getWorkflowAction(review)} hongguoUploads={[]} onBack={() => {}} onSubmit={onSubmit} review={review} />);

    expect(screen.getByRole("region", { name: "在线绩效申诉表" })).toHaveTextContent(review.employee);
    expect(screen.queryByLabelText("申诉内容")).toBeNull();
    expect(screen.getByRole("radio", { name: "受理" })).toBeChecked();
    fireEvent.change(screen.getByLabelText("BP受理意见"), { target: { value: "已核验在线填写内容，受理质量指标争议。" } });
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      updates: expect.objectContaining({
        appealAcceptanceComment: "已核验在线填写内容，受理质量指标争议。",
        appealAcceptanceDecision: "accept",
      }),
    }));
  });

  test("详情页展示归档后的确认决定和电子签名凭证", () => {
    const review = reviewsSeed.find((item) => item.id === "rv-finished-1");
    const scoreConfirmation = {
      decision: "confirm_no_appeal",
      decisionLabel: "确认绩效成绩，不发起申诉",
      signer: review.employee,
      signedAt: "2026-07-23 15:20",
      signatureId: "SIGN-RV-FINISHED-1-ABC",
      signatureMethod: "二维码扫码签名",
      confirmedScore: 89.32,
      confirmedGrade: "S-优秀",
    };

    render(<PerformanceDetailPage review={{ ...review, scoreConfirmation }} onBack={() => {}} hongguoUploads={[]} />);

    const archive = screen.getByRole("region", { name: "绩效成绩确认记录" });
    expect(archive).toHaveTextContent("成绩确认与申诉决定");
    expect(archive).toHaveTextContent(scoreConfirmation.decisionLabel);
    expect(archive).toHaveTextContent(scoreConfirmation.signatureId);
    expect(archive).toHaveTextContent(scoreConfirmation.signedAt);
  });
});
