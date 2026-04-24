<script lang="ts">
import { defineComponent, h, defineAsyncComponent, type PropType, computed } from 'vue'
import type { BuiltinTheme } from 'shiki'
import type { CodeBlockAction } from '../CodeBlock/types'
import type { MermaidAction } from '../Mermaid/types'
// 纯文本组件 - 静态导入（不依赖 Shiki）
import CodeBlockPlain from '../CodeBlock/CodeBlockPlain.vue'
import CodeLinePlain from '../CodeLine/CodeLinePlain.vue'

// Shiki 相关组件 - 动态导入（按需加载）
const CodeBlock = defineAsyncComponent(() => import('../CodeBlock/index.vue'))
const CodeLine = defineAsyncComponent(() => import('../CodeLine/index.vue'))

// Mermaid 组件 - 动态导入（按需加载）
const Mermaid = defineAsyncComponent(() => import('../Mermaid/index.vue'))

export default defineComponent({
  props: {
    raw: { type: Object, default: () => ({}) },
    codeXRender: { type: Object, default: () => ({}) },
    isDark: { type: Boolean, default: false },
    shikiTheme: {
      type: Array as unknown as PropType<[BuiltinTheme, BuiltinTheme]>,
      default: () => ['vitesse-light', 'vitesse-dark'] as [BuiltinTheme, BuiltinTheme],
    },
    showCodeBlockHeader: { type: Boolean, default: true },
    stickyCodeBlockHeader: { type: Boolean, default: true },
    enableCodeLineNumber: { type: Boolean, default: true },
    codeLineNumberStart: { type: Number, default: 1 },
    codeMaxHeight: { type: String, default: undefined },
    enableAnimate: { type: Boolean, default: false },
    enableShiki: { type: Boolean, default: true },
    enableMermaid: { type: Boolean, default: true },
    codeBlockActions: { type: Array as PropType<CodeBlockAction[]>, default: undefined },
    mermaidActions: { type: Array as PropType<MermaidAction[]>, default: undefined },
    mermaidConfig: { type: Object as PropType<Record<string, any>>, default: undefined },
  },
  setup(props, { slots }) {
    const { codeXRender } = props

    const blockEnableCodeLineNumber = computed(() => {
      if (props.raw?.inline) return false
      return !!props.enableCodeLineNumber
    })

    return (): ReturnType<typeof h> | null => {
      // 处理行内代码
      if (props.raw.inline) {
        if (codeXRender && codeXRender.inline) {
          const renderer = codeXRender.inline
          if (typeof renderer === 'function') {
            return renderer(props)
          }
          return h(renderer, props)
        }
        // 如果禁用 Shiki，使用纯文本行内代码组件
        if (!props.enableShiki) {
          return h(CodeLinePlain, {
            raw: props.raw,
            isDark: props.isDark,
            enableAnimate: props.enableAnimate,
          })
        }
        // 传递完整的配置给 CodeLine，包括主题和动画设置
        return h(CodeLine, {
          raw: props.raw,
          isDark: props.isDark,
          shikiTheme: props.shikiTheme,
          enableAnimate: props.enableAnimate,
        })
      }

      const { language } = props.raw

      // 处理自定义渲染器
      if (codeXRender && codeXRender[language]) {
        const renderer = codeXRender[language]
        if (typeof renderer === 'function') {
          return renderer(props)
        }
        return h(renderer, props)
      }

      // 处理 Mermaid 图表（仅在 enableMermaid 为 true 时）
      if (language === 'mermaid' && props.enableMermaid) {
        const mermaidSlots: Record<string, any> = {}
        Object.keys(slots).forEach((key) => {
          if (key.startsWith('mermaid')) {
            mermaidSlots[key] = slots[key]
          }
        })

        return h(
          Mermaid,
          {
            raw: props.raw,
            isDark: props.isDark,
            shikiTheme: props.shikiTheme,
            mermaidActions: props.mermaidActions,
            config: props.mermaidConfig,
          },
          mermaidSlots,
        )
      }

      // 渲染标准代码块
      // 如果 enableShiki 为 false，使用纯文本代码块
      if (!props.enableShiki) {
        return h(
          CodeBlockPlain,
          {
            code: props.raw.content || '',
            language: props.raw.language || 'text',
            isDark: props.isDark,
            showCodeBlockHeader: props.showCodeBlockHeader,
            stickyCodeBlockHeader: props.stickyCodeBlockHeader,
            codeMaxHeight: props.codeMaxHeight,
            enableCodeLineNumber: blockEnableCodeLineNumber.value,
            codeLineNumberStart: props.codeLineNumberStart,
          },
          slots,
        )
      }

      return h(
        CodeBlock,
        {
          code: props.raw.content || '',
          language: props.raw.language || 'text',
          isDark: props.isDark,
          shikiTheme: props.shikiTheme,
          showCodeBlockHeader: props.showCodeBlockHeader,
          stickyCodeBlockHeader: props.stickyCodeBlockHeader,
          codeMaxHeight: props.codeMaxHeight,
          enableAnimate: props.enableAnimate,
          codeBlockActions: props.codeBlockActions,
          enableCodeLineNumber: blockEnableCodeLineNumber.value,
          codeLineNumberStart: props.codeLineNumberStart,
        },
        slots,
      )
    }
  },
})
</script>
