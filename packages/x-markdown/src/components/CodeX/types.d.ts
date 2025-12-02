import type { BuiltinTheme } from 'shiki'
import type { VNode } from 'vue'

type SlotFn = (props: any) => VNode | VNode[]

/**
 * CodeX 组件的 Props 类型定义
 * 用于配置代码块的主题
 */
export interface CodeXProps {
  // 代码块亮色主题
  codeLightTheme?: BuiltinTheme;
  // 代码块暗色主题
  codeDarkTheme?: BuiltinTheme;
}

/**
 * CodeBlock 插槽定义
 */
export interface CodeBlockSlots {
  // 完整头部插槽
  header?: SlotFn;
  // 头部左侧插槽
  'header-left'?: SlotFn;
  // 头部右侧插槽
  'header-right'?: SlotFn;
}
