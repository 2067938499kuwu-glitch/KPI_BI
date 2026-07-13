import { useEffect, useMemo, useState } from "react";
import {
  ArrowsLeftRight,
  ChartLineUp,
  CheckCircle,
  Clock,
  Info,
  MagnifyingGlass,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { dashboardMeta, dashboardPerformanceRecords, dashboardWeeklyReports } from "./dashboardData";
import {
  filterByRole,
  getComparisonState,
  getDashboardSummary,
  getDefaultCycle,
  getPreviousCycle,
  getRolePolicy,
  mergePerformanceDimensions,
  reconcileComparisonSelection,
  sortByCompanyRank,
  sortHistoryChronologically,
  summarizeWeeklyReports,
  toggleComparisonSelection,
  withPeriodChanges,
} from "./dashboardLogic";
import {
  mergeWeeklyReports,
  readStoredWeeklyReports,
  WEEKLY_REPORT_STORAGE_KEY,
  WEEKLY_REPORT_UPDATED_EVENT,
} from "./weeklyReportBridge";

const statusLabels = { normal: "按时提交", late: "逾期提交", missing: "未提交" };
const scoreStatusLabels = { final_approved: "最终评分已生效", final_pending: "评分未完成", final_returned: "最终审批已退回" };
const PAGE_SIZE = 8;

function formatValue(value, suffix = "") {
  return value === null || value === undefined ? "--" : `${value}${suffix}`;
}

function ChangeValue({ value, type = "score" }) {
  if (value === null || value === undefined) return <span className="dashboard-change is-muted">--</span>;
  if (value === 0) return <span className="dashboard-change is-flat">持平</span>;
  const positive = value > 0;
  return <span className={`dashboard-change ${positive ? "is-up" : "is-down"}`}>{positive ? "↑" : "↓"} {Math.abs(value)}{type === "rank" ? "名" : "分"}</span>;
}

function StatusPill({ status, kind = "score" }) {
  const label = kind === "weekly" ? statusLabels[status] : scoreStatusLabels[status];
  return <b className={`dashboard-status dashboard-status--${status}`}>{label ?? status}</b>;
}

function EmptyState({ title, description, action }) {
  return <div className="dashboard-state"><MagnifyingGlass size={28} weight="duotone" /><strong>{title}</strong><span>{description}</span>{action}</div>;
}

function DashboardModal({ title, onClose, children, wide = false }) {
  return <div className="dashboard-modal-mask" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section aria-label={title} className={`dashboard-modal ${wide ? "dashboard-modal--wide" : ""}`} role="dialog" aria-modal="true"><header><div><strong>{title}</strong></div><button aria-label="关闭" className="dashboard-icon-button" onClick={onClose} type="button"><X size={18} /></button></header><div className="dashboard-modal__body">{children}</div></section></div>;
}

function TrendChart({ history }) {
  const effective = sortHistoryChronologically(history).filter((item) => item.finalScoreEffective);
  if (!effective.length) return <div className="dashboard-mini-empty">暂无已生效趋势数据</div>;
  const points = effective.map((item, index) => {
    const x = effective.length === 1 ? 50 : 8 + (index * 84) / (effective.length - 1);
    const y = 82 - ((item.finalScore - 75) / 25) * 64;
    return { ...item, x, y };
  });
  return <div className="dashboard-trend"><svg viewBox="0 0 100 92" preserveAspectRatio="none" aria-label="绩效趋势图"><line x1="8" y1="82" x2="92" y2="82" /><line x1="8" y1="50" x2="92" y2="50" /><polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />{points.map((point) => <circle key={point.cycle} cx={point.x} cy={point.y} r="2.2" />)}</svg><div>{points.map((point) => <span key={point.cycle}><b>{point.finalScore}</b><small>{point.cycle.slice(5)}月</small></span>)}</div></div>;
}

function WeeklySummary({ summary }) {
  return <div className="dashboard-weekly-summary"><div><small>按时提交率</small><strong>{formatValue(summary.onTimeRate, "%")}</strong></div><div><small>按时</small><strong>{summary.normal}</strong></div><div><small>逾期</small><strong>{summary.late}</strong></div><div><small>未提交</small><strong>{summary.missing}</strong></div></div>;
}

function PersonnelDetail({ record, history, reports, onClose, onOpenReport }) {
  const weekly = summarizeWeeklyReports(reports);
  const chronologicalHistory = sortHistoryChronologically(history);
  return <DashboardModal title="人员绩效详情" onClose={onClose} wide>
    <section className="dashboard-detail-hero"><div className="dashboard-person"><i>{record.name.slice(0, 1)}</i><div><strong>{record.name}</strong><span>{record.department} · {record.role}</span></div></div><div className="dashboard-detail-hero__metrics"><div><small>最终评分</small><strong>{record.finalScoreEffective ? record.finalScore : "--"}</strong></div><div><small>全公司排名</small><strong>{record.companyRank ? `第 ${record.companyRank} 名` : "--"}</strong></div><div><small>相比上月</small><ChangeValue value={record.scoreChange} /></div><div><small>生效状态</small><StatusPill status={record.status} /></div></div></section>
    <div className="dashboard-source-note"><Info size={16} /><span>来源：绩效中心 · 周期 {record.cycle} · {record.finalScoreEffectiveAt ? `生效于 ${record.finalScoreEffectiveAt}` : "最终评分尚未生效"}</span></div>
    <section className="dashboard-detail-section"><header><strong>绩效维度</strong><span>周报数据不参与以下得分</span></header><div className="dashboard-dimension-table"><div className="dashboard-dimension-table__head"><span>维度</span><span>权重</span><span>一级评分</span><span>二级评分</span><span>综合得分</span><span>加权结果</span><span>评价说明 / 来源</span></div>{record.performanceDimensions.map((item) => <div className="dashboard-dimension-table__row" key={item.name}><strong>{item.name}</strong><span>{item.weight}%</span><span>{item.firstScore}</span><span>{item.secondScore}</span><span>{item.score}</span><span>{item.weightedScore}</span><div><span>{item.comment}</span><small>{item.source}</small></div></div>)}</div></section>
    <div className="dashboard-detail-columns"><section className="dashboard-detail-section"><header><strong>历史绩效</strong><span>由早到晚 · 最近月份在右</span></header><TrendChart history={chronologicalHistory} /><div className="dashboard-history-list">{chronologicalHistory.map((item) => <div key={item.cycle}><span>{item.cycle}</span><strong>{item.finalScoreEffective ? item.finalScore : "--"}</strong><small>{item.companyRank ? `第 ${item.companyRank} 名` : "未生效"}</small></div>)}</div></section><section className="dashboard-detail-section"><header><strong>周报月度汇总</strong><span>仅作辅助参考</span></header><WeeklySummary summary={weekly} /><div className="dashboard-text-list"><strong>月度主要成果</strong>{weekly.achievements.slice(0, 3).map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}{!weekly.achievements.length && <p>暂无周报成果数据</p>}<strong>月度风险事项</strong>{weekly.risks.slice(0, 3).map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}{!weekly.risks.length && <p>原始周报未填写风险事项</p>}</div></section></div>
    <section className="dashboard-detail-section"><header><strong>周报明细</strong><span>来源模块：周报中心 · 数据周期 {record.cycle}</span></header>{reports.length ? <div className="dashboard-report-list">{reports.map((report) => <article key={report.id}><div><strong>{report.period.label}</strong><span>{report.period.start} 至 {report.period.end}</span></div><StatusPill status={report.status} kind="weekly" /><span>{report.submittedAt ?? "--"}</span><p><b>本周成果</b>{report.achievements[0] ?? "--"}</p><p><b>风险事项</b>{report.risks[0] ?? "--"}</p><p><b>下周计划</b>{report.nextPlan[0] ?? "--"}</p><button className="table-link" onClick={() => onOpenReport(report)} type="button">查看原始周报</button></article>)}</div> : <EmptyState title="周报数据缺失" description="该人员在所选月份暂无可关联的周报记录。" />}</section>
  </DashboardModal>;
}

function ComparisonView({ records, histories, reportMap, onClose }) {
  const dimensions = mergePerformanceDimensions(records);
  return <DashboardModal title={`多人绩效对比 · ${records.length} 人`} onClose={onClose} wide>
    <div className="dashboard-compare-people">{records.map((record) => <article key={record.employeeId}><div className="dashboard-person"><i>{record.name.slice(0, 1)}</i><div><strong>{record.name}</strong><span>{record.department} · {record.role}</span></div></div><div className="dashboard-compare-metrics"><div><small>最终评分</small><strong>{record.finalScoreEffective ? record.finalScore : "--"}</strong></div><div><small>全公司排名</small><strong>{record.companyRank ? `第 ${record.companyRank} 名` : "--"}</strong></div></div><p><ChangeValue value={record.scoreChange} /> <ChangeValue type="rank" value={record.rankChange} /></p><TrendChart history={histories.get(record.employeeId) ?? []} /></article>)}</div>
    <section className="dashboard-detail-section"><header><strong>绩效维度横向对比</strong><span>不同岗位缺失维度标记为不适用，不计 0 分</span></header><div className="dashboard-compare-dimensions">{dimensions.map((dimension) => <div className="dashboard-compare-dimension" key={dimension.name}><strong>{dimension.name}</strong>{dimension.values.map((value, index) => <div key={records[index].employeeId}><span>{records[index].name}</span>{value.applicable ? <><i><em style={{ width: `${value.score}%` }} /></i><b>{value.score} · {value.weight}%</b></> : <small>该岗位不适用</small>}</div>)}</div>)}</div></section>
    <section className="dashboard-detail-section"><header><strong>周报参考对比</strong><span>独立展示，不与绩效分合并</span></header><div className="dashboard-compare-weekly">{records.map((record) => { const summary = summarizeWeeklyReports(reportMap.get(record.employeeId) ?? []); return <article key={record.employeeId}><strong>{record.name}</strong><WeeklySummary summary={summary} /><div><b>月度主要成果</b><p>{summary.achievements[0] ?? "暂无周报成果数据"}</p><b>月度风险事项</b><p>{summary.risks[0] ?? "原始周报未填写风险事项"}</p></div></article>; })}</div></section>
  </DashboardModal>;
}

export function PersonnelDashboard({ activeRole = "ceo" }) {
  const roleId = typeof activeRole === "string" ? activeRole : activeRole?.id ?? "ceo";
  const policy = getRolePolicy(roleId);
  const cycles = [...new Set(dashboardPerformanceRecords.map((item) => item.cycle))].sort((a, b) => b.localeCompare(a));
  const [cycle, setCycle] = useState(() => getDefaultCycle(dashboardPerformanceRecords) ?? cycles[0]);
  const [filters, setFilters] = useState({ department: "all", role: "all", keyword: "", scoreStatus: "all", weeklyStatus: "all" });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [rawReport, setRawReport] = useState(null);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [dataState, setDataState] = useState("ready");
  const [weeklyRevision, setWeeklyRevision] = useState(0);
  const allCycles = [...cycles, "2026-04"];
  const previousCycle = getPreviousCycle(cycles, cycle);
  const currentWithChanges = useMemo(() => withPeriodChanges(dashboardPerformanceRecords, cycle, previousCycle), [cycle, previousCycle]);
  const visibleRecords = useMemo(() => filterByRole(currentWithChanges, roleId), [currentWithChanges, roleId]);
  const weeklyReports = useMemo(() => mergeWeeklyReports(
    dashboardWeeklyReports,
    readStoredWeeklyReports(typeof window === "undefined" ? null : window.localStorage),
  ), [weeklyRevision]);
  const weeklyByEmployee = useMemo(() => {
    const map = new Map();
    visibleRecords.forEach((record) => map.set(record.employeeId, weeklyReports.filter((report) => report.employeeId === record.employeeId && report.cycle === cycle)));
    return map;
  }, [cycle, visibleRecords, weeklyReports]);
  const enrichedRecords = useMemo(() => visibleRecords.map((record) => ({ ...record, weekly: summarizeWeeklyReports(weeklyByEmployee.get(record.employeeId) ?? []) })), [visibleRecords, weeklyByEmployee]);
  const departments = [...new Set(visibleRecords.map((item) => item.department))];
  const roles = [...new Set(visibleRecords.map((item) => item.role))];
  const filtered = sortByCompanyRank(enrichedRecords.filter((record) => {
    if (filters.department !== "all" && record.department !== filters.department) return false;
    if (filters.role !== "all" && record.role !== filters.role) return false;
    if (filters.keyword.trim() && !record.name.includes(filters.keyword.trim())) return false;
    if (filters.scoreStatus === "effective" && !record.finalScoreEffective) return false;
    if (filters.scoreStatus === "incomplete" && record.finalScoreEffective) return false;
    if (filters.weeklyStatus !== "all" && record.weekly[filters.weeklyStatus] === 0) return false;
    return true;
  }));
  const summary = useMemo(() => getDashboardSummary(dashboardPerformanceRecords, weeklyReports, cycle, roleId), [cycle, roleId, weeklyReports]);
  const compareState = getComparisonState(selectedIds);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE);
  const selectedRecords = selectedIds.map((id) => enrichedRecords.find((item) => item.employeeId === id)).filter(Boolean);
  const detailRecord = enrichedRecords.find((item) => item.employeeId === detailId);
  const historyMap = useMemo(() => {
    const map = new Map();
    dashboardPeopleIds(enrichedRecords).forEach((employeeId) => map.set(employeeId, cycles.map((itemCycle) => filterByRole(withPeriodChanges(dashboardPerformanceRecords, itemCycle, getPreviousCycle(cycles, itemCycle)), roleId).find((item) => item.employeeId === employeeId)).filter(Boolean)));
    return map;
  }, [enrichedRecords, roleId]);

  useEffect(() => {
    setSelectedIds((current) => reconcileComparisonSelection(current, visibleRecords, cycle, roleId));
    setCompareOpen(false);
    setDetailId(null);
    setPage(1);
  }, [cycle, roleId, visibleRecords]);

  useEffect(() => {
    const syncWeeklyReports = () => setWeeklyRevision((current) => current + 1);
    const handleStorage = (event) => {
      if (event.key === WEEKLY_REPORT_STORAGE_KEY) syncWeeklyReports();
    };
    const handleMessage = (event) => {
      if (event.origin === window.location.origin && event.data?.type === WEEKLY_REPORT_UPDATED_EVENT) syncWeeklyReports();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", syncWeeklyReports);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", syncWeeklyReports);
    };
  }, []);

  const updateFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const resetFilters = () => { setFilters({ department: "all", role: "all", keyword: "", scoreStatus: "all", weeklyStatus: "all" }); setPage(1); };
  const refresh = () => { setDataState("loading"); window.setTimeout(() => { setWeeklyRevision((current) => current + 1); setDataState("ready"); }, 450); };

  if (!Object.hasOwn({ employee: 1, leader: 1, hr: 1, ceo: 1 }, roleId)) return <div className="admin-page personnel-dashboard-v2"><EmptyState title="无权限访问" description="当前身份未配置人员绩效与周报数据看板权限。" /></div>;

  return <div className="admin-page personnel-dashboard-v2">
    <section className="dashboard-title"><div><span className="dashboard-title__eyebrow"><ChartLineUp size={16} weight="duotone" />组织数据洞察</span><h2>人员绩效与周报数据看板</h2><p>查看最终绩效排名、人员对比及周报参考信息</p></div><div className="dashboard-title__meta"><div><small>绩效月份</small><strong>{cycle}</strong></div><div><small>数据更新时间</small><strong>{dashboardMeta.updatedAt}</strong></div><button className="ghost-chip" onClick={() => setScopeOpen(true)} type="button"><Info size={16} />统计口径</button><button className="primary-btn" onClick={refresh} type="button">刷新数据</button></div></section>
    {dataState === "loading" ? <section className="dashboard-loading"><i /><span>数据更新中，请稍候…</span></section> : null}
    {dataState === "error" ? <section className="dashboard-error"><WarningCircle size={20} /><div><strong>数据加载失败</strong><span>未能获取看板 Mock 数据，请重试。</span></div><button className="primary-btn" onClick={refresh} type="button">重试</button></section> : null}
    <section className="dashboard-filter-panel"><div className="dashboard-filter-grid"><label><span>绩效月份</span><select aria-label="绩效月份" value={cycle} onChange={(event) => setCycle(event.target.value)}>{allCycles.map((item) => <option key={item} value={item}>{item}{item === "2026-04" ? "（无生效数据）" : ""}</option>)}</select></label><label><span>部门</span><select aria-label="部门" value={filters.department} onChange={(event) => updateFilter("department", event.target.value)}><option value="all">全部部门</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>岗位</span><select aria-label="岗位" value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}><option value="all">全部岗位</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>人员姓名</span><input aria-label="人员姓名" value={filters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="请输入姓名" /></label><label><span>最终评分状态</span><select aria-label="最终评分状态" value={filters.scoreStatus} onChange={(event) => updateFilter("scoreStatus", event.target.value)}><option value="all">全部状态</option><option value="effective">已生效</option><option value="incomplete">评分未完成</option></select></label><label><span>周报状态</span><select aria-label="周报状态" value={filters.weeklyStatus} onChange={(event) => updateFilter("weeklyStatus", event.target.value)}><option value="all">全部状态</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="dashboard-filter-actions"><button className="primary-btn" onClick={() => setPage(1)} type="button">查询</button><button className="ghost-chip" onClick={resetFilters} type="button">重置</button></div></section>
    {cycle === "2026-04" ? <EmptyState title="所选月份没有已生效最终评分" description="2026-04 暂无可用于正式排名的数据，可切换至其他绩效月份。" action={<button className="primary-btn" onClick={() => setCycle(getDefaultCycle(dashboardPerformanceRecords))} type="button">查看最近有效月份</button>} /> : <>
      {roleId === "employee" ? <section className="dashboard-self-banner"><div><span>我的最终绩效</span><strong>{enrichedRecords[0]?.finalScoreEffective ? enrichedRecords[0].finalScore : "--"}</strong><small>{enrichedRecords[0]?.companyRank ? `全公司第 ${enrichedRecords[0].companyRank} 名` : "评分未完成"}</small></div><div><span>分数区间</span><strong>{enrichedRecords[0]?.finalScore >= 90 ? "90–100" : enrichedRecords[0]?.finalScore >= 80 ? "80–89" : "80 以下"}</strong><small>仅展示本人信息</small></div><div><span>周报按时提交率</span><strong>{formatValue(enrichedRecords[0]?.weekly.onTimeRate, "%")}</strong><small>按时周数 ÷ 应提交周数</small></div><button className="primary-btn" onClick={() => setDetailId(enrichedRecords[0]?.employeeId)} type="button">查看我的详情</button></section> : null}
      <section className={`dashboard-summary-grid ${roleId === "employee" ? "is-employee" : ""}`}>{(roleId === "employee" ? [{ label: "最终评分状态", value: enrichedRecords[0]?.finalScoreEffective ? "已生效" : "未完成", meta: enrichedRecords[0]?.finalScoreEffectiveAt ?? "--" }, { label: "周报异常数", value: enrichedRecords[0]?.weekly.abnormalCount ?? 0, meta: "逾期 + 未提交" }] : [{ label: "已完成最终评分", value: summary.completed, unit: "人", meta: "进入正式排名" }, { label: "评分未完成", value: summary.incomplete, unit: "人", meta: "含审批中与退回" }, { label: "平均分", value: formatValue(summary.average), unit: "分", meta: "仅已生效评分" }, { label: "最高 / 最低", value: `${formatValue(summary.highest)} / ${formatValue(summary.lowest)}`, meta: "当前权限范围人数" }, { label: "周报按时提交率", value: formatValue(summary.weekly.onTimeRate, "%"), meta: "按时周数 ÷ 应提交周数" }, { label: "周报未提交人数", value: summary.weekly.missingPeople, unit: "人", meta: "至少 1 周未提交" }, { label: "周报逾期人数", value: summary.weekly.latePeople, unit: "人", meta: "至少 1 周逾期" }]).map((item) => <article key={item.label}><span>{item.label}</span><div><strong>{item.value}</strong>{item.unit ? <b>{item.unit}</b> : null}</div><small>{item.meta}</small></article>)}</section>
      {policy.canCompare ? <section className="dashboard-selection-bar"><div><ArrowsLeftRight size={20} weight="duotone" /><span>已选择 <strong>{selectedIds.length}</strong> / 5 人</span><small>{compareState.reason}</small></div><div className="dashboard-selected-chips">{selectedRecords.map((item) => <button key={item.employeeId} onClick={() => setSelectedIds((current) => toggleComparisonSelection(current, item.employeeId))} type="button">{item.name}<X size={12} /></button>)}</div><div><button className="table-link" disabled={!selectedIds.length} onClick={() => setSelectedIds([])} type="button">清空全部</button><button className="primary-btn" disabled={!compareState.canStart} onClick={() => setCompareOpen(true)} title={compareState.canStart ? "" : compareState.reason} type="button">开始对比</button></div></section> : null}
      {roleId !== "employee" ? <section className="dashboard-ledger-card"><header><div><strong>绩效排名列表</strong><span>排名基于全公司全部已生效人员计算，按排名正序展示，筛选不会重新排名</span></div><b>共 {filtered.length} 人</b></header><div className="dashboard-ledger-scroll"><div className="dashboard-ledger dashboard-ledger--head"><span>选择</span><span>全公司排名</span><span>姓名</span><span>部门</span><span>岗位</span><span>最终评分</span><span>较上月分数</span><span>较上月排名</span><span>周报按时率</span><span>周报异常数</span><span>最终评分状态</span><span>操作</span></div>{paged.map((record) => <div className="dashboard-ledger dashboard-ledger--row" key={record.employeeId}><label className="dashboard-check"><input aria-label={`选择${record.name}`} checked={selectedIds.includes(record.employeeId)} disabled={!selectedIds.includes(record.employeeId) && compareState.atLimit} onChange={() => setSelectedIds((current) => toggleComparisonSelection(current, record.employeeId))} type="checkbox" /></label><strong className="dashboard-rank">{record.companyRank ? `第 ${record.companyRank} 名` : "--"}</strong><div className="dashboard-person"><i>{record.name.slice(0, 1)}</i><div><strong>{record.name}</strong><small>ID {record.employeeId}</small></div></div><span>{record.department}</span><span>{record.role}</span><strong>{record.finalScoreEffective ? record.finalScore : "--"}</strong><ChangeValue value={record.scoreChange} /><ChangeValue type="rank" value={record.rankChange} /><span>{formatValue(record.weekly.onTimeRate, "%")}</span><span>{record.weekly.abnormalCount}</span><StatusPill status={record.status} /><div className="dashboard-ledger__actions"><button className="table-link" onClick={() => setDetailId(record.employeeId)} type="button">详情</button></div></div>)}{!paged.length ? <EmptyState title="筛选无结果" description="当前权限范围内没有符合条件的人员，请调整筛选条件。" action={<button className="ghost-chip" onClick={resetFilters} type="button">重置筛选</button>} /> : null}</div><footer><span>第 {Math.min(page, totalPages)} / {totalPages} 页</span><div><button className="ghost-chip" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">上一页</button><button className="ghost-chip" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} type="button">下一页</button></div></footer></section> : null}
    </>}
    {detailRecord ? <PersonnelDetail record={detailRecord} history={historyMap.get(detailRecord.employeeId) ?? []} reports={weeklyByEmployee.get(detailRecord.employeeId) ?? []} onClose={() => setDetailId(null)} onOpenReport={setRawReport} /> : null}
    {compareOpen ? <ComparisonView records={selectedRecords} histories={historyMap} reportMap={weeklyByEmployee} onClose={() => setCompareOpen(false)} /> : null}
    {rawReport ? <DashboardModal title="原始周报记录" onClose={() => setRawReport(null)}><div className="dashboard-raw-report"><div><span>来源模块</span><strong>{rawReport.sourceModule}</strong></div><div><span>数据周期</span><strong>{rawReport.period.label} · {rawReport.period.start} 至 {rawReport.period.end}</strong></div><div><span>提交状态</span><StatusPill status={rawReport.status} kind="weekly" /></div><pre>{rawReport.originalContent || "该周无原始周报内容。"}</pre></div></DashboardModal> : null}
    {scopeOpen ? <DashboardModal title="统计口径与状态演示" onClose={() => setScopeOpen(false)}><div className="dashboard-scope"><p><CheckCircle size={18} />仅CEO最终审批通过的评分进入正式排名；特殊流程以最后审批节点通过为准。</p><p><ChartLineUp size={18} />排名先基于全公司计算，再按当前身份过滤；同分采用竞赛排名。</p><p><Clock size={18} />周报按时率 = 按时周数 ÷ 应提交周数；周报不参与绩效评分。</p><div><button className="ghost-chip" onClick={() => { setDataState("loading"); setScopeOpen(false); }} type="button">演示加载中</button><button className="ghost-chip" onClick={() => { setDataState("error"); setScopeOpen(false); }} type="button">演示加载失败</button></div></div></DashboardModal> : null}
  </div>;
}

function dashboardPeopleIds(records) {
  return [...new Set(records.map((record) => record.employeeId))];
}
