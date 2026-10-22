import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载：每个页面单独打包，首屏更快
const Home = () => import('../views/Home.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes = [
  // 原站同时存在 / 和 /home，这里都指向首页
  { path: '/', name: 'root', component: Home },
  { path: '/home', name: 'home', component: Home },
  // 以后要加博客/归档/分类，照着这里加即可：
  // { path: '/blog', name: 'blog', component: () => import('../views/Blog.vue') },
  { path: '/img-api', name: 'img-api', component: () => import('../views/ImgApi.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }
]

const router = createRouter({
  // 别忘了把 routes 传进来，否则路由表为空、页面会被 tree-shake 掉
  routes,
  history: createWebHistory(),
  // 切换路由后回到顶部
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
