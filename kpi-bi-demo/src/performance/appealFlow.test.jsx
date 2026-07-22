import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AppealPage } from "../App";
import { reviewsSeed } from "./seed";

afterEach(cleanup);

describe("performance appeal submission", () => {
  test("shows current score details and requires an uploaded appeal form", async () => {
    const review = reviewsSeed.find((item) => item.id === "rv-finished-1");
    const onSave = vi.fn();
    render(<AppealPage review={review} onBack={() => {}} onSave={onSave} />);

    expect(screen.getByText("绩效评分详细数据")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载申诉表" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: `${review.roleTemplateName} 绩效目标评分表` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交申诉" })).toBeDisabled();

    const file = new File(["filled appeal form"], "罗运营-绩效申诉表.doc", { type: "application/msword" });
    fireEvent.change(screen.getByLabelText(/上传填写完成的申诉表/), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole("button", { name: "提交申诉" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "提交申诉" }));
    expect(onSave).toHaveBeenCalledWith(review.id, expect.objectContaining({ file: expect.objectContaining({ name: file.name, dataUrl: expect.stringContaining("data:application/msword") }) }));
  });
});
