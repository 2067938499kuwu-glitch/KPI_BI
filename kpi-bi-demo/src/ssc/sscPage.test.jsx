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
import { SscDataMaintenancePage } from "./SscDataMaintenancePage";

afterEach(cleanup);

const sscEntries = [
  { label: "组织架构与花名册", view: "org" },
  { label: "表格管理", view: "tables" },
  { label: "模板管理", view: "templates" },
];

function getMainNavigation() {
  return screen.getByRole("navigation", { name: "主导航" });
}

function expectSscEntriesVisible() {
  const navigation = getMainNavigation();
  expect(within(navigation).getByText("SSC服务中心")).toBeInTheDocument();
  sscEntries.forEach(({ label }) => {
    expect(
      within(navigation).getByRole("button", { name: label }),
    ).toBeInTheDocument();
  });
}

describe("SSC服务中心接入", () => {
  test("将完整 SSC 目录放入现有主导航结构", () => {
    render(<App />);

    expectSscEntriesVisible();
    expect(
      within(getMainNavigation()).queryByRole("button", {
        name: "数据维护中心",
      }),
    ).not.toBeInTheDocument();
  });

  test.each(sscEntries)(
    "外层入口 $label 打开对应的 $view 视图",
    ({ label, view }) => {
      render(<App />);

      const entry = within(getMainNavigation()).getByRole("button", {
        name: label,
      });
      fireEvent.click(entry);

      expect(entry).toHaveClass("is-active");
      const frame = screen.getByTitle(`SSC服务中心 - ${label}`);
      const frameUrl = new URL(
        frame.getAttribute("src"),
        "http://localhost",
      );
      expect(frameUrl.pathname).toBe("/ssc-data-maintenance.html");
      expect(frameUrl.searchParams.get("embed")).toBe("1");
      expect(frameUrl.searchParams.get("view")).toBe(view);
      expect(frame).toHaveAttribute(
        "sandbox",
        "allow-scripts allow-forms allow-downloads allow-same-origin",
      );
    },
  );

  test("HR 角色可以访问 SSC 三个目录", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "HR组织视图" }),
    );

    expectSscEntriesVisible();
  });

  test.each(["员工个人工作台", "Leader团队负责人"])(
    "%s 不显示 SSC 分组和目录",
    (roleName) => {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: roleName }));
      const navigation = getMainNavigation();
      expect(
        within(navigation).queryByText("SSC服务中心"),
      ).not.toBeInTheDocument();
      sscEntries.forEach(({ label }) => {
        expect(
          within(navigation).queryByRole("button", { name: label }),
        ).not.toBeInTheDocument();
      });
    },
  );

  test("从 SSC 页面切换到无权限角色后返回工作台", () => {
    render(<App />);

    fireEvent.click(
      within(getMainNavigation()).getByRole("button", {
        name: "组织架构与花名册",
      }),
    );
    expect(
      screen.getByTitle("SSC服务中心 - 组织架构与花名册"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "员工个人工作台" }),
    );

    expect(screen.queryByLabelText("SSC服务中心")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "工作台" })).toHaveClass(
      "is-active",
    );
  });

  test("非法视图参数回退到组织架构与花名册", () => {
    render(<SscDataMaintenancePage view="constructor" />);

    const frame = screen.getByTitle("SSC服务中心 - 组织架构与花名册");
    const frameUrl = new URL(frame.getAttribute("src"), "http://localhost");
    expect(frameUrl.searchParams.get("view")).toBe("org");
  });
});
