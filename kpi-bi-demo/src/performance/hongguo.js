export const HONGGUO_REQUIRED_COLUMNS = [
  "作品名称",
  "剧目类型",
  "剧目体裁",
  "作品封面",
  "作品集数",
  "作品ID",
  "发布时间",
  "作品总时长",
  "累计点击率",
  "首集完播进度",
  "10分钟完播率",
  "30分钟完播率",
  "60分钟完播率",
  "人均播放集数",
];

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseHongguoCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("CSV 中未找到可导入的作品数据。");

  const headers = rows[0].map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, "") : header));
  const missingColumns = HONGGUO_REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length) throw new Error(`缺少红果数据字段：${missingColumns.join("、")}`);

  const records = rows.slice(1).map((row, index) => {
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex] ?? ""]));
    return {
      id: record["作品ID"] || `hongguo-${index + 1}`,
      ...record,
    };
  }).filter((record) => record["作品名称"] || record["作品ID"]);

  if (!records.length) throw new Error("CSV 中没有有效的作品行。");
  return { headers, records };
}
