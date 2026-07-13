export const WEEKLY_REPORT_STORAGE_KEY = "kpi-bi-weekly-report-records-v1";
export const WEEKLY_REPORT_UPDATED_EVENT = "kpi-bi-weekly-report-updated";

function reportKey(report) {
  return `${report.employeeId}:${report.cycle}:${report.period?.label ?? report.id}`;
}

export function readStoredWeeklyReports(storage) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(WEEKLY_REPORT_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toDashboardWeeklyReport(storedRecord) {
  if (!storedRecord?.employeeId || !storedRecord?.cycle || !storedRecord?.period) return null;
  const submitted = storedRecord.submitted;
  return {
    id: storedRecord.id,
    employeeId: storedRecord.employeeId,
    cycle: storedRecord.cycle,
    period: storedRecord.period,
    status: submitted?.status === "normal" || submitted?.status === "late" ? submitted.status : "missing",
    submittedAt: submitted?.submittedAt ?? null,
    achievements: submitted?.achievements ?? [],
    risks: submitted?.risks ?? [],
    nextPlan: submitted?.nextPlan ?? [],
    originalContent: submitted?.originalContent ?? storedRecord.draftContent ?? "",
    sourceModule: "周报中心 · 实际填写",
    updatedAt: storedRecord.updatedAt ?? submitted?.submittedAt ?? null,
  };
}

export function mergeWeeklyReports(mockReports, storedRecords) {
  const merged = new Map(mockReports.map((report) => [reportKey(report), report]));
  storedRecords.forEach((record) => {
    const linked = toDashboardWeeklyReport(record);
    if (linked) merged.set(reportKey(linked), linked);
  });
  return [...merged.values()];
}
