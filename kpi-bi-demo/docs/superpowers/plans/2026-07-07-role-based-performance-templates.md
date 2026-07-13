# Role-Based Performance Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build岗位模板化绩效管理 so each employee review loads the correct KPI template for制片与主编、编剧、剪辑、美术指导 / AIGC 视频创作、组长.

**Architecture:** Add a focused template module under `src/performance/`, keep score math in `logic.js`, and adapt the existing React performance page to display template names, template filters, and岗位化指标明细. The app remains a local React + CSS prototype with no backend, no new routing, and no new UI library.

**Tech Stack:** React 19, Vite 6, Vitest 4, Testing Library, plain CSS, Phosphor icons.

## Global Constraints

- Keep the existing monthly workflow: 目标下发、员工确认、结果录入、一级评分、二级评分、HR 复核、委员会审批、面谈反馈、申诉处理.
- Use岗位模板化: each review has `roleTemplateId`, `roleTemplateName`, and template-driven metric rows.
- Final score remains `指标加权得分 + 加减分合计`.
- 一级上级评分 weight is `60%`; 二级上级评分 weight is `40%`.
- 美术指导 / AIGC 视频创作 and 组长 must preserve Excel dimensions, weights, and data sources.
- 剪辑 must record both AIGC 短剧交付 and 运营高光视频日定量.
- Keep the admin visual language: compact filters, dense table rows, white cards on `#f7f7f7`, restrained colors.

---

## File Structure

- Create `src/performance/roleTemplates.js`
  - Owns role template constants, template lookup helpers, and row factory helpers.
- Modify `src/performance/logic.js`
  - Adds template-aware helpers without changing existing score behavior.
- Modify `src/performance/logic.test.js`
  - Adds tests for template lookup, row generation, score totals, and seed coverage.
- Modify `src/performance/page.test.jsx`
  - Adds user-facing assertions for岗位模板 filter, list display, and剪辑 dual-line detail.
- Modify `src/performance/seed.js`
  - Replaces old broken template text with readable role-template-backed seed reviews.
- Modify `src/App.jsx`
  - Adds template filter, template names in table and selected bar, and岗位化指标 detail/edit section.
- Modify `src/styles.css`
  - Adds small admin-style styles for template summary, business line chips, and metric rows.

### Task 1: Role Template Data and Scoring Helpers

**Files:**
- Create: `src/performance/roleTemplates.js`
- Modify: `src/performance/logic.js`
- Test: `src/performance/logic.test.js`

**Interfaces:**
- Produces: `ROLE_TEMPLATE_IDS`, `roleTemplates`, `getRoleTemplate(templateId)`, `getRoleTemplateOptions()`, `createRowsFromTemplate(templateId, values)`.
- Produces: `getReviewTemplate(review)` and `matchesTemplateFilter(review, templateId)` from `logic.js`.
- Consumes: existing `calcScore(review)`, `calcRowScore(row)`.

- [ ] **Step 1: Write failing tests for template lookup and score behavior**

Add tests in `src/performance/logic.test.js`:

```js
import {
  ROLE_TEMPLATE_IDS,
  createRowsFromTemplate,
  getRoleTemplate,
  getRoleTemplateOptions,
  roleTemplates,
} from "./roleTemplates";
import { getReviewTemplate, matchesTemplateFilter } from "./logic";

test("defines five role templates with the expected template options", () => {
  expect(roleTemplates.map((item) => item.name)).toEqual([
    "制片与主编",
    "编剧",
    "剪辑",
    "美术指导 / AIGC 视频创作",
    "组长",
  ]);
  expect(getRoleTemplateOptions()).toEqual([
    { value: "all", label: "全部岗位模板" },
    { value: "producer_editor", label: "制片与主编" },
    { value: "screenwriter", label: "编剧" },
    { value: "editor", label: "剪辑" },
    { value: "aigc_creator", label: "美术指导 / AIGC 视频创作" },
    { value: "team_lead", label: "组长" },
  ]);
  expect(getRoleTemplate(ROLE_TEMPLATE_IDS.editor).businessLines).toEqual(["AIGC 短剧剪辑", "运营高光引流视频"]);
});

test("creates weighted rows from the editor template and keeps scoring rules", () => {
  const rows = createRowsFromTemplate(ROLE_TEMPLATE_IDS.editor, {
    aigcDeliveryRate: { selfText: "本月 AIGC 短剧均按节点交付", firstScore: 80, secondScore: 70 },
    highlightDailyOutput: { selfText: "运营高光视频日均达标", firstScore: 85, secondScore: 75 },
    editPassRate: { selfText: "一次通过率稳定", firstScore: 78, secondScore: 72 },
    crossTeamResponse: { selfText: "响应需求变更及时", firstScore: 82, secondScore: 76 },
    reusableEditMethod: { selfText: "沉淀高光模板", firstScore: 2, secondScore: 1 },
  });

  const metricRows = rows.filter((row) => row.type !== "section");
  expect(metricRows.map((row) => row.label)).toEqual([
    "AIGC 短剧按期交付率",
    "高光引流视频日均完成量",
    "返修次数与通过率",
    "跨组响应效率",
    "剪辑方法沉淀",
  ]);
  expect(calcScore({ rows })).toBeCloseTo(78.7, 1);
});

test("matches review template filters and falls back to review template names", () => {
  const review = {
    roleTemplateId: ROLE_TEMPLATE_IDS.producerEditor,
    roleTemplateName: "制片与主编",
  };

  expect(getReviewTemplate(review).name).toBe("制片与主编");
  expect(matchesTemplateFilter(review, "all")).toBe(true);
  expect(matchesTemplateFilter(review, ROLE_TEMPLATE_IDS.producerEditor)).toBe(true);
  expect(matchesTemplateFilter(review, ROLE_TEMPLATE_IDS.editor)).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/performance/logic.test.js`

Expected: FAIL because `./roleTemplates` and template helper exports do not exist.

- [ ] **Step 3: Add template module and logic helpers**

Implement `src/performance/roleTemplates.js` with all five templates, exact weights from the approved spec, and `createRowsFromTemplate`.

Add to `src/performance/logic.js`:

```js
import { getRoleTemplate } from "./roleTemplates";

export function getReviewTemplate(review) {
  return getRoleTemplate(review.roleTemplateId) ?? {
    id: review.roleTemplateId ?? "unknown",
    name: review.roleTemplateName ?? review.role ?? "未知岗位模板",
    dimensions: [],
    adjustments: [],
  };
}

export function matchesTemplateFilter(review, templateId) {
  return templateId === "all" || review.roleTemplateId === templateId;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/performance/logic.test.js`

Expected: PASS for the new template tests and existing score tests.

### Task 2: Seed Reviews Use Role Templates

**Files:**
- Modify: `src/performance/seed.js`
- Test: `src/performance/logic.test.js`

**Interfaces:**
- Consumes: `ROLE_TEMPLATE_IDS`, `createRowsFromTemplate`, `getRoleTemplate`.
- Produces: `reviewsSeed` records with readable Chinese text and `roleTemplateId`, `roleTemplateName`, `businessLines`, `templateHighlights`.

- [ ] **Step 1: Write failing seed coverage test**

Replace the current mojibake readability test with:

```js
test("seed reviews cover all approved role templates with readable text", () => {
  expect(reviewsSeed.map((item) => item.roleTemplateName)).toEqual([
    "制片与主编",
    "编剧",
    "剪辑",
    "美术指导 / AIGC 视频创作",
    "组长",
  ]);
  expect(reviewsSeed.map((item) => item.employee)).toEqual(["林制片", "周编剧", "张小北", "王芳", "陈组长"]);
  expect(reviewsSeed.find((item) => item.roleTemplateId === ROLE_TEMPLATE_IDS.editor).businessLines).toEqual([
    "AIGC 短剧剪辑",
    "运营高光引流视频",
  ]);
  expect(reviewsSeed.every((item) => item.rows.some((row) => row.type === "section"))).toBe(true);
  expect(reviewsSeed.every((item) => calcScore(item) > 0)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/performance/logic.test.js`

Expected: FAIL because seed data still uses old broken text and only three reviews.

- [ ] **Step 3: Replace seed data**

Update `src/performance/seed.js` to import `ROLE_TEMPLATE_IDS`, `createRowsFromTemplate`, and `getRoleTemplate`; keep `performanceFocusOptions`; define five review records, one per approved template.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/performance/logic.test.js`

Expected: PASS.

### Task 3: Template Filter and List Display

**Files:**
- Modify: `src/App.jsx`
- Test: `src/performance/page.test.jsx`

**Interfaces:**
- Consumes: `getRoleTemplateOptions()` from `roleTemplates.js`.
- Consumes: `matchesTemplateFilter(review, filters.templateId)` from `logic.js`.
- Produces: a new “岗位模板” filter and template name in the selected bar/table.

- [ ] **Step 1: Write failing page test**

Add to `src/performance/page.test.jsx`:

```jsx
test("filters the performance ledger by role template", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));

  expect(screen.getByLabelText("岗位模板")).toBeInTheDocument();
  expect(screen.getAllByText("制片与主编").length).toBeGreaterThan(0);
  expect(screen.getAllByText("剪辑").length).toBeGreaterThan(0);

  fireEvent.change(screen.getByLabelText("岗位模板"), {
    target: { value: "editor" },
  });

  expect(screen.getAllByText("张小北").length).toBeGreaterThan(0);
  expect(screen.queryByText("林制片")).toBeNull();
  expect(screen.getAllByText("剪辑").length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/performance/page.test.jsx`

Expected: FAIL because the label “岗位模板” does not exist.

- [ ] **Step 3: Add template filter and list column copy**

Update `PerformanceCenter`:

- Add `templateId: "all"` to filters.
- Add `const templateOptions = getRoleTemplateOptions();`.
- Add a `岗位模板` select in `FilterBar`.
- Apply `matchesTemplateFilter(item, filters.templateId)` in `filteredReviews`.
- Show `item.roleTemplateName` in the selected bar and in the organization cell.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/performance/page.test.jsx`

Expected: PASS.

### Task 4: Template Detail Panel and Business Lines

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Test: `src/performance/page.test.jsx`

**Interfaces:**
- Consumes: `draft.rows`, `draft.businessLines`, `draft.templateHighlights`.
- Produces: a visible岗位模板明细 panel with metric groups and剪辑 dual business line summary.

- [ ] **Step 1: Write failing page test**

Add to `src/performance/page.test.jsx`:

```jsx
test("shows role-template metric detail and editor business lines", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));
  fireEvent.change(screen.getByLabelText("岗位模板"), {
    target: { value: "editor" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: "查看详情" })[0]);

  expect(screen.getByText("岗位模板明细")).toBeInTheDocument();
  expect(screen.getByText("AIGC 短剧剪辑")).toBeInTheDocument();
  expect(screen.getByText("运营高光引流视频")).toBeInTheDocument();
  expect(screen.getByText("AIGC 短剧按期交付率")).toBeInTheDocument();
  expect(screen.getByText("高光引流视频日均完成量")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/performance/page.test.jsx`

Expected: FAIL because the detail panel is not rendered.

- [ ] **Step 3: Add detail panel**

In `PerformanceCenter`, below the selected bar, render:

- template name and owner summary
- `businessLines` as compact chips when present
- `templateHighlights` as small key-value chips
- metric rows grouped by `section` rows, showing label, source, weight, selfText, composite score, and weighted score

Add CSS classes:

- `.performance-template-panel`
- `.performance-template-panel__header`
- `.performance-business-lines`
- `.performance-highlight-grid`
- `.template-metric-list`
- `.template-metric-row`
- `.template-metric-section`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/performance/page.test.jsx`

Expected: PASS.

### Task 5: Full Verification

**Files:**
- No new source files.

**Interfaces:**
- Consumes all previous tasks.
- Produces verified build and test status.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: Vite build completes successfully.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: dev server prints a local URL.

- [ ] **Step 4: Manually inspect the page**

Open the local URL, click “绩效中心”, verify:

- “岗位模板” filter appears.
- Selecting “剪辑” shows only 张小北.
- Selected detail shows “岗位模板明细”.
- 剪辑 detail shows both “AIGC 短剧剪辑” and “运营高光引流视频”.
- Table remains compact and readable at desktop width.
