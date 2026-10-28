<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const petBase = (import.meta.env.BASE_URL + 'pet').replace(/\/+$/, '')

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
let introHandler = null

// 初始化桌宠（幂等：重复调用不会再初始化）
function startPet() {
  if (petReady) return
  petReady = true
  // 注意：IIFE 必须写成 (async()=>{})() —— 末尾的 () 不能漏
  ;(async () => {
    const DSHPet = await loadPetScript(`${petBase}/dsh-pet.standalone.js`)
    await DSHPet.init({
      assetRoot: petBase,
      size: 300,
      corner: 'bottom-right',
      phrases: ['摸鱼中，勿扰~', '今天也要加油鸭！', '代码写完了吗？', '大肥鱼参上！'],
      whisperIntervalSec: 20
    })
  })().catch((err) => {
    petReady = false
    console.error(err)
  })
}

onMounted(async () => {
  // 等初始路由真正就绪，否则 route.path 可能还是 '/'，会把非首页误判成首页
  await router.isReady()
  const isHome = route.path === '/' || route.path === '/home'
  if (isHome) {
    // 首页有开场动画：等开场消失（Home.vue 派发 home:intro-done）后再显示桌宠
    introHandler = () => startPet()
    window.addEventListener('home:intro-done', introHandler, { once: true })
    // 兜底：事件若已先于监听触发，直接启动
    if (window.__introDone) startPet()
  } else {
    // 其他页面没有开场动画，立即显示桌宠
    startPet()
  }
})

onBeforeUnmount(() => {
  if (introHandler) window.removeEventListener('home:intro-done', introHandler)
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