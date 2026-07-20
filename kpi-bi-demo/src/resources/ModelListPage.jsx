import { useMemo, useState } from "react";

const modelRows = [
  { id: 1, name: "GPT-5", displayName: "GPT-5", description: "OpenAI 推出的通用文本模型，适合长对话、创作。", price: "0", calls: "546", successRate: "99.45%", updatedAt: "--", enabled: true, editable: true },
  { id: 2, name: "doubao-seedream-3-0-t2i-250415", displayName: "第三方 即梦 3.0", description: "豆包·文生图模型（3.0版本），支持高质量生成。", price: "0", calls: "9588", successRate: "95.01%", updatedAt: "--", enabled: true, editable: true },
  { id: 3, name: "gemini-2.5-flash-image-preview", displayName: "nano", description: "Gemini Flash 版图像生成模型，快速预览。", price: "0.0156", calls: "1474", successRate: "94.98%", updatedAt: "--", enabled: true, editable: true },
  { id: 4, name: "midjourney-imagine", displayName: "Midjourney", description: "Midjourney 图像生成模型，风格化强。", price: "0.0608", calls: "73", successRate: "98.63%", updatedAt: "2025-12-19 11:11:32", enabled: true, editable: true },
  { id: 5, name: "seedream-4-0-250828", displayName: "第三方 即梦4.0", description: "自研图像大模型 4.0 版本，支持多图输入融合。", price: "0.024", calls: "1141", successRate: "100.00%", updatedAt: "--", enabled: true, editable: true },
  { id: 6, name: "sora-2", displayName: "sora-2", description: "OpenAI 视频生成模型 Sora 第二版。", price: "0.027", calls: "53", successRate: "43.40%", updatedAt: "--", enabled: false, editable: true },
  { id: 7, name: "seedance-1-0-pro-250528", displayName: "即梦video4.0", description: "豆包图文生成图模型（视频模式）。", price: "1.0486", calls: "209", successRate: "96.17%", updatedAt: "--", enabled: false, editable: true },
  { id: 8, name: "kling-v1", displayName: "Kling 视频模型 v1", description: "Kling 视频生成模型，支持运镜描述、时长、分辨率、模式等参数。", price: "0.252", calls: "68", successRate: "98.53%", updatedAt: "--", enabled: false, editable: true },
  { id: 9, name: "Low Resolution V2", displayName: "Low Resolution V2", description: "增强网页图形和屏幕截图等低分辨率图像的清晰度和细节。", price: "0", calls: "0", successRate: "0.00%", updatedAt: "--", enabled: false, editable: true },
  { id: 10, name: "High Fidelity V2", displayName: "topaz高清", description: "非常适合高质量图像，在专业摄影中保留复杂的细节。", price: "0", calls: "0", successRate: "0.00%", updatedAt: "--", enabled: false, editable: false },
  { id: 11, name: "prob-4", displayName: "画质升级prob-4", description: "利用我们强大的升级和恢复技术，为标清或低画质视频注入全新活力…", price: "0", calls: "0", successRate: "0.00%", updatedAt: "--", enabled: false, editable: true },
  { id: 12, name: "nyx-3", displayName: "自动 HQ 降噪", description: "我们的智能降噪技术可消除干扰噪音，同时保留重要细节。该技术采…", price: "0", calls: "0", successRate: "0.00%", updatedAt: "--", enabled: false, editable: true },
  { id: 13, name: "image-upscaler", displayName: "upscaler高清", description: "详情参考 https://imgupscaler.com/", price: "0", calls: "0", successRate: "0.00%", updatedAt: "--", enabled: true, editable: true },
  { id: 14, name: "gemini", displayName: "gemini-2.5-pro", description: "Gemini 文本输出", price: "0", calls: "108", successRate: "93.52%", updatedAt: "--", enabled: true, editable: false },
  { id: 15, name: "qwen-txt-image-create", displayName: "千问文生图", description: "Qwen-image 适合文生图和海报设计", price: "0", calls: "0", successRate: "0.00%", updatedAt: "--", enabled: false, editable: true },
  { id: 16, name: "qwen-video-create-wan-2.5", displayName: "千问图生视频", description: "--", price: "1.5", calls: "6", successRate: "100.00%", updatedAt: "--", enabled: false, editable: true },
  { id: 17, name: "gpt-image-1", displayName: "gpt文生图", description: "gpt 文生图", price: "0.1998", calls: "15", successRate: "100.00%", updatedAt: "--", enabled: false, editable: true },
  { id: 18, name: "flux-kontext-max", displayName: "flux的kontext改图", description: "--", price: "0.064", calls: "25", successRate: "100.00%", updatedAt: "--", enabled: true, editable: true },
  { id: 19, name: "flux-kontext-max-pro", displayName: "flux的kontext改图 pro", description: "--", price: "0.032", calls: "0", successRate: "0.00%", updatedAt: "--", enabled: true, editable: true },
  { id: 20, name: "hailuo-02-pro", displayName: "海螺 图生视频", description: "海螺 图生视频", price: "0.3969", calls: "10", successRate: "100.00%", updatedAt: "--", enabled: false, editable: true },
];

const tableHeaders = ["序号", "模型名称", "模型展示名称", "模型描述", "价格(最高)", "调用次数", "成功率", "更新时间", "状态", "操作"];

export function ModelListPage() {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const visibleRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return modelRows;
    return modelRows.filter((row) => [row.name, row.displayName, row.description].some((value) => value.toLowerCase().includes(keyword)));
  }, [query]);

  const search = (event) => {
    event.preventDefault();
    setQuery(draftQuery);
  };

  const reset = () => {
    setDraftQuery("");
    setQuery("");
  };

  return (
    <section aria-label="模型列表" className="model-list-page">
      <div aria-hidden="true" className="model-list-page__watermarks">
        {Array.from({ length: 36 }, (_, index) => <span key={index}>zhiyinAdmin<br />2026-07-20</span>)}
      </div>

      <form className="model-list-filter" onSubmit={search}>
        <label htmlFor="model-list-keyword">模型</label>
        <input id="model-list-keyword" onChange={(event) => setDraftQuery(event.target.value)} placeholder="输入模型名称" value={draftQuery} />
        <button className="model-list-button model-list-button--primary" type="submit">查询</button>
        <button className="model-list-button model-list-button--reset" onClick={reset} type="button">重置</button>
        <button className="model-list-button model-list-button--add" type="button">添加模型</button>
      </form>

      <div className="model-list-card">
        <div className="model-list-table-wrap">
          <table aria-label="模型列表" className="model-list-table">
            <colgroup>
              <col className="model-list-table__index" />
              <col className="model-list-table__name" />
              <col className="model-list-table__display-name" />
              <col className="model-list-table__description" />
              <col className="model-list-table__price" />
              <col className="model-list-table__calls" />
              <col className="model-list-table__success" />
              <col className="model-list-table__updated" />
              <col className="model-list-table__status" />
              <col className="model-list-table__actions" />
            </colgroup>
            <thead><tr>{tableHeaders.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td title={row.name}>{row.name}</td>
                  <td title={row.displayName}>{row.displayName}</td>
                  <td title={row.description}>{row.description}</td>
                  <td>{row.price}</td>
                  <td>{row.calls}</td>
                  <td>{row.successRate}</td>
                  <td>{row.updatedAt}</td>
                  <td><span className={`model-list-status ${row.enabled ? "is-enabled" : "is-disabled"}`}>{row.enabled ? "启用" : "停用"}</span></td>
                  <td><div className="model-list-actions"><button className={row.enabled ? "is-disable" : "is-enable"} type="button">{row.enabled ? "禁用" : "启用"}</button>{row.editable ? <button type="button">编辑</button> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="model-list-pagination">
          <span>共 36 条</span>
          <button className="model-list-page-size" type="button">20条/页 <span aria-hidden="true">⌄</span></button>
          <button aria-label="上一页" className="model-list-pagination__arrow" disabled type="button">‹</button>
          <button aria-current="page" className="is-current" type="button">1</button>
          <button type="button">2</button>
          <button aria-label="下一页" className="model-list-pagination__arrow" type="button">›</button>
          <span>前往</span>
          <input aria-label="前往页码" defaultValue="1" />
          <span>页</span>
        </footer>
      </div>
    </section>
  );
}

export { modelRows };
