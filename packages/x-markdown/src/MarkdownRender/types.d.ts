import type { PluggableList } from 'unified'
import type { CustomAttrs, SanitizeOptions } from '../core/types'
import type { CodeBlockAction } from '../components/CodeBlock/types'
import type { MermaidAction } from '../components/Mermaid/types'

export interface MarkdownContext {
  markdown?: string
  allowHtml?: boolean
  enableLatex?: boolean
  enableAnimate?: boolean
  enableBreaks?: boolean
  codeXRender?: Record<string, any>
  showCodeBlockHeader?: boolean
  stickyCodeBlockHeader?: boolean
  codeMaxHeight?: string
  codeBlockActions?: CodeBlockAction[]
  mermaidActions?: MermaidAction[]
  mermaidConfig?: Record<string, any>
  customAttrs?: CustomAttrs
  remarkPlugins?: PluggableList
  remarkPluginsAhead?: PluggableList
  rehypePlugins?: PluggableList
  rehypePluginsAhead?: PluggableList
  rehypeOptions?: Record<string, any>
  sanitize?: boolean
  sanitizeOptions?: SanitizeOptions
}
