import { GoogleGenAI } from "@google/genai";

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwdupPOk2KJr9MzfZM_JTA8GCbQFx8mlFH6cCxn0JLcH6J8g_yfrKmMTt08zZpLEcZ/exec";

// Fast dictionary for standard institution terms
const KNOWN_TERMS: Record<string, { th: string; en: string }> = {
  "مؤسسة يوسف ذنون للخط العربي": {
    th: "สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันنูน",
    en: "Yousuf Dhannoon Arabic Calligraphy Institute"
  },
  "مؤسسة يوسف ذنون": {
    th: "สถาบัน ยูซุฟ ซันنูน",
    en: "Yousuf Dhannoon Institute"
  },
  "الخط العربي": {
    th: "ศิลปะการคัดลายมืออาหรับ",
    en: "Arabic Calligraphy"
  },
  "بوابة المشتركين": {
    th: "พอร์ทัลสมาชิก",
    en: "Subscriber Portal"
  },
  "تسجيل الدخول": {
    th: "เข้าสู่ระบบ",
    en: "Log In"
  }
};

async function translateWithMyMemory(text: string, targetLang: "en" | "th"): Promise<string> {
  try {
    const cleaned = text.trim().slice(0, 480);
    if (!cleaned) return "";
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleaned)}&langpair=ar|${targetLang}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        const tr = data.responseData.translatedText.trim();
        if (tr && tr !== "?" && !tr.includes("MYMEMORY WARNING:")) {
          return tr;
        }
      }
    }
  } catch (e) {}
  return "";
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const items = body?.items as Array<{ id: string; ar: string }>;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "لا توجد نصوص لترجمتها" });
    }

    const validItems = items.filter((it) => it && it.id && it.ar && typeof it.ar === "string" && it.ar.trim());
    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: "كافة النصوص المحددة فارغة" });
    }

    const results: Record<string, { th: string; en: string }> = {};
    const pendingItems: Array<{ id: string; ar: string }> = [];

    // 1. Check known terms
    for (const item of validItems) {
      const cleanAr = item.ar.trim();
      if (KNOWN_TERMS[cleanAr]) {
        results[item.id] = { ...KNOWN_TERMS[cleanAr] };
      } else {
        pendingItems.push({ id: item.id, ar: cleanAr });
      }
    }

    // 2. Try Gemini API if GEMINI_API_KEY is available
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiApiKey && pendingItems.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const prompt = `You are a professional multilingual translator specializing in Arabic, English, and Thai.
Translate the following list of Arabic texts into English and Thai with cultural precision for an Islamic Arabic calligraphy institution.
NEVER return Arabic text in English or Thai fields. Thai translation MUST be in Thai script.

Input JSON:
${JSON.stringify(pendingItems.map((p) => ({ id: p.id, text: p.ar })), null, 2)}

Return ONLY valid JSON matching:
{
  "id": { "en": "English text", "th": "ข้อความภาษาไทย" }
}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const text = aiResponse.text || "{}";
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          for (const p of pendingItems) {
            if (parsed[p.id]?.en && parsed[p.id]?.th) {
              results[p.id] = {
                en: String(parsed[p.id].en).trim(),
                th: String(parsed[p.id].th).trim()
              };
            }
          }
        }
      } catch (geminiErr) {
        console.warn("Vercel api/ai-translate-texts Gemini error:", geminiErr);
      }
    }

    // 3. Try Google Apps Script translateTexts
    const remainingForGas = pendingItems.filter((p) => !results[p.id]);
    if (remainingForGas.length > 0) {
      const scriptUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
      try {
        const gasRes = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "translateTexts",
            items: remainingForGas.map((r) => ({ id: r.id, text: r.ar }))
          }),
          signal: AbortSignal.timeout(7000)
        });
        if (gasRes.ok) {
          const gasData = await gasRes.json().catch(() => null);
          const gasResults = gasData?.results || gasData?.data?.results;
          if (gasResults && typeof gasResults === "object") {
            for (const r of remainingForGas) {
              if (gasResults[r.id]?.en && gasResults[r.id]?.th) {
                results[r.id] = gasResults[r.id];
              }
            }
          }
        }
      } catch (gasErr) {
        console.warn("Vercel api/ai-translate-texts GAS error:", gasErr);
      }
    }

    // 4. Client/Server Fallback via MyMemory
    const remainingForMyMem = pendingItems.filter((p) => !results[p.id]);
    if (remainingForMyMem.length > 0) {
      await Promise.all(
        remainingForMyMem.map(async (item) => {
          const [en, th] = await Promise.all([
            translateWithMyMemory(item.ar, "en"),
            translateWithMyMemory(item.ar, "th")
          ]);
          results[item.id] = {
            en: en || item.ar,
            th: th || item.ar
          };
        })
      );
    }

    return res.status(200).json({
      success: true,
      results
    });
  } catch (err: any) {
    console.error("Vercel api/ai-translate-texts error:", err);
    return res.status(500).json({
      success: false,
      message: "خطأ في معالجة الترجمة: " + (err?.message || "خطأ غير متوقع")
    });
  }
}
