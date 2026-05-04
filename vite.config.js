import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',   // 直接部署在网站根目录
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        product1: resolve(__dirname, 'product1.html'),
        product2: resolve(__dirname, 'product2.html'),
        product3: resolve(__dirname, 'product3.html'),
        product4: resolve(__dirname, 'product4.html'),
        product5: resolve(__dirname, 'product5.html'),
        product6: resolve(__dirname, 'product6.html'),
        product7: resolve(__dirname, 'product7.html'),
        product8: resolve(__dirname, 'product8.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'three-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})