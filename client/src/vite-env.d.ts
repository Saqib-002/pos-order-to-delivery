/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DRIVER_API_URL?: string;
  readonly VITE_DRIVER_WS_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly MODE: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
