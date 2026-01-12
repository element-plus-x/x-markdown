import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createXMarkdownVitePlugin } from 'x-markdown-vue/vite-plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    // x-markdown 可选依赖自动检测插件
    createXMarkdownVitePlugin({
      showConsoleHints: true, // 显示控制台提示
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'x-markdown-vue/style': resolve(__dirname, '../x-markdown/src/MarkdownRender/index.css'),
      'x-markdown-vue': resolve(__dirname, '../x-markdown/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
