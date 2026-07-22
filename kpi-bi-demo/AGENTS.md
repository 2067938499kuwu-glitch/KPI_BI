# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

For the personnel KPI dashboard, preserve the existing blue brand palette. Use the user-provided dashboard reference for layout, density, card anatomy, information hierarchy, and the left-table/right-insight composition; do not copy the reference image's black-and-gold color palette.

For the integrated KPI_BI platform, use the current blue-and-white dashboard as the visual source of truth. Keep the sidebar information architecture compact, use grouped navigation, ledger-style business tables, lightweight drawers, and independent base-status plus exception tags across recruitment, topics, projects, reports, the workbench, and governance pages.

For the business dashboard, present recruitment conversion with a combined bar and line chart rather than a visual funnel: use bars for stage headcount and a line for adjacent conversion rate so scale and conversion changes can be compared directly.

On the business dashboard overview, do not show the operating-risk ledger. Use one start/end month range control and show a monthly project-consumption and personnel-consumption line chart. Aggregate project consumption from project name, episode count, cost, average episode cost, and creation time records; aggregate personnel consumption from monthly import batches containing username, video-generation cost, consumption count, total cost, enabled status, and balance.

In the business dashboard content-project ledger, do not show the participating-center column. Red Fruit work-data exports are imported through a separate operations entry point; this page only consumes that external import pool, normalizes and matches work names to project names, and places only successfully matched rows in the corresponding project's View drawer. Keep the source batch metadata and every original work field in a single-line, horizontally scrollable detail table.

Do not show participating-center information in the business-dashboard project detail drawer either; keep the drawer focused on project status, production mode, schedule, cost, personnel consumption, and matched operations data.

Keep the business-dashboard project ledger responsive: use proportional grid columns with readable minimum widths so the ledger fills available desktop width instead of leaving a fixed empty area on the right; retain horizontal scrolling only below the compact readable width.

Keep paired overview cards equal in height. Recruitment analysis must include complete per-job and per-recruiter breakdowns, including demand gaps, funnel workload, conversion results, and data-inclusion status.

On the personnel dashboard desktop layout, stretch the performance ranking card so its bottom edge aligns with the weekly submission overview, with pagination pinned to the card bottom.

In the performance ledger action column, match the approved compact text-link reference: all enabled workflow, support, appeal, and Details actions are borderless blue-purple text, while disabled actions remain muted gray. Keep the actions in the compact two-column layout and do not render outlined, filled, or orange mini-buttons there.

Keep one persistent, visibly labeled `全流程测试` performance record for 张小北. It must start at target issuance, use 江晚 as both direct and indirect reviewer so the available Leader role can exercise both review pages, include prefilled result evidence and scoring content, survive existing local storage through seed merging, and expose a reset action for repeatedly testing the normal, return, target-dispute, target-change, appeal, and ruling branches.

Model performance templates as a durable three-level hierarchy: dimension, multiple metric names within each dimension, and multiple editable performance-description or score-band rows within each metric. In the HR maintenance modal, follow the supplied HTML prototype: use a branded header, linked department/position scope bar, structure and total-weight toolbar, dark dimension headers, nested indicator cards and editable score-band rows, plus an employee-view preview and guarded save action. Carry the same hierarchy and score descriptions through HR template maintenance, Leader target issuance, score sheets, detail views, exports, and tests; do not flatten templates back to one requirement string per target.

When a Leader issues monthly performance targets from an HR template, treat the loaded template as an editable issuance draft. The Leader may customize dimension names, metric names, weights, and every score-band label, score range, and description. Do not show a separate monthly-target-requirement field in the issuance editor. These edits apply only to that issuance and must never overwrite the HR-maintained source template.

The Leader issuance draft must support complete structure editing: add and delete dimensions, metrics, and score-band rows, including items originally loaded from the HR template. Deletion changes only the current issuance draft and never removes content from the HR source template.

Do not show the generic key-risk card in the recruitment analysis view; let the recruitment operations chart use the full content width above the job and recruiter breakdowns.

For all KPI_BI pages, keep the approved visual system consistent: a fixed deep-navy sidebar (`#1f2d44` to `#17243a`), a light gray-blue workspace (`#f3f6fb`), blue-purple primary actions (`#6268df`), white cards with restrained borders and shadows, and a 4px blue-purple accent on page title cards. Do not reintroduce a white sidebar, bright royal-blue primary theme, black-and-gold styling, or large-area saturated card backgrounds.

For the SSC service center, expose all entries only to HR and CEO roles. Keep the user-provided page sandboxed in an iframe, but place its three top-level directories—organization roster, table management, and template management—in a dedicated `SSC服务中心` group in the main KPI_BI sidebar. Hide the standalone page's duplicate sidebar only when embedded; preserve its business panels and standalone fallback navigation.

For the SSC organization roster, use the user-provided Excel screenshot as the source of truth for the complete original field order, compact dark-blue spreadsheet header, horizontal scrolling, and frozen key identity columns. Do not add a separate company title band above the field headers, and do not reduce the roster to a simplified employee-summary table.

Treat SSC roster and business-table data as monthly editable snapshots: users must be able to switch month, inherit the nearest prior month as a starting point, edit the selected month inline, and export the selected month's version without overwriting historical months.

In SSC template management, every template card's Preview and Version actions must open visible, template-specific content. Preview shows the current template metadata and structure; Version shows the retained current and historical version records.

Rename SSC `人事模板管理` to `文件模板管理`. Template upload and editing must not offer `申请后下载`. When download permission is limited to designated departments or people, require the corresponding departments or people to be selected and show the saved scope. Every uploaded template must expose a working Edit action that reuses the upload form and allows an optional replacement file.

For recruitment, configure the number of interview rounds per job and require an interviewer plus interview time for every round after department approval. Only the final passed round advances to Offer. Remove the 15-day retention stage; after arrival, show internship, regularized, or departed status from the SSC roster as the source of truth.

After an interview round's interviewer and time are submitted, advance directly to the interview-result step. Do not insert a separate scheduled-interview or interview-completion-confirmation node before pass/fail feedback.

When creating a recruitment job, automatically display and retain the department leader based on the selected department. Uploading a candidate must create the application directly in `待部门确认`; do not show or persist a separate `待筛选` stage.

After a topic is submitted, keep its topic summary visible as a dedicated column in the topic ledger and as an explicitly labeled section in the topic detail drawer.

For the topic library, keep the supplied reference's decision-oriented structure: status segments for all, pending evaluation, evaluated, not-passed, and initiated topics; searchable topic and people fields; visible expected episode count, creation/update time, evaluator, and project outcome; and row-level actions that match the topic's current workflow stage. Do not show a separate topic-library versus review/initiation view switch, and keep ledger cell content on one line with ellipsis and horizontal scrolling when needed.

In every topic-ledger row, show exactly two actions in this order: Edit and Evaluate. Edit opens a working edit form and supports replacing, removing, and previewing the topic attachment; saving updates the topic directly without creating or displaying topic versions. Evaluate is enabled only for pending-evaluation or not-passed topics. Do not expose project-initiation buttons, forms, or direct navigation-to-initiation actions in the topic library. Approved topics enter the script library automatically. Do not show a keyword, genre, or people filter panel on the topic library. Keep creation time and modification time in separate ledger columns.

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

At the HR appeal-acceptance node, HR must choose either `受理` or `不受理`. Acceptance continues to HR appeal adjudication; non-acceptance requires a reason, ends the appeal, archives the record, and preserves the decision in status and operation logs.

For business detail drawers, keep workflow submission actions only in the fixed drawer footer. An inline form may collect and validate data, but must not render a second advance, confirm, reject, or create button inside the scrollable body.

For project and content coding, keep technical IDs separate from immutable business codes. Generate project codes as `PRJ-YYYYMMDD-NNNN`, script codes as `{projectCode}-SC-NNNN`, video codes as `{projectCode}-VD-NNNN`, and content version codes by appending `-VNN`. Scripts and videos are independent and only belong to the project; never create a required script-to-video relationship.

Only topics, projects, scripts, and videos may display business numbers in the UI. Keep all other technical IDs available for internal relationships and writes, but do not expose them in lists, drawers, workbench details, audit logs, imports, or supporting modules.

Keep the project detail content-code ledger read-only: do not show add-script, add-video, or per-row generate-version actions in the script and video code cards.

For internal project stages, use the labels `剧本`、`制作`、`剪辑`. Stage progress is read-only and synchronized automatically from system task completion; never show manual progress increment controls.

In project details, render the content-code ledger as one episode-based read-only table with script and video main codes. Show the first three episodes by default and provide one `查看全部` action for the complete episode list. Do not show version codes or per-episode status in this ledger.

On recruitment management, keep the global year/month/week period selector compact inside the page title card beside the primary action. Do not show a separate recruitment-period banner or the generic data-status block there; keep the active date range visible within the compact selector.

On the weekly report leadership overview, place the personnel-report entry directly beside the team selector. The personnel-report drawer must provide its own visible reporting-period filter and keep the period context synchronized across its heading, person detail, and scope summary.

On recruitment management, do not show the recruitment-period control in the page header. In the recruitment daily-report view, use a concise `日报` card grouped by recruiter, let users inspect each recruiter's current recruiting data and complete report history, and do not show data-difference labels or review prompts. Daily-report evidence must be uploaded as actual image files with visible thumbnails and an image-viewing interaction instead of entering a screenshot count manually.

In recruitment management, place independent time filters inside the `岗位与需求` and `简历库 / 候选人` directories. Each directory filter must support year, month, and exact-day modes, update that directory's result count and empty state, and preserve its selection when switching tabs. Keep these filters out of the page header and out of the recruitment daily-report directory.

Recruitment daily reports do not collect or display reply count, resumes acquired, valid resumes, or invitations. Exclude those four legacy fields from daily-report forms, person-detail metrics, history summaries, recruitment funnels, and recruiter-level operating statistics. Use the supported sequence `打招呼` → `面试` → `通过` → `Offer发放` → `Offer接受` → `入职`; legacy stored values for the removed fields must not affect current statistics.

In the content-and-project navigation, merge the former `项目立项` and `项目总览` entries into one `项目管理` entry. Show the overview and initiation workflow together on one page, reusing one project ledger that includes the project basics, production progress, costs, and personnel-configuration status. Keep `任务列表` as an independent navigation entry.

Insert `剧本库` between `选题库` and `项目管理`. Every evaluated-and-approved topic enters the script library, where the topic submitter or writer can upload either a complete script or episode-level files. Keep all records after project initiation, retain upload history, and resolve overlapping full-script and episode uploads by latest upload time.

For script-library uploads, the newer confirmed rule supersedes the earlier full-script versus episode-file interaction: accept only `.docx`, split the uploaded document into episode content using standard episode headings first and AI-assisted recognition as fallback, and require an editable preview before confirmation. “一卡” is only a business partition term meaning each 10-episode range; never render it as a UI card. Confirmed uploads immediately replace only matching episodes, preserve other episodes, and generate one complete read-only history snapshot for every affected 10-episode range. Historical versions are visible only to users with script-edit permission and do not support compare, restore, or online editing. Block empty, duplicate, unordered, unrecognized, or out-of-range episodes, and reject confirmation if an affected 10-episode range changed after preview.

Project initiation for an approved topic starts only from the script library. Clicking Initiate navigates to the existing project-management initiation form, pre-fills the topic and current script, and lets the initiator choose internal or external production there. Replacing the script in that project form must append and synchronize a new shared script-library version.

The topic library is limited to topic creation, editing, evaluation, and read-only downstream project association. It must not contain any project-initiation entry, initiation form state, or direct project-creation data path.

The topic status domain contains exactly `待评估`、`已评估`、`未通过`. Evaluating a topic successfully changes it to `已评估` and makes it immediately available in the script library. Creating or deleting a linked project must never change that topic status; project linkage remains separate read-only downstream information.

Do not add a separate script-review approval node. A complete upload may proceed to initiation; an initiator may return it with a required reason. Internal projects may append script versions directly with notifications, while external-project script changes require initiator confirmation before supplier notification.

Keep every project-management ledger cell on one visual line. Pair related values horizontally, truncate overflow with ellipsis, and retain horizontal scrolling below the readable desktop width instead of stacking secondary information beneath the primary value.

In the project-management ledger, show exactly these columns in order: project name, project code, source (topic library or self-created), production mode (internal or external), genre, owner, status, episode count, expected completion date, overall progress, cost execution, and actions. Keep exactly two row actions: Details and Delete; place personnel configuration inside the project detail drawer instead of the ledger action column.

Keep project details read-only until the user explicitly selects Edit Project. The New Project and Edit Project drawers must share the same complete initiation form: project name, genre, episode count, total and per-episode budget, owner, planned start and completion dates, role-based participant episode ranges and durations for writer, production, editing, and producer, optional per-role reviewer configuration, and script upload.

Project details must expose the complete project record, including source, production mode, budget and schedule data, uploaded script, and read-only role-based personnel allocation. Personnel and project data become editable only through Edit Project.

External-production projects do not participate in progress statistics. Show no progress percentage, progress bar, stage-progress calculation, or progress anomaly for them; use only the planned start date and expected completion date as their schedule indicators.
