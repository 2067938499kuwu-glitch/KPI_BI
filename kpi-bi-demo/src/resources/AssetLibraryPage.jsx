import { CalendarBlank, PlusCircle, Trash, User } from "@phosphor-icons/react";

const spriteWidth = 2325;
const cropWidth = 225;
const spriteColumns = [3, 250, 495, 742, 988, 1234, 1480, 1727, 1973];

const assetRows = [
  { id: 4448, name: "青萝", tags: ["角色", "古装人物", "女性"], creator: "布只", faceAvailable: true, value: "1", crop: { x: spriteColumns[0], y: 84 } },
  { id: 4447, name: "捉妖/广场", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[1], y: 84 } },
  { id: 4446, name: "二楼包厢", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[2], y: 84 } },
  { id: 4445, name: "捉妖/屋顶", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[3], y: 84 } },
  { id: 4444, name: "柳仙殿", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[4], y: 84 } },
  { id: 4443, name: "捉妖/包厢内", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[5], y: 84 } },
  { id: 4442, name: "*", tags: ["角色"], creator: "杰", faceAvailable: true, value: "*", crop: { x: spriteColumns[6], y: 84 } },
  { id: 4441, name: "捉妖/后山深潭", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[7], y: 84 } },
  { id: 4440, name: "陈记门口", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[8], y: 84 } },
  { id: 4439, name: "捉妖/城门远景", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[0], y: 457 } },
  { id: 4438, name: "捉妖/城门", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[1], y: 457 } },
  { id: 4437, name: "长枪", tags: ["辅助素材", "古代道具"], creator: "布只", value: "1", crop: { x: spriteColumns[2], y: 457 } },
  { id: 4436, name: "神教密坛", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[3], y: 457 } },
  { id: 4435, name: "神教分坛", tags: ["场景"], creator: "王康", value: "1", crop: { x: spriteColumns[4], y: 457 } },
  { id: 4434, name: "神教魂灯", tags: ["辅助素材", "古代道具"], creator: "布只", value: "1", crop: { x: spriteColumns[5], y: 457 } },
  { id: 4433, name: "白色念珠", tags: ["辅助素材", "古代道具"], creator: "布只", value: "1", crop: { x: spriteColumns[6], y: 457 } },
  { id: 4432, name: "捉妖/二狗子", tags: ["角色"], creator: "王康", faceAvailable: true, value: "1", crop: { x: spriteColumns[7], y: 457 } },
  { id: 4431, name: "寒潭锁链", tags: ["辅助素材", "古代道具"], creator: "布只", value: "1", crop: { x: spriteColumns[8], y: 457 } },
  { id: 4430, name: "符纸青色", tags: ["辅助素材", "古代道具"], creator: "布只", value: "1", crop: { x: spriteColumns[0], y: 830 } },
  { id: 4429, name: "军报", tags: ["辅助素材", "古代道具"], creator: "布只", value: "1", crop: { x: spriteColumns[1], y: 830 } },
];

function AssetPreview({ asset }) {
  return (
    <div className="asset-library-card__preview">
      <img
        alt=""
        src="/assets/reference/asset-library-reference.png"
        style={{
          "--asset-sprite-left": `${-(asset.crop.x / cropWidth) * 100}cqw`,
          "--asset-sprite-top": `${-(asset.crop.y / cropWidth) * 100}cqw`,
          "--asset-sprite-width": `${(spriteWidth / cropWidth) * 100}cqw`,
        }}
      />
    </div>
  );
}

function AssetCard({ asset }) {
  return (
    <article className="asset-library-card" data-testid="asset-library-card">
      <AssetPreview asset={asset} />
      <div className="asset-library-card__body">
        <strong>{asset.name}</strong>
        <div className="asset-library-card__tags">{asset.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="asset-library-card__meta"><span><CalendarBlank size={12} />2026.07.20</span><i>·</i><span><User size={12} />{asset.creator}</span></div>
        <input aria-label={`${asset.name}素材值`} readOnly value={asset.value} />
      </div>
      <footer className="asset-library-card__footer">
        <button aria-label={`${asset.name}启用状态`} className="asset-library-toggle is-enabled" type="button"><span>启用</span><i /></button>
        <button aria-label={`${asset.name}共享状态`} className="asset-library-toggle is-internal" type="button"><i /><span>内部</span></button>
        <button aria-label={`${asset.name}添加`} className="asset-library-icon-button" type="button"><PlusCircle size={15} /></button>
        <button aria-label={`${asset.name}删除`} className="asset-library-icon-button" type="button"><Trash size={14} /></button>
      </footer>
    </article>
  );
}

export function AssetLibraryPage() {
  return (
    <section aria-label="素材库" className="asset-library-page">
      <div aria-hidden="true" className="model-list-page__watermarks">
        {Array.from({ length: 45 }, (_, index) => <span key={index}>zhiyinAdmin<br />2026-07-20</span>)}
      </div>

      <form className="asset-library-filter" onSubmit={(event) => event.preventDefault()}>
        <label>名称<input placeholder="搜索" /></label>
        <label>时间<span className="asset-library-date-range"><CalendarBlank size={14} />上传开始时间 - 上传结束时间</span></label>
        <label>状态<select defaultValue="已审核"><option>已审核</option></select></label>
        <label>分类<select defaultValue="筛选"><option>筛选</option></select></label>
        <label>共享<select defaultValue="本公司"><option>本公司</option></select></label>
        <label>渠道<select defaultValue="公司筛选"><option>公司筛选</option></select></label>
        <button className="asset-library-button is-primary" type="submit">查询</button>
        <button className="asset-library-button" type="button">重置</button>
        <div className="asset-library-filter__actions">
          <button className="asset-library-button is-primary" type="button">＋ 分类编辑</button>
          <button className="asset-library-button is-primary" type="button">＋ 上传素材</button>
        </div>
      </form>

      <div className="asset-library-shell">
        <div className="asset-library-scroll">
          <div className="asset-library-grid">{assetRows.map((asset) => <AssetCard asset={asset} key={asset.id} />)}</div>
        </div>
        <footer className="asset-library-pagination">
          <span>共 2801 条</span>
          <button disabled type="button">‹</button>
          <button className="is-current" type="button">1</button>
          <button type="button">2</button>
          <button type="button">3</button>
          <button type="button">4</button>
          <button type="button">5</button>
          <button type="button">6</button>
          <button type="button">•••</button>
          <button type="button">141</button>
          <button type="button">›</button>
          <span>前往</span>
          <input aria-label="前往页码" defaultValue="1" />
          <span>页</span>
        </footer>
      </div>
    </section>
  );
}

export { assetRows };
