<script setup>
import { ref, onMounted, watch } from 'vue'

const apiBase = '/api/img'
const NAME_MAP = {
  acg: '二次元自适应', pc: 'PC横图', mp: '移动竖图', moe: '萌版横图',
  ys: '原神自适应', miku: '初音未来自适应', fj: '风景', bd: '日常',
  lai: '萝莉', tx: '头像', xhl: '小狐狸', ysmp: '原神竖图',
  moemp: '萌版竖图', mikump: '初音未来合集'
}
function displayName(n) { return NAME_MAP[n] || n }
const categories = ref([])
const activeCat = ref('')
const images = ref([])
const loading = ref(true)

async function loadCats() {
  loading.value = true
  try {
    const r = await fetch(apiBase + '?list=1&t=' + Date.now())
    const data = await r.json()
    if (data.code === 200) {
      categories.value = data.categories || []
      if (categories.value.length) select(categories.value[0].name)
    }
  } catch (e) {}
  loading.value = false
}

async function select(name) {
  activeCat.value = name
  images.value = []
  loading.value = true
  try {
    const r = await fetch(apiBase + '/' + encodeURIComponent(name) + '?list=1&t=' + Date.now())
    const data = await r.json()
    if (data.code === 200) images.value = (data.images || []).map(i => ({ ...i, url: i.url + '?t=' + Date.now() }))
  } catch (e) {}
  loading.value = false
}

onMounted(loadCats)
</script>

<template>
  <div class="gallery-page">
    <div class="container">
      <h1>栗子次元图片库</h1>

      <router-link class="doc-link-panel" to="/docs">
        <span class="book">📚</span>
        <span class="txt">JSON 接口文档：<b>点击查看</b></span>
      </router-link>

      <div class="category-tabs">
        <a
          v-for="c in categories"
          :key="c.name"
          :class="{ catBtn: true, active: c.name === activeCat }"
          @click.prevent="select(c.name)"
        >{{ displayName(c.name) }} ({{ c.count }})</a>
      </div>

      <div class="gallery-container">
        <h2 class="gallery-title">{{ displayName(activeCat) }} 图片集</h2>
        <div class="image-gallery" v-if="images.length">
          <a class="image-card" v-for="(img, i) in images" :key="i" :href="img.url" target="_blank">
            <div class="image-container">
              <img :src="img.url" :alt="img.name" loading="lazy" />
            </div>
          </a>
        </div>
        <div v-else class="empty">{{ loading ? '加载中…' : '这个分类还没有图片' }}</div>
      </div>
    </div>

    <router-link class="back" to="/img-api">← 返回接口页</router-link>
  </div>
</template>

<style scoped>
.gallery-page { min-height: 100svh; background: linear-gradient(135deg, #f5f7fa, #e4e8f8, #f0f5ff); background-attachment: fixed; font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; color: #2b3a55; padding: 24px 0 80px; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
h1 { text-align: center; font-size: 34px; color: #3a4a6b; margin: 10px 0 24px; }
.doc-link-panel { display: flex; align-items: center; justify-content: center; gap: 12px; background: #fff; border-radius: 16px; padding: 18px 22px; box-shadow: 0 6px 20px -8px rgba(50,70,110,.18); cursor: pointer; margin-bottom: 18px; font-size: 16px; text-decoration: none; color: inherit; transition: transform .2s, box-shadow .2s; }
.doc-link-panel:hover { transform: translateY(-2px); box-shadow: 0 10px 26px -8px rgba(50,70,110,.28); }
.doc-link-panel b { color: #2f6fed; margin-left: 6px; text-decoration: underline; text-underline-offset: 3px; }
.book { font-size: 22px; }
.category-tabs { display: flex; flex-wrap: wrap; gap: 10px; background: #fff; border-radius: 16px; padding: 16px 18px; box-shadow: 0 6px 20px -8px rgba(50,70,110,.18); margin-bottom: 22px; }
.catBtn { padding: 8px 16px; border-radius: 999px; background: #eef1f7; color: #4a5a7a; font-size: 14px; cursor: pointer; transition: all .2s; }
.catBtn.active { background: #2f6fed; color: #fff; }
.gallery-container { background: #fff; border-radius: 16px; padding: 20px 18px 28px; box-shadow: 0 6px 20px -8px rgba(50,70,110,.18); }
.gallery-title { text-align: center; font-size: 22px; color: #3a4a6b; padding-bottom: 12px; margin-bottom: 18px; position: relative; }
.gallery-title::after { content: ''; position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 60px; height: 3px; border-radius: 3px; background: #2f6fed; }
.image-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.image-card { display: block; background: #eef1f7; border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; }
.image-container { width: 100%; height: 100%; }
.image-container img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
.image-card:hover img { transform: scale(1.04); }
.empty { text-align: center; color: #9aa; padding: 60px 0; }
.back { display: block; text-align: center; margin-top: 30px; color: #2f6fed; text-decoration: none; font-size: 15px; }
@media (max-width: 640px) {
  h1 { font-size: 26px; }
  .image-gallery { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
