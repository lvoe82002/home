/**
 * 根路径短链：/acg 这样的单段地址直接 302 到一张随机图片，
 * 与 /api/img/<分类> 等价，方便直接丢进浏览器、Markdown 或 <img src>。
 *
 * 注意：Pages Functions 会优先匹配这里，_redirects 对被函数命中的请求不再生效，
 * 所以所有“非图片分类”的请求（/home、/img-api、/docs、未知路径、静态文件）
 * 必须手动交给 ASSETS（静态资源服务 + SPA 回退到 index.html），
 * 否则前端路由会全部 404。
 */
import { randomOne, jsonResponse } from '../src/server/img.js'

// 前端路由保留字：命中后直接走静态资源 / SPA
const RESERVED = new Set(['home', 'img-api', 'docs', 'favicon.ico', 'robots.txt', 'sitemap.xml'])

export async function onRequest(context) {
  const { env, params, request } = context
  const url = new URL(request.url)
  const category = params.category

  const fallback = () =>
    env.ASSETS ? env.ASSETS.fetch(request) : context.next()

  // 未配置图床 / 保留路由 / 带扩展名的文件请求 —— 全部交给静态资源
  if (
    !category ||
    RESERVED.has(category) ||
    category.includes('.') ||
    !env.GITHUB_USER ||
    !env.GITHUB_REPO
  ) {
    return fallback()
  }

  try {
    const imgUrl = await randomOne(env, category)
    if (!imgUrl) return fallback() // 不是图床分类 → 交给前端路由（会显示 404 页）
    if (url.searchParams.get('json') === '1') {
      return jsonResponse({ code: 200, category, url: imgUrl })
    }
    return Response.redirect(imgUrl, 302)
  } catch (e) {
    return fallback() // 图床接口异常时不要拖垮正常页面
  }
}
