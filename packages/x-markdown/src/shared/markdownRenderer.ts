import type { PropType } from 'vue';
import type { PluggableList } from 'unified';
import type { MermaidToolbarConfig } from '../types';
import type { CustomAttrs, SanitizeOptions } from '../types';

const MarkdownProps = {
  markdown: {
    type: String,
    default: ''
  },
  allowHtml: {
    type: Boolean,
    default: false
  },
  enableCodeLineNumber: {
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
  }
};
export { MarkdownProps };
