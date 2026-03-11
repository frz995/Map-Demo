import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    sourcemap: 'hidden',
  },
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use instead of trying the next available port
  },
  resolve: {
    alias: {
      '@zip.js/zip.js/lib/zip-no-worker.js': path.resolve('src/cesium-zip-no-worker.ts'),
      '@zip.js/zip.js/dist/zip-no-worker.js': path.resolve('src/cesium-zip-no-worker.ts'),
    },
  },
  optimizeDeps: {
    // exclude: ['@cesium/engine', '@cesium/widgets', '@zip.js/zip.js'],
    include: ['mersenne-twister', 'urijs'],
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('./cesium'),
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@cesium/engine/Build/Workers/*',
          dest: 'cesium/Workers',
        },
        {
          src: 'node_modules/@cesium/engine/Build/ThirdParty/*',
          dest: 'cesium/ThirdParty',
        },
        {
          src: 'node_modules/@cesium/engine/Source/Assets/*',
          dest: 'cesium/Assets',
        },
        {
          src: 'node_modules/@cesium/widgets/Source/*',
          dest: 'cesium/Widgets',
        },
      ],
    }),
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
