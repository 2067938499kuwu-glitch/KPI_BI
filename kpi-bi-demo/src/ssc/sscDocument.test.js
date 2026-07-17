import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import { describe, expect, test } from "vitest";

const html = readFileSync(
  resolve("public/ssc-data-maintenance.html"),
  "utf8",
);

const views = [
  { view: "org", title: "组织架构与花名册" },
  { view: "tables", title: "表格管理" },
  { view: "templates", title: "模板管理" },
];

function loadDocument(query = "", initialStorage = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: `http://localhost/ssc-data-maintenance.html${query}`,
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      Object.entries(initialStorage).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
      });
    },
  });
  return { dom, errors };
}

describe("SSC服务中心独立页面", () => {
  test.each(views)(
    "嵌入模式隐藏重复侧栏并打开 $view 视图",
    ({ view, title }) => {
      const { dom, errors } = loadDocument(`?embed=1&view=${view}`);
      const { document } = dom.window;

      expect(document.documentElement.classList.contains("is-embedded")).toBe(
        true,
      );
      const sidebar = document.querySelector(".sidebar");
      expect(sidebar).not.toBeNull();
      expect(dom.window.getComputedStyle(sidebar).display).toBe("none");
      expect(document.querySelectorAll(".view.active")).toHaveLength(1);
      expect(document.querySelector(".view.active")?.id).toBe(`view-${view}`);
      expect(document.getElementById("pageTitle")?.textContent).toBe(title);
      expect(document.title).toBe(`SSC服务中心 - ${title}`);
      expect(errors).toEqual([]);

      dom.window.close();
    },
  );

  test("非法视图安全回退到组织架构与花名册", () => {
    const { dom, errors } = loadDocument("?embed=1&view=unknown");
    const { document } = dom.window;

    expect(document.querySelector(".view.active")?.id).toBe("view-org");
    expect(document.getElementById("pageTitle")?.textContent).toBe(
      "组织架构与花名册",
    );
    expect(errors).toEqual([]);

    dom.window.close();
  });

  test("直接打开独立页面时保留原始降级导航", () => {
    const { dom, errors } = loadDocument();
    const { document } = dom.window;

    expect(document.documentElement.classList.contains("is-embedded")).toBe(
      false,
    );
    expect(document.getElementById("sscSubmenu")).not.toBeNull();
    expect(errors).toEqual([]);

    dom.window.close();
  });

  test("花名册将实习与到岗状态写入 SSC 共享数据源", () => {
    const { dom, errors } = loadDocument("?embed=1&view=org");
    const stored = JSON.parse(
      dom.window.localStorage.getItem("kpi-bi:ssc-employees"),
    );

    expect(stored).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          no: "ZY20260715",
          name: "苏冉",
          regular: "实习期",
          status: "实习期",
        }),
      ]),
    );
    expect(errors).toEqual([]);

    dom.window.close();
  });

  test("新增员工可选择招聘到岗人员并回写 SSC 关联", () => {
    const recruitmentData = {
      jobs: [
        { name: "数据分析师", department: "经营管理部" },
      ],
      candidates: [
        {
          id: "CAN-100",
          name: "林晓",
          phone: "13800001111",
          email: "lin.xiao@example.com",
          owner: "陈璐",
          applications: [
            {
              id: "APP-100",
              job: "数据分析师",
              status: "SSC待建档",
              onboardAt: "2026-07-16",
              version: 2,
            },
          ],
        },
      ],
    };
    const { dom, errors } = loadDocument("?embed=1&view=org", {
      "kpi-bi:demo-domain-data:v2": recruitmentData,
    });
    const { document } = dom.window;

    dom.window.openEmployeeModal();
    expect(document.getElementById("recruitmentArrivalCount")?.textContent).toBe(
      "1 人待建档",
    );
    expect(document.getElementById("recruitmentArrivalList")?.textContent).toContain(
      "林晓",
    );

    dom.window.selectRecruitmentArrival("CAN-100", "APP-100");
    expect(document.getElementById("empName")?.value).toBe("林晓");
    expect(document.getElementById("empPhone")?.value).toBe("13800001111");
    expect(document.getElementById("empRole")?.value).toBe("数据分析师");
    expect(document.getElementById("empDept")?.value).toBe("经营管理部");
    document.getElementById("empNo").value = "ZY20260716";
    dom.window.addEmployee();

    const employees = JSON.parse(
      dom.window.localStorage.getItem("kpi-bi:ssc-employees"),
    );
    expect(employees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          no: "ZY20260716",
          name: "林晓",
          phone: "13800001111",
          recruitmentCandidateId: "CAN-100",
          recruitmentApplicationId: "APP-100",
        }),
      ]),
    );
    const linkedRecruitment = JSON.parse(
      dom.window.localStorage.getItem("kpi-bi:demo-domain-data:v2"),
    );
    expect(linkedRecruitment.candidates[0].applications[0]).toEqual(
      expect.objectContaining({
        status: "实习期",
        sscEmployeeNo: "ZY20260716",
        employmentSource: "SSC花名册",
      }),
    );
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("月度考勤表使用截图中的完整汇报字段", () => {
    const { dom, errors } = loadDocument("?embed=1&view=tables");
    dom.window.selectTable(2);
    const headers = [...dom.window.document.querySelectorAll("#dynamicTable th")].map(
      (cell) => cell.textContent,
    );

    expect(headers).toEqual(
      expect.arrayContaining([
        "考勤月份",
        "花名",
        "转正天数",
        "入离职天数",
        "迟到早退0.5小时以内（含）",
        "迟到早退0.5-1小时（含）",
        "迟到早退1-4小时（含）",
        "迟到早退超过4小时次数",
        "晚走（21:30及之后）",
        "是否全勤",
        "备注",
      ]),
    );
    expect(headers).toHaveLength(23);
    expect(headers).not.toContain("UserID");
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("新旧花名册字段都能归一为共享员工数据", () => {
    const { dom, errors } = loadDocument("?embed=1&view=org");
    const employee = dom.window.normalizeRosterRecord(
      {
        "员工编码（新）": "ZY20260716",
        "花名*": "星河",
        "姓名/简历名（选填）": "林晓",
        "部门*": "内容经营中心",
        "职位*": "内容运营",
        入职日期: "2026-07-16",
        "在职状态*": "在职",
      },
      0,
    );

    expect(employee).toEqual(
      expect.objectContaining({
        no: "ZY20260716",
        name: "林晓",
        alias: "星河",
        dept: "内容经营中心",
        role: "内容运营",
        status: "实习期",
      }),
    );
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("花名册按用户截图展示完整原表字段且不重复显示公司标题带", () => {
    const { dom, errors } = loadDocument("?embed=1&view=org");
    const { document } = dom.window;
    const headers = [...document.querySelectorAll("#rosterHead th")].map(
      (cell) => cell.textContent,
    );

    expect(document.querySelector(".roster-ledger-title")).toBeNull();
    expect(headers).toHaveLength(40);
    expect(headers.slice(0, 10)).toEqual([
      "公司",
      "部门",
      "职务",
      "姓名",
      "花名",
      "入职时间",
      "试用期止",
      "司龄",
      "转正状态",
      "户口性质",
    ]);
    expect(headers).not.toContain("员工编号");
    expect(headers.slice(-5)).toEqual([
      "试用期薪资",
      "转正后薪资",
      "离职日期",
      "离职原因",
      "结算金额",
    ]);
    expect(
      document.querySelector(".roster-ledger-wrap")?.getAttribute("aria-label"),
    ).toBe("完整员工花名册");
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("新工作簿字段可映射到截图式花名册列", () => {
    const { dom, errors } = loadDocument("?embed=1&view=org");
    const employee = dom.window.normalizeRosterRecord(
      {
        "编制组织*": "杭州智影引擎科技有限公司",
        "员工编码（新）": "ZY20260717",
        "花名*": "青山",
        "姓名/简历名（选填）": "林青",
        "部门*": "综合管理中心",
        "职位*": "人事专员",
        入职日期: "2026-07-17",
        试用期到期日: "2026-10-17",
        "司龄（年）": "0.1",
        学历: "本科",
      },
      0,
    );

    expect(dom.window.employeeFieldValue(employee, "公司")).toBe(
      "杭州智影引擎科技有限公司",
    );
    expect(dom.window.employeeFieldValue(employee, "试用期止")).toBe(
      "2026-10-17",
    );
    expect(dom.window.employeeFieldValue(employee, "司龄")).toBe("0.1");
    expect(dom.window.employeeFieldValue(employee, "最高学历")).toBe("本科");
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("花名册按月继承并隔离编辑结果", () => {
    const { dom, errors } = loadDocument("?embed=1&view=org");

    dom.window.ensureRosterMonth("2099-01");
    dom.window.updateRosterCell(0, "姓名", "一月姓名");
    dom.window.ensureRosterMonth("2099-02");
    expect(dom.window.employeeFieldValue(dom.window.visibleEmployees()[0], "姓名")).toBe(
      "一月姓名",
    );
    dom.window.updateRosterCell(0, "姓名", "二月姓名");
    dom.window.ensureRosterMonth("2099-01");
    expect(dom.window.employeeFieldValue(dom.window.visibleEmployees()[0], "姓名")).toBe(
      "一月姓名",
    );
    expect(dom.window.document.getElementById("rosterMonth")?.value).toBe(
      "2099-01",
    );
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("花名册与业务表都支持本月内联编辑", () => {
    const { dom, errors } = loadDocument("?embed=1&view=org");
    const { document } = dom.window;

    dom.window.toggleRosterEdit();
    expect(document.getElementById("rosterEditButton")?.textContent).toBe(
      "完成编辑",
    );
    expect(
      document.querySelectorAll("#rosterBody [contenteditable='true']").length,
    ).toBeGreaterThan(0);

    dom.window.activateView("tables");
    dom.window.selectTable(2);
    dom.window.changeTableMonth("2099-01");
    dom.window.updateTableCell(0, 0, "2099-01");
    dom.window.changeTableMonth("2099-02");
    dom.window.updateTableCell(0, 0, "2099-02");
    dom.window.changeTableMonth("2099-01");
    dom.window.toggleTableEdit();
    expect(document.getElementById("tableEditButton")?.textContent).toBe(
      "完成编辑",
    );
    expect(
      document.querySelectorAll("#dynamicTable [contenteditable='true']").length,
    ).toBeGreaterThan(0);
    expect(document.querySelector("#dynamicTable tbody td")?.textContent).toBe(
      "2099-01",
    );
    expect(document.getElementById("tableMonth")?.value).toBe("2099-01");
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("花名册与业务表提供真实文件选择和汇报导出入口", () => {
    const { dom, errors } = loadDocument("?embed=1&view=org");
    const { document } = dom.window;

    expect(document.getElementById("rosterFileInput")?.accept).toBe(
      ".xlsx,.xls,.csv",
    );
    expect(document.getElementById("tableFileInput")?.accept).toBe(
      ".xlsx,.xls,.csv",
    );
    expect(
      [...document.querySelectorAll("button")].some(
        (button) => button.textContent === "导出汇报工作簿",
      ),
    ).toBe(true);
    expect(typeof dom.window.importRosterFile).toBe("function");
    expect(typeof dom.window.importActiveTableFile).toBe("function");
    expect(typeof dom.window.exportReportingWorkbook).toBe("function");
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("模板卡片的预览与版本操作展示对应模板内容", () => {
    const { dom, errors } = loadDocument("?embed=1&view=templates");
    const { document } = dom.window;
    const templateKey = encodeURIComponent("员工信息采集表");

    dom.window.openTemplatePreview(templateKey);
    expect(
      document.getElementById("templatePreviewModal")?.classList.contains("show"),
    ).toBe(true);
    expect(document.getElementById("templatePreviewTitle")?.textContent).toBe(
      "员工信息采集表 · 模板预览",
    );
    expect(document.getElementById("templatePreviewBody")?.textContent).toContain(
      "紧急联系人",
    );

    dom.window.closeModal("templatePreviewModal");
    dom.window.openTemplateVersions(templateKey);
    expect(
      document.getElementById("templateVersionModal")?.classList.contains("show"),
    ).toBe(true);
    expect(document.getElementById("templateVersionTitle")?.textContent).toBe(
      "员工信息采集表 · 版本记录",
    );
    expect(document.getElementById("templateVersionBody")?.textContent).toContain(
      "V3.1",
    );
    expect(document.getElementById("templateVersionBody")?.textContent).toContain(
      "V3.0",
    );
    expect(errors).toEqual([]);
    dom.window.close();
  });
});
