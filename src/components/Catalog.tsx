import React, { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BRANDS, ALL_SUBCATEGORIES_WITH_CATEGORY, PRICE_ITEMS, getSlugForSubcategoryId, getSubcategoryBySlug } from "../data";
import { Brand, PriceItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Search, Info, X, ShoppingCart, Check, HelpCircle, ArrowRight, ArrowLeft } from "lucide-react";

interface CatalogProps {
  onOpenLeadModal: (serviceName?: string) => void;
  priceItems?: PriceItem[];
  onAddToCart?: (item: PriceItem) => void;
  openPriceModalDirectly?: boolean;
  onClosePriceModalDirectly?: () => void;
}

const FALLBACK_IMG = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
const NO_PHOTO_IMG = "https://placehold.co/400x300/f5f5f5/a3a3a3?text=Нет+фото";
const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

export default function Catalog({
  onOpenLeadModal,
  priceItems,
  onAddToCart,
  openPriceModalDirectly,
  onClosePriceModalDirectly,
}: CatalogProps) {
  const { subcategorySlug } = useParams<{ subcategorySlug?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const activeSection = searchParams.get("section") as "santehnika" | "electrika" | null;
  const activeCategoryName = searchParams.get("category") || null;

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Пагинация внутри списка товаров — крупные подкатегории (50-200+ позиций)
  // рендерятся не все сразу, а порциями, с кнопкой "Показать ещё".
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const items = priceItems || PRICE_ITEMS;

  const activeSubcategory = useMemo(
    () => (subcategorySlug ? getSubcategoryBySlug(subcategorySlug) : undefined),
    [subcategorySlug]
  );

  // Раздел и категория активной подкатегории (нужны для кнопки "назад" из списка
  // товаров — чтобы вернуться не в пустоту, а в тот же раздел/категорию).
  const activeSubcategoryMeta = useMemo(
    () => (activeSubcategory ? ALL_SUBCATEGORIES_WITH_CATEGORY.find((s) => s.id === activeSubcategory.id) : undefined),
    [activeSubcategory]
  );
  const activeSubcategorySection = (activeSubcategoryMeta as any)?.section as ("santehnika" | "electrika" | undefined);
  const activeSubcategoryCategoryName = activeSubcategoryMeta?.categoryName;

  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (item.subcategoryId) counts[item.subcategoryId] = (counts[item.subcategoryId] || 0) + 1;
    });
    return counts;
  }, [items]);

  const subcategoryImage = (subcategoryId: string): string => {
    const found = items.find((i) => i.subcategoryId === subcategoryId && i.image);
    return found?.image || FALLBACK_IMG;
  };

  // Подкатегории текущего раздела, сгруппированные по категории —
  // используется на РЕЖИМ 1 (карточки категорий) и РЕЖИМ 2 (карточки подкатегорий
  // выбранной категории).
  const categoryGroups = useMemo(() => {
    const sectionSubs = ALL_SUBCATEGORIES_WITH_CATEGORY.filter(
      (s) => ((s as any).section || "santehnika") === activeSection
    );
    const order: string[] = [];
    const map = new Map<string, { categoryName: string; image: string; totalCount: number; subs: typeof sectionSubs }>();
    for (const sub of sectionSubs) {
      if (!map.has(sub.categoryName)) {
        order.push(sub.categoryName);
        map.set(sub.categoryName, {
          categoryName: sub.categoryName,
          image: sub.image || subcategoryImage(sub.id),
          totalCount: 0,
          subs: [],
        });
      }
      const group = map.get(sub.categoryName)!;
      group.subs.push(sub);
      group.totalCount += subcategoryCounts[sub.id] || 0;
    }
    return order.map((name) => map.get(name)!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, subcategoryCounts]);

  // Открыт по кнопке "Прайс/каталог" откуда-то ещё — просто уводим на корень каталога.
  React.useEffect(() => {
    if (openPriceModalDirectly) {
      navigate("/catalog");
      if (onClosePriceModalDirectly) onClosePriceModalDirectly();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPriceModalDirectly]);

  // Переход между "разделами" (сантехника/электрика/подкатегория/поиск) внутри каталога
  // анимируется ОДНИМ общим переходом на уровне App.tsx (key=location.pathname) —
  // здесь никакой отдельной анимации скролла/появления карточек больше нет,
  // чтобы не было двух наложенных друг на друга анимаций (было мелькание).

  const viewMode: "sections" | "categories" | "subcategories" | "products" =
    searchQuery || activeSubcategory
      ? "products"
      : activeCategoryName
      ? "subcategories"
      : activeSection
      ? "categories"
      : "sections";

  const SECTIONS: { id: "santehnika" | "electrika"; title: string; description: string; image: string }[] = [
    {
      id: "santehnika",
      title: "Сантехника",
      description: "Насосное оборудование, метизы, крепёж и сантехническая арматура",
      image: "/images/catalog/water_pumps_1784549298159.jpg",
    },
    {
      id: "electrika",
      title: "Электрика",
      description: "Кабель, автоматика, светотехника, электромонтажные изделия и шкафы",
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=75",
    },
  ];

  const handleSelectSection = (sectionId: "santehnika" | "electrika") => {
    setSearchParams({ section: sectionId });
  };

  const handleSelectCategory = (categoryName: string) => {
    navigate(`/catalog?section=${activeSection}&category=${encodeURIComponent(categoryName)}`);
  };

  // Группа (подкатегории) текущей выбранной категории — для РЕЖИМ 2 (подкатегории)
  const activeCategoryGroup = useMemo(
    () => categoryGroups.find((g) => g.categoryName === activeCategoryName),
    [categoryGroups, activeCategoryName]
  );

  const filteredItems = useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return items.filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q) ||
          (item.subcategory || "").toLowerCase().includes(q) ||
          (item.brand || "").toLowerCase().includes(q)
        );
      });
    }
    if (activeSubcategory) {
      return items.filter((i) => i.subcategoryId === activeSubcategory.id);
    }
    return [];
  }, [items, searchQuery, activeSubcategory]);

  // Сбрасываем "показано N" при переходе в другую подкатегорию или новом поиске —
  // иначе после смены списка можно было бы случайно оказаться с visibleCount
  // от предыдущего (например, более длинного) списка.
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeSubcategory?.id, searchQuery]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  const handleSelectSubcategory = (subSlug: string) => navigate(`/catalog/${subSlug}`);

  const handleBrandClick = (brandName: string) => {
    const found = BRANDS.find((b) => b.name === brandName);
    if (found) setSelectedBrand(found);
  };

  const handleAddToCartWithFeedback = (item: PriceItem) => {
    if (onAddToCart) onAddToCart(item);
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAddedItemIds((prev) => ({ ...prev, [item.id]: false })), 1500);
  };

  const productHref = (item: PriceItem): string | null => {
    const subSlug = getSlugForSubcategoryId(item.subcategoryId);
    if (!subSlug) return null;
    return `/catalog/${subSlug}/${item.slug}`;
  };

  // ---------- SEO для текущего вида ----------
  const bannerTitle =
    activeSubcategory?.name ||
    (viewMode === "subcategories" ? activeCategoryName : null) ||
    (viewMode === "categories" ? SECTIONS.find((s) => s.id === activeSection)?.title : null) ||
    "КАТАЛОГ";
  const seoTitle = activeSubcategory?.seo?.title || "Каталог товаров — ООО «БелТехКомпания»";
  const seoDescription = activeSubcategory?.seo?.description
    || "Насосное оборудование, метизы, крепёж и сантехническая арматура с доставкой по Беларуси.";
  const canonicalPath = activeSubcategory ? `/catalog/${subcategorySlug}` : "/catalog";

  // ---------- JSON-LD ----------
  const breadcrumbJsonLd = useMemo(() => {
    const itemListElement: any[] = [
      { "@type": "ListItem", position: 1, name: "Каталог", item: `${SITE_ORIGIN}/catalog` },
    ];
    if (activeSubcategory) {
      itemListElement.push({
        "@type": "ListItem",
        position: 2,
        name: activeSubcategory.name,
        item: `${SITE_ORIGIN}/catalog/${subcategorySlug}`,
      });
    }
    return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement };
  }, [activeSubcategory, subcategorySlug]);

  const itemListJsonLd = useMemo(() => {
    if (viewMode !== "products" || filteredItems.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: filteredItems.slice(0, 60).map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: item.name,
        url: productHref(item) ? `${SITE_ORIGIN}${productHref(item)}` : undefined,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, viewMode]);

  return (
    <section id="catalog" className="py-12 sm:py-20 bg-[#f6f6f4] min-h-screen">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${SITE_ORIGIN}${canonicalPath}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        {itemListJsonLd && <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>}
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Баннер каталога */}
        <div className="relative overflow-hidden bg-neutral-950 py-16 sm:py-28 min-h-[200px] sm:min-h-[300px] flex items-center justify-center mb-6 sm:mb-10 rounded-2xl sm:rounded-3xl shadow-xl border border-neutral-800">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=75"
            alt="Каталог ООО БелТехКомпания"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-35 scale-105"
            loading="eager"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/75" />
          <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h1
  className={`font-heading font-black text-white uppercase drop-shadow-[0_0_30px_rgba(245,144,30,0.9)] [overflow-wrap:normal] [word-break:normal] px-2 ${
    (bannerTitle.length) > 28
      ? "text-lg sm:text-2xl md:text-3xl tracking-wide"
      : (bannerTitle.length) > 16
      ? "text-2xl sm:text-4xl md:text-5xl tracking-wide"
      : "text-3xl sm:text-5xl md:text-6xl tracking-widest"
  }`}
>
  {bannerTitle}
</h1>
          </div>
        </div>

        {/* Хлебные крошки */}
        <nav aria-label="Breadcrumb" className="mb-4 text-xs font-sans text-neutral-500 flex flex-wrap items-center gap-1.5">
          <Link to="/catalog" className="hover:text-[#f5901e] transition-colors">Каталог</Link>
          {activeSection && (
            <>
              <span>/</span>
              {viewMode === "categories" ? (
                <span className="text-neutral-700 font-semibold">
                  {SECTIONS.find((s) => s.id === activeSection)?.title}
                </span>
              ) : (
                <button
                  onClick={() => setSearchParams({ section: activeSection })}
                  className="hover:text-[#f5901e] transition-colors cursor-pointer"
                >
                  {SECTIONS.find((s) => s.id === activeSection)?.title}
                </button>
              )}
            </>
          )}
          {(activeCategoryName || activeSubcategoryCategoryName) && !searchQuery && (
            <>
              <span>/</span>
              {viewMode === "subcategories" ? (
                <span className="text-neutral-700 font-semibold">{activeCategoryName}</span>
              ) : (
                <button
                  onClick={() => navigate(`/catalog?section=${activeSubcategorySection || activeSection}&category=${encodeURIComponent(activeSubcategoryCategoryName || activeCategoryName || "")}`)}
                  className="hover:text-[#f5901e] transition-colors cursor-pointer"
                >
                  {activeSubcategoryCategoryName || activeCategoryName}
                </button>
              )}
            </>
          )}
          {activeSubcategory && (
            <>
              <span>/</span>
              <span className="text-neutral-700 font-semibold">{activeSubcategory.name}</span>
            </>
          )}
        </nav>

        {/* Поиск */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-3 sm:p-4 shadow-sm mb-6 sm:mb-10">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              id="catalog-search-field"
              placeholder="Поиск товара по названию..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                if (val) setSearchParams({ q: val });
                else setSearchParams({});
              }}
              className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-neutral-50 border border-neutral-200 focus:border-[#f5901e] focus:ring-1 focus:ring-[#f5901e] rounded-xl text-xs sm:text-sm font-sans text-[#262626] focus:outline-none transition-all placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchParams({})}
                className="absolute right-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                title="Очистить"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* РЕЖИМ 0: ВЫБОР РАЗДЕЛА (Сантехника / Электрика) — первый экран каталога */}
        {viewMode === "sections" && (
          <div className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {SECTIONS.map((section) => (
                <div
                  key={section.id}
                  onClick={() => handleSelectSection(section.id)}
                  className="bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-[#f5901e] hover:ring-2 hover:ring-[#f5901e]/20 shadow-sm transition-all duration-300 cursor-pointer group p-5 sm:p-6"
                >
                  <div className="h-40 sm:h-52 w-full bg-neutral-100 rounded-xl overflow-hidden relative border border-neutral-100 mb-4">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-heading font-black text-xl sm:text-2xl text-[#262626] group-hover:text-[#f5901e] transition-colors uppercase mb-2">
                    {section.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-neutral-500 mb-4">{section.description}</p>
                  <div className="flex items-center justify-between text-xs font-heading font-extrabold text-[#f5901e] group-hover:text-[#e07f15] uppercase tracking-wider">
                    <span>Смотреть раздел</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 group-hover:bg-[#f5901e] group-hover:text-white flex items-center justify-center transition-all">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* РЕЖИМ 1: КАРТОЧКИ КАТЕГОРИЙ ВЫБРАННОГО РАЗДЕЛА */}
        {viewMode === "categories" && (
          <div className="mb-16">
            <button
              onClick={() => setSearchParams({})}
              className="mb-5 bg-white hover:bg-[#262626] hover:text-white text-neutral-700 border border-neutral-200 p-2 sm:px-3 sm:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-heading font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Все разделы</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {categoryGroups.map((group) => (
                <div
                  key={group.categoryName}
                  onClick={() => handleSelectCategory(group.categoryName)}
                  className="bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-[#f5901e] hover:ring-2 hover:ring-[#f5901e]/20 shadow-sm hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group p-4"
                >
                  <div>
                    <div className="h-40 sm:h-48 w-full bg-neutral-100 rounded-xl overflow-hidden relative border border-neutral-100 p-2 flex items-center justify-center">
                      <img
                        src={group.image}
                        alt={group.categoryName}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = NO_PHOTO_IMG; }}
                      />
                      <div className="absolute bottom-2.5 right-2.5 bg-[#f5901e] text-white font-heading font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-full shadow-md">
                        {group.totalCount > 0 ? `${group.totalCount} поз.` : "В наличии"}
                      </div>
                    </div>
                    <div className="mt-3.5">
                      <h3 className="font-heading font-black text-base sm:text-lg text-[#262626] group-hover:text-[#f5901e] transition-colors leading-tight uppercase mb-2 break-words">
                        {group.categoryName}
                      </h3>
                      <div className="flex flex-col gap-1 text-[11px] sm:text-xs font-sans text-neutral-500 mb-1">
                        {group.subs.slice(0, 6).map((sub) => (
                          <span
                            key={sub.id}
                            onClick={(e) => { e.stopPropagation(); handleSelectSubcategory(sub.slug); }}
                            className="truncate cursor-pointer hover:text-[#f5901e] transition-colors"
                          >
                            {sub.name}
                          </span>
                        ))}
                        {group.subs.length > 6 && (
                          <span
                            onClick={(e) => { e.stopPropagation(); handleSelectCategory(group.categoryName); }}
                            className="text-neutral-400 cursor-pointer hover:text-[#f5901e] transition-colors"
                          >
                            и ещё {group.subs.length - 6}…
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-heading font-extrabold text-[#f5901e] group-hover:text-[#e07f15] uppercase tracking-wider">
                    <span>Смотреть подкатегории</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 group-hover:bg-[#f5901e] group-hover:text-white flex items-center justify-center transition-all">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* РЕЖИМ 2: КАРТОЧКИ ПОДКАТЕГОРИЙ ВЫБРАННОЙ КАТЕГОРИИ */}
        {viewMode === "subcategories" && activeCategoryGroup && (
          <div className="mb-16">
            <button
              onClick={() => setSearchParams({ section: activeSection || "" })}
              className="mb-5 bg-white hover:bg-[#262626] hover:text-white text-neutral-700 border border-neutral-200 p-2 sm:px-3 sm:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-heading font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Все категории</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {activeCategoryGroup.subs.map((sub) => {
                const subCount = subcategoryCounts[sub.id] || 0;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubcategory(sub.slug)}
                    className="bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-[#f5901e] hover:ring-2 hover:ring-[#f5901e]/20 shadow-sm hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group p-4"
                  >
                    <div>
                      <div className="h-40 sm:h-48 w-full bg-neutral-100 rounded-xl overflow-hidden relative border border-neutral-100 p-2 flex items-center justify-center">
                        <img
                          src={sub.image || subcategoryImage(sub.id)}
                          alt={sub.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = NO_PHOTO_IMG; }}
                        />
                        <div className="absolute bottom-2.5 right-2.5 bg-[#f5901e] text-white font-heading font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-full shadow-md">
                          {subCount > 0 ? `${subCount} поз.` : "В наличии"}
                        </div>
                      </div>
                      <div className="mt-3.5">
                        <h3 className="font-heading font-black text-base sm:text-lg text-[#262626] group-hover:text-[#f5901e] transition-colors leading-tight uppercase mb-1 break-words">
                          {sub.name}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-heading font-extrabold text-[#f5901e] group-hover:text-[#e07f15] uppercase tracking-wider">
                      <span>Смотреть позиции</span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 group-hover:bg-[#f5901e] group-hover:text-white flex items-center justify-center transition-all">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* РЕЖИМ 3: СПИСОК ТОВАРОВ */}
        {viewMode === "products" && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (searchQuery) { navigate("/catalog"); return; }
                    const backSection = activeSubcategorySection || "santehnika";
                    const backCategory = activeSubcategoryCategoryName;
                    if (backCategory) {
                      navigate(`/catalog?section=${backSection}&category=${encodeURIComponent(backCategory)}`);
                    } else {
                      navigate(`/catalog?section=${backSection}`);
                    }
                  }}
                  className="bg-neutral-100 hover:bg-[#262626] hover:text-white text-neutral-700 p-2 sm:p-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-heading font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{searchQuery ? "Все разделы" : "К подкатегориям"}</span>
                </button>
                <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
                <div>
                  <span className="text-[10px] font-heading font-extrabold text-[#f5901e] uppercase tracking-wider block">
                    {searchQuery ? "Поиск" : "Подкатегория"}
                  </span>
                  <h2 className="font-heading font-black text-sm sm:text-base text-[#262626] uppercase break-words">
                    {searchQuery ? `Результаты: "${searchQuery}"` : activeSubcategory?.name}
                  </h2>
                </div>
              </div>
              <span className="text-xs font-sans text-neutral-500 font-bold bg-neutral-100 px-3 py-1.5 rounded-lg">
                Найдено: {filteredItems.length}
              </span>
            </div>

            {filteredItems.length > 0 ? (
              // Если у ВСЕХ товаров в списке одна и та же (запасная) картинка —
              // значит настоящих фото ни у одного нет. Рисовать одинаковую
              // картинку в каждой карточке бессмысленно — показываем её один раз
              // сверху, а сами позиции компактным списком (название + цена),
              // без картинки в каждой строке. Как только у товара появится
              // своё реальное фото (не совпадающее с соседями) — автоматически
              // вернётся обычная сетка карточек с фото.
              (() => {
                const allSameImage = filteredItems.every((i) => i.image === filteredItems[0].image);

                if (allSameImage) {
                  return (
                    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                      <div className="h-40 sm:h-52 w-full bg-neutral-50 flex items-center justify-center border-b border-neutral-100 p-4">
                        <img
                          src={filteredItems[0].image && filteredItems[0].image.trim().length > 0 ? filteredItems[0].image : NO_PHOTO_IMG}
                          alt={activeSubcategory?.name || "Товары"}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = NO_PHOTO_IMG; }}
                        />
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {visibleItems.map((item) => {
                          const isAdded = addedItemIds[item.id];
                          const href = productHref(item);
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-neutral-50 transition-colors">
                              <div
                                className={`min-w-0 flex-1 ${href ? "cursor-pointer" : ""}`}
                                onClick={() => { if (href) navigate(href); }}
                              >
                                <h3 className="font-heading font-bold text-xs sm:text-sm text-[#262626] leading-snug">
                                  {item.name}
                                </h3>
                                {item.brand && (
                                  <span className="text-[10px] font-sans text-neutral-400">{item.brand}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                <span className="font-heading font-extrabold text-sm sm:text-base text-[#262626] whitespace-nowrap">
                                  {item.price ? `${item.price} BYN` : "По запросу"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => onOpenLeadModal(`Запрос цены: ${item.name}`)}
                                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                                    title="Уточнить характеристики"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleAddToCartWithFeedback(item)}
                                    className={`px-3 py-2 rounded-xl font-heading font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                      isAdded ? "bg-green-600 text-white" : "bg-[#f5901e] hover:bg-[#e07f15] text-white"
                                    }`}
                                  >
                                    {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {hasMore && (
                        <div className="p-3.5 sm:p-4 border-t border-neutral-100">
                          <button
                            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                            className="w-full bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-heading font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Показать ещё ({filteredItems.length - visibleCount})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {visibleItems.map((item) => {
                  const isAdded = addedItemIds[item.id];
                  const href = productHref(item);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-neutral-200/90 hover:border-[#f5901e]/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between p-3.5 sm:p-4 group"
                    >
                      <div
                        className={href ? "cursor-pointer" : ""}
                        onClick={() => { if (href) navigate(href); }}
                      >
                        <div className="h-40 sm:h-48 w-full bg-neutral-50 rounded-xl overflow-hidden mb-3 border border-neutral-100 p-2 flex items-center justify-center relative">
                          <img
                            src={item.image && item.image.trim().length > 0 ? item.image : NO_PHOTO_IMG}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = NO_PHOTO_IMG; }}
                          />
                          {item.brand && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleBrandClick(item.brand as string); }}
                              className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs hover:bg-[#262626] hover:text-white text-neutral-800 text-[10px] font-heading font-extrabold px-2 py-0.5 rounded-md border border-neutral-200 transition-colors"
                            >
                              {item.brand}
                            </button>
                          )}
                        </div>

                        <h3 className="font-heading font-bold text-xs sm:text-sm text-[#262626] leading-snug line-clamp-2 min-h-[2.5em]">
                          {item.name}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-sans text-neutral-400 block -mb-0.5">Цена с НДС</span>
                          <span className="font-heading font-extrabold text-sm sm:text-base text-[#262626] whitespace-nowrap">
                            {item.price ? `${item.price} BYN` : "По запросу"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onOpenLeadModal(`Запрос цены: ${item.name}`)}
                            className="p-2 sm:p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                            title="Уточнить характеристики"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAddToCartWithFeedback(item)}
                            className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-heading font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAdded ? "bg-green-600 text-white" : "bg-[#f5901e] hover:bg-[#e07f15] text-white"
                            }`}
                          >
                            {isAdded ? (<><Check className="w-3.5 h-3.5" /><span className="hidden xs:inline">В корзине</span></>) : (<><ShoppingCart className="w-3.5 h-3.5" /><span>Заказать</span></>)}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
                    {hasMore && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                          className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-heading font-extrabold text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                        >
                          Показать ещё ({filteredItems.length - visibleCount})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center max-w-lg mx-auto">
                <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-300 mx-auto mb-3" />
                <h4 className="font-heading font-bold text-base sm:text-lg text-[#262626]">Ничего не найдено</h4>
                <p className="font-sans text-xs text-neutral-500 mt-1 mb-6">
                  Попробуйте изменить формулировку поиска или свяжитесь с нашим отделом продаж.
                </p>
                <button
                  onClick={() => onOpenLeadModal("Консультация по наличию товаров")}
                  className="bg-[#f5901e] hover:bg-[#e07f15] text-white text-xs font-heading font-extrabold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Запросить у менеджера
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedBrand && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedBrand(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-6 relative shadow-2xl border border-neutral-100"
            >
              <button onClick={() => setSelectedBrand(null)} className="absolute top-4 right-4 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                {selectedBrand.logo && (
                  <img src={selectedBrand.logo} alt={selectedBrand.name} className="w-16 h-16 object-contain rounded-lg border border-neutral-100 p-1" />
                )}
                <div>
                  <h3 className="font-heading font-black text-xl text-[#262626]">{selectedBrand.name}</h3>
                  <span className="text-xs text-neutral-400 font-sans">Официальный бренд</span>
                </div>
              </div>
              <p className="font-sans text-xs text-neutral-600 leading-relaxed mb-6">
                {selectedBrand.description || "Информация о бренде временно отсутствует."}
              </p>
              <button
                onClick={() => {
                  const brandName = selectedBrand.name;
                  setSelectedBrand(null);
                  onOpenLeadModal(`Запрос продукции бренда: ${brandName}`);
                }}
                className="w-full bg-[#f5901e] hover:bg-[#e07f15] text-white font-heading font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
              >
                Запросить прайс бренда
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}