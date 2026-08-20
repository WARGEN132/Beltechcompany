import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Phone, MessageSquare, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { sendLeadRequest } from "../lib/emailService";

interface InteractiveFeaturesProps {
  onOpenLeadModal: (customMessage?: string) => void;
}

export default function InteractiveFeatures({ onOpenLeadModal }: InteractiveFeaturesProps) {
  // Calculator State - 5 core services
  const [calcTab, setCalcTab] = useState<"heating" | "ventilation" | "electrical" | "water" | "machinery">("heating");

  // 1. Heating states
  const [heatingArea, setHeatingArea] = useState(100);

  // 2. Ventilation states
  const [ventArea, setVentArea] = useState(120);
  const [ventType, setVentType] = useState<"supply_recup" | "supply" | "exhaust" | "ac">("supply_recup");

  // 3. Electrical states
  const [elecNetwork, setElecNetwork] = useState<"internal" | "external">("internal");
  const [elecArea, setElecArea] = useState(80);
  const [elecPoints, setElecPoints] = useState(35);
  const [includeShield, setIncludeShield] = useState(true);
  const [elecLength, setElecLength] = useState(50);
  const [elecMethod, setElecMethod] = useState<"underground" | "air">("underground");

  // 4. Water supply states
  const [waterArea, setWaterArea] = useState(100);
  const [waterSource, setWaterSource] = useState<"well" | "central" | "autonomy">("well");
  const [waterFilter, setWaterFilter] = useState(true);

  // 5. Machinery service states
  const [machineryDuration, setMachineryDuration] = useState<"2_hours" | "1_shift" | "longterm">("2_hours");
  const [machineWork, setMachineWork] = useState("Копание траншей, котлованов и планировка участка");

  // Engineer Request Form States
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+375 ");
  const [contactMethod, setContactMethod] = useState<"phone" | "telegram" | "viber">("phone");
  const [comment, setComment] = useState("");
  // Согласие по умолчанию НЕ отмечено — предзаполненный чекбокс не считается
  // юридически действительным согласием на обработку персональных данных.
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // Bot protection

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; consent?: string }>({});
  const [submitError, setSubmitError] = useState("");

  const getCategoryName = () => {
    switch (calcTab) {
      case "heating": return "Монтаж отопления";
      case "ventilation": return "Вентиляция и кондиционирование";
      case "electrical": return "Электроснабжение";
      case "water": return "Водоснабжение и канализация";
      case "machinery": return "Услуги спецтехники";
      default: return "Заявка инженеру";
    }
  };

  const getConfigurationDetails = () => {
    if (calcTab === "heating") {
      return `отопление: отапливаемая площадь ${heatingArea} м²`;
    } else if (calcTab === "ventilation") {
      const typeLabel = ventType === "supply_recup" ? "приточно-вытяжная с рекуперацией" : ventType === "supply" ? "приточная вентиляция" : ventType === "exhaust" ? "вытяжная система" : "кондиционирование и сплит";
      return `вентиляция: площадь помещения ${ventArea} м², тип системы: ${typeLabel}`;
    } else if (calcTab === "electrical") {
      if (elecNetwork === "internal") {
        return `электроснабжение (внутренние сети): площадь ${elecArea} м², точки: ${elecPoints} шт., сборка щита: ${includeShield ? "да (автоматы+УЗО)" : "нет"}`;
      } else {
        const methodLabel = elecMethod === "underground" ? "в траншее (подземная)" : "воздушная линия (СИП)";
        return `электроснабжение (наружные сети): протяженность линии ${elecLength} м, способ прокладки: ${methodLabel}`;
      }
    } else if (calcTab === "water") {
      const sourceLabel = waterSource === "well" ? "скважина" : waterSource === "central" ? "центральный водопровод" : "колодец / автономная станция";
      return `водоснабжение: площадь дома/объекта ${waterArea} м², источник: ${sourceLabel}, система фильтрации: ${waterFilter ? "включена" : "без фильтров"}`;
    } else {
      const durationLabel = machineryDuration === "2_hours" ? "от 2 часов" : machineryDuration === "1_shift" ? "1 смена (8 часов)" : "долгосрочно";
      return `услуги спецтехники: мини-экскаватор, продолжительность: ${durationLabel}, вид работ: ${machineWork ? machineWork.toLowerCase() : "не указан"}`;
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientName(e.target.value);
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsent(e.target.checked);
    if (fieldErrors.consent) {
      setFieldErrors((prev) => ({ ...prev, consent: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    const digitsOnly = input.replace(/\D/g, "");

    let subscriberDigits = digitsOnly.startsWith("375") ? digitsOnly.slice(3) : digitsOnly;
    subscriberDigits = subscriberDigits.slice(0, 9);

    let formatted = "+375";
    if (subscriberDigits.length > 0) formatted += ` (${subscriberDigits.slice(0, 2)}`;
    if (subscriberDigits.length >= 2) formatted += `) ${subscriberDigits.slice(2, 5)}`;
    if (subscriberDigits.length >= 5) formatted += `-${subscriberDigits.slice(5, 7)}`;
    if (subscriberDigits.length >= 7) formatted += `-${subscriberDigits.slice(7, 9)}`;

    setClientPhone(formatted);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent rejection for bots

    setSubmitError("");
    const errors: { name?: string; phone?: string; consent?: string } = {};

    if (!clientName.trim()) {
      errors.name = "Пожалуйста, введите ваше имя";
    }

    const phoneDigits = clientPhone.replace(/\D/g, "");
    if (!clientPhone.trim() || phoneDigits.length < 12) {
      errors.phone = "Укажите правильный номер телефона (+375 ...)";
    }

    if (!consent) {
      errors.consent = "Необходимо согласие на обработку персональных данных";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const configDetails = getConfigurationDetails();
    const categoryName = getCategoryName();
    const contactMethodLabel = contactMethod === "telegram" ? "Telegram" : contactMethod === "viber" ? "Viber" : "Телефонный звонок";

    try {
      const result = await sendLeadRequest({
        name: clientName,
        phone: clientPhone,
        service: categoryName,
        comment: comment ? `${comment} | Конфигурация: ${configDetails}` : `Конфигурация: ${configDetails}`,
        contactMethod: contactMethodLabel,
      });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setSubmitError("Не удалось отправить заявку, попробуйте ещё раз");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Не удалось отправить заявку, попробуйте ещё раз");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="interactive-features-section" className="py-12 sm:py-20 bg-[#f6f6f4] border-t border-neutral-200">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-8 sm:mb-12">
          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#262626] tracking-tight leading-tight mb-4">
            Рассчитайте параметры
            <span className="block text-[#E8863C] mt-1">вашего объекта</span>
          </h2>
          <div className="w-16 h-1 bg-[#E8863C] mx-auto mb-6 rounded-full" />
          <p className="font-sans text-neutral-600 text-sm sm:text-base">
            Укажите вводные данные по вашему объекту для получения персонального расчёта сметы от инженера.
          </p>
        </div>

        {/* Centered Calculator Container */}
        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-2xl border border-neutral-200/90 shadow-md flex flex-col justify-between">
          <div>
            {/* Title & 5 Tabs */}
            <div className="flex flex-col space-y-4 mb-6 pb-5 border-b border-neutral-200">
              <h3 className="font-heading font-black text-lg sm:text-xl text-[#262626] tracking-tight uppercase">
                Параметры объекта
              </h3>

              {/* 5 Tabs switcher */}
<div className="flex flex-wrap gap-1.5 bg-neutral-100/90 p-1.5 rounded-xl border border-neutral-200/80">
  {(["heating", "ventilation", "electrical", "water", "machinery"] as const).map((tab) => {
    const labels = {
      heating: "Отопление",
      ventilation: "Вентиляция",
      electrical: "Электросеть",
      water: "Водопровод",
      machinery: "Услуги техники",
    };
    return (
      <button
        key={tab}
        type="button"
        onClick={() => setCalcTab(tab)}
        className={`flex-1 min-w-[30%] sm:min-w-0 font-heading font-black text-[10px] xs:text-[11px] sm:text-xs uppercase tracking-tight py-2 px-1.5 rounded-lg transition-all cursor-pointer text-center leading-tight whitespace-nowrap ${
          calcTab === tab ? "bg-[#E8863C] text-white shadow-md" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
        }`}
      >
        {labels[tab]}
      </button>
    );
  })}
</div>
            </div>

            {/* DYNAMIC SERVICE PARAMETERS & CONTROLS */}
            <AnimatePresence mode="wait">
              {/* 1. OTOПЛЕНИЕ */}
              {calcTab === "heating" && (
                <motion.div
                  key="heating"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="font-heading font-black text-xs uppercase text-neutral-700 tracking-wider">Отапливаемая площадь:</span>
                      <span className="font-heading font-black text-base text-[#E8863C] bg-orange-50 px-3 py-0.5 rounded-md border border-orange-200/80">
                        {heatingArea} м²
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="350"
                      value={heatingArea}
                      onChange={(e) => setHeatingArea(Number(e.target.value))}
                      className="w-full accent-[#E8863C] cursor-pointer h-2.5 bg-neutral-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[11px] text-neutral-500 font-sans mt-2 font-medium">
                      <span>30 м²</span>
                      <span>350 м²</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. ВЕНТИЛЯЦИЯ */}
              {calcTab === "ventilation" && (
                <motion.div
                  key="ventilation"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="font-heading font-black text-xs uppercase text-neutral-700 tracking-wider">Площадь помещения:</span>
                      <span className="font-heading font-black text-base text-[#E8863C] bg-orange-50 px-3 py-0.5 rounded-md border border-orange-200/80">
                        {ventArea} м²
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="500"
                      value={ventArea}
                      onChange={(e) => setVentArea(Number(e.target.value))}
                      className="w-full accent-[#E8863C] cursor-pointer h-2.5 bg-neutral-200 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="bg-white p-4 rounded-xl border-2 border-neutral-200/80">
                    <span className="font-heading font-black text-[11px] uppercase text-neutral-600 tracking-wider block mb-2.5">
                      Тип системы вентиляции:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "supply_recup", title: "Приточно-вытяжная с рекуперацией", sub: "Сбережение тепла до 85%" },
                        { id: "supply", title: "Приточная система", sub: "Подача свежего подогретого воздуха" },
                        { id: "exhaust", title: "Вытяжная вентиляция", sub: "Удаление отработанного воздуха" },
                        { id: "ac", title: "Кондиционирование и сплит", sub: "Охлаждение и микроклимат" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVentType(item.id as any)}
                          className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                            ventType === item.id ? "bg-orange-50/80 border-[#E8863C] text-neutral-900" : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                          }`}
                        >
                          <span className="font-heading font-black text-xs uppercase">{item.title}</span>
                          <span className="text-[11px] text-neutral-500 font-sans">{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. ЭЛЕКТРОСНАБЖЕНИЕ */}
              {calcTab === "electrical" && (
                <motion.div
                  key="electrical"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
                    <button
                      type="button"
                      onClick={() => setElecNetwork("internal")}
                      className={`flex-1 py-2 font-heading font-black text-xs uppercase rounded-lg transition-all cursor-pointer text-center ${
                        elecNetwork === "internal" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      Внутренние сети
                    </button>
                    <button
                      type="button"
                      onClick={() => setElecNetwork("external")}
                      className={`flex-1 py-2 font-heading font-black text-xs uppercase rounded-lg transition-all cursor-pointer text-center ${
                        elecNetwork === "external" ? "bg-[#E8863C] text-white shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      Наружные сети
                    </button>
                  </div>

                  {elecNetwork === "internal" ? (
                    <div className="space-y-4">
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-heading font-black text-xs uppercase text-neutral-700 tracking-wider">Площадь объекта:</span>
                          <span className="font-heading font-black text-base text-[#E8863C] bg-orange-50 px-3 py-0.5 rounded-md border border-orange-200/80">
                            {elecArea} м²
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={elecArea}
                          onChange={(e) => setElecArea(Number(e.target.value))}
                          className="w-full accent-[#E8863C] cursor-pointer h-2.5 bg-neutral-200 rounded-lg appearance-none"
                        />
                      </div>

                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-heading font-black text-xs uppercase text-neutral-700 tracking-wider">Точки (розетки, выключатели):</span>
                          <span className="font-heading font-black text-base text-[#E8863C] bg-orange-50 px-3 py-0.5 rounded-md border border-orange-200/80">
                            {elecPoints} шт.
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="150"
                          value={elecPoints}
                          onChange={(e) => setElecPoints(Number(e.target.value))}
                          className="w-full accent-[#E8863C] cursor-pointer h-2.5 bg-neutral-200 rounded-lg appearance-none"
                        />
                      </div>

                      <label className="flex items-center gap-3 bg-white p-3.5 rounded-xl border-2 border-neutral-200/80 cursor-pointer hover:border-[#E8863C] transition-all">
                        <input
                          type="checkbox"
                          checked={includeShield}
                          onChange={(e) => setIncludeShield(e.target.checked)}
                          className="w-4 h-4 accent-[#E8863C] cursor-pointer"
                        />
                        <div className="flex flex-col text-left">
                          <span className="font-heading font-black text-xs uppercase tracking-wide text-neutral-900">Сборка и монтаж щита под ключ</span>
                          <span className="font-sans text-[11px] text-neutral-500">Автоматы, УЗО, реле напряжения, кросс-модули</span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-heading font-black text-xs uppercase text-neutral-700 tracking-wider">Протяженность линии:</span>
                          <span className="font-heading font-black text-base text-[#E8863C] bg-orange-50 px-3 py-0.5 rounded-md border border-orange-200/80">
                            {elecLength} метров
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="500"
                          value={elecLength}
                          onChange={(e) => setElecLength(Number(e.target.value))}
                          className="w-full accent-[#E8863C] cursor-pointer h-2.5 bg-neutral-200 rounded-lg appearance-none"
                        />
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border-2 border-neutral-200/80">
                        <span className="font-heading font-black text-[11px] uppercase text-neutral-600 tracking-wider block mb-2">Способ прокладки кабеля:</span>
                        <div className="grid grid-cols-2 bg-neutral-100 p-1 rounded-lg gap-1">
                          <button
                            type="button"
                            onClick={() => setElecMethod("underground")}
                            className={`font-heading font-black text-[11px] uppercase py-2 rounded-md transition-all cursor-pointer ${
                              elecMethod === "underground" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500"
                            }`}
                          >
                            В траншее
                          </button>
                          <button
                            type="button"
                            onClick={() => setElecMethod("air")}
                            className={`font-heading font-black text-[11px] uppercase py-2 rounded-md transition-all cursor-pointer ${
                              elecMethod === "air" ? "bg-[#E8863C] text-white shadow-xs" : "text-neutral-500"
                            }`}
                          >
                            Воздушная (СИП)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 4. ВОДОСНАБЖЕНИЕ */}
              {calcTab === "water" && (
                <motion.div
                  key="water"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="font-heading font-black text-xs uppercase text-neutral-700 tracking-wider">Площадь объекта / дома:</span>
                      <span className="font-heading font-black text-base text-[#E8863C] bg-orange-50 px-3 py-0.5 rounded-md border border-orange-200/80">
                        {waterArea} м²
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="350"
                      value={waterArea}
                      onChange={(e) => setWaterArea(Number(e.target.value))}
                      className="w-full accent-[#E8863C] cursor-pointer h-2.5 bg-neutral-200 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="bg-white p-4 rounded-xl border-2 border-neutral-200/80 space-y-2">
                    <span className="font-heading font-black text-[11px] uppercase text-neutral-600 tracking-wider block mb-1">
                      Источник водоснабжения:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "well", label: "Скважина" },
                        { id: "central", label: "Центр. водопровод" },
                        { id: "autonomy", label: "Колодец / Автономия" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setWaterSource(item.id as any)}
                          className={`py-2.5 px-3 rounded-lg border font-heading font-black text-xs uppercase transition-all cursor-pointer text-center ${
                            waterSource === item.id ? "bg-orange-50/80 border-[#E8863C] text-neutral-900" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 bg-white p-3.5 rounded-xl border-2 border-neutral-200/80 cursor-pointer hover:border-[#E8863C] transition-all">
                    <input
                      type="checkbox"
                      checked={waterFilter}
                      onChange={(e) => setWaterFilter(e.target.checked)}
                      className="w-4 h-4 accent-[#E8863C] cursor-pointer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-heading font-black text-xs uppercase tracking-wide text-neutral-900">Установка водоочистки и фильтров</span>
                      <span className="font-sans text-[11px] text-neutral-500">Обезжелезивание, умягчение и тонкая очистка</span>
                    </div>
                  </label>
                </motion.div>
              )}

              {/* 5. УСЛУГИ ТЕХНИКИ */}
              {calcTab === "machinery" && (
                <motion.div
                  key="machinery"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="bg-white p-4 rounded-xl border-2 border-neutral-200/80 space-y-2">
                    <span className="font-heading font-black text-[11px] uppercase text-neutral-600 tracking-wider block mb-1">
                      Продолжительность работ:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "1_shift", label: "минимум: 2 ч" },

                        { id: "1_shift", label: "1 смена (8 ч)" },
                        
                        { id: "longterm", label: "Долгосрочно" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMachineryDuration(item.id as any)}
                          className={`py-2.5 px-3 rounded-lg border font-heading font-black text-xs uppercase transition-all cursor-pointer text-center ${
                            machineryDuration === item.id ? "bg-orange-50/80 border-[#E8863C] text-neutral-900" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
                    <label className="font-heading font-black text-xs uppercase text-neutral-700 tracking-wider block mb-2">
                      Планируемый вид работ:
                    </label>
                    <input
                      type="text"
                      value={machineWork}
                      onChange={(e) => setMachineWork(e.target.value)}
                      placeholder="Например: копание траншеи под кабель, планировка..."
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E8863C]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ENGINEER REQUEST FORM */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                <h4 className="font-heading font-black text-lg text-green-900 uppercase">Заявка успешно отправлена!</h4>
                <p className="font-sans text-xs text-green-700">Инженер свяжется с вами в течение 15 минут для уточнения параметров сметы.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-4">
                {/* Honeypot hidden input */}
                <input
                  type="text"
                  name="website_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <input
                      type="text"
                      value={clientName}
                      onChange={handleNameChange}
                      placeholder="Ваше имя *"
                      className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-neutral-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#E8863C]/50 ${
                        fieldErrors.name ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                      }`}
                    />
                    {fieldErrors.name && <span className="text-[11px] text-red-500 mt-1 block font-medium">{fieldErrors.name}</span>}
                  </div>

                  <div>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={handlePhoneChange}
                      placeholder="+375 (29) XXX-XX-XX *"
                      className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-neutral-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#E8863C]/50 ${
                        fieldErrors.phone ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                      }`}
                    />
                    {fieldErrors.phone && <span className="text-[11px] text-red-500 mt-1 block font-medium">{fieldErrors.phone}</span>}
                  </div>
                </div>

                {/* ADAPTIVE CONTACT METHOD BUTTONS */}
                <div>
                  <label className="text-[11px] font-heading font-black text-neutral-600 uppercase block mb-2 tracking-wider">
                    Удобный способ связи:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full bg-neutral-100 p-1.5 rounded-xl border border-neutral-200/80">
                    <button
                      type="button"
                      onClick={() => setContactMethod("phone")}
                      className={`w-full py-2.5 px-2 rounded-lg text-xs font-heading font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        contactMethod === "phone" ? "bg-[#E8863C] text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>Звонок</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setContactMethod("telegram")}
                      className={`w-full py-2.5 px-2 rounded-lg text-xs font-heading font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        contactMethod === "telegram" ? "bg-[#0088cc] text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>Telegram</span>
                    </button>

                    <button
  type="button"
  onClick={() => setContactMethod("viber")}
  className={`w-full py-2.5 px-2 rounded-lg text-xs font-heading font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
    contactMethod === "viber" ? "bg-[#7360f2] text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900"
  }`}
>
  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
  <span>Viber</span>
</button>
                  </div>
                </div>

                <div>
  <textarea
    rows={3}
    value={comment}
    onChange={(e) => setComment(e.target.value)}
    placeholder="Дополнительный комментарий или адрес объекта (необязательно)"
    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-[11px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-[#E8863C]/50 resize-none leading-relaxed"
  />
</div>

                <div className="flex flex-col space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={handleConsentChange}
                      className="w-4 h-4 mt-0.5 accent-[#E8863C] cursor-pointer"
                    />
                    <span className="text-[11px] text-neutral-500 leading-tight">
                      Согласен на обработку персональных данных в соответствии с политикой конфиденциальности.
                    </span>
                  </label>
                  {fieldErrors.consent && <span className="text-[11px] text-red-500 font-medium">{fieldErrors.consent}</span>}
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-[#E8863C] hover:bg-[#d6752c] text-white font-heading font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Отправка расчета...</span>
                    </>
                  ) : (
                    <span>Получить смету объекта</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}