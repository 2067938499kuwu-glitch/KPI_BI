# ai-fiow-admin UI Guidelines

## System Character

Build quiet, dense admin interfaces for repeated operational work. The project favors compact filters, full-height table pages, clear right-aligned actions, and white cards over a light gray workspace background.

Base stack:

- Vue 3 + Element Plus
- Tailwind utilities with `tw-` prefix
- Lucide icons for small icon buttons
- PingFang SC font via `reset.scss`
- project components: `ProSearch`, `ProTable`, `ProForm`, `ProFormItem`, `ProDialog`

## Page Shell

Use this layout for table-management pages:

```vue
<section class="feature-page">
  <section class="feature-page__search section-card">
    <ProSearch ... />
  </section>

  <section class="feature-page__table section-card">
    <div class="table-wrap">
      <ProTable ... />
    </div>
  </section>
</section>
```

Recommended page CSS:

```scss
.feature-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #303133;
  background: #f7f7f7;
}

.feature-page__search {
  flex-shrink: 0;
  padding: 16px 18px;
  border: 1px solid #edf2f8;
  border-radius: 14px;
}

.feature-page__table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 16px 18px 18px;
  border: 1px solid #edf2f8;
  border-radius: 16px;
  background: #ffffff;
}

.table-wrap {
  flex: 1;
  min-height: 0;
}
```

The app frame in `src/view/table-manage/index.vue` uses a header + left menu + route tabs layout. Page content lives inside a gray router stage with `margin: 0 10px 10px`, rounded 8px, full-height route pages, and hidden overflow.

## Global Style Tokens

Use these values unless a local component already defines a value:

- app background: `#f7f7f7`
- card/table background: `#ffffff`
- primary Element Plus blue: `#409eff`
- main text: `#303133` or `#333`
- strong table/header text: `#000000`
- secondary text: `#606266`
- muted text: `#909399`
- subtle border: `#edf2f8`, `#e4e7ed`, `#ebeef5`, `#f3f3f3`
- table header chip background: `#eff1f3`
- striped row background: `#f4f4f4`
- table hover background: `#eceeff`
- dialog header border: `#d9d9d9`

Base typography:

- body/app base is PingFang SC, `16px`, line-height `1.5`
- admin container commonly renders `font-size: 12px`
- dialog body: `12px`
- table body: `13px`
- table header: `14px`, bold
- dialog title: `14px`, bold

## ProSearch

Use `ProSearch` for filter areas.

Defaults from the component:

- `cols`: 5 by default; business pages often use 3 or 4
- `defaultRows`: 1
- `labelWidth`: `70px`
- search button text: `查询`
- reset button text: `重置`
- fields use a grid with `tw-gap-x-4`
- form-item bottom margin is forced to `0`
- non-input fields trigger search on change
- Enter triggers search
- expand/collapse uses `展开` / `收起` with a chevron icon

Search field shape:

```js
{
  label: '项目名称',
  key: 'projectName',
  type: 'input',
  placeholder: '请输入项目名称',
  props: { clearable: true },
}
```

Supported field types come from `ProFormItem`: `input`, `password`, `select`, `cascader`, `radio`, `daterange`, `date`, `textarea`, `number`, `switch`, `file`, `checkbox-group`, `component`, `custom`.

Prefer short labels. Use `名称`, `负责人`, `状态`, `时间`, `题材`, `关键词` where possible. Use `daterange` for date filters with `startPlaceholder: '开始时间'`, `endPlaceholder: '结束时间'`, and `props.valueFormat: 'YYYY-MM-DD'`.

## ProForm and ProFormItem

Use `ProForm` for config-driven forms and `ElForm` only when a dialog needs highly custom layout or validation behavior.

`ProForm` defaults:

- `labelWidth`: `100px`
- `labelPosition`: `right`
- `cols`: 1, with support for 2/3/4 column grids
- `colSpan` can span grid columns
- `hidden` can be boolean or function

`ProFormItem` behavior:

- input/password/textarea/number placeholders default to `请输入{label}`
- select defaults to placeholder `全部` unless overridden
- select/date/cascader placeholders default to `请选择{label}`
- inputs and selects are full width
- input with `maxlength > 0` automatically shows word count unless disabled
- number input is forced to full width and left-aligned via reset styles

Dialog form label widths commonly use `96px`; normal form pages can use `100px`.

## ProTable

Use `ProTable` for standard lists. It wraps Element Plus table, pagination, tabs, loading, index/selection/radio columns, and height calculation.

Column config shape:

```js
export const columns = [
  { label: '项目名称', prop: 'name', minWidth: 220 },
  { label: '状态', prop: 'status', width: 110, customFlag: true },
  { label: '提交时间', prop: 'submitTime', width: 170, dataType: 'Date' },
  { label: '操作', prop: 'action', width: 220, fixed: 'right', customFlag: true },
];
```

Column rules:

- first business column usually gets `minWidth: 170-220`
- status columns use `width: 90-120` and `customFlag: true`
- date/time columns use `width: 150-180`, `dataType: 'Date'` or `DateDay`
- numeric count columns use `width: 90-120`
- operation column is usually `fixed: 'right'`, `customFlag: true`, width `150-300`
- default empty cell display is `--`
- use `show-index="false"` when a business page does not need serial numbers

Table visuals:

- table background white, radius 8px, hidden overflow
- header cells are card-like: `#eff1f3`, radius 6px, min-height 40px, bold 14px
- body cells: 13px, `#333`, vertical padding 12px, bottom border `#f3f3f3`
- striped rows: `#f4f4f4`
- hover: `#eceeff`
- pagination area has `padding-top: 16px`, right-aligned by default

Tabs:

- use `tabs` for status segmentation above the table
- labels can include counts automatically when `count` is present
- right-side table actions can go into `tabsRight`

Pagination:

- default layout: `total, sizes, prev, pager, next, jumper`
- page sizes normally `[10, 20, 50]`; history/log dialogs may use `[20, 50, 100]`

## ProDialog

Use `ProDialog` for all modal workflows.

Defaults:

- width: `520px`
- top: `10vh`
- `appendToBody: true`
- `closeOnClickModal: false`
- footer shows `取消` and `确定`
- `confirmLoading` controls primary loading
- optional fullscreen button with Lucide maximize/minimize icons
- body loading text: `加载中...`

Visuals:

- border radius 8px
- header padding `12px 20px`
- header border `1px solid #d9d9d9`
- body padding `15px`, font-size 12px
- footer padding `12px 20px`, border top `#e4e7ed`
- content max-height `70vh`, scrolls vertically

Recommended widths:

- small form: `520px` or `560px`
- medium edit/detail: `720px` or `860px`
- nested management/list dialog: `960px` to `1080px`
- use `top="6vh"` for tall list dialogs
- use `show-footer="false"` for list/detail containers with their own controls

Nested dialogs are acceptable when editing from a management dialog. Keep the inner form around `560px` and use confirm text `保存`.

## Actions and Status

Operation buttons inside table rows should be small link buttons:

```vue
<ElButton size="small" type="primary" link>审核</ElButton>
<ElButton size="small" type="danger" link>删除</ElButton>
```

Toolbar/page actions should be filled buttons:

```vue
<ElButton type="primary">新增承制方</ElButton>
```

Use status tags:

- pending/current: `type="primary"` (`待审核`, `进行中`)
- success/normal: `type="success"` (`已通过`, `正常`, `已完成`)
- rejected/delete/error: `type="danger"` (`已驳回`, `删除`)
- disabled/unknown: `type="info"` (`禁用`, `未知`, `未提交`)

Use `round` on tags where rows contain compact status pills.

For multiple row actions, show the top 3 and move the rest into a more menu. Use Lucide `MoreHorizontal` when following the task-list pattern.

## Product Prototype Rules

When writing a product-facing prototype:

- Start with the actual admin screen, not a landing page.
- Describe the route/page title, visible regions, and primary workflow.
- Use existing component names (`ProSearch`, `ProTable`, `ProDialog`) so frontend can map directly.
- Include field/column config snippets when useful.
- Include empty/loading/error behavior briefly.
- Keep the palette restrained and avoid decorative gradients or large marketing sections.
- Preserve table-first information density; do not use large cards for every row unless the existing page pattern requires it.

## Responsive and Overflow

Most admin pages are desktop-first. Still protect smaller screens:

- keep table wrapper `min-height: 0` inside flex containers
- allow the whole page to scroll under `max-width: 960px` when necessary
- for headers with title + actions, switch to column layout under `960px`
- keep action groups `flex-wrap: wrap` with `gap: 6px`
- do not allow long titles to overflow; use `min-width: 0`, ellipsis, and muted metadata lines

## Avoid

- raw `ElTable`, `ElDialog`, or hand-built search rows for standard cases
- oversized hero headers, marketing copy, gradient backgrounds, bokeh/orb decoration
- one-off color systems that do not use Element Plus status colors
- nested card shells around `section-card`
- dense table operations using filled buttons
- labels or placeholders that differ from local Chinese wording patterns
