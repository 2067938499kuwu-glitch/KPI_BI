import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import { describe, expect, test } from "vitest";

const html = readFileSync(resolve("public/weekly-report.html"), "utf8");

function loadDocument() {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: "http://localhost/weekly-report.html",
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      window.HTMLElement.prototype.scrollIntoView = () => {};
    },
  });
  return { dom, errors };
}

describe("人员周报页面", () => {
  test("人员周报入口紧跟团队筛选器", () => {
    const { dom, errors } = loadDocument();
    const { document } = dom.window;
    const teamSelect = document.getElementById("leaderTeamSelect");
    const entry = document.getElementById("openLeaderReportsBtn");

    expect(teamSelect?.nextElementSibling).toBe(entry);
    expect(teamSelect?.parentElement).toBe(entry?.parentElement);
    expect(errors).toEqual([]);
    dom.window.close();
  });

  test("人员周报抽屉可独立筛选周报周期并同步周期上下文", () => {
    const { dom, errors } = loadDocument();
    const { document, Event } = dom.window;

    document.getElementById("openLeaderReportsBtn").click();
    const periodSelect = document.getElementById("leaderReportWeek");
    expect(
      document
        .getElementById("leaderReportsDrawerMask")
        ?.classList.contains("show"),
    ).toBe(true);
    expect(periodSelect?.value).toBe("W28");

    periodSelect.value = "W27";
    periodSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(document.getElementById("leaderReportsPeriod")?.textContent).toContain(
      "2026年6月29日 - 7月5日",
    );
    expect(document.getElementById("leaderReportMeta")?.textContent).toContain(
      "2026年6月29日 - 7月5日",
    );
    expect(document.getElementById("leaderReportsFootnote")?.textContent).toContain(
      "2026年6月29日 - 7月5日",
    );
    expect(errors).toEqual([]);
    dom.window.close();
  });
});
