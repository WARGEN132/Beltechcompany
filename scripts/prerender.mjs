#!/usr/bin/env node
// scripts/prerender.mjs
//
// Запускается ПОСЛЕ:
//   1) vite build                                   (клиентская сборка -> dist/)
//   2) vite build --ssr src/entry-server.tsx --outDir dist-server
//
// Обходит все реальные URL сайта, рендерит каждый в HTML через собранный
// SSR-бандл и сохраняет как dist/<route>/index.html. Плюс генерирует
// dist/sitemap.xml и dist/spa.html (запасная страница для адресов, у которых
// нет готового HTML: /cart, товары без фото и т.п.).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// Единый домен сайта (punycode от белтехкомпания.бел), БЕЗ слеша на конце.
// Он же должен стоять в robots.txt, index.html, ProductPage.tsx и Search Console.
const SITE_ORIGIN = "https://xn--80abmaqkfkkhm5a4b1k.xn--90ais";
const SITE_NAME = "БелТехКомпания";
const OG_IMAGE = `${SITE_ORIGIN}/beltech-favicon.png`;
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const templateHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");

// На Windows import() требует file:// URL, а не путь вида F:\...
const { render, getAllRoutes } = await import(
  pathToFileURL(path.join(ROOT, "dist-server", "entry-server.js")).href
);

// Теги, которые каждая страница получает заново. Убираем их из шаблона
// перед вставкой, чтобы не было дублей title/OG/canonical.
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

// Уникальные title/description для страниц, у которых нет своего <Helmet>.
// Если страница задаёт свой Helmet (товары, каталог) — берётся он.
const PAGE_META = {
  "/": {
    title: "ООО «БелТехКомпания» — Электромонтаж, Отопление, Спецтехника в Ивацевичах",
    description:
      "ООО «БелТехКомпания» в г. Ивацевичи: сертифицированный электромонтаж любой сложности, монтаж систем отопления и водоснабжения, аренда мини-экскаватора, а также фирменный магазин электротоваров «Электрика».",
  },
  "/services": {
    title: "Услуги: электромонтаж, отопление, аренда мини-экскаватора в Ивацевичах | БелТехКомпания",
    description:
      "Электромонтажные работы, монтаж систем отопления и теплого пола, водоснабжение, аренда мини-экскаватора в Ивацевичах и районе. Работаем по договору, смета в день обращения.",
  },
  "/catalog": {
    title: "Каталог электротоваров и материалов для отопления в Ивацевичах | БелТехКомпания",
    description:
      "Каталог электротоваров и материалов для отопления и водоснабжения в Ивацевичах: кабель, электрокотлы, теплый пол и другое. Доставка по Беларуси, включая Брестскую и Гродненскую области.",
  },
  "/about": {
    title: "О компании — ООО «БелТехКомпания», Ивацевичи",
    description:
      "ООО «БелТехКомпания» из Ивацевичей: электромонтаж, системы отопления и водоснабжения, аренда спецтехники и магазин электротоваров «Электрика».",
  },
  "/contacts": {
    title: "Контакты — БелТехКомпания, г. Ивацевичи, ул. Свердлова, 5",
    description:
      "Контакты ООО «БелТехКомпания»: г. Ивацевичи, ул. Свердлова, 5. Телефон +375 29 824-63-77. Пн–Пт 8:00–18:00, сб 9:00–15:00.",
  },
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Канонический адрес страницы. Для папок Apache делает редирект на адрес
// со слешем, поэтому canonical и sitemap тоже пишем со слешем.
function urlFor(route) {
  return route === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}/`;
}

function defaultTags(meta, url) {
  return `
    <title>${esc(meta.title)}</title>
    <meta name="title" content="${esc(meta.title)}" />
    <meta name="description" content="${esc(meta.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(meta.title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(meta.title)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <link rel="canonical" href="${url}" />
  `;
}

function buildHead(baseHeadStripped, helmet, route) {
  const url = urlFor(route);
  const fallback = PAGE_META[route] || PAGE_META["/"];

  const title = helmet?.title ? helmet.title.toString() : "";
  const meta = helmet?.meta ? helmet.meta.toString() : "";
  const link = helmet?.link ? helmet.link.toString() : "";
  const script = helmet?.script ? helmet.script.toString() : "";

  const pageDeclaredSomething = title.includes("<title") || meta.length > 0;
  if (!pageDeclaredSomething) {
    return baseHeadStripped + defaultTags(fallback, url);
  }

  // canonical и og:url всегда считаем сами из адреса страницы — так они
  // гарантированно совпадают с реальным URL и друг с другом.
  const cleanMeta = meta.replace(/<meta[^>]*property="og:url"[^>]*>/g, "");
  const cleanLink = link.replace(/<link[^>]*rel="canonical"[^>]*>/g, "");

  // Если страница задала title, но забыла description — подставим запасной.
  const descriptionFallback = /name="description"/.test(cleanMeta)
    ? ""
    : `<meta name="description" content="${esc(fallback.description)}" />`;

  return [
    baseHeadStripped,
    title,
    cleanMeta,
    descriptionFallback,
    cleanLink,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    script,
  ].join("\n") + "\n";
}

function routeToOutPath(route) {
  if (route === "/") return path.join(DIST, "index.html");
  return path.join(DIST, route.replace(/^\//, ""), "index.html");
}

const headMatch = templateHtml.match(/<head>([\s\S]*?)<\/head>/);
if (!headMatch) throw new Error("Не найден <head> в dist/index.html — прервано.");
const strippedHead = stripDynamicHeadTags(headMatch[1]);

// Запасная страница для адресов без готового HTML (см. .htaccess).
fs.writeFileSync(path.join(DIST, "spa.html"), templateHtml, "utf-8");

const routes = getAllRoutes();
console.log(`Пререндер: ${routes.length} страниц...`);

const sitemapEntries = [];
let failed = 0;

for (const route of routes) {
  try {
    const { html, helmet } = render(route);
    const newHead = buildHead(strippedHead, helmet, route);

    // Функции вместо строк в replace(): в строке-замене символы вида "$&" и "$1"
    // трактуются как спецшаблоны и могут испортить HTML.
    let page = templateHtml.replace(/<head>[\s\S]*?<\/head>/, () => `<head>${newHead}</head>`);
    page = page.replace(
      /(<div id="root"[^>]*>)(<\/div>)/,
      (_m, open, close) => `${open}${html}${close}`
    );

    const outPath = routeToOutPath(route);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, page, "utf-8");

    sitemapEntries.push(
      `  <url><loc>${urlFor(route)}</loc><lastmod>${BUILD_DATE}</lastmod></url>`
    );
  } catch (err) {
    failed++;
    console.error(`✗ Ошибка на роуте ${route}:`, err.message);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join(
  "\n"
)}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf-8");

console.log(`Готово: ${routes.length - failed}/${routes.length} страниц + sitemap.xml + spa.html`);
if (failed > 0) {
  console.error(`${failed} страниц не удалось отрендерить — см. ошибки выше.`);
  process.exit(1);
}
