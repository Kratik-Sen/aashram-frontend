import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const LanguageToggle = ({ compact = false }) => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-200 bg-white text-xs font-bold shadow-sm dark:border-slate-700 dark:bg-[#101214]" data-no-translate>
      {!compact ? <Languages className="ml-2 h-4 w-4 text-slate-500 dark:text-slate-300" /> : null}
      <button
        type="button"
        className={`px-2.5 py-2 transition ${language === "en" ? "bg-saffron-600 text-white" : "text-slate-600 hover:text-saffron-700 dark:text-slate-200 dark:hover:text-saffron-300"}`}
        onClick={() => changeLanguage("en")}
        aria-label="Switch to English"
        title="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        className={`px-2.5 py-2 transition ${language === "hi" ? "bg-saffron-600 text-white" : "text-slate-600 hover:text-saffron-700 dark:text-slate-200 dark:hover:text-saffron-300"}`}
        onClick={() => changeLanguage("hi")}
        aria-label="Switch to Hinglish"
        title="Switch to Hinglish"
      >
        HIN
      </button>
    </div>
  );
};

export default LanguageToggle;
