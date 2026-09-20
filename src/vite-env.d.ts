/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMAIL_WEBHOOK_URL?: string;
  readonly VITE_CLOUDFLARE_WORKER_URL?: string;
  readonly VITE_WEB3FORMS_KEY?: string;
  readonly VITE_TELEGRAM_BOT_TOKEN?: string;
  readonly VITE_TELEGRAM_CHAT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}