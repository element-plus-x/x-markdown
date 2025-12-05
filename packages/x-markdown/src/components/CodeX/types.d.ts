import type { BuiltinTheme } from 'shiki'

// 从各组件导入类型
import type { CodeBlockSlots, CodeBlockAction } from '../CodeBlock/types'
import type { MermaidSlots, MermaidAction } from '../Mermaid/types'

export interface CodeXProps {
  showCodeBlockHeader?: boolean
  codeMaxHeight?: string
  enableAnimate?: boolean
  codeBlockActions?: CodeBlockAction[]
  mermaidActions?: MermaidAction[]
  mermaidConfig?: Record<string, any>
}

export interface CodeXSlots extends CodeBlockSlots, MermaidSlots {}

export type { CodeBlockSlots, CodeBlockSlotProps, CodeBlockAction } from '../CodeBlock/types'
export type { MermaidSlots, MermaidSlotProps, MermaidAction } from '../Mermaid/types'
