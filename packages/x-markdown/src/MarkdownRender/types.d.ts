import type { PluggableList } from 'unified';
import type { CustomAttrs, SanitizeOptions } from '../core/types';
import type { CodeXProps } from '../components/CodeX/types';

/**
 * MarkdownRenderer 上下文类型
 * 用于在组件树中传递 Markdown 相关配置
 */
export interface MarkdownContext {
  // markdown 字符串内容
  markdown?: string;
  // 是否允许 HTML
  allowHtml?: boolean;
  // 是否启用 LaTeX 支持
  enableLatex?: boolean;
  // 是否开启动画
  enableAnimate?: boolean;
  // 是否启用换行符转 <br>
  enableBreaks?: boolean;
  // 自定义代码块渲染函数
  codeXRender?: Record<string, any>;
  // 自定义代码块插槽（用于 CodeBlock 组件的 header、header-left、header-right 插槽）
  codeXSlots?: Record<string, any>;
  // 自定义代码块属性
  codeXProps?: CodeXProps;
  // 自定义属性对象
  customAttrs?: CustomAttrs;
  // remark 插件列表
  remarkPlugins?: PluggableList;
  remarkPluginsAhead?: PluggableList;
  // rehype 插件列表
  rehypePlugins?: PluggableList;
  rehypePluginsAhead?: PluggableList;
  // rehype 配置项
  rehypeOptions?: Record<string, any>;
  // 是否启用内容清洗
  sanitize?: boolean;
  // 清洗选项
  sanitizeOptions?: SanitizeOptions;
}
