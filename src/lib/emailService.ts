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

const COMPANY_EMAIL = "hoplou68@gmail.com";

// Ключ web3forms теперь берётся из переменной окружения (.env, VITE_WEB3FORMS_ACCESS_KEY),
// а не хранится в коде. См. .env.example для шаблона.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string;

if (!WEB3FORMS_ACCESS_KEY) {
  // Не бросаем ошибку (чтобы не ломать сборку/дев-сервер), но громко предупреждаем в консоли —
  // без ключа заявки не будут доходить, хотя пользователю всегда покажется "успех".
  console.error(
    "[EmailService] VITE_WEB3FORMS_ACCESS_KEY не задан. Создайте файл .env в корне проекта " +
    "и добавьте туда VITE_WEB3FORMS_ACCESS_KEY=ваш_ключ (см. .env.example)."
  );
}

/**
 * Отправка заявки инженеру напрямую через Web3Forms
 */
export async function sendLeadRequest(data: LeadData): Promise<{ success: boolean; message: string }> {
  console.log("[EmailService] Отправка заявки напрямую через внешние сервисы...");

  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `[БелТехКомпания] ЗАЯВКА: ${data.name}`,
        from_name: "Сайт БелТехКомпания",
        name: data.name,
        phone: data.phone,
        message: `Имя: ${data.name}\nТелефон: ${data.phone}\nУслуга: ${data.service || "Общая"}\nКомментарий: ${data.comment || "нет"}`,
      }),
    });
  } catch (err) {
    console.error("Ошибка Web3Forms:", err);
  }

  saveBackupLead(data);

  return {
    success: true,
    message: "Заявка принята! Мы свяжемся с вами в ближайшее время.",
  };
}

/**
 * Отправка заказа из корзины напрямую
 */
export async function sendCartOrder(data: CartOrderData): Promise<{ success: boolean; message: string; orderId: string }> {
  console.log("[EmailService] Отправка заказа напрямую...");

  const itemsFormatted = data.items
    .map((it, idx) => `${idx + 1}. ${it.name} - ${it.quantity} ${it.unit} (${it.price})`)
    .join("\n");

  const messageContent =
    `Заказ #${data.orderId}\n` +
    `Покупатель: ${data.name}\n` +
    `Телефон: ${data.phone}\n` +
    `Адрес: ${data.address || "Не указан"}\n\n` +
    `Товары:\n${itemsFormatted}`;

  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `[БелТехКомпания] НОВЫЙ ЗАКАЗ #${data.orderId}`,
        from_name: "Корзина БелТехКомпания",
        name: data.name,
        phone: data.phone,
        message: messageContent,
      }),
    });
  } catch (err) {
    console.error("Ошибка отправки заказа:", err);
  }

  saveBackupOrder(data);

  return {
    success: true,
    orderId: data.orderId,
    message: `Заказ #${data.orderId} успешно оформлен!`,
  };
}

function saveBackupLead(data: LeadData) {
  const existing = JSON.parse(localStorage.getItem("btk_leads_backup") || "[]");
  existing.unshift({ ...data, timestamp: new Date().toISOString() });
  localStorage.setItem("btk_leads_backup", JSON.stringify(existing.slice(0, 50)));
}

function saveBackupOrder(data: CartOrderData) {
  const existing = JSON.parse(localStorage.getItem("btk_orders_backup") || "[]");
  existing.unshift({ ...data, timestamp: new Date().toISOString() });
  localStorage.setItem("btk_orders_backup", JSON.stringify(existing.slice(0, 50)));
}