import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import enTranslation from "./locales/en/translation.json";
import hiTranslation from "./locales/hi/translation.json";
import mrTranslation from "./locales/mr/translation.json";
import orTranslation from "./locales/or/translation.json";

// Custom async language detector for React Native
const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: (callback) => {
    AsyncStorage.getItem("user-language").then((lang) => {
      if (lang) {
        callback(lang);
      } else {
        // Default device language
        const deviceLang = Localization.locale.split("-")[0];
        callback(deviceLang);
      }
    });
  },
  init: () => {},
  cacheUserLanguage: (lang) => {
    AsyncStorage.setItem("user-language", lang);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    fallbackLng: "en",
    resources: {
      en: { translation: enTranslation },
      hi: { translation: hiTranslation },
      mr: { translation: mrTranslation },
      or: { translation: orTranslation },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
