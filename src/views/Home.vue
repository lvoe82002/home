<script setup>
import { ref } from 'vue'
import avatar from '../assets/avatar.jpg'

// —— 个人资料：改这里即可 ——
const profile = {
  avatar,
  name: '举个栗子',
  desc: '一个平平无奇的小站\n在这里放一些有趣的东西'
}

// —— 头像点击旋转：每点一下转一整圈，手机端同样生效 ——
const avatarRot = ref(0)
function spinAvatar() {
  avatarRot.value -= 360
}

// —— 顶部社交图标：label 用于无障碍，svg 是图标 ——
const socials = [
  {
    label: 'GitHub',
    url: 'https://github.com/lvoe82002/home',
    color: '#2d3e4d',
    svg: 'M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z'
  },
  {
    label: '邮箱',
    url: 'mailto:2078583352@qq.com',
    color: '#2b84bf',
    svg: 'M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm10 7.4L3.4 6h17.2L12 11.4zM3 7.8V18h18V7.8l-9 6.2-9-6.2z'
  },
  {
    label: 'RSS',
    url: '/rss.xml',
    color: '#e08a2b',
    svg: 'M4 11a9 9 0 0 1 9 9h-2.5A6.5 6.5 0 0 0 4 13.5V11zm0-4a13 13 0 0 1 13 13h-2.5A10.5 10.5 0 0 0 4 9.5V7zm1.5 9.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z'
  }
]

// —— 分组链接：原站「网站」分组 ——
const groups = [
  {
    title: '网站',
    links: [
      {
        icon: '★',
        star: true,
        label: '随机二次元图片API',
        url: '/img-api'
      },
      {
        icon: '✎',
        label: '我的个人主页',
        url: 'https://www.zenlydsp.top'
      }
    ]
  }
]
</script>

<template>
  <div class="home">
    <!-- 个人资料 -->
    <section class="profile">
      <div class="avatar-wrap" @click="spinAvatar">
        <img
          class="avatar"
          :src="profile.avatar"
          :alt="profile.name"
          :style="{ transform: 'rotate(' + avatarRot + 'deg)' }"
        />
      </div>

      <h1 class="name">{{ profile.name }}</h1>

      <div class="icon-links">
        <a
          v-for="s in socials"
          :key="s.label"
          class="icon-link"
          :href="s.url"
          :aria-label="s.label"
          :title="s.label"
          target="_blank"
          rel="noopener"
          :style="{ '--icon-c': s.color }"
        >
          <span class="icon-link-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path :d="s.svg" />
            </svg>
          </span>
        </a>
      </div>

      <p class="desc">{{ profile.desc }}</p>
    </section>

    <!-- 分组链接 -->
    <section v-for="g in groups" :key="g.title" class="group">
      <h2 class="md-sub-title">{{ g.title }}</h2>
      <ul class="md-list">
        <li v-for="link in g.links" :key="link.label">
          <a
            class="md-link md-link-shake"
            :href="link.url"
            target="_blank"
            rel="noopener"
          >
            <span class="md-link-front">
              <span class="md-link-icon">{{ link.icon }}</span>
              <span class="md-link-label">{{ link.label }}</span>
            </span>
            <span v-if="link.star" class="md-link-star">★</span>
            <span class="md-link-arrow">›</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* —— 个人资料 —— */
.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 0 26px;
  animation: fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.avatar-wrap {
  position: relative;
  width: 128px;
  height: 128px;
  padding: 4px;
  border-radius: 50%;
  background: conic-gradient(
    from var(--ring-angle),
    #96ceec 0deg,
    #3e9cd4 90deg,
    #2b84bf 180deg,
    #2b84bf 270deg,
    #96ceec 360deg
  );
  animation: ring-spin 5s linear infinite;
  box-shadow: 0 8px 22px rgba(34, 107, 163, 0.22);
  transition: box-shadow 0.3s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.avatar-wrap:hover {
  transform: scale(1.15);
  box-shadow: 0 12px 30px rgba(34, 107, 163, 0.32);
}

.avatar-wrap:active {
  transform: scale(1.06);
}

.avatar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  background: var(--pink-100);
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.name {
  margin: 18px 0 5px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-h);
  letter-spacing: 0.5px;
}

.icon-links {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 4px 0 14px;
}

.icon-link {
  display: inline-flex;
  align-items: center;
  color: var(--icon-c, var(--pink-700));
  transition: color 0.3s ease;
}

.icon-link:hover {
  color: var(--pink-500);
}

.icon-link-icon {
  display: flex;
  width: 24px;
  height: 24px;
}

.icon-link svg {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.3s cubic-bezier(0.56, -0.53, 0.79, 1.39);
}

.icon-link:hover svg {
  transform: rotate(180deg);
}

.desc {
  margin: 0 0 16px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text);
  text-align: center;
  white-space: pre-line;
}

/* —— 分组与胶囊链接 —— */
.group {
  width: 100%;
  animation: fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.md-sub-title {
  margin: 22px 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--pink-700);
  text-align: center;
}

.md-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.md-link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 50px;
  padding: 10px 42px 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1.5px solid rgba(62, 156, 212, 0.38);
  color: var(--text-h);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  box-shadow: var(--shadow-soft);
  transition: border-color 0.2s ease, background 0.2s ease,
    box-shadow 0.2s ease, transform 0.15s ease;
}

.md-link:hover {
  border-color: var(--pink-500);
  background: var(--card-solid);
  box-shadow: var(--shadow-hover);
}

.md-link:active {
  transform: scale(0.98);
}

.md-link-shake:hover {
  animation: jelly 0.55s ease-in-out both;
}

.md-link-front {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  z-index: 1;
}

.md-link-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--pink-200), var(--pink-300));
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  font-size: 18px;
  flex-shrink: 0;
}

.md-link-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.md-link-star {
  flex-shrink: 0;
  font-size: 13px;
  color: #f5a623;
  text-shadow: 0 1px 2px rgba(245, 166, 35, 0.35);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.md-link:hover .md-link-star {
  animation: bounce-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.md-link-arrow {
  position: absolute;
  right: 13px;
  width: 21px;
  height: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--pink-200), var(--pink-300));
  color: var(--pink-700);
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.md-link:hover .md-link-arrow {
  transform: translate(3px);
}
</style>
