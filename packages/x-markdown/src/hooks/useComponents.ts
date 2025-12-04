import { h } from 'vue'
import type { BuiltinTheme } from 'shiki'
import type { CodeXProps } from '../components/CodeX/types'
import CodeX from '../components/CodeX/index.vue'

// useComponents 的配置选项
interface UseComponentsOptions {
  // 自定义代码块渲染函数
  codeXRender?: Record<string, any>
  // 自定义代码块插槽
  codeXSlots?: Record<string, any>
  // 是否为深色模式
  isDark?: boolean
  // Shiki 主题配置
  shikiTheme?: [BuiltinTheme, BuiltinTheme]
  // 代码块配置
  codeXProps?: CodeXProps
  // 是否启用动画效果
  enableAnimate?: boolean
}

/**
 * 创建自定义组件映射
 * @param props 配置选项
 * @returns 组件映射对象
 */
function useComponents(props?: UseComponentsOptions) {
  const components = {
    // code 元素使用 CodeX 组件渲染
    code: (raw: any) =>
      h(CodeX, {
        raw,
        codeXRender: props?.codeXRender,
        codeXSlots: props?.codeXSlots,
        isDark: props?.isDark,
        // 主题配置
        shikiTheme: props?.shikiTheme,
        // 功能配置
        showCodeBlockHeader: props?.codeXProps?.showCodeBlockHeader,
        codeMaxHeight: props?.codeXProps?.codeMaxHeight,
        // 动画配置 - 传递 enableAnimate 参数
        enableAnimate: props?.enableAnimate,
      }),
  }
  return components
}

export { useComponents }
