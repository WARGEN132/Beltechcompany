import React, { useState } from "react";
import { ZoomIn, X, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence, Variants } from "motion/react";

// Добавлено as const, чтобы TS вывел тип кортежа [number, number, number, number]
const transitionEase = [0.215, 0.61, 0.355, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: transitionEase,
    },
  },
};

const certCardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
    },
  },
};

interface Certificate {
  title: string;
  issuer: string;
  image?: string;
  regDate?: string;
  details?: {
    category: string;
    items: string[];
  }[];
}

export default function AboutUs() {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const certificates: Certificate[] = [
    {
      title: "Свидетельство о государственной регистрации",
      issuer: "Брестский областной исполнительный комитет",
      image: "/svidetelstvo-registracii.jpg",
    },
    {
      title: "Свидетельство о технической компетентности",
      issuer: "РУП «СТРОЙТЕХНОРМ»",
      image: "/svidetelstvo-registracii.jpg",
    },
    {
      title: "Аттестат соответствия (Водоснабжение и канализация)",
      issuer: "Министерство архитектуры и строительства РБ",
      regDate: "24.07.2026",
      details: [
        {
          category: "7.8. Монтаж внутренних инженерных систем зданий и сооружений:",
          items: [
            "7.8.1. Монтаж систем водоснабжения, за исключением устройства пожарных кранов на автоматических установках пожаротушения;",
            "7.8.2. Монтаж систем канализации и водостоков;",
          ],
        },
        {
          category: "7.9. Монтаж наружных инженерных сетей и сооружений:",
          items: ["7.9.1. Монтаж сетей водоснабжения и канализации."],
        },
      ],
    },
    {
      title: "Аттестат соответствия № 0017824-СТ",
      issuer: "Министерство архитектуры и строительства Республики Беларусь",
      image: "/attestat-sootvetstviya.jpg",
    },
    {
      title: "Сертификат официального представителя",
      issuer: "ОАО «Завод Промбурвод» / ГМС ГРУППА",
      image: "/сертификат компании.png",
    },
  ];

  return (
    <section id="about" className="py-16 sm:py-24 bg-white text-[#262626] overflow-hidden relative flex flex-col justify-center">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10 w-full"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Title */}
        <motion.div variants={itemVariants} className="mb-10 sm:mb-12">
          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#262626] tracking-tight leading-tight">
            ООО «БелТехКомпания»
            <span className="block text-[#f5901e] my-1 uppercase">надежный партнер</span>
            <span className="uppercase">в электромонтаже, отоплении, вентиляции и канализации</span>
          </h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: transitionEase, delay: 0.3 }}
            className="w-24 h-1.5 bg-[#f5901e] mt-4 rounded-full origin-left" 
          />
        </motion.div>

        {/* Photo + Description Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center mb-14">
          {/* Photo Left */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-6 relative"
          >
            <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-neutral-200/90 bg-neutral-900 group">
              <img
                src="/aboutus.avif"
                alt="Инженерные работы: электромонтаж, отопление, вентиляция, канализация"
                className="w-full h-[320px] sm:h-[400px] lg:h-[440px] object-cover opacity-95 group-hover:scale-105 transition-transform duration-700"
                loading="eager"
                decoding="async"
              />
            </div>
          </motion.div>

          {/* Description Text Right */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-6 flex flex-col justify-center space-y-4"
          >
            <p className="font-sans text-neutral-700 text-base sm:text-lg md:text-xl leading-relaxed font-normal">
              Мы — динамично развивающаяся компания из г. Ивацевичи, объединяющая профессиональный инженерный электромонтаж, монтаж и сервисное обслуживание систем отопления, вентиляции и канализации, а также собственную розничную сеть материалов и оборудования.
            </p>
            <p className="font-sans text-neutral-600 text-base sm:text-lg leading-relaxed font-normal">
              Выполняем полный комплекс инженерных и строительно-монтажных работ «под ключ» (электрика, отопление, вентиляция, водоснабжение и канализация) с гарантийным обслуживанием и официальной исполнительной документацией.
            </p>
          </motion.div>
        </div>

        {/* Certificates Section Centered */}
        <motion.div variants={itemVariants} className="mb-8 pt-8 border-t border-neutral-200">
          <div className="text-center mb-8">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl uppercase tracking-tight text-[#262626]">
              Сертификаты и дилерские соглашения
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Официальный статус и подтвержденная квалификация в сфере электромонтажа, отопления, вентиляции и канализации
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {certificates.map((cert, index) => (
              <motion.div
                key={index}
                variants={certCardVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCertificate(cert)}
                className="group relative bg-[#f8f8f6] border border-neutral-200/90 hover:border-[#f5901e] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-colors cursor-pointer flex flex-col w-full"
              >
                {/* Image Wrap or Text Placeholder */}
                <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden flex items-center justify-center p-2">
                  {cert.image ? (
                    <img
                      src={cert.image}
                      alt={cert.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 text-neutral-400 group-hover:text-neutral-200 transition-colors">
                      <FileText className="w-10 h-10 text-[#f5901e] mb-2" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                        Реестр
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-sm cursor-pointer">
                    <ZoomIn className="w-5 h-5 text-[#f5901e]" />
                    <span>Подробнее</span>
                  </div>
                </div>

                {/* Info Centered */}
                <div className="p-4 flex flex-col items-center text-center flex-grow justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#f5901e] uppercase tracking-wider mb-1 block">
                      {cert.issuer}
                    </span>
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-[#262626] group-hover:text-[#f5901e] transition-colors leading-snug">
                      {cert.title}
                    </h4>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedCertificate(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center cursor-pointer overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col cursor-default my-auto"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-white">
                <div>
                  <span className="text-xs font-bold text-[#f5901e] uppercase tracking-wider block">
                    {selectedCertificate.issuer}
                  </span>
                  <h3 className="font-heading font-extrabold text-base sm:text-lg">
                    {selectedCertificate.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Certificate Image or Text View */}
              <div className="p-4 sm:p-6 flex items-center justify-center bg-neutral-950 overflow-hidden">
                {selectedCertificate.image ? (
                  <img
                    src={selectedCertificate.image}
                    alt={selectedCertificate.title}
                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-neutral-800"
                  />
                ) : (
                  <div className="w-full text-white p-2 sm:p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {selectedCertificate.regDate && (
                      <div className="inline-flex items-center gap-2 bg-[#f5901e]/10 border border-[#f5901e]/30 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-[#f5901e]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Зарегистрирован в реестре аттестатов соответствия: <strong>{selectedCertificate.regDate}</strong></span>
                      </div>
                    )}

                    <div className="space-y-4 mt-2">
                      <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2">
                        Разрешённые виды строительно-монтажных работ:
                      </p>

                      {selectedCertificate.details?.map((section, idx) => (
                        <div key={idx} className="space-y-2">
                          <h4 className="text-sm font-bold text-neutral-200">{section.category}</h4>
                          <ul className="space-y-1.5 pl-3 border-l-2 border-[#f5901e]">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}