// src/entry-server.tsx
//
// Серверный (build-time) вход для пререндера. НЕ используется в браузере —
// собирается отдельно через `vite build --ssr` и вызывается из
// scripts/prerender.mjs. Рендерит AppShell в HTML-строку для конкретного
// URL + собирает мета-теги через react-helmet-async, чтобы каждая страница
// каталога получила свой <title>/description/canonical/JSON-LD ещё ДО
// выполнения JS — это ровно то, что видят Яндекс и другие боты, которые
// не исполняют JavaScript (или исполняют ненадёжно).

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AppShell } from "./App";
import { ALL_SUBCATEGORIES, PRICE_ITEMS, getSlugForSubcategoryId } from "./data";

export function render(url: string) {
  // react-helmet-async синхронно кладёт собранные теги в этот объект
  // прямо во время renderToString — берём их сразу после вызова.
  const helmetContext: { helmet?: any } = {};

  const html = renderToString(
    <StaticRouter location={url}>
      <HelmetProvider context={helmetContext}>
        <AppShell />
      </HelmetProvider>
    </StaticRouter>
  );

  return { html, helmet: helmetContext.helmet };
}

/**
 * Полный список URL сайта, которые нужно превратить в статичный HTML.
 * Строится из тех же данных (data.ts), что и клиентский роутинг в App.tsx —
 * поэтому никогда не разъедется с реальными ссылками на сайте.
 */
export function getAllRoutes(): string[] {
  const routes = new Set<string>();

  routes.add("/");
  routes.add("/services");
  routes.add("/catalog");
  routes.add("/about");
  routes.add("/contacts");
  // /cart сознательно НЕ пререндерим — это персональная страница (корзина
  // конкретного посетителя), SEO-смысла не несёт. Закрыть в robots.txt.

  ALL_SUBCATEGORIES.forEach((sub: any) => {
    if (sub?.slug) routes.add(`/catalog/${sub.slug}`);
  });

  PRICE_ITEMS.forEach((item: any) => {
    // Товары без собственного реального фото (общая заглушка на десятки
    // позиций) сознательно НЕ пререндерим и не кладём в sitemap — иначе
    // получится куча почти одинаковых по контенту страниц с одной и той
    // же картинкой, а это риск "тонкого"/дублирующегося контента для SEO.
    // Страница у такого товара всё равно работает — просто через обычный
    // SPA-рендер в браузере, без отдельного статичного HTML под неё.
    if (!item.hasRealImage) return;

    const subSlug = getSlugForSubcategoryId(item.subcategoryId);
    if (subSlug && item.slug) {
      routes.add(`/catalog/${subSlug}/${item.slug}`);
    }
  });

  return Array.from(routes);
}