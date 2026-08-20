import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../App";
import { REVIEW_STATUS } from "./logic";

afterEach(cleanup);

function openPerformance() {
  fireEvent.click(screen.getByRole("button", { name: "绩效中心" }));
}

function switchRole(name) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("绩效中心交互与权限", () => {
  test("一体化导航完整且默认进入工作台", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "统一工作台" })).toHaveClass("is-active");
    expect(screen.getByRole("button", { name: "经营驾驶舱" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "绩效中心" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "周报" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "招聘管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选题库" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "项目管理" })).toBeInTheDocument();
    expect(screen.getByText("SSC服务中心")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "组织架构与花名册" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "表格管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "文件模板管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "系统配置" })).toBeInTheDocument();
    const navigationLabels = within(screen.getByRole("navigation", { name: "主导航" })).getAllByRole("button").map((button) => button.textContent.trim());
    expect(navigationLabels.indexOf("成本与工时")).toBeGreaterThan(navigationLabels.indexOf("作品库"));
  });

  test("目录标题支持独立折叠与展开", () => {
    render(<App />);
    const navigation = screen.getByRole("navigation", { name: "主导航" });
    const contentGroup = within(navigation).getByRole("button", { name: "内容与项目" });

    expect(contentGroup).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(contentGroup);
    expect(contentGroup).toHaveAttribute("aria-expanded", "false");
    expect(within(navigation).queryByRole("button", { name: "选题库" })).toBeNull();
    expect(within(navigation).getByRole("button", { name: "统一工作台" })).toBeInTheDocument();

    const aiGroup = within(navigation).getByRole("button", { name: "AI与资源" });
    fireEvent.click(aiGroup);
    fireEvent.click(aiGroup);
    const resourceGroup = within(navigation).getByRole("button", { name: "资源中心" });
    expect(resourceGroup).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(resourceGroup);
    expect(resourceGroup).toHaveAttribute("aria-expanded", "false");
    expect(within(navigation).queryByRole("button", { name: "模型列表" })).toBeNull();
    expect(within(navigation).getByRole("button", { name: "智能体管理" })).toBeInTheDocument();

    fireEvent.click(contentGroup);
    const projectEntry = within(navigation).getByRole("button", { name: "项目管理" });
    expect(projectEntry).not.toHaveAttribute("aria-expanded");
    fireEvent.click(projectEntry);
    expect(projectEntry).toHaveClass("is-active");
    expect(within(navigation).queryByRole("button", { name: "项目立项" })).toBeNull();
    expect(within(navigation).queryByRole("button", { name: "项目总览" })).toBeNull();
    expect(screen.getByRole("heading", { name: "项目总览、立项与任务协同" })).toBeInTheDocument();
  });

  test.each(["成本与工时", "交付中心", "作品库"])(
    "%s 仅展示空白页面",
    (label) => {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: label }));
      const blankPage = screen.getByLabelText(label, { selector: ".blank-directory-page" });
      expect(blankPage).toBeEmptyDOMElement();
      expect(blankPage.closest(".content")).toHaveClass("content--blank-directory");
    },
  );

  test("模型列表按照参考页面展示完整数据", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "模型列表" }));

    expect(screen.getByPlaceholderText("输入模型名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加模型" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "模型列表" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(21);
    expect(screen.getAllByText("GPT-5", { selector: "td" })).toHaveLength(2);
    expect(screen.getByText("hailuo-02-pro")).toBeInTheDocument();
    expect(screen.getByText("共 36 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("模型列表", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("智能体管理按照参考页面展示画布与智能体", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "智能体管理" }));

    expect(screen.getByPlaceholderText("输入漫画名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建画布" })).toBeInTheDocument();
    const canvasTable = screen.getByRole("table", { name: "画布列表" });
    const agentTable = screen.getByRole("table", { name: "智能体列表" });
    expect(within(canvasTable).getAllByRole("row")).toHaveLength(2);
    expect(within(agentTable).getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("漫画主体拆分")).toBeInTheDocument();
    expect(screen.getAllByText("运镜智能体", { selector: "td" })).toHaveLength(2);
    expect(screen.getAllByText("转韩漫提示词", { selector: "td" })).toHaveLength(2);
    expect(screen.getAllByText("拆角色场景道具", { selector: "td" })).toHaveLength(2);
    expect(screen.getByText("共 1 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("智能体管理", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("素材库按照参考页面展示筛选、卡片和分页", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "素材库" }));

    expect(screen.getByPlaceholderText("搜索")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /分类编辑/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /上传素材/ })).toBeInTheDocument();
    expect(screen.getAllByTestId("asset-library-card")).toHaveLength(20);
    expect(screen.getByText("青萝")).toBeInTheDocument();
    expect(screen.getByText("军报")).toBeInTheDocument();
    expect(screen.getByText("共 2801 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("素材库", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("项目题材按照参考页面展示筛选、题材表格和分页", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "项目题材" }));

    expect(screen.getByPlaceholderText("输入题材名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增题材" })).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "项目题材列表" })).getAllByRole("row")).toHaveLength(18);
    expect(screen.getByText("财务工时专用")).toBeInTheDocument();
    expect(screen.getByText("动作")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /题材\d+可用状态/ })).toHaveLength(17);
    expect(screen.getByText("共 17 条")).toBeInTheDocument();
    expect(screen.queryByLabelText("项目题材", { selector: ".blank-directory-page" })).toBeNull();
  });

  test("用户可见绩效页面不再出现OKR旧术语并使用绩效委员会按钮", () => {
    render(<App />);
    openPerformance();
    expect(document.body.textContent).not.toContain("OKR");
    expect(screen.getAllByRole("button", { name: "绩效委员会审核" }).length).toBeGreaterThan(0);
    expect(screen.getByText("综合绩效完成度")).toBeInTheDocument();
    expect(screen.getByText("评分未完成")).toBeInTheDocument();
    expect(screen.getByText("平均分")).toBeInTheDocument();
    expect(screen.getByText("最高 / 最低")).toBeInTheDocument();
    expect(screen.queryByText("周报按时提交率")).toBeNull();
    expect(screen.queryByText("周报逾期人数")).toBeNull();
  });

  test("顶部指标卡是不可点击的展示卡片", () => {
    render(<App />);
    openPerformance();
    const card = screen.getByText("综合绩效完成度").closest("article");
    expect(card).toHaveClass("performance-summary-card");
    expect(card?.tagName).toBe("ARTICLE");
    expect(within(card).queryByRole("button")).toBeNull();
    expect(within(card).getByText("15").tagName).toBe("STRONG");
    expect(within(card).getByLabelText("完成率 83.3%")).toBeInTheDocument();
    expect(screen.getByText("88.7")).toBeInTheDocument();
  });

  test("指标卡不随状态页签与等级筛选改变", () => {
    render(<App />);
    openPerformance();
    const before = screen.getByText("综合绩效完成度").parentElement?.textContent;
    fireEvent.change(screen.getByLabelText("等级筛选"), { target: { value: "S" } });
    fireEvent.click(screen.getByRole("button", { name: /已结束/ }));
    expect(screen.getByText("综合绩效完成度").parentElement?.textContent).toBe(before);
  });

  test("等级筛选支持正序和倒序展示", () => {
    render(<App />);
    openPerformance();
    const gradeSelect = screen.getByLabelText("等级筛选");
    expect(screen.getByRole("option", { name: "等级正序（D→S）" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "等级倒序（S→D）" })).toBeInTheDocument();
    fireEvent.change(gradeSelect, { target: { value: "grade_desc" } });
    expect(gradeSelect).toHaveValue("grade_desc");
  });

  test("BP和CEO不能互相代办评分与委员会审核节点", () => {
    render(<App />);
    switchRole("BP组织视图");
    openPerformance();
    fireEvent.change(screen.getByLabelText("状态"), { target: { value: REVIEW_STATUS.hrReview } });
    expect(screen.getAllByRole("button", { name: "BP评分与评语" }).some((button) => !button.disabled)).toBe(true);

    switchRole("CEO经营驾驶舱");
    fireEvent.change(screen.getByLabelText("状态"), { target: { value: REVIEW_STATUS.hrReview } });
    expect(screen.queryByRole("button", { name: "BP评分与评语" })).toBeNull();
    fireEvent.change(screen.getByLabelText("状态"), { target: { value: REVIEW_STATUS.committeeApproval } });
    expect(screen.getAllByRole("button", { name: "绩效委员会审核" }).some((button) => !button.disabled)).toBe(true);
  });

  test("员工视图只显示本人且不能发起他人流程", () => {
    render(<App />);
    switchRole("员工个人工作台");
    openPerformance();
    expect(screen.getAllByText("张小北").length).toBeGreaterThan(0);
    expect(screen.queryByText("周编剧")).toBeNull();
    expect(screen.queryByRole("button", { name: "下发月度绩效目标" })).toBeNull();
  });

  test("提供可重置并从Leader开始流转的全流程测试数据", () => {
    render(<App />);
    switchRole("Leader团队负责人");
    openPerformance();

    const testTag = screen.getByText("全流程测试");
    const testRow = testTag.closest(".admin-table__row--performance-ledger");
    expect(testRow).toBeInTheDocument();
    expect(within(testRow).getByText("张小北")).toBeInTheDocument();
    expect(within(testRow).getByRole("button", { name: "下发月度绩效目标" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "重置全流程测试" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "全流程测试数据已重置到“绩效目标待下发”",
    );
    expect(screen.getByText("全流程测试")).toBeInTheDocument();
  });

  test("Leader按部门岗位选择模板，并在草案中编辑后下发", () => {
    render(<App />);
    switchRole("Leader团队负责人");
    openPerformance();
    fireEvent.click(screen.getAllByRole("button", { name: "下发月度绩效目标" }).find((button) => !button.disabled));
    expect(screen.getByRole("heading", { name: "下发月度绩效目标" })).toBeInTheDocument();
    expect(screen.getByText("岗位通用绩效目标")).toBeInTheDocument();
    expect(screen.getByText("个人月度重点目标")).toBeInTheDocument();
    expect(screen.getByText("独立加减分项")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 新增绩效维度" })).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "+ 新增指标" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "删除指标" }).some((button) => !button.disabled)).toBe(true);
    expect(screen.getAllByText("独立计分").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("当前部门岗位模板")).toHaveValue("template-edit-middle");
    expect(screen.getByRole("option", { name: "剪辑中心 · 中级剪辑师" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回列表" }));
    expect(screen.getByText("人员绩效列表")).toBeInTheDocument();
  });

  test("BP可按部门和岗位创建绩效模板并配置协助评分，Leader看不到维护入口", () => {
    render(<App />);
    switchRole("BP组织视图");
    openPerformance();
    fireEvent.click(screen.getByRole("button", { name: "BP绩效模板配置" }));
    expect(screen.getByRole("dialog", { name: "维护岗位绩效目标模板" })).toBeInTheDocument();
    expect(screen.getByText("工作任务与权重")).toBeInTheDocument();
    const templateDialog = screen.getByRole("dialog", { name: "维护岗位绩效目标模板" });
    expect(within(templateDialog).getAllByText("评分档位与完成标准").length).toBeGreaterThan(0);
    expect(within(templateDialog).getByText(/工作任务权重/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "+ 添加工作任务" }).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("按时交付率")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("优秀").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("完成基准量的130%以上（含130%）。")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IP成交")).toBeInTheDocument();
    expect(screen.getByLabelText("IP成交评定标准").value).toContain("IP合作成交");
    expect(screen.getByLabelText("IP成交数据来源").value).toContain("上级和协作方评价");
    expect(screen.getByLabelText("IP成交最低分")).toHaveValue(0);
    expect(screen.getByLabelText("IP成交最高分")).toHaveValue(10);
    expect(within(templateDialog).getByText("不参与任务权重，按类别独立计分。")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "+ 添加档位" })[0]);
    expect(screen.getByDisplayValue("新增档位")).toBeInTheDocument();
    expect(screen.getByLabelText("模板所属部门")).toBeInTheDocument();
    expect(screen.getByLabelText("对应岗位")).toBeInTheDocument();
    expect(screen.queryByLabelText("模板默认开启协助评分")).toBeNull();
    expect(screen.queryByLabelText("模板名称")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "效果预览" }));
    expect(screen.getByRole("dialog", { name: "员工视角绩效考核表预览" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "成果输出与评分档位" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭效果预览" }));
    fireEvent.click(screen.getByRole("button", { name: "+ 新建部门" }));
    fireEvent.change(screen.getByLabelText("新部门名称"), { target: { value: "测试部门" } });
    fireEvent.click(screen.getByRole("button", { name: "确认新建部门" }));
    expect(screen.getByRole("option", { name: "测试部门" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "+ 添加工作任务" })[0]);
    expect(screen.getByDisplayValue("新增绩效目标")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭模板维护" }));
    switchRole("Leader团队负责人");
    expect(screen.queryByRole("button", { name: "BP绩效模板配置" })).toBeNull();
  });

  test("详情展示目标版本、结果版本和评分拆分", () => {
    render(<App />);
    openPerformance();
    fireEvent.click(screen.getAllByRole("button", { name: "详情" })[0]);
    expect(screen.getByRole("button", { name: "导出Excel" })).toBeInTheDocument();
    expect(screen.getByText("绩效目标版本")).toBeInTheDocument();
    expect(screen.getByText("绩效结果版本")).toBeInTheDocument();
    expect(screen.getByText("基础绩效分")).toBeInTheDocument();
    expect(screen.getAllByText("加减分").length).toBeGreaterThan(0);
    const firstLeaderReviews = screen.getAllByLabelText(/一级领导评价/);
    const secondLeaderReviews = screen.getAllByLabelText(/协助评分人评价/);
    const bpReviews = screen.getAllByLabelText(/BP评价/);
    expect(firstLeaderReviews.length).toBeGreaterThan(0);
    expect(secondLeaderReviews).toHaveLength(firstLeaderReviews.length);
    expect(bpReviews).toHaveLength(firstLeaderReviews.length);
    expect(firstLeaderReviews[0]).toHaveTextContent("部门领导");
    expect(firstLeaderReviews[0]).toHaveTextContent("江晚");
    expect(firstLeaderReviews[0]).toHaveTextContent("交付数量达到目标，节点响应及时。");
    expect(secondLeaderReviews[0]).toHaveTextContent("协助评分人");
    expect(secondLeaderReviews[0]).toHaveTextContent("复核通过，产出数据与交付记录一致。");
  });

  test("协助评分恢复完整绩效表并保留评分结论", () => {
    render(<App />);
    switchRole("Leader团队负责人");
    openPerformance();
    const actionButton = screen.getAllByRole("button", { name: "协助评分与评语" }).find((button) => !button.disabled);
    fireEvent.click(actionButton);

    expect(screen.getByText("协助评分与评语处理")).toBeInTheDocument();
    expect(screen.getByLabelText("协助评分结论")).toBeInTheDocument();
    const scoreTable = document.querySelector(".okr-sheet-table");
    expect(scoreTable).toBeInTheDocument();
    expect(scoreTable.closest(".okr-sheet-card")).toHaveClass("okr-sheet-card--second_review");
    expect(scoreTable.closest(".okr-sheet-scroll").scrollLeft).toBe(852);
    expect(within(scoreTable).getAllByRole("columnheader").map((header) => header.textContent.trim())).toEqual([
      "指标名称",
      "评定标准",
      "数据来源",
      "权重",
      "完成情况（被考核人自填）",
      "部门领导评分",
      "一级评语",
      "协助评分",
      "协助评分评语",
      "BP评分",
      "BP评语",
      "单项综合得分",
    ]);
    const metricRows = within(scoreTable).getAllByRole("row").slice(1);
    expect(metricRows.length).toBeGreaterThan(0);
    expect(within(metricRows[0]).getAllByRole("cell")).toHaveLength(12);
    expect(within(scoreTable).getAllByLabelText(/协助评分$/).length).toBe(metricRows.length);
    expect(within(scoreTable).getAllByLabelText(/协助评分评语/).length).toBe(metricRows.length);
    const referencePanel = screen.getByLabelText("当月周报记录");
    expect(scoreTable.compareDocumentPosition(referencePanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const projectReferenceHeading = screen.getByText("项目交付与业务表现");
    const scoreReferenceHeading = screen.getByText("评分参考数据");
    expect(projectReferenceHeading.compareDocumentPosition(scoreReferenceHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(scoreReferenceHeading.compareDocumentPosition(referencePanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));
    expect(screen.getByRole("alert")).toHaveTextContent("请填写协助评分汇总意见");

    fireEvent.change(screen.getByLabelText("协助评分结论"), { target: { value: "return" } });
    fireEvent.change(screen.getByLabelText("协助评分汇总意见"), { target: { value: "证明材料口径不完整，请补充后重新提交。" } });
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));
    expect(screen.getByText("操作成功，流程状态与操作日志已更新。")).toBeInTheDocument();
  });
});
