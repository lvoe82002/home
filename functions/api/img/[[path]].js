/**
 * 随机图片 API —— Cloudflare Pages Functions + GitHub 免费图床
 *   /api/img            随机一张（全部分类汇总）
 *   /api/img/<分类>      指定分类随机
 *   ?json=1             返回 JSON
 *   ?list=1             返回分类列表或某分类的全部图片清单（供图库页用）
 *
 * 具体逻辑放在 src/server/img.js，根路径短链 functions/[category].js 复用同一份。
 */
import { handleImgApi } from '../../../src/server/img.js'

export const onRequest = handleImgApi
