import React, { useState } from "react";
import { PriceItem } from "../types";
import { CartItem } from "./Cart";
import { motion } from "motion/react";
import { ArrowLeft, Check, ShoppingBag, Plus, Minus, Trash2, Send } from "lucide-react";
import { sendCartOrder } from "../lib/emailService";
import { formatPhoneInput, isValidPhone, sanitizeName, sanitizeEmail, sanitizeComment } from "../lib/inputValidation";

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, exactQty?: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onBack: () => void;
  onOpenLeadModal: (customMessage?: string) => void;
}

export default function CartPage({
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onBack,
  onOpenLeadModal,
}: CartPageProps) {
  const [deliveryMethod, setDeliveryMethod] = useState("express");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  // Согласие по умолчанию НЕ отмечено — предзаполненный чекбокс не считается
  // юридически действительным согласием на обработку персональных данных.
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (!isValidPhone(phone)) {
      setErrorMessage("Пожалуйста, укажите корректный номер телефона (+375 ...)");
      return;
    }

    if (!consent) {
      setErrorMessage("Необходимо подтвердить согласие на обработку персональных данных.");
      return;
    }

    const deliveryLabels: Record<string, string> = {
      express: "Автолайтэкспресс (бесплатно)",
      post: "Почта Беларуси / Белпочта (бесплатно)",
      pickup: "Самовывоз (г. Ивацевичи, ул. Свердлова, 5)",
      courier: "Курьер ООО «БелТехКомпания»",
    };

    // Honeypot сработал — похоже на бота. Молча "успешно" завершаем,
    // не отправляя реальный заказ и не давая боту понять, что его поймали.
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
          onBack();
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
        address: address.trim(),
        deliveryMethod: deliveryLabels[deliveryMethod] || deliveryMethod,
        comment: comment.trim(),
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
          onBack();
        }, 5000);
      } else {
        setIsSubmitting(false);
        setErrorMessage("Ошибка при отправке заказа. Проверьте введенные данные.");
      }
    } catch (err: any) {
      console.error("Order submit error:", err);
      setOrderId(newOrderId);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClearCart();
        setIsSuccess(false);
        onBack();
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <button
            onClick={onBack}
            className="self-start sm:self-auto bg-gradient-to-r from-[#f5901e] to-[#e07f15] hover:from-[#ff9f2e] hover:to-[#f5901e] text-white font-heading font-extrabold text-xs uppercase tracking-wider py-3 px-6 rounded-xl shadow-md hover:shadow-lg hover:shadow-[#f5901e]/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться в каталог</span>
          </button>

          <h1 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-[#1a1a1a] tracking-tight text-center">
            Ваша корзина и оформление заказа
          </h1>

          <div className="hidden sm:block w-32" />
        </div>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-emerald-50 rounded-2xl p-8 sm:p-10 border border-emerald-200 shadow-xs text-center space-y-3"
          >
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <h2 className="font-heading font-black text-2xl sm:text-3xl text-emerald-950 uppercase tracking-tight">
              Заказ успешно оформлен!
            </h2>

            <p className="font-sans text-sm sm:text-base text-emerald-800 leading-relaxed max-w-lg mx-auto">
              Ваша заявка принята. Менеджер свяжется с вами по номеру{" "}
              <strong className="text-emerald-950">{phone}</strong> для уточнения деталей и согласования доставки.
            </p>

            <div className="pt-2">
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-xs uppercase tracking-wider py-3 px-8 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Вернуться в каталог
              </button>
            </div>
          </motion.div>
        ) : cartItems.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-12 border border-neutral-200/80 shadow-xs text-center">
            <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl text-neutral-800 mb-2">Ваша корзина пуста</h2>
            <p className="font-sans text-sm text-neutral-500 mb-6">
              Вы еще не добавили ни одного товара или услуги из каталога.
            </p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-[#f5901e] to-[#e07f15] hover:from-[#ff9f2e] hover:to-[#f5901e] text-white font-heading font-extrabold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#f5901e]/30 transition-all hover:scale-105 active:scale-95 duration-200"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Items List */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs">
              <h2 className="font-heading font-black text-xl text-center sm:text-left text-neutral-900 mb-6 border-b border-neutral-100 pb-4">
                Товары в корзине
              </h2>

              <div className="divide-y divide-neutral-100">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    {/* Image & Title Block */}
                    <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-neutral-50 border border-neutral-200 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden group">
                        <img
                          src={item.product.image || "/src/assets/images/clean_electrical_after_1784549219964.jpg"}
                          alt={item.product.name}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-bold text-neutral-900 text-sm sm:text-base leading-snug break-words">
                          {item.product.name}
                        </h4>
                        <span className="inline-block mt-1.5 text-[11px] font-sans font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
                          Ед.: {item.product.unit || "шт"}
                        </span>
                      </div>
                    </div>

                    {/* Controls Block */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      {/* Quantity Counter */}
                      <div className="inline-flex items-center bg-neutral-100 border border-neutral-200 rounded-xl p-1 shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-8 h-8 bg-white hover:bg-neutral-200 text-neutral-800 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-95"
                          title="Уменьшить"
                        >
                          <Minus className="w-3.5 h-3.5" />
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
                          className="w-12 text-center font-heading font-black text-sm text-neutral-800 bg-transparent focus:outline-hidden focus:bg-white rounded py-0.5"
                        />
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-8 h-8 bg-white hover:bg-neutral-200 text-neutral-800 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-95"
                          title="Увеличить"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Delete button — приведена к спокойному стилю, как в Cart.tsx:
                          красная только при наведении, а не постоянно светится */}
                      <button
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-red-50 text-neutral-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
                        title="Удалить товар"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear Cart */}
              <div className="pt-6 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={onClearCart}
                  className="text-xs font-heading font-bold text-neutral-400 hover:text-red-500 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Очистить корзину
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Summary & Order Form */}
            <div className="lg:col-span-5 space-y-6">

              {/* Box 1: Calculation */}
              <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs">
                <h3 className="font-heading font-bold text-base text-neutral-900 border-b border-neutral-100 pb-3 mb-4">
                  Расчет сметы
                </h3>

                <div className="space-y-3 font-sans text-sm">
                  <div className="flex justify-between items-center gap-3 text-neutral-600">
                    <span className="shrink-0">
                      Сумма товаров ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} шт.):
                    </span>
                    <span className="font-semibold text-neutral-900 text-right">
                      По запросу / Смета
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3 text-neutral-600">
                    <span>Доставка:</span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                      Бесплатно
                    </span>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                    <span className="font-heading font-bold text-neutral-900 shrink-0">
                      Итого:
                    </span>
                    <span className="font-heading font-black text-base sm:text-lg text-[#f5901e] text-right">
                      Индивидуальный расчет
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Order Form */}
              <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs">
                <h3 className="font-heading font-bold text-base text-neutral-900 border-b border-neutral-100 pb-3 mb-4">
                  Данные получателя
                </h3>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitOrder} className="space-y-4">
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
                    <label className="block text-xs font-heading font-bold text-neutral-600 uppercase tracking-wider mb-1">
                      ФИО или Название организации <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      placeholder="Иванов Иван Иванович"
                      value={name}
                      onChange={(e) => setName(sanitizeName(e.target.value, 60))}
                      className="w-full px-3.5 py-2.5 text-xs font-sans bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-xl transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-heading font-bold text-neutral-600 uppercase tracking-wider mb-1">
                        Телефон <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={19}
                        placeholder="+375 (29) 123-45-67"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-xs font-sans bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-xl transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-bold text-neutral-600 uppercase tracking-wider mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        maxLength={80}
                        placeholder="example@mail.ru"
                        value={email}
                        onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-xs font-sans bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-neutral-600 uppercase tracking-wider mb-1">
                      Способ получения
                    </label>
                    <select
                      value={deliveryMethod}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-sans bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-xl transition-all cursor-pointer"
                    >
                      <option value="express">Автолайтэкспресс (бесплатно)</option>
                      <option value="post">Почта Беларуси / Белпочта (бесплатно)</option>
                      <option value="pickup">Самовывоз (г. Ивацевичи, ул. Свердлова, 5)</option>
                      <option value="courier">Курьер ООО «БелТехКомпания»</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-neutral-600 uppercase tracking-wider mb-1">
                      Адрес доставки
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      placeholder="Область, город, улица, дом..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-sans bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-xl transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-neutral-600 uppercase tracking-wider mb-1">
                      Комментарий к заказу
                    </label>
                    <textarea
                      rows={3}
                      maxLength={300}
                      placeholder="Дополнительные пожелания или примечания..."
                      value={comment}
                      onChange={(e) => setComment(sanitizeComment(e.target.value, 300))}
                      className="w-full px-3.5 py-2.5 text-xs font-sans bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#f5901e] focus:ring-2 focus:ring-[#f5901e]/20 focus:outline-hidden rounded-xl resize-none transition-all"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="cartpage-consent"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 rounded border-neutral-300 text-[#f5901e] focus:ring-[#f5901e] cursor-pointer"
                    />
                    <label htmlFor="cartpage-consent" className="text-[11px] font-sans text-neutral-600 leading-tight cursor-pointer">
                      Даю согласие на <span className="font-semibold text-neutral-800">обработку персональных данных</span> <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-gradient-to-r from-[#f5901e] to-[#e07f15] hover:from-[#ff9f2e] hover:to-[#f5901e] text-white font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-95 duration-200 shadow-lg shadow-[#f5901e]/30 cursor-pointer disabled:opacity-50 text-center"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>Отправка заказа...</span>
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 shrink-0" />
                        <span className="leading-snug">Подтвердить и отправить заказ</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}