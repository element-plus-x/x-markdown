import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { createXMarkdownVitePlugin } from '@hejiayue/x-markdown-test/vite-plugin'

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
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
