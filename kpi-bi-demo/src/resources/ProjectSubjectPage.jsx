import { PencilSimple } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

const projectSubjectRows = [
  { id: 1, name: "玄幻", projects: 15, episodes: 635 },
  { id: 2, name: "热血", projects: 0, episodes: 0 },
  { id: 3, name: "都市", projects: 15, episodes: 419 },
  { id: 4, name: "穿越", projects: 4, episodes: 97 },
  { id: 5, name: "资产库", projects: 4, episodes: 4 },
  { id: 6, name: "仙侠", projects: 4, episodes: 73 },
  { id: 7, name: "武侠", projects: 1, episodes: 60 },
  { id: 8, name: "民国", projects: 3, episodes: 81 },
  { id: 9, name: "古代", projects: 1, episodes: 61 },
  { id: 10, name: "外部剧本", projects: 3, episodes: 122 },
  { id: 11, name: "恋爱", projects: 0, episodes: 0 },
  { id: 12, name: "玄幻", projects: 15, episodes: 635 },
  { id: 13, name: "都市", projects: 15, episodes: 419 },
  { id: 14, name: "民国", projects: 3, episodes: 81 },
  { id: 15, name: "财务工时专用", projects: 0, episodes: 0 },
  { id: 16, name: "古典", projects: 0, episodes: 0 },
  { id: 17, name: "动作", projects: 0, episodes: 0 },
];

const projectSubjectHeaders = ["序号", "题材", "项目量", "集数", "是否可用", "操作"];

export function ProjectSubjectPage() {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("请选择状态");

  const visibleRows = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) return projectSubjectRows;
    return projectSubjectRows.filter((row) => row.name.includes(keyword));
  }, [query]);

  const search = (event) => {
    event.preventDefault();
    setQuery(draftQuery);
  };

  const reset = () => {
    setDraftQuery("");
    setQuery("");
    setAvailability("请选择状态");
  };

  return (
    <section aria-label="项目题材" className="project-subject-page">
      <div aria-hidden="true" className="model-list-page__watermarks">
        {Array.from({ length: 45 }, (_, index) => <span key={index}>zhiyinAdmin<br />2026-07-20</span>)}
      </div>

      <form className="project-subject-filter" onSubmit={search}>
        <label htmlFor="project-subject-keyword">题材</label>
        <input
          id="project-subject-keyword"
          onChange={(event) => setDraftQuery(event.target.value)}
          placeholder="输入题材名称"
          value={draftQuery}
        />
        <label htmlFor="project-subject-availability">是否可用</label>
        <select
          id="project-subject-availability"
          onChange={(event) => setAvailability(event.target.value)}
          value={availability}
        >
          <option>请选择状态</option>
          <option>可用</option>
          <option>不可用</option>
        </select>
        <button className="project-subject-button is-primary" type="submit">查询</button>
        <button className="project-subject-button" onClick={reset} type="button">重置</button>
        <button className="project-subject-button is-primary is-add" type="button">新增题材</button>
      </form>

      <div className="project-subject-card">
        <div className="project-subject-table-wrap">
          <table aria-label="项目题材列表" className="project-subject-table">
            <colgroup>
              <col className="project-subject-col--index" />
              <col className="project-subject-col--name" />
              <col className="project-subject-col--projects" />
              <col className="project-subject-col--episodes" />
              <col className="project-subject-col--availability" />
              <col className="project-subject-col--action" />
            </colgroup>
            <thead><tr>{projectSubjectHeaders.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr className={row.id === 3 ? "is-highlighted" : ""} key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.projects}</td>
                  <td>{row.episodes}</td>
                  <td>
                    <button aria-label={`题材${row.id}可用状态`} className="project-subject-switch is-enabled" type="button"><span /></button>
                  </td>
                  <td>
                    <button aria-label={`编辑${row.name}${row.id}`} className="project-subject-edit" type="button"><PencilSimple size={17} weight="bold" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="model-list-pagination project-subject-pagination">
          <span>共 17 条</span>
          <button className="model-list-page-size" type="button">20条/页<span aria-hidden="true">⌄</span></button>
          <button aria-label="上一页" className="model-list-pagination__arrow" disabled type="button">‹</button>
          <button aria-current="page" className="is-current" type="button">1</button>
          <button aria-label="下一页" className="model-list-pagination__arrow" disabled type="button">›</button>
          <span>前往</span>
          <input aria-label="前往页码" defaultValue="1" />
          <span>页</span>
        </footer>
      </div>
    </section>
  );
}

export { projectSubjectRows };
