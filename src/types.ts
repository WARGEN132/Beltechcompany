export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  poster?: string;
}

export interface Service {
  id: string;
  title: string;
  category?: string;
  description: string;
  detailedDescription: string;
  image: string;
  media?: MediaItem[];
  features: string[];
  phone?: string;
  ctaText?: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  image: string;
  category: string;
}

export interface Brand {
  name: string;
  country: string;
  description: string;
  logo?: string;
}

export interface LeadForm {
  name: string;
  phone: string;
  service: string;
  message?: string;
}

/**
 * Атрибуты товара, автоматически извлечённые из названия
 * (диаметр, стандарт, материал, покрытие, страна и т.д.)
 */
export interface ProductAttributes {
  diameter?: string;
  standard?: string;
  material?: string;
  coating?: string;
  country?: string;
  [key: string]: string | undefined;
}

export interface SeoMeta {
  title: string | null;
  description: string | null;
  h1: string;
}

/** Подкатегория каталога (categories.json) */
export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  seo: SeoMeta;
}

/** Категория верхнего уровня каталога (categories.json) */
export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  seo: SeoMeta;
  subcategories: Subcategory[];
}

/** Товар как он лежит в products.json (сырой формат) */
export interface RawProduct {
  id: string;
  name: string;
  slug: string;
  categoryIds: string[];
  image: string | null;
  price: number | null;
  oldPrice: number | null;
  inStock: boolean | null;
  brand: string | null;
  attributes: ProductAttributes;
}

export interface PriceItem {
  id: string;
  name: string;
  unit: string;
  price: string; // e.g., "от 15 BYN" или "По запросу"
  category: string;
  subcategory?: string;
  image?: string;
  description?: string;

  // --- новые поля (из categories.json / products.json), все опциональные ---
  categoryId?: string;
  subcategoryId?: string;
  brand?: string | null;
  oldPrice?: number | null;
  inStock?: boolean | null;
  attributes?: ProductAttributes;
  slug?: string; 
}