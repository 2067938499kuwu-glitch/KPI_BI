import styles from "./SscDataMaintenancePage.module.css";

const SSC_VIEW_TITLES = {
  org: "组织架构与花名册",
  tables: "表格管理",
  templates: "文件模板管理",
};

export function SscDataMaintenancePage({ view = "org" }) {
  const safeView = Object.prototype.hasOwnProperty.call(
    SSC_VIEW_TITLES,
    view,
  )
    ? view
    : "org";
  const pageUrl = `${import.meta.env.BASE_URL}ssc-data-maintenance.html?embed=1&view=${safeView}`;

  return (
    <section className={styles.page} aria-label="SSC服务中心">
      <iframe
        className={styles.frame}
        src={pageUrl}
        title={`SSC服务中心 - ${SSC_VIEW_TITLES[safeView]}`}
        sandbox="allow-scripts allow-forms allow-downloads allow-same-origin"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
