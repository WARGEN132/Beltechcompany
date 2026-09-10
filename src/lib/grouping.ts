import { PriceItem } from "../types";

// ---------------------------------------------------------------------------
// Общая логика группировки похожих товаров (используется и в Catalog.tsx —
// список/сетка каталога, и в ProductPage.tsx — блок "похожие варианты").
// ВАЖНО: это единственное место, где живёт stripToBaseName. Если скопировать
// эту функцию в оба файла отдельно, они рано или поздно разойдутся при правке
// одного без другого, и товары на странице каталога будут группироваться
// иначе, чем на странице товара — этого не должно случиться.
// ---------------------------------------------------------------------------

export interface ItemGroup {
  baseName: string;
  items: PriceItem[];
}

const BND_BEFORE = "(?<![A-Za-zА-Яа-яЁё0-9])";
const BND_AFTER = "(?![A-Za-zА-Яа-яЁё0-9])";
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Бренды/производители, собранные из реального каталога — режем их ГДЕ УГОДНО
// в строке (не только в конце), т.к. для расходников/крепежа и т.п. бренд
// часто не важен покупателю, и это специально решение — группировать шире,
// принимая единичные неточные объединения ради масштаба (3000+ товаров).
const KNOWN_BRANDS = [
  "TDM", "IEK", "REXANT", "Jazzway", "legrand", "KRANZ", "SHCET", "PROxima", "STARFIX",
  "CHINT", "General", "GENERICA", "OSRAM", "BYLECTRICA", "SIMPLE", "PROconnect",
  "ECOLINE", "ЗЭТАРУС", "ЭРА", "ZETKAMA", "UNIDELTA", "РВК", "Дрогол",
  "БЭЗ", "ЗУБР", "IWELD", "OLIVER", "ГАРАНТ", "Континент", "СЗСМ",
  "VERTO", "KRAFTOOL", "PATRIOT", "BOSCH", "URAGAN", "Remocolor", "Navigator",
];
const KNOWN_COUNTRIES = [
  "Россия", "РОССИЯ", "РФ", "Китай", "КИТАЙ", "Беларусь", "БЕЛАРУСЬ", "РБ",
  "Турция", "Украина", "Франция", "Польша", "ПОЛЬША", "Италия", "Германия",
  "Чехия", "Индия", "США", "Корея", "Тайвань", "Испания", "Латвия", "Литва", "Узбекистан",
];
const BRAND_ALT = KNOWN_BRANDS.map(escapeRegExp).join("|");
const COUNTRY_ALT = KNOWN_COUNTRIES.map(escapeRegExp).join("|");

// Убирает из названия бренд/страну/скобки/любые "числовые" куски (размер, вес,
// артикул, номер модели) — то, что остаётся, обрезается до первых двух
// значимых слов. Это НАМЕРЕННО грубый инструмент: цель — минимизировать число
// карточек-дублей для крупного каталога (3000+ позиций), а не идеальная
// точность группировки. Полное название каждого товара всегда остаётся
// видно в списке вариантов на странице товара, так что даже неточная
// группировка не прячет от покупателя, что именно он выбирает — просто иногда
// в одной группе окажется на 1-2 "соседа" больше, чем формально стоило бы.
export function stripToBaseName(name: string, attrs?: PriceItem["attributes"]): string {
  let s = name;
  if (attrs) {
    (["power", "voltage", "base", "color_temp", "current", "diameter", "material", "country"] as const).forEach((key) => {
      const val = (attrs as any)[key];
      if (!val) return;
      const pattern = escapeRegExp(String(val).trim()).replace(/\\?\s+/g, "\\s*");
      // Границы слова обязательны — без них, например, атрибут material="Сталь"
      // резал бы подстрокой и внутри слова "стальНОЙ" (Сталь+ной), превращая
      // "Фланец стальной" в "Фланец ной". Раньше это было незаметно, но после
      // обрезки базового имени до 2 слов такой огрызок становится всем, что
      // остаётся — критично для группировки.
      try {
        s = s.replace(new RegExp(`${BND_BEFORE}${pattern}${BND_AFTER}`, "gi"), " ");
      } catch {
        s = s.split(val).join(" ");
      }
    });
  }

  // Спец-случай: у насосов ЭЦВ/СПА число после буквенного кода — это класс
  // товара (диаметр скважины, физически несовместимые между собой размеры),
  // а не размер варианта одной и той же модели — его нужно сохранить.
  s = s.replace(/(ЭЦВ\s*\d+)[-\s].*$/i, "$1");
  s = s.replace(/(СПА\s*\d+)[-\s].*$/i, "$1");

  // Любые скобки целиком — внутри почти всегда упаковка/артикул/страна/доп.
  // параметр, а не идентичность товара.
  s = s.replace(/\([^)]*\)/g, " ");

  // Бренд и страна — где угодно в строке.
  s = s.replace(new RegExp(`${BND_BEFORE}(?:${BRAND_ALT})${BND_AFTER}`, "g"), " ");
  s = s.replace(new RegExp(`${BND_BEFORE}(?:${COUNTRY_ALT})${BND_AFTER}`, "g"), " ");

  s = s.replace(/["'«»,;–—]/g, " ");

  // Символы диаметра без числа рядом (Ø, ф отдельно) и голые единицы измерения,
  // оставшиеся "осиротевшими" после вырезки чисел ниже.
  s = s.replace(new RegExp(`${BND_BEFORE}[ØøФф]${BND_AFTER}`, "g"), " ");

  // ГЛАВНОЕ: любой токен, НАЧИНАЮЩИЙСЯ с цифры — это почти всегда размер/вес/
  // ток/напряжение/артикул ("3,0мм", "220/12", "16А", "2,5кг"). Токены,
  // начинающиеся с БУКВЫ, даже если содержат цифры внутри (типа "МР-3",
  // "ЩРн-12", "ВА47-19"), сознательно сохраняются — это обычно код модели/
  // серии, а не просто размер.
  s = s.replace(/(?:^|\s)\d\S*/g, " ");

  // Голые единицы измерения без числа рядом (осиротели после вырезки выше).
  s = s.replace(new RegExp(`${BND_BEFORE}(?:мм2|мм|mm|кА|kA|Вт|W|кг|шт|уп)${BND_AFTER}\\.?`, "gi"), " ");
  s = s.replace(new RegExp(`${BND_BEFORE}IP${BND_AFTER}`, "gi"), " ");

  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/[-,./()]+$/, "").trim();

  // Обрезаем до первых 2 значимых слов — вот тот самый "грубый" шаг, который
  // резко увеличивает число объединений (было: точное совпадение всего
  // очищенного названия; стало: совпадение по первым двум словам).
  const words = s.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(" ") || name;
}

// Группирует список товаров по (subcategoryId + базовое название). Один и тот
// же ключ группировки должен использоваться везде, где мы решаем, что товары
// "похожи" — иначе на странице каталога товар окажется в одной группе, а на
// странице товара — в другой/одиночной, что будет выглядеть как баг.
export function groupItems(items: PriceItem[]): ItemGroup[] {
  const groups = new Map<string, ItemGroup>();
  items.forEach((item) => {
    const base = stripToBaseName(item.name, item.attributes) || item.name;
    const key = `${item.subcategoryId || ""}::${base.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, { baseName: base, items: [] });
    groups.get(key)!.items.push(item);
  });
  return Array.from(groups.values());
}

// Находит группу, к которой принадлежит конкретный товар (по тому же ключу,
// что использует groupItems) — нужно на странице товара, чтобы показать
// остальные варианты этой же модели.
export function findGroupForItem(item: PriceItem, allItemsInSameSubcategory: PriceItem[]): ItemGroup {
  const base = stripToBaseName(item.name, item.attributes) || item.name;
  const key = `${item.subcategoryId || ""}::${base.toLowerCase()}`;
  const items = allItemsInSameSubcategory.filter((p) => {
    const pBase = stripToBaseName(p.name, p.attributes) || p.name;
    return `${p.subcategoryId || ""}::${pBase.toLowerCase()}` === key;
  });
  return { baseName: base, items };
}