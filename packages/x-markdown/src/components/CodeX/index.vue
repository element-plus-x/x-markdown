<script lang="ts">
import { defineComponent, h, type PropType, type VNode } from 'vue'
import type { BuiltinTheme } from 'shiki'
// @ts-ignore
import CodeBlock from '../CodeBlock/index.vue'
// @ts-ignore
import CodeLine from '../CodeLine/index.vue'
import Mermaid from '../Mermaid/index.vue'

// 插槽函数类型
type SlotFn = (props: any) => VNode | VNode[]

export default defineComponent({
  props: {
    // ==================== 基础配置 ====================
    /** 原始数据对象 */
    raw: {
      type: Object,
      default: () => ({}),
    },
    /** 自定义渲染器映射 */
    codeXRender: {
      type: Object,
      default: () => ({}),
    },
    /** 自定义插槽映射 */
    codeXSlots: {
      type: Object as PropType<Record<string, SlotFn>>,
      default: () => ({}),
    },
    isDark: {
      type: Boolean,
      default: false,
    },
    /** Shiki 主题配置，数组形式 [lightTheme, darkTheme] */
    shikiTheme: {
      type: Array as unknown as PropType<[BuiltinTheme, BuiltinTheme]>,
      default: () => ['vitesse-light', 'vitesse-dark'] as [BuiltinTheme, BuiltinTheme],
    },
    showCodeBlockHeader: {
      type: Boolean,
      default: true,
    },
    codeMaxHeight: {
      type: String,
      default: undefined,
    },
    enableAnimate: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
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
        return h(Mermaid, {
          raw: props.raw,
          isDark: props.isDark,
          shikiTheme: props.shikiTheme,
          codeXSlots: props.codeXSlots,
        })
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
          codeMaxHeight: props.codeMaxHeight,
          enableAnimate: props.enableAnimate, // 传递动画开关
        },
        props.codeXSlots,
      )
    }
  },
})
</script>
