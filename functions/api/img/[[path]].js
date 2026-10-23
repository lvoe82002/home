/**
 * 随机图片 API —— Cloudflare Pages Functions + GitHub 免费图床
 *   /api/img            随机一张
 *   /api/img/<分类>      指定分类随机
 *   ?json=1             返回 JSON
 *   ?list=1             返回分类列表或某分类的全部图片清单（供图库页用）
 */

const IMG_RE = /\.(jpe?g|png|gif|webp|bmp|avif)$/i;

async function githubList(path, env) {
  const user = env.GITHUB_USER;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  const api = `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}&_v=3`;

  const cache = caches.default;
  const cached = await cache.match(api);
  if (cached) return cached.json();

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pages-random-image'
  };
  if (env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + env.GITHUB_TOKEN;

  const r = await fetch(api, { headers });
  if (!r.ok) throw new Error(`GitHub 接口错误 ${r.status}`);

  const data = await r.json();
  const copy = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' }
  });
  cache.put(api, copy);
  return data;
}

function cdnUrl(env, category, filename) {
  const branch = env.GITHUB_BRANCH || 'main';
  return `https://gcore.jsdelivr.net/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@${branch}/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  });
}

export async function onRequest(context) {
  const { env, params } = context;
  const url = new URL(context.request.url);
  const wantJson = url.searchParams.get('json') === '1';
  const wantList = url.searchParams.get('list') === '1';

  if (!env.GITHUB_USER || !env.GITHUB_REPO) {
    return jsonResponse({ code: 500, msg: '请先配置 GITHUB_USER 和 GITHUB_REPO' }, 500);
  }

  const segments = params.path || [];
  const category = segments.length ? decodeURIComponent(segments[0]) : '';

  try {
    // 清单模式：返回分类列表
    if (wantList && !category) {
      const root = await githubList('', env);
      const dirs = root.filter((x) => x.type === 'dir');
      const cats = await Promise.all(
        dirs.map(async (d) => {
          const files = await githubList(encodeURIComponent(d.name), env).catch(() => []);
          const imgs = files.filter((f) => f.type === 'file' && IMG_RE.test(f.name));
          return { name: d.name, count: imgs.length };
        })
      );
      return jsonResponse({ code: 200, categories: cats.filter((c) => c.count > 0) });
    }

    // 清单模式：返回某分类全部图片
    if (wantList && category) {
      const files = await githubList(encodeURIComponent(category), env);
      const imgs = files.filter((f) => f.type === 'file' && IMG_RE.test(f.name));
      return jsonResponse({
        code: 200,
        category,
        images: imgs.map((f) => ({ name: f.name, url: cdnUrl(env, category, f.name) }))
      });
    }

    // 随机模式
    if (category) {
      const files = await githubList(encodeURIComponent(category), env);
      const images = files.filter((f) => f.type === 'file' && IMG_RE.test(f.name));
      if (!images.length) {
        return jsonResponse({ code: 404, msg: `分类 "${category}" 不存在或没有图片` }, 404);
      }
      const pick = images[Math.floor(Math.random() * images.length)];
      const imgUrl = cdnUrl(env, category, pick.name);
      if (wantJson) return jsonResponse({ code: 200, category, url: imgUrl });
      return Response.redirect(imgUrl, 302);
    }

    // 不带分类：从所有分类汇总随机
    const root = await githubList('', env);
    const dirs = root.filter((x) => x.type === 'dir').map((x) => x.name);
    const all = await Promise.all(dirs.map((d) => githubList(encodeURIComponent(d), env).catch(() => [])));
    const pool = [];
    dirs.forEach((d, i) => {
      all[i].filter((f) => f.type === 'file' && IMG_RE.test(f.name))
        .forEach((f) => pool.push({ category: d, file: f }));
    });
    if (!pool.length) return jsonResponse({ code: 404, msg: '仓库里还没有任何分类图片。' }, 404);
    const item = pool[Math.floor(Math.random() * pool.length)];
    const imgUrl = cdnUrl(env, item.category, item.file.name);
    if (wantJson) return jsonResponse({ code: 200, category: item.category, url: imgUrl });
    return Response.redirect(imgUrl, 302);
  } catch (e) {
    return jsonResponse({ code: 500, msg: e.message }, 500);
  }
}
