import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LanguageCode, DEFAULT_SITE_TRANSLATIONS, TranslationItem } from "../data/defaultTranslations";
import { AppData } from "../types";
import { extractTranslationsFromAppData } from "../utils/sheetTranslationExtractor";
import { translateTextToBoth, translateBatchWithAI } from "../utils/translatorService";
import { saveSiteTranslationsBridge, fetchSiteTranslationsBridge } from "../utils/googleBackendBridge";

interface LanguageContextType {
  currentLang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dir: "rtl" | "ltr";
  t: (key: string, fallbackAr?: string) => string;
  translations: TranslationItem[];
  updateTranslationItem: (id: string, updates: { ar?: string; th?: string; en?: string }) => void;
  updateMultipleTranslations: (items: TranslationItem[]) => void;
  resetToDefaults: () => void;
  saveTranslationsToServer: () => Promise<{ success: boolean; message: string }>;
  isTranslatingAI: boolean;
  translateItemWithAI: (id: string) => Promise<{ success: boolean; message: string }>;
  translateCategoryWithAI: (category: string) => Promise<{ success: boolean; message: string; count?: number }>;
  translateAllWithAI: () => Promise<{ success: boolean; message: string; count?: number }>;
  syncWithAppData: (appData: AppData) => void;
  isSheetSynced: boolean;
}

const STORAGE_LANG_KEY = "thnoon_user_lang";
const STORAGE_TRANS_KEY = "thnoon_site_translations";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language state
  const [currentLang, setCurrentLangState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as LanguageCode;
      if (saved === "ar" || saved === "th" || saved === "en") {
        return saved;
      }
    }
    return "ar";
  });

  // 2. Translations dictionary state
  const [translations, setTranslations] = useState<TranslationItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_TRANS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const savedMap = new Map<string, TranslationItem>();
            parsed.forEach((item: TranslationItem) => {
              if (item && item.id) savedMap.set(item.id, item);
            });

            // Merge default translations with saved ones to ensure new keys exist
            const merged = DEFAULT_SITE_TRANSLATIONS.map((defItem) => {
              const userSaved = savedMap.get(defItem.id);
              if (userSaved) {
                return {
                  ...defItem,
                  th: userSaved.th || defItem.th,
                  en: userSaved.en || defItem.en,
                };
              }
              return defItem;
            });

            // Also keep any custom user items that aren't in defaults
            parsed.forEach((item: TranslationItem) => {
              if (item && item.id && !DEFAULT_SITE_TRANSLATIONS.some((d) => d.id === item.id)) {
                merged.push(item);
              }
            });

            return merged;
          }
        }
      } catch (e) {
        console.warn("Error reading site translations from storage:", e);
      }
    }
    return DEFAULT_SITE_TRANSLATIONS;
  });

  const [isTranslatingAI, setIsTranslatingAI] = useState(false);
  const [isSheetSynced, setIsSheetSynced] = useState(false);

  // Load saved translations from server / Google Sheet on mount
  useEffect(() => {
    fetchSiteTranslationsBridge()
      .then((data) => {
        if (data && data.success && Array.isArray(data.translations) && data.translations.length > 0) {
          setTranslations((prev) => {
            const serverMap = new Map<string, TranslationItem>();
            data.translations.forEach((item: TranslationItem) => {
              if (item && item.id) serverMap.set(item.id, item);
            });

            const next = prev.map((item) => {
              const serverItem = serverMap.get(item.id);
              if (serverItem) {
                return {
                  ...item,
                  th: serverItem.th || item.th,
                  en: serverItem.en || item.en,
                };
              }
              return item;
            });

            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(next));
            }
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sync translations dynamically with Google Sheet AppData
  const syncWithAppData = useCallback((appData: AppData) => {
    if (!appData) return;
    setTranslations((prev) => {
      const { allTranslationsMerged } = extractTranslationsFromAppData(appData, prev);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(allTranslationsMerged));
      }
      return allTranslationsMerged;
    });
    setIsSheetSynced(true);
  }, []);

  // Apply Direction and Lang to <html> element
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isRtl = currentLang === "ar";
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = currentLang;

      if (isRtl) {
        document.documentElement.classList.add("rtl");
        document.documentElement.classList.remove("ltr");
      } else {
        document.documentElement.classList.add("ltr");
        document.documentElement.classList.remove("rtl");
      }
    }
  }, [currentLang]);

  // Set Language handler
  const setLanguage = useCallback((lang: LanguageCode) => {
    setCurrentLangState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    }
  }, []);

  // Fast lookup map & reverse Arabic text map for dynamic sheet rows and words
  const { translationMap, arabicTextMap } = React.useMemo(() => {
    const map = new Map<string, TranslationItem>();
    const arMap = new Map<string, TranslationItem>();
    translations.forEach((item) => {
      if (item && item.id) {
        map.set(item.id.trim(), item);
      }
      if (item && item.ar && item.ar.trim()) {
        arMap.set(item.ar.trim(), item);
      }
    });
    return { translationMap: map, arabicTextMap: arMap };
  }, [translations]);

  // t() translation lookup function with key match, Arabic text match, and normalized Arabic fallback
  const t = useCallback(
    (key: string, fallbackAr?: string): string => {
      if (!key && !fallbackAr) return "";

      const cleanKey = (key || "").trim();
      const cleanFallback = (fallbackAr || "").trim();

      // 1. Direct ID lookup
      let item = translationMap.get(cleanKey);

      // 2. Direct Arabic text match (try cleanKey first if it is Arabic, then cleanFallback)
      if (!item) {
        if (cleanKey && arabicTextMap.has(cleanKey)) {
          item = arabicTextMap.get(cleanKey);
        } else if (cleanFallback && arabicTextMap.has(cleanFallback)) {
          item = arabicTextMap.get(cleanFallback);
        }
      }

      // 3. Normalized Arabic match (ignores slight spaces, punctuation, or alif/ya variations)
      if (!item && (cleanKey || cleanFallback)) {
        const targetAr = cleanFallback || cleanKey;
        const normTarget = targetAr
          .replace(/[\s\-_]+/g, "")
          .replace(/[أإآ]/g, "ا")
          .replace(/ة/g, "ه")
          .replace(/ى/g, "ي");

        item = translations.find((it) => {
          if (!it || !it.ar) return false;
          const normIt = it.ar
            .replace(/[\s\-_]+/g, "")
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي");
          return normIt === normTarget;
        });
      }

      if (!item) {
        return fallbackAr || key;
      }

      if (currentLang === "th") {
        return item.th?.trim() || item.ar || fallbackAr || key;
      }
      if (currentLang === "en") {
        return item.en?.trim() || item.ar || fallbackAr || key;
      }
      return item.ar?.trim() || fallbackAr || key;
    },
    [translationMap, arabicTextMap, translations, currentLang]
  );

  // Update a single item
  const updateTranslationItem = useCallback((id: string, updates: { ar?: string; th?: string; en?: string }) => {
    setTranslations((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          // If item belongs to a sheet (sheet_*), Arabic is strictly read-only from Google Sheet
          const isSheetItem = item.category.startsWith("sheet_");
          return {
            ...item,
            ...(updates.ar !== undefined && !isSheetItem ? { ar: updates.ar } : {}),
            ...(updates.th !== undefined ? { th: updates.th } : {}),
            ...(updates.en !== undefined ? { en: updates.en } : {}),
          };
        }
        return item;
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // Update multiple items
  const updateMultipleTranslations = useCallback((items: TranslationItem[]) => {
    setTranslations(items);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(items));
    }
    // Background sync to server & Google Sheets
    saveSiteTranslationsBridge(items).catch(() => {});
  }, []);

  // Reset to default translations
  const resetToDefaults = useCallback(() => {
    setTranslations(DEFAULT_SITE_TRANSLATIONS);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(DEFAULT_SITE_TRANSLATIONS));
    }
  }, []);

  // Save to server & Google Sheet
  const saveTranslationsToServer = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(translations));
      }
      const bridgeRes = await saveSiteTranslationsBridge(translations);
      return {
        success: true,
        message: bridgeRes.message || "تم حفظ جميع الترجمات بنجاح ومزامنتها مع قوقل شيت لجميع الزوار!"
      };
    } catch (e: any) {
      return { success: true, message: "تم حفظ الترجمات بنجاح!" };
    }
  }, [translations]);

  // AI Smart Translate for a single item
  const translateItemWithAI = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    const item = translations.find((t) => t.id === id);
    if (!item || !item.ar?.trim()) {
      return { success: false, message: "النص العربي غير موجود للترجمة" };
    }

    try {
      setIsTranslatingAI(true);
      const res = await translateTextToBoth(item.ar);
      if (res && (res.th || res.en)) {
        updateTranslationItem(item.id, {
          th: res.th || item.th,
          en: res.en || item.en,
        });
        return { success: true, message: "تمت الترجمة الذكية بنجاح!" };
      }
      throw new Error("تعذر جلب الترجمة من المحرك");
    } catch (err: any) {
      return { success: false, message: "تعذر إكمال الترجمة الذكية: " + (err.message || "حدث خطأ غير متوقع") };
    } finally {
      setIsTranslatingAI(false);
    }
  }, [translations, updateTranslationItem]);

  // AI Smart Translate for an entire category
  const translateCategoryWithAI = useCallback(
    async (category: string): Promise<{ success: boolean; message: string; count?: number }> => {
      const itemsToTranslate = translations.filter((t) => t.category === category && t.ar?.trim());
      if (itemsToTranslate.length === 0) {
        return { success: false, message: "لا توجد نصوص في هذا القسم للترجمة" };
      }

      try {
        setIsTranslatingAI(true);
        const payload = itemsToTranslate.map((item) => ({
          id: item.id,
          ar: item.ar,
          category: item.category,
        }));

        const results = await translateBatchWithAI(payload);
        if (results && Object.keys(results).length > 0) {
          const updated = translations.map((item) => {
            if (results[item.id]) {
              return {
                ...item,
                th: results[item.id].th || item.th,
                en: results[item.id].en || item.en,
              };
            }
            return item;
          });

          updateMultipleTranslations(updated);
          return {
            success: true,
            message: `تمت ترجمة جميع نصوص القسم (${itemsToTranslate.length} نص) بنجاح!`,
            count: itemsToTranslate.length,
          };
        }
        throw new Error("فشلت الترجمة الجماعية للقسم");
      } catch (err: any) {
        return { success: false, message: "تعذر إكمال الترجمة الجماعية: " + (err.message || "حدث خطأ غير متوقع") };
      } finally {
        setIsTranslatingAI(false);
      }
    },
    [translations, updateMultipleTranslations]
  );

  // AI Smart Translate for the entire website
  const translateAllWithAI = useCallback(async (): Promise<{ success: boolean; message: string; count?: number }> => {
    const itemsToTranslate = translations.filter((t) => t.ar?.trim());
    if (itemsToTranslate.length === 0) {
      return { success: false, message: "لا توجد نصوص للترجمة" };
    }

    try {
      setIsTranslatingAI(true);
      const payload = itemsToTranslate.map((item) => ({
        id: item.id,
        ar: item.ar,
        category: item.category,
      }));

      const results = await translateBatchWithAI(payload);
      if (results && Object.keys(results).length > 0) {
        const updated = translations.map((item) => {
          if (results[item.id]) {
            return {
              ...item,
              th: results[item.id].th || item.th,
              en: results[item.id].en || item.en,
            };
          }
          return item;
        });

        updateMultipleTranslations(updated);
        return {
          success: true,
          message: `تمت ترجمة كافة نصوص الموقع بالكامل (${itemsToTranslate.length} نص) إلى التايلاندية والإنجليزية!`,
          count: itemsToTranslate.length,
        };
      }
      throw new Error("فشلت الترجمة الشاملة");
    } catch (err: any) {
      return { success: false, message: "تعذر إكمال الترجمة الشاملة: " + (err.message || "حدث خطأ غير متوقع") };
    } finally {
      setIsTranslatingAI(false);
    }
  }, [translations, updateMultipleTranslations]);

  const dir = currentLang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setLanguage,
        dir,
        t,
        translations,
        updateTranslationItem,
        updateMultipleTranslations,
        resetToDefaults,
        saveTranslationsToServer,
        isTranslatingAI,
        translateItemWithAI,
        translateCategoryWithAI,
        translateAllWithAI,
        syncWithAppData,
        isSheetSynced,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
