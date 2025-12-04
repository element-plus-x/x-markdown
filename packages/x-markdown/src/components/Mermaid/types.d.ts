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
  rawContent: string
}

export interface MermaidExposeProps {
  showSourceCode: boolean
  svg: string
  rawContent: any
  isLoading: boolean
  copied: boolean

  // 缩放控制方法
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void

  // 其他操作方法
  toggleCode: () => void
  copyCode: () => Promise<void>
  download: () => void

  // 原始数据
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
  isDark?: boolean;
  lightTheme?: string;
  darkTheme?: string;
  /**
   * Mermaid 操作按钮配置
   * 支持按钮配置数组
   * 通过 props 传入，会渲染在操作按钮区域
   * @example
   * ```ts
  mermaidActions: [
   *   { key: 'edit', title: '编辑', show: (props) => !props.showSourceCode, onClick: () => {} },
   *   { key: 'share', title: '分享', onClick: () => {} }
   * ]
   * ```
   */
  mermaidActions?: MermaidAction[];
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

import type { VNode, Component, FunctionalComponent } from 'vue'

/**
 * 操作按钮图标渲染函数类型
 */
type MermaidIconRenderFn = (props: MermaidSlotProps) => VNode

/**
 * Mermaid 操作按钮配置
 * 用于通过 props 传入自定义操作按钮
 */
export interface MermaidAction {
  /**
   * 按钮唯一标识
   */
  key: string;
  /**
   * 按钮图标组件或渲染函数
   * 可以是 Vue 组件、SVG 字符串或返回 VNode 的函数
   */
  icon?: Component | FunctionalComponent | string | MermaidIconRenderFn;
  /**
   * 按钮提示文字（tooltip）
   */
  title?: string;
  /**
   * 按钮点击事件处理函数
   * @param props - 包含 SVG、复制方法等上下文信息
   */
  onClick?: (props: MermaidSlotProps) => void;
  /**
   * 是否禁用按钮
   * @default false
   */
  disabled?: boolean;
  /**
   * 自定义按钮类名
   */
  class?: string;
  /**
   * 自定义按钮样式
   */
  style?: Record<string, string>;
  /**
   * 显示条件函数
   * 返回 true 显示，返回 false 隐藏
   * 不传则默认显示
   * @param props - 包含当前状态的上下文信息
   * @returns 是否显示该按钮
   * @example
   * ```ts
   * // 仅在图表视图时显示
   * show: (props) => !props.showSourceCode
   * // 仅在代码视图时显示
   * show: (props) => props.showSourceCode
   * ```
   */
  show?: (props: MermaidSlotProps) => boolean;
}

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
  /** 是否加载中 */
  isLoading: boolean;
  /** 是否复制成功 */
  copied: boolean;
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
