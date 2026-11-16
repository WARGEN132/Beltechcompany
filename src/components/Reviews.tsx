import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Star, MessageSquarePlus, ExternalLink } from "lucide-react";
import { motion, Variants } from "motion/react";


export interface Review {
  id: string;
  name: string;
  service: string;
  rating: number; // 1–5
  date: string; // ГГГГ-ММ-ДД
  text: string;
  reply?: string; // ответ компании
}

interface ReviewsProps {
  onOpenLeadModal: (serviceName?: string) => void;
}

// ID организации в Яндекс Картах (тот же, что в адресе кабинета yandex.ru/sprav/<ID>/...)
const YANDEX_ORG_ID = "86225383889";
const YANDEX_REVIEWS_URL = `https://yandex.ru/maps/org/${YANDEX_ORG_ID}/reviews/`;
// Официальный виджет отзывов Яндекс Карт (работает при ширине 300–760 px)
const YANDEX_WIDGET_URL = `https://yandex.ru/maps-reviews-widget/${YANDEX_ORG_ID}?comments`;

const REVIEWS: Review[] = [];

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

// Ручное форматирование, чтобы SSR (prerender) и браузер давали одинаковый результат
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 100;
  const b = n % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b > 1 && b < 5) return few;
  return many;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Stars({ value, size = "w-4 h-4", onDark = false }: { value: number; size?: string; onDark?: boolean }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`Оценка ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${
            i <= Math.round(value)
              ? onDark ? "fill-white text-white" : "fill-[#f5901e] text-[#f5901e]"
              : onDark ? "text-white/40" : "text-neutral-300"
          }`}
        />
      ))}
    </span>
  );
}

export default function Reviews({ onOpenLeadModal }: ReviewsProps) {
  const [filter, setFilter] = useState<string>("Все");

  const total = REVIEWS.length;
  const average = total ? REVIEWS.reduce((s, r) => s + r.rating, 0) / total : 0;

  const services = useMemo(
    () => ["Все", ...Array.from(new Set(REVIEWS.map((r) => r.service)))],
    []
  );

  const visible = useMemo(
    () =>
      REVIEWS.filter((r) => filter === "Все" || r.service === filter).sort((a, b) =>
        b.date.localeCompare(a.date)
      ),
    [filter]
  );

  return (
    <section id="reviews" className="py-20 bg-white">
      <Helmet>
        <title>Отзывы клиентов — ООО «БелТехКомпания», Ивацевичи</title>
        <meta
          name="description"
          content="Отзывы клиентов ООО «БелТехКомпания»: электромонтаж, отопление, водоснабжение и услуги спецтехники в Ивацевичах и области."
        />
        <link rel="canonical" href="https://белтехкомпания.бел/reviews" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#262626] tracking-tight leading-none mb-4">
            Отзывы наших клиентов
          </h2>
          <div className="w-16 h-1 bg-[#f5901e] mx-auto mb-6 rounded-full" />
         
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Summary card (orange, как карточка «Адрес и Магазин») */}
          <motion.div
            id="reviews-summary"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:sticky lg:top-24 bg-gradient-to-br from-[#f5901e] to-[#e07f15] text-white rounded-[10px] p-6 sm:p-8 shadow-lg shadow-[#f5901e]/15 relative overflow-hidden group"
          >
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-xl group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

            <div className="relative z-10">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white uppercase tracking-tight mb-6 pb-3 border-b border-white/20 flex items-center gap-2">
                <Star className="w-5 h-5 text-white" />
                Общая оценка
              </h3>

              {total > 0 ? (
                <>
                  <div className="flex items-end gap-4 mb-6">
                    <span className="font-heading font-black text-6xl leading-none">
                      {average.toFixed(1).replace(".", ",")}
                    </span>
                    <div className="pb-1">
                      <Stars value={average} size="w-5 h-5" onDark />
                      <p className="font-sans text-xs text-white/85 mt-1.5">
                        {total} {plural(total, "отзыв", "отзыва", "отзывов")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 p-4 rounded-lg border border-white/10 backdrop-blur-xs space-y-2 mb-6">
                    {[5, 4, 3, 2, 1].map((k) => {
                      const count = REVIEWS.filter((r) => r.rating === k).length;
                      return (
                        <div key={k} className="flex items-center gap-3 font-sans text-xs text-white/95">
                          <span className="w-4 font-semibold">{k}</span>
                          <span className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                            <span
                              className="block h-full bg-white rounded-full"
                              style={{ width: `${(count / total) * 100}%` }}
                            />
                          </span>
                          <span className="w-5 text-right font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="font-sans text-sm text-white/90 mb-6 leading-relaxed">
                  Отзывы наших клиентов собраны на Яндекс Картах — рейтинг и свежие оценки смотрите в блоке рядом. Там же можно оставить свой отзыв.
                </p>
              )}

              <div className="flex flex-col gap-3">
                <a
                  id="reviews-yandex-btn"
                  href={YANDEX_REVIEWS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#f5901e] hover:bg-neutral-50 font-heading font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-[10px] shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.75)] transition-all text-center cursor-pointer active:scale-95"
                >
                  <span>Оставить отзыв на Яндексе</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  id="reviews-leave-btn"
                  onClick={() => onOpenLeadModal("Отзыв о работе компании")}
                  className="inline-flex items-center justify-center gap-2 bg-[#262626] hover:bg-[#363636] text-white font-heading font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-[10px] shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(245,144,30,0.5)] text-center transition-all cursor-pointer active:scale-95"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Написать нам напрямую</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Reviews list */}
          <div className="lg:col-span-2">
            {services.length > 2 && (
              <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Фильтр по услуге">
                {services.map((s) => {
                  const active = s === filter;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      aria-pressed={active}
                      className={`font-heading font-black text-xs uppercase tracking-wider py-2 px-3.5 rounded-xl cursor-pointer whitespace-nowrap transition-colors duration-200 border ${
                        active
                          ? "bg-neutral-950 text-white border-neutral-950"
                          : "bg-[#f6f6f4] text-[#262626] border-neutral-200 hover:border-[#f5901e] hover:text-[#f5901e]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            {visible.length === 0 ? null : (
              <div className="space-y-5">
                {visible.map((r) => (
                  <motion.article
                    key={r.id}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    className="bg-[#f6f6f4] rounded-[10px] p-6 sm:p-8 border border-neutral-100"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b border-neutral-200">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="w-10 h-10 rounded-full bg-[#f5901e]/10 text-[#f5901e] font-heading font-black flex items-center justify-center"
                        >
                          {r.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-heading font-extrabold text-base text-[#262626] leading-tight">
                            {r.name}
                          </p>
                          <p className="font-sans text-xs text-neutral-500 mt-0.5">
                            {r.service} · {formatDate(r.date)}
                          </p>
                        </div>
                      </div>
                      <Stars value={r.rating} />
                    </div>

                    <p className="font-sans text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line">
                      {r.text}
                    </p>

                    {r.reply && (
                      <div className="mt-5 bg-white rounded-lg border-l-4 border-[#f5901e] p-4">
                        <p className="font-heading font-bold text-xs uppercase tracking-wider text-[#f5901e] mb-1.5">
                          Ответ БелТехКомпании
                        </p>
                        <p className="font-sans text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                          {r.reply}
                        </p>
                      </div>
                    )}
                  </motion.article>
                ))}
              </div>
            )}

            {/* Виджет отзывов Яндекс Карт */}
            <motion.div
              id="reviews-yandex-widget"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className={`${visible.length > 0 ? "mt-10" : ""} bg-[#f6f6f4] rounded-[10px] p-4 sm:p-6 border border-neutral-100`}
            >
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#262626] uppercase tracking-tight mb-5 pb-3 border-b border-neutral-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f5901e]" />
                Отзывы на Яндекс Картах
              </h3>
              <div className="mx-auto w-full max-w-[760px] h-[720px] overflow-hidden rounded-lg bg-white border border-neutral-200">
                <iframe
                  title="Отзывы об ООО «БелТехКомпания» на Яндекс Картах"
                  src={YANDEX_WIDGET_URL}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
              <a
                href={YANDEX_REVIEWS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-neutral-500 hover:text-[#f5901e] transition-colors"
              >
                <span>Открыть все отзывы на Яндекс Картах</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
