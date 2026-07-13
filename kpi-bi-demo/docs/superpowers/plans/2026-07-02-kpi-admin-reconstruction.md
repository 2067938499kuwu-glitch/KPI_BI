# KPI Admin Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the full KPI prototype into a unified admin-style operational system that follows the `ai-flow-product-prototype` interaction and layout rules.

**Architecture:** Keep the existing single-screen React prototype structure, but replace page-specific BI/dashboard composition with a shared admin shell built from compact filters, dense list sections, restrained metric cards, and modal-driven editing. Reuse the current local mock data, then refactor page rendering so every module follows one visual and behavioral language.

**Tech Stack:** React 19, Vite 6, plain CSS, Phosphor icons, Recharts (only where still justified after redesign)

---

### Task 1: Restructure Shared App Shell

**Files:**
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/App.jsx`
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/styles.css`

- [ ] **Step 1: Add the shared admin page wrapper helpers in `src/App.jsx`**

```jsx
function PageIntro({ title, description, actions, chips }) {
  return (
    <div className="page-intro">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="page-intro__side">
        {actions ? <div className="page-intro__actions">{actions}</div> : null}
        {chips?.length ? (
          <div className="page-intro__chips">
            {chips.map((chip) => <span key={chip}>{chip}</span>)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterBar({ fields, actions }) {
  return (
    <section className="section-card section-card--filter">
      <div className="filter-grid">
        {fields}
      </div>
      <div className="filter-actions">
        {actions}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace the existing BI-oriented page header usage with the shared admin wrapper**

```jsx
<div className="content">
  <div className="page-header">
    <div className="page-header__crumbs">
      <span>绩效平台</span>
      <strong>/</strong>
      <span>{activeRoleMeta?.label}</span>
      <strong>/</strong>
      <span>{pageTitle}</span>
    </div>
    <PageIntro
      title={pageTitle}
      description="当前原型已切换为后台运营工作台风格，支持筛选、列表查看与弹窗处理。"
      chips={["后台原型", "可交互演示", "统一 admin 风格"]}
    />
  </div>
  {/** page body continues here */}
</div>
```

- [ ] **Step 3: Add the shared shell styles in `src/styles.css`**

```css
.content {
  padding: 20px 24px 24px;
  background: #f7f7f7;
}

.page-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
}

.page-intro h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.page-intro p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #606266;
}

.page-intro__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.page-intro__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.page-intro__chips span {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #e4e7ed;
  border-radius: 999px;
  background: #fff;
  color: #909399;
  font-size: 12px;
  line-height: 28px;
}

.section-card--filter {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.filter-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
```

- [ ] **Step 4: Run the production build to catch shell regressions**

Run: `npm run build`
Expected: `vite build` completes successfully and outputs the production bundle without JSX or CSS errors.

- [ ] **Step 5: Commit the shell refactor**

```bash
git add src/App.jsx src/styles.css
git commit -m "feat: introduce shared admin page shell"
```

### Task 2: Replace BI Dashboard Workbench With Admin Overview

**Files:**
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/App.jsx`
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/styles.css`

- [ ] **Step 1: Replace `ExecutiveDashboard` and `SimpleWorkbench` with one admin-style workbench page**

```jsx
function WorkbenchPage({ goPage, reviews }) {
  const pendingReviews = reviews.filter((item) => item.status === "待评估");
  const pendingWeekly = reports.filter((item) => item.status !== "已提交");
  const highRiskProjects = projects.filter((item) => item.risk === "高");

  return (
    <div className="admin-page">
      <PageIntro
        title="工作台"
        description="集中处理经营跟进、绩效评估、项目风险与周报批阅。"
        actions={<button className="primary-btn" type="button" onClick={() => goPage("tasks")}>进入任务中心</button>}
        chips={["待处理优先", "跨模块联动", "列表驱动"]}
      />
      <section className="admin-overview-grid">
        <div className="mini-card"><span>待处理任务</span><strong>8</strong><small className="mini-card__note">需本周完成</small></div>
        <div className="mini-card"><span>待评估绩效</span><strong>{pendingReviews.length}</strong><small className="mini-card__note">支持直接进入打分</small></div>
        <div className="mini-card"><span>高风险项目</span><strong>{highRiskProjects.length}</strong><small className="mini-card__note">需要负责人跟进</small></div>
        <div className="mini-card"><span>待批阅周报</span><strong>{pendingWeekly.length}</strong><small className="mini-card__note">按提交状态排序</small></div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Add compact operational lists under the workbench cards**

```jsx
<div className="admin-two-column">
  <SectionCard title="待跟进事项" action="查看全部">
    <div className="admin-list">
      {[
        { title: "绩效评估待处理", meta: `${pendingReviews.length} 人待评估`, page: "performance" },
        { title: "高风险项目跟进", meta: `${highRiskProjects.length} 个项目需关注`, page: "projects" },
        { title: "周报待批阅", meta: `${pendingWeekly.length} 条待处理记录`, page: "weekly" },
      ].map((item) => (
        <button key={item.title} className="admin-list__item" type="button" onClick={() => goPage(item.page)}>
          <div><strong>{item.title}</strong><small>{item.meta}</small></div>
          <span>进入</span>
        </button>
      ))}
    </div>
  </SectionCard>
</div>
```

- [ ] **Step 3: Remove the CEO-only BI branch and point `workbench` to `WorkbenchPage`**

```jsx
{activePage === "workbench" ? (
  <WorkbenchPage goPage={goPage} reviews={reviews} />
) : null}
```

- [ ] **Step 4: Add the new workbench styles and remove dependence on BI gradients**

```css
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.admin-two-column {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 12px;
  border: 1px solid #edf2f8;
  border-radius: 10px;
  background: #fff;
  text-align: left;
}
```

- [ ] **Step 5: Run the production build and verify the workbench route still renders**

Run: `npm run build`
Expected: build completes successfully after removing `ExecutiveDashboard` and `SimpleWorkbench`.

- [ ] **Step 6: Commit the workbench redesign**

```bash
git add src/App.jsx src/styles.css
git commit -m "feat: replace dashboard workbench with admin overview"
```

### Task 3: Rebuild Projects, Tasks, And Weekly Pages As Standard Admin Pages

**Files:**
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/App.jsx`
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/styles.css`

- [ ] **Step 1: Rewrite `ProjectsPage` using filter block plus dense row list**

```jsx
function ProjectsPage() {
  return (
    <div className="admin-page">
      <PageIntro
        title="项目中心"
        description="查看项目进度、收益、风险等级与负责人跟进情况。"
        actions={<button className="primary-btn" type="button">新建项目</button>}
        chips={["项目台账", "风险跟踪"]}
      />
      <FilterBar
        fields={
          <>
            <label className="field"><span>项目名称</span><input placeholder="请输入项目名称" /></label>
            <label className="field"><span>阶段</span><select defaultValue=""><option value="">全部</option><option>制作中</option><option>待上线</option><option>筹备中</option></select></label>
            <label className="field"><span>风险等级</span><select defaultValue=""><option value="">全部</option><option>高</option><option>中</option><option>低</option></select></label>
            <label className="field"><span>负责人</span><input placeholder="请输入负责人" /></label>
          </>
        }
        actions={
          <>
            <button className="primary-btn" type="button">查询</button>
            <button className="ghost-chip" type="button">重置</button>
          </>
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Replace the task kanban with a task table-style admin list**

```jsx
function TasksPage() {
  const taskRows = [
    { id: "t1", name: "补齐项目周会纪要", status: "待处理", owner: "张艺谦", due: "2026-07-03" },
    { id: "t2", name: "确认绩效评估意见", status: "进行中", owner: "王芳", due: "2026-07-04" },
    { id: "t3", name: "跟进虚拟制片平台风险", status: "待审核", owner: "刘雨桐", due: "2026-07-05" },
  ];
  return (
    <div className="admin-page">
      <PageIntro title="任务中心" description="统一查看任务处理状态、负责人和到期时间。" chips={["任务列表", "状态驱动"]} />
      <FilterBar
        fields={
          <>
            <label className="field"><span>任务名称</span><input placeholder="请输入任务名称" /></label>
            <label className="field"><span>状态</span><select defaultValue=""><option value="">全部</option><option>待处理</option><option>进行中</option><option>待审核</option><option>已完成</option></select></label>
            <label className="field"><span>负责人</span><input placeholder="请输入负责人" /></label>
            <label className="field"><span>截止日期</span><input type="date" /></label>
          </>
        }
        actions={<><button className="primary-btn" type="button">查询</button><button className="ghost-chip" type="button">重置</button></>}
      />
      <SectionCard title="任务列表" action="共 3 条">
        <div className="report-table">
          <div className="report-table__head report-table__head--task"><span>任务名称</span><span>状态</span><span>负责人</span><span>截止时间</span><span>操作</span></div>
          {taskRows.map((item) => <div key={item.id} className="report-table__row report-table__row--task"><span>{item.name}</span><span>{item.status}</span><span>{item.owner}</span><span>{item.due}</span><span>查看 / 完成</span></div>)}
        </div>
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `WeeklyPage` into a report review management page**

```jsx
function WeeklyPage() {
  return (
    <div className="admin-page">
      <PageIntro title="周报中心" description="按提交状态查看周报，并进行催办或批阅。" chips={["周报记录", "批阅处理"]} />
      <FilterBar
        fields={
          <>
            <label className="field"><span>姓名</span><input placeholder="请输入姓名" /></label>
            <label className="field"><span>团队</span><input placeholder="请输入团队" /></label>
            <label className="field"><span>状态</span><select defaultValue=""><option value="">全部</option><option>已提交</option><option>待批阅</option><option>草稿</option></select></label>
            <label className="field"><span>提交日期</span><input type="date" /></label>
          </>
        }
        actions={<><button className="primary-btn" type="button">查询</button><button className="ghost-chip" type="button">重置</button></>}
      />
    </div>
  );
}
```

- [ ] **Step 4: Add shared field and task-table styles**

```css
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
}

.field input,
.field select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
}

.report-table__head--task,
.report-table__row--task {
  grid-template-columns: 1.6fr 0.8fr 0.8fr 0.9fr 0.8fr;
}
```

- [ ] **Step 5: Run the production build after the page rewrites**

Run: `npm run build`
Expected: the project builds successfully with the rewritten project, task, and weekly pages.

- [ ] **Step 6: Commit the operational page rewrites**

```bash
git add src/App.jsx src/styles.css
git commit -m "feat: rebuild project task and weekly admin pages"
```

### Task 4: Rebuild Performance Center As Admin Review Management

**Files:**
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/App.jsx`
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/styles.css`

- [ ] **Step 1: Replace the BI performance summary with a list-first admin page**

```jsx
function PerformanceCenter({ reviews, openReview }) {
  const [focus, setFocus] = useState("all");
  const filtered = reviews.filter((item) => focus === "pending" ? item.status === "待评估" : focus === "done" ? item.status === "已完成" : true);

  return (
    <div className="admin-page">
      <PageIntro
        title="绩效中心"
        description="按人员、角色与评估状态查看绩效记录，并直接进入评估弹窗。"
        actions={<button className="primary-btn" type="button">发起评估</button>}
        chips={["绩效列表", "弹窗评估"]}
      />
      <FilterBar
        fields={
          <>
            <label className="field"><span>员工姓名</span><input placeholder="请输入员工姓名" /></label>
            <label className="field"><span>岗位</span><input placeholder="请输入岗位" /></label>
            <label className="field"><span>状态</span><select defaultValue=""><option value="">全部</option><option>待评估</option><option>已完成</option></select></label>
            <label className="field"><span>关注分组</span><select value={focus} onChange={(event) => setFocus(event.target.value)}><option value="all">全部</option><option value="pending">待评估</option><option value="done">已完成</option></select></label>
          </>
        }
        actions={<><button className="primary-btn" type="button">查询</button><button className="ghost-chip" type="button">重置</button></>}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add a dense review table with status tags and link-style operations**

```jsx
<SectionCard title="绩效评估列表" action={`共 ${filtered.length} 条`}>
  <div className="report-table">
    <div className="report-table__head report-table__head--review-admin">
      <span>员工姓名</span>
      <span>岗位</span>
      <span>KPI</span>
      <span>OKR</span>
      <span>综合得分</span>
      <span>状态</span>
      <span>操作</span>
    </div>
    {filtered.map((item) => (
      <div key={item.id} className="report-table__row report-table__row--review-admin">
        <span>{item.employee}</span>
        <span>{item.role}</span>
        <span>{item.kpi}</span>
        <span>{item.okr}</span>
        <span>{calcScore(item)}</span>
        <span>{item.status}</span>
        <span>
          <button className="table-link" type="button" onClick={() => openReview(item.id)}>评估</button>
        </span>
      </div>
    ))}
  </div>
</SectionCard>
```

- [ ] **Step 3: Tighten the review modal to match the admin dialog style**

```jsx
<div className="modal modal--admin" onClick={(event) => event.stopPropagation()}>
  <div className="modal__header modal__header--admin">
    <div>
      <strong>{review.employee} 绩效评估</strong>
      <span>维护 KPI、OKR、Leader 评分与评语。</span>
    </div>
    <button className="icon-btn" onClick={onClose} type="button"><X size={18} /></button>
  </div>
</div>
```

- [ ] **Step 4: Add the admin review table and dialog styles**

```css
.report-table__head--review-admin,
.report-table__row--review-admin {
  grid-template-columns: 0.9fr 0.9fr 0.5fr 0.5fr 0.7fr 0.7fr 0.7fr;
}

.table-link {
  color: #409eff;
  font-size: 13px;
}

.modal--admin {
  width: 720px;
  border-radius: 8px;
}

.modal__header--admin {
  padding-bottom: 12px;
  border-bottom: 1px solid #d9d9d9;
}
```

- [ ] **Step 5: Run the production build after the performance rewrite**

Run: `npm run build`
Expected: build completes successfully with the new performance list layout and updated review dialog.

- [ ] **Step 6: Commit the performance-center rewrite**

```bash
git add src/App.jsx src/styles.css
git commit -m "feat: rebuild performance center as admin review page"
```

### Task 5: Remove Leftover BI Styles And Final Polish

**Files:**
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/App.jsx`
- Modify: `C:/Users/User/Desktop/KPI_BI/kpi-bi-demo/src/styles.css`

- [ ] **Step 1: Remove BI-only copy and sidebar references**

```jsx
<div className="sidebar__footer">
  <div className="promo-card">
    <span>当前版本</span>
    <p>整站已统一为后台运营原型风格</p>
  </div>
</div>
```

- [ ] **Step 2: Delete unused BI class usage from `src/App.jsx`**

```jsx
// Remove references to:
// bi-page
// bi-hero
// executive-*
// analysis-*
```

- [ ] **Step 3: Delete unused BI CSS blocks from `src/styles.css` and keep only admin styling**

```css
/* Remove the full BI sections:
.bi-page {}
.bi-hero {}
.bi-page--executive {}
.bi-page--performance {}
.executive-* {}
.analysis-* {}
*/
```

- [ ] **Step 4: Run final production verification**

Run: `npm run build`
Expected: the project builds successfully after removing all BI-specific JSX and CSS.

- [ ] **Step 5: Run a quick local smoke-check**

Run: `npm run dev`
Expected: the local app starts on port `5173`, the sidebar navigates between all five pages, and the performance review modal still opens and saves.

- [ ] **Step 6: Commit the final cleanup**

```bash
git add src/App.jsx src/styles.css
git commit -m "refactor: remove legacy bi presentation styles"
```
