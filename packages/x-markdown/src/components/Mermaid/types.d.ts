import type { Ref, ComputedRef } from 'vue'

// ==================== SyntaxMermaid 组件类型 ====================

/**
 * SyntaxMermaid 组件 Props
 * 纯粹的 Mermaid 图表渲染组件的属性定义
 */
export interface SyntaxMermaidProps {
  /** Mermaid 图表的源代码内容 */
  content: string
  /** 唯一标识符，用于 Mermaid 渲染 */
  id?: string
  /** 是否为暗色模式 */
  isDark?: boolean
  /** Mermaid 配置选项 */
  config?: Record<string, any>
}

/**
 * SyntaxMermaid 组件暴露的方法和属性
 * 通过 defineExpose 暴露给父组件使用
 */
export interface SyntaxMermaidExpose {
  // 状态
  svg: Ref<string>
  isLoading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  containerRef: Ref<HTMLElement | null>

  // 缩放控制方法
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void

  // 其他方法
  download: () => void
  getSvg: () => string
  reinitialize: () => void
}

// ==================== MermaidToolbar 类型 ====================

export interface MermaidToolbarConfig {
  showToolbar?: boolean
  showFullscreen?: boolean
  showZoomIn?: boolean
  showZoomOut?: boolean
  showReset?: boolean
  showDownload?: boolean
  toolbarStyle?: Record<string, any>
  toolbarClass?: string
  iconColor?: string
  tabTextColor?: string
  hoverBackgroundColor?: string
  tabActiveBackgroundColor?: string
}

export interface MermaidToolbarProps extends MermaidToolbarConfig {}

export interface MermaidZoomControls {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void
  destroy: () => void
  initialize: () => void
}

export interface UseMermaidZoomOptions {
  container: Ref<HTMLElement | null>
  scaleStep?: number
  minScale?: number
  maxScale?: number
}

export interface MermaidToolbarEmits {
  onZoomIn: []
  onZoomOut: []
  onReset: []
  onFullscreen: []
  onEdit: []
  onToggleCode: []
  onCopyCode: []
  onDownload: []
}

// Mermaid 组件暴露给插槽的方法接口
export interface MermaidExposedMethods {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void
  toggleCode: () => void
  copyCode: () => void
  download: () => void
  svg: import('vue').Ref<string>
  showSourceCode: import('vue').Ref<boolean>
  toolbarConfig: import('vue').ComputedRef<MermaidToolbarConfig>
  rawContent: string
}

export interface MermaidExposeProps {
  showSourceCode: boolean
  svg: string
  rawContent: any
  toolbarConfig: MermaidToolbarConfig
  isLoading: boolean

  // 缩放控制方法
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void

  // 其他操作方法
  toggleCode: () => void
  copyCode: () => Promise<void>
  download: () => void

  // 原始 props（除了重复的 toolbarConfig）
  raw: any
}

export interface MdComponent {
  raw: any
}

export interface MermaidProps extends MdComponent {
  raw: {
    content?: string;
    key?: string;
    [key: string]: any;
  };
  toolbarConfig?: MermaidToolbarConfig;
  isDark?: boolean;
  lightTheme?: string;
  darkTheme?: string;
  config?: {
    theme?: string;
    securityLevel?: string;
    startOnLoad?: boolean;
    flowchart?: {
      curve?: string;
      useMaxWidth?: boolean;
      htmlLabels?: boolean;
      nodeSpacing?: number;
      rankSpacing?: number;
      padding?: number;
      diagramPadding?: number;
      defaultRenderer?: string;
      [key: string]: any;
    };
    sequence?: {
      diagramMarginX?: number;
      diagramMarginY?: number;
      actorMargin?: number;
      width?: number;
      height?: number;
      boxMargin?: number;
      boxTextMargin?: number;
      noteMargin?: number;
      messageMargin?: number;
      mirrorActors?: boolean;
      bottomMarginAdj?: number;
      useMaxWidth?: boolean;
      showSequenceNumbers?: boolean;
      [key: string]: any;
    };
    gantt?: {
      titleTopMargin?: number;
      barHeight?: number;
      barGap?: number;
      topPadding?: number;
      sidePadding?: number;
      gridLineStartPadding?: number;
      fontSize?: number;
      fontFamily?: string;
      numberSectionStyles?: number;
      axisFormat?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

// ==================== 插槽类型定义 ====================

import type { VNode } from 'vue'

// 插槽函数类型
type MermaidSlotFn = (props: MermaidSlotProps) => VNode | VNode[]

/**
 * Mermaid 插槽 props 类型
 * 传递给插槽的上下文数据
 */
export interface MermaidSlotProps {
  /** 是否显示源代码 */
  showSourceCode: boolean;
  /** SVG 内容 */
  svg: string;
  /** 原始代码内容 */
  rawContent: string;
  /** 工具栏配置 */
  toolbarConfig: MermaidToolbarConfig;
  /** 是否加载中 */
  isLoading: boolean;
  /** 放大方法 */
  zoomIn: () => void;
  /** 缩小方法 */
  zoomOut: () => void;
  /** 重置方法 */
  reset: () => void;
  /** 全屏方法 */
  fullscreen: () => void;
  /** 切换代码/图表视图 */
  toggleCode: () => void;
  /** 复制代码 */
  copyCode: () => Promise<void>;
  /** 下载图片 */
  download: () => void;
  /** 原始数据 */
  raw: any;
}

/**
 * Mermaid 插槽定义
 */
export interface MermaidSlots {
  /**
   * 头部插槽 - 完全替换整个头部区域
   * 插槽名: mermaidHeader
   */
  mermaidHeader?: MermaidSlotFn;
  
  /**
   * 操作按钮插槽 - 自定义右侧操作按钮区域
   * 插槽名: mermaidActions
   */
  mermaidActions?: MermaidSlotFn;
}
