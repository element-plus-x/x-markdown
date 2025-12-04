import type { BuiltinTheme } from 'shiki'

// 从各组件导入插槽类型
import type { CodeBlockSlots } from '../CodeBlock/types'
import type { MermaidSlots } from '../Mermaid/types'

/**
 * CodeX 组件的 Props 类型定义
 * 用于配置代码块的主题和功能
 */
export interface CodeXProps {
  /**
   * 是否显示代码块头部
   * @default true
   */
  showCodeBlockHeader?: boolean;
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
 * CodeX 组件插槽定义
 * 合并 CodeBlock 和 Mermaid 的插槽
 */
export interface CodeXSlots extends CodeBlockSlots, MermaidSlots {}

// 重新导出子组件的插槽类型，方便外部使用
export type { CodeBlockSlots, CodeBlockSlotProps } from '../CodeBlock/types'
export type { MermaidSlots, MermaidSlotProps } from '../Mermaid/types'
