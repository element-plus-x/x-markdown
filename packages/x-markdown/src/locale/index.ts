import zhCN from './zh-CN'
import type { MarkdownLocale, MarkdownLocalePartial } from './types'

export type { MarkdownLocale, MarkdownLocalePartial } from './types'
export { default as zhCN } from './zh-CN'
export { default as enUS } from './en-US'

export const defaultLocale = zhCN

export function mergeLocale(override?: MarkdownLocalePartial | null): MarkdownLocale {
  if (!override) return defaultLocale

  return {
    codeBlock: { ...defaultLocale.codeBlock, ...override.codeBlock },
    mermaid: { ...defaultLocale.mermaid, ...override.mermaid },
  }
}
