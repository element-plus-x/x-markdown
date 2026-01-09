import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'XMarkdown',
      fileName: 'x-markdown',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'shiki', 'mermaid', 'shiki-stream', '@shikijs/core'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          shiki: 'Shiki',
          mermaid: 'Mermaid',
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    // 关键配置：不内联动态导入，允许 Mermaid 被分割成单独的 chunk
    inlineDynamicImports: false,
  },
})
