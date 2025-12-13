import type { Ref, ComputedRef } from 'vue'

export interface SyntaxMermaidProps {
  content: string
  id?: string
  isDark?: boolean
  config?: Record<string, any>
}

export interface SyntaxMermaidExpose {
  svg: Ref<string>
  isLoading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  containerRef: Ref<HTMLElement | null>
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void
  download: () => void
  getSvg: () => string
  reinitialize: () => void
}

export interface MermaidZoomControls {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void
  destroy: () => void
  initialize: () => void
}

export interface UseMermaidZoomOptions {
  container: Ref<HTMLElement | null>
  scaleStep?: number
  minScale?: number
  maxScale?: number
}

export interface UseMermaidResult {
  data: Ref<string>
  error: Ref<unknown>
  isLoading: Ref<boolean>
}

export interface MermaidExposedMethods {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void
  toggleCode: () => void
  copyCode: () => void
  download: () => void
  svg: import('vue').Ref<string>
  showSourceCode: import('vue').Ref<boolean>
  rawContent: string
}

export interface MermaidExposeProps {
  showSourceCode: boolean
  svg: string
  rawContent: any
  isLoading: boolean
  copied: boolean
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void
  toggleCode: () => void
  copyCode: () => Promise<void>
  download: () => void
  raw: any
}

export interface MdComponent {
  raw: any
}

export interface MermaidProps extends MdComponent {
  raw: {
    content?: string;
    key?: string;
    [key: string]: any;
  };
  isDark?: boolean;
  lightTheme?: string;
  darkTheme?: string;
  mermaidActions?: MermaidAction[];
  config?: {
    theme?: string;
    securityLevel?: string;
    startOnLoad?: boolean;
    flowchart?: {
      curve?: string;
      useMaxWidth?: boolean;
      htmlLabels?: boolean;
      nodeSpacing?: number;
      rankSpacing?: number;
      padding?: number;
      diagramPadding?: number;
      defaultRenderer?: string;
      [key: string]: any;
    };
    sequence?: {
      diagramMarginX?: number;
      diagramMarginY?: number;
      actorMargin?: number;
      width?: number;
      height?: number;
      boxMargin?: number;
      boxTextMargin?: number;
      noteMargin?: number;
      messageMargin?: number;
      mirrorActors?: boolean;
      bottomMarginAdj?: number;
      useMaxWidth?: boolean;
      showSequenceNumbers?: boolean;
      [key: string]: any;
    };
    gantt?: {
      titleTopMargin?: number;
      barHeight?: number;
      barGap?: number;
      topPadding?: number;
      sidePadding?: number;
      gridLineStartPadding?: number;
      fontSize?: number;
      fontFamily?: string;
      numberSectionStyles?: number;
      axisFormat?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

import type { VNode, Component, FunctionalComponent } from 'vue'

type MermaidIconRenderFn = (props: MermaidSlotProps) => VNode

export interface MermaidAction {
  key: string;
  icon?: Component | FunctionalComponent | string | MermaidIconRenderFn;
  title?: string;
  onClick?: (props: MermaidSlotProps) => void;
  disabled?: boolean;
  class?: string;
  style?: Record<string, string>;
  show?: (props: MermaidSlotProps) => boolean;
}

type MermaidSlotFn = (props: MermaidSlotProps) => VNode | VNode[]

export interface MermaidSlotProps {
  showSourceCode: boolean;
  svg: string;
  rawContent: string;
  isLoading: boolean;
  copied: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fullscreen: () => void;
  toggleCode: () => void;
  copyCode: () => Promise<void>;
  download: () => void;
  raw: any;
}

export interface MermaidSlots {
  mermaidHeader?: MermaidSlotFn;
  mermaidActions?: MermaidSlotFn;
}
