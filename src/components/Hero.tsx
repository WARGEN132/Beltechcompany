import React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onOpenLeadModal: (serviceName?: string) => void;
  onPageChange: (page: string) => void;
}

export default function Hero({ onOpenLeadModal, onPageChange }: HeroProps) {
  const handleCatalogRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    onPageChange("catalog");
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <section
      id="hero-section"
      /*
        - items-start вместо items-center смещает контент вверх.
        - pt-16 sm:pt-24 lg:pt-14 подбирает верстку выше на ПК, оставляя место под шапку.
      */
      className="relative min-h-[85vh] sm:min-h-[90vh] xl:min-h-[92vh] flex items-start justify-start overflow-hidden bg-[#111111] text-white pt-16 sm:pt-24 lg:pt-14 pb-10 sm:pb-16 xl:pb-20"
    >
      {/* Background Image - Bright, Vivid, Fully Visible */}
      <div className="absolute inset-0 z-0 bg-[#111111]">
        <img
          src="images/main.jpg"
          alt="Электромонтажные работы и спецтехника ООО БелТехКомпания"
          className="w-full h-full object-cover object-center select-none opacity-80 filter brightness-105 contrast-110 scale-105"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          referrerPolicy="no-referrer"
        />
        {/* Subtle orange ambient accent glow */}
        <div className="absolute -top-32 -left-32 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-[#f5901e]/20 blur-3xl pointer-events-none" />

        {/* Clean Vignette & Gradient for readable text while leaving image clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/80 to-neutral-950/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-neutral-950/60 z-10" />
      </div>

      <div className="relative z-20 max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 w-full">
        <div className="max-w-3xl lg:max-w-4xl 2xl:max-w-5xl">

          {/* Large Heading - Адаптированы размеры под мобилку */}
          <motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 }}
  className="font-heading font-black text-xl xs:text-2xl sm:text-4xl lg:text-5xl 2xl:text-6xl tracking-tight uppercase leading-[1.25] sm:leading-[1.2] mb-6 sm:mb-8 lg:mb-10 text-white drop-shadow-xl break-words"
>
  Электромонтажные работы <br />
  Монтаж системы водоснабжения и канализации <br />
  Монтаж системы отопления и вентиляции <br />
  <span className="text-[#f5901e] drop-shadow-[0_0_25px_rgba(245,144,30,0.85)] inline-block mt-1 sm:mt-2">
    в Ивацевичах
  </span>
</motion.h1>
          {/* Action Buttons with Glowing Shadows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 lg:gap-6 mb-8 sm:mb-10 lg:mb-14"
          >
            <button
              id="hero-catalog-btn"
              onClick={handleCatalogRedirect}
              className="flex items-center justify-center gap-2.5 bg-[#f5901e] hover:bg-[#e07f15] text-white font-heading font-extrabold text-sm sm:text-base lg:text-lg tracking-wider uppercase py-3.5 sm:py-[1.125rem] px-6 sm:px-8 lg:px-10 rounded-xl shadow-[0_0_25px_rgba(245,144,30,0.5)] hover:shadow-[0_0_40px_rgba(245,144,30,0.8)] transition-all duration-300 active:scale-95 cursor-pointer group"
            >
              <span>Смотреть каталог</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 shrink-0" />
            </button>
            <button
              id="hero-lead-btn"
              onClick={() => onOpenLeadModal()}
              className="flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-100 text-neutral-900 font-heading font-extrabold text-sm sm:text-base lg:text-lg tracking-wider uppercase py-3.5 sm:py-[1.125rem] px-6 sm:px-8 lg:px-10 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_40px_rgba(255,255,255,0.7)] transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span>Оставить заявку</span>
            </button>
          </motion.div>

          {/* Quick Stats Banner with Glowing Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pt-6 sm:pt-8 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-10"
          >
            <div>
              <p className="font-heading font-black text-xl xs:text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl text-[#f5901e] drop-shadow-[0_0_18px_rgba(245,144,30,0.85)]">
                5 лет
              </p>
              <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-200 font-sans uppercase tracking-wider font-bold mt-1">
                Гарантия на монтаж
              </p>
            </div>
            <div>
              <p className="font-heading font-black text-xl xs:text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl text-[#f5901e] drop-shadow-[0_0_18px_rgba(245,144,30,0.85)]">
                100%
              </p>
              <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-200 font-sans uppercase tracking-wider font-bold mt-1">
                ПРАВИЛА ПУЭ И СНИП
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-heading font-black text-lg xs:text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl text-[#f5901e] drop-shadow-[0_0_18px_rgba(245,144,30,0.85)] truncate">
                Ивацевичи
              </p>
              <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-200 font-sans uppercase tracking-wider font-bold mt-1">
                Быстрый выезд
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}