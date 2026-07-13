---
name: ai-flow-product-prototype
description: Create product prototypes, page specs, interaction drafts, or frontend mockups that match the ai-fiow-admin project UI system. Use when product/design asks for admin-table pages, search/filter areas, ProTable lists, ProSearch forms, ProForm/ProFormItem forms, ProDialog dialogs, status tags, operations, layout, spacing, colors, or style-consistent prototypes for this project.
---

# AI Flow Product Prototype

## Purpose

Use this skill to turn a product requirement into a style-consistent admin prototype for `ai-fiow-admin`. Match the project's existing interaction model, layout density, Element Plus overrides, Tailwind utility style, and `Pro*` component conventions.

## Required Reference

Before drafting a prototype or implementation, read `references/ui-guidelines.md`. It contains the local layout, component, color, spacing, and interaction rules extracted from:

- `src/components/pro-form`
- `src/components/pro-form-item`
- `src/components/pro-search`
- `src/components/pro-table`
- `src/components/pro-dialog`
- `src/assets/css/el-reset.scss`
- `src/assets/css/public.scss`
- `src/assets/css/reset.scss`
- `src/view/table-manage/index.vue`
- representative pages under `src/view/table-manage`

## Workflow

1. Identify the product surface: list page, table workflow, dialog form, detail dialog, nested management dialog, or multi-state workflow.
2. Read `references/ui-guidelines.md` and map the requirement to the closest existing pattern.
3. Prefer the standard page shell:
   - outer page flex column, full height, `#f7f7f7` background
   - top `section-card` search block when filters are needed
   - main `section-card` table/content block, flex: 1, min-height: 0
   - `ProSearch` for filters, `ProTable` for lists, `ProDialog` for modal work
4. Define product content using project-native schema:
   - search fields as `{ label, key, type, placeholder, options, props }`
   - table columns as `{ label, prop, width/minWidth, fixed, customFlag, dataType }`
   - form fields as `ProForm` fields where possible
5. Keep text operational and concise. Use Chinese labels that match the business noun, such as `项目名称`, `状态`, `负责人`, `提交时间`, `操作`.
6. Include expected states: loading, empty table, pagination, validation, confirm loading, status tags, disabled/hidden actions when relevant.
7. Verify the output against the checklist below.

## Output Expectations

For a product prototype, provide enough detail for product and frontend to align:

- page structure and main regions
- search/filter fields and default behavior
- table columns, row actions, tab filters, and pagination
- dialog titles, widths, footer buttons, validation, and nested flows
- status labels and Element Plus tag types
- responsive or overflow behavior for table-heavy screens

For code implementation, use the existing components directly and follow existing file organization. Put table/search config in a sibling `tableConfig.js` or local config module when the page follows the table-management pattern.

## Checklist

- Use `ProSearch` instead of hand-building filter rows unless the requirement is genuinely custom.
- Use `ProTable` instead of raw `ElTable` for standard lists.
- Use `ProDialog` instead of raw `ElDialog` for modal forms, detail, preview, and nested list dialogs.
- Keep search compact: 3-5 columns, `label-width` around `70px`, default one row, expand only when fields exceed the visible count.
- Keep table content dense and scannable: 13px body text, bold 14px header cards, right-fixed operation column.
- Use link buttons inside table operations; reserve filled primary buttons for page/dialog toolbar actions.
- Use Element Plus status colors consistently: `primary` for pending/current, `success` for passed/normal, `danger` for rejected/delete, `info` for inactive/unknown.
- Avoid marketing-style layouts, large heroes, decorative gradients, or card-heavy dashboards that do not match the admin system.
