#!/usr/bin/env node
// scripts/prerender.mjs
//
// Запускается ПОСЛЕ:
//   1) vite build                                   (клиентская сборка -> dist/)
//   2) vite build --ssr src/entry-server.tsx --outDir dist-server
//
// Обходит все реальные URL сайта, рендерит каждый в HTML через собранный
// SSR-бандл (без браузера — просто вызов функции) и сохраняет как
// dist/<route>/index.html. Плюс генерирует dist/sitemap.xml.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SITE_ORIGIN = "https://beltechcompany.by";

const templateHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");

const { render, getAllRoutes } = await import(
  path.join(ROOT, "dist-server", "entry-server.js")
);

// Теги, которые каждая страница получает заново (либо из своего Helmet,
// либо — если страница его не задаёт — дефолтные, как раньше в index.html).
// Убираем их из шаблона перед вставкой, чтобы не было дублей title/OG.
const STRIP_TAG_RES = [
  /<title>[\s\S]*?<\/title>/,
  /<meta\s+name="title"[^>]*>/,
  /<meta\s+name="description"[^>]*>/,
  /<meta\s+property="og:[^"]*"[^>]*>/g,
  /<meta\s+name="twitter:[^"]*"[^>]*>/g,
  /<meta\s+property="twitter:[^"]*"[^>]*>/g,
  /<link\s+rel="canonical"[^>]*>/,
];

function stripDynamicHeadTags(head) {
  let result = head;
  for (const re of STRIP_TAG_RES) result = result.replace(re, "");
  return result;
}

// Дефолтные теги сайта — те же значения, что раньше жили статично в
// index.html. Используются для страниц, которые не задают свой <Helmet>
// (главная, "О нас", "Контакты" и т.п. — пока вы не добавите им свой).
const DEFAULT_HEAD_EXTRA = `
    <title>БелТехКомпания</title>
    <meta name="title" content="ООО «БелТехКомпания» — Электромонтаж, Отопление, Спецтехника в Ивацевичах" />
    <meta name="description" content="ООО «БелТехКомпания» в г. Ивацевичи: сертифицированный электромонтаж любой сложности, проектирование и монтаж систем отопления и водоснабжения, аренда мини-экскаватора, а также фирменный магазин электротоваров «Электрика»." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_ORIGIN}/" />
    <meta property="og:title" content="ООО «БелТехКомпания» | Электромонтаж, Отопление и Спецтехника" />
    <meta property="og:description" content="Сертифицированный электромонтаж, системы отопления и теплых полов, аренда спецтехники в Ивацевичах и районе. Быстро, качественно, по договору." />
    <meta property="og:image" content="/src/assets/images/clean_electrical_after_1784549219964.jpg" />
    <meta property="og:site_name" content="БелТехКомпания" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="ООО «БелТехКомпания» | Электромонтаж, Отопление и Спецтехника" />
    <meta property="twitter:description" content="Профессиональные услуги и качественные материалы в Ивацевичах. Монтаж под ключ, бесплатная смета в день обращения." />
    <meta property="twitter:image" content="/src/assets/images/clean_electrical_after_1784549219964.jpg" />
    <link rel="canonical" href="${SITE_ORIGIN}/" />
`;

function buildHead(baseHeadStripped, helmet, routeUrl) {
  if (!helmet) return baseHeadStripped + DEFAULT_HEAD_EXTRA;

  const title = helmet.title ? helmet.title.toString() : "";
  const meta = helmet.meta ? helmet.meta.toString() : "";
  const link = helmet.link ? helmet.link.toString() : "";
  const script = helmet.script ? helmet.script.toString() : "";

  const pageDeclaredSomething = title.includes("<title") || meta.length > 0;
  if (!pageDeclaredSomething) return baseHeadStripped + DEFAULT_HEAD_EXTRA;

  const canonicalFallback = link.includes('rel="canonical"')
    ? ""
    : `<link rel="canonical" href="${SITE_ORIGIN}${routeUrl}" />`;

  return `${baseHeadStripped}\n${title}\n${meta}\n${link}\n${canonicalFallback}\n${script}\n`;
}

function routeToOutPath(route) {
  if (route === "/") return path.join(DIST, "index.html");
  return path.join(DIST, route.replace(/^\//, ""), "index.html");
}

const headMatch = templateHtml.match(/<head>([\s\S]*?)<\/head>/);
if (!headMatch) throw new Error("Не найден <head> в dist/index.html — прервано.");
const strippedHead = stripDynamicHeadTags(headMatch[1]);

const routes = getAllRoutes();
console.log(`Пререндер: ${routes.length} страниц...`);

const sitemapEntries = [];
let failed = 0;

for (const route of routes) {
  try {
    const { html, helmet } = render(route);
    const newHead = buildHead(strippedHead, helmet, route);

    let page = templateHtml.replace(/<head>[\s\S]*?<\/head>/, `<head>${newHead}</head>`);
    page = page.replace(
      /(<div id="root"[^>]*>)(<\/div>)/,
      (_m, open, close) => `${open}${html}${close}`
    );

    const outPath = routeToOutPath(route);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, page, "utf-8");

    sitemapEntries.push(`  <url><loc>${SITE_ORIGIN}${route}</loc></url>`);
  } catch (err) {
    failed++;
    console.error(`✗ Ошибка на роуте ${route}:`, err.message);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join(
  "\n"
)}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf-8");

console.log(`Готово: ${routes.length - failed}/${routes.length} страниц + sitemap.xml`);
if (failed > 0) {
  console.error(`${failed} страниц не удалось отрендерить — см. ошибки выше.`);
  process.exit(1);
}
