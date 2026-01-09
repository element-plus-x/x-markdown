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
        // 优化输出
        preserveModules: false, // 不保留模块结构，生成单一 bundle
        preserveModulesRoot: resolve(__dirname, 'src'),
        // 启用 Tree Shaking
        exports: 'named', // 使用命名导出，优化 tree-shaking
        // 手动代码分割
        manualChunks: undefined, // 库模式不需要代码分割
        // 保留动态导入以支持代码分割 (Mermaid 按需加载)
        inlineDynamicImports: false,
      },
      // Tree Shaking 配置
      treeshake: {
        moduleSideEffects: false, // 假设所有模块都是纯净的（无副作用）
        propertyReadSideEffects: true, // 优化属性读取
        unknownGlobalSideEffects: false, // 假设全局变量无副作用
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    // 关键配置：不内联动态导入，允许 Mermaid 被分割成单独的 chunk
    inlineDynamicImports: false,
  },
})
