import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en/translation.json";
import hi from "../locales/hi/translation.json";
import mr from "../locales/mr/translation.json";
import or from "../locales/or/translation.json";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  lng: "en",
  fallbackLng: "en",

  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
    or: { translation: or },
  },

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
