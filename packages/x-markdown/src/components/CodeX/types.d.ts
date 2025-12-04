import type { BuiltinTheme } from 'shiki'
import type { VNode } from 'vue'

// 插槽函数类型
type SlotFn = (props: any) => VNode | VNode[]

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
 * CodeBlock 插槽定义
 */
export interface CodeBlockSlots {
  /** 完整头部插槽 */
  header?: SlotFn;
  /** 头部左侧插槽 */
  'header-left'?: SlotFn;
  /** 头部右侧插槽 */
  'header-right'?: SlotFn;
}
