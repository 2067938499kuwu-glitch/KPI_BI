import * as mammoth from "mammoth";

export const SCRIPT_DOCX_PATTERN = /\.docx$/i;
export const SCRIPT_CARD_SIZE = 10;

const CHINESE_DIGITS = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

export function parseEpisodeNumber(value) {
  const normalized = String(value ?? "").trim();
  if (/^\d+$/.test(normalized)) return Number(normalized);
  if (!normalized) return Number.NaN;

  let total = 0;
  let current = 0;
  for (const character of normalized) {
    if (character in CHINESE_DIGITS) {
      current = CHINESE_DIGITS[character];
    } else if (character === "十") {
      total += (current || 1) * 10;
      current = 0;
    } else if (character === "百") {
      total += (current || 1) * 100;
      current = 0;
    } else {
      return Number.NaN;
    }
  }
  return total + current;
}

export function scriptCardNoForEpisode(episodeNo) {
  return Math.floor((Math.max(1, Number(episodeNo) || 1) - 1) / SCRIPT_CARD_SIZE) + 1;
}

export function scriptCardRange(cardNo, episodeTotal) {
  const safeCardNo = Math.max(1, Number(cardNo) || 1);
  const start = (safeCardNo - 1) * SCRIPT_CARD_SIZE + 1;
  const total = Math.max(start, Number(episodeTotal) || start + SCRIPT_CARD_SIZE - 1);
  return {
    start,
    end: Math.min(start + SCRIPT_CARD_SIZE - 1, total),
  };
}

function collectHeadingMatches(text) {
  const matches = [];
  const seenStarts = new Set();
  const patterns = [
    {
      source: "规则识别",
      regex: /^[ \t]*第[ \t]*(\d+)[ \t]*集(?=$|[ \t：:—-])[ \t]*(?:[：:—-][ \t]*)?(.*)$/gm,
    },
    {
      source: "AI辅助",
      regex: /^[ \t]*第[ \t]*([零〇一二两三四五六七八九十百]+)[ \t]*(?:集|话)(?=$|[ \t：:—-])[ \t]*(?:[：:—-][ \t]*)?(.*)$/gm,
    },
    {
      source: "AI辅助",
      regex: /^[ \t]*(?:EPISODE|Episode|episode)[ \t]+(\d+)[ \t]*(?:[：:—-][ \t]*)?(.*)$/gm,
    },
    {
      source: "AI辅助",
      regex: /^[ \t]*(\d{1,3})[、.．][ \t]*(.+)$/gm,
    },
  ];

  patterns.forEach(({ regex, source }) => {
    let match = regex.exec(text);
    while (match) {
      if (!seenStarts.has(match.index)) {
        seenStarts.add(match.index);
        matches.push({
          index: match.index,
          end: regex.lastIndex,
          episodeNo: parseEpisodeNumber(match[1]),
          title: String(match[2] ?? "").trim(),
          source,
        });
      }
      match = regex.exec(text);
    }
  });

  return matches.sort((left, right) => left.index - right.index);
}

export function parseScriptText(text) {
  const normalizedText = String(text ?? "").replace(/\r\n?/g, "\n").trim();
  const headings = collectHeadingMatches(normalizedText);
  const episodes = headings.map((heading, index) => {
    const nextHeading = headings[index + 1];
    const content = normalizedText
      .slice(heading.end, nextHeading?.index ?? normalizedText.length)
      .trim();
    return {
      id: `preview-${index + 1}`,
      episodeNo: heading.episodeNo,
      title: heading.title || `第${heading.episodeNo}集`,
      content,
      detectedBy: heading.source,
    };
  });

  return {
    episodes,
    ignoredPrefix: headings.length ? normalizedText.slice(0, headings[0].index).trim() : normalizedText,
    strategy: episodes.some((episode) => episode.detectedBy === "AI辅助")
      ? "规则识别 + AI辅助"
      : "规则识别",
  };
}

export function validateScriptEpisodes(episodes, episodeTotal) {
  const issues = [];
  const seen = new Map();
  const safeTotal = Math.max(1, Number(episodeTotal) || 1);

  episodes.forEach((episode, index) => {
    const episodeNo = Number(episode.episodeNo);
    if (!Number.isInteger(episodeNo) || episodeNo < 1 || episodeNo > safeTotal) {
      issues.push({
        key: episode.id,
        type: "range",
        message: `集数必须在 1—${safeTotal} 之间`,
      });
    }
    if (seen.has(episodeNo)) {
      issues.push({ key: episode.id, type: "duplicate", message: `第 ${episodeNo} 集重复` });
    }
    seen.set(episodeNo, index);
    if (!String(episode.content ?? "").trim()) {
      issues.push({ key: episode.id, type: "empty", message: "正文为空" });
    }
    if (index > 0 && episodeNo <= Number(episodes[index - 1].episodeNo)) {
      issues.push({ key: episode.id, type: "order", message: "集数顺序异常" });
    }
  });

  if (!episodes.length) {
    issues.push({ key: "document", type: "unrecognized", message: "未识别到任何单集标题" });
  }
  return issues;
}

export async function extractDocxText(file) {
  if (!file || !SCRIPT_DOCX_PATTERN.test(file.name)) {
    throw new Error("仅支持 DOCX 格式的剧本文件。");
  }

  const arrayBuffer = await file.arrayBuffer();
  const signature = new Uint8Array(arrayBuffer.slice(0, 2));
  const isZippedDocx = signature[0] === 0x50 && signature[1] === 0x4b;
  if (isZippedDocx) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value?.trim()) return result.value;
    } catch {
      // Fall through to the plain-text compatibility path below.
    }
  }

  const fallbackText = await file.text();
  if (fallbackText.trim()) return fallbackText;
  throw new Error("文档中没有可识别的文本内容。");
}

export function getAffectedScriptCards(episodes) {
  return Array.from(
    new Set(episodes.map((episode) => scriptCardNoForEpisode(episode.episodeNo))),
  ).sort((left, right) => left - right);
}

export function getScriptCardVersionMap(record, cards) {
  return Object.fromEntries(
    cards.map((cardNo) => [
      cardNo,
      Math.max(
        0,
        ...(record?.cardVersions ?? [])
          .filter((version) => Number(version.cardNo) === cardNo)
          .map((version) => Number(version.version) || 0),
      ),
    ]),
  );
}

export function hasScriptCardConflict(record, baselineVersions) {
  return Object.entries(baselineVersions ?? {}).some(([cardNo, version]) => {
    const current = getScriptCardVersionMap(record, [Number(cardNo)])[cardNo];
    return Number(current) !== Number(version);
  });
}

export function mergeScriptEpisodes(existingEpisodes, incomingEpisodes, updatedAt) {
  const merged = new Map(
    (existingEpisodes ?? []).map((episode) => [Number(episode.episodeNo), episode]),
  );
  incomingEpisodes.forEach((episode) => {
    merged.set(Number(episode.episodeNo), {
      ...episode,
      episodeNo: Number(episode.episodeNo),
      updatedAt,
    });
  });
  return [...merged.values()].sort((left, right) => left.episodeNo - right.episodeNo);
}

export function applyScriptEpisodeUpload(record, {
  episodeTotal,
  episodes,
  file,
  uploadedAt,
  uploadedBy,
}) {
  const base = record ?? { uploads: [], episodes: [], cardVersions: [] };
  const mergedEpisodes = mergeScriptEpisodes(base.episodes, episodes, uploadedAt);
  const affectedCards = getAffectedScriptCards(episodes);
  const batchVersion = Math.max(
    0,
    ...(base.uploads ?? []).map((upload) => Number(upload.version) || 0),
  ) + 1;
  const uploadId = `${base.id ?? "SCRIPT-LIB"}-UPLOAD-${batchVersion}`;
  const upload = {
    id: uploadId,
    scope: "split",
    episodeNos: episodes.map((episode) => Number(episode.episodeNo)),
    episodeNo: null,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt,
    uploadedBy,
    version: batchVersion,
  };
  const addedVersions = affectedCards.map((cardNo) => {
    const range = scriptCardRange(cardNo, episodeTotal);
    const version = getScriptCardVersionMap(base, [cardNo])[cardNo] + 1;
    return {
      id: `${base.id ?? "SCRIPT-LIB"}-CARD-${cardNo}-V${version}`,
      cardNo,
      episodeStart: range.start,
      episodeEnd: range.end,
      version,
      sourceUploadId: uploadId,
      sourceFileName: file.name,
      uploadedAt,
      uploadedBy,
      episodes: mergedEpisodes
        .filter((episode) => episode.episodeNo >= range.start && episode.episodeNo <= range.end)
        .map((episode) => ({ ...episode })),
    };
  });

  return {
    ...base,
    updatedAt: uploadedAt,
    uploads: [...(base.uploads ?? []), upload],
    episodes: mergedEpisodes,
    cardVersions: [...(base.cardVersions ?? []), ...addedVersions],
  };
}
