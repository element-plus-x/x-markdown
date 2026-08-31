export interface MarkdownLocale {
  codeBlock: {
    expand: string
    collapse: string
    copy: string
    copied: string
  }
  mermaid: {
    preview: string
    code: string
    copyCode: string
    copied: string
    zoomOut: string
    zoomIn: string
    reset: string
    download: string
    loading: string
  }
}

export type MarkdownLocalePartial = {
  [K in keyof MarkdownLocale]?: Partial<MarkdownLocale[K]>
}
