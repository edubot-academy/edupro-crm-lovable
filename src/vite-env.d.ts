/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LMS_COMPANY_ID?: string;
  readonly VITE_ENABLE_CRM?: string;
  readonly VITE_ENABLE_LMS_BRIDGE?: string;
  readonly VITE_ENABLE_TRIAL_LESSONS?: string;
  readonly VITE_ENABLE_RETENTION?: string;
  readonly VITE_ENABLE_TELEGRAM?: string;
  readonly VITE_ENABLE_ADVANCED_REPORTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
