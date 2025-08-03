// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteMockServe } from 'vite-plugin-mock';

export default defineConfig({
  plugins: [
    react(),
    viteMockServe({
      mockPath: 'mock',
      localEnabled: true,
      prodEnabled: false,
      watchFiles: true,
      logger: true,   // 开启后，可以看到请求日志
    }),
  ],
  server: {
    // 👇 关键：将 server.proxy 整个配置块注释掉或删除
    /*
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // 或者你的 Django 地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // 可能还有这行
      },
    },
    */
  },
});