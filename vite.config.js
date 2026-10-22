import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 文档：https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // SPA history 模式需要绝对路径，否则深层路由（如 /img-api/gallery）资源会 404
  base: '/'
})
