function uniqueNonEmpty(items) {
  return [...new Set(items.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

export function buildWeeklyReference(review, people, reports) {
  const person = people.find((item) => item.name === review?.employee);
  const scopedReports = person
    ? reports.filter((report) => report.employeeId === person.employeeId && report.cycle === review.cycle)
    : [];
  const submittedReports = scopedReports.filter((report) => report.status === "normal" || report.status === "late");
  const late = scopedReports.filter((report) => report.status === "late").length;
  const missing = scopedReports.filter((report) => report.status === "missing").length;
  const sourceLabels = uniqueNonEmpty(scopedReports.map((report) => report.sourceModule));

  return {
    employeeId: person?.employeeId ?? null,
    requiredWeeks: scopedReports.length,
    submitted: submittedReports.length,
    late,
    missing,
    sourceLabel: sourceLabels.includes("周报中心 · 实际填写") ? "周报中心 · 实际填写" : "周报中心",
    achievements: uniqueNonEmpty(submittedReports.flatMap((report) => report.achievements ?? [])),
    risks: uniqueNonEmpty(submittedReports.flatMap((report) => report.risks ?? [])),
    weeks: [...scopedReports]
      .sort((left, right) => String(left.period?.start ?? "").localeCompare(String(right.period?.start ?? "")))
      .map((report) => ({
        id: report.id,
        label: report.period?.label ?? "--",
        dateRange: report.period?.start && report.period?.end ? `${report.period.start} 至 ${report.period.end}` : "--",
        status: report.status,
        achievement: report.status === "missing" ? "周报未提交" : (report.achievements?.[0] ?? "未填写本周成果"),
        risk: report.status === "missing" ? "--" : (report.risks?.[0] ?? "无风险事项"),
      })),
  };
}
