import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 文档：https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 静态资源相对路径，部署到任意子路径/域名都不会 404
  base: './'
})
