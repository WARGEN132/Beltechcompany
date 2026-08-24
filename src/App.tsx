import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
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

// Соответствие "логическая страница" <-> URL, чтобы Header/Footer не переписывать —
// они по-прежнему получают currentPage:string и вызывают onPageChange(page:string).
function pageToPath(page: string): string {
  if (page === "home") return "/";
  return `/${page}`;
}
function pathToPage(pathname: string): string {
  if (pathname === "/") return "home";
  const seg = pathname.split("/")[1];
  return seg || "home";
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState("");
  const [triggerPriceModal, setTriggerPriceModal] = useState(false);
  const [customLeadMessage, setCustomLeadMessage] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [services] = useState<Service[]>(INITIAL_SERVICES);

  // PRICE_ITEMS уже посчитан один раз при загрузке data.ts — повторно не пересчитываем.
  const products = PRICE_ITEMS;

  const [cart, setCart] = useState<CartItem[]>(() => {
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

  // Фон обёртки сайта теперь всегда одного цвета — никакого переключения
  // между тёмным/светлым в момент перехода, а значит нечему мигать.
  // Тёмный фон на главной странице рисует сам компонент Hero своей секцией.
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
          onOpenCart={() => { window.scrollTo(0, 0); navigate("/cart"); }}
        />
        <main className="w-full">
          {/* Единый переход НА ЛЮБУЮ навигацию — раздел сайта, подкатегория, товар,
              всё едино через key={location.pathname}. Никаких отдельных локальных
              анимаций появления контента в Catalog.tsx/ProductPage.tsx больше нет —
              это единственный слой анимации, отсюда одинаковая плавность везде. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
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
                      <Hero onOpenLeadModal={handleOpenLeadModal} onPageChange={(p: string) => navigate(pageToPath(p))} />
                      <InteractiveFeatures onOpenLeadModal={handleOpenLeadModal} />
                    </div>
                  }
                />
                <Route path="/services" element={<Services onOpenLeadModal={handleOpenLeadModal} services={services} />} />

                {/* Каталог: 2 уровня URL (подкатегория, товар) — категорий больше нет */}
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
                      onBack={() => { navigate("/catalog"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      onOpenLeadModal={handleOpenLeadModal}
                    />
                  }
                />

                {/* Неизвестный путь -> на главную */}
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