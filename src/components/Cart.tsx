import React, { useState } from "react";
import { PriceItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Minus, ShoppingBag, Check, ArrowRight } from "lucide-react";
import { sendCartOrder } from "../lib/emailService";
import { formatPhoneInput, isValidPhone, sanitizeName, sanitizeEmail, sanitizeComment } from "../lib/inputValidation";

export interface CartItem {
  product: PriceItem;
  quantity: number;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, exactQty?: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
}

export default function Cart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
}: CartProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (!isValidPhone(phone)) {
      setErrorMessage("Укажите корректный номер телефона (+375 ...)");
      return;
    }

    if (!consent) {
      setErrorMessage("Необходимо подтвердить согласие на обработку персональных данных.");
      return;
    }

    if (honeypot) {
      const fakeOrderId = `BTK-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setIsSubmitting(true);
      setTimeout(() => {
        setOrderId(fakeOrderId);
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          onClearCart();
          setIsSuccess(false);
          setName("");
          setPhone("");
          setEmail("");
          setMessage("");
          setHoneypot("");
          onClose();
        }, 5000);
      }, 600);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const newOrderId = `BTK-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const result = await sendCartOrder({
        orderId: newOrderId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        comment: message.trim(),
        items: cartItems.map((ci) => ({
          id: ci.product.id,
          name: ci.product.name,
          quantity: ci.quantity,
          unit: ci.product.unit || "шт",
          price: ci.product.price || "По запросу",
        })),
      });

      if (result.success) {
        setOrderId(result.orderId || newOrderId);
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          onClearCart();
          setIsSuccess(false);
          setName("");
          setPhone("");
          setEmail("");
          setMessage("");
          setHoneypot("");
          onClose();
        }, 5000);
      } else {
        setIsSubmitting(false);
        setErrorMessage("Ошибка при оформлении заказа. Попробуйте еще раз.");
      }
    } catch (err: any) {
      console.error("Order submit error:", err);
      setOrderId(newOrderId);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClearCart();
        setIsSuccess(false);
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
        onClose();
      }, 5000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black backdrop-blur-xs"
          />

          {/* Slide Over Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-[#262626] text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#f5901e]" />
                <h3 className="font-heading font-bold text-base uppercase tracking-wider">
                  Ваша Корзина ({cartItems.length})
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-5">
              {isSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-lg animate-pulse" />
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center relative z-10 shadow-lg">
                      <Check className="w-10 h-10 stroke-[3]" />
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-heading font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                    Заказ #{orderId}
                  </div>

                  <h4 className="font-heading font-extrabold text-xl text-neutral-800 uppercase tracking-tight">
                    Заказ успешно отправлен!
                  </h4>
                  <p className="font-sans text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Заявка принята в обработку. Инженер свяжется с вами по номеру{" "}
                    <strong className="text-neutral-800 font-bold">{phone}</strong> в ближайшие 15 минут.
                  </p>

                  <div className="pt-2 text-[11px] font-heading font-extrabold text-[#f5901e] uppercase tracking-widest">
                    ООО «БелТехКомпания» • Ивацевичи
                  </div>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                  <ShoppingBag className="w-12 h-12 text-neutral-200 mb-3" />
                  <p className="font-sans text-sm font-medium text-neutral-600">Ваша корзина пуста</p>
                  <p className="font-sans text-xs text-neutral-400 mt-1">
                    Перейдите в каталог и добавьте нужные товары или услуги.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 border border-neutral-200 hover:border-[#f5901e] hover:text-[#f5901e] text-neutral-600 font-heading font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-colors cursor-pointer"
                  >
                    Вернуться к покупкам
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-[#f5901e]/30 hover:shadow-md transition-all duration-300 group"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0 border border-neutral-200 p-1 flex items-center justify-center">
                        <img
                          src={item.product.image || "/src/assets/images/clean_electrical_after_1784549219964.jpg"}
                          alt={item.product.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <h4 className="font-sans font-bold text-neutral-800 text-xs sm:text-sm line-clamp-1">
                            {item.product.name}
                          </h4>
                          <p className="text-[10px] text-[#f5901e] uppercase tracking-wider font-heading font-black">
                            {item.product.category}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          {/* Counter */}
                          <div className="flex items-center bg-white border border-neutral-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="p-1 text-neutral-500 hover:bg-neutral-100 cursor-pointer transition-colors"
                              title="Уменьшить"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="9999"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                onUpdateQuantity(item.product.id, 0, isNaN(val) ? 1 : val);
                              }}
                              className="w-10 text-center font-sans text-xs font-bold text-neutral-800 bg-transparent focus:outline-hidden"
                            />
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="p-1 text-neutral-500 hover:bg-neutral-100 cursor-pointer transition-colors"
                              title="Увеличить"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Unit */}
                          <div className="text-right">
                            <span className="font-heading font-bold text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                              {item.product.unit || "шт"}
                            </span>
                          </div>

                          {/* Trash Icon */}
                          <button
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="text-neutral-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Form with Checkout */}
            {!isSuccess && cartItems.length > 0 && (
              <div className="p-5 border-t border-neutral-100 bg-neutral-50/90 backdrop-blur-xs">
                {/* Total Summary */}
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-sans text-xs text-neutral-500">Смета заказа:</span>
                  <span className="font-heading font-black text-base text-[#f5901e] drop-shadow-xs">
                    Расчёт стоимости
                  </span>
                </div>

                {errorMessage && (
                  <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-sans">
                    {errorMessage}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmitOrder} className="flex flex-col gap-2.5">
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

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Ваше имя <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      placeholder="Иван Иванов"
                      value={name}
                      onChange={(e) => setName(sanitizeName(e.target.value, 60))}
                      className="w-full px-3 py-2 text-xs font-sans bg-white border border-neutral-200 focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-lg transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Телефон <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={19}
                        placeholder="+375 (29) 123-45-67"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-sans bg-white border border-neutral-200 focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-lg transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Email (для сметы)
                      </label>
                      <input
                        type="email"
                        maxLength={80}
                        placeholder="user@mail.ru"
                        value={email}
                        onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-sans bg-white border border-neutral-200 focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-lg transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Комментарий или Адрес
                    </label>
                    <textarea
                      placeholder="Укажите адрес доставки или вопросы по заказу..."
                      rows={2}
                      maxLength={300}
                      value={message}
                      onChange={(e) => setMessage(sanitizeComment(e.target.value, 300))}
                      className="w-full px-3 py-1.5 text-xs font-sans bg-white border border-neutral-200 focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-lg resize-none transition-all"
                    />
                  </div>

                  {/* Mandatory Personal Data Consent Checkbox */}
                  <div className="flex items-start gap-2 pt-1 pb-1">
                    <input
                      type="checkbox"
                      id="cart-consent"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 rounded border-neutral-300 text-[#f5901e] focus:ring-[#f5901e] cursor-pointer"
                    />
                    <label htmlFor="cart-consent" className="text-[10px] font-sans text-neutral-600 leading-tight cursor-pointer">
                      Даю согласие на <span className="font-semibold text-neutral-800">обработку персональных данных</span> и подбор сметы <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-1 bg-gradient-to-r from-[#f5901e] to-[#e07f15] hover:from-[#ff9f2e] hover:to-[#f5901e] text-white font-heading font-black text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(245,144,30,0.5)] hover:shadow-[0_0_30px_rgba(245,144,30,0.8)] cursor-pointer disabled:opacity-50 relative overflow-hidden group"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Отправка заказа на почту...</span>
                      </span>
                    ) : (
                      <>
                        <span>Отправить заказ в «БелТехКомпания»</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}