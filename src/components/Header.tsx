import React, { useState, useEffect } from "react";
import { Phone, Menu, X, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";

interface HeaderProps {
  onOpenLeadModal: (serviceName?: string) => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  cartItemsCount?: number;
  onOpenCart?: () => void;
}

export default function Header({
  onOpenLeadModal,
  currentPage,
  onPageChange,
  cartItemsCount = 0,
  onOpenCart,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Главная", page: "home" },
    { label: "Услуги", page: "services" },
    { label: "Каталог", page: "catalog" },
    { label: "О нас", page: "about" },
    { label: "Контакты", page: "contacts" }
  ];

  const handlePageClick = (page: string) => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
    onPageChange(page);
  };

  return (
    <>
      <header
        id="app-header"
        className={`sticky top-0 z-40 w-full transition-all duration-300 bg-[#f5901e] text-white ${
          isScrolled ? "shadow-md py-2" : "py-2.5 sm:py-3"
        }`}
      >
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
          {/* Адаптивные зазоры: gap-2 на планшетах, gap-4 на 1024px, gap-8 на широких мониторах */}
          <div className="flex items-center justify-between gap-2 lg:gap-4 xl:gap-8">

            {/* Logo */}
            <button
              id="header-logo"
              onClick={() => handlePageClick("home")}
              className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer text-left focus:outline-none shrink-0"
            >
              <Logo showText={true} darkText={false} />
            </button>

            {/* Desktop Navigation */}
            <nav id="desktop-nav" className="hidden lg:flex items-center justify-center gap-1 xl:gap-2.5 flex-1 min-w-0">
              {menuItems.map((item) => {
                const isActive = currentPage === item.page;
                return (
                  <button
                    key={item.page}
                    id={`nav-item-${item.page}`}
                    onClick={() => handlePageClick(item.page)}
                    className={`relative font-heading font-black text-xs xl:text-sm uppercase tracking-wider py-2 px-2.5 xl:px-3.5 rounded-xl focus:outline-none cursor-pointer whitespace-nowrap transition-colors duration-200 ${
                      isActive ? "text-white" : "text-white/90 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 bg-neutral-950 rounded-xl shadow-sm"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Desktop Controls (Phone, Cart) */}
            <div className="hidden sm:flex items-center gap-2 xl:gap-3 shrink-0">
              {/* Shopping Cart Button */}
              {onOpenCart && (
                <button
                  id="header-cart-btn"
                  onClick={onOpenCart}
                  className="h-10 xl:h-11 flex items-center gap-2 bg-neutral-900/40 hover:bg-neutral-900/70 text-white font-heading font-black text-xs uppercase tracking-wider py-2 px-3 xl:px-4 rounded-xl border border-white/25 hover:border-white/50 backdrop-blur-md transition-colors duration-200 cursor-pointer shadow-sm group whitespace-nowrap"
                  title="Открыть корзину"
                >
                  <ShoppingCart className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
                  {/* Текст "Корзина" появляется только когда хватает места (xl+) */}
                  <span className="hidden xl:inline">Корзина</span>
                  <span className={`text-[11px] font-heading font-black px-1.5 xl:px-2 py-0.5 rounded-full transition-colors ${
                    cartItemsCount > 0 ? "bg-white text-black font-black shadow-xs" : "bg-white/20 text-white/70"
                  }`}>
                    {cartItemsCount}
                  </span>
                </button>
              )}

              {/* Phone */}
              <a
                id="header-phone-btn"
                href="tel:+375333594465"
                className="h-10 xl:h-11 flex items-center gap-2 bg-neutral-900/40 hover:bg-neutral-900/70 text-white font-heading font-black text-xs uppercase tracking-wider py-2 px-3 xl:px-4 rounded-xl border border-white/25 hover:border-white/50 backdrop-blur-md transition-colors duration-200 cursor-pointer shadow-sm group whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
                <span className="text-xs xl:text-sm">+375 33 359-44-65</span>
              </a>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              {onOpenCart && (
                <button
                  id="mobile-cart-btn"
                  onClick={onOpenCart}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-neutral-900/40 text-white rounded-xl border border-white/25 backdrop-blur-md cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
                  title="Корзина"
                >
                  <ShoppingCart className="w-4 h-4 text-white" />
                  <span
                    className={`absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-heading font-black rounded-full transition-all shadow-xs ${
                      cartItemsCount > 0
                        ? "bg-white text-neutral-950 scale-100"
                        : "bg-neutral-950/80 text-white/70 text-[9px]"
                    }`}
                  >
                    {cartItemsCount}
                  </span>
                </button>
              )}

              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden sticky top-[56px] sm:top-[64px] z-30 w-full bg-[#f5901e] shadow-xl overflow-hidden text-white"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                {menuItems.map((item) => {
                  const isActive = currentPage === item.page;
                  return (
                    <button
                      key={item.page}
                      id={`mobile-nav-item-${item.page}`}
                      onClick={() => handlePageClick(item.page)}
                      className={`w-full text-left font-heading font-bold uppercase tracking-wider text-base py-3 px-3 rounded-xl transition-all ${
                        isActive ? "bg-neutral-950 text-[#f5901e] font-black pl-4" : "hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 flex flex-col gap-2.5">
                <a
                  id="mobile-phone-link"
                  href="tel:+375333594465"
                  className="flex items-center justify-center gap-2 bg-neutral-950 text-white font-heading font-bold py-3 px-4 rounded-xl shadow-sm"
                >
                  <Phone className="w-4 h-4 text-[#f5901e]" />
                  <span className="text-sm">+375 33 359-44-65</span>
                </a>
                <button
                  id="mobile-cta-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLeadModal();
                  }}
                  className="w-full bg-white text-neutral-950 hover:bg-neutral-50 font-heading font-bold py-3 px-4 rounded-xl transition-colors shadow-sm cursor-pointer text-center uppercase tracking-wider text-xs"
                >
                  Оставить заявку
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}