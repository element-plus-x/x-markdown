import type { PropType } from 'vue';
import type { PluggableList } from 'unified';
import type { CodeXProps, MermaidToolbarConfig, CustomAttrs, SanitizeOptions } from '../types';

export const DEFAULT_PROPS = {
  markdown: '',
  allowHtml: false,
  enableLatex: true,
  enableAnimate: false,
  enableBreaks: true,
  codeXProps: () => ({}),
  codeXRender: () => ({}),
  codeXSlot: () => ({}),
  codeHighlightTheme: null,
  customAttrs: () => ({}),
  remarkPlugins: () => [],
  remarkPluginsAhead: () => [],
  rehypePlugins: () => [],
  rehypePluginsAhead: () => [],
  rehypeOptions: () => ({}),
  sanitize: false,
  sanitizeOptions: () => ({}),
  mermaidConfig: () => ({}),
  defaultThemeMode: '' as 'light' | 'dark'
};

export const MARKDOWN_CORE_PROPS = {
  markdown: {
    type: String,
    default: ''
  },
  allowHtml: {
    type: Boolean,
    default: false
  },
  enableLatex: {
    type: Boolean,
    default: true
  },
  enableAnimate: {
    type: Boolean,
    default: false
  },
  enableBreaks: {
    type: Boolean,
    default: true
  },
  codeXProps: {
    type: Object as PropType<CodeXProps>,
    default: () => ({
      enableCodeCopy: true, // 启动代码复制功能
      enableThemeToggle: false, // 启动主题切换
      enableCodeLineNumber: false
    })
  },
  codeXRender: {
    type: Object,
    default: () => ({})
  },
  codeXSlot: {
    type: Object,
    default: () => ({})
  },
  codeHighlightTheme: {
    type: Object as PropType<any | null>,
    default: () => null
  },
  customAttrs: {
    type: Object as PropType<CustomAttrs>,
    default: () => ({})
  },
  remarkPlugins: {
    type: Array as PropType<PluggableList>,
    default: () => []
  },
  remarkPluginsAhead: {
    type: Array as PropType<PluggableList>,
    default: () => []
  },
  rehypePlugins: {
    type: Array as PropType<PluggableList>,
    default: () => []
  },
  rehypePluginsAhead: {
    type: Array as PropType<PluggableList>,
    default: () => []
  },
  rehypeOptions: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  sanitize: {
    type: Boolean,
    default: false
  },
  sanitizeOptions: {
    type: Object as PropType<SanitizeOptions>,
    default: () => ({})
  },
  mermaidConfig: {
    type: Object as PropType<Partial<MermaidToolbarConfig>>,
    default: () => ({})
  },
  defaultThemeMode: {
    type: String as PropType<'light' | 'dark'>,
    default: 'light'
  },
  isDark: {
    type: Boolean,
    default: false
  }
};
