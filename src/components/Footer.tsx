import React from "react";
import { Helmet } from "react-helmet-async";
import { MapPin, Phone, Mail, Clock, FileText } from "lucide-react";
import Logo from "./Logo";

interface FooterProps {
  onPageChange?: (page: string) => void;
}

const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

export default function Footer({ onPageChange }: FooterProps) {
  const currentYear = new Date().getFullYear();

  // ---------- Schema.org: LocalBusiness ----------
  // Ставится один раз для всего сайта (Footer рендерится на каждой странице),
  // а не на отдельных страницах товаров/категорий — так поисковик не увидит
  // дублей одной и той же организации на сотнях URL.
  // ВАЖНО: путь к логотипу указан как "/logo.png" — поправьте на реальный
  // путь к файлу логотипа в вашем проекте (обычно что-то в /public).
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    name: "ООО «БелТехКомпания»",
    image: `${SITE_ORIGIN}/logo.png`,
    logo: `${SITE_ORIGIN}/logo.png`,
    url: SITE_ORIGIN,
    email: "beltehcompany@mail.ru",
    telephone: "+375333594465",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Свердлова, 5",
      addressLocality: "Ивацевичи",
      addressRegion: "Брестская область",
      addressCountry: "BY",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Брестская область" },
      { "@type": "AdministrativeArea", name: "Гродненская область" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "13:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "14:00",
        closes: "17:00",
      },
    ],
  };

  return (
    <footer id="app-footer" className="bg-[#111111] text-neutral-300 py-10 border-t border-neutral-800">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(localBusinessJsonLd)}</script>
      </Helmet>
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-8">

        {/* Main Footer 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">

          {/* Column 1: Company Logo & Info */}
          <div className="space-y-3">
            <div className="h-6 flex items-center">
              <Logo showText={true} darkText={false} />
            </div>
            <p className="font-sans text-xs text-neutral-400 leading-relaxed pt-1">
              Профессиональный электромонтаж, прокладка силовых кабелей, установка электрокотлов и монтаж инженерных систем.
            </p>
          </div>

          {/* Column 2: Address & Multi-line Schedule */}
<div className="space-y-3">
  <div className="h-6 flex items-center">
    <h4 className="font-heading font-black text-xs uppercase tracking-widest text-[#f5901e] flex items-center gap-2">
      <MapPin className="w-4 h-4 text-[#f5901e]" />
      <span>Адрес</span>
    </h4>
  </div>
  <div className="text-xs sm:text-sm font-sans space-y-2 pt-1">
    <p className="font-heading font-bold text-white text-sm leading-tight">
      г. Ивацевичи, ул. Свердлова, 5
    </p>
    <div className="space-y-1 text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
      <div className="flex items-center gap-1.5 font-medium text-neutral-300">
        <Clock className="w-3.5 h-3.5 text-[#f5901e] shrink-0" />
        <span>Пн-Пт: 9:00 – 17:00</span>
      </div>
      <div className="pl-5 text-neutral-400">
        Обед: 13:00 – 14:00
      </div>
      <div className="pl-5 text-neutral-500 font-medium">
        Сб: выходной
      </div>
      <div className="pl-5 text-neutral-500 font-medium">
        Вс: выходной
      </div>
    </div>
  </div>
</div>

          {/* Column 3: Contacts */}
          <div className="space-y-3">
            <div className="h-6 flex items-center">
              <h4 className="font-heading font-black text-xs uppercase tracking-widest text-[#f5901e] flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#f5901e]" />
                <span>Контакты</span>
              </h4>
            </div>
            <div className="text-xs sm:text-sm font-sans space-y-2 text-neutral-300 pt-1">
              <p className="flex items-center gap-2">
                <span className="bg-[#e30613] text-white font-heading font-bold text-[10px] px-1.5 py-0.5 rounded uppercase shrink-0">
                  МТС
                </span>
                <a href="tel:+375333594465" className="font-bold text-white hover:text-[#f5901e] transition-colors">
                  +375 33 359-44-65
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="bg-[#0088cc] text-white font-heading font-bold text-[10px] px-1.5 py-0.5 rounded uppercase shrink-0">
                  life:)
                </span>
                <a href="tel:+375257640654" className="font-bold text-white hover:text-[#f5901e] transition-colors">
                  +375 25 764-06-54
                </a>
              </p>
              <p className="text-neutral-400 text-xs">
                тел/факс: <a href="tel:80164593076" className="text-white hover:text-[#f5901e] transition-colors">801645 9-30-76</a>
              </p>
              <p className="flex items-center gap-1.5 text-neutral-400 text-xs pt-0.5">
                <Mail className="w-3.5 h-3.5 text-[#f5901e] shrink-0" />
                <a href="mailto:beltehcompany@mail.ru" className="text-white hover:text-[#f5901e] transition-colors">
                  beltehcompany@mail.ru
                </a>
              </p>
            </div>
          </div>

         {/* Column 4: Legal Info */}
<div className="space-y-3">
  <div className="h-6 flex items-center">
    <h4 className="font-heading font-black text-xs uppercase tracking-widest text-[#f5901e] flex items-center gap-2">
      <FileText className="w-4 h-4 text-[#f5901e]" />
      <span>Юридическая информация</span>
    </h4>
  </div>
  <div className="text-xs font-sans space-y-1.5 text-neutral-300 leading-relaxed pt-1">
    <p className="text-white">УНП: <strong className="text-white font-bold">290506525</strong></p>
    <p className="text-neutral-400 text-[11px]">
      Регистрация в Торговом реестре Республики Беларусь
    </p>
    <p className="text-white pt-1">
      Регистрационный № БелГИЭ: <strong className="text-white font-bold text-[11px] break-all">SI1134621D235R307014ID219135260925</strong>
    </p>
    <p className="text-neutral-400 text-[11px]">
      Сайт зарегистрирован в Государственном реестре информационных сетей, систем и ресурсов РБ (02.10.2026)
    </p>
  </div>
</div>

        </div>

        {/* Bottom Bar Divider & Copyright */}
        <div className="pt-6 border-t border-neutral-800 text-center text-xs font-sans text-neutral-400">
          <p>© {currentYear} ООО «БелТехКомпания». Все права защищены.</p>
        </div>

      </div>
    </footer>
  );
}