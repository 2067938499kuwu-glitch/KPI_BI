import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PerformanceDetailPage, WorkflowActionPage } from "../App";
import { getWorkflowAction } from "./logic";
import { reviewsSeed } from "./seed";

afterEach(cleanup);

describe("performance interview attachment archive", () => {
  test("requires the filled interview form and keeps it in the workflow payload", async () => {
    const review = reviewsSeed.find((item) => item.id === "rv-finished-1");
    const action = getWorkflowAction(review);
    const onSubmit = vi.fn();

    render(<WorkflowActionPage review={review} action={action} onBack={() => {}} onSubmit={onSubmit} hongguoUploads={[]} />);

    expect(screen.getByRole("button", { name: "下载面谈表" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "绩效反馈与面谈附件归档" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));
    expect(screen.getByRole("alert")).toHaveTextContent("请先下载并填写绩效反馈与面谈记录表");
    expect(onSubmit).not.toHaveBeenCalled();

    const file = new File(["filled interview form"], "罗运营-绩效反馈与面谈记录表.doc", { type: "application/msword" });
    fireEvent.change(screen.getByLabelText(/上传已填写的面谈记录表/), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText("查看当前待归档附件")).toBeInTheDocument());
    expect(screen.queryByText("面谈纪要")).toBeNull();
    expect(screen.queryByText("改进计划")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      updates: expect.objectContaining({
        feedbackStatus: "已面谈并归档",
        interviewFormFile: expect.objectContaining({
          name: file.name,
          dataUrl: expect.stringContaining("data:application/msword"),
        }),
      }),
    }));
  });

  test("supports previewing and downloading the archived interview attachment", async () => {
    const review = reviewsSeed.find((item) => item.id === "rv-finished-1");
    const file = {
      name: "罗运营-绩效反馈与面谈记录表.doc",
      size: 1024,
      type: "application/msword",
      dataUrl: `data:application/msword;base64,${Buffer.from("<html><body>Archived interview content</body></html>").toString("base64")}`,
      uploadedAt: "2026-07-23 13:00",
    };

    render(<PerformanceDetailPage review={{ ...review, interviewFormFile: file, interviewArchivedAt: file.uploadedAt }} onBack={() => {}} hongguoUploads={[]} />);

    expect(screen.getByRole("button", { name: "预览附件" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载附件" })).toHaveAttribute("download", file.name);
    fireEvent.click(screen.getByRole("button", { name: "预览附件" }));

    const dialog = screen.getByRole("dialog", { name: "绩效反馈与面谈附件预览" });
    await waitFor(() => expect(within(dialog).getByText("Archived interview content")).toBeInTheDocument());
    expect(within(dialog).getByRole("link", { name: "下载附件" })).toHaveAttribute("download", file.name);
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭附件预览" }));
    expect(screen.queryByRole("dialog", { name: "绩效反馈与面谈附件预览" })).toBeNull();
  });
});
