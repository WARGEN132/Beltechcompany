import { Service, CatalogItem, Brand, PriceItem, Category, Subcategory, RawProduct } from "./types";
import rawProductsData from "./products.json";
import rawCategoriesData from "./categories.json";

export const ALL_SUBCATEGORIES: Subcategory[] = rawCategoriesData as Subcategory[];
export const ALL_SUBCATEGORIES_SLUG = "all";

/**
 * Явная карта "id подкатегории -> название категории" для тех случаев, когда
 * угадывание по ключевым словам (inferCategoryFromName) даёт неверный результат
 * или неоднозначно (например "Станция управления" содержит "станция", что раньше
 * ошибочно уводило в "Насосное оборудование"). Проверяется ПЕРЕД inferCategoryFromName.
 */
const SUBCATEGORY_CATEGORY_OVERRIDE: Record<string, string> = {
  "cat_electrika_kabelno-provodnikovaya-produkciya": "Кабельно-проводниковая продукция",
  "cat_electrika_sistemy-prokladki-kabelya": "Системы прокладки кабеля",
  "cat_electrika_nizkovoltnoe-oborudovanie": "Низковольтное оборудование",
  "cat_electrika_svetotehnika": "Светотехника",
  "cat_electrika_elektromontazhnye-izdeliya": "Электромонтажные изделия",
  "cat_electrika_shkafy-i-boksy": "Шкафы и боксы",
  "cat_pumps_ustroystvo-upravleniya-i-zaschity": "Автоматика и защита насосов",
  "cat_pumps_stanciya-upravleniya": "Автоматика и защита насосов",
};

const SUBCATEGORY_INDEX = new Map<
  string,
  { categoryName: string; subcategoryName: string; subcategorySlug: string }
>();

const SEEN_SLUGS = new Set<string>();

for (const sub of ALL_SUBCATEGORIES) {
  if (SEEN_SLUGS.has(sub.slug)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[catalog] Дублирующийся slug подкатегории: "${sub.slug}" (id: ${sub.id}). ` +
      `Все slug'и подкатегорий должны быть уникальны глобально — иначе ссылки будут вести не туда.`
    );
  }
  SEEN_SLUGS.add(sub.slug);
  SUBCATEGORY_INDEX.set(sub.id, {
    categoryName: SUBCATEGORY_CATEGORY_OVERRIDE[sub.id] || inferCategoryFromName(sub.name),
    subcategoryName: sub.name,
    subcategorySlug: sub.slug,
  });
}

/**
 * Подкатегории с уже вычисленным полем categoryName (та же логика, что и в
 * SUBCATEGORY_INDEX выше) — используется в Catalog.tsx для группировки
 * подкатегорий по категориям в списке (формат как на elos-by.com/catalog).
 */
export const ALL_SUBCATEGORIES_WITH_CATEGORY: (Subcategory & { categoryName: string })[] =
  ALL_SUBCATEGORIES.map((sub) => ({
    ...sub,
    categoryName: SUBCATEGORY_CATEGORY_OVERRIDE[sub.id] || inferCategoryFromName(sub.name),
  }));

  function inferCategoryFromName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("кабел") || n.includes("провод") || n.includes("шнур")) return "Кабель и провод";
    if (n.includes("светильник") || n.includes("ламп") || n.includes("прожектор") || n.includes("люстр")) return "Светотехника";
    if (n.includes("розетк") || n.includes("выключат") || n.includes("рамк")) return "Выключатели и розетки";
    if (n.includes("автомат") || n.includes("узо") || n.includes("дифавтомат") || n.includes("щит")) return "Модульное оборудование";
    if (n.includes("насос") || n.includes("скважин") || n.includes("станци")) return "Насосное оборудование";
 
    if (n.includes("самор") || n.includes("дюбел") || n.includes("шуруп") || n.includes("анкер") || n.includes("шайб") || n.includes("гайк") || n.includes("болт") || n.includes("шпильк") || n.includes("переходник")) return "Метизы";
    if (n.includes("хомут")) return "Хомуты ремонтные";
    // ВАЖНО: проверки на "фитинг" должны идти раньше проверки на "труб" —
    // иначе "Фитинги и трубы для полиэтилена/полипропилена" (содержит оба слова)
    // всегда перехватывалась бы общим условием "труб" и не попадала в свой блок.
    if (n.includes("фитинг") && (n.includes("чугун") || n.includes("латун"))) return "Фитинги чугунные и латунные";
    if (n.includes("фитинг")) return "Фитинги для полиэтилена/полипропилена";
    if (n.includes("труб") || n.includes("гофр") || n.includes("лоток")) return "Трубы стальные, ПЭ, ПВХ";
  
    if (n.includes("фланц")) return "Фланцы и заглушки";
    if (n.includes("кран") || n.includes("вентил") || n.includes("задвиж") || n.includes("клапан")) return "Краны, вентили, задвижки и клапаны";
    if (n.includes("манометр") || n.includes("термометр") || n.includes("измерит")) return "Измерительные приборы";
    if (n.includes("уплотнит") || n.includes("изоляц") || n.includes("расходн")) return "Уплотнители, изоляция и расходные материалы";
    if (n.includes("люк") || n.includes("обойм") || n.includes("подставк")) return "Люки, обоймы, подставки";
    return "Метизы";
  }

/**
 * Подбор картинки-заглушки по категории/подкатегории/названию товара,
 * пока не проставлены реальные фото (image: null в products.json).
 */
function getFallbackImage(cat: string, name: string): string {
  const c = (cat + " " + name).toLowerCase();
  if (c.includes("насос") || c.includes("скважин")) return "/images/catalog/water_pumps_1784549298159.jpg";
  if (c.includes("хомут") || c.includes("краб")) return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("метиз") || c.includes("крепёж") || c.includes("крепеж") ||
    c.includes("шайб") || c.includes("болт") || c.includes("гайк") ||
    c.includes("шпильк") || c.includes("саморез") || c.includes("дюбель") ||
    c.includes("шуруп") || c.includes("анкер")
  ) return "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("труб") || c.includes("гофр") || c.includes("лоток") ||
    c.includes("арматур") || c.includes("фитинг") || c.includes("задвижка") ||
    c.includes("вентиль") || c.includes("клапан") || c.includes("кран") ||
    c.includes("заглушка") || c.includes("бочат") || c.includes("соединитель") ||
    c.includes("отвод") || c.includes("фланец") || c.includes("манометр") ||
    c.includes("муфта") || c.includes("прокладк")
  ) return "https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("кабель") || c.includes("провод") || c.includes("гофротруб") ||
    c.includes("кабель-канал")
  ) return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("автомат") || c.includes("узо") || c.includes("контактор") ||
    c.includes("реле") || c.includes("низковольт")
  ) return "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80";
  if (c.includes("светильник") || c.includes("прожектор") || c.includes("led") || c.includes("лампа"))
    return "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80";
  if (c.includes("щит") || c.includes("шкаф") || c.includes("бокс") || c.includes("вру"))
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
  return "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=400&q=80";
}

/**
 * ВАЖНО: возвращаем "" (пустую строку), а не "По запросу", когда цены нет.
 * Catalog.tsx сам дописывает суффикс " BYN" к любой непустой строке
 * (`itemPrice ? ... + " BYN" : "По запросу"`), поэтому если вернуть здесь
 * готовую строку "По запросу", на экране получится "По запросу BYN".
 * Пустая строка — falsy, поэтому Catalog.tsx корректно покажет "По запросу".
 */
function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "";
  return String(price);
}

/**
 * Основная функция сборки каталога: связывает products.json (categoryIds)
 * с categories.json (id подкатегорий) и отдаёт плоский список PriceItem.
 */
export function getPriceItems(): PriceItem[] {
  const products = rawProductsData as RawProduct[];

  return products.map((item, index) => {
    const name = item.name || `Товар #${index + 1}`;
    const subcatId = item.categoryIds && item.categoryIds[0];
    const resolved = subcatId ? SUBCATEGORY_INDEX.get(subcatId) : undefined;

    const categoryName = resolved ? resolved.categoryName : inferCategoryFromName(name);
    const subcategoryName = resolved ? resolved.subcategoryName : "";

    const img = item.image && item.image.trim().length > 5
      ? item.image
      : getFallbackImage(categoryName, name);

    return {
      id: item.id,
      slug: item.slug,
      name,
      unit: "шт",
      price: formatPrice(item.price),
      category: categoryName,
      subcategory: subcategoryName,
      image: img,
      description: "Профессиональное оборудование от ООО «БелТехКомпания».",

      subcategoryId: subcatId,
      brand: item.brand,
      oldPrice: item.oldPrice,
      inStock: item.inStock,
      attributes: item.attributes,
    } as PriceItem;
  });
}

export const PRICE_ITEMS: PriceItem[] = getPriceItems();

/** Товары конкретной подкатегории по её id (например, для страницы подкатегории) */
export function getProductsBySubcategoryId(subcategoryId: string): PriceItem[] {
  return PRICE_ITEMS.filter((p) => p.subcategoryId === subcategoryId);
}

/**
 * Рекомендуемые товары витрины
 */
export const FEATURED_STORE_PRODUCTS: PriceItem[] = [
  { id: "feat_light_1", name: "Светильник светодиодный LED 36W (595х595) Армстронг", unit: "шт", price: "По запросу", category: "Светотехника", subcategory: "Светильники", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80", description: "Офисный и промышленный светодиодный панельный светильник. Энергосбережение и ровный свет." },
  { id: "feat_light_2", name: "Прожектор светодиодный LED 50W IP65 (уличный)", unit: "шт", price: "По запросу", category: "Светотехника", subcategory: "Светильники", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80", description: "Уличный герметичный светодиодный прожектор для подсветки фасадов, дворов и объектов." },
  { id: "feat_cable_1", name: "Кабель ВВГнг-LS 3х1.5 ГОСТ (для освещения)", unit: "метр", price: "По запросу", category: "Кабель и провод", subcategory: "Кабели силовые (ВВГнг, АВВГ, КГ)", image: "/images/catalog/cables_and_wires_1784549270189.jpg", description: "Медный силовой кабель, не поддерживающий горение, с низким дымовыделением. ГОСТ РБ." },
  { id: "feat_cable_2", name: "Кабель ВВГнг-LS 3х2.5 ГОСТ (для розеток)", unit: "метр", price: "По запросу", category: "Кабель и провод", subcategory: "Кабели силовые (ВВГнг, АВВГ, КГ)", image: "/images/catalog/cables_and_wires_1784549270189.jpg", description: "Силовой медный кабель ГОСТ для розеточных сетей частных домов и квартир." },
  { id: "feat_sock_1", name: "Розетка с заземлением BRITE (софт-тач белая)", unit: "шт", price: "По запросу", category: "Выключатели, розетки (BRITE, BYLECTRICA)", subcategory: "Розетки", image: "/images/catalog/sockets_and_switches_1784549255870.jpg", description: "Премиальная розетка серии BRITE со стойким приятным покрытием и защитными шторками." },
  { id: "feat_sock_2", name: "Выключатель 2-клавишный Bylectrica Пралеска", unit: "шт", price: "По запросу", category: "Выключатели, розетки (BRITE, BYLECTRICA)", subcategory: "Выключатели", image: "/images/catalog/sockets_and_switches_1784549255870.jpg", description: "Отечественный надежный выключатель Bylectrica скрытой установки. Стандарт РБ." },
  { id: "feat_mod_1", name: "Автоматический выключатель Legrand RX3 1P 16A C", unit: "шт", price: "По запросу", category: "Модульное оборудование", subcategory: "Автоматы", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80", description: "Оригинальный автомат Legrand для защиты электрических сетей от перегрузок." },
  { id: "feat_well_1", name: "Скважинный насос Franklin Electric 4\" High Performance", unit: "шт", price: "По запросу", category: "Насосное оборудование", subcategory: "Скважинные насосы (ЭЦВ, СПА)", image: "/images/catalog/water_pumps_1784549298159.jpg", description: "Оригинальный глубоководный скважинный агрегат с двигателем Franklin Electric (США)." },
  { id: "feat_well_5", name: "Скважинный насос Omnigena 3B20 (230V)", unit: "шт", price: "По запросу", category: "Насосное оборудование", subcategory: "Скважинные насосы (ЭЦВ, СПА)", image: "/images/catalog/water_pumps_1784549298159.jpg", description: "Узкий 3-дюймовый погружной насос Omnigena для индивидуальных скважин." }
];

/**
 * ПОЛНЫЙ СПИСОК УСЛУГ ООО «БЕЛТЕХКОМПАНИЯ»
 */
export const SERVICES: Service[] = [
  {
    id: "smr",
    title: "Выполнение строительно-монтажных работ",
    category: "Строительно-монтажные работы",
    description: "Полный комплекс строительно-монтажных работ на объектах любого уровня сложности.",
    detailedDescription: "ООО «БелТехКомпания» (г. Ивацевичи, ул. Свердлова, 5) осуществляет квалифицированные строительно-монтажные работы под ключ. Имеем аттестаты соответствия, допуски и собственную материально-техническую базу.",
    image: "/images/services/mini-excavator.png",
    media: [],
    features: ["Общестроительные работы", "Парк спецтехники", "Соблюдение ТКП", "Инженерный надзор"]
  },
  {
    id: "internal_engineering",
    title: "Монтаж внутренних инженерных систем зданий и сооружений",
    category: "Инженерные системы",
    description: "Монтаж систем отопления, теплоснабжения вентиляционных установок, вентиляции и кондиционирования.",
    detailedDescription: "Профессиональный монтаж внутренних инженерных систем зданий и сооружений в строгом соответствии с ТКП и строительными нормами Республики Беларусь. Обеспечиваем полный цикл жизнеобеспечения объекта.",
    image: "/images/services/otoplenie.png",
    media: [],
    features: ["Монтаж отопления", "Внутренние сети водопровода", "Прокладка трубопроводов", "Пусконаладочные работы"]
  },
  {
    id: "heating_ventilation",
    title: "Монтаж систем отопления и теплоснабжения вентиляционных установок",
    category: "Инженерные системы",
    description: "Монтаж отопительных систем и обвязка теплоснабжения приточных вентиляционных установок.",
    detailedDescription: "Устройство систем отопления зданий и монтаж теплоснабжения вентиляционных установок (калориферов) любой мощности. Выполняем обвязку узлов регулирования.",
    image: "/images/services/obvyazka.png",
    media: [],
    features: ["Радиаторное отопление", "Теплоснабжение приточек", "Узлы регулирования", "Опрессовка систем"]
  },
  {
    id: "ventilation_conditioning",
    title: "Монтаж систем вентиляции и кондиционирования воздуха",
    category: "Инженерные системы",
    description: "Монтаж систем вентиляции и кондиционирования воздуха (за исключением систем противодымной вентиляции).",
    detailedDescription: "Обустройство систем приточной, вытяжной вентиляции и кондиционирования воздуха для жилых, коммерческих и промышленных зданий. Создаем комфортный микроклимат.",
    image: "/images/services/ventilyaciya.jpg",
    features: ["Воздуховоды любой сложности", "Рекуператоры", "VRF-системы", "Наладка очистки воздуха"],
    media: []
  },
  {
    id: "external_engineering",
    title: "Монтаж наружных инженерных сетей и сооружений",
    category: "Наружные сети",
    description: "Прокладка и монтаж наружных инженерных сетей и сооружений, включая монтаж тепловых сетей.",
    detailedDescription: "Строительство и реконструкция наружных инженерных коммуникаций: прокладка теплосетей, водопроводов и канализации. Выполняем весь комплекс земляных работ.",
    image: "/images/services/truba.png",
    media: [],
    features: ["Наружные тепловые сети", "Сети водопровода", "Земляные работы", "Монтаж колодцев и камер"]
  },
  {
    id: "thermal_networks",
    title: "Монтаж тепловых сетей",
    category: "Наружные сети",
    description: "Монтаж наружных тепловых сетей, магистральных трубопроводов и тепловых пунктов.",
    detailedDescription: "Профессиональная прокладка тепловых сетей с использованием современных ПИ-труб и запорной арматуры.",
    image: "/images/services/trubi.jpg",
    features: ["ПИ-трубопроводы в ППУ", "Неподвижные опоры", "Системы СОДК", "Сварка ПИ-труб"],
    media: []
  },
  {
    id: "internal_electrical",
    title: "Монтаж внутренних систем электроснабжения",
    category: "Электроснабжение",
    description: "Проектирование и монтаж внутренних систем электроснабжения зданий и сооружений.",
    detailedDescription: "Полный комплекс работ по устройству внутренних сетей электроснабжения, сборке электрощитов, разводке кабелей и монтажу оборудования.",
    image: "/images/services/shitok.jpg",
    media: [{ id: "iel1", type: "image", url: "/images/services/shitok111.jpg" }],
    features: ["Штробление и прокладка", "Сборка ВРУ и ГРЩ", "Установка розеток", "Проведение ЭФИ"]
  },
  {
    id: "external_electrical",
    title: "Монтаж наружных сетей электроснабжения, трансформаторных подстанций и распределительных устройств",
    category: "Электроснабжение",
    description: "Монтаж наружных электрических сетей, КТП и распределительных устройств.",
    detailedDescription: "Строительство кабельных и воздушных линий, монтаж комплектных трансформаторных подстанций и уличного освещения.",
    image: "/images/services/imba_shitok.jpg",
    features: ["Установка КТП", "Воздушные линии СИП", "Киосковые подстанции", "Контур заземления"],
    media: [
      { id: "eel1", type: "image", url: "/images/services/shitok5.jpg" },
      { id: "eel2", type: "image", url: "/images/services/shitok55.jpg" }
    ]
  },
  {
    id: "water_supply_and_heating",
    title: "Водоснабжение и отопление",
    category: "Водоснабжение и отопление",
    description: "Проектирование, монтаж и сервисное обслуживание систем водоснабжения и отопления.",
    detailedDescription: "Профессиональный монтаж автономных систем. Установка котлов под льготный тариф 0.04 руб/кВтч.",
    image: "/images/services/trubii.png",
    features: ["Системы из скважин", "Монтаж котлов (электро/газ)", "Водяные теплые полы", "Фильтрация воды"],
    media: [
      { id: "wsh3", type: "video", url: "/videos/services/trubi.mp4", poster: "/images/services/trubka1.png" },
      { id: "wsh4", type: "video", url: "/videos/services/trubii.mp4", poster: "/images/services/trubka2.png" },
      { id: "wsh2", type: "video", url: "/videos/services/truba.mp4", poster: "/images/services/trubka.png" }
    ]
  },
  {
    id: "heating_flushing",
    title: "Промывка и очистка систем отопления",
    category: "Водоснабжение и отопление",
    description: "Профессиональная гидропневматическая и химическая промывка радиаторов, полов и котлов.",
    detailedDescription: "Удаление отложений и накипи из системы отопления для восстановления теплоотдачи и экономии топлива. Используем спец. оборудование.",
    image: "/images/services/chistka.png",
    features: ["Гидропневматическая очистка", "Химическая промывка", "Замена теплоносителя", "Опрессовка системы"],
    media: [
      { id: "hf1", type: "video", url: "/videos/services/promivka.mp4", poster: "/images/services/chistka1.png" },
      { id: "hf2", type: "video", url: "/videos/services/promivka1.mp4", poster: "/images/services/chistka2.png" },
      { id: "hf3", type: "video", url: "/videos/services/promivka2.mp4", poster: "/images/services/chistka3.png" }
    ]
  }
];

export function getServices(): Service[] {
  return SERVICES;
}

export const BRANDS: Brand[] = [
  { name: "BRITE", country: "Россия", description: "Премиальная серия электроустановочных изделий." },
  { name: "BYLECTRICA", country: "Беларусь", description: "Отечественный стандарт качества." },
  { name: "Legrand", country: "Франция", description: "Мировой лидер электрооборудования." },
  { name: "Omnigena", country: "Польша", description: "Надежные насосы для водоснабжения." },
  { name: "Grundfos", country: "Дания", description: "Признанный мировой лидер насосных систем." }
];

/** Подкатегория по slug из URL (/catalog/:subcategorySlug) */
export function getSubcategoryBySlug(subcategorySlug: string): Subcategory | undefined {
  return ALL_SUBCATEGORIES.find((s) => s.slug === subcategorySlug);
}

/** Канонический slug подкатегории по id подкатегории товара */
export function getSlugForSubcategoryId(subcategoryId?: string) {
  if (!subcategoryId) return undefined;
  return SUBCATEGORY_INDEX.get(subcategoryId)?.subcategorySlug;
}

/** Товар по его slug (для страницы /catalog/:subcategorySlug/:productSlug) */
export function getProductBySlug(slug: string) {
  return PRICE_ITEMS.find((p) => p.slug === slug);
}