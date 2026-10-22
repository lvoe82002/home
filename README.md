# 举个栗子 · 个人主页（Vue3 + Vite，部署在 Cloudflare Pages）

---

## 一、这个网站是什么技术做的？

打开 `alcy.cc` 源码可以看到它是一个典型的 **Vue 3 + Vite 单页应用（SPA）**：

- **Vue 3**：页面框架（头像、链接、弹窗等组件）
- **Vite**：构建工具，把源码打包成 `dist/` 里的静态文件（HTML/JS/CSS）
- **vue-router**：前端路由，实现 `/home`、`/blog`、`/friends` 等多个页面
- **站酷快乐体（ZCOOL KuaiLe）**：从 Google Fonts 加载的可爱字体
- **Live2D 桌宠**：原站右下角的小人，是外部脚本 `pet.alcy.cc`，可加可不加
- 原站还有博客、归档、分类、搜索、公告弹窗、密码文章、代码高亮、抽奖、投票等功能，
  这些**绝大多数是纯前端**就能实现；只有「随机图 API」「短链接」这类需要后端逻辑的，
  用 **Cloudflare Pages Functions（免费 Serverless）** 即可，本项目已给了一个随机图示例。

> 一句话：**静态页面 + 少量 Serverless 函数 = 不需要买服务器。**

---

## 二、你需要哪些文件？（项目结构）

```
alcy-style-home/
├── index.html                 # 网页入口（字体、标题、挂载点）
├── package.json               # 依赖和脚本（npm run dev / build）
├── vite.config.js             # Vite 配置
├── .gitignore
├── README.md
│
├── public/                    # 原样拷到网站根目录的静态资源
│   ├── favicon.svg            # 网站小图标
│   └── _redirects             # SPA 路由回退（刷新 /home 不 404）
│
├── src/
│   ├── main.js                # 程序入口，创建 Vue 应用
│   ├── App.vue                # 页面外壳（中间内容 + 底部页脚）
│   ├── assets/
│   │   ├── styles.css         # 全局样式（配色变量、背景、动画）
│   │   └── avatar.jpg         # 头像（替换成你自己的）
│   ├── router/
│   │   └── index.js           # 路由表（页面地址 → 组件）
│   └── views/
│       ├── Home.vue           # 首页（重点改这个：昵称、简介、链接）
│       └── NotFound.vue       # 404 页面
│
└── functions/                 # ★ Cloudflare Pages Functions（免费后端）
    └── api/
        └── img/
            └── [[path]].js    # 随机图 API：/api/img、/api/img/<分类>
```

### 想改成你自己的内容，只需要动 3 个地方：

1. **`src/views/Home.vue`** 顶部：昵称、简介、社交图标、分组链接
2. **`src/assets/avatar.jpg`**：换成你的头像（也可以放 `xxx.png/svg` 并在 Home.vue 里改 `import avatar from '../assets/xxx.png'`）
3. **`src/App.vue`**：页脚版权信息

---

## 三、本地开发（可选，方便边改边看）

需要先装 Node.js（建议 18 或 20+）：

```bash
# 1. 安装依赖（第一次才需要）
npm install

# 2. 启动本地开发服务器
npm run dev
# 浏览器打开终端里显示的地址，一般是 http://localhost:5173

# 3. 打包出静态文件（产物在 dist/）
npm run build
```

---

## 四、部署：GitHub → Cloudflare Pages（这就是「云原生构建」）

核心思路：**把代码推到 GitHub，Cloudflare Pages 连着仓库，你一 push 它就自动在云端
`npm run build` 并发布 `dist/`，全程不用自己的电脑当服务器。**

### 步骤 1：把项目传到 GitHub

1. 在 GitHub 新建一个仓库（Public / Private 都行，建议 Public），例如叫 `my-home`
2. 在本项目目录里执行：

```bash
git init
git add .
git commit -m "init: 个人主页"
git branch -M main
git remote add origin https://github.com/你的用户名/my-home.git
git push -u origin main
```

### 步骤 2：在 Cloudflare Pages 创建项目并连接仓库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → 左侧 **Workers & Pages**
   → **Create** → **Pages** → **Connect to Git**
2. 选择刚才的 `my-home` 仓库并授权
3. 构建配置（Build settings）这样填：

   | 配置项 | 填什么 |
   |---|---|
   | Framework preset | **Vue**（选了会自动填下面几项） |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | （留空，除非项目在子文件夹） |
   | Environment variables | 见下方「随机图 API」 |

4. 点 **Save and Deploy**，等 1~2 分钟，构建成功后会得到一个免费地址：
   `https://my-home.pages.dev`

> 以后每次 `git push`，Cloudflare 都会自动重新构建发布；还会为每个分支生成预览地址。

### 步骤 3：启用随机图 API（可选）

`functions/api/img/[[path]].js` 会在部署后自动生效，但需要图片来源：

1. 再建一个**公开** GitHub 仓库当图床，按分类建文件夹传图：
   ```
   img-warehouse/
   ├── acg/  1.jpg、2.webp …
   └── moe/  a.gif …
   ```
2. 在 Pages 项目 → **Settings → Variables and Secrets** 添加：

   | 变量名 | 值 |
   |---|---|
   | `GITHUB_USER` | 你的 GitHub 用户名 |
   | `GITHUB_REPO` | 图床仓库名（如 `img-warehouse`） |
   | `GITHUB_BRANCH` | `main`（可选） |
   | `GITHUB_TOKEN` | 只读令牌（可选，更稳，限额 60→5000/小时） |

3. 重新部署（Deployments → Retry deployment）。访问：
   - `https://你的域名/api/img` → 随机一张（302 跳转）
   - `https://你的域名/api/img/acg` → 从 acg 分类随机
   - 加 `?json=1` → 返回 JSON

   图片通过 jsDelivr CDN 直链返回，流量不经过 Functions，免费额度内基本用不完。

---

## 五、绑定你的 .top 域名

有两种方式，推荐第一种：

### 方式 A：把 .top 域名接入 Cloudflare（推荐，自动 HTTPS + 免备案）

1. Cloudflare 首页 → **Add a site** → 输入你的 `xxx.top` → 选 **Free** 套餐
2. Cloudflare 会给你两个「名称服务器（NS）」地址，去你买 .top 的域名商后台，
   把 NS 改成 Cloudflare 给的那两个（等待生效，几分钟到几小时）
3. 域名接入后，进入 **Pages 项目 → Custom domains → Set up a custom domain**
   - 填 `www.xxx.top`（或 `xxx.top`），Cloudflare 会自动加 DNS 记录、自动签发证书
4. 想让根域名和 www 都能访问，就各加一次并做好跳转

### 方式 B：域名不转 NS，用 CNAME 指向（域名商支持的话）

在域名商后台加一条 CNAME：`www` → `my-home.pages.dev`，
再到 Pages → Custom domains 里添加该域名。这种方式证书由 Cloudflare 签，但部分
功能（如 Workers 路由）不如方式 A 方便。

> 部署在 Cloudflare 属于境外/海外节点，**不需要 ICP 备案**，所以页脚那行备案号可以删掉。

---

## 六、关于「云原生构建」

你提到的「云原生构建」本质就是第四节那套：**Git 提交 → 云端自动安装依赖 → 自动构建
→ 自动发布**。Cloudflare Pages 自带这个能力。如果你用的是腾讯 EdgeOne Pages、
CloudBase 等其他「云原生」平台，配置完全一样：

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node 版本：18 或 20（在环境变量里设 `NODE_VERSION=20`）

---

## 七、以后想加更多页面（博客 / 友链 / 归档）

1. 在 `src/views/` 新建 `Blog.vue`
2. 在 `src/router/index.js` 的 `routes` 里加一条：

   ```js
   { path: '/blog', name: 'blog', component: () => import('../views/Blog.vue') }
   ```

3. 在首页 `Home.vue` 的链接里把地址指向 `/blog`（站内链接用 router-link，不要加 target="_blank"）

---

## 常见问题

- **刷新 /home 后 404？** 确认 `public/_redirects` 存在且内容是 `/* /index.html 200`。
- **中文显示不出可爱字体？** 字体是异步加载的，等几秒或检查网络；加载失败会自动回退系统圆体。
- **头像不显示？** 检查 `import avatar from '...'` 路径和文件后缀是否一致。
- **随机图返回 500 提示配置变量？** 按第四节步骤 3 配置 `GITHUB_USER` / `GITHUB_REPO` 后重新部署。
