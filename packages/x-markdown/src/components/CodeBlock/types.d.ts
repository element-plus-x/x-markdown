import type { BuiltinTheme } from 'shiki'

/**
 * SyntaxCodeBlock 组件的 Props 类型定义
 * 纯渲染层：只负责代码的语法高亮显示
 */
export interface SyntaxCodeBlockProps {
  /**
   * 代码内容
   */
  code: string;
  /**
   * 代码语言
   * @example 'javascript', 'typescript', 'python'
   */
  language: string;
  /**
   * 亮色主题
   * @default 'vitesse-light'
   */
  lightTheme?: BuiltinTheme;
  /**
   * 暗色主题
   * @default 'vitesse-dark'
   */
  darkTheme?: BuiltinTheme;
  /**
   * 是否为深色模式
   * @default false
   */
  isDark?: boolean;
  /**
   * 颜色替换映射表
   * 用于自定义主题颜色
   * @example { '#000000': '#ffffff' }
   */
  colorReplacements?: Record<string, string>;
  /**
   * 代码块最大高度（超出后滚动）
   * @example '300px'
   */
  codeMaxHeight?: string;
  /**
   * 是否启用动画效果
   * 启用后会给每个 token 添加 x-md-animated-word class
   * @default false
   */
  enableAnimate?: boolean;
}

/**
 * CodeBlock 组件的 Props 类型定义
 * 容器层：包含头部工具栏 + 引入 SyntaxCodeBlock 渲染
 */
export interface CodeBlockProps {
  /**
   * 代码内容
   */
  code: string;
  /**
   * 代码语言
   * @example 'javascript', 'typescript', 'python'
   */
  language: string;
  /**
   * 亮色主题
   * @default 'vitesse-light'
   */
  lightTheme?: BuiltinTheme;
  /**
   * 暗色主题
   * @default 'vitesse-dark'
   */
  darkTheme?: BuiltinTheme;
  /**
   * 是否为深色模式
   * @default false
   */
  isDark?: boolean;
  /**
   * 颜色替换映射表
   * 用于自定义主题颜色
   * @example { '#000000': '#ffffff' }
   */
  colorReplacements?: Record<string, string>;
  /**
   * 代码块最大高度（超出后滚动）
   * @example '300px'
   */
  codeMaxHeight?: string;
  /**
   * 是否显示代码块头部
   * @default true
   */
  showCodeBlockHeader?: boolean;
  /**
   * 是否启用动画效果
   * 启用后会给每个 token 添加 x-md-animated-word class
   * @default false
   */
  enableAnimate?: boolean;
}

/**
 * 代码块原始数据类型
 * 从 Markdown 解析后传入的原始信息
 */
export interface CodeBlockRaw {
  /**
   * 唯一标识符
   * @example 'code-0'
   */
  key?: string;

  /**
   * 原始语言标识（带 language- 前缀）
   * @example 'language-javascript'
   */
  languageOriginal?: string;

  /**
   * 代码语言
   * @example 'javascript'
   */
  language?: string;

  /**
   * 是否是行内代码
   * @default false
   */
  inline?: boolean;

  /**
   * 代码内容
   */
  content?: string;

  /**
   * CSS 类名数组
   * @example ['language-javascript']
   */
  class?: string[];
}

// ==================== 插槽类型定义 ====================

import type { VNode } from 'vue'

// 插槽函数类型
type CodeBlockSlotFn = (props: CodeBlockSlotProps) => VNode | VNode[]

/**
 * CodeBlock 插槽 props 类型
 * 传递给插槽的上下文数据
 */
export interface CodeBlockSlotProps {
  /** 代码语言 */
  language: string;
  /** 代码内容 */
  code: string;
  /** 复制方法 */
  copy: (text: string) => void;
  /** 是否复制成功 */
  copied: boolean;
  /** 是否折叠 */
  collapsed: boolean;
  /** 切换折叠状态 */
  toggleCollapse: () => void;
}

/**
 * CodeBlock 插槽定义
 */
export interface CodeBlockSlots {
  /**
   * 头部插槽 - 完全替换整个头部区域
   * 插槽名: codeHeader
   */
  codeHeader?: CodeBlockSlotFn;
  
  /**
   * 操作按钮插槽 - 自定义右侧操作按钮区域
   * 插槽名: codeActions
   */
  codeActions?: CodeBlockSlotFn;
}
