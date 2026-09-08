import { DEFAULT_SITE_TRANSLATIONS, TranslationItem } from "../data/defaultTranslations";
import { executeAppsScriptPost, DEFAULT_SCRIPT_URL } from "./googleBackendBridge";

export interface TranslationResult {
  th: string;
  en: string;
}

export interface TranslationBatchItem {
  id: string;
  ar: string;
  category?: string;
}

// Built-in offline dictionary for rapid fallback
const KNOWN_TERMS: Record<string, { en: string; th: string }> = {
  "الرئيسية": { en: "Home", th: "หน้าแรก" },
  "عن المؤسسة": { en: "About Us", th: "เกี่ยวกับสถาบัน" },
  "معرض الصور": { en: "Photo Gallery", th: "แกลเลอรีภาพถ่าย" },
  "الفيديوهات": { en: "Videos", th: "วิดีโอ" },
  "البرامج التعليمية": { en: "Educational Programs", th: "หลักสูตรการเรียนการสอน" },
  "أدوات الخط": { en: "Calligraphy Tools", th: "อุปกรณ์คัดลายมือ" },
  "تواصل معنا": { en: "Contact Us", th: "ติดต่อเรา" },
  "دخول المشتركين": { en: "Subscriber Login", th: "เข้าสู่ระบบสมาชิก" },
  "تسجيل مشترك جديد": { en: "New Registration", th: "ลงทะเบียนสมาชิกใหม่" },
  "تسجيل الخروج": { en: "Logout", th: "ออกจากระบบ" },
  "لوحة المشرف": { en: "Admin Panel", th: "แผงผู้ดูแลระบบ" },
  "تعليم": { en: "Education", th: "การศึกษา" },
  "قلم": { en: "Pen", th: "ปากกา" },
  "ضمان": { en: "Guarantee", th: "การรับประกัน" },
  "شهادة": { en: "Certificate", th: "ใบประกาศนียบัตร" },
  "الترخيص الخطّي": { en: "Calligraphic Licensing", th: "การอนุญาตและใบประกาศนียบัตร" },
  "التعليم النظامي": { en: "Structured Learning", th: "การศึกษาตามหลักสูตร" },
  "مكتبة نادرة": { en: "Rare Library", th: "ห้องสมุดหายาก" },
  "الواجهة الترحيبية ومستجدات المؤسسة": { en: "Welcome Interface & Institution Updates", th: "หน้าต้อนรับและข่าวสารอัปเดตของสถาบัน" },
  "أقسام ومعلومات المؤسسة الإضافية": { en: "Additional Sections & Information", th: "หมวดหมู่และข้อมูลเพิ่มเติมของสถาบัน" },
  "مؤسسة يوسف ذنون للخط العربي": { en: "Yousuf Dhannoon Arabic Calligraphy Institute", th: "สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันنูน" },
  "مؤسسة يوسف ذنون": { en: "Yousuf Dhannoon Institute", th: "สถาบัน ยูซุฟ ซันنูน" },
  "جميع الحقوق محفوظة ومسجلة": { en: "All rights reserved and registered", th: "สงวนลิขสิทธิ์และจดทะเบียนถูกต้อง" },
};

// Populate known terms from DEFAULT_SITE_TRANSLATIONS
DEFAULT_SITE_TRANSLATIONS.forEach((item) => {
  if (item && item.ar && item.ar.trim()) {
    const key = item.ar.trim();
    if (!KNOWN_TERMS[key]) {
      KNOWN_TERMS[key] = {
        en: item.en || "",
        th: item.th || "",
      };
    }
  }
});

/**
 * Instant offline dictionary lookup
 */
export function getInstantLookup(text: string): { en: string; th: string } | null {
  if (!text) return null;
  const cleaned = cleanText(text);
  if (KNOWN_TERMS[cleaned]) {
    return KNOWN_TERMS[cleaned];
  }
  return null;
}

/**
 * Clean text for translation
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

/**
 * Free translation via MyMemory API with rate-limit handling and JSON parsing
 */
async function translateWithMyMemory(text: string, targetLang: "en" | "th"): Promise<string> {
  const cleaned = cleanText(text);
  if (!cleaned) return "";

  try {
    const langpair = `ar|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleaned)}&langpair=${langpair}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        let result = data.responseData.translatedText.trim();
        // Remove common MyMemory error prefixes if quota reached on free tier
        if (!result.includes("MYMEMORY WARNING:") && !result.includes("QUERY LENGTH LIMIT")) {
          return result;
        }
      }
    }
  } catch (err) {
    // Timeout or network glitch
  }
  return "";
}

/**
 * Free translation via Google Translate Web endpoint (CORS-friendly gtx client)
 */
async function translateWithGoogleGtx(text: string, targetLang: "en" | "th"): Promise<string> {
  const cleaned = cleanText(text);
  if (!cleaned) return "";

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleaned)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && Array.isArray(json[0])) {
        const translated = json[0].map((item: any) => item[0]).join(" ");
        if (translated && translated.trim()) {
          return translated.trim();
        }
      }
    }
  } catch (err) {
    // Network or CORS restriction on some browsers
  }
  return "";
}

/**
 * Translate using the backend Google Apps Script web app (via LanguageApp)
 */
async function translateWithAppsScript(
  items: TranslationBatchItem[],
  customScriptUrl?: string
): Promise<Record<string, TranslationResult> | null> {
  try {
    const scriptUrl = customScriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
    if (!scriptUrl) return null;

    const payload = {
      action: "translateTexts",
      items: items.map((it) => ({
        id: it.id,
        text: cleanText(it.ar),
      })),
    };

    const res = await executeAppsScriptPost(payload, scriptUrl);
    if (res && res.success && res.results) {
      return res.results;
    }
  } catch (err) {
    // GAS translation not configured or timed out
  }
  return null;
}

/**
 * Translate using the Express server API (when running in full-stack container)
 */
async function translateWithServerApi(
  items: TranslationBatchItem[]
): Promise<Record<string, TranslationResult> | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch("/api/ai-translate-texts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.results) {
        return data.results;
      }
    }
  } catch (err) {
    // Express server not present (e.g. static hosting on Vercel / GitHub)
  }
  return null;
}

/**
 * Translates a single text from Arabic to Thai and English using multi-tiered fallback
 */
export async function translateTextToBoth(
  arabicText: string,
  customScriptUrl?: string
): Promise<TranslationResult> {
  const clean = cleanText(arabicText);
  if (!clean) return { th: "", en: "" };

  // 1. Check known dictionary
  if (KNOWN_TERMS[clean]) {
    const match = KNOWN_TERMS[clean];
    if (match.th && match.en) {
      return { th: match.th, en: match.en };
    }
  }

  // 2. Try Apps Script or Server API
  const serverResult = await translateWithServerApi([{ id: "single", ar: clean }]);
  if (serverResult && serverResult["single"] && serverResult["single"].th && serverResult["single"].en) {
    return serverResult["single"];
  }

  // 3. Try MyMemory API directly in browser
  const [myMemEn, myMemTh] = await Promise.all([
    translateWithMyMemory(clean, "en"),
    translateWithMyMemory(clean, "th"),
  ]);

  let finalEn = myMemEn;
  let finalTh = myMemTh;

  // 4. Try Google GTX if still missing
  if (!finalEn) {
    finalEn = await translateWithGoogleGtx(clean, "en");
  }
  if (!finalTh) {
    finalTh = await translateWithGoogleGtx(clean, "th");
  }

  // 5. Final fallback
  if (!finalEn) finalEn = clean;
  if (!finalTh) finalTh = clean;

  return { th: finalTh, en: finalEn };
}

/**
 * Translates a batch of translation items efficiently with fallback resilience
 */
export async function translateBatchWithAI(
  items: TranslationBatchItem[],
  customScriptUrl?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Record<string, TranslationResult>> {
  if (!items || items.length === 0) return {};

  const results: Record<string, TranslationResult> = {};
  const pendingItems: TranslationBatchItem[] = [];

  // Step 1: Check offline dictionary first (instant)
  for (const item of items) {
    const cleanAr = cleanText(item.ar);
    if (!cleanAr) {
      results[item.id] = { th: "", en: "" };
      continue;
    }

    if (KNOWN_TERMS[cleanAr] && KNOWN_TERMS[cleanAr].th && KNOWN_TERMS[cleanAr].en) {
      results[item.id] = {
        th: KNOWN_TERMS[cleanAr].th,
        en: KNOWN_TERMS[cleanAr].en,
      };
    } else {
      pendingItems.push(item);
    }
  }

  if (pendingItems.length === 0) {
    if (onProgress) onProgress(items.length, items.length);
    return results;
  }

  // Step 2: Try Server API if available
  const serverResults = await translateWithServerApi(pendingItems);
  if (serverResults) {
    Object.assign(results, serverResults);
    if (onProgress) onProgress(items.length, items.length);
    return results;
  }

  // Step 3: Try Google Apps Script Bridge
  const gasResults = await translateWithAppsScript(pendingItems, customScriptUrl);
  if (gasResults) {
    Object.assign(results, gasResults);
    if (onProgress) onProgress(items.length, items.length);
    return results;
  }

  // Step 4: Client-side parallel batch processing with MyMemory & Google GTX
  // Process in small batches of 3 to avoid rate limits
  const BATCH_SIZE = 3;
  let completedCount = items.length - pendingItems.length;

  for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
    const chunk = pendingItems.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      chunk.map(async (item) => {
        const cleanAr = cleanText(item.ar);
        
        let en = await translateWithMyMemory(cleanAr, "en");
        if (!en) en = await translateWithGoogleGtx(cleanAr, "en");
        if (!en) en = cleanAr;

        let th = await translateWithMyMemory(cleanAr, "th");
        if (!th) th = await translateWithGoogleGtx(cleanAr, "th");
        if (!th) th = cleanAr;

        results[item.id] = { th, en };
        completedCount++;
        if (onProgress) onProgress(completedCount, items.length);
      })
    );

    // Small delay between chunks to be polite to free APIs
    if (i + BATCH_SIZE < pendingItems.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}
