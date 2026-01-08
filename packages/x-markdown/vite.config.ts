import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'XMarkdown',
      fileName: (format) => `x-markdown.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // 外部化依赖，不打包进 bundle
      external: [
        'vue',
        'element-plus',
        'mermaid',
        'shiki',
        'shiki-stream',
        '@shikijs/core',
        // unified 生态系统
        'unified',
        'remark',
        'remark-parse',
        'remark-rehype',
        'remark-gfm',
        'remark-breaks',
        'remark-math',
        'rehype',
        'rehype-raw',
        'rehype-sanitize',
        'rehype-katex',
        'mdast',
        'hast',
        'mdast-util-to-hast',
        'unist-util-visit',
        'property-information',
        // 其他依赖
        'dompurify',
        'deepmerge',
        'lodash-es',
      ],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          mermaid: 'mermaid',
          shiki: 'shiki',
          'shiki-stream': 'ShikiStream',
          'dompurify': 'DOMPurify',
        },
        // 优化输出
        preserveModules: false, // 不保留模块结构，生成单一 bundle
        preserveModulesRoot: resolve(__dirname, 'src'),
        // 启用 Tree Shaking
        exports: 'named', // 使用命名导出，优化 tree-shaking
        // 手动代码分割
        manualChunks: undefined, // 库模式不需要代码分割
        // 生成 sourcemap
        sourcemap: true,
        // 内联动态导入
        inlineDynamicImports: true,
      },
      // Tree Shaking 配置
      treeshake: {
        moduleSideEffects: false, // 假设所有模块都是纯净的（无副作用）
        propertyReadSideEffects: true, // 优化属性读取
        unknownGlobalSideEffects: false, // 假设全局变量无副作用
      },
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        ecma: 2020,
        passes: 2,
        drop_console: false,
        drop_debugger: true,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    // CSS 代码分割
    cssCodeSplit: true,
    // 目标环境
    target: 'es2020',
    // 报告压缩后的文件大小
    reportCompressedSize: true,
    //chunkSizeWarningLimit: 500,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'element-plus'],
    exclude: ['shiki', 'shiki-stream', 'mermaid'],
  },
})
