<script setup>
// 应用外壳：居中内容 + 路由出口（页脚版权与备案行已按需求移除）
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
  </div>
</template>
