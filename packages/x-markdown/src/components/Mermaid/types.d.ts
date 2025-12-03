export interface MermaidToolbarConfig {
  showToolbar?: boolean
  showFullscreen?: boolean
  showZoomIn?: boolean
  showZoomOut?: boolean
  showReset?: boolean
  showDownload?: boolean
  toolbarStyle?: Record<string, any>
  toolbarClass?: string
  iconColor?: string
  tabTextColor?: string
  hoverBackgroundColor?: string
  tabActiveBackgroundColor?: string
}

export interface MermaidToolbarProps extends MermaidToolbarConfig {}

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

export interface MermaidToolbarEmits {
  onZoomIn: []
  onZoomOut: []
  onReset: []
  onFullscreen: []
  onEdit: []
  onToggleCode: []
  onCopyCode: []
  onDownload: []
}

// Mermaid 组件暴露给插槽的方法接口
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
  toolbarConfig: import('vue').ComputedRef<MermaidToolbarConfig>
  rawContent: string
}

export interface MermaidExposeProps {
  showSourceCode: boolean
  svg: string
  rawContent: any
  toolbarConfig: MermaidToolbarConfig
  isLoading: boolean

  // 缩放控制方法
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fullscreen: () => void

  // 其他操作方法
  toggleCode: () => void
  copyCode: () => Promise<void>
  download: () => void

  // 原始 props（除了重复的 toolbarConfig）
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
  toolbarConfig?: MermaidToolbarConfig;
  isDark?: boolean;
  lightTheme?: string;
  darkTheme?: string;
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