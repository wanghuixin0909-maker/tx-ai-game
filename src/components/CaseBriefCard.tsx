/**
 * CaseBriefCard.tsx - 案件简报卡片组件
 *
 * 功能说明：
 * - 展示案件的基本信息（受害者、身份、阶段等）
 * - 支持展开/收起详细信息区域
 * - 支持紧凑模式（compact/full）和密度模式（default/tight）
 * - 使用 CSS max-height 动画实现平滑展开效果
 *
 * 性能优化说明：
 * - 使用 useId 生成无冲突的 ARIA ID
 * - 使用 ResizeObserver 监听内容高度变化，精确控制动画
 * - buildBriefSummary 提取为组件外部函数，避免重复创建
 *
 * @module components/CaseBriefCard
 * @version 1.0.0
 */

// React 核心 hooks
import { useEffect, useId, useRef, useState } from "react";
// 案件元数据类型定义
import type { CaseMeta } from "../types/game";

/**
 * 组件 Props 接口
 * @interface CaseBriefCardProps
 * @property {CaseMeta} caseFile - 案件元数据对象，包含案件的所有信息
 * @property {"compact" | "full"} [mode="compact"] - 显示模式
 *   - compact: 仅显示核心信息（默认）
 *   - full: 显示完整信息（包括关系图谱）
 * @property {"default" | "tight"} [density="default"] - 布局密度
 *   - default: 默认间距
 *   - tight: 紧凑间距
 */
interface CaseBriefCardProps {
  caseFile: CaseMeta;
  mode?: "compact" | "full";
  density?: "default" | "tight";
}

/**
 * 构建简短的案件摘要文本
 *
 * 生成规则：
 * 1. 优先提取玩家角色的第一句话（以中文逗号或句号分隔）
 * 2. 格式化为"角色，调查受害者姓名死亡事件"
 * 3. 若无法提取角色信息，则使用原始 briefing
 *
 * @param {CaseMeta} caseFile - 案件元数据
 * @returns {string} 格式化的简报摘要
 *
 * @example
 * // 返回: "检察官，调查张三分死亡事件。"
 * buildBriefSummary({ brief: { playerRole: "检察官，调查张三分死亡事件。", ... }, ... })
 */
function buildBriefSummary(caseFile: CaseMeta) {
  // 按中文逗号和句号分割，取第一段作为角色描述
  const roleLead = caseFile.brief.playerRole.split(/[，。]/)[0]?.trim();

  if (roleLead) {
    // 拼接格式：角色 + 调查 + 受害者姓名 + 死亡事件
    return `${roleLead}，调查${caseFile.brief.victim.name}死亡事件。`;
  }

  // 回退：使用原始 briefing 文本
  return caseFile.briefing;
}

/**
 * 案件简报卡片组件
 *
 * 组件结构：
 * ┌─────────────────────────────────────────┐
 * │ [Case Brief 标题]           [标签] [按钮]│
 * │  摘要文本...                          │
 * ├─────────────────────────────────────────┤
 * │ [受害者] [身份] [阶段]                  │  ← 标签区域
 * ├─────────────────────────────────────────┤
 * │ 展开内容区域...                        │  ← 可折叠区域
 * │ ┌────────┐ ┌────────┐                  │
 * │ │案件背景│ │玩家目标│                  │
 * │ └────────┘ └────────┘                  │
 * │ ┌────────┐ ┌────────┐                  │
 * │ │NPC说明│ │调查方向│                  │
 * │ └────────┘ └────────┘                  │
 * │ ┌────────┐ ┌────────┐                  │
 * │ │世界观  │ │受害者  │                  │
 * │ └────────┘ └────────┘                  │
 * │ ┌────────┐                             │
 * │ │关系图谱│  ← 仅 full 模式显示         │
 * │ └────────┘                             │
 * └─────────────────────────────────────────┘
 *
 * 无障碍性（Accessibility）：
 * - 使用 aria-expanded 指示展开状态
 * - 使用 aria-controls 关联控制按钮与内容区
 * - 使用 aria-hidden 隐藏展开区域（收起时）
 *
 * @param {CaseBriefCardProps} props - 组件属性
 * @returns {JSX.Element} 案件简报卡片
 *
 * @performance 注意
 * - caseFile 作为 useEffect 依赖项，如果父组件未做 memo 化，每次 props 变化都会重新创建 ResizeObserver
 * - 建议父组件使用 React.memo 包裹此组件
 */
export function CaseBriefCard ({
  caseFile,
  mode = "compact",
  density = "default",
}: CaseBriefCardProps) {
  // ========== 状态定义 ==========

  // 展开/收起状态，控制详细信息区域的显示
  const [isExpanded, setIsExpanded] = useState(false);

  // 详细信息区域的实际高度，用于 CSS max-height 动画
  // 初始化为 0，在 ResizeObserver 中更新
  const [detailsHeight, setDetailsHeight] = useState(0);

  // ========== Ref 定义 ==========

  // 引用详细信息内容的内层容器，用于测量实际高度
  const detailsInnerRef = useRef<HTMLDivElement | null>(null);

  // 使用 useId 生成唯一的 ARIA ID，避免手动管理 ID 导致的冲突
  // ID 格式：React 自动生成的唯一前缀 + ":RID" 形式
  const detailsId = useId();

  // ========== 派生状态 ==========

  // 根据 mode 参数判断是否为完整模式
  const isFull = mode === "full";
  // 根据 density 参数判断是否为紧凑布局
  const isTight = density === "tight";
  // 构建案件摘要文本
  const summary = buildBriefSummary(caseFile);

  // ========== 副作用：监听内容高度变化 ==========

  /**
   * 使用 ResizeObserver 监听 detailsInnerRef 容器的高度变化
   *
   * 工作原理：
   * 1. 首次挂载时获取内容的 scrollHeight（实际内容高度）
   * 2. 后续当内容高度变化（如内容加载、数据更新）时自动更新
   * 3. 将高度值存入 detailsHeight state，用于 CSS max-height 动画
   *
   * 为什么需要手动测量高度？
   * - CSS transition 无法从 auto 过渡到具体值
   * - 通过固定 max-height 值 + 动态更新实现平滑动画
   *
   * 依赖项说明：
   * - caseFile: 当案件数据变化时，需要重新测量高度
   * - isFull: 当切换到 full 模式时（显示关系图谱），高度会显著增加
   *
   * @performance 潜在问题
   * - caseFile 是对象引用，父组件未 memo 时会导致频繁重建
   * - 建议在父组件使用 useMemo 确保 caseFile 稳定
   */
  useEffect(() => {
    const element = detailsInnerRef.current;

    // 防御性检查：确保 ref 已正确绑定到 DOM 元素
    if (!element) {
      return;
    }

    // 高度更新回调：获取当前内容的滚动高度并更新 state
    const updateHeight = () => setDetailsHeight(element.scrollHeight);

    // 首次挂载时立即获取高度（此时内容可能已渲染）
    updateHeight();

    // 兼容性检查：ResizeObserver 在旧版浏览器可能不存在
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    // 创建 ResizeObserver 实例，监听元素尺寸变化
    // 注意：一个 observer 实例只观察一个元素，组件会正常销毁重建
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    // 清理函数：组件卸载或依赖变化时断开观察
    return () => observer.disconnect();
  }, [caseFile, isFull]);

  // ========== 渲染 ==========

  return (
    <section
      className={`rounded-[24px] border border-white/8 bg-white/[0.04] ${
        isTight ? "p-3.5" : "p-4"
      }`}
    >
      {/* ---------- 顶部区域：标题、摘要、状态标签 ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* 左侧：标题和摘要文本 */}
        <div className="max-w-3xl">
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#AEB8C5]">
            Case Brief
          </p>
          <p className="mt-1 text-[0.92rem] leading-6 text-[#E2E8F0]">
            {summary}
          </p>
        </div>

        {/* 右侧：状态标签和展开/收起按钮 */}
        <div className="flex items-center gap-2">
          {/* 任务激活状态标签 */}
          <span className="rounded-full border border-white/8 bg-white/[0.05] px-3 py-1 text-[0.64rem] uppercase tracking-[0.14em] text-[#D7DEE7]">
            调查进行中
          </span>

          {/* 展开/收起控制按钮 */}
          <button
            type="button"
            // ARIA 属性：向屏幕阅读器指示展开状态
            aria-expanded={isExpanded}
            // ARIA 属性：关联控制按钮与被控制的内容区域
            aria-controls={detailsId}
            // 点击事件：切换展开状态
            onClick={() => setIsExpanded((current) => !current)}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.68rem] font-medium text-[#E2E8F0] transition-colors duration-200 hover:bg-white/[0.08]"
          >
            {isExpanded ? "收起" : "展开"}
          </button>
        </div>
      </div>

      {/* ---------- 标签区域：关键信息快速浏览 ---------- */}
      <div className="mt-3 flex flex-wrap gap-2">
        {/* 受害者姓名 */}
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-[#D7DEE7]">
          {caseFile.brief.victim.name}
        </span>

        {/* 受害者身份 */}
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-[#D7DEE7]">
          {caseFile.brief.victim.identity}
        </span>

        {/* 当前案件阶段 */}
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-[#D7DEE7]">
          {caseFile.phase}
        </span>
      </div>

      {/* ---------- 可折叠详情区域 ---------- */}
      {/*
        动画原理：
        1. 外层容器通过 max-height: 0/具体值 控制内容是否可见
        2. opacity: 0/1 提供淡入淡出效果
        3. pointerEvents 防止收起时仍可点击（无障碍考虑）

        @performance 优化点
        - 使用 transform/opacity 而非 height 可获得更好的滚动性能
        - 当前方案使用 max-height + opacity，适合不需要 GPU 加速的场景
      */}
      <div
        id={detailsId}
        aria-hidden={!isExpanded} // 无障碍：屏幕阅读器忽略收起的内容
        className="overflow-hidden"
        style={{
          // 核心动画属性：通过 max-height 过渡实现展开效果
          maxHeight: isExpanded ? detailsHeight : 0,
          // 透明度过渡：提供更平滑的视觉体验
          opacity: isExpanded ? 1 : 0,
          // 禁用指针事件：防止收起时仍可交互
          pointerEvents: isExpanded ? "auto" : "none",
          // CSS 过渡配置
          transition: "max-height 220ms ease, opacity 180ms ease",
        }}
      >
        {/* 内层容器：用于测量实际内容高度 */}
        <div ref={detailsInnerRef} className={isTight ? "pt-3" : "pt-4"}>
          {/* 信息卡片网格布局 */}
          <div className={`grid gap-3 ${isTight ? "" : "sm:grid-cols-2"}`}>
            {/* ---------- 案件背景卡片 ---------- */}
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                案件背景
              </p>
              <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">
                {caseFile.brief.background}
              </p>
            </div>

            {/* ---------- 玩家目标卡片 ---------- */}
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                玩家目标
              </p>
              <p className="mt-2 text-sm leading-6 text-[#E2E8F0]">
                {caseFile.objective}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">
                {caseFile.brief.playerRole}
              </p>
            </div>

            {/* ---------- NPC 说明卡片 ---------- */}
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                NPC 说明
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {/* 嫌疑人列表 */}
                {caseFile.brief.currentSuspects.map((suspect) => (
                  <span
                    key={suspect}
                    className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] leading-5 text-[#E2E8F0]"
                  >
                    {suspect}
                  </span>
                ))}
              </div>
            </div>

            {/* ---------- 调查方向卡片 ---------- */}
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                调查方向
              </p>
              <div className="mt-2 space-y-2">
                {caseFile.brief.investigationDirections.map((direction, index) => (
                  <div
                    key={direction}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm leading-6 text-[#D6DEEA]"
                  >
                    <span className="mr-2 text-[#E2E8F0]">{index + 1}.</span>
                    {direction}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---------- 世界观信息（独立卡片） ---------- */}
          <div className="mt-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
              世界观
            </p>
            <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">
              {caseFile.worldBackground}
            </p>
          </div>

          {/* ---------- 受害者详细信息（独立卡片） ---------- */}
          <div className="mt-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
              受害者信息
            </p>
            {/* 姓名和身份 */}
            <p className="mt-2 text-sm font-medium leading-6 text-[#E2E8F0]">
              {caseFile.brief.victim.name} / {caseFile.brief.victim.identity}
            </p>
            {/* 详细描述 */}
            <p className="mt-2 text-sm leading-6 text-[#D6DEEA]">
              {caseFile.brief.victim.summary}
            </p>
          </div>

          {/* ---------- 关系图谱（仅 full 模式显示） ---------- */}
          {isFull ? (
            <div className="mt-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                关系图谱
              </p>
              <div className="mt-2 space-y-2">
                {caseFile.relationshipMap.map((relationship, index) => (
                  <div
                    key={relationship}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm leading-6 text-[#D6DEEA]"
                  >
                    <span className="mr-2 text-[#E2E8F0]">{index + 1}.</span>
                    {relationship}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
