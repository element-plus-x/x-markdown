import { h } from 'vue'
import type { BuiltinTheme } from 'shiki'
import type { CodeBlockAction } from '../components/CodeBlock/types'
import type { MermaidAction } from '../components/Mermaid/types'
import CodeX from '../components/CodeX/index.vue'

interface UseComponentsOptions {
  codeXRender?: Record<string, any>
  isDark?: boolean
  shikiTheme?: [BuiltinTheme, BuiltinTheme]
  enableAnimate?: boolean
  enableShiki?: boolean
  enableMermaid?: boolean
  showCodeBlockHeader?: boolean
  stickyCodeBlockHeader?: boolean
  codeMaxHeight?: string
  enableCodeLineNumber?: boolean
  codeLineNumberStart?: number
  codeBlockActions?: CodeBlockAction[]
  mermaidActions?: MermaidAction[]
  mermaidConfig?: Record<string, any>
}

function useComponents(props?: UseComponentsOptions) {
  const components = {
    code: (raw: any) =>
      h(CodeX, {
        raw,
        codeXRender: props?.codeXRender,
        isDark: props?.isDark,
        shikiTheme: props?.shikiTheme,
        enableAnimate: props?.enableAnimate,
        enableShiki: props?.enableShiki,
        enableMermaid: props?.enableMermaid,
        showCodeBlockHeader: props?.showCodeBlockHeader,
        stickyCodeBlockHeader: props?.stickyCodeBlockHeader,
        codeMaxHeight: props?.codeMaxHeight,
        enableCodeLineNumber: props?.enableCodeLineNumber,
        codeLineNumberStart: props?.codeLineNumberStart,
        codeBlockActions: props?.codeBlockActions,
        mermaidActions: props?.mermaidActions,
        mermaidConfig: props?.mermaidConfig,
      }),
  }
  return components
}

export { useComponents }
