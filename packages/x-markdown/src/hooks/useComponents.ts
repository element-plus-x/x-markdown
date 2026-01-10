import { h } from 'vue'
import type { CodeBlockAction } from '../components/CodeBlock/types'
import type { MermaidAction } from '../components/Mermaid/types'
import CodeX from '../components/CodeX/index.vue'

// Shiki 主题类型（本地定义，避免直接依赖 shiki）
type ShikiThemeName =
  | 'vitesse-light' | 'vitesse-dark'
  | 'github-light' | 'github-dark'
  | 'nord' | 'one-dark-pro'
  | string // 允许其他自定义主题名称

interface UseComponentsOptions {
  codeXRender?: Record<string, any>
  isDark?: boolean
  shikiTheme?: [ShikiThemeName, ShikiThemeName]
  enableAnimate?: boolean
  showCodeBlockHeader?: boolean
  stickyCodeBlockHeader?: boolean
  codeMaxHeight?: string
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
        showCodeBlockHeader: props?.showCodeBlockHeader,
        stickyCodeBlockHeader: props?.stickyCodeBlockHeader,
        codeMaxHeight: props?.codeMaxHeight,
        codeBlockActions: props?.codeBlockActions,
        mermaidActions: props?.mermaidActions,
        mermaidConfig: props?.mermaidConfig,
      }),
  }
  return components
}

export { useComponents }
