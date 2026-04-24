/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LMS_COMPANY_ID?: string;
  readonly VITE_ENABLE_LMS_BRIDGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
