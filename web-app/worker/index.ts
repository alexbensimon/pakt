declare global {
  interface Window {
    __WB_DISABLE_DEV_LOGS: boolean;
  }
}

self.__WB_DISABLE_DEV_LOGS = true;

export {};
