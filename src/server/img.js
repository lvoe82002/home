/**
 * 随机图片 API —— 共享逻辑（Cloudflare Pages Functions）
 *
 * 对外路由：
 *   /api/img            随机一张（全部分类汇总）
 *   /api/img/<分类>      指定分类随机
 *   /<分类>              根路径短链（functions/[category].js 调用）
 *   ?json=1             返回 JSON
 *   ?list=1             返回分类清单 / 某分类全部图片
 *
 * 图片清单优先走 jsDelivr 的 data API（一次请求拿到全仓库文件列表，
 * 无 GitHub 每小时 60 次限额）；失败时回退到 GitHub Contents API。
 */

const IMG_RE = /\.(jpe?g|png|gif|webp|bmp|avif)$/i

function cdnUrl(env, category, filename) {
  const branch = env.GITHUB_BRANCH || 'main'
  return `https://gcore.jsdelivr.net/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@${branch}/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`
}

/** 带超时的 fetch，避免某个上游卡死时整个请求挂住几十秒 */
async function fetchWithTimeout(url, options, ms) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** 任意 Promise 加超时；超时后原 Promise 若再失败也不产生未处理异常 */
function withTimeout(promise, ms, label) {
  let timer
  const racer = Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label || 'timeout')), ms)
    })
  ])
  promise.then(
    () => clearTimeout(timer),
    () => clearTimeout(timer)
  )
  return racer
}

function githubHeaders(env) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pages-random-image'
  }
  if (env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + env.GITHUB_TOKEN
  return headers
}

/** 只查单个分类（GitHub Contents API，根路径短链的快路） */
async function listCategoryGithub(env, category) {
  const branch = env.GITHUB_BRANCH || 'main'
  const cacheKey = `https://img-warehouse.local/cat/${env.GITHUB_USER}/${env.GITHUB_REPO}/${branch}/${encodeURIComponent(category)}`
  const cache = caches.default
  const cached = await cache.match(cacheKey)
  if (cached) return cached.json()

  const api = `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${encodeURIComponent(category)}?ref=${branch}`
  const r = await fetchWithTimeout(api, { headers: githubHeaders(env) }, 8000)
  if (!r.ok) throw new Error(`GitHub 接口错误 ${r.status}`)
  const data = await r.json()
  const files = data.filter((f) => f.type === 'file' && IMG_RE.test(f.name)).map((f) => f.name)

  const copy = new Response(JSON.stringify(files), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' }
  })
  try { cache.put(cacheKey, copy.clone()) } catch (e) {}
  return files
}

export function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  })
}

/**
 * 汇总整个图床：返回 { categories: [{name,count}], pool: Map<分类, 文件名[]> }
 * 结果在边缘缓存 10 分钟。
 */
async function loadWarehouse(env) {
  const cacheKey = `https://img-warehouse.local/list/${env.GITHUB_USER}/${env.GITHUB_REPO}/${env.GITHUB_BRANCH || 'main'}`
  const cache = caches.default
  const cached = await cache.match(cacheKey)
  if (cached) return cached.json()

  const pool = new Map()
  const addFile = (path) => {
    if (!path || !IMG_RE.test(path)) return
    const clean = path.replace(/^\/+/, '')
    const slash = clean.indexOf('/')
    if (slash <= 0) return
    const category = clean.slice(0, slash)
    const file = clean.slice(slash + 1)
    if (file.includes('/')) return // 只要分类根目录下的图，不递归子目录
    if (!pool.has(category)) pool.set(category, [])
    pool.get(category).push(file)
  }

  // ① 首选：jsDelivr 一次性扁平清单（无限额、通常 1 次请求）
  try {
    const branch = env.GITHUB_BRANCH || 'main'
    const api = `https://data.jsdelivr.com/v1/packages/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@${branch}?structure=flat`
    const r = await fetchWithTimeout(api, { headers: { 'User-Agent': 'pages-random-image' } }, 8000)
    if (r.ok) {
      const data = await r.json()
      for (const item of data.files || []) {
        if (item.type && item.type !== 'file') continue
        addFile(item.name)
      }
    } else {
      throw new Error('jsDelivr 清单接口错误 ' + r.status)
    }
  } catch (e) {
    // ② 兜底：GitHub Contents API（分类目录逐层拉取，单层 10s 超时）
    const listDir = async (path) => {
      const branch = env.GITHUB_BRANCH || 'main'
      const api = `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${path}?ref=${branch}`
      const r = await fetchWithTimeout(api, { headers: githubHeaders(env) }, 10000)
      if (!r.ok) throw new Error(`GitHub 接口错误 ${r.status}`)
      return r.json()
    }

    const root = await listDir('')
    const dirs = root.filter((x) => x.type === 'dir').map((x) => x.name)
    for (const d of dirs) {
      const files = await listDir(encodeURIComponent(d)).catch(() => [])
      files.filter((f) => f.type === 'file' && IMG_RE.test(f.name)).forEach((f) => addFile(`/${d}/${f.name}`))
    }
  }

  const categories = [...pool.keys()].sort().map((name) => ({ name, count: pool.get(name).length }))
  const result = { categories, pool: Object.fromEntries(pool) }

  // 写入边缘缓存（非阻塞，失败不影响本次请求）
  const copy = new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' }
  })
  try { cache.put(cacheKey, copy.clone()) } catch (e) {}
  return result
}

/**
 * 指定分类随机一张，返回 CDN 直链；分类不存在返回 null。
 * 优先走汇总清单（命中边缘缓存时最快）；汇总清单一时拉不动，
 * 退化为只查这一个分类的 GitHub 目录，避免根路径短链长时间卡死。
 */
export async function randomOne(env, category) {
  let files = null
  try {
    const warehouse = await withTimeout(loadWarehouse(env), 5000, 'warehouse-timeout')
    files = warehouse.pool[category] || []
  } catch (e) {
    files = await listCategoryGithub(env, category).catch(() => null)
  }
  if (!files || !files.length) return null
  return cdnUrl(env, category, files[Math.floor(Math.random() * files.length)])
}

/** /api/img 全部分支的处理 */
export async function handleImgApi(context) {
  const { env, params } = context
  const url = new URL(context.request.url)
  const wantJson = url.searchParams.get('json') === '1'
  const wantList = url.searchParams.get('list') === '1'

  if (!env.GITHUB_USER || !env.GITHUB_REPO) {
    return jsonResponse({ code: 500, msg: '请先配置 GITHUB_USER 和 GITHUB_REPO' }, 500)
  }

  const segments = params.path || []
  const category = segments.length ? decodeURIComponent(segments[0]) : ''

  try {
    const warehouse = await loadWarehouse(env)

    // 清单：全部分类
    if (wantList && !category) {
      return jsonResponse({ code: 200, categories: warehouse.categories })
    }

    // 清单：某分类全部图片
    if (wantList && category) {
      const files = warehouse.pool[category] || []
      if (!files.length) return jsonResponse({ code: 404, msg: `分类 "${category}" 不存在或没有图片` }, 404)
      return jsonResponse({
        code: 200,
        category,
        images: files.map((name) => ({ name, url: cdnUrl(env, category, name) }))
      })
    }

    // 随机：指定分类
    if (category) {
      const imgUrl = await randomOne(env, category)
      if (!imgUrl) return jsonResponse({ code: 404, msg: `分类 "${category}" 不存在或没有图片` }, 404)
      if (wantJson) return jsonResponse({ code: 200, category, url: imgUrl })
      return Response.redirect(imgUrl, 302)
    }

    // 随机：全部分类汇总
    const all = warehouse.categories.flatMap((c) =>
      warehouse.pool[c.name].map((file) => ({ category: c.name, file }))
    )
    if (!all.length) return jsonResponse({ code: 404, msg: '仓库里还没有任何分类图片。' }, 404)
    const item = all[Math.floor(Math.random() * all.length)]
    const imgUrl = cdnUrl(env, item.category, item.file)
    if (wantJson) return jsonResponse({ code: 200, category: item.category, url: imgUrl })
    return Response.redirect(imgUrl, 302)
  } catch (e) {
    return jsonResponse({ code: 500, msg: e.message }, 500)
  }
}
