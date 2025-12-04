<template>
  <!-- 代码块容器：包含头部工具栏和代码渲染区域 -->
  <div class="x-md-code-block" :class="{ 'x-md-code-block--dark': props.isDark }">
    <!-- 头部区域：支持完全自定义或默认渲染 -->
    <div v-if="showCodeBlockHeader" class="x-md-code-header">
      <!-- codeHeader 插槽：完全替换整个头部区域 -->
      <slot
        name="codeHeader"
        :language="language"
        :code="code"
        :copy="copy"
        :copied="copied"
        :collapsed="collapsed"
        :toggleCollapse="toggleCollapse"
      >
        <!-- 左侧：语言标识 + 折叠按钮 -->
        <div class="x-md-code-header__left">
          <!-- 折叠/展开图标 -->
          <button
            class="x-md-collapse-btn"
            :class="{ 'x-md-collapse-btn--collapsed': collapsed }"
            @click="toggleCollapse"
            :title="collapsed ? '展开代码' : '折叠代码'"
          >
            <svg
              class="x-md-collapse-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <!-- 语言标识 -->
          <span class="x-md-code-lang">{{ language }}</span>
        </div>
        <!-- 右侧：操作按钮区域 -->
        <div class="x-md-code-header__right">
          <!-- codeActions 插槽：自定义操作按钮区域 -->
          <slot name="codeActions" :code="code" :copy="copy" :copied="copied">
            <!-- 默认复制按钮 -->
            <button class="x-md-copy-btn" :class="{ 'x-md-copy-btn--copied': copied }" @click="copy(code)">
              <!-- 复制成功状态：显示对勾图标 -->
              <svg
                v-if="copied"
                class="x-md-copy-icon"
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1024 1024"
              >
                <path
                  fill="currentColor"
                  d="M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"
                />
              </svg>
              <!-- 默认状态：显示复制图标 -->
              <svg
                v-else
                class="x-md-copy-icon"
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1024 1024"
              >
                <path
                  fill="currentColor"
                  d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64z"
                />
                <path
                  fill="currentColor"
                  d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64"
                />
              </svg>
            </button>
          </slot>
        </div>
      </slot>
    </div>
    <!-- 代码块主体（可折叠） -->
    <div class="x-md-code-body" :class="{ 'x-md-code-body--collapsed': collapsed }">
      <!-- 使用 SyntaxCodeBlock 组件进行代码渲染 -->
      <SyntaxCodeBlock
        ref="syntaxCodeBlockRef"
        :code="code"
        :language="language"
        :light-theme="props.lightTheme"
        :dark-theme="props.darkTheme"
        :is-dark="props.isDark"
        :color-replacements="props.colorReplacements"
        :code-max-height="props.codeMaxHeight"
        :enable-animate="props.enableAnimate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue 核心 API
import { computed, ref } from 'vue'
// 剪贴板功能
import { useClipboard } from '@vueuse/core'
// 引入类型定义
import type { CodeBlockProps } from './types'
// 引入纯渲染组件
import SyntaxCodeBlock from './SyntaxCodeBlock.vue'

// 定义组件名称
defineOptions({
  name: 'CodeBlock',
})

// 使用 vueuse 的剪贴板 hook，复制成功状态持续 2 秒
const { copy, copied } = useClipboard({ copiedDuring: 2000 })

// 折叠状态
const collapsed = ref(false)

// SyntaxCodeBlock 组件引用
const syntaxCodeBlockRef = ref<InstanceType<typeof SyntaxCodeBlock> | null>(null)

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

// 定义组件 props 默认值（类型从 types.d.ts 导入）
const props = withDefaults(defineProps<CodeBlockProps>(), {
  lightTheme: 'vitesse-light', // 默认亮色主题
  darkTheme: 'vitesse-dark',   // 默认暗色主题
  isDark: false,               // 默认亮色模式
  showCodeBlockHeader: true,   // 默认显示代码块头部
  enableAnimate: false,        // 默认不启用动画
})

// 处理代码内容
const code = computed(() => props.code.trim())

// 处理语言标识
const language = computed(() => props.language || 'text')

// 暴露给父组件的属性和方法
defineExpose({
  copy,                  // 复制方法
  copied,                // 复制状态
  collapsed,             // 折叠状态
  toggleCollapse,        // 切换折叠
  syntaxCodeBlockRef,    // 渲染组件引用
})
</script>

<style scoped>
/* ==================== 代码块容器样式 ==================== */
.x-md-code-block {
  border-radius: 8px;      /* 圆角边框 */
  overflow: hidden;        /* 隐藏溢出内容 */
  font-size: 0;            /* 消除内联元素间隙 */
  background: rgba(0, 0, 0, 0.03); /* 浅色背景 */
}

/* 暗色主题容器 */
.x-md-code-block.x-md-code-block--dark {
  background: rgba(255, 255, 255, 0.13); /* 深色背景 */
}

/* ==================== 头部工具栏样式 ==================== */
.x-md-code-header {
  display: flex;                     /* 弹性布局 */
  justify-content: space-between;    /* 两端对齐 */
  align-items: center;               /* 垂直居中 */
  padding: 8px 16px;                 /* 内边距 */
  background: rgba(0, 0, 0, 0.05);   /* 半透明背景 */
  color: #333;                       /* 文字颜色 */
}

/* 暗色主题头部 */
.x-md-code-block.x-md-code-block--dark .x-md-code-header {
  background: rgba(0, 0, 0, 0.25);   /* 更深的背景 */
  color: #fff;                       /* 白色文字 */
}

/* 头部左右区域布局 */
.x-md-code-header__left,
.x-md-code-header__right {
  display: flex;       /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 8px;            /* 元素间距 */
}

/* 语言标识样式 */
.x-md-code-lang {
  font-size: 12px;             /* 字体大小 */
  font-weight: 500;            /* 字重 */
  opacity: 0.6;                /* 透明度 */
  text-transform: lowercase;   /* 小写显示 */
}

/* ==================== 复制按钮样式 ==================== */
.x-md-copy-btn {
  display: flex;              /* 弹性布局 */
  align-items: center;        /* 垂直居中 */
  justify-content: center;    /* 水平居中 */
  width: 28px;                /* 按钮宽度 */
  height: 28px;               /* 按钮高度 */
  padding: 0;                 /* 清除内边距 */
  border: none;               /* 无边框 */
  border-radius: 4px;         /* 圆角 */
  background: transparent;    /* 透明背景 */
  color: inherit;             /* 继承文字颜色 */
  cursor: pointer;            /* 手型光标 */
  opacity: 0.7;               /* 默认透明度 */
  transition: all 0.2s ease;  /* 过渡动画 */
}

/* 复制按钮悬停状态 */
.x-md-copy-btn:hover {
  opacity: 1;                        /* 完全不透明 */
  background: rgba(0, 0, 0, 0.08);   /* 显示背景 */
}

/* 暗色主题复制按钮悬停 */
.x-md-code-block.x-md-code-block--dark .x-md-copy-btn:hover {
  background: rgba(255, 255, 255, 0.1); /* 浅色背景 */
}

/* 复制成功状态 */
.x-md-copy-btn.x-md-copy-btn--copied {
  opacity: 1;          /* 完全不透明 */
  color: #22c55e;      /* 绿色表示成功 */
}

/* 复制图标 */
.x-md-copy-icon {
  flex-shrink: 0; /* 防止图标被压缩 */
}

/* ==================== 折叠按钮样式 ==================== */
.x-md-collapse-btn {
  display: flex;              /* 弹性布局 */
  align-items: center;        /* 垂直居中 */
  justify-content: center;    /* 水平居中 */
  width: 20px;                /* 按钮宽度 */
  height: 20px;               /* 按钮高度 */
  padding: 0;                 /* 清除内边距 */
  border: none;               /* 无边框 */
  border-radius: 4px;         /* 圆角 */
  background: transparent;    /* 透明背景 */
  color: inherit;             /* 继承文字颜色 */
  cursor: pointer;            /* 手型光标 */
  opacity: 0.5;               /* 默认较低透明度 */
  transition: all 0.2s ease;  /* 过渡动画 */
}

/* 折叠按钮悬停状态 */
.x-md-collapse-btn:hover {
  opacity: 1;                        /* 完全不透明 */
  background: rgba(0, 0, 0, 0.08);   /* 显示背景 */
}

/* 暗色主题折叠按钮悬停 */
.x-md-code-block.x-md-code-block--dark .x-md-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1); /* 浅色背景 */
}

/* 折叠图标 */
.x-md-collapse-icon {
  transition: transform 0.2s ease; /* 旋转动画 */
}

/* 折叠状态时图标旋转 -90 度 */
.x-md-collapse-btn--collapsed .x-md-collapse-icon {
  transform: rotate(-90deg);
}

/* ==================== 代码块主体样式 ==================== */
.x-md-code-body {
  overflow: hidden; /* 隐藏溢出（用于折叠动画） */
  transition:
    max-height 0.3s ease,  /* 高度过渡 */
    opacity 0.2s ease;     /* 透明度过渡 */
}

/* 折叠状态 */
.x-md-code-body--collapsed {
  max-height: 0 !important; /* 高度为 0 */
  opacity: 0;               /* 完全透明 */
}
</style>
