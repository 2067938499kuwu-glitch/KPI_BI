# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

For the personnel KPI dashboard, preserve the existing blue brand palette. Use the user-provided dashboard reference for layout, density, card anatomy, information hierarchy, and the left-table/right-insight composition; do not copy the reference image's black-and-gold color palette.

For the integrated KPI_BI platform, use the current blue-and-white dashboard as the visual source of truth. Keep the sidebar information architecture compact, use grouped navigation, ledger-style business tables, lightweight drawers, and independent base-status plus exception tags across recruitment, topics, projects, reports, the workbench, and governance pages.

For the business dashboard, present recruitment conversion with a combined bar and line chart rather than a visual funnel: use bars for stage headcount and a line for adjacent conversion rate so scale and conversion changes can be compared directly.

Keep paired overview cards equal in height. Recruitment analysis must include complete per-job and per-recruiter breakdowns, including demand gaps, funnel workload, conversion results, and data-inclusion status.

On the personnel dashboard desktop layout, stretch the performance ranking card so its bottom edge aligns with the weekly submission overview, with pagination pinned to the card bottom.

Do not show the generic key-risk card in the recruitment analysis view; let the recruitment operations chart use the full content width above the job and recruiter breakdowns.

For all KPI_BI pages, keep the approved visual system consistent: a fixed deep-navy sidebar (`#1f2d44` to `#17243a`), a light gray-blue workspace (`#f3f6fb`), blue-purple primary actions (`#6268df`), white cards with restrained borders and shadows, and a 4px blue-purple accent on page title cards. Do not reintroduce a white sidebar, bright royal-blue primary theme, black-and-gold styling, or large-area saturated card backgrounds.

For the SSC service center, expose all entries only to HR and CEO roles. Keep the user-provided page sandboxed in an iframe, but place its three top-level directories—organization roster, table management, and template management—in a dedicated `SSC服务中心` group in the main KPI_BI sidebar. Hide the standalone page's duplicate sidebar only when embedded; preserve its business panels and standalone fallback navigation.

For the SSC organization roster, use the user-provided Excel screenshot as the source of truth for the complete original field order, compact dark-blue spreadsheet header, horizontal scrolling, and frozen key identity columns. Do not add a separate company title band above the field headers, and do not reduce the roster to a simplified employee-summary table.

Treat SSC roster and business-table data as monthly editable snapshots: users must be able to switch month, inherit the nearest prior month as a starting point, edit the selected month inline, and export the selected month's version without overwriting historical months.

In SSC template management, every template card's Preview and Version actions must open visible, template-specific content. Preview shows the current template metadata and structure; Version shows the retained current and historical version records.

For recruitment, configure the number of interview rounds per job and require an interviewer plus interview time for every round after department approval. Only the final passed round advances to Offer. Remove the 15-day retention stage; after arrival, show internship, regularized, or departed status from the SSC roster as the source of truth.

After an interview round's interviewer and time are submitted, advance directly to the interview-result step. Do not insert a separate scheduled-interview or interview-completion-confirmation node before pass/fail feedback.

When creating a recruitment job, automatically display and retain the department leader based on the selected department. Uploading a candidate must create the application directly in `待部门确认`; do not show or persist a separate `待筛选` stage.

After a topic is submitted, keep its topic summary visible as a dedicated column in the topic ledger and as an explicitly labeled section in the topic detail drawer.

Topic summaries are long-form plain text. Let the create-topic textarea grow with multi-paragraph content, show a live character count, keep a two-line ledger preview, and provide explicit expand/collapse controls for long summaries in the detail drawer.

For recruitment decisions, capture a structured reason category plus a specific explanation for resume rejection, interview failure, and Offer rejection. The recruitment dashboard must analyze all three loss reasons and summarize interview assignment, completion, outcome, and pass rate by interviewer.

For the recruitment resume library, keep one candidate master record while showing every job application and its independent status in the ledger. Make unsuitable, Offer, pending-entry, and SSC employment outcomes directly visible and filterable instead of showing only the candidate's first application.

Use one global year, month, or natural-week period selector for recruitment management. Apply the selected period consistently to summary metrics, job demand, candidate applications, SSC arrival counts, and recruitment daily reports, and always show the active date range.

On the unified workbench, do not show the subordinate-progress card. Keep the cross-business task card and business-risk card taller and equal in height on the desktop layout, with their bottom edges aligned.

On the unified workbench, keep the page title area focused on its heading and description. Do not show the data-status block or the `查看今日待办` action in the upper-right corner.

On the unified workbench, do not show task priority in either the cross-business task list or the task-detail drawer; keep deadline, status, and exception markers as the visible urgency signals.

For internal short-drama projects, collect manpower, compute, and traffic-acquisition costs in project production. Treat their sum as the project's actual cost and surface both the total and the three-part breakdown in the business dashboard.

For project initiation and task execution, configure岗位人员 in the project-initiation ledger, materialize one task per assigned role, and synchronize each dispatched task to both the task list and the assignee's unified workbench. Task acceptance, progress, submission, and completion must write back to the same project task assignment and its mapped project stage.

In the business dashboard's project overview ledger, show the project's personnel consumption amount directly in the detail drawer opened by the View action. Use the internal project's manpower cost as the source; external projects remain marked as not separately accounted for.

When changing a business interaction, review and update the complete downstream flow rather than only the commented control. Keep entry forms, validation, stored data, linked ledgers, detail views, status feedback, and tests coherent; ask the user before making a decision that would materially change the business rule.

For business detail drawers, keep workflow submission actions only in the fixed drawer footer. An inline form may collect and validate data, but must not render a second advance, confirm, reject, or create button inside the scrollable body.

For project and content coding, keep technical IDs separate from immutable business codes. Generate project codes as `PRJ-YYYYMMDD-NNNN`, script codes as `{projectCode}-SC-NNNN`, video codes as `{projectCode}-VD-NNNN`, and content version codes by appending `-VNN`. Scripts and videos are independent and only belong to the project; never create a required script-to-video relationship.

Only topics, projects, scripts, and videos may display business numbers in the UI. Keep all other technical IDs available for internal relationships and writes, but do not expose them in lists, drawers, workbench details, audit logs, imports, or supporting modules.

Keep the project detail content-code ledger read-only: do not show add-script, add-video, or per-row generate-version actions in the script and video code cards.

For internal project stages, use the labels `剧本`、`制作`、`剪辑`. Stage progress is read-only and synchronized automatically from system task completion; never show manual progress increment controls.

Keep project content-code cards compact and status-free. Each script or video card must provide a `查看全部` action that opens a complete preview of episode main codes and version codes without showing per-episode current status.

On recruitment management, keep the global year/month/week period selector compact inside the page title card beside the primary action. Do not show a separate recruitment-period banner or the generic data-status block there; keep the active date range visible within the compact selector.

On the weekly report leadership overview, place the personnel-report entry directly beside the team selector. The personnel-report drawer must provide its own visible reporting-period filter and keep the period context synchronized across its heading, person detail, and scope summary.

On recruitment management, do not show the recruitment-period control in the page header. In the recruitment daily-report view, use a concise `日报` card grouped by recruiter, let users inspect each recruiter's current recruiting data and complete report history, and do not show data-difference labels or review prompts. Daily-report evidence must be uploaded as actual image files with visible thumbnails and an image-viewing interaction instead of entering a screenshot count manually.

In recruitment management, place independent time filters inside the `岗位与需求` and `简历库 / 候选人` directories. Each directory filter must support year, month, and exact-day modes, update that directory's result count and empty state, and preserve its selection when switching tabs. Keep these filters out of the page header and out of the recruitment daily-report directory.

Recruitment daily reports do not collect or display reply count, resumes acquired, valid resumes, or invitations. Exclude those four legacy fields from daily-report forms, person-detail metrics, history summaries, recruitment funnels, and recruiter-level operating statistics. Use the supported sequence `打招呼` → `面试` → `通过` → `Offer发放` → `Offer接受` → `入职`; legacy stored values for the removed fields must not affect current statistics.
