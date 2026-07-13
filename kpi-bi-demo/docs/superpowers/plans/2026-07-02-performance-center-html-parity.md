# Performance Center HTML Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the performance center into a reference-HTML-matched monthly performance management page with full prototype interactions, while preserving the real KPI scoring model already implemented.

**Architecture:** Keep the app in the current Vite + React single-page prototype, but extract performance logic into focused helpers and UI sections so the page shifts from a side-by-side editor to a management console: filters, summary cards, timeline, status tabs, table, and modal workflows. Add a minimal Vitest layer first so the scoring and status transitions can be verified before the UI rewrite lands.

**Tech Stack:** React 19, Vite 6, plain CSS, Vitest, Testing Library

---

## File Map

### Create

- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\logic.js`
- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\seed.js`
- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\logic.test.js`
- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\page.test.jsx`
- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\docs\superpowers\plans\2026-07-02-performance-center-html-parity.md`

### Modify

- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\package.json`
- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\vite.config.mjs`
- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`
- `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\styles.css`

---

### Task 1: Add a Minimal Test Harness

**Files:**
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\package.json`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\vite.config.mjs`
- Create: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\logic.test.js`

- [ ] **Step 1: Write the failing test for existing scoring behavior**

```js
import { describe, expect, test } from "vitest";
import { calcRowScore, calcScore, getGrade, getNextReviewStatus } from "./logic";

describe("performance scoring", () => {
  test("calculates weighted row scores and final score from first and second leader ratios", () => {
    const review = {
      rows: [
        { type: "weighted", weight: 0.4, firstScore: 75, secondScore: 65 },
        { type: "weighted", weight: 0.3, firstScore: 85, secondScore: 65 },
        { type: "adjustment", firstScore: 3, secondScore: 0 },
      ],
    };

    expect(calcRowScore(review.rows[0])).toBe(28.4);
    expect(calcRowScore(review.rows[1])).toBe(23.1);
    expect(calcRowScore(review.rows[2])).toBe(1.8);
    expect(calcScore(review)).toBe(53.3);
  });

  test("maps grades and workflow transitions", () => {
    expect(getGrade(82)).toBe("A");
    expect(getGrade(66.8)).toBe("C");
    expect(getNextReviewStatus("待一级评分")).toBe("待二级评分");
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npx vitest run src/performance/logic.test.js
```

Expected:

- command fails because `vitest` is not installed
- or module `./logic` does not exist yet

- [ ] **Step 3: Add the minimal test setup**

Update `package.json` scripts and dev dependencies:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 4173",
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.3",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

Update `vite.config.mjs`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    environment: "jsdom",
  },
  plugins: [react()],
});
```

- [ ] **Step 4: Run install and verify dependency setup**

Run:

```bash
npm.cmd install
```

Expected:

- install completes successfully
- `package-lock.json` updates

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.mjs
git commit -m "test: add vitest harness for performance center"
```

---

### Task 2: Extract Performance Logic and Seed Data

**Files:**
- Create: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\logic.js`
- Create: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\seed.js`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`
- Test: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\logic.test.js`

- [ ] **Step 1: Write one more failing test for tab/status mapping**

Append to `logic.test.js`:

```js
test("derives table tabs and appeal counts from review records", () => {
  const reviews = [
    { status: "目标待下发", appealStatus: "无申诉" },
    { status: "待一级评分", appealStatus: "无申诉" },
    { status: "申诉中", appealStatus: "调查中" },
  ];

  expect(getStatusCount(reviews, "全部")).toBe(3);
  expect(getStatusCount(reviews, "待一级评分")).toBe(1);
  expect(getStatusCount(reviews, "申诉中")).toBe(1);
  expect(getOpenAppealCount(reviews)).toBe(1);
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm.cmd test -- src/performance/logic.test.js
```

Expected:

- fail because exported helpers do not exist yet

- [ ] **Step 3: Create the logic module with pure helpers**

Create `src/performance/logic.js` with:

```js
export const scoreRatio = { firstLeader: 0.6, secondLeader: 0.4 };

export function calcRowComposite(row) {
  return (row.firstScore ?? 0) * scoreRatio.firstLeader + (row.secondScore ?? 0) * scoreRatio.secondLeader;
}

export function calcRowScore(row) {
  if (row.type === "section") return 0;
  const composite = calcRowComposite(row);
  if (row.type === "adjustment") return Number(composite.toFixed(1));
  return Number((composite * (row.weight ?? 0)).toFixed(1));
}

export function calcScore(review) {
  return Number(review.rows.reduce((sum, row) => sum + calcRowScore(row), 0).toFixed(1));
}

export function getGrade(score) {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export function getNextReviewStatus(status) {
  if (status === "目标待下发") return "待确认";
  if (status === "待确认") return "执行中";
  if (status === "执行中") return "待结果录入";
  if (status === "待结果录入") return "待一级评分";
  if (status === "待一级评分") return "待二级评分";
  if (status === "待二级评分") return "待HR复核";
  if (status === "待HR复核") return "待委员会审批";
  if (status === "待委员会审批") return "待反馈面谈";
  if (status === "待反馈面谈" || status === "申诉中") return "已归档";
  return status;
}

export function getStatusCount(reviews, tab) {
  if (tab === "全部") return reviews.length;
  return reviews.filter((item) => item.status === tab).length;
}

export function getOpenAppealCount(reviews) {
  return reviews.filter((item) => !["无申诉", "已裁定"].includes(item.appealStatus)).length;
}
```

- [ ] **Step 4: Move performance seed/template data into `seed.js`**

Create `src/performance/seed.js` and export:

- performance template sections
- `createPerformanceRows`
- `reviewsSeed`
- future-facing tab labels constant

Use the current data from `App.jsx` as source of truth rather than inventing new field names mid-task.

- [ ] **Step 5: Rewire `App.jsx` to import the extracted helpers and seed**

Replace duplicated inline constants/functions with imports like:

```js
import {
  calcRowScore,
  calcScore,
  getGrade,
  getNextReviewStatus,
  getOpenAppealCount,
} from "./performance/logic";
import { reviewsSeed, performanceTabs } from "./performance/seed";
```

- [ ] **Step 6: Run tests to verify GREEN**

Run:

```bash
npm.cmd test -- src/performance/logic.test.js
```

Expected:

- all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/performance/logic.js src/performance/seed.js src/performance/logic.test.js
git commit -m "refactor: extract performance logic and seed data"
```

---

### Task 3: Add a Page-Level Rendering Test for the New Management Shell

**Files:**
- Create: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\page.test.jsx`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`

- [ ] **Step 1: Write the failing page test for the new layout**

```jsx
import { render, screen } from "@testing-library/react";
import { App } from "../App";

test("renders performance center as a management page instead of an inline editor", async () => {
  render(<App />);
  screen.getByRole("button", { name: "绩效中心" }).click();

  expect(screen.getByText("月度绩效流程")).toBeInTheDocument();
  expect(screen.getByText("目标待下发")).toBeInTheDocument();
  expect(screen.getByText("月度 OKR 下发")).toBeInTheDocument();
  expect(screen.queryByText("绩效考核录入页")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
```

Expected:

- fail because old inline editor layout still renders

- [ ] **Step 3: Implement the new performance page shell**

In `App.jsx`, replace the current `PerformanceCenter` body with sections matching the spec:

- title/action row
- filter grid
- metric cards
- timeline strip
- status tabs
- table container
- pagination footer

Leave modal handlers stubbed to current state where possible so the page can render before every modal is rebuilt.

- [ ] **Step 4: Run the page test and build**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
npm.cmd run build
```

Expected:

- test passes
- build passes

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/styles.css src/performance/page.test.jsx
git commit -m "feat: rebuild performance center page shell"
```

---

### Task 4: Rebuild Table, Filters, Metrics, and Timeline Interactions

**Files:**
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\styles.css`
- Test: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\page.test.jsx`

- [ ] **Step 1: Add a failing test for filter + tab interaction**

```jsx
test("filters records by tab and appeal status", async () => {
  render(<App />);
  screen.getByRole("button", { name: "绩效中心" }).click();

  screen.getByRole("button", { name: /申诉中/ }).click();
  expect(screen.getByText("调查中")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
```

Expected:

- fail until tabs/filters are wired

- [ ] **Step 3: Implement local view state and derived collections**

In `PerformanceCenter`, add:

- active tab
- page index
- filter form state
- derived `visibleReviews`
- derived metrics and timeline states

Use pure helpers where possible rather than embedding filtering rules inline in JSX.

- [ ] **Step 4: Add table actions with role/status gating**

Support visible actions such as:

- 查看详情
- 录入结果
- 一级评分
- 二级评分
- HR复核
- 委员会审批
- 面谈反馈
- 发起申诉
- 处理申诉

The first pass can focus on correct visibility and open handlers; modal internals land in the next tasks.

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
npm.cmd run build
```

Expected:

- tests pass
- build passes

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/styles.css src/performance/page.test.jsx
git commit -m "feat: add performance table, filters, and timeline interactions"
```

---

### Task 5: Rebuild Detail, Result Entry, and Scoring Modals

**Files:**
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\styles.css`
- Test: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\page.test.jsx`

- [ ] **Step 1: Write the failing test for opening a scoring modal**

```jsx
test("opens a scoring modal from the performance table", async () => {
  render(<App />);
  screen.getByRole("button", { name: "绩效中心" }).click();
  screen.getAllByRole("button", { name: "一级评分" })[0].click();

  expect(screen.getByText("一级评分")).toBeInTheDocument();
  expect(screen.getByText("综合得分")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
```

Expected:

- fail because modal title/body do not exist yet

- [ ] **Step 3: Implement shared modal state and three modal types**

Build:

- detail modal
- result entry modal
- score modal

Each modal should read/write the existing `rows` structure rather than introducing a second scoring schema.

- [ ] **Step 4: Wire state progression from modal submit**

Examples:

- result entry submit -> `待一级评分`
- first score submit -> `待二级评分`
- second score submit -> `待HR复核`

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
npm.cmd run build
```

Expected:

- tests pass
- build passes

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/styles.css src/performance/page.test.jsx
git commit -m "feat: add performance detail and scoring modals"
```

---

### Task 6: Add HR Review, Committee Approval, Interview, and Appeal Flows

**Files:**
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\styles.css`
- Test: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\page.test.jsx`

- [ ] **Step 1: Write the failing test for appeal creation**

```jsx
test("submits an appeal and marks the record as in appeal flow", async () => {
  render(<App />);
  screen.getByRole("button", { name: "绩效中心" }).click();
  screen.getAllByRole("button", { name: "发起申诉" })[0].click();

  expect(screen.getByText("绩效申诉表")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
```

Expected:

- fail because the rebuilt modal flow is incomplete

- [ ] **Step 3: Implement four workflow modals**

Add:

- HR复核 modal
- 委员会审批 modal
- 面谈反馈 modal
- 发起申诉 / 处理申诉 modal pair

- [ ] **Step 4: Wire appeal and archive transitions**

Required transitions:

- `待反馈面谈` -> `已归档`
- `已归档` or `待反馈面谈` + appeal create -> `申诉中`
- appeal investigate -> `appealStatus = 调查中`
- appeal close -> `appealStatus = 已裁定`, `status = 已归档`

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
npm.cmd run build
```

Expected:

- tests pass
- build passes

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/styles.css src/performance/page.test.jsx
git commit -m "feat: add performance approval and appeal workflows"
```

---

### Task 7: Add OKR Release and Rule Summary Modals

**Files:**
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\styles.css`
- Test: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\page.test.jsx`

- [ ] **Step 1: Write the failing test for the OKR release entrypoint**

```jsx
test("opens the monthly OKR release modal from the page header", async () => {
  render(<App />);
  screen.getByRole("button", { name: "绩效中心" }).click();
  screen.getByRole("button", { name: "月度 OKR 下发" }).click();

  expect(screen.getByText("选择 OKR 考核维度")).toBeInTheDocument();
  expect(screen.getByText("选择发布人员")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
```

Expected:

- fail because header action/modal is not implemented

- [ ] **Step 3: Implement the OKR release modal and rule summary modal**

Features:

- month / scope / title / description fields
- dimension checklist
- standard editors
- release target list
- rule summary display with grade and bonus mapping

- [ ] **Step 4: Wire release behavior into review records**

When confirming release:

- update selected records to chosen month
- reset comments, scores, appeal state
- set status to `待确认`
- replace rows with chosen indicator set

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm.cmd test -- src/performance/page.test.jsx
npm.cmd run build
```

Expected:

- tests pass
- build passes

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/styles.css src/performance/page.test.jsx
git commit -m "feat: add monthly okr release and rule summary modals"
```

---

### Task 8: Cleanup, Verification, and Final UI Pass

**Files:**
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\App.jsx`
- Modify: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\styles.css`
- Test: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\logic.test.js`
- Test: `C:\Users\User\Desktop\KPI_BI\kpi-bi-demo\src\performance\page.test.jsx`

- [ ] **Step 1: Remove obsolete inline-editor-only state and CSS**

Delete or replace:

- `selectedReviewId` page-driving logic inside `PerformanceCenter`
- `绩效考核录入页` section markup
- unused performance list card styles that belonged to the old side-by-side workbench

- [ ] **Step 2: Refactor for clarity while keeping behavior unchanged**

Target:

- smaller helper render functions
- stable modal-open/close handlers
- clear separation of page state vs record mutation helpers

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm.cmd test
```

Expected:

- all tests pass

- [ ] **Step 4: Run production build**

Run:

```bash
npm.cmd run build
```

Expected:

- build passes
- new `dist/assets/*.css` and `dist/assets/*.js` files are emitted

- [ ] **Step 5: Manual verification**

Check in browser:

- `http://localhost:5173/`
- navigate to `绩效中心`
- verify filters, timeline, tabs, table, modals, and status transitions

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/styles.css src/performance/logic.js src/performance/seed.js src/performance/logic.test.js src/performance/page.test.jsx
git commit -m "feat: complete performance center html parity rebuild"
```

---

## Self-Review

### Spec coverage

- page shell, metrics, timeline, tabs, table: covered by Tasks 3-4
- detail/result/score/approval/interview/appeal/okr/rule modals: covered by Tasks 5-7
- real scoring and status logic: covered by Tasks 1-2 and reused through all UI tasks
- cleanup of old side-by-side editor: covered by Task 8

### Placeholder scan

- no `TODO` or `TBD`
- each task includes concrete files, commands, and expected outcomes

### Type consistency

- status labels are kept aligned with the approved spec
- scoring continues to use `rows` instead of introducing a conflicting second shape

