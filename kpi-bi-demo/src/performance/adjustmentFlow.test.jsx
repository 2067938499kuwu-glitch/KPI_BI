import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test, vi } from "vitest";
import { WorkflowActionPage } from "../App";
import { REVIEW_STATUS, calcAdjustmentScore } from "./logic";

afterEach(cleanup);

function createAdjustmentReview(status, overrides = {}) {
  return {
    id: "rv-adjustment-test",
    employee: "张小北",
    department: "商务部",
    roleTemplateName: "商务部月度绩效模板",
    directLeader: "江晚",
    indirectLeader: "林乔",
    cycle: "2026-07",
    status,
    requiresSecondReview: true,
    rows: [
      {
        key: "delivery",
        label: "月度交付",
        section: "结果产出",
        type: "weighted",
        weight: 1,
        firstScore: 80,
        secondScore: 80,
      },
      {
        key: "ip-deal",
        label: "IP成交",
        section: "加减分项（总评分区间 -10分至10分）",
        type: "adjustment",
        minScore: 0,
        maxScore: 10,
        standard: "当月促成IP合作成交可加分。",
        source: "被考核人完成情况 / 上级和协作方评价",
        firstScore: 0,
        firstComment: "",
        secondScore: 0,
        secondComment: "",
      },
    ],
    adjustmentEvidenceFiles: [],
    operationLogs: [],
    version: 1,
    ...overrides,
  };
}

describe("加减分双级评分与共用材料", () => {
  test("一级填写非零加减分时必须上传至少一个共用文件", async () => {
    const review = createAdjustmentReview(REVIEW_STATUS.firstReview);
    const onSubmit = vi.fn();
    render(
      <WorkflowActionPage
        action={{ type: "first_score", label: "一级评分与评语", nextStatus: REVIEW_STATUS.secondReview }}
        hongguoUploads={[]}
        onBack={() => {}}
        onSubmit={onSubmit}
        review={review}
      />,
    );

    fireEvent.change(screen.getByLabelText("IP成交 一级评分"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("IP成交 一级评语"), { target: { value: "促成一个IP合作成交" } });
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));
    expect(screen.getByRole("alert")).toHaveTextContent("存在非零加减分，请至少上传一个共用佐证文件");
    expect(onSubmit).not.toHaveBeenCalled();

    const file = new File(["deal evidence"], "成交审批.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("上传加减分共用佐证材料"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText("成交审批.pdf")).toBeInTheDocument());
    expect(screen.getByText("已上传 1 个文件")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].updates.adjustmentEvidenceFiles).toHaveLength(1);
  });

  test("二级加减分按60%和40%合成并复用一级材料", () => {
    const review = createAdjustmentReview(REVIEW_STATUS.secondReview, {
      rows: createAdjustmentReview(REVIEW_STATUS.secondReview).rows.map((row) => row.type === "adjustment"
        ? { ...row, firstScore: 5, firstComment: "一级确认成交" }
        : row),
      adjustmentEvidenceFiles: [{
        id: "file-1",
        name: "成交审批.pdf",
        size: 1024,
        type: "application/pdf",
        dataUrl: "data:application/pdf;base64,QQ==",
        uploader: "江晚",
        uploadedAt: "2026-07-20 10:00",
        sourceStage: "first_score",
      }],
    });
    const onSubmit = vi.fn();
    render(
      <WorkflowActionPage
        action={{ type: "second_review", label: "二级复评与结果审核", nextStatus: REVIEW_STATUS.hrReview }}
        hongguoUploads={[]}
        onBack={() => {}}
        onSubmit={onSubmit}
        review={review}
      />,
    );

    fireEvent.change(screen.getByLabelText("IP成交 二级评分"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("IP成交 二级评语"), { target: { value: "复核成交材料有效" } });
    fireEvent.change(screen.getByLabelText("二级结果审核意见"), { target: { value: "材料完整，复评通过" } });
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.updates.adjustmentEvidenceFiles).toHaveLength(1);
    expect(calcAdjustmentScore({ ...review, rows: payload.updates.rows })).toBe(4.2);
  });
});
