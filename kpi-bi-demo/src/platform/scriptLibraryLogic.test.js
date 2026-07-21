import { describe, expect, test } from "vitest";
import {
  applyScriptEpisodeUpload,
  getScriptCardVersionMap,
  hasScriptCardConflict,
  parseEpisodeNumber,
  parseScriptText,
  scriptCardNoForEpisode,
  validateScriptEpisodes,
} from "./scriptLibraryLogic";

describe("script library episode splitting", () => {
  test("splits standard and intelligent fallback headings into episodes", () => {
    const result = parseScriptText(`剧本名\n第1集：开场\n第一集正文\n第二集 重逢\n第二集正文`);
    expect(result.strategy).toBe("规则识别 + AI辅助");
    expect(result.episodes).toEqual([
      expect.objectContaining({ episodeNo: 1, title: "开场", content: "第一集正文" }),
      expect.objectContaining({ episodeNo: 2, title: "重逢", content: "第二集正文" }),
    ]);
  });

  test("supports Chinese episode numbers and maps every ten episodes to one card", () => {
    expect(parseEpisodeNumber("二十一")).toBe(21);
    expect(scriptCardNoForEpisode(1)).toBe(1);
    expect(scriptCardNoForEpisode(10)).toBe(1);
    expect(scriptCardNoForEpisode(11)).toBe(2);
  });

  test("blocks duplicate, empty, and out-of-order episodes", () => {
    const issues = validateScriptEpisodes([
      { id: "a", episodeNo: 2, content: "正文" },
      { id: "b", episodeNo: 2, content: "" },
      { id: "c", episodeNo: 1, content: "正文" },
    ], 20);
    expect(issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining(["duplicate", "empty", "order"]),
    );
  });

  test("updates only uploaded episodes and creates one version for every affected card", () => {
    const record = applyScriptEpisodeUpload({
      id: "SCRIPT-LIB-1",
      uploads: [],
      episodes: [{ episodeNo: 7, title: "旧标题", content: "旧正文" }],
      cardVersions: [],
    }, {
      episodeTotal: 20,
      episodes: [
        { id: "e8", episodeNo: 8, title: "八", content: "正文8" },
        { id: "e11", episodeNo: 11, title: "十一", content: "正文11" },
      ],
      file: { name: "剧本.docx", size: 100, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      uploadedAt: "2026-07-21 18:00",
      uploadedBy: "张小北",
    });

    expect(record.episodes.map((episode) => episode.episodeNo)).toEqual([7, 8, 11]);
    expect(record.cardVersions.map((version) => version.cardNo)).toEqual([1, 2]);
    expect(getScriptCardVersionMap(record, [1, 2])).toEqual({ 1: 1, 2: 1 });
    expect(hasScriptCardConflict(record, { 1: 0, 2: 0 })).toBe(true);
  });
});
