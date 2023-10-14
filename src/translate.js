import { useRouter } from "next/router";
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";

const translate = (title) => {
  const router = useRouter();
  const locale = router.locale || "en"; 

  const translations = locale === "en" ? enTranslations : esTranslations;

  const translatedTitle = translations[title] || title;

  return translatedTitle;
};

export default translate;
