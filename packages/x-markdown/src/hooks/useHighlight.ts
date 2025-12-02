// ============================================================
// Vue 3 流式代码高亮 Composable
// 使用 shiki 和 shiki-stream 实现代码语法高亮
// 支持增量更新，适合流式输入（如打字机效果）场景
// ============================================================

// ============================================================
// 导入依赖
// ============================================================

// Vue 3 响应式 API
// ref: 创建响应式引用
// watch: 监听响应式数据变化
// onUnmounted: 组件卸载时的生命周期钩子
// computed: 计算属性
// Ref: 响应式引用类型
// CSSProperties: CSS 样式对象类型
import { ref, watch, onUnmounted, computed, type Ref, type CSSProperties } from 'vue'

// shiki 类型定义
// BuiltinTheme: shiki 内置主题类型，如 'slack-dark', 'github-light' 等
// ThemedToken: 带有颜色信息的代码片段，包含 content(内容) 和 color(颜色) 等属性
import type { BuiltinTheme, ThemedToken } from 'shiki'

// shiki-stream 提供的流式 tokenizer
// 支持增量处理代码，不需要每次都重新解析整个代码
// 非常适合流式输入场景（如 AI 对话中逐字输出代码）
import { ShikiStreamTokenizer } from 'shiki-stream'

// shiki 的 getSingletonHighlighter 函数类型（仅用于类型推断）
import type { getSingletonHighlighter } from 'shiki'

// ============================================================
// 类型定义
// ============================================================

/**
 * 流式高亮结果的数据结构
 */
interface StreamingHighlightResult {
  colorReplacements?: Record<string, string>  // 颜色替换映射表（可选）
  lines: ThemedToken[][]                       // 二维数组：每行包含多个 token
  preStyle?: CSSProperties                     // <pre> 元素的样式（背景色、前景色）
}

/**
 * useHighlight 函数的配置选项
 */
interface UseHighlightOptions {
  language: string                             // 代码语言，如 'javascript', 'python', 'typescript'
  theme?: BuiltinTheme                         // 主题名称，如 'slack-dark', 'github-light'
  streaming?: boolean                          // 是否启用流式模式（增量更新）
  colorReplacements?: Record<string, string>   // 自定义颜色替换映射
}

// ============================================================
// 模块级变量：懒加载 shiki
// ============================================================

// 缓存 shiki 模块的 Promise，避免重复加载
// 使用模块级变量实现单例模式
let shikiModulePromise: Promise<typeof import('shiki') | null> | null = null

/**
 * 懒加载 shiki 模块
 * 使用单例模式，确保 shiki 只被加载一次
 * @returns Promise<shiki 模块 | null>
 */
const loadShiki = () => {
  // 如果还没有开始加载，则开始加载
  if (!shikiModulePromise) {
    // 动态 import shiki 模块
    // 使用 catch 捕获加载失败的情况，返回 null
    shikiModulePromise = import('shiki').catch(() => null)
  }
  // 返回缓存的 Promise（无论是正在加载还是已完成）
  return shikiModulePromise
}

// ============================================================
// 工具函数：将扁平的 tokens 数组转换为按行分组的二维数组
// ============================================================

/**
 * 将一维 token 数组转换为按行分组的二维数组
 * 
 * 输入示例: [token1, token2, '\n', token3, ...]
 * 输出示例: [[token1, token2], [token3, ...], ...]
 * 
 * @param tokens - 扁平的 token 数组
 * @returns 按行分组的二维 token 数组
 */
const tokensToLineTokens = (tokens: ThemedToken[]): ThemedToken[][] => {
  // 空数组返回包含一个空行的二维数组
  if (!tokens.length) return [[]]

  // 初始化结果数组，第一行为空数组
  const lines: ThemedToken[][] = [[]]
  // 当前正在处理的行（使用引用，方便直接 push）
  let currentLine = lines[0]

  /**
   * 开始新的一行
   * 创建新数组并添加到 lines 中
   */
  const startNewLine = () => {
    currentLine = []           // 创建新的空数组
    lines.push(currentLine)    // 添加到 lines 中
  }

  // 遍历所有 token 进行分行处理
  tokens.forEach((token) => {
    // 获取 token 内容，防止 undefined
    const content = token.content ?? ''

    // 情况1: token 内容就是单独的换行符
    if (content === '\n') {
      startNewLine()           // 开始新行
      return                   // 不需要将换行符 token 添加到行中
    }

    // 情况2: token 内容不包含换行符，直接添加到当前行
    if (!content.includes('\n')) {
      currentLine.push(token)
      return
    }

    // 情况3: token 内容包含换行符，需要拆分成多个 token
    // 例如: "hello\nworld" -> ["hello", "world"]
    const segments = content.split('\n')
    segments.forEach((segment, index) => {
      // 非空片段添加到当前行（保留原 token 的颜色等信息）
      if (segment) {
        currentLine.push({
          ...token,            // 保留原 token 的所有属性（颜色等）
          content: segment,    // 替换内容为当前片段
        })
      }

      // 除了最后一个片段，每个片段后都要换行
      // 例如: "a\nb\nc".split('\n') = ["a", "b", "c"]
      // 处理 "a" 后换行，处理 "b" 后换行，处理 "c" 后不换行
      if (index < segments.length - 1) {
        startNewLine()
      }
    })
  })

  // 确保返回至少一个空行（防御性编程）
  return lines.length === 0 ? [[]] : lines
}

// ============================================================
// 工具函数：创建 <pre> 元素的样式对象
// ============================================================

/**
 * 根据主题的背景色和前景色创建样式对象
 * @param bg - 背景色
 * @param fg - 前景色（文字颜色）
 * @returns CSS 样式对象，如果都没有则返回 undefined
 */
const createPreStyle = (bg?: string, fg?: string): CSSProperties | undefined => {
  // 如果没有背景色和前景色，返回 undefined（不设置样式）
  if (!bg && !fg) return undefined
  // 返回包含背景色和文字颜色的样式对象
  return {
    backgroundColor: bg,      // 代码块背景色
    color: fg,                // 默认文字颜色
  }
}

// ============================================================
// 主函数：Vue 3 流式代码高亮 Composable
// ============================================================

/**
 * Vue 3 流式代码高亮 Composable
 * 
 * 功能特点：
 * 1. 懒加载 shiki 模块，减少初始包体积
 * 2. 使用 shiki-stream 支持增量更新
 * 3. 响应式返回值，自动触发组件更新
 * 4. 自动清理资源，防止内存泄漏
 * 
 * @param text - 响应式的代码文本
 * @param options - 配置选项（语言、主题、是否流式等）
 * @returns 响应式的高亮结果
 */
export function useHighlight(
  text: Ref<string>,           // 响应式的代码文本，变化时自动重新高亮
  options: UseHighlightOptions // 配置选项
) {
  // ============================================================
  // 响应式状态（变化时会触发组件重新渲染）
  // ============================================================
  
  // 流式高亮的结果数据，包含 lines 和 preStyle
  const streaming = ref<StreamingHighlightResult>()
  // 是否正在加载中（可用于显示 loading 状态）
  const isLoading = ref(false)
  // 错误信息（加载或处理失败时设置）
  const error = ref<Error | null>(null)
  
  // ============================================================
  // 内部状态（不需要响应式，不触发组件更新）
  // ============================================================
  
  // shiki-stream 的 tokenizer 实例
  // 用于增量处理代码文本
  let tokenizer: ShikiStreamTokenizer | null = null
  // 上一次处理的文本内容
  // 用于增量更新时比较，只处理新增的部分
  let previousText = ''
  // shiki highlighter 实例
  // 用于获取主题信息等
  let highlighter: Awaited<ReturnType<typeof getSingletonHighlighter>> | null = null

  // ============================================================
  // 计算属性
  // ============================================================
  
  // 有效的主题名称，如果没有指定则使用默认值 'slack-dark'
  const effectiveTheme = computed(() => options.theme || 'slack-dark')
  // 暴露给外部的 lines（按行分组的 tokens 二维数组）
  // 这是渲染组件最常用的数据
  const lines = computed(() => streaming.value?.lines || [[]])
  // 暴露给外部的 preStyle（<pre> 元素的背景色和前景色）
  const preStyle = computed(() => streaming.value?.preStyle)

  // ============================================================
  // 核心方法：更新 tokens（支持增量更新）
  // ============================================================
  
  /**
   * 更新 tokens
   * 
   * 增量更新原理：
   * 1. 比较新旧文本，判断是否可以增量追加
   * 2. 如果新文本以旧文本开头，说明只是追加了内容
   * 3. 只将新增部分送入 tokenizer 处理，避免重复计算
   * 
   * @param nextText - 新的代码文本
   * @param forceReset - 是否强制重置（忽略增量，重新处理全部）
   */
  const updateTokens = async (nextText: string, forceReset = false) => {
    // 如果 tokenizer 不存在，直接返回
    if (!tokenizer) return

    // 强制重置：清空 tokenizer 内部状态和之前的文本记录
    if (forceReset) {
      tokenizer.clear()        // 清空 tokenizer 的 tokens 缓存
      previousText = ''        // 重置文本记录
    }

    // 判断是否可以增量追加
    // 条件：非强制重置 且 新文本以旧文本开头
    // 例如：旧文本 "const" -> 新文本 "const a" -> 可以增量追加 " a"
    const canAppend = !forceReset && nextText.startsWith(previousText)
    let chunk = nextText       // 要处理的文本块

    // 增量更新：只处理新增的部分
    if (canAppend) {
      // 提取新增内容（从旧文本长度位置开始截取）
      chunk = nextText.slice(previousText.length)
    } else if (!forceReset) {
      // 非增量且非强制重置，说明文本发生了替换（如删除、插入）
      // 需要清空重来
      tokenizer.clear()
    }

    // 更新文本记录，供下次比较使用
    previousText = nextText

    // 如果没有新内容需要处理，只需要合并现有 tokens
    if (!chunk) {
      // tokensStable: 已确定不会变化的 tokens（前面的代码）
      // tokensUnstable: 还在处理中的 tokens（最新输入的部分）
      const mergedTokens = [...tokenizer.tokensStable, ...tokenizer.tokensUnstable]
      streaming.value = {
        colorReplacements: options.colorReplacements,
        lines: mergedTokens.length ? tokensToLineTokens(mergedTokens) : [[]],
        preStyle: streaming.value?.preStyle,  // 保留原有的 preStyle
      }
      return
    }

    // 处理新内容
    try {
      // 将新内容送入 tokenizer 进行语法分析和高亮
      // enqueue 是异步的，因为可能需要加载语言语法
      await tokenizer.enqueue(chunk)
      
      // 合并稳定和不稳定的 tokens
      const mergedTokens = [...tokenizer.tokensStable, ...tokenizer.tokensUnstable]
      
      // 更新响应式状态，触发组件重新渲染
      streaming.value = {
        colorReplacements: options.colorReplacements,
        lines: tokensToLineTokens(mergedTokens),  // 转换为按行分组的格式
        preStyle: streaming.value?.preStyle,
      }
    } catch (err) {
      // 处理失败，记录错误
      console.error('Streaming highlighting failed:', err)
      error.value = err as Error
    }
  }

  // ============================================================
  // 核心方法：初始化高亮器
  // ============================================================
  
  /**
   * 初始化高亮器
   * 
   * 初始化流程：
   * 1. 懒加载 shiki 模块
   * 2. 获取单例 highlighter（自动加载语言和主题）
   * 3. 创建流式 tokenizer
   * 4. 处理当前已有的文本
   */
  const initHighlighter = async () => {
    // 如果没有启用流式模式，清理资源并返回
    if (!options.streaming) {
      tokenizer?.clear()         // 清空 tokenizer
      tokenizer = null           // 释放引用
      previousText = ''          // 重置文本记录
      streaming.value = undefined // 清空结果
      return
    }

    // 开始加载，设置 loading 状态
    isLoading.value = true
    error.value = null

    try {
      // 步骤1: 懒加载 shiki 模块
      const mod = await loadShiki()
      if (!mod) {
        throw new Error('Failed to load shiki module')
      }

      // 步骤2: 获取单例 highlighter
      // getSingletonHighlighter 会缓存 highlighter 实例
      // 自动加载所需的语言语法和主题颜色方案
      highlighter = await mod.getSingletonHighlighter({
        langs: [options.language],      // 加载指定语言的语法规则
        themes: [effectiveTheme.value], // 加载指定主题的颜色方案
      })

      // 步骤3: 创建流式 tokenizer
      // tokenizer 负责将代码文本转换为带颜色信息的 tokens
      tokenizer = new ShikiStreamTokenizer({
        highlighter,                    // 传入 highlighter 实例
        lang: options.language,         // 指定语言
        theme: effectiveTheme.value,    // 指定主题
      })

      // 重置之前的文本记录
      previousText = ''

      // 步骤4: 获取主题的背景色和前景色
      const themeInfo = highlighter.getTheme(effectiveTheme.value)
      const preStyleValue = createPreStyle(themeInfo?.bg, themeInfo?.fg)

      // 步骤5: 处理当前已有的文本
      if (text.value) {
        // 有文本内容，进行高亮处理
        await updateTokens(text.value, true)  // 强制重置模式
        // 确保 preStyle 被设置（updateTokens 不会设置 preStyle）
        if (streaming.value) {
          streaming.value.preStyle = preStyleValue
        }
      } else {
        // 没有文本内容，初始化空状态
        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: [[]],                  // 空行
          preStyle: preStyleValue,      // 设置主题样式
        }
      }
    } catch (err) {
      // 初始化失败，记录错误
      console.error('Streaming highlighter initialization failed:', err)
      error.value = err as Error
    } finally {
      // 无论成功失败，都结束 loading 状态
      isLoading.value = false
    }
  }

  // ============================================================
  // Watch: 监听配置变化，重新初始化
  // ============================================================
  
  // 当 streaming、language、theme 任一变化时，重新初始化高亮器
  // 例如：切换语言或主题时，需要重新加载对应的语法和颜色方案
  watch(
    () => [options.streaming, options.language, effectiveTheme.value],
    () => {
      initHighlighter()
    },
    { immediate: true }  // 立即执行一次，完成初始化
  )

  // ============================================================
  // Watch: 监听文本变化，增量更新
  // ============================================================
  
  // 当代码文本变化时，增量更新 tokens
  // 这是流式输入的核心：只处理新增内容，性能更好
  watch(text, (newText) => {
    // 只有启用了流式模式且 tokenizer 已初始化才处理
    if (options.streaming && tokenizer) {
      updateTokens(newText)    // 不强制重置，支持增量
    }
  })

  // ============================================================
  // 生命周期：组件卸载时清理资源
  // ============================================================
  
  // 防止内存泄漏，组件卸载时清理所有资源
  onUnmounted(() => {
    tokenizer?.clear()         // 清空 tokenizer 内部状态
    tokenizer = null           // 释放 tokenizer 引用
    previousText = ''          // 重置文本记录
  })

  // ============================================================
  // 返回值：暴露给组件使用的响应式数据
  // ============================================================
  
  return {
    streaming,   // 原始的流式结果（包含完整信息）
    lines,       // 按行分组的 tokens 二维数组（渲染时最常用）
    preStyle,    // <pre> 元素的背景色和前景色样式
    isLoading,   // 加载状态（可用于显示 loading UI）
    error,       // 错误信息（加载或处理失败时）
  }
}