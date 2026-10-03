import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Catalog from "./components/Catalog";
import ProductPage from "./components/ProductPage";
import AboutUs from "./components/AboutUs";
import Contacts from "./components/Contacts";
import Footer from "./components/Footer";
import LeadModal from "./components/LeadModal";
import InteractiveFeatures from "./components/InteractiveFeatures";
import Cart, { CartItem } from "./components/Cart";
import CartPage from "./components/CartPage";
import { PriceItem, Service } from "./types";
import { SERVICES as INITIAL_SERVICES, PRICE_ITEMS } from "./data";

function pageToPath(page: string): string {
  if (page === "home") return "/";
  return `/${page}`;
}
function pathToPage(pathname: string): string {
  if (pathname === "/") return "home";
  const seg = pathname.split("/")[1];
  return seg || "home";
}

// Экспортируем именованно — это то, что импортирует src/entry-server.tsx
// для пререндера (SSR-сборка не должна тянуть за собой BrowserRouter,
// который завязан на window.history и на сервере не работает).
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  // Ключ «страницы» для анимации и сброса скролла.
  // /catalog и /catalog/любая-категория — это одна страница (каталог),
  // поэтому переключение категорий не должно ни перерисовывать всё, ни
  // прокручивать наверх. Карточка товара — отдельная страница.
  const segments = location.pathname.split("/").filter(Boolean);
  const isProductPage = segments[0] === "catalog" && segments.length >= 3;
  const transitionKey = isProductPage ? location.pathname : (segments[0] ?? "home");

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState("");
  const [triggerPriceModal, setTriggerPriceModal] = useState(false);
  const [customLeadMessage, setCustomLeadMessage] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [services] = useState<Service[]>(INITIAL_SERVICES);

  // Уведомление «товар добавлен в корзину»
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const products = PRICE_ITEMS;

  const [cart, setCart] = useState<CartItem[]>(() => {
    // ВАЖНО: этот инициализатор выполняется и на клиенте, и (при пререндере)
    // на сервере в Node — там localStorage не существует. Раньше падало.
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("beltech_cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const imagesToPreload: string[] = [];
    INITIAL_SERVICES.forEach((s) => {
      if (s.image) imagesToPreload.push(s.image);
      if (s.media) s.media.forEach((m) => { if (m.url) imagesToPreload.push(m.url); });
    });
    Array.from(new Set(imagesToPreload)).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("beltech_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.removeItem("beltech_services");
    localStorage.removeItem("beltech_products");
  }, []);

  // Скролл вверх только при смене страницы (раздел / карточка товара),
  // а не при смене категории внутри каталога.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [transitionKey]);

  // Автоскрытие уведомления через 2.5 секунды
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleOpenLeadModal = (serviceOrMessage?: string) => {
    if (serviceOrMessage) {
      if (serviceOrMessage.startsWith("Заявка с")) {
        setCustomLeadMessage(serviceOrMessage);
        setSelectedServiceForModal("");
      } else {
        setSelectedServiceForModal(serviceOrMessage);
        setCustomLeadMessage("");
      }
    } else {
      setSelectedServiceForModal("Электромонтажные работы");
      setCustomLeadMessage("");
    }
    setIsLeadModalOpen(true);
  };

  const handleAddToCart = (item: PriceItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.product.id === item.id);
      if (existing) {
        return prev.map((ci) => ci.product.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { product: item, quantity: 1 }];
    });
    setToast({ id: Date.now(), text: `«${item.name}» добавлен в корзину` });
  };

  const handleUpdateQuantity = (productId: string, delta: number, exactQty?: number) => {
    setCart((prev) => prev
      .map((ci) => {
        if (ci.product.id === productId) {
          const newQty = exactQty !== undefined ? exactQty : ci.quantity + delta;
          return { ...ci, quantity: Math.max(0, newQty) };
        }
        return ci;
      })
      .filter((ci) => ci.quantity > 0));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((ci) => ci.product.id !== productId));
  };

  const handleClearCart = () => setCart([]);

  const totalCartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const currentPage = pathToPage(location.pathname);

  const wrapperBg = "bg-[#f6f6f4]";

  return (
    <div
      id="site-content"
      className={`min-h-screen ${wrapperBg} text-[#262626] font-sans antialiased selection:bg-[#f5901e]/30 selection:text-[#262626] flex flex-col justify-between`}
    >
      <div>
        <Header
          onOpenLeadModal={handleOpenLeadModal}
          currentPage={currentPage}
          onPageChange={(page: string) => navigate(pageToPath(page))}
          cartItemsCount={totalCartCount}
          onOpenCart={() => navigate("/cart")}
        />
        <main className="w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={transitionKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <div className="flex flex-col">
                      <Hero
                        onOpenLeadModal={handleOpenLeadModal}
                        onPageChange={(p: string) => navigate(pageToPath(p))}
                      />
                      <InteractiveFeatures onOpenLeadModal={handleOpenLeadModal} />
                    </div>
                  }
                />
                <Route path="/services" element={<Services onOpenLeadModal={handleOpenLeadModal} services={services} />} />

                <Route
                  path="/catalog"
                  element={
                    <Catalog
                      onOpenLeadModal={handleOpenLeadModal}
                      priceItems={products}
                      onAddToCart={handleAddToCart}
                      openPriceModalDirectly={triggerPriceModal}
                      onClosePriceModalDirectly={() => setTriggerPriceModal(false)}
                    />
                  }
                />
                <Route
                  path="/catalog/:subcategorySlug"
                  element={
                    <Catalog
                      onOpenLeadModal={handleOpenLeadModal}
                      priceItems={products}
                      onAddToCart={handleAddToCart}
                      openPriceModalDirectly={triggerPriceModal}
                      onClosePriceModalDirectly={() => setTriggerPriceModal(false)}
                    />
                  }
                />
                <Route
                  path="/catalog/:subcategorySlug/:productSlug"
                  element={
                    <ProductPage
                      priceItems={products}
                      onOpenLeadModal={handleOpenLeadModal}
                      onAddToCart={handleAddToCart}
                    />
                  }
                />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contacts" element={<Contacts onOpenLeadModal={handleOpenLeadModal} />} />
                <Route
                  path="/cart"
                  element={
                    <CartPage
                      cartItems={cart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveFromCart={handleRemoveFromCart}
                      onClearCart={handleClearCart}
                      onBack={() => navigate("/catalog")}
                      onOpenLeadModal={handleOpenLeadModal}
                    />
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Footer onPageChange={(p: string) => navigate(pageToPath(p))} />
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        initialService={selectedServiceForModal}
        customMessage={customLeadMessage}
      />

      {/* Уведомление о добавлении товара в корзину */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm bg-[#262626] text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3"
            style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <span className="w-7 h-7 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[3]" />
            </span>
            <span className="flex-1 text-xs sm:text-sm font-sans leading-snug">{toast.text}</span>
            <button
              onClick={() => {
                setToast(null);
                navigate("/cart");
              }}
              className="shrink-0 text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#f5901e] hover:text-[#ff9f2e] cursor-pointer"
            >
              В корзину
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </HelmetProvider>
  );
}