import { HtmlBasePlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import markdownItAnchor from "markdown-it-anchor";
import markdownItContainer from "markdown-it-container";
import markdownItMark from "markdown-it-mark";
import texmath from "markdown-it-texmath";
import katex from "katex";
import site from "./_data/site.js";
import crypto from "node:crypto";

const TZ = "Asia/Taipei";
const POSTS_GLOB = "posts/**/*.md";

// ---------- 小工具 ----------
const ymd = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date(date));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get("year"), m: get("month"), d: get("day") };
};

const stripHtml = (html = "") =>
  String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<annotation[\s\S]*?<\/annotation>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// 標題錨點：保留中文、日文，空白換成連字號
const slugifyHeading = (s) =>
  String(s).trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-_]/gu, "");

const tagSlug = (tag) =>
  String(tag).trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\/?#%\\]/g, "");

const livePosts = (api) =>
  api.getFilteredByGlob(POSTS_GLOB).filter((p) => !p.data.draft);

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "publicPosts", limit: 20 },
    metadata: {
      language: "zh-Hant-TW",
      title: site.title,
      subtitle: site.description,
      base: site.url + "/",
      author: { name: site.author },
    },
  });

  // ---------- Markdown ----------
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ linkify: true });
    md.use(markdownItAnchor, { level: [2, 3], slugify: slugifyHeading, tabIndex: false });
    md.use(markdownItMark);

    const callouts = [["tip", "小提醒"], ["note", "筆記"], ["warn", "注意"]];
    for (const [name, label] of callouts) {
      md.use(markdownItContainer, name, {
        render(tokens, idx) {
          const token = tokens[idx];
          if (token.nesting === 1) {
            const custom = token.info.trim().slice(name.length).trim();
            return `<aside class="callout callout-${name}"><p class="callout-title">${md.utils.escapeHtml(custom || label)}</p>\n`;
          }
          return "</aside>\n";
        },
      });
    }

    md.use(texmath, {
      engine: katex,
      delimiters: "dollars",
      katexOptions: { throwOnError: false, output: "html" },
    });
  });

  eleventyConfig.addGlobalData("buildYear", ymd(Date.now()).y);

  // ---------- 文章集合 ----------
  eleventyConfig.addCollection("posts", (api) => livePosts(api));
  eleventyConfig.addCollection("publicPosts", (api) => livePosts(api).filter((p) => !p.data.locked));

  eleventyConfig.addCollection("tagList", (api) => {
    const counts = new Map();
    for (const post of livePosts(api)) {
      for (const tag of post.data.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
      .map(([name, count]) => ({ name, count }));
  });

  // ---------- 篩選器 ----------
  eleventyConfig.addFilter("dateZh", (date) => {
    const { y, m, d } = ymd(date);
    return `${y} 年 ${m} 月 ${d} 日`;
  });
  eleventyConfig.addFilter("dateShort", (date) => {
    const { m, d } = ymd(date);
    return `${m} 月 ${d} 日`;
  });
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString());

  eleventyConfig.addFilter("groupByYear", (posts = []) => {
    const groups = [];
    for (const post of posts) {
      const { y } = ymd(post.date);
      let group = groups.find((g) => g.year === y);
      if (!group) groups.push((group = { year: y, posts: [] }));
      group.posts.push(post);
    }
    return groups;
  });

  eleventyConfig.addFilter("readingMinutes", (html) => {
    const text = stripHtml(html);
    const cjk = (text.match(/[぀-ヿ㐀-鿿豈-﫿]/g) || []).length;
    const words = text.replace(/[぀-ヿ㐀-鿿豈-﫿]/g, " ")
      .split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    return Math.max(1, Math.ceil(cjk / 400 + words / 200));
  });

  eleventyConfig.addFilter("excerpt", (post) => {
    if (post.data.description) return post.data.description;
    const first = String(post.content || "").match(/<p>([\s\S]*?)<\/p>/);
    const text = stripHtml(first ? first[1] : "");
    return text.length > 90 ? text.slice(0, 90) + "…" : text;
  });

  eleventyConfig.addFilter("excerptLong", (post) => {
    const text = stripHtml(String(post.content || "").replace(/<(pre|table|h[1-6])[\s\S]*?<\/\1>/gi, " "));
    const base = post.data.description ? post.data.description + " " : "";
    const all = (base + text).trim();
    return all.length > 130 ? all.slice(0, 130) + "…" : all;
  });

  eleventyConfig.addFilter("plainText", (html) => stripHtml(html).slice(0, 4000));

  eleventyConfig.addFilter("toc", (html) => {
    const items = [];
    const re = /<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
    let m;
    while ((m = re.exec(String(html)))) items.push({ level: Number(m[1]), id: m[2], text: stripHtml(m[3]) });
    return items;
  });

  // 計畫用：2026-09-28 → 2026/9/28；範圍 → 9/28–10/4
  const parseYmd = (s) => s.split("-").map(Number);
  eleventyConfig.addFilter("md", (s) => { const [y, m, d] = parseYmd(s); return `${m}/${d}`; });
  eleventyConfig.addFilter("ymd", (s) => { const [y, m, d] = parseYmd(s); return `${y}/${m}/${d}`; });
  eleventyConfig.addFilter("pct", (week, total = 49) => (((week - 1) / total) * 100).toFixed(2));
  eleventyConfig.addFilter("groupBy", (arr = [], key) => {
    const groups = [];
    for (const item of arr) {
      let g = groups.find((x) => x.key === item[key]);
      if (!g) groups.push((g = { key: item[key], items: [] }));
      g.items.push(item);
    }
    return groups;
  });
  eleventyConfig.addFilter("splitBy", (s = "", sep = ";") => String(s).split(sep).map((x) => x.trim()).filter(Boolean));

  eleventyConfig.addFilter("dateDot", (date) => {
    const { y, m, d } = ymd(date);
    return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
  });
  eleventyConfig.addFilter("head", (arr = [], n) => arr.slice(0, n));

  eleventyConfig.addFilter("withTag", (posts = [], tag) =>
    posts.filter((p) => (p.data.tags || []).includes(tag)));

  eleventyConfig.addFilter("hasMath", (html) => String(html).includes('class="katex'));
  eleventyConfig.addFilter("tagUrl", (tag) => `/tags/${tagSlug(tag)}/`);

  // ---------- 密碼保護 ----------
  // 有 locked 的頁面，主內容會在建置時用 AES-256-GCM 加密；密碼放在 GitHub Secret「SITE_PASSWORD」
  const PASSWORD = process.env.SITE_PASSWORD || "";
  const SALT = crypto.randomBytes(16);
  const ITER = 150000;
  const KEY = PASSWORD ? crypto.pbkdf2Sync(PASSWORD, SALT, ITER, 32, "sha256") : null;
  let warned = false;

  eleventyConfig.addTransform("lock", function (html) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) return html;
    const re = /<!--LOCK-START-->([\s\S]*?)<!--LOCK-END-->/;
    const m = html.match(re);
    if (!m) return html;
    if (!KEY) {
      if (process.env.CI) throw new Error("沒有設定 SITE_PASSWORD，受保護的頁面無法加密。請到 GitHub 的 Settings → Secrets and variables → Actions 新增。");
      if (!warned) { console.warn("[lock] 本機沒有設定 SITE_PASSWORD，受保護頁面以明文輸出（只在本機預覽）"); warned = true; }
      return html.replace(re, "$1");
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
    const ct = Buffer.concat([cipher.update(m[1], "utf8"), cipher.final(), cipher.getAuthTag()]);
    const box = `<div class="lockbox" data-lock data-salt="${SALT.toString("base64")}" data-iter="${ITER}" data-iv="${iv.toString("base64")}" data-ct="${ct.toString("base64")}">
  <svg class="lockbox-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
  <h1 class="lockbox-title">這裡需要密碼</h1>
  <p class="lockbox-text">輸入密碼後就能閱讀。同一台裝置輸入一次，其他受保護的頁面也會自動解鎖。</p>
  <form class="lockbox-form" data-lock-form>
    <label class="visually-hidden" for="lock-pw">密碼</label>
    <input id="lock-pw" type="password" autocomplete="current-password" placeholder="輸入密碼" required>
    <button type="submit">解鎖</button>
  </form>
  <p class="lockbox-error" data-lock-error aria-live="polite"></p>
  <noscript><p class="lockbox-error">解鎖需要開啟 JavaScript。</p></noscript>
</div>`;
    return html.replace(re, box);
  });

  // ---------- 靜態檔案 ----------
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({
    "node_modules/katex/dist/katex.min.css": "assets/katex/katex.min.css",
    "node_modules/katex/dist/fonts": "assets/katex/fonts",
  });

  eleventyConfig.setServerOptions({ showAllHosts: false });

  return {
    // 文章不經過模板引擎，程式碼裡的 {{ }} 才不會被吃掉
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" },
  };
}
