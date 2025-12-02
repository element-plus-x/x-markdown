import type { PropType } from 'vue';
import type { PluggableList } from 'unified';
import type { CodeXProps } from '../components/CodeX/types';
import type { CustomAttrs, SanitizeOptions } from '../core/types';
import { computed, defineComponent, h, toValue } from 'vue';
import { VueMarkdown, VueMarkdownAsync } from '../core';
import { useComponents, usePlugins, useProcessMarkdown } from '../hooks';
import './index.css';
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
      codeDarkTheme: 'vitesse-dark'
    })
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
  sanitizeOptions: { type: Object as PropType<SanitizeOptions>, default: () => ({}) }
};

/**
 * Markdown 渲染器组件 - 同步版本
 * 直接渲染 Markdown 内容
 */
const MarkdownRenderer = defineComponent({
  name: 'MarkdownRenderer',
  props: markdownRendererProps,
  setup(props, { slots, attrs }) {
    // 获取 remark/rehype 插件列表
    const { rehypePlugins, remarkPlugins } = usePlugins(props);
    // 获取自定义组件映射
    const components = useComponents(props);

    // 处理 markdown 内容（LaTeX 预处理）
    const markdown = computed(() => {
      if (props.enableLatex) {
        return useProcessMarkdown(props.markdown);
      } else {
        return props.markdown;
      }
    });

    // 合并后的 codeXProps（带默认值）
    const mergedCodeXProps = computed(() => ({
      ...markdownRendererProps.codeXProps.default(),
      ...props.codeXProps
    }));

    // 最终渲染 props，只提取需要的属性避免循环引用
    const renderProps = computed(() => ({
      markdown: markdown.value,
      allowHtml: props.allowHtml,
      enableLatex: props.enableLatex,
      enableAnimate: props.enableAnimate,
      enableBreaks: props.enableBreaks,
      codeXProps: mergedCodeXProps.value,
      codeXRender: props.codeXRender,
      codeXSlots: props.codeXSlots,
      customAttrs: props.customAttrs,
      rehypePlugins: toValue(rehypePlugins),
      remarkPlugins: toValue(remarkPlugins),
      rehypeOptions: props.rehypeOptions,
      sanitize: props.sanitize,
      sanitizeOptions: props.sanitizeOptions
    }));

    return () =>
      h(
        'div',
        {
          class: ['x-md-renderer', { 'is-dark': props.isDark }],
          style: {
            backgroundColor: props.isDark ? '#1e1e1e' : '#ffffff',
            color: props.isDark ? '#e5e5e5' : '#333333',
            padding: '16px'
          },
          ...attrs
        },
        h(VueMarkdown, renderProps.value as any, {
          ...components,
          ...slots
        })
      );
  }
});

/**
 * Markdown 渲染器组件 - 异步版本
 * 异步渲染 Markdown 内容
 */
const MarkdownRendererAsync = defineComponent({
  name: 'MarkdownRendererAsync',
  props: markdownRendererProps,
  setup(props, { slots, attrs }) {
    // 获取 remark/rehype 插件列表
    const { rehypePlugins, remarkPlugins } = usePlugins(props);
    // 获取自定义组件映射
    const components = useComponents(props);

    // 处理 markdown 内容（LaTeX 预处理）
    const markdown = computed(() => {
      if (props.enableLatex) {
        return useProcessMarkdown(props.markdown);
      } else {
        return props.markdown;
      }
    });

    // 合并后的 codeXProps（带默认值）
    const mergedCodeXProps = computed(() => ({
      ...markdownRendererProps.codeXProps.default(),
      ...props.codeXProps
    }));

    // 最终渲染 props，只提取需要的属性避免循环引用
    const renderProps = computed(() => ({
      markdown: markdown.value,
      allowHtml: props.allowHtml,
      enableLatex: props.enableLatex,
      enableAnimate: props.enableAnimate,
      enableBreaks: props.enableBreaks,
      codeXProps: mergedCodeXProps.value,
      codeXRender: props.codeXRender,
      codeXSlots: props.codeXSlots,
      customAttrs: props.customAttrs,
      rehypePlugins: toValue(rehypePlugins),
      remarkPlugins: toValue(remarkPlugins),
      rehypeOptions: props.rehypeOptions,
      sanitize: props.sanitize,
      sanitizeOptions: props.sanitizeOptions
    }));

    return () =>
      h(
        'div',
        {
          class: ['x-md-renderer', { 'is-dark': props.isDark }],
          style: {
            backgroundColor: props.isDark ? '#1e1e1e' : '#ffffff',
            color: props.isDark ? '#e5e5e5' : '#333333',
            padding: '16px'
          },
          ...attrs
        },
        h(VueMarkdownAsync, renderProps.value as any, {
          ...components,
          ...slots
        })
      );
  }
});

export {
  MarkdownRenderer,
  MarkdownRendererAsync,
  markdownRendererProps
};
