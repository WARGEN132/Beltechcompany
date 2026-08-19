import React, { useState, useMemo, useRef, useEffect, memo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BRANDS, ALL_SUBCATEGORIES, PRICE_ITEMS, getSlugForSubcategoryId, getSubcategoryBySlug } from "../data";
import { Brand, PriceItem, Subcategory } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Search, Info, X, ShoppingCart, Check, HelpCircle, ArrowRight, ArrowLeft, Layers } from "lucide-react";

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

// Единый мягкий пресет анимации для карточек (добавлен as const для устранения ошибки типов)
const fadeUpProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }
} as const;

// Мемоизированная карточка подкатегории
const SubcategoryCard = memo(({
  sub,
  subCount,
  imageSrc,
  onSelect,
}: {
  sub: Subcategory;
  subCount: number;
  imageSrc: string;
  onSelect: (slug: string) => void;
}) => (
  <motion.div
    {...fadeUpProps}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(sub.slug)}
    className="bg-white rounded-2xl border border-neutral-200/80 hover:border-[#f5901e] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group p-4"
  >
    <div>
      <div className="h-40 sm:h-48 w-full bg-neutral-50 rounded-xl overflow-hidden relative border border-neutral-100 p-2 flex items-center justify-center">
        <img
          src={sub.image || imageSrc}
          alt={sub.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = NO_PHOTO_IMG; }}
        />
        <div className="absolute bottom-2.5 right-2.5 bg-[#f5901e] text-white font-heading font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          <span>{subCount > 0 ? `${subCount} поз.` : "В наличии"}</span>
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
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 group-hover:bg-[#f5901e] group-hover:text-white flex items-center justify-center transition-all duration-300">
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    </div>
  </motion.div>
));

// Мемоизированная карточка товара
const ProductCard = memo(({
  item,
  isAdded,
  href,
  onNavigate,
  onBrandClick,
  onOpenLeadModal,
  onAddToCart,
}: {
  item: PriceItem;
  isAdded: boolean;
  href: string | null;
  onNavigate: (href: string) => void;
  onBrandClick: (brand: string) => void;
  onOpenLeadModal: (name: string) => void;
  onAddToCart: (item: PriceItem) => void;
}) => (
  <motion.div
    {...fadeUpProps}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="bg-white rounded-2xl border border-neutral-200/80 hover:border-[#f5901e]/60 hover:shadow-lg transition-all duration-300 flex flex-col justify-between p-3.5 sm:p-4 group"
  >
    <div
      className={href ? "cursor-pointer" : ""}
      onClick={() => { if (href) onNavigate(href); }}
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
            onClick={(e) => { e.stopPropagation(); onBrandClick(item.brand as string); }}
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
          onClick={() => onAddToCart(item)}
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-heading font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isAdded ? "bg-green-600 text-white" : "bg-[#f5901e] hover:bg-[#e07f15] text-white"
          }`}
        >
          {isAdded ? (
            <><Check className="w-3.5 h-3.5" /><span className="hidden xs:inline">В корзине</span></>
          ) : (
            <><ShoppingCart className="w-3.5 h-3.5" /><span>Заказать</span></>
          )}
        </button>
      </div>
    </div>
  </motion.div>
));

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

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const contentTopRef = useRef<HTMLDivElement>(null);

  const items = priceItems || PRICE_ITEMS;
  const subcategories = ALL_SUBCATEGORIES;

  const activeSubcategory = useMemo(
    () => (subcategorySlug ? getSubcategoryBySlug(subcategorySlug) : undefined),
    [subcategorySlug]
  );

  useEffect(() => {
    if (openPriceModalDirectly) {
      navigate("/catalog");
      setSearchParams({});
      if (onClosePriceModalDirectly) onClosePriceModalDirectly();
    }
  }, [openPriceModalDirectly, navigate, setSearchParams, onClosePriceModalDirectly]);

  // Плавный скролл после полной отрисовки кадра
  useEffect(() => {
    if (!subcategorySlug && !searchQuery) return;
    
    const timer = setTimeout(() => {
      if (contentTopRef.current) {
        const yOffset = -20; 
        const y = contentTopRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [subcategorySlug, searchQuery]);

  const viewMode: "subcategories" | "products" = searchQuery || activeSubcategory ? "products" : "subcategories";

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

  const seoTitle = activeSubcategory?.seo?.title || "Каталог товаров — ООО «БелТехКомпания»";
  const seoDescription = activeSubcategory?.seo?.description
    || "Насосное оборудование, метизы, крепёж и сантехническая арматура с доставкой по Беларуси.";
  const canonicalPath = activeSubcategory ? `/catalog/${subcategorySlug}` : "/catalog";

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
  }, [filteredItems, viewMode]);

  return (
    <section id="catalog" className="py-8 sm:py-16 bg-[#f6f6f4] min-h-screen">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${SITE_ORIGIN}${canonicalPath}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        {itemListJsonLd && <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>}
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Главный Баннер */}
        {!activeSubcategory && !searchQuery && (
          <motion.div 
            {...fadeUpProps}
            className="relative overflow-hidden bg-neutral-950 py-12 sm:py-20 min-h-[180px] sm:min-h-[240px] flex items-center justify-center mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl border border-neutral-800/80 shadow-xs"
          >
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=75"
              alt="Каталог ООО БелТехКомпания"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/70" />
            <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
              <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-white uppercase tracking-widest">
                КАТАЛОГ
              </h1>
            </div>
          </motion.div>
        )}

        <div ref={contentTopRef} />

        {/* Хлебные крошки */}
        <nav aria-label="Breadcrumb" className="mb-4 text-xs font-sans text-neutral-500 flex flex-wrap items-center gap-1.5">
          <Link to="/catalog" className="hover:text-[#f5901e] transition-colors" onClick={() => setSearchParams({})}>Каталог</Link>
          {activeSubcategory && (
            <>
              <span>/</span>
              <span className="text-neutral-700 font-semibold">{activeSubcategory.name}</span>
            </>
          )}
        </nav>

        {/* Поиск */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-xs mb-6 sm:mb-8">
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

        {/* СЕТКА ПОДКАТЕГОРИЙ */}
        {viewMode === "subcategories" && (
          <div className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {subcategories.map((sub) => (
                <SubcategoryCard
                  key={sub.id}
                  sub={sub}
                  subCount={subcategoryCounts[sub.id] || 0}
                  imageSrc={subcategoryImage(sub.id)}
                  onSelect={handleSelectSubcategory}
                />
              ))}
            </div>
          </div>
        )}

        {/* СПИСОК ТОВАРОВ */}
        {viewMode === "products" && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (searchQuery) { setSearchParams({}); navigate("/catalog"); }
                    else navigate("/catalog");
                  }}
                  className="bg-neutral-100 hover:bg-[#262626] hover:text-white text-neutral-700 p-2 sm:p-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-heading font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{searchQuery ? "Все категории" : "К подкатегориям"}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    isAdded={!!addedItemIds[item.id]}
                    href={productHref(item)}
                    onNavigate={navigate}
                    onBrandClick={handleBrandClick}
                    onOpenLeadModal={onOpenLeadModal}
                    onAddToCart={handleAddToCartWithFeedback}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedBrand(null)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-6 relative shadow-xl border border-neutral-100"
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