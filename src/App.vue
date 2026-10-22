<script setup>
// 应用外壳：顶部留白 / 中间路由出口 / 底部页脚
const year = new Date().getFullYear()
</script>

<template>
  <div class="app-shell">
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="app-footer">
      <p>
        © {{ year }} 举个栗子 · Powered by
        <a href="https://pages.cloudflare.com/" target="_blank" rel="noopener">Cloudflare Pages</a>
      </p>
      <p>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">备案号（国内主机才需要，Cloudflare 免备案）</a>
      </p>
    </footer>
  </div>
</template>
