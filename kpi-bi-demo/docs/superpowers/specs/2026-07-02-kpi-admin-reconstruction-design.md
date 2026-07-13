# KPI Admin Reconstruction Design

**Date:** 2026-07-02

## Goal

Rebuild the entire `kpi-bi-demo` prototype from a BI-dashboard presentation style into a compact admin-operation prototype aligned with `ai-flow-product-prototype`.

## Design Direction

The new prototype should follow a restrained admin system language instead of a data-showcase BI language.

- Remove oversized hero regions, decorative gradients, dashboard-style stat walls, and visual storytelling sections.
- Use a light gray workspace background with white operational cards.
- Favor dense lists, compact search/filter blocks, right-aligned row actions, semantic status colors, and modal-driven edits.
- Keep the existing business modules and navigation structure, but redesign each page into a task-oriented admin workflow.

## Product Scope

The whole prototype is in scope.

- Workbench
- Projects
- Tasks
- Performance
- Weekly Reports
- Shared navigation, top bar, drawer, and modal patterns

## Core Page Shell

All major content areas should converge on a shared admin shell:

1. Page header with title, concise description, and optional toolbar actions.
2. Search/filter section-card when the page benefits from filtering.
3. Main section-card containing list, table-like rows, tab filters, or operational summary blocks.
4. Dialog-based detail, edit, review, and confirm flows.

The shell should visually echo the `ai-flow-product-prototype` guidance:

- app background near `#f7f7f7`
- white cards with subtle border
- compact spacing
- 13px body density for list/table content
- 14px stronger heading rows

## Information Architecture Mapping

### Workbench

The old CEO dashboard becomes an admin workbench instead of an executive cockpit.

- Purpose: surface pending operational work across modules.
- Regions:
  - summary counters in restrained compact cards
  - pending approvals list
  - risk project follow-up list
  - recently updated performance/weekly items
- Interaction:
  - each row links into the relevant module
  - no charts as primary structure

### Projects

Convert to a standard project-management page.

- Search fields:
  - project name
  - stage
  - risk level
  - owner
- Main content:
  - project list with progress, ROI, risk, owner, update time
  - row actions such as view, follow up, edit

### Tasks

Convert the current kanban preview into a standard task list page.

- Search fields:
  - task title
  - status
  - assignee
  - due date range
- Main content:
  - task rows grouped through status tabs or simple filters
  - row actions such as view, urge, mark complete

### Performance

Replace the BI analysis center with a performance review management page.

- Search fields:
  - employee name
  - role
  - review status
  - score range or department
- Main content:
  - dense review list
  - semantic score/status rendering
  - row action to open review dialog
- Dialog:
  - preserve editable KPI, OKR, leader score, and comment flow
  - align spacing and buttons to admin modal style

### Weekly Reports

Convert into a standard weekly report review page.

- Search fields:
  - employee name
  - team
  - submit status
  - submit time
- Main content:
  - report list with concise outcome summary
  - row actions such as view, remind, review

## Shared Interaction Rules

- Filled primary buttons are reserved for page-level create/submit actions.
- Row actions use compact text buttons.
- Status chips use semantic tones only:
  - `primary` for pending/in progress
  - `success` for complete/normal
  - `danger` for rejected/high risk/delete
  - `info` for draft/disabled/unknown
- Modals are the primary detail/edit surface.
- Drawer reminders remain available, but match the quieter admin styling.

## Data And Content Rules

- Keep Chinese operational labels concise and business-facing.
- Preserve the existing demo data model where possible.
- Add realistic admin metadata where needed, such as update time, status, owner, and source module.
- Replace descriptive BI copy with operational microcopy.

## Implementation Boundaries

- Stay within the existing React + CSS prototype structure.
- Do not introduce a new routing system.
- Do not recreate Vue `Pro*` components literally; instead, emulate their layout and interaction patterns in the current React prototype.
- Prefer a shared section-card/list/table visual language over page-specific visual systems.

## Success Criteria

The redesign is successful when:

1. No page still reads like a BI cockpit or marketing dashboard.
2. All modules feel like one admin system.
3. The user can complete each page's primary task through filters, lists, and dialogs.
4. Visual density, spacing, and action hierarchy match the new skill's admin guidance.
