import type { BuiltinTheme } from 'shiki'

export interface SyntaxCodeBlockProps {
  code: string;
  language: string;
  lightTheme?: BuiltinTheme;
  darkTheme?: BuiltinTheme;
  isDark?: boolean;
  colorReplacements?: Record<string, string>;
  codeMaxHeight?: string;
  enableAnimate?: boolean;
}

export interface CodeBlockProps {
  code: string;
  language: string;
  lightTheme?: BuiltinTheme;
  darkTheme?: BuiltinTheme;
  isDark?: boolean;
  colorReplacements?: Record<string, string>;
  codeMaxHeight?: string;
  showCodeBlockHeader?: boolean;
  enableAnimate?: boolean;
  codeBlockActions?: CodeBlockAction[];
  stickyCodeBlockHeader?: boolean;
}

export interface CodeBlockRaw {
  key?: string;
  languageOriginal?: string;
  language?: string;
  inline?: boolean;
  content?: string;
  class?: string[];
}

import type { VNode, Component, FunctionalComponent } from 'vue'

type IconRenderFn = (props: CodeBlockSlotProps) => VNode

export interface CodeBlockAction {
  key: string;
  icon?: Component | FunctionalComponent | string | IconRenderFn;
  title?: string;
  onClick?: (props: CodeBlockSlotProps) => void;
  disabled?: boolean;
  class?: string;
  style?: Record<string, string>;
  show?: (props: CodeBlockSlotProps) => boolean;
}

type CodeBlockSlotFn = (props: CodeBlockSlotProps) => VNode | VNode[]

export interface CodeBlockSlotProps {
  language: string;
  code: string;
  copy: (text: string) => void;
  copied: boolean;
  collapsed: boolean;
  toggleCollapse: () => void;
}

export interface CodeBlockSlots {
  codeHeader?: CodeBlockSlotFn;
  codeActions?: CodeBlockSlotFn;
}
