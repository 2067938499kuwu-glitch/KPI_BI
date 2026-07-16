export const SSC_PERSONNEL_STORAGE_KEY = "kpi-bi:ssc-employees";

export const sscPersonnelFallback = [
  {
    no: "ZY20260101",
    name: "陈雨",
    regular: "已转正",
    status: "在职",
  },
  {
    no: "ZY20251023",
    name: "李哲",
    regular: "已转正",
    status: "在职",
  },
  {
    no: "ZY20260412",
    name: "周宁",
    regular: "实习期",
    status: "实习期",
  },
  {
    no: "ZY20260715",
    name: "苏冉",
    regular: "实习期",
    status: "实习期",
  },
  {
    no: "ZY20240218",
    name: "王敏",
    regular: "已转正",
    status: "在职",
  },
  {
    no: "ZY20231107",
    name: "赵磊",
    regular: "已转正",
    status: "在职",
  },
];

export function readSscPersonnel() {
  if (typeof window === "undefined") return sscPersonnelFallback;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(SSC_PERSONNEL_STORAGE_KEY) ?? "null",
    );
    return Array.isArray(stored) && stored.length
      ? stored
      : sscPersonnelFallback;
  } catch {
    return sscPersonnelFallback;
  }
}

export function normalizeSscEmploymentStatus(employee) {
  if (!employee) return "SSC待建档";
  if (/离职/.test(employee.status ?? "")) return "已离职";
  if (employee.regular === "已转正") return "已转正";
  if (
    [employee.regular, employee.status].some((value) =>
      /实习期|试用期/.test(value ?? ""),
    )
  )
    return "实习期";
  return "SSC待确认";
}

export function resolveSscEmployment(personnel, candidate, application) {
  const employee = personnel.find(
    (item) =>
      (application?.sscEmployeeNo && item.no === application.sscEmployeeNo) ||
      item.name === candidate?.name,
  );
  return {
    employee,
    status: normalizeSscEmploymentStatus(employee),
  };
}

export function summarizeSscEmployment(personnel) {
  return personnel.reduce(
    (summary, employee) => {
      const status = normalizeSscEmploymentStatus(employee);
      if (Object.prototype.hasOwnProperty.call(summary, status)) {
        summary[status] += 1;
      }
      return summary;
    },
    { 实习期: 0, 已转正: 0, 已离职: 0 },
  );
}
