/**
 * 随机图片 API —— Cloudflare Pages Functions + GitHub 免费图床
 */

const IMG_RE = /\.(jpe?g|png|gif|webp|bmp|avif)$/i;

async function githubList(path, env) {
  const user = env.GITHUB_USER;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  const api = `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}&_v=2`;

  const cache = caches.default;
  const cached = await cache.match(api);
  if (cached) return cached.json();

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pages-random-image'
  };
  if (env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + env.GITHUB_TOKEN;

  const r = await fetch(api, { headers });
  if (!r.ok) {
    throw new Error(`GitHub 接口错误 ${r.status}`);
  }

  const data = await r.json();
  const copy = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120'
    }
  });
  cache.put(api, copy);
  return data;
}

function cdnUrl(env, category, filename) {
  const branch = env.GITHUB_BRANCH || 'main';
  return `https://cdn.jsdelivr.net/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@${branch}/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
}

async function imagesOf(category, env) {
  const files = await githubList(encodeURIComponent(category), env);
  return files.filter((f) => f.type === 'file' && IMG_RE.test(f.name));
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
  const { request, env, params } = context;
  const url = new URL(request.url);
  const wantJson = url.searchParams.get('json') === '1';

  if (!env.GITHUB_USER || !env.GITHUB_REPO) {
    return jsonResponse({ code: 500, msg: '请先配置 GITHUB_USER 和 GITHUB_REPO' }, 500);
  }

  const segments = params.path || [];
  const category = segments.length ? decodeURIComponent(segments[0]) : '';

  try {
    let pick;
    let usedCategory = category;

    if (category) {
      const images = await imagesOf(category, env);
      if (!images.length) {
        return jsonResponse({ code: 404, msg: `分类 "${category}" 不存在或没有图片` }, 404);
      }
      pick = images[Math.floor(Math.random() * images.length)];
    } else {
      const root = await githubList('', env);
      const dirs = root.filter((x) => x.type === 'dir').map((x) => x.name);
      const all = await Promise.all(dirs.map((d) => imagesOf(d, env).catch(() => [])));
      const pool = [];
      dirs.forEach((d, i) => {
        all[i].forEach((f) => pool.push({ category: d, file: f }));
      });
      if (!pool.length) {
        return jsonResponse({ code: 404, msg: '仓库里还没有任何分类图片。' }, 404);
      }
      const item = pool[Math.floor(Math.random() * pool.length)];
      pick = item.file;
      usedCategory = item.category;
    }

    const imgUrl = cdnUrl(env, usedCategory, pick.name);

    if (wantJson) {
      return jsonResponse({ code: 200, category: usedCategory, url: imgUrl });
    }
    return Response.redirect(imgUrl, 302);
  } catch (e) {
    return jsonResponse({ code: 500, msg: e.message }, 500);
  }
}