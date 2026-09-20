import React, { useState, useRef, useEffect } from "react";
import { X, CheckCircle, Phone, User, MessageSquare, ArrowRight, ShieldCheck, ChevronDown, Check } from "lucide-react";
import { LeadForm } from "../types";
import { SERVICES } from "../data";
import { motion, AnimatePresence } from "motion/react";
import { sendLeadRequest } from "../lib/emailService";
import { formatPhoneInput, isValidPhone, sanitizeName, sanitizeComment } from "../lib/inputValidation";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
  customMessage?: string;
}

// Направления собираются из услуг (уникальные категории), плюс магазин и общий вопрос —
// список больше не дублируется вручную и не расходится с data.ts.
const SERVICE_CATEGORIES = Array.from(
  new Set(SERVICES.map((s) => s.category).filter((c): c is string => Boolean(c)))
);
const DIRECTION_OPTIONS = [...SERVICE_CATEGORIES, "Магазин «Электрика»", "Другой вопрос / Консультация"];

export default function LeadModal({ isOpen, onClose, initialService = "", customMessage = "" }: LeadModalProps) {
  const [formData, setFormData] = useState<LeadForm>({
    name: "",
    phone: "",
    service: initialService,
    message: customMessage,
  });

  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [isDirectionOpen, setIsDirectionOpen] = useState(false);
  const directionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        service: initialService || SERVICE_CATEGORIES[0] || "",
        message: customMessage || "",
      }));
      setHoneypot("");
      setIsSubmitting(false);
      setIsSubmitted(false);
      setError("");
      setIsDirectionOpen(false);
    }
  }, [isOpen, initialService, customMessage]);

  // Закрытие кастомного дропдауна по клику вне его области
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (directionRef.current && !directionRef.current.contains(e.target as Node)) {
        setIsDirectionOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhoneInput(value) }));
    } else if (name === "name") {
      setFormData((prev) => ({ ...prev, name: sanitizeName(value, 60) }));
    } else if (name === "message") {
      setFormData((prev) => ({ ...prev, message: sanitizeComment(value, 400) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  // Текущее значение направления может быть кастомной строкой не из списка
  // (например "Запрос цены: Саморез ..." прилетевший с карточки товара) —
  // в этом случае показываем её первым пунктом дропдауна, а не теряем.
  const directionOptionsWithCurrent =
    formData.service && !DIRECTION_OPTIONS.includes(formData.service)
      ? [formData.service, ...DIRECTION_OPTIONS]
      : DIRECTION_OPTIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Пожалуйста, введите ваше имя.");
      return;
    }
    if (!formData.phone.trim() || !isValidPhone(formData.phone)) {
      setError("Пожалуйста, введите корректный номер телефона (+375 ...).");
      return;
    }

    // Honeypot сработал — похоже на бота. Молча "успешно" завершаем,
    // не отправляя реальный запрос и не давая боту понять, что его поймали.
    if (honeypot) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
      }, 600);
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await sendLeadRequest({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      service: formData.service,
      comment: (formData.message || "").trim(),
      contactMethod: "Звонок / Viber",
    });

    setIsSubmitting(false);
    if (result.success) {
      setIsSubmitted(true);
    } else {
      // На случай если sendLeadRequest когда-нибудь начнёт возвращать success:false —
      // сейчас в вашей реализации success всегда true (см. emailService.ts).
      setError(result.message || "Ошибка отправки заявки. Попробуйте ещё раз или позвоните нам напрямую.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="lead-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        id="lead-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white rounded-[10px] shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#E8863C] text-white p-5 sm:p-6 relative">
          <button
            id="lead-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-white shrink-0" />
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg uppercase tracking-tight leading-none">
                Оставить заявку
              </h3>
              <p className="text-[10px] text-white/80 font-sans tracking-wide mt-1">
                ООО «БелТехКомпания» • г. Ивацевичи
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {!isSubmitted ? (
            <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs font-sans font-medium border border-rose-100 flex items-start gap-2">
                  <span className="font-bold shrink-0">Ошибка:</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="lead-name" className="block text-xs font-heading font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Ваше имя <span className="text-[#E8863C]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="lead-name"
                    required
                    maxLength={60}
                    placeholder="Иван Иванов"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#E8863C] focus:ring-1 focus:ring-[#E8863C] rounded-[10px] text-sm font-sans font-normal text-[#262626] focus:outline-none transition-all placeholder:text-[13px]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="lead-phone" className="block text-xs font-heading font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Контактный телефон <span className="text-[#E8863C]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="lead-phone"
                    required
                    maxLength={19}
                    placeholder="+375 (33) 123-45-67"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#E8863C] focus:ring-1 focus:ring-[#E8863C] rounded-[10px] text-sm font-sans font-normal text-[#262626] focus:outline-none transition-all placeholder:text-[13px]"
                  />
                </div>
              </div>

              {/* Direction — кастомный анимированный дропдаун вместо нативного select */}
              <div ref={directionRef} className="relative">
                <label className="block text-xs font-heading font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Интересующее направление
                </label>
                <button
                  type="button"
                  onClick={() => setIsDirectionOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:border-[#E8863C] focus:ring-1 focus:ring-[#E8863C] rounded-[10px] text-sm font-sans text-[#262626] transition-all cursor-pointer"
                >
                  <span className="truncate text-left">{formData.service || "Выберите направление"}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isDirectionOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {isDirectionOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      style={{ transformOrigin: "top" }}
                      className="absolute z-20 mt-1.5 w-full bg-white border border-neutral-200 rounded-[10px] shadow-lg py-1.5 max-h-56 overflow-y-auto"
                    >
                      {directionOptionsWithCurrent.map((opt) => (
                        <li key={opt}>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, service: opt }));
                              setIsDirectionOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2 text-left px-3.5 py-2 text-sm font-sans transition-colors cursor-pointer ${
                              formData.service === opt
                                ? "bg-[#f5901e]/10 text-[#e07f15] font-semibold"
                                : "text-[#262626] hover:bg-neutral-50"
                            }`}
                          >
                            <span className="truncate">{opt}</span>
                            {formData.service === opt && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="lead-message" className="block text-xs font-heading font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Комментарий (необязательно)
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-0 pl-3.5 flex items-start pointer-events-none text-neutral-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <textarea
                    name="message"
                    id="lead-message"
                    rows={3}
                    maxLength={400}
                    placeholder="Опишите ваши задачи или перечень нужных товаров..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#E8863C] focus:ring-1 focus:ring-[#E8863C] rounded-[10px] text-sm font-sans font-normal text-[#262626] focus:outline-none transition-all placeholder:text-[13px] resize-none"
                  />
                </div>
              </div>

              {/* Honeypot — скрытая ловушка для ботов */}
              <input
                type="text"
                name="b_security_honeypot"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
              />

              <button
                type="submit"
                id="lead-submit-btn"
                disabled={isSubmitting}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#f5901e] to-[#e07f15] hover:from-[#ff9f2e] hover:to-[#f5901e] text-white font-heading font-extrabold text-sm uppercase tracking-wider py-3.5 rounded-xl shadow-[0_0_20px_rgba(245,144,30,0.4)] hover:shadow-[0_0_30px_rgba(245,144,30,0.7)] transition-all duration-200 cursor-pointer disabled:opacity-50 group"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Отправка заявки...</span>
                  </span>
                ) : (
                  <>
                    <span>Отправить заявку инженеру</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-[13px] text-center text-neutral-500 font-sans mt-3 leading-normal">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных. Наш специалист свяжется с вами в течение 15 минут.
              </p>
            </form>
          ) : (
            <div id="lead-success-state" className="text-center py-6 space-y-4">
              <div className="mx-auto bg-[#f5901e]/10 text-[#f5901e] w-16 h-16 rounded-full flex items-center justify-center border border-[#f5901e]/20">
                <CheckCircle className="w-9 h-9" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-lg text-[#262626] uppercase">Заявка принята!</h4>
                <p className="font-sans text-sm text-neutral-600 mt-2">
                  Спасибо, <strong className="text-[#262626]">{formData.name}</strong>. Ваша заявка по направлению{" "}
                  <strong className="text-[#262626]">{formData.service}</strong> отправлена инженеру.
                </p>
              </div>
              <p className="font-sans text-xs text-neutral-500 pt-3 border-t border-neutral-100">
                Наш специалист свяжется с вами по номеру <strong>{formData.phone}</strong> в течение 15 минут для подробной консультации.
              </p>
              <button
                id="success-close-btn"
                onClick={onClose}
                className="w-full max-w-xs mt-4 bg-gradient-to-r from-[#f5901e] to-[#e07f15] hover:from-[#ff9f2e] hover:to-[#f5901e] text-white font-heading font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Отлично
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}