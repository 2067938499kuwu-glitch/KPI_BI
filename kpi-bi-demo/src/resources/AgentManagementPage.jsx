import { useState } from "react";

const agents = [
  { id: 1, name: "运镜智能体", description: "--", type: "--", model: "--", creator: "运镜智能体", updatedAt: "2025-12-29 14:30:42" },
  { id: 2, name: "转韩漫提示词", description: "--", type: "--", model: "--", creator: "转韩漫提示词", updatedAt: "2025-12-24 14:46:33" },
  { id: 3, name: "拆角色场景道具", description: "--", type: "--", model: "--", creator: "拆角色场景道具", updatedAt: "2025-12-24 14:30:55" },
];

const canvasHeaders = ["#", "序号", "画布名称", "画布描述", "创建人", "创建时间", "更新时间", "操作"];
const agentHeaders = ["序号", "智能体名称", "智能体描述", "智能体类型", "模型", "创建人", "更新时间", "状态", "操作"];

export function AgentManagementPage() {
  const [expanded, setExpanded] = useState(true);
  const [keyword, setKeyword] = useState("");

  const reset = () => setKeyword("");

  return (
    <section aria-label="智能体管理" className="agent-management-page">
      <div aria-hidden="true" className="model-list-page__watermarks">
        {Array.from({ length: 36 }, (_, index) => <span key={index}>zhiyinAdmin<br />2026-07-20</span>)}
      </div>

      <form className="model-list-filter" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="agent-management-keyword">用户名</label>
        <input id="agent-management-keyword" onChange={(event) => setKeyword(event.target.value)} placeholder="输入漫画名称" value={keyword} />
        <button className="model-list-button model-list-button--primary" type="submit">查询</button>
        <button className="model-list-button model-list-button--reset" onClick={reset} type="button">重置</button>
        <button className="model-list-button model-list-button--add" type="button">创建画布</button>
      </form>

      <div className="model-list-card agent-management-card">
        <div className="agent-management-tables">
          <table aria-label="画布列表" className="agent-management-table agent-management-canvas-table">
            <colgroup>
              <col className="agent-canvas-col--toggle" />
              <col className="agent-canvas-col--index" />
              <col className="agent-canvas-col--name" />
              <col className="agent-canvas-col--description" />
              <col className="agent-canvas-col--creator" />
              <col className="agent-canvas-col--created" />
              <col className="agent-canvas-col--updated" />
              <col className="agent-canvas-col--actions" />
            </colgroup>
            <thead><tr>{canvasHeaders.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td><button aria-expanded={expanded} aria-label={expanded ? "收起画布" : "展开画布"} className="agent-management-expand" onClick={() => setExpanded((current) => !current)} type="button">⌄</button></td>
                <td>1</td>
                <td>漫画主体拆分</td>
                <td>剧本</td>
                <td>--</td>
                <td>2025-12-03 16:09:45</td>
                <td>2025-12-24 14:52:04</td>
                <td><div className="agent-management-actions"><button type="button">画布详情</button><button type="button">编辑</button><button className="is-danger" type="button">删除</button></div></td>
              </tr>
            </tbody>
          </table>

          {expanded ? (
            <table aria-label="智能体列表" className="agent-management-table agent-management-agent-table">
              <colgroup>
                <col className="agent-row-col--index" />
                <col className="agent-row-col--name" />
                <col className="agent-row-col--description" />
                <col className="agent-row-col--type" />
                <col className="agent-row-col--model" />
                <col className="agent-row-col--creator" />
                <col className="agent-row-col--updated" />
                <col className="agent-row-col--status" />
                <col className="agent-row-col--actions" />
              </colgroup>
              <thead><tr>{agentHeaders.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>{agent.id}</td>
                    <td>{agent.name}</td>
                    <td>{agent.description}</td>
                    <td>{agent.type}</td>
                    <td>{agent.model}</td>
                    <td>{agent.creator}</td>
                    <td>{agent.updatedAt}</td>
                    <td><span className="agent-management-status">下线</span></td>
                    <td><div className="agent-management-actions"><button type="button">查看版本历史</button><button type="button">编辑</button><button type="button">上线</button><button className="is-danger" type="button">删除</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        <footer className="model-list-pagination">
          <span>共 1 条</span>
          <button className="model-list-page-size" type="button">20条/页 <span aria-hidden="true">⌄</span></button>
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

export { agents };
