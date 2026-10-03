// Client-Side Direct Email & Notification Dispatcher for ООО «БелТехКомпания»
// Полностью автономная версия (БЕЗ БЭКЕНДА)

export interface LeadData {
  name: string;
  phone: string;
  service?: string;
  comment?: string;
  contactMethod?: string;
  details?: string;
}

export interface CartOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: string;
}

export interface CartOrderData {
  orderId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  deliveryMethod?: string;
  comment?: string;
  items: CartOrderItem[];
}

// Ключ web3forms берётся из переменной окружения (.env, VITE_WEB3FORMS_ACCESS_KEY)
// и вшивается в код на этапе сборки. См. .env.example для шаблона.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string;

// Данные Telegram-бота — тоже из .env (VITE_TELEGRAM_BOT_TOKEN, VITE_TELEGRAM_CHAT_ID)
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID as string;

if (!WEB3FORMS_ACCESS_KEY) {
  console.error(
    "[EmailService] VITE_WEB3FORMS_ACCESS_KEY не задан. Создайте файл .env в корне проекта " +
      "и добавьте туда VITE_WEB3FORMS_ACCESS_KEY=ваш_ключ (см. .env.example). " +
      "Для деплоя через GitHub Actions добавьте ключ в Secrets и передайте его в шаг сборки."
  );
}

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn(
    "[TelegramService] VITE_TELEGRAM_BOT_TOKEN или VITE_TELEGRAM_CHAT_ID не заданы — " +
      "уведомления в Telegram отправляться не будут (почта продолжит работать как раньше)."
  );
}

const FAIL_MESSAGE =
  "Не удалось отправить. Попробуйте ещё раз или позвоните нам напрямую.";

/**
 * Отправляет данные в Web3Forms и возвращает true ТОЛЬКО если сервис
 * подтвердил успех (success: true). Нет ключа, сеть упала или сервис
 * вернул ошибку — возвращается false.
 */
async function postToWeb3Forms(payload: Record<string, string>): Promise<boolean> {
  if (!WEB3FORMS_ACCESS_KEY) return false;

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_ACCESS_KEY, ...payload }),
    });
    const json = await res.json();
    console.log("[EmailService] статус:", res.status, "ответ:", json);
    if (!(res.ok && json.success === true)) {
      console.error("[EmailService] Web3Forms вернул ошибку:", json);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[EmailService] Ошибка Web3Forms:", err);
    return false;
  }
}

/**
 * Отправляет текстовое сообщение в Telegram через Bot API.
 * Не блокирует и не ломает основной поток, если бот не настроен или упал —
 * просто логирует ошибку и возвращает false.
 */
async function postToTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );
    const json = await res.json();
    if (!(res.ok && json.ok === true)) {
      console.error("[TelegramService] Telegram вернул ошибку:", json);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[TelegramService] Ошибка отправки в Telegram:", err);
    return false;
  }
}

/**
 * Отправка заявки инженеру напрямую через Web3Forms + Telegram
 */
export async function sendLeadRequest(
  data: LeadData
): Promise<{ success: boolean; message: string }> {
  const telegramText =
    `<b>🔧 Новая заявка с сайта</b>\n\n` +
    `<b>Имя:</b> ${escapeHtml(data.name)}\n` +
    `<b>Телефон:</b> ${escapeHtml(data.phone)}\n` +
    `<b>Способ связи:</b> ${escapeHtml(data.contactMethod || "не указан")}\n` +
    `<b>Услуга:</b> ${escapeHtml(data.service || "Общая")}\n` +
    `<b>Комментарий:</b> ${escapeHtml(data.comment || "нет")}\n` +
    `<b>Детали:</b> ${escapeHtml(data.details || "нет")}`;

  const [emailOk] = await Promise.allSettled([
    postToWeb3Forms({
      subject: `[БелТехКомпания] ЗАЯВКА: ${data.name}`,
      from_name: "Сайт БелТехКомпания",
      name: data.name,
      phone: data.phone,
      message:
        `Имя: ${data.name}\n` +
        `Телефон: ${data.phone}\n` +
        `Способ связи: ${data.contactMethod || "не указан"}\n` +
        `Услуга: ${data.service || "Общая"}\n` +
        `Комментарий: ${data.comment || "нет"}\n` +
        `Детали: ${data.details || "нет"}`,
    }),
    postToTelegram(telegramText),
  ]).then((results) => results.map((r) => (r.status === "fulfilled" ? r.value : false)));

  if (!emailOk) {
    saveBackupLead(data);
    return { success: false, message: FAIL_MESSAGE };
  }

  return {
    success: true,
    message: "Заявка принята! Мы свяжемся с вами в ближайшее время.",
  };
}

/**
 * Отправка заказа из корзины напрямую через Web3Forms + Telegram
 */
export async function sendCartOrder(
  data: CartOrderData
): Promise<{ success: boolean; message: string; orderId: string }> {
  const itemsFormatted = data.items
    .map((it, idx) => `${idx + 1}. ${it.name} - ${it.quantity} ${it.unit} (${it.price})`)
    .join("\n");

  const telegramItemsFormatted = data.items
    .map((it, idx) => `${idx + 1}. ${escapeHtml(it.name)} — ${it.quantity} ${escapeHtml(it.unit)} (${escapeHtml(it.price)})`)
    .join("\n");

  const telegramText =
    `<b>🛒 Новый заказ #${escapeHtml(data.orderId)}</b>\n\n` +
    `<b>Покупатель:</b> ${escapeHtml(data.name)}\n` +
    `<b>Телефон:</b> ${escapeHtml(data.phone)}\n` +
    `<b>Email:</b> ${escapeHtml(data.email || "не указан")}\n` +
    `<b>Получение:</b> ${escapeHtml(data.deliveryMethod || "не указано")}\n` +
    `<b>Адрес:</b> ${escapeHtml(data.address || "не указан")}\n` +
    `<b>Комментарий:</b> ${escapeHtml(data.comment || "нет")}\n\n` +
    `<b>Товары:</b>\n${telegramItemsFormatted}`;

  const [emailOk] = await Promise.allSettled([
    postToWeb3Forms({
      subject: `[БелТехКомпания] НОВЫЙ ЗАКАЗ #${data.orderId}`,
      from_name: "Корзина БелТехКомпания",
      name: data.name,
      phone: data.phone,
      ...(data.email ? { email: data.email } : {}),
      message:
        `Заказ #${data.orderId}\n` +
        `Покупатель: ${data.name}\n` +
        `Телефон: ${data.phone}\n` +
        `Email: ${data.email || "не указан"}\n` +
        `Получение: ${data.deliveryMethod || "не указано"}\n` +
        `Адрес: ${data.address || "не указан"}\n` +
        `Комментарий: ${data.comment || "нет"}\n\n` +
        `Товары:\n${itemsFormatted}`,
    }),
    postToTelegram(telegramText),
  ]).then((results) => results.map((r) => (r.status === "fulfilled" ? r.value : false)));

  if (!emailOk) {
    saveBackupOrder(data);
    return { success: false, orderId: data.orderId, message: FAIL_MESSAGE };
  }

  return {
    success: true,
    orderId: data.orderId,
    message: `Заказ #${data.orderId} успешно оформлен!`,
  };
}

// Простейшее экранирование для Telegram HTML parse_mode, чтобы спецсимволы
// в имени/комментарии (< > &) не ломали форматирование сообщения
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Резервная копия хранится в браузере посетителя и вам недоступна —
// это лишь подстраховка на случай сбоя, а не способ получить заказ.
function saveBackupLead(data: LeadData) {
  try {
    const existing = JSON.parse(localStorage.getItem("btk_leads_backup") || "[]");
    existing.unshift({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem("btk_leads_backup", JSON.stringify(existing.slice(0, 50)));
  } catch {
    /* localStorage может быть недоступен — игнорируем */
  }
}

function saveBackupOrder(data: CartOrderData) {
  try {
    const existing = JSON.parse(localStorage.getItem("btk_orders_backup") || "[]");
    existing.unshift({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem("btk_orders_backup", JSON.stringify(existing.slice(0, 50)));
  } catch {
    /* localStorage может быть недоступен — игнорируем */
  }
}