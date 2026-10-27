<script setup>
// 应用外壳：只负责渲染路由页面。
// 各页面（首页 / 图库 / 文档等）自己决定是否需要窄版居中容器：
// 不要在全局把宽度锁死成 720px，否则图库、API、文档这类全屏页面
// 两侧会留出一条底色，底板无法铺满整个屏幕。
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>
