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
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', 'element-plus','mermaid'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          mermaid: 'mermaid',
        },
      },
    },
  },
})
