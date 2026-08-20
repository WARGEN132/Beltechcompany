import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, ExternalLink, Calendar, Copy, Check } from "lucide-react";
import { motion, Variants } from "motion/react";

interface ContactsProps {
  onOpenLeadModal: (serviceName?: string) => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Contacts({ onOpenLeadModal }: ContactsProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <section id="contacts" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#262626] tracking-tight leading-none mb-4">
            Как нас найти и связаться
          </h2>
          <div className="w-16 h-1 bg-[#f5901e] mx-auto mb-6 rounded-full" />
          <p className="font-sans text-neutral-600 text-sm sm:text-base leading-relaxed">
            Свяжитесь с нами удобным способом, посетите наш магазин в Ивацевичах или отправьте заявку на расчёт стоимости прямо сейчас.
          </p>
        </div>

        {/* 2-Card Contacts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-12">

          {/* Card 1: Requisites & Info */}
          <motion.div
            id="contact-card-requisites"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="bg-[#f6f6f4] rounded-[10px] p-6 sm:p-8 border border-neutral-100 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#262626] uppercase tracking-tight mb-6 pb-3 border-b border-neutral-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f5901e]" />
                Контактные данные
              </h3>

              <div className="space-y-6">
                {/* Main Phone */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#f5901e]/10 p-2.5 rounded-lg text-[#f5901e] mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                      Электромонтаж
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href="tel:+375333594465"
                        className="font-heading font-black text-lg sm:text-xl text-[#262626] hover:text-[#f5901e] transition-colors"
                      >
                        +375 33 359-44-65
                      </a>
                      <button
                        onClick={() => handleCopy("+375333594465", "phone1")}
                        className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer transition-colors"
                        title="Копировать"
                        aria-label="Скопировать телефон"
                      >
                        {copiedText === "phone1" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* life:) Phone */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#0088cc]/10 p-2.5 rounded-lg text-[#0088cc] mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                      Магазин
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href="tel:+375257640654"
                        className="font-heading font-black text-lg sm:text-xl text-[#262626] hover:text-[#f5901e] transition-colors"
                      >
                        +375 25 764-06-54
                      </a>
                      <button
                        onClick={() => handleCopy("+375257640654", "phone2")}
                        className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer transition-colors"
                        title="Копировать"
                        aria-label="Скопировать телефон магазина"
                      >
                        {copiedText === "phone2" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tel/Fax */}
                <div className="flex items-start gap-4">
                  <div className="bg-neutral-200/60 p-2.5 rounded-lg text-neutral-600 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                      Тел / Факс офиса
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href="tel:+375164593076"
                        className="font-heading font-bold text-base text-[#262626] hover:text-[#f5901e] transition-colors"
                      >
                        8 (01645) 9-30-76
                      </a>
                      <button
                        onClick={() => handleCopy("+375164593076", "fax")}
                        className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer transition-colors"
                        title="Копировать"
                        aria-label="Скопировать факс"
                      >
                        {copiedText === "fax" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="bg-neutral-200/60 p-2.5 rounded-lg text-neutral-600 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                      Электронная почта
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href="mailto:beltehcompany@mail.ru"
                        className="font-sans font-bold text-base text-[#262626] hover:text-[#f5901e] transition-colors"
                      >
                        beltehcompany@mail.ru
                      </a>
                      <button
                        onClick={() => handleCopy("beltehcompany@mail.ru", "email")}
                        className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer transition-colors"
                        title="Копировать"
                        aria-label="Скопировать email"
                      >
                        {copiedText === "email" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-200 flex flex-wrap gap-4 justify-between items-center text-xs text-neutral-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[#f5901e]" />
                График офиса: Пн–Пт 9:00–17:00 (обед 13:00–14:00)
              </span>
              <span className="font-semibold text-emerald-600">ООО «БелТехКомпания»</span>
            </div>
          </motion.div>

          {/* Card 2: Address on Orange Background */}
          <motion.div
            id="contact-card-address"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#f5901e] to-[#e07f15] text-white rounded-[10px] p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-[#f5901e]/15 relative overflow-hidden group"
          >
            {/* Background element */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-xl group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

            <div className="relative z-10">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white uppercase tracking-tight mb-6 pb-3 border-b border-white/20 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-white" />
                Адрес и Магазин
              </h3>

              <div className="space-y-6">
                <div>
                  <p className="font-sans text-[11px] text-white/80 uppercase tracking-wider font-semibold">
                    Наш физический адрес
                  </p>
                  <p className="font-heading font-black text-xl sm:text-2xl text-white mt-1.5 leading-tight">
                    г. Ивацевичи, ул. Свердлова, 5
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-lg border border-white/10 backdrop-blur-xs">
                  <h4 className="font-heading font-bold text-xs uppercase text-white mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-white" />
                    Режим работы
                  </h4>
                  <ul className="font-sans text-xs space-y-1 text-white/95">
                    <li className="flex justify-between border-b border-white/5 pb-1">
                      <span>Понедельник — Пятница:</span>
                      <span className="font-semibold">9:00 – 17:00</span>
                    </li>
                    <li className="flex justify-between border-b border-white/5 pb-1">
                      <span>Обед: </span>
                      <span className="font-semibold">13:00 – 14:00</span>
                    </li>
                    <li className="flex justify-between pt-1">
                      <span>Суббота — Воскресенье:</span>
                      <span className="font-semibold bg-white/15 px-1.5 rounded-sm">Выходной</span>
                    </li>
                    
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between relative z-10">
              <a
                href="https://yandex.by/maps/?pt=25.346470,52.719359&z=17&l=map"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#f5901e] hover:bg-neutral-50 font-heading font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-[10px] shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.75)] transition-all text-center cursor-pointer active:scale-95"
              >
                <span>Открыть на карте</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                id="contact-lead-btn"
                onClick={() => onOpenLeadModal("Запрос обратной связи")}
                className="bg-[#262626] hover:bg-[#363636] text-white font-heading font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-[10px] shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(245,144,30,0.5)] text-center transition-all cursor-pointer active:scale-95"
              >
                Написать нам
              </button>
            </div>
          </motion.div>

        </div>

        {/* Map Embed with Custom Overlay Card */}
        <motion.div
  id="map-embed"
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6 }}
  className="rounded-[10px] overflow-hidden border border-neutral-200 shadow-xs relative h-[400px] sm:h-[450px]"
>
  {/* Yandex Map Iframe */}
  <iframe
    title="Карта — ООО «БелТехКомпания», г. Ивацевичи, ул. Свердлова, 5"
    src="https://yandex.ru/map-widget/v1/?ll=25.346470%2C52.719359&z=17&pt=25.346470%2C52.719359%2Cpm2rdm~25.346470%2C52.719359%2C%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%A1%D0%B2%D0%B5%D1%80%D0%B4%D0%BB%D0%BE%D0%B2%D0%B0%2C%205"
    className="absolute inset-0 w-full h-full border-0"
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    allowFullScreen
  />
</motion.div>
      </div>
    </section>
  );
}