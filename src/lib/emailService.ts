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

if (!WEB3FORMS_ACCESS_KEY) {
  console.error(
    "[EmailService] VITE_WEB3FORMS_ACCESS_KEY не задан. Создайте файл .env в корне проекта " +
    "и добавьте туда VITE_WEB3FORMS_ACCESS_KEY=ваш_ключ (см. .env.example). " +
    "Для деплоя через GitHub Actions добавьте ключ в Secrets и передайте его в шаг сборки."
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
 * Отправка заявки инженеру напрямую через Web3Forms
 */
export async function sendLeadRequest(data: LeadData): Promise<{ success: boolean; message: string }> {
  const ok = await postToWeb3Forms({
    subject: `[БелТехКомпания] ЗАЯВКА: ${data.name}`,
    from_name: "Сайт БелТехКомпания",
    name: data.name,
    phone: data.phone,
    message:
      `Имя: ${data.name}\n` +
      `Телефон: ${data.phone}\n` +
      `Услуга: ${data.service || "Общая"}\n` +
      `Комментарий: ${data.comment || "нет"}`,
  });

  if (!ok) {
    saveBackupLead(data);
    return { success: false, message: FAIL_MESSAGE };
  }

  return {
    success: true,
    message: "Заявка принята! Мы свяжемся с вами в ближайшее время.",
  };
}

/**
 * Отправка заказа из корзины напрямую
 */
export async function sendCartOrder(
  data: CartOrderData
): Promise<{ success: boolean; message: string; orderId: string }> {
  const itemsFormatted = data.items
    .map((it, idx) => `${idx + 1}. ${it.name} - ${it.quantity} ${it.unit} (${it.price})`)
    .join("\n");

  const ok = await postToWeb3Forms({
    subject: `[БелТехКомпания] НОВЫЙ ЗАКАЗ #${data.orderId}`,
    from_name: "Корзина БелТехКомпания",
    name: data.name,
    phone: data.phone,
    message:
      `Заказ #${data.orderId}\n` +
      `Покупатель: ${data.name}\n` +
      `Телефон: ${data.phone}\n` +
      `Адрес: ${data.address || "Не указан"}\n\n` +
      `Товары:\n${itemsFormatted}`,
  });

  if (!ok) {
    saveBackupOrder(data);
    return { success: false, orderId: data.orderId, message: FAIL_MESSAGE };
  }

  return {
    success: true,
    orderId: data.orderId,
    message: `Заказ #${data.orderId} успешно оформлен!`,
  };
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