/**
 * 随机图片 API —— Cloudflare Pages Functions + GitHub 免费图床
 * ------------------------------------------------------------
 * 路由（文件位置决定路由）：
 *   functions/api/img/[[path]].js
 *     → /api/img            ：从所有分类里随机一张
 *     → /api/img/<分类>      ：从指定分类随机一张
 *     → 加 ?json=1           ：返回 JSON 而不是 302 跳转
 *
 * 你只需要：
 *   1. GitHub 建一个【公开】仓库，按分类建文件夹传图，例如：
 *        img-warehouse/acg/1.jpg
 *        img-warehouse/acg/2.webp
 *        img-warehouse/moe/a.gif
 *   2. 在 Cloudflare Pages 项目 → Settings → Variables and Secrets 里配置：
 *        GITHUB_USER = 你的用户名
 *        GITHUB_REPO = 仓库名
 *        GITHUB_BRANCH = main（可选，默认 main）
 *        GITHUB_TOKEN = 只读令牌（可选，配置后更稳，限额 60→5000/小时）
 *   3. 重新部署即可。以后加图只需往 GitHub 传，无需改代码。
 *
 * 说明：图片通过 jsDelivr CDN 直链返回，流量不经过 Functions，零成本。
 */

const IMG_RE = /\.(jpe?g|png|gif|webp|bmp|avif)$/i

/** 调用 GitHub API 列目录（带 1 小时缓存，规避未认证限流） */
async function githubList(path, env, ctx) {
  const user = env.GITHUB_USER
  const repo = env.GITHUB_REPO
  const branch = env.GITHUB_BRANCH || 'main'
  const api = `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}`

  const cache = caches.default
  const cached = await cache.match(api)
  if (cached) return cached.json()

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pages-random-image'
  }
  if (env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + env.GITHUB_TOKEN

  const r = await fetch(api, { headers })
  if (!r.ok) {
    throw new Error(
      `GitHub 接口错误 ${r.status}（仓库不存在 / 用户名填错 / 临时限流）`
    )
  }

  const data = await r.json()
  const copy = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  })
  // 缓存写入不阻塞返回（Pages 用 ctx.waitUntil）
  ctx.waitUntil(cache.put(api, copy))
  return data
}

/** 拼 jsDelivr CDN 直链 */
function cdnUrl(env, category, filename) {
  const branch = env.GITHUB_BRANCH || 'main'
  return (
    `https://cdn.jsdelivr.net/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@${branch}/` +
    `${encodeURIComponent(category)}/${encodeURIComponent(filename)}`
  )
}

/** 取某个分类下的全部图片文件 */
async function imagesOf(category, env, ctx) {
  const files = await githubList(encodeURIComponent(category), env, ctx)
  return files.filter((f) => f.type === 'file' && IMG_RE.test(f.name))
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  })
}

// Pages Functions 入口：context = { request, env, params, waitUntil, ... }
export async function onRequest(context) {
  const { request, env, ctx, params } = context
  const url = new URL(request.url)
  const wantJson = url.searchParams.get('json') === '1'

  // 没配置用户名/仓库时给出明确提示，而不是 500
  if (!env.GITHUB_USER || !env.GITHUB_REPO) {
    return jsonResponse(
      {
        code: 500,
        msg: '请先在 Pages 后台配置环境变量 GITHUB_USER 和 GITHUB_REPO，详见本文件顶部注释。'
      },
      500
    )
  }

  // params.path 是 catch-all 段数组，例如 ['acg']；不带分类时为 undefined
  const segments = params.path || []
  const category = segments.length ? decodeURIComponent(segments[0]) : ''

  try {
    let pick
    let usedCategory = category

    if (category) {
      // 指定分类
      const images = await imagesOf(category, env, ctx)
      if (!images.length) {
        return jsonResponse(
          { code: 404, msg: `分类 "${category}" 不存在或里面没有图片` },
          404
        )
      }
      pick = images[Math.floor(Math.random() * images.length)]
    } else {
      // 不带分类：遍历所有分类文件夹，汇总后随机
      const root = await githubList('', env, ctx)
      const dirs = root.filter((x) => x.type === 'dir').map((x) => x.name)
      const all = await Promise.all(
        dirs.map((d) => imagesOf(d, env, ctx).catch(() => []))
      )
      const pool = []
      dirs.forEach((d, i) => {
        all[i].forEach((f) => pool.push({ category: d, file: f }))
      })
      if (!pool.length) {
        return jsonResponse(
          { code: 404, msg: '仓库里还没有任何分类图片。' },
          404
        )
      }
      const item = pool[Math.floor(Math.random() * pool.length)]
      pick = item.file
      usedCategory = item.category
    }

    const imgUrl = cdnUrl(env, usedCategory, pick.name)

    if (wantJson) {
      return jsonResponse({ code: 200, category: usedCategory, url: imgUrl })
    }
    return Response.redirect(imgUrl, 302)
  } catch (e) {
    return jsonResponse({ code: 500, msg: e.message }, 500)
  }
}
