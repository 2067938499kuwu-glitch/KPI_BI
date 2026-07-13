import { describe, expect, test } from "vitest";
import { HONGGUO_REQUIRED_COLUMNS, parseHongguoCsv } from "./hongguo";

describe("hongguo csv import", () => {
  test("parses the exported hongguo work format", () => {
    const csv = `\uFEFF${HONGGUO_REQUIRED_COLUMNS.join(",")}\n测试作品,成品剧,漫剧,https://example.com/cover.jpg,60,123456,2026-07-04 09:58:03,115分钟,19.10%,39.97%,44.99%,40.09%,35.77%,22`;
    const result = parseHongguoCsv(csv);

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      id: "123456",
      "作品名称": "测试作品",
      "累计点击率": "19.10%",
      "60分钟完播率": "35.77%",
    });
  });

  test("rejects csv files that omit required export columns", () => {
    expect(() => parseHongguoCsv("作品名称,作品ID\n测试作品,123456")).toThrow("缺少红果数据字段");
  });
});
