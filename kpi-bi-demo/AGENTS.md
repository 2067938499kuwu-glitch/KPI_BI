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

For recruitment, configure the number of interview rounds per job and require an interviewer plus interview time for every round after department approval. Only the final passed round advances to Offer. Remove the 15-day retention stage; after arrival, show internship, regularized, or departed status from the SSC roster as the source of truth.

For recruitment decisions, capture a structured reason category plus a specific explanation for resume rejection, interview failure, and Offer rejection. The recruitment dashboard must analyze all three loss reasons and summarize interview assignment, completion, outcome, and pass rate by interviewer.

On the unified workbench, do not show the subordinate-progress card. Keep the cross-business task card and business-risk card taller and equal in height on the desktop layout, with their bottom edges aligned.

For internal short-drama projects, collect manpower, compute, and traffic-acquisition costs in project production. Treat their sum as the project's actual cost and surface both the total and the three-part breakdown in the business dashboard.

When changing a business interaction, review and update the complete downstream flow rather than only the commented control. Keep entry forms, validation, stored data, linked ledgers, detail views, status feedback, and tests coherent; ask the user before making a decision that would materially change the business rule.
