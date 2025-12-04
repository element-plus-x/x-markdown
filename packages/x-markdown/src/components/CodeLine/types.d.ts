import type { BuiltinTheme } from 'shiki';

/**
 * CodeLine 组件的 Props 类型定义
 */
export interface CodeLineProps {
  /**
   * 原始数据对象，包含行内代码的完整信息
   */
  raw?: CodeLineRaw;
  /**
   * 是否为暗色模式
   * @default false
   */
  isDark?: boolean;
  /**
   * Shiki 主题配置，数组形式 [lightTheme, darkTheme]
   * @default ['vitesse-light', 'vitesse-dark']
   */
  shikiTheme?: [BuiltinTheme, BuiltinTheme];
  /**
   * 是否启用动画效果
   * 启用后会给行内代码添加 x-md-animated-word class
   * @default false
   */
  enableAnimate?: boolean;
}

/**
 * 行内代码原始数据类型
 * 从 Markdown 解析后传入的原始信息
 */
export interface CodeLineRaw {
  /**
   * 唯一标识符
   * @example 'code-0'
   */
  key?: string;

  /**
   * 原始语言标识（行内代码通常为空）
   */
  languageOriginal?: string;

  /**
   * 代码语言（行内代码通常为空）
   */
  language?: string;

  /**
   * 是否是行内代码
   * @default true
   */
  inline?: boolean;

  /**
   * 代码内容
   */
  content?: string;
}
