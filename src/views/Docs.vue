<script setup>
import { ref, onMounted } from 'vue'

const apiBase = '/api/img'
const origin = location.origin

const NAME_MAP = {
  acg: '二次元自适应',
  pc: 'PC横图',
  mp: '移动竖图',
  moe: '萌版横图',
  ys: '原神自适应',
  miku: '初音未来自适应',
  fj: '风景',
  bd: '日常',
  lai: '萝莉',
  tx: '头像',
  xhl: '小狐狸',
  ysmp: '原神竖图',
  moemp: '萌版竖图',
  mikump: '初音未来合集'
}
function displayName(n) { return NAME_MAP[n] || n }

const categories = ref([])
const toast = ref('')
let toastTimer = null

function showToast(text) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

function copy(text) {
  navigator.clipboard.writeText(text).then(
    () => showToast('✓ 已复制：' + text),
    () => showToast('复制失败，请手动复制')
  )
}

const endpoints = [
  { method: 'GET', title: '随机一张（全部分类）', desc: '不传分类时，从图床所有分类里随机返回一张图片（302 跳转）。', code: '/api/img' },
  { method: 'GET', title: '指定分类随机（短链）', desc: '根路径直接写分类名，等价于 /api/img/分类，可直接在浏览器或 <img> 里使用。', code: '/acg' },
  { method: 'GET', title: '指定分类随机（完整路径）', desc: '从指定分类随机返回一张图片（302 跳转）。', code: '/api/img/acg' },
  { method: 'GET', title: '返回 JSON', desc: '加 ?json=1 不再跳转，直接返回包含图片直链的 JSON 数据。', code: '/api/img/acg?json=1' },
  { method: 'GET', title: '分类清单', desc: '加 ?list=1，返回所有分类及每个分类的图片数量。', code: '/api/img?list=1' },
  { method: 'GET', title: '某分类全部图片', desc: '分类后加 ?list=1，返回该分类下全部图片的直链清单（图库页用）。', code: '/api/img/acg?list=1' }
]

async function loadCats() {
  try {
    const r = await fetch(apiBase + '?list=1&t=' + Date.now())
    const data = await r.json()
    if (data.code === 200) categories.value = data.categories || []
  } catch (e) {}
}

onMounted(loadCats)
</script>

<template>
  <div class="docs-page">
    <main class="page">
      <header>
        <div class="eyebrow">栗次元</div>
        <h1>随机图片接口 JSON 文档</h1>
        <p class="intro">
          通过 URL 指定分类，随机返回图片（302 跳转）或 JSON 直链，
          供博客背景、个人主页、小程序等场景直接调用。
        </p>
      </header>

      <section class="grid" aria-label="接口示例">
        <article class="card" v-for="e in endpoints" :key="e.code">
          <div class="card-head">
            <h2>{{ e.title }}</h2>
            <span class="tag">{{ e.method }}</span>
          </div>
          <p>{{ e.desc }}</p>
          <div class="codebar">
            <code>{{ origin }}{{ e.code }}</code>
            <button type="button" class="copy-btn" title="复制接口地址" @click="copy(origin + e.code)">⧉</button>
          </div>
        </article>
      </section>

      <section class="section">
        <h2>分类名（短链）</h2>
        <p class="muted">
          分类与图床文件夹实时同步，当前共 {{ categories.length }} 个。
          点击任一分类即可复制它的随机图片地址。
        </p>
        <div class="cat-tags">
          <button
            v-for="c in categories"
            :key="c.name"
            class="cat-tag"
            type="button"
            @click="copy(origin + '/' + c.name)"
          >
            <span class="cat-name">{{ c.name }}</span>
            <span class="cat-cn">{{ displayName(c.name) }} · {{ c.count }} 张</span>
          </button>
        </div>
      </section>

      <section class="section">
        <h2>参数说明</h2>
        <table>
          <thead>
            <tr><th>参数</th><th>说明</th><th>示例</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>分类名</strong></td>
              <td>URL 路径中的分类，例如 acg、pc、mp；根路径短链和 /api/img/ 下都可用。</td>
              <td><code>/acg</code></td>
            </tr>
            <tr>
              <td><strong>json=1</strong></td>
              <td>不跳转，直接返回 JSON：分类名和图片直链。</td>
              <td><code>/api/img/acg?json=1</code></td>
            </tr>
            <tr>
              <td><strong>list=1</strong></td>
              <td>返回清单：不带分类时为全部分类，带分类时为该分类全部图片。</td>
              <td><code>/api/img?list=1</code></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>返回示例</h2>
        <p class="muted">直接访问图片地址（302 跳转，浏览器看到的就是图片）：</p>
        <pre class="sample">GET {{ origin }}/acg
→ 302 Found
Location: https://gcore.jsdelivr.net/gh/&lt;用户&gt;/&lt;图床&gt;@main/acg/xxx.jpeg</pre>
        <p class="muted" style="margin-top:16px">加 ?json=1 时：</p>
        <pre class="sample">{
  "code": 200,
  "category": "acg",
  "url": "https://gcore.jsdelivr.net/gh/&lt;用户&gt;/&lt;图床&gt;@main/acg/xxx.jpeg"
}</pre>
        <p class="muted" style="margin-top:16px">加 ?list=1 时：</p>
        <pre class="sample">{
  "code": 200,
  "categories": [
    { "name": "acg", "count": 7 },
    { "name": "mp", "count": 1 },
    { "name": "pc", "count": 1 }
  ]
}</pre>
      </section>

      <footer>
        <router-link to="/img-api/gallery">← 返回图库预览</router-link>
        <router-link to="/img-api">返回接口页</router-link>
      </footer>
    </main>

    <div class="toast" :class="{ show: !!toast }">{{ toast }}</div>
  </div>
</template>

<style scoped>
.docs-page {
  min-height: 100svh;
  background: radial-gradient(circle at top left, rgba(15, 139, 141, .12), transparent 30rem),
    linear-gradient(180deg, #fbfcff 0%, #f3f7fa 42%, #eef2f7 100%);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #172033;
}
.page { width: min(1080px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0 56px; }
header { display: grid; gap: 18px; padding: 24px 0 34px; }
.eyebrow {
  width: fit-content; padding: 7px 11px;
  border: 1px solid rgba(15, 139, 141, .22); border-radius: 999px;
  background: rgba(15, 139, 141, .08); color: #096b6d;
  font-size: 13px; font-weight: 700;
}
h1 { margin: 0; font-size: clamp(28px, 5vw, 46px); line-height: 1.1; font-weight: 800; }
.intro { max-width: 700px; margin: 0; color: #657086; font-size: 16px; line-height: 1.8; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 16px; }
.card {
  min-width: 0; border: 1px solid #e4e8f0; border-radius: 12px;
  background: rgba(255, 255, 255, .9); box-shadow: 0 18px 50px rgba(23, 32, 51, .08);
  overflow: hidden; display: flex; flex-direction: column;
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 18px 0; }
.card-head h2 { margin: 0; font-size: 17px; line-height: 1.4; }
.tag { flex: 0 0 auto; border-radius: 999px; padding: 5px 10px; background: #eaf7f5; color: #16865a; font-size: 12px; font-weight: 800; }
.card p { margin: 10px 18px 16px; color: #657086; font-size: 14px; line-height: 1.7; flex: 1; }
.codebar {
  min-width: 0; max-width: 100%;
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px;
  margin: auto 18px 18px; border-radius: 8px; background: #101827; color: #e7edf7; overflow: hidden;
}
.codebar code {
  min-width: 0; padding: 14px 0 14px 14px; overflow-x: auto; white-space: nowrap;
  font-family: Consolas, "SFMono-Regular", monospace; font-size: 13px;
}
.copy-btn {
  width: 40px; height: 40px; margin-right: 6px; border: 0; border-radius: 8px;
  background: rgba(255, 255, 255, .1); color: #fff; cursor: pointer; font-size: 18px; line-height: 1;
}
.copy-btn:hover { background: rgba(255, 255, 255, .2); }
.section { margin-top: 22px; padding: 24px; border: 1px solid #e4e8f0; border-radius: 12px; background: rgba(255, 255, 255, .82); }
.section h2 { margin: 0 0 14px; font-size: 20px; }
.muted { color: #657086; font-size: 14px; line-height: 1.8; }
.cat-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.cat-tag {
  display: inline-flex; flex-direction: column; align-items: flex-start; gap: 2px;
  padding: 9px 14px; border-radius: 10px; border: 1px solid #dde7ee;
  background: #f6fafc; cursor: pointer; transition: all .18s; text-align: left;
}
.cat-tag:hover { border-color: #0f8b8d; background: #eaf7f5; transform: translateY(-2px); }
.cat-name { font-family: Consolas, monospace; font-weight: 700; color: #0d5f61; font-size: 14px; }
.cat-cn { font-size: 12px; color: #7a879b; }
.section code { padding: 3px 6px; border-radius: 6px; background: #eef3f7; color: #1d5261; font-family: Consolas, monospace; font-size: 13px; white-space: nowrap; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 14px 12px; border-bottom: 1px solid #e4e8f0; text-align: left; vertical-align: top; line-height: 1.7; }
th { color: #445169; font-size: 13px; font-weight: 800; background: #f2f5f9; }
td { color: #657086; font-size: 14px; }
td strong { color: #172033; }
.sample {
  margin: 8px 0 0; padding: 18px; border-radius: 8px; overflow-x: auto;
  background: #101827; color: #e7edf7;
  font-family: Consolas, "SFMono-Regular", monospace; font-size: 13px; line-height: 1.7;
  white-space: pre;
}
footer { margin-top: 28px; display: flex; justify-content: center; gap: 26px; font-size: 15px; }
footer a { color: #0f8b8d; text-decoration: none; }
footer a:hover { text-decoration: underline; }
.toast {
  position: fixed; bottom: 28px; left: 50%;
  transform: translateX(-50%) translateY(16px);
  background: linear-gradient(to right, #0f8b8d, #15a3a5); color: #fff;
  padding: 12px 24px; border-radius: 999px; font-size: 14px;
  opacity: 0; visibility: hidden; transition: all .25s;
  box-shadow: 0 10px 26px rgba(15, 139, 141, .35); pointer-events: none;
}
.toast.show { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
@media (max-width: 760px) {
  .page { width: min(100% - 22px, 1080px); padding-top: 28px; }
  .grid { grid-template-columns: 1fr; }
  .section { padding: 18px; }
  th, td { padding: 12px 9px; }
}
</style>
