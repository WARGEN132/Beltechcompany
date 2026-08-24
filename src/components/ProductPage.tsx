import React, { useRef } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { PRICE_ITEMS, ALL_SUBCATEGORIES, getProductBySlug } from "../data";
import { PriceItem } from "../types";
import { ArrowLeft, ShoppingCart, Info, Tag, Globe2, Ruler, Layers } from "lucide-react";

interface ProductPageProps {
  priceItems?: PriceItem[];
  onOpenLeadModal: (serviceName?: string) => void;
  onAddToCart?: (item: PriceItem) => void;
}

const NO_PHOTO_IMG = "https://placehold.co/600x450/f5f5f5/a3a3a3?text=Нет+фото";
const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

const ATTR_LABELS: Record<string, string> = {
  diameter: "Диаметр / Ду",
  standard: "Стандарт",
  material: "Материал",
  coating: "Покрытие",
  country: "Страна",
};

export default function ProductPage({ priceItems, onOpenLeadModal, onAddToCart }: ProductPageProps) {
  const { subcategorySlug, productSlug } = useParams<{
    subcategorySlug: string;
    productSlug: string;
  }>();
  const navigate = useNavigate();

  // Ref на саму карточку товара — при открытии/смене товара плавно центрируем
  // её на экране, чтобы вся карточка была видна целиком.
  const productCardRef = useRef<HTMLDivElement>(null);

  // Мгновенное центрирование карточки товара на экране при открытии/смене товара.
  // Появление контента (fade) теперь обеспечивает единый переход в App.tsx —
  // здесь только позиционирование, без своей отдельной анимации.
  React.useEffect(() => {
    if (!productCardRef.current) return;
    const rect = productCardRef.current.getBoundingClientRect();
    const elementCenter = window.scrollY + rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const targetY = Math.max(elementCenter - viewportCenter, 0);
    window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
  }, [productSlug]);

  const items = priceItems || PRICE_ITEMS;
  const product = productSlug
    ? items.find((p) => p.slug === productSlug) || getProductBySlug(productSlug)
    : undefined;

  // Определяем реальную (каноническую) подкатегорию товара
  const subcategory = product
    ? ALL_SUBCATEGORIES.find((s) => s.id === product.subcategoryId)
    : undefined;

  if (!product || !subcategory) {
    return (
      <section className="py-20 bg-[#f6f6f4] min-h-screen">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Helmet><title>Товар не найден — БелТехКомпания</title></Helmet>
          <h1 className="font-heading font-black text-2xl text-[#262626] mb-3">Товар не найден</h1>
          <p className="font-sans text-sm text-neutral-500 mb-6">
            Возможно, ссылка устарела или товар был перемещён.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 bg-[#f5901e] hover:bg-[#e07f15] text-white text-xs font-heading font-extrabold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Вернуться в каталог
          </Link>
        </div>
      </section>
    );
  }

  // Канонический редирект, если в URL был "чужой" subcategorySlug для этого товара
  const canonicalPath = `/catalog/${subcategory.slug}/${product.slug}`;
  if (subcategorySlug !== subcategory.slug) {
    return <Navigate to={canonicalPath} replace />;
  }

  const seoTitle = `${product.name} — купить в БелТехКомпания`;
  const seoDescription = product.description
    ? product.description
    : `${product.name}. ${subcategory.name}. Доставка по Беларуси.`;

  const attrs = product.attributes || {};
  const attrEntries = Object.entries(attrs).filter(([, v]) => v);

  const productJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.id,
    category: subcategory.name,
    image: product.image ? [product.image] : undefined,
  };
  if (product.brand) {
    productJsonLd.brand = { "@type": "Brand", name: product.brand };
  }
  // offers только если есть реальная числовая цена — не выдумываем цену там, где "По запросу"
  const numericPrice = product.price && !isNaN(Number(product.price)) ? Number(product.price) : null;
  if (numericPrice) {
    productJsonLd.offers = {
      "@type": "Offer",
      priceCurrency: "BYN",
      price: numericPrice,
      availability: product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${SITE_ORIGIN}${canonicalPath}`,
    };
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Каталог", item: `${SITE_ORIGIN}/catalog` },
      { "@type": "ListItem", position: 2, name: subcategory.name, item: `${SITE_ORIGIN}/catalog/${subcategory.slug}` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_ORIGIN}${canonicalPath}` },
    ],
  };

  return (
    <section className="py-12 sm:py-20 bg-[#f6f6f4] min-h-screen">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${SITE_ORIGIN}${canonicalPath}`} />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs font-sans text-neutral-500 flex flex-wrap items-center gap-1.5">
          <Link to="/catalog" className="hover:text-[#f5901e] transition-colors">Каталог</Link>
          <span>/</span>
          <Link to={`/catalog/${subcategory.slug}`} className="hover:text-[#f5901e] transition-colors">{subcategory.name}</Link>
          <span>/</span>
          <span className="text-neutral-700 font-semibold">{product.name}</span>
        </nav>

        <button
          onClick={() => navigate(`/catalog/${subcategory.slug}`)}
          className="mb-6 bg-white hover:bg-[#262626] hover:text-white text-neutral-700 border border-neutral-200 p-2 sm:px-3 sm:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-heading font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к списку</span>
        </button>

        <div
          ref={productCardRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-stretch bg-white rounded-2xl border border-neutral-200 p-4 sm:p-8"
        >
          {/* Изображение */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4 sm:p-6 flex items-center justify-center h-72 sm:h-96 relative">
            <img
              src={product.image && product.image.trim().length > 0 ? product.image : NO_PHOTO_IMG}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = NO_PHOTO_IMG; }}
            />
            {product.brand && (
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-neutral-800 text-xs font-heading font-extrabold px-2.5 py-1 rounded-md border border-neutral-200">
                {product.brand}
              </span>
            )}
          </div>

          {/* Инфо */}
          <div className="flex flex-col">
            <span className="text-[11px] font-heading font-extrabold text-[#f5901e] uppercase tracking-wider mb-1">
              {subcategory.name}
            </span>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-[#262626] leading-snug mb-4">
              {product.name}
            </h1>

            {attrEntries.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {attrEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
                    {key === "diameter" && <Ruler className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                    {key === "country" && <Globe2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                    {key === "material" || key === "coating" ? <Layers className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> : null}
                    {key === "standard" && <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                    <div className="min-w-0">
                      <span className="text-[10px] text-neutral-400 font-sans block">{ATTR_LABELS[key] || key}</span>
                      <span className="text-xs font-sans font-semibold text-[#262626] break-words">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {product.description && (
              <p className="font-sans text-sm text-neutral-600 leading-relaxed mb-6">{product.description}</p>
            )}

            <div className="mt-auto pt-4 border-t border-neutral-100">
              <span className="text-[11px] font-sans text-neutral-400 block mb-0.5">Цена с НДС</span>
              <span className="font-heading font-black text-xl sm:text-2xl text-[#262626] block mb-4 whitespace-nowrap">
  {product.price ? `${product.price} BYN` : "По запросу"}
</span>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => onAddToCart && onAddToCart(product)}
                  className="flex-1 bg-[#f5901e] hover:bg-[#e07f15] text-white font-heading font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Добавить в заказ
                </button>
                <button
  onClick={() => onOpenLeadModal(`Запрос цены: ${product.name}`)}
  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-heading font-extrabold text-xs py-3 px-3 rounded-xl uppercase tracking-wide transition-colors cursor-pointer flex items-start justify-center gap-2 leading-snug"
>
  <Info className="w-4 h-4 shrink-0 mt-0.5" />
  <span>Уточнить характеристики</span>
</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}