<script setup>
</script>

<template>
  <div class="not-found">
    <div class="code">404</div>
    <p class="tip">这里什么都没有呢～</p>
    <router-link class="back" to="/home">返回首页</router-link>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.code {
  font-size: 72px;
  font-weight: 700;
  background: var(--grad-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1;
}

.tip {
  margin: 14px 0 24px;
  color: var(--muted);
}

.back {
  display: inline-block;
  padding: 10px 28px;
  border-radius: 999px;
  background: var(--grad-brand);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 6px 16px rgba(62, 156, 212, 0.35);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.back:hover {
  transform: translateY(-2px);
}

.back:active {
  transform: scale(0.95);
}
</style>
