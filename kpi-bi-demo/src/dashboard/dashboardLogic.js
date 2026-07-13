export const DASHBOARD_ROLES = {
  employee: { viewerEmployeeId: "emp-001", scope: "self", canCompare: false },
  leader: {
    viewerEmployeeId: "emp-010",
    scope: "team",
    canCompare: true,
    managedEmployeeIds: ["emp-001", "emp-002", "emp-003", "emp-004", "emp-005", "emp-010"],
  },
  hr: { viewerEmployeeId: "hr-001", scope: "all", canCompare: true },
  ceo: { viewerEmployeeId: "ceo-001", scope: "all", canCompare: true },
};

export function isFinalScoreEffective(record) {
  if (!record || !Number.isFinite(record.finalScore)) return false;
  if (record.finalScoreEffective === true) return true;
  if (record.finalScoreEffective === false) return false;
  const approval = record.approvalFlow;
  if (!approval || approval.returned === true) return false;
  if (approval.requiresCommittee === false) return approval.lastNodeStatus === "approved";
  return approval.committeeStatus === "approved";
}

export function buildCompanyRankings(records, cycle) {
  const cycleRecords = records.filter((record) => record.cycle === cycle);
  const ranked = cycleRecords
    .filter(isFinalScoreEffective)
    .sort((a, b) => b.finalScore - a.finalScore || a.employeeId.localeCompare(b.employeeId));
  const rankByEmployeeId = new Map();
  let previousScore = null;
  let previousRank = 0;
  ranked.forEach((record, index) => {
    const rank = record.finalScore === previousScore ? previousRank : index + 1;
    rankByEmployeeId.set(record.employeeId, rank);
    previousScore = record.finalScore;
    previousRank = rank;
  });
  return cycleRecords.map((record) => ({
    ...record,
    finalScoreEffective: isFinalScoreEffective(record),
    companyRank: rankByEmployeeId.get(record.employeeId) ?? null,
  }));
}

export function getDefaultCycle(records) {
  return [...new Set(records.filter(isFinalScoreEffective).map((record) => record.cycle))]
    .sort((a, b) => b.localeCompare(a))[0] ?? null;
}

export function getRolePolicy(roleId) {
  return DASHBOARD_ROLES[roleId] ?? DASHBOARD_ROLES.employee;
}

export function filterByRole(records, roleId) {
  const policy = getRolePolicy(roleId);
  if (policy.scope === "all") return records;
  if (policy.scope === "self") return records.filter((record) => record.employeeId === policy.viewerEmployeeId);
  const allowed = new Set(policy.managedEmployeeIds);
  return records.filter((record) => allowed.has(record.employeeId));
}

export function getVisibleRankedRecords(records, cycle, roleId) {
  return filterByRole(buildCompanyRankings(records, cycle), roleId);
}

export function sortByCompanyRank(records) {
  return [...records].sort((a, b) => {
    if (a.companyRank === null) return b.companyRank === null ? a.employeeId.localeCompare(b.employeeId) : 1;
    if (b.companyRank === null) return -1;
    return a.companyRank - b.companyRank || b.finalScore - a.finalScore || a.employeeId.localeCompare(b.employeeId);
  });
}

export function sortHistoryChronologically(records) {
  return [...records].sort((a, b) => a.cycle.localeCompare(b.cycle));
}

export function getPreviousCycle(cycles, cycle) {
  const sorted = [...cycles].sort();
  const index = sorted.indexOf(cycle);
  return index > 0 ? sorted[index - 1] : null;
}

export function withPeriodChanges(records, cycle, previousCycle) {
  const current = buildCompanyRankings(records, cycle);
  if (!previousCycle) return current.map((record) => ({ ...record, scoreChange: null, rankChange: null }));
  const previous = new Map(buildCompanyRankings(records, previousCycle).map((record) => [record.employeeId, record]));
  return current.map((record) => {
    const last = previous.get(record.employeeId);
    return {
      ...record,
      scoreChange: isFinalScoreEffective(record) && last?.finalScoreEffective
        ? Number((record.finalScore - last.finalScore).toFixed(1))
        : null,
      rankChange: record.companyRank && last?.companyRank ? last.companyRank - record.companyRank : null,
    };
  });
}

export function summarizeWeeklyReports(reports) {
  const counts = { normal: 0, late: 0, missing: 0 };
  reports.forEach((report) => {
    if (Object.hasOwn(counts, report.status)) counts[report.status] += 1;
  });
  const requiredWeeks = counts.normal + counts.late + counts.missing;
  return {
    ...counts,
    requiredWeeks,
    abnormalCount: counts.late + counts.missing,
    onTimeRate: requiredWeeks ? Math.round((counts.normal / requiredWeeks) * 1000) / 10 : null,
    achievements: reports.flatMap((report) => report.achievements ?? []),
    risks: reports.flatMap((report) => report.risks ?? []).filter(Boolean),
  };
}

export function summarizeMonthlyReports(weeklyReports, employeeIds, cycle) {
  const allowed = new Set(employeeIds);
  const scoped = weeklyReports.filter((report) => report.cycle === cycle && allowed.has(report.employeeId));
  const summary = summarizeWeeklyReports(scoped);
  const employeeSummaries = employeeIds.map((employeeId) => ({
    employeeId,
    ...summarizeWeeklyReports(scoped.filter((report) => report.employeeId === employeeId)),
  }));
  return {
    ...summary,
    missingPeople: employeeSummaries.filter((item) => item.missing > 0).length,
    latePeople: employeeSummaries.filter((item) => item.late > 0).length,
    employeeSummaries,
  };
}

export function reconcileComparisonSelection(selectedIds, visibleRecords, cycle, roleId) {
  const policy = getRolePolicy(roleId);
  if (!policy.canCompare) return [];
  const allowed = new Set(filterByRole(visibleRecords, roleId).filter((record) => record.cycle === cycle).map((record) => record.employeeId));
  return selectedIds.filter((id) => allowed.has(id)).slice(0, 5);
}

export function toggleComparisonSelection(selectedIds, employeeId) {
  if (selectedIds.includes(employeeId)) return selectedIds.filter((id) => id !== employeeId);
  if (selectedIds.length >= 5) return selectedIds;
  return [...selectedIds, employeeId];
}

export function getComparisonState(selectedIds) {
  return {
    count: selectedIds.length,
    canStart: selectedIds.length >= 2 && selectedIds.length <= 5,
    atLimit: selectedIds.length >= 5,
    reason: selectedIds.length < 2 ? "至少选择 2 人后可开始对比" : selectedIds.length >= 5 ? "已达到最多 5 人" : "可继续选择",
  };
}

export function mergePerformanceDimensions(records) {
  const names = [...new Set(records.flatMap((record) => record.performanceDimensions.map((item) => item.name)))];
  return names.map((name) => ({
    name,
    values: records.map((record) => {
      const dimension = record.performanceDimensions.find((item) => item.name === name);
      return dimension ? { ...dimension, applicable: true } : { name, applicable: false, score: null, weight: null };
    }),
  }));
}

export function getDashboardSummary(records, weeklyReports, cycle, roleId) {
  const globalRanked = buildCompanyRankings(records, cycle);
  const visible = filterByRole(globalRanked, roleId);
  const completed = visible.filter((record) => record.finalScoreEffective);
  const weekly = summarizeMonthlyReports(weeklyReports, visible.map((record) => record.employeeId), cycle);
  const scores = completed.map((record) => record.finalScore);
  return {
    completed: completed.length,
    incomplete: visible.length - completed.length,
    average: scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : null,
    highest: scores.length ? Math.max(...scores) : null,
    lowest: scores.length ? Math.min(...scores) : null,
    weekly,
  };
}
