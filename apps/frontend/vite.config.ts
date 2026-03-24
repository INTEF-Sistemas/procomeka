import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isPreviewStatic = process.env.PREVIEW_STATIC === '1';

  return {
    define: {
      'import.meta.env.VITE_PREVIEW_STATIC': JSON.stringify(isPreviewStatic ? '1' : '0'),
    },
    build: {
      outDir: 'dist',
    },
  };
});
