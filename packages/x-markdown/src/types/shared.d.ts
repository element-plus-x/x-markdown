import type { PluggableList } from 'unified';
import type { Component, VNodeChild, Ref, ComputedRef } from 'vue';
import type { CodeBlockHeaderExpose } from '../components/CodeBlock/code-header';
import type { TVueMarkdownProps, CustomAttrs, SanitizeOptions } from './core';

// ==================== Markdown 相关类型 ====================

export type MarkdownProps = {
  allowHtml?: boolean;
  enableLatex?: boolean;
  enableAnimate?: boolean;
  enableBreaks?: boolean;
  codeXProps?: CodeXProps;
  codeXRender?: Record<string, any>;
  codeXSlot?: CodeBlockHeaderExpose & Record<string, any>;
  codeHighlightTheme?: string | null;
  remarkPluginsAhead?: PluggableList;
  rehypePluginsAhead?: PluggableList;
  defaultThemeMode?: 'light' | 'dark';
  mermaidConfig?: Partial<MermaidToolbarConfig>;
} & Pick<
    TVueMarkdownProps,
    | 'markdown'
    | 'customAttrs'
    | 'remarkPlugins'
    | 'rehypePlugins'
    | 'sanitize'
    | 'sanitizeOptions'
    | 'rehypeOptions'
  >;

export type MarkdownProviderProps = Omit<MarkdownProps, 'markdown'> &
  Partial<Pick<MarkdownProps, 'markdown'>>;

export interface CodeXProps {
  enableCodeCopy?: boolean; // 启动代码复制功能
  enableThemeToggle?: boolean; // 启动主题切换
  enableCodeLineNumber?: boolean; // 开启行号
}

export interface MdComponent {
  raw: any;
}

export type codeXRenderer =
  | ((params: { language?: string; content: string }) => VNodeChild)
  | Component;

export type codeXSlot = ((params: any) => VNodeChild) | Component;

export interface HighlightProps {
  theme?: any | null;
  isDark?: boolean;
  language?: string;
  content?: string;
}

// 定义颜色替换的类型
export interface ColorReplacements {
  [theme: string]: Record<string, string>;
}

export interface MarkdownContext {
  // markdown 字符串内容
  markdown?: string;
  // 是否允许 HTML
  allowHtml?: boolean;
  // 是否启用代码行号
  enableCodeLineNumber?: boolean;
  // 是否启用 LaTeX 支持
  enableLatex?: boolean;
  // 是否开启动画
  enableAnimate?: boolean;
  // 是否启用换行符转 <br>
  enableBreaks?: boolean;
  // 自定义代码块渲染函数
  codeXRender?: Record<string, any>;
  // 自定义代码块插槽
  codeXSlot?: Record<string, any>;
  // 自定义代码块属性
  codeXProps?: Record<string, any>;
  // 自定义代码高亮主题
  codeHighlightTheme?: any;
  // 自定义属性对象
  customAttrs?: CustomAttrs;
  // remark 插件列表
  remarkPlugins?: PluggableList;
  remarkPluginsAhead?: PluggableList;
  // rehype 插件列表
  rehypePlugins?: PluggableList;
  rehypePluginsAhead?: PluggableList;
  // rehype 配置项
  rehypeOptions?: Record<string, any>;
  // 是否启用内容清洗
  sanitize?: boolean;
  // 清洗选项
  sanitizeOptions?: SanitizeOptions;
  // Mermaid 配置对象
  mermaidConfig?: Record<string, any>;
  // 默认主题模式
  defaultThemeMode?: 'light' | 'dark';
  // 是否是暗黑模式(代码高亮块)
  isDarkMode?: boolean;
  // 是否显示查看代码按钮
  needViewCodeBtn?: boolean;
  // 是否是安全模式预览html
  secureViewCode?: boolean;
  // 预览代码弹窗部分配置
  viewCodeModalOptions?: ElxRunCodeOptions;
}

export interface ElxRunCodeOptions {
  [key: string]: any;
}

// ==================== CodeBlock 相关类型 ====================

export interface RawProps {
  language?: string;
  content?: string;
  key?: string | number;
}

// ==================== CodeLine 相关类型 ====================

export interface CodeLineProps {
  raw?: {
    content?: string;
    inline?: boolean;
  };
  content?: string;
}

// ==================== Mermaid 相关类型 ====================

export interface MermaidToolbarConfig {
  showToolbar?: boolean;
  showFullscreen?: boolean;
  showZoomIn?: boolean;
  showZoomOut?: boolean;
  showReset?: boolean;
  showDownload?: boolean;
  toolbarStyle?: Record<string, any>;
  toolbarClass?: string;
  iconColor?: string;
  tabTextColor?: string;
  hoverBackgroundColor?: string;
  tabActiveBackgroundColor?: string;
}

export interface MermaidToolbarProps extends MermaidToolbarConfig {}

export interface MermaidZoomControls {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fullscreen: () => void;
  destroy: () => void;
  initialize: () => void;
}

export interface UseMermaidZoomOptions {
  container: Ref<HTMLElement | null>;
  scaleStep?: number;
  minScale?: number;
  maxScale?: number;
}

export interface MermaidToolbarEmits {
  onZoomIn: [];
  onZoomOut: [];
  onReset: [];
  onFullscreen: [];
  onEdit: [];
  onToggleCode: [];
  onCopyCode: [];
  onDownload: [];
}

// Mermaid 组件暴露给插槽的方法接口
export interface MermaidExposedMethods {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fullscreen: () => void;
  toggleCode: () => void;
  copyCode: () => void;
  download: () => void;
  svg: Ref<string>;
  showSourceCode: Ref<boolean>;
  toolbarConfig: ComputedRef<MermaidToolbarConfig>;
  rawContent: string;
}

export interface MermaidExposeProps {
  showSourceCode: boolean;
  svg: string;
  rawContent: any;
  toolbarConfig: MermaidToolbarConfig;
  isLoading: boolean;

  // 缩放控制方法
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fullscreen: () => void;

  // 其他操作方法
  toggleCode: () => void;
  copyCode: () => Promise<void>;
  download: () => void;

  // 原始 props（除了重复的 toolbarConfig）
  raw: any;
}
