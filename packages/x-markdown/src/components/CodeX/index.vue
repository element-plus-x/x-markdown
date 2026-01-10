<script lang="ts">
import { defineComponent, h, type PropType, defineAsyncComponent } from 'vue'
import type { CodeBlockAction } from '../CodeBlock/types'
import type { MermaidAction } from '../Mermaid/types'
import CodeBlock from '../CodeBlock/index.vue'
import CodeLine from '../CodeLine/index.vue'
// Mermaid 组件改为动态导入，实现按需加载
const Mermaid = defineAsyncComponent(() => import('../Mermaid/index.vue'))

export default defineComponent({
  props: {
    raw: { type: Object, default: () => ({}) },
    codeXRender: { type: Object, default: () => ({}) },
    isDark: { type: Boolean, default: false },
    shikiTheme: {
      type: Array as PropType<[string, string]>,
      default: () => ['vitesse-light', 'vitesse-dark'],
    },
    showCodeBlockHeader: { type: Boolean, default: true },
    stickyCodeBlockHeader: { type: Boolean, default: true },
    codeMaxHeight: { type: String, default: undefined },
    enableAnimate: { type: Boolean, default: false },
    codeBlockActions: { type: Array as PropType<CodeBlockAction[]>, default: undefined },
    mermaidActions: { type: Array as PropType<MermaidAction[]>, default: undefined },
    mermaidConfig: { type: Object as PropType<Record<string, any>>, default: undefined },
  },
  setup(props, { slots }) {
    const { codeXRender } = props

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

      // 处理 Mermaid 图表
      if (language === 'mermaid') {
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
      return h(
        CodeBlock,
        {
          code: props.raw.content || '',
          language: props.raw.language || 'text',
          isDark: props.isDark,
          lightTheme: props.shikiTheme[0],
          darkTheme: props.shikiTheme[1],
          showCodeBlockHeader: props.showCodeBlockHeader,
          stickyCodeBlockHeader: props.stickyCodeBlockHeader,
          codeMaxHeight: props.codeMaxHeight,
          enableAnimate: props.enableAnimate,
          codeBlockActions: props.codeBlockActions,
        },
        slots,
      )
    }
  },
})
</script>
