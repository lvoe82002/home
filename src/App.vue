<script setup>
// 应用外壳：只负责渲染路由页面。
// 各页面（首页 / 图库 / 文档等）自己决定是否需要窄版居中容器：
// 不要在全局把宽度锁死成 720px，否则图库、API、文档这类全屏页面
// 两侧会留出一条底色，底板无法铺满整个屏幕。
import { onMounted, onBeforeUnmount } from 'vue'

// ===================== 大肥鱼看板娘（dsh-pet） =====================
// 静态资源放在 public/pet 下（standalone.js + assets），构建后原样拷贝到 /pet。
// 用 BASE_URL 拼接，base 改成子路径时也能正确解析；默认 base='/' 时即 '/pet'。
const petBase = (import.meta.env.BASE_URL + 'pet').replace(/\/+$/, '')

// 动态注入脚本，幂等：已存在则复用，避免重复加载
function loadPetScript(src) {
  return new Promise((resolve, reject) => {
    if (window.DSHPet) return resolve(window.DSHPet)
    const existing = document.querySelector(`script[data-dsh-pet-loader]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.DSHPet))
      existing.addEventListener('error', reject)
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.dataset.dshPetLoader = 'true'
    s.onload = () => resolve(window.DSHPet)
    s.onerror = () => reject(new Error('大肥鱼脚本加载失败：' + src))
    document.head.appendChild(s)
  })
}

let petReady = false

onMounted(async () => {
  try {
    const DSHPet = await loadPetScript(`${petBase}/dsh-pet.standalone.js`)
    await DSHPet.init({
      assetRoot: petBase,
      size: 300,
      corner: 'bottom-right',
      phrases: ['摸鱼中，勿扰~', '今天也要加油鸭！', '代码写完了吗？', '大肥鱼参上！'],
      whisperIntervalSec: 20
    })
    petReady = true
  } catch (err) {
    // 资源不可达 / 跨域时只在控制台告警，不影响主站渲染
    console.error(err)
  }
})

// 根组件卸载时清理看板娘 DOM 与全部定时器
onBeforeUnmount(() => {
  if (petReady && window.DSHPet) window.DSHPet.destroy()
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>
