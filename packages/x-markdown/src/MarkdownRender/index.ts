import type { PropType } from 'vue'
import type { PluggableList } from 'unified'
import type { CodeXProps } from '../components/CodeX/types'
import type { CustomAttrs, SanitizeOptions } from '../core/types'
import { computed, defineComponent, h, toValue } from 'vue'
import { VueMarkdown, VueMarkdownAsync } from '../core'
import { useComponents, usePlugins, useProcessMarkdown } from '../hooks'
import './index.css'

// Markdown 渲染器 Props 定义
const markdownRendererProps = {
  // markdown 字符串内容
  markdown: { type: String, default: '' },
  // 是否允许 HTML
  allowHtml: { type: Boolean, default: false },
  // 是否启用 LaTeX 支持
  enableLatex: { type: Boolean, default: true },
  // 是否开启动画
  enableAnimate: { type: Boolean, default: false },
  // 是否启用换行符转 <br>
  enableBreaks: { type: Boolean, default: true },
  // 是否为深色模式（控制整体 UI 主题）
  isDark: { type: Boolean, default: false },
  // 代码块 CodeX 组件 props（包含 codeLightTheme、codeDarkTheme）
  codeXProps: {
    type: Object as PropType<CodeXProps>,
    default: () => ({
      codeLightTheme: 'vitesse-light',
      codeDarkTheme: 'vitesse-dark',
    }),
  },
  // 自定义代码块渲染函数
  codeXRender: { type: Object, default: () => ({}) },
  // 自定义代码块插槽（用于 CodeBlock 组件的 header、header-left、header-right 插槽）
  codeXSlots: { type: Object, default: () => ({}) },
  // 自定义属性对象
  customAttrs: { type: Object as PropType<CustomAttrs>, default: () => ({}) },
  // remark 插件列表
  remarkPlugins: { type: Array as PropType<PluggableList>, default: () => [] },
  // remark 前置插件列表
  remarkPluginsAhead: { type: Array as PropType<PluggableList>, default: () => [] },
  // rehype 插件列表
  rehypePlugins: { type: Array as PropType<PluggableList>, default: () => [] },
  // rehype 前置插件列表
  rehypePluginsAhead: { type: Array as PropType<PluggableList>, default: () => [] },
  // rehype 配置项
  rehypeOptions: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  // 是否启用内容清洗
  sanitize: { type: Boolean, default: false },
  // 清洗选项
  sanitizeOptions: { type: Object as PropType<SanitizeOptions>, default: () => ({}) },
}

/**
 * 创建 Markdown 渲染器组件的工厂函数
 * @param name - 组件名称
 * @param coreComponent - 核心渲染组件（VueMarkdown 或 VueMarkdownAsync）
 * @returns 定义好的 Vue 组件
 */
function createMarkdownRenderer(name: string, coreComponent: typeof VueMarkdown | typeof VueMarkdownAsync) {
  return defineComponent({
    name,
    props: markdownRendererProps,
    setup(props, { slots, attrs }) {
      // 获取 remark/rehype 插件列表
      const { rehypePlugins, remarkPlugins } = usePlugins(props)
      // 获取自定义组件映射
      const components = useComponents(props)

      // 处理 markdown 内容（LaTeX 预处理）
      const markdown = computed(() => {
        // 如果启用 LaTeX，则进行预处理
        if (props.enableLatex) {
          return useProcessMarkdown(props.markdown)
        } else {
          return props.markdown
        }
      })

      // 核心组件需要的 props（只传递 sharedProps 中定义的属性，避免多余属性渲染到 DOM）
      const renderProps = computed(() => ({
        // markdown 内容
        markdown: markdown.value,
        // 自定义属性对象
        customAttrs: props.customAttrs,
        // remark 插件列表
        remarkPlugins: toValue(remarkPlugins),
        // rehype 插件列表
        rehypePlugins: toValue(rehypePlugins),
        // rehype 配置项
        rehypeOptions: props.rehypeOptions,
        // 是否启用内容清洗
        sanitize: props.sanitize,
        // 清洗选项
        sanitizeOptions: props.sanitizeOptions,
      }))

      return () =>
        h(
          'div',
          {
            // 外层容器 class，支持深色模式
            class: ['x-md-renderer', { 'is-dark': props.isDark }],
            // 外层容器样式，根据深色模式设置背景色和文字颜色
            style: {
              backgroundColor: props.isDark ? '#1e1e1e' : '#ffffff',
              color: props.isDark ? '#e5e5e5' : '#333333',
              padding: '16px',
            },
            // 透传外部传入的 attrs
            ...attrs,
          },
          // 渲染核心组件
          h(coreComponent, { ...renderProps.value as any, class: 'x-md-core' }, {
            // 合并自定义组件和外部插槽
            ...components,
            ...slots,
          }),
        )
    },
  })
}

/**
 * Markdown 渲染器组件 - 同步版本
 * 直接渲染 Markdown 内容
 */
const MarkdownRenderer = createMarkdownRenderer('MarkdownRenderer', VueMarkdown)

/**
 * Markdown 渲染器组件 - 异步版本
 * 异步渲染 Markdown 内容
 */
const MarkdownRendererAsync = createMarkdownRenderer('MarkdownRendererAsync', VueMarkdownAsync)

export { MarkdownRenderer, MarkdownRendererAsync }
