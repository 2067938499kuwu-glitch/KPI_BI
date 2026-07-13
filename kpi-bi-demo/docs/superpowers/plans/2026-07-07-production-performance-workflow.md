# Production Performance Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the performance center from a template display prototype into a realistic workflow ledger where actions advance statuses and create operation records.

**Architecture:** Add a workflow state machine to `src/performance/logic.js`, seed reviews with workflow logs and production statuses, then adapt `src/App.jsx` so row actions open an operation dialog, submit notes, advance status, and render operation history. Keep the existing React prototype and CSS system.

**Tech Stack:** React 19, Vite 6, Vitest 4, Testing Library, plain CSS.

## Global Constraints

- Preserve岗位模板化 and existing score calculation.
- Status must be action-driven: 目标待下发 -> 待员工确认 -> 执行中 -> 待结果录入 -> 待一级评分 -> 待二级复核 -> 待HR复核 -> 待委员会审批 -> 待面谈反馈 -> 已归档.
- Actions must append operation logs with action title, operator, time, note, from status, and to status.
- UI must remain a compact admin table workflow, not a marketing dashboard.

---

## Tasks

### Task 1: Workflow State Machine

**Files:** `src/performance/logic.js`, `src/performance/logic.test.js`

- [ ] Write tests for `getWorkflowAction`, `applyWorkflowAction`, and log append behavior.
- [ ] Verify tests fail because helpers/statuses are missing.
- [ ] Implement workflow statuses, action map, and status mutation helper.
- [ ] Verify logic tests pass.

### Task 2: Production Seed Records

**Files:** `src/performance/seed.js`, `src/performance/logic.test.js`

- [ ] Test seed records contain production statuses, last action metadata, and operation logs.
- [ ] Verify test fails against current seed.
- [ ] Add production status spread and readable logs to seed records.
- [ ] Verify logic tests pass.

### Task 3: Action Dialog and Status Mutation UI

**Files:** `src/App.jsx`, `src/performance/page.test.jsx`

- [ ] Test clicking “下发目标” opens a dialog, submitting a note changes status to “待员工确认”, and writes a log.
- [ ] Verify page test fails.
- [ ] Add operation dialog state, generic dialog form, submit handler using `applyWorkflowAction`, and row action buttons from `getWorkflowAction`.
- [ ] Verify page tests pass.

### Task 4: Operation History and Production Layout

**Files:** `src/App.jsx`, `src/styles.css`, `src/performance/page.test.jsx`

- [ ] Test the selected detail includes “操作记录” and timeline/log content.
- [ ] Verify test fails if log panel is absent.
- [ ] Add operation history, current pending action, last operation time, and tighter table columns.
- [ ] Verify page tests pass.

### Task 5: Final Verification

**Files:** all changed files

- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run build`.
- [ ] Keep or restart Vite dev server and report local URL.
