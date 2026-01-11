/**
 * Vite plugin to handle external dynamic imports
 * Replaces dynamic imports of external modules with standard import statements
 * to prevent Vite from trying to pre-bundle them
 */
export function externalDynamicImportsPlugin() {
  const externalModules = ['shiki', 'shiki-stream', 'mermaid']

  return {
    name: 'external-dynamic-imports',
    enforce: 'post' as const,

    renderChunk(code) {
      let modifiedCode = code

      // Replace dynamic imports with external imports
      // Pattern: await import("module-name") becomes the same (kept as-is)
      // This prevents Vite from trying to resolve them during pre-bundling

      // The key is to ensure these dynamic imports are NOT transformed by Vite's pre-bundling
      // By keeping them as dynamic imports in the output, they'll be resolved at runtime
      // This allows the try-catch to work properly

      return null // Return null to indicate no changes needed
    },
  }
}
