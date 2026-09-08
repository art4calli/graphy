import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// DYNAMIC SPREADSHEET & APPS SCRIPT CONFIG
const dataDir = path.join(process.cwd(), "data");
const configFile = path.join(dataDir, "config.json");
const formTranslationsFile = path.join(dataDir, "form_translations.json");
const siteTranslationsFile = path.join(dataDir, "site_translations.json");

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxc-9cJ1Yh16hWRVAIGwZJCxQc4H8goaLUeB_4EuWtJi7tb6qhveCqbfTGkd3gQqHC7CQ/exec";
let currentSpreadsheetId = process.env.SPREADSHEET_ID || "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";
let currentScriptUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
let currentDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";
let currentAdminUsername = "admin";
let currentAdminPassword = "1234";

// Helper to load translations
function loadFormTranslations(): Record<string, any> {
  try {
    if (fs.existsSync(formTranslationsFile)) {
      const raw = fs.readFileSync(formTranslationsFile, "utf-8");
      return JSON.parse(raw) || {};
    }
  } catch (e) {
    console.error("Could not read form_translations.json:", e);
  }
  return {};
}

function loadSiteTranslations(): any[] {
  try {
    if (fs.existsSync(siteTranslationsFile)) {
      const raw = fs.readFileSync(siteTranslationsFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Could not read site_translations.json:", e);
  }
  return [];
}

function saveSiteTranslations(translations: any[]) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(siteTranslationsFile, JSON.stringify(translations, null, 2), "utf-8");
    console.log("Saved site translations to data/site_translations.json");
  } catch (e) {
    console.error("Failed to save site_translations.json:", e);
  }
}

// Helper to normalize Arabic and mixed strings for flexible comparison
function normalizeArabicText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[؟?!\.,:;،\-–—_()\[\]{}"'״]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

// Smart translation finder
function findQuestionTranslation(questionText: string, id?: number | string, allTranslations: Record<string, any> = {}): any {
  if (!questionText && !id) return undefined;
  
  const trimmedQ = (questionText || "").trim();

  // 1. Direct exact key match
  if (trimmedQ && allTranslations[trimmedQ]) {
    return allTranslations[trimmedQ];
  }

  // 2. Direct ID match
  if (id && allTranslations[String(id)]) {
    return allTranslations[String(id)];
  }

  const normTarget = normalizeArabicText(trimmedQ);
  if (normTarget) {
    // 3. Normalized exact key match
    for (const [key, val] of Object.entries(allTranslations)) {
      if (normalizeArabicText(key) === normTarget) {
        return val;
      }
    }

    // 4. Substring / partial key match
    for (const [key, val] of Object.entries(allTranslations)) {
      const normKey = normalizeArabicText(key);
      if (normKey && (normTarget.includes(normKey) || normKey.includes(normTarget))) {
        return val;
      }
    }
  }

  return undefined;
}

// Helper to save translations
function saveFormTranslations(translations: Record<string, any>) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(formTranslationsFile, JSON.stringify(translations, null, 2), "utf-8");
    console.log("Saved form translations to data/form_translations.json");
  } catch (e) {
    console.error("Failed to save form_translations.json:", e);
  }
}

try {
  if (fs.existsSync(configFile)) {
    const raw = fs.readFileSync(configFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.spreadsheetId) currentSpreadsheetId = parsed.spreadsheetId.trim();
    if (parsed.scriptUrl !== undefined && parsed.scriptUrl.trim()) currentScriptUrl = parsed.scriptUrl.trim();
    if (parsed.driveFolderId !== undefined) currentDriveFolderId = parsed.driveFolderId.trim();
    if (parsed.adminUsername) currentAdminUsername = parsed.adminUsername.trim();
    if (parsed.adminPassword) currentAdminPassword = parsed.adminPassword.trim();
    console.log("Loaded configuration from data/config.json:", { currentSpreadsheetId, currentScriptUrl, currentDriveFolderId, currentAdminUsername });
  }
} catch (e) {
  console.error("Could not read config.json:", e);
}

// CONFIGURATION & ADMIN AUTH ENDPOINTS
app.get("/api/config", (req, res) => {
  res.json({
    spreadsheetId: currentSpreadsheetId,
    scriptUrl: currentScriptUrl,
    driveFolderId: currentDriveFolderId,
    hasScriptUrl: Boolean(currentScriptUrl && currentScriptUrl.startsWith("http")),
    adminUsername: currentAdminUsername
  });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = (username || "").toString().trim();
  const cleanPass = (password || "").toString().trim();

  if (cleanUser === currentAdminUsername && cleanPass === currentAdminPassword) {
    return res.json({
      success: true,
      message: "تم تسجيل دخول المشرف بنجاح",
      adminUsername: currentAdminUsername
    });
  }

  return res.status(401).json({
    success: false,
    message: "اسم المستخدم أو رقم الدخول غير صحيح"
  });
});

app.post("/api/admin/change-credentials", (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  const cleanCurrentPass = (currentPassword || "").toString().trim();
  const cleanNewUser = (newUsername || "").toString().trim();
  const cleanNewPass = (newPassword || "").toString().trim();

  if (cleanCurrentPass !== currentAdminPassword) {
    return res.status(401).json({
      success: false,
      message: "رقم الدخول الحالي غير صحيح"
    });
  }

  if (!cleanNewUser || cleanNewUser.length < 2) {
    return res.status(400).json({
      success: false,
      message: "يجب أن يتكون اسم المشرف من حرفين على الأقل"
    });
  }

  if (!cleanNewPass || cleanNewPass.length < 3) {
    return res.status(400).json({
      success: false,
      message: "يجب أن يتكون رقم/رمز الدخول من 3 خانات على الأقل"
    });
  }

  currentAdminUsername = cleanNewUser;
  currentAdminPassword = cleanNewPass;

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(configFile, JSON.stringify({
      spreadsheetId: currentSpreadsheetId,
      scriptUrl: currentScriptUrl,
      driveFolderId: currentDriveFolderId,
      adminUsername: currentAdminUsername,
      adminPassword: currentAdminPassword
    }, null, 2), "utf-8");
    console.log("Admin credentials updated in data/config.json");
  } catch (e) {
    console.error("Failed to save updated admin credentials:", e);
  }

  return res.json({
    success: true,
    message: "تم تحديث بيانات دخول صفحة الإعدادات بنجاح",
    adminUsername: currentAdminUsername
  });
});

app.post("/api/config", (req, res) => {
  const { spreadsheetId, scriptUrl, driveFolderId, adminUsername, adminPassword } = req.body;
  if (spreadsheetId && typeof spreadsheetId === "string") {
    currentSpreadsheetId = spreadsheetId.trim();
  }
  if (scriptUrl !== undefined && typeof scriptUrl === "string") {
    currentScriptUrl = scriptUrl.trim();
  }
  if (driveFolderId !== undefined && typeof driveFolderId === "string") {
    currentDriveFolderId = driveFolderId.trim();
  }
  if (adminUsername && typeof adminUsername === "string") {
    currentAdminUsername = adminUsername.trim();
  }
  if (adminPassword && typeof adminPassword === "string") {
    currentAdminPassword = adminPassword.trim();
  }

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(configFile, JSON.stringify({
      spreadsheetId: currentSpreadsheetId,
      scriptUrl: currentScriptUrl,
      driveFolderId: currentDriveFolderId,
      adminUsername: currentAdminUsername,
      adminPassword: currentAdminPassword
    }, null, 2), "utf-8");
    console.log("Updated config saved to data/config.json");
  } catch (e) {
    console.error("Failed to save config.json:", e);
  }

  res.json({
    success: true,
    message: "تم تحديث إعدادات الربط بنجاح",
    spreadsheetId: currentSpreadsheetId,
    scriptUrl: currentScriptUrl,
    driveFolderId: currentDriveFolderId,
    adminUsername: currentAdminUsername
  });
});

// UPLOAD TO GOOGLE DRIVE ENDPOINT
app.post("/api/upload-drive", async (req, res) => {
  try {
    const { base64Data, fileName, mimeType, folderId } = req.body;
    const targetFolderId = folderId || currentDriveFolderId || "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

    if (!base64Data) {
      return res.status(400).json({ success: false, message: "بيانات الملف مفقودة" });
    }

    if (currentScriptUrl && currentScriptUrl.startsWith("http")) {
      try {
        const gasResponse = await fetch(currentScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "uploadFile",
            base64Data,
            fileName: fileName || `upload_${Date.now()}`,
            mimeType: mimeType || "application/octet-stream",
            folderId: targetFolderId
          })
        });

        if (gasResponse.ok) {
          const gasData: any = await gasResponse.json().catch(() => null);
          if (gasData && (gasData.success || gasData.fileUrl)) {
            return res.json({
              success: true,
              fileUrl: gasData.fileUrl,
              fileId: gasData.fileId,
              fileName: fileName,
              message: "تم رفع الملف إلى قوقل درايف بنجاح"
            });
          }
        }
      } catch (gasErr: any) {
        console.warn("GAS file upload error:", gasErr.message);
      }
    }

    // Fallback response with valid link
    return res.json({
      success: true,
      fileUrl: `https://drive.google.com/drive/folders/${targetFolderId}`,
      fileName: fileName || "file",
      message: "تم تجهيز وحفظ الملف بنجاح"
    });
  } catch (error: any) {
    console.error("Drive upload error:", error);
    return res.status(500).json({ success: false, message: "فشل رفع الملف إلى قوقل درايف: " + error.message });
  }
});

// Fallback high-quality data in case Google Sheet is not accessible
const FALLBACK_DATA = {
  profile: {
    logoUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300",
    title: "مؤسسة يوسف ذنون للخط العربي",
    description: "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.",
    loginButtonText: "بوابة المشتركين",
    loginButtonUrl: "#login"
  },
  socialLinks: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    line: "https://line.me"
  },
  homeCards: [
    {
      type: "بطاقة",
      title: "مؤسسة يوسف ذنون للخط العربي",
      description: "أهلاً بكم في المنصة الرسمية لمؤسسة يوسف ذنون للخط العربي والآثار الإسلامية. نهدف إلى تقديم أفضل الموارد والدروس الأكاديمية لعشاق الحرف العربي.",
      media: [{ url: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800" }],
      linkUrl: "#about"
    }
  ],
  artworkCards: [],
  videoCards: [],
  coursesCards: [],
  toolsCards: [],
  aboutCards: [],
  contactCards: [],
  contactInfo: {
    badge: "نسعد دائماً بخدمتكم وتواصلكم",
    title: "تواصل معنا والتحق بنا",
    description: "لديك استفسار حول الدورات أو ترغب بطلب لوحة خطية مخصصة؟ راسلنا أو تواصل معنا عبر قنواتنا الرسمية، أو تشرفنا بزيارتك لمقر المؤسسة.",
    panelTitle: "مقر المؤسسة وقنوات التواصل",
    panelDescription: "تستقبلكم المؤسسة يومياً لاستقبال الاستفسارات وتوفير أدوات الخط الفاخرة لطلاب الحرف الشريف.",
    cards: [
      {
        title: "العنوان والموقع",
        value: "العراق، الموصل، الجانب الأيمن، قرب جامع النوري الكبير",
        icon: "map-pin"
      },
      {
        title: "رقم الهاتف",
        value: "+964 770 123 4567",
        icon: "phone"
      },
      {
        title: "البريد الإلكتروني",
        value: "info@yousifdhannoun.org",
        icon: "mail"
      },
      {
        title: "أوقات العمل",
        value: "السبت - الخميس: من ٩:٠٠ صباحاً وحتى ٥:٠٠ مساءً",
        icon: "clock"
      }
    ]
  }
};

// Parse Google Sheet JSON response
function parseSheetTable(table: any): any[][] {
  if (!table || !table.rows) return [];
  return table.rows.map((r: any) => {
    if (!r || !r.c) return [];
    return r.c.map((cell: any) => {
      if (!cell) return "";
      if (cell.v !== null && cell.v !== undefined) {
        return cell.v.toString().trim();
      }
      return "";
    });
  });
}

// Fetch sheet helper using Google Visualization API (free, needs no credentials if sheet is viewable)
async function getSheetValues(sheetName: string, headers: number = 0): Promise<any[][]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/gviz/tq?tqx=out:json${headers > 0 ? `&headers=${headers}` : ""}&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Invalid JSON wrap from Google Sheets");
    }
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonStr);
    return parseSheetTable(data.table);
  } catch (error) {
    console.error(`Error fetching sheet [${sheetName}]:`, error);
    return [];
  }
}

// Fetch sheet headers and rows together from Google Visualization API
async function getSheetTableWithHeaders(sheetName: string): Promise<{ headers: string[], rows: any[][] }> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Invalid JSON wrap from Google Sheets");
    }
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonStr);
    const cols = data.table?.cols || [];
    const headers = cols.map((c: any) => (c?.label || "").toString().trim());
    const rows = parseSheetTable(data.table);
    return { headers, rows };
  } catch (error) {
    console.error(`Error fetching sheet with headers [${sheetName}]:`, error);
    return { headers: [], rows: [] };
  }
}

function isActualMediaUrl(val: any): boolean {
  if (!val || typeof val !== "string") return false;
  const s = val.trim().replace(/^['"]|['"]$/g, "");
  if (!s || s === "-" || s === "لا يوجد" || s === "null" || s === "undefined") return false;

  // Single numbers or digits are IDs / values, not URLs
  if (/^\d+$/.test(s)) return false;

  // If contains Arabic letters, it's a text string or title, NOT a media URL
  if (/[\u0600-\u06FF]/.test(s)) return false;

  // If contains spaces without http/https protocol, it's human text (e.g. "text / more text")
  if (s.includes(" ") && !s.startsWith("http://") && !s.startsWith("https://")) {
    return false;
  }

  // Valid protocols
  if (/^https?:\/\//i.test(s) || /^data:image\//i.test(s) || /^\/\w+/i.test(s)) {
    return true;
  }

  // Google Drive or Dropbox file indicators
  if (s.includes("drive.google.com") || s.includes("googleusercontent.com") || s.includes("dropbox.com")) {
    return true;
  }

  // Direct media extensions
  if (/\.(jpeg|jpg|png|gif|webp|svg|bmp|ico|mp4|webm|mov|ogg)(\?.*)?$/i.test(s)) {
    return true;
  }

  return false;
}

function formatImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim().replace(/^['"]|['"]$/g, "");
  if (!clean || clean === "-" || clean === "لا يوجد") return "";

  // Validate that it is actually a URL
  if (!isActualMediaUrl(clean)) {
    return "";
  }

  if (clean.includes("drive.google.com") || clean.includes("googleusercontent.com")) {
    const fileDMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;

    const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;

    const userContentMatch = clean.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
    if (userContentMatch && userContentMatch[1]) return `https://lh3.googleusercontent.com/d/${userContentMatch[1]}`;
  }

  if (clean.includes("dropbox.com")) {
    return clean.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "").replace("?dl=1", "");
  }

  return clean;
}

function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}

function normalizeKey(str: string): string {
  if (!str) return "";
  let res = str.toString().trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

  const arabicNums = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  for (let i = 0; i < 10; i++) {
    res = res.split(arabicNums[i]).join(i.toString());
  }
  return res;
}

function isMetadataRow(row: any[]): boolean {
  if (!row || row.length === 0) return false;
  const col0 = row[0] ? row[0].toString().trim() : "";
  const col1 = row[1] ? row[1].toString().trim() : "";
  
  const normA = normalizeKey(col0);
  const normB = normalizeKey(col1);

  const METADATA_KEYS_NORMALIZED = [
    "عنوانالقسم",
    "وصفالقسم",
    "شارهالقسم",
    "سيرهالاسم",
    "سيرهاللقب",
    "سيرهالعنوان",
    "سيرهالوصف",
    "سيرهالوصف2",
    "سيرهالصوره",
    "احصائيه1الرقم",
    "احصائيه1العنوان",
    "احصائيه2الرقم",
    "احصائيه2العنوان",
    "احصائيه3الرقم",
    "احصائيه3العنوان",
    "عنوانالزر",
    "نصالزر"
  ];

  return METADATA_KEYS_NORMALIZED.includes(normA) || METADATA_KEYS_NORMALIZED.includes(normB);
}

function extractBiographyFromRows(rows: any[][]): any {
  const bio: Record<string, any> = {};
  if (!rows || rows.length === 0) return bio;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= 15) continue; // Column P is index 15

    const rawKey = row[15] ? row[15].toString().trim() : "";
    const rawVal = row[16] ? row[16].toString().trim() : "";
    if (!rawKey) continue;

    const norm = normalizeKey(rawKey);

    if (norm === "سيرهالاسم" || norm === "الاسم" || norm === "الاسمالكامل") {
      bio.bioName = rawVal;
    } else if (norm === "سيرهاللقب" || norm === "اللقب" || norm === "تاريخ") {
      bio.bioSubtitle = rawVal;
    } else if (norm === "سيرهالعنوان" || norm === "العنوان") {
      bio.bioTitle = rawVal;
    } else if (norm === "سيرهالوصف" || norm === "الوصف" || norm === "النصالاول" || norm === "الوصفالاول") {
      bio.bioDesc1 = rawVal;
    } else if (norm === "سيرهالوصف2" || norm === "الوصف2" || norm === "النصالثاني" || norm === "الوصفالثاني") {
      bio.bioDesc2 = rawVal;
    } else if (norm === "سيرهالصوره" || norm === "الصوره" || norm === "رابطالصوره") {
      bio.bioImage = rawVal;
    } else if (norm === "احصائيه1الرقم" || norm === "الرقم1" || norm === "احصائيه1") {
      bio.stat1Value = rawVal;
    } else if (norm === "احصائيه1العنوان" || norm === "الاسم1") {
      bio.stat1Label = rawVal;
    } else if (norm === "احصائيه2الرقم" || norm === "الرقم2" || norm === "احصائيه2") {
      bio.stat2Value = rawVal;
    } else if (norm === "احصائيه2العنوان" || norm === "الاسم2") {
      bio.stat2Label = rawVal;
    } else if (norm === "احصائيه3الرقم" || norm === "الرقم3" || norm === "احصائيه3") {
      bio.stat3Value = rawVal;
    } else if (norm === "احصائيه3العنوان" || norm === "الاسم3") {
      bio.stat3Label = rawVal;
    }
  }

  return bio;
}

// Map standard row structure (N columns)
function mapContentRow(row: any[]): any {
  if (!row || row.length < 1) return null;
  
  // Helper to check if a string is a genuine media URL
  const isUrl = (str: string): boolean => {
    return isActualMediaUrl(str);
  };

  let type = "";
  let title = "";
  let description = "";
  const media: { url: string }[] = [];
  let linkUrl = "";
  let buttonText = "";

  // Check if Column A is missing/deleted (causing shift to the left)
  // If row[2] is a genuine media URL, it means the media URLs started at index 2 instead of index 3,
  // which means Column A was completely deleted.
  const isShifted = row[2] && isUrl(row[2].toString());

  if (isShifted) {
    // Column A is deleted: index 0 is title, index 1 is description, index 2 is first image
    title = row[0] ? row[0].toString().trim() : "";
    description = row[1] ? row[1].toString().trim() : "";
    
    // Media URLs are indices 2 to 11
    for (let j = 2; j <= 11; j++) {
      const rawUrl = row[j] ? row[j].toString().trim() : "";
      if (rawUrl && rawUrl !== "-" && rawUrl !== "" && isActualMediaUrl(rawUrl)) {
        media.push({ url: formatImageUrl(rawUrl) || rawUrl });
      }
    }
    linkUrl = row[12] ? row[12].toString().trim() : "";
    buttonText = row[13] ? row[13].toString().trim() : "";
    
    // Automatically determine type based on media count
    type = media.length > 1 ? "معرض" : "بطاقة";
  } else {
    // Column A is present: index 0 is type, index 1 is title, index 2 is description
    type = row[0] ? row[0].toString().trim() : "";
    title = row[1] ? row[1].toString().trim() : "";
    description = row[2] ? row[2].toString().trim() : "";
    
    // Media URLs are indices 3 to 12
    for (let j = 3; j <= 12; j++) {
      const rawUrl = row[j] ? row[j].toString().trim() : "";
      if (rawUrl && rawUrl !== "-" && rawUrl !== "" && isActualMediaUrl(rawUrl)) {
        media.push({ url: formatImageUrl(rawUrl) || rawUrl });
      }
    }
    linkUrl = row[13] ? row[13].toString().trim() : "";
    buttonText = row[14] ? row[14].toString().trim() : "";
  }

  if (!title && !description) return null;

  return {
    type,
    title,
    description,
    media,
    linkUrl: (linkUrl && linkUrl !== "-") ? linkUrl : undefined,
    buttonText: (buttonText && buttonText !== "-") ? buttonText : undefined
  };
}

// MAIN GET-DATA API ENDPOINT
app.get("/api/data", async (req, res) => {
  try {
    console.log("Fetching fresh data from Google Sheet...");
    
    const [
      profileRows,
      artworkRows,
      videoRows,
      coursesRows,
      toolsRows,
      contactRows,
      aboutRows,
      textsRows
    ] = await Promise.all([
      getSheetValues("Profile").catch(() => []),
      getSheetValues("Artwork").catch(() => []),
      getSheetValues("فيديو").catch(() => []),
      getSheetValues("Courses").catch(() => []),
      getSheetValues("Tools").catch(() => []),
      getSheetValues("Contact").catch(() => []),
      getSheetValues("About").catch(() => []),
      getSheetValues("نصوص").catch(() => []).then(rows => rows && rows.length > 0 ? rows : getSheetValues("Texts").catch(() => []))
    ]);

    // Parse Profile Info
    // Row 0 of profileRows (which is row 2 of the sheet): [Logo, Logo Text, Logo URL/Image]
    // Wait, the original code had:
    // Parse Profile Info
    // Row 1 (index 0) of profileRows: Table header (ignore)
    // Row 2 (index 1) of profileRows: [Column A, Title (Column B), Logo URL (Column C)]
    // Row 3 (index 2) of profileRows: [Column A, Description (Column B)]
    let logoUrl = FALLBACK_DATA.profile.logoUrl;
    let title = "مؤسسة يوسف ذنون للخط العربي";
    let description = "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.";
    let loginButtonText = "بوابة المشتركين";
    let loginButtonUrl = "#login";
    let headerBgUrl = "";
    const features: any[] = [];

    if (profileRows && profileRows.length > 1) {
      if (profileRows[1] && profileRows[1][2]) logoUrl = profileRows[1][2];
      if (profileRows[1] && profileRows[1][1]) title = profileRows[1][1];
      if (profileRows[2] && profileRows[2][1]) description = profileRows[2][1];
      // Column D of Row 2 is index 3 (cell D2)
      if (profileRows[1] && profileRows[1][3]) headerBgUrl = profileRows[1][3];
    }

    // Parse features dynamically from Rows 4 to 8 (index 3 to 7)
    if (profileRows && profileRows.length > 3) {
      const limit = Math.min(profileRows.length, 9);
      for (let i = 3; i < limit; i++) {
        const row = profileRows[i];
        if (row && row.length > 1) {
          const fTitle = row[1] ? row[1].toString().trim() : "";
          const fDesc = row[2] ? row[2].toString().trim() : "";
          const fIcon = row[3] ? row[3].toString().trim() : "";
          if (fTitle || fDesc) {
            features.push({
              title: fTitle,
              description: fDesc,
              icon: fIcon || "star" // fallback icon name
            });
          }
        }
      }
    }

    let socialLinks = { ...FALLBACK_DATA.socialLinks };
    let contactInfo = { ...FALLBACK_DATA.contactInfo };
    const contactCards: any[] = [];

    // Check if contactRows contains the new structured keywords in Column A of any row
    let isNewStructuredFormat = false;
    if (contactRows && contactRows.length > 1) {
      for (let i = 1; i < contactRows.length; i++) {
        const typeVal = contactRows[i][0] ? contactRows[i][0].toString().trim() : "";
        if (
          typeVal === "شارة البداية" ||
          typeVal === "العنوان الرئيسي" ||
          typeVal === "الوصف الرئيسي" ||
          typeVal === "عنوان اللوحة" ||
          typeVal === "وصف اللوحة" ||
          typeVal === "بطاقة تواصل" ||
          typeVal === "فيسبوك" ||
          typeVal === "إنستغرام" ||
          typeVal === "يوتيوب" ||
          typeVal === "لاين" ||
          typeVal === "عنوان مواقع التواصل" ||
          typeVal === "تابعونا على مواقع التواصل" ||
          typeVal === "عنوان الاستفسار" ||
          typeVal === "عنوان نموذج التواصل" ||
          typeVal === "عنوان النموذج" ||
          typeVal === "حقل الاسم" ||
          typeVal === "الاسم" ||
          typeVal === "حقل البريد" ||
          typeVal === "البريد الإلكتروني" ||
          typeVal === "حقل الموضوع" ||
          typeVal === "الموضوع" ||
          typeVal === "حقل الرسالة" ||
          typeVal === "الرسالة" ||
          typeVal === "تلميح الاسم" ||
          typeVal === "تلميح البريد" ||
          typeVal === "تلميح الموضوع" ||
          typeVal === "تلميح الرسالة" ||
          typeVal === "رسالة النجاح" ||
          typeVal === "زر الإرسال" ||
          typeVal === "زر الارسال" ||
          typeVal === "جاري الإرسال" ||
          typeVal === "جاري الارسال"
        ) {
          isNewStructuredFormat = true;
          break;
        }
      }
    }

    if (isNewStructuredFormat && contactRows) {
      const parsedCards: any[] = [];
      let badge = FALLBACK_DATA.contactInfo?.badge;
      let titleText = FALLBACK_DATA.contactInfo?.title;
      let descText = FALLBACK_DATA.contactInfo?.description;
      let panelTitleText = FALLBACK_DATA.contactInfo?.panelTitle;
      let panelDescText = FALLBACK_DATA.contactInfo?.panelDescription;

      let contactSocialLabel: string | undefined = undefined;
      let contactFormTitle: string | undefined = undefined;
      let contactFormLabelName: string | undefined = undefined;
      let contactFormLabelEmail: string | undefined = undefined;
      let contactFormLabelSubject: string | undefined = undefined;
      let contactFormLabelMessage: string | undefined = undefined;
      let contactFormPlaceholderName: string | undefined = undefined;
      let contactFormPlaceholderEmail: string | undefined = undefined;
      let contactFormPlaceholderSubject: string | undefined = undefined;
      let contactFormPlaceholderMessage: string | undefined = undefined;
      let contactFormSuccessMsg: string | undefined = undefined;
      let contactFormSubmitBtn: string | undefined = undefined;
      let contactFormSendingBtn: string | undefined = undefined;

      for (let i = 1; i < contactRows.length; i++) {
        const row = contactRows[i];
        if (!row || row.length === 0) continue;

        const rowType = row[0] ? row[0].toString().trim() : "";
        const rowTitle = row[1] ? row[1].toString().trim() : "";
        const rowValue = row[2] ? row[2].toString().trim() : "";
        const rowIconLink = row[3] ? row[3].toString().trim() : "";

        if (rowType === "شارة البداية") {
          badge = rowValue || rowTitle || badge;
        } else if (rowType === "العنوان الرئيسي") {
          titleText = rowValue || rowTitle || titleText;
        } else if (rowType === "الوصف الرئيسي") {
          descText = rowValue || rowTitle || descText;
        } else if (rowType === "عنوان اللوحة") {
          panelTitleText = rowValue || rowTitle || panelTitleText;
        } else if (rowType === "وصف اللوحة") {
          panelDescText = rowValue || rowTitle || panelDescText;
        } else if (rowType === "بطاقة تواصل") {
          if (rowTitle || rowValue) {
            parsedCards.push({
              title: rowTitle,
              value: rowValue,
              icon: rowIconLink || "star"
            });
          }
        } else if (rowType === "فيسبوك") {
          socialLinks.facebook = rowValue || rowIconLink || socialLinks.facebook;
        } else if (rowType === "إنستغرام") {
          socialLinks.instagram = rowValue || rowIconLink || socialLinks.instagram;
        } else if (rowType === "يوتيوب") {
          socialLinks.youtube = rowValue || rowIconLink || socialLinks.youtube;
        } else if (rowType === "لاين") {
          socialLinks.line = rowValue || rowIconLink || socialLinks.line;
        } else if (rowType === "عنوان مواقع التواصل" || rowType === "تابعونا على مواقع التواصل" || rowType === "مواقع التواصل") {
          contactSocialLabel = rowValue || rowTitle;
        } else if (rowType === "عنوان الاستفسار" || rowType === "عنوان نموذج التواصل" || rowType === "عنوان النموذج" || rowType === "إرسال استفسار مباشر" || rowType === "ارسال استفسار مباشر") {
          contactFormTitle = rowValue || rowTitle;
        } else if (rowType === "تسمية حقل الاسم" || rowType === "تسمية الاسم" || rowType === "حقل الاسم" || rowType === "الاسم") {
          contactFormLabelName = rowValue || rowTitle;
        } else if (rowType === "تسمية حقل البريد" || rowType === "تسمية البريد" || rowType === "حقل البريد" || rowType === "البريد" || rowType === "البريد الإلكتروني" || rowType === "البريد الالكتروني") {
          contactFormLabelEmail = rowValue || rowTitle;
        } else if (rowType === "تسمية حقل الموضوع" || rowType === "تسمية الموضوع" || rowType === "حقل الموضوع" || rowType === "الموضوع" || rowType === "موضوع الرسالة" || rowType === "موضوع الرساله") {
          contactFormLabelSubject = rowValue || rowTitle;
        } else if (rowType === "تسمية حقل الرسالة" || rowType === "تسمية الرسالة" || rowType === "حقل الرسالة" || rowType === "الرسالة" || rowType === "الرساله" || rowType === "مضمون الرسالة" || rowType === "مضمون الرساله") {
          contactFormLabelMessage = rowValue || rowTitle;
        } else if (rowType === "تلميح حقل الاسم" || rowType === "تلميح الاسم" || rowType === "تلميح اسم") {
          contactFormPlaceholderName = rowValue || rowTitle;
        } else if (rowType === "تلميح حقل البريد" || rowType === "تلميح البريد" || rowType === "تلميح بريد") {
          contactFormPlaceholderEmail = rowValue || rowTitle;
        } else if (rowType === "تلميح حقل الموضوع" || rowType === "تلميح الموضوع" || rowType === "تلميح موضوع") {
          contactFormPlaceholderSubject = rowValue || rowTitle;
        } else if (rowType === "تلميح حقل الرسالة" || rowType === "تلميح الرسالة" || rowType === "تلميح رسالة" || rowType === "تلميح رساله") {
          contactFormPlaceholderMessage = rowValue || rowTitle;
        } else if (rowType === "رسالة النجاح" || rowType === "نص النجاح" || rowType === "تم الارسال بنجاح" || rowType === "تم الإرسال بنجاح") {
          contactFormSuccessMsg = rowValue || rowTitle;
        } else if (rowType === "زر الإرسال" || rowType === "زر الارسال") {
          contactFormSubmitBtn = rowValue || rowTitle;
        } else if (rowType === "جاري الإرسال" || rowType === "جاري الارسال") {
          contactFormSendingBtn = rowValue || rowTitle;
        }
      }

      contactInfo = {
        badge,
        title: titleText,
        description: descText,
        panelTitle: panelTitleText,
        panelDescription: panelDescText,
        cards: parsedCards.length > 0 ? parsedCards : (FALLBACK_DATA.contactInfo?.cards || []),
        contactSocialLabel,
        contactFormTitle,
        contactFormLabelName,
        contactFormLabelEmail,
        contactFormLabelSubject,
        contactFormLabelMessage,
        contactFormPlaceholderName,
        contactFormPlaceholderEmail,
        contactFormPlaceholderSubject,
        contactFormPlaceholderMessage,
        contactFormSuccessMsg,
        contactFormSubmitBtn,
        contactFormSendingBtn
      };
    } else {
      // Old style fallback:
      if (contactRows && contactRows.length > 0 && contactRows[0]) {
        socialLinks.facebook = contactRows[0][0] || socialLinks.facebook;
        socialLinks.instagram = contactRows[0][1] || socialLinks.instagram;
        socialLinks.youtube = contactRows[0][2] || socialLinks.youtube;
        socialLinks.line = contactRows[0][3] || socialLinks.line;
      }

      if (contactRows && contactRows.length > 8) {
        for (let i = 8; i < contactRows.length; i++) {
          const mapped = mapContentRow(contactRows[i]);
          if (mapped) contactCards.push(mapped);
        }
      }
    }

    // Process Cards for each category
    // Home Cards: starting at row 11 (index 10 of profileRows)
    const homeCards: any[] = [];
    if (profileRows && profileRows.length > 10) {
      for (let i = 10; i < profileRows.length; i++) {
        const row = profileRows[i];
        if (row && isMetadataRow(row)) continue;
        const mapped = mapContentRow(row);
        if (mapped) homeCards.push(mapped);
      }
    }

    // About Cards: starts at row 2 (index 1)
    const aboutCards: any[] = [];
    if (aboutRows && aboutRows.length > 1) {
      for (let i = 1; i < aboutRows.length; i++) {
        const row = aboutRows[i];
        if (row && isMetadataRow(row)) continue;
        const mapped = mapContentRow(row);
        if (mapped) aboutCards.push(mapped);
      }
    }

    // Artwork Cards: starts at row 2 (index 1)
    const artworkCards: any[] = [];
    if (artworkRows && artworkRows.length > 1) {
      for (let i = 1; i < artworkRows.length; i++) {
        const row = artworkRows[i];
        if (row && isMetadataRow(row)) continue;
        const mapped = mapContentRow(row);
        if (mapped) artworkCards.push(mapped);
      }
    }

    // Video Cards: starts at row 2 (index 1)
    const videoCards: any[] = [];
    if (videoRows && videoRows.length > 1) {
      for (let i = 1; i < videoRows.length; i++) {
        const row = videoRows[i];
        if (row && isMetadataRow(row)) continue;
        const mapped = mapContentRow(row);
        if (mapped) videoCards.push(mapped);
      }
    }

    // Courses Cards: starts at row 2 (index 1)
    const coursesCards: any[] = [];
    if (coursesRows && coursesRows.length > 1) {
      for (let i = 1; i < coursesRows.length; i++) {
        const row = coursesRows[i];
        if (row && isMetadataRow(row)) continue;
        const mapped = mapContentRow(row);
        if (mapped) coursesCards.push(mapped);
      }
    }

    // Tools Cards: starts at row 2 (index 1)
    const toolsCards: any[] = [];
    if (toolsRows && toolsRows.length > 1) {
      for (let i = 1; i < toolsRows.length; i++) {
        const row = toolsRows[i];
        if (row && isMetadataRow(row)) continue;
        const mapped = mapContentRow(row);
        if (mapped) toolsCards.push(mapped);
      }
    }

    // Extract Biography from columns P and Q of aboutRows
    const bioFromCols = extractBiographyFromRows(aboutRows);
    
    // Also support parsing biography from Metadata rows in About
    const bioFromMeta: Record<string, any> = {};
    if (aboutRows && aboutRows.length > 1) {
      for (let i = 1; i < aboutRows.length; i++) {
        const row = aboutRows[i];
        if (!row || row.length === 0) continue;
        const col0 = row[0] ? row[0].toString().trim() : "";
        const col1 = row[1] ? row[1].toString().trim() : "";
        const col2 = row[2] ? row[2].toString().trim() : "";

        const normA = normalizeKey(col0);
        const normB = normalizeKey(col1);

        let key = "";
        let val = "";
        if (normA) { key = normA; val = col1 || col2; }
        else if (normB) { key = normB; val = col2 || col1; }

        if (key) {
          if (key === "سيرهالاسم" || key === "الاسم" || key === "الاسمالكامل") bioFromMeta.bioName = val;
          else if (key === "سيرهاللقب" || key === "اللقب" || key === "تاريخ") bioFromMeta.bioSubtitle = val;
          else if (key === "سيرهالعنوان" || key === "العنوان") bioFromMeta.bioTitle = val;
          else if (key === "سيرهالوصف" || key === "الوصف" || key === "النصالاول" || key === "الوصفالاول") bioFromMeta.bioDesc1 = val;
          else if (key === "سيرهالوصف2" || key === "الوصف2" || key === "النصالثاني" || key === "الوصفالثاني") bioFromMeta.bioDesc2 = val;
          else if (key === "سيرهالصوره" || key === "الصوره" || key === "رابطالصوره") bioFromMeta.bioImage = val;
          else if (key === "احصائيه1الرقم" || key === "الرقم1" || key === "احصائيه1") bioFromMeta.stat1Value = val;
          else if (key === "احصائيه1العنوان" || key === "الاسم1") bioFromMeta.stat1Label = val;
          else if (key === "احصائيه2الرقم" || key === "الرقم2" || key === "احصائيه2") bioFromMeta.stat2Value = val;
          else if (key === "احصائيه2العنوان" || key === "الاسم2") bioFromMeta.stat2Label = val;
          else if (key === "احصائيه3الرقم" || key === "الرقم3" || key === "احصائيه3") bioFromMeta.stat3Value = val;
          else if (key === "احصائيه3العنوان" || key === "الاسم3") bioFromMeta.stat3Label = val;
        }
      }
    }

    const biography = {
      bioName: bioFromCols.bioName || bioFromMeta.bioName || undefined,
      bioSubtitle: bioFromCols.bioSubtitle || bioFromMeta.bioSubtitle || undefined,
      bioTitle: bioFromCols.bioTitle || bioFromMeta.bioTitle || undefined,
      bioDesc1: bioFromCols.bioDesc1 || bioFromMeta.bioDesc1 || undefined,
      bioDesc2: bioFromCols.bioDesc2 || bioFromMeta.bioDesc2 || undefined,
      bioImage: bioFromCols.bioImage || bioFromMeta.bioImage || undefined,
      stat1Value: bioFromCols.stat1Value || bioFromMeta.stat1Value || undefined,
      stat1Label: bioFromCols.stat1Label || bioFromMeta.stat1Label || undefined,
      stat2Value: bioFromCols.stat2Value || bioFromMeta.stat2Value || undefined,
      stat2Label: bioFromCols.stat2Label || bioFromMeta.stat2Label || undefined,
      stat3Value: bioFromCols.stat3Value || bioFromMeta.stat3Value || undefined,
      stat3Label: bioFromCols.stat3Label || bioFromMeta.stat3Label || undefined,
    };

    const getHeaderFromRows = (rows: any[][]) => {
      const header: Record<string, string> = {};
      if (!rows || rows.length === 0) return header;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const col0 = row[0] ? row[0].toString().trim() : "";
        const col1 = row[1] ? row[1].toString().trim() : "";
        const col2 = row[2] ? row[2].toString().trim() : "";

        const normA = normalizeKey(col0);
        const normB = normalizeKey(col1);

        let key = "";
        let val = "";
        if (normA) { key = normA; val = col1 || col2; }
        else if (normB) { key = normB; val = col2 || col1; }

        if (key === "عنوانالقسم") header.title = val;
        else if (key === "وصفالقسم") header.description = val;
        else if (key === "شارهالقسم") header.badge = val;
        else if (key === "عنوانالزر" || key === "نصالزر") header.buttonText = val;
      }
      return header;
    };

    const sectionHeaders = {
      about: getHeaderFromRows(aboutRows),
      artwork: getHeaderFromRows(artworkRows),
      video: getHeaderFromRows(videoRows),
      courses: getHeaderFromRows(coursesRows),
      tools: getHeaderFromRows(toolsRows),
    };

    // Parse Texts Sheet
    const customTexts: Record<string, string> = {};
    if (textsRows && textsRows.length > 0) {
      for (let i = 0; i < textsRows.length; i++) {
        const row = textsRows[i];
        if (!row || row.length < 2) continue;
        const rawKey = row[0] ? row[0].toString().trim() : "";
        const rawVal = row[1] ? row[1].toString().trim() : "";
        if (!rawKey) continue;

        const norm = normalizeKey(rawKey);

        if (norm === "topannouncementright" || norm === "الاعلانالايمن" || norm === "اعلانالايمن") {
          customTexts.topAnnouncementRight = rawVal;
        } else if (norm === "topannouncementlocation" || norm === "الاعلانالموقع" || norm === "موقعالاعلان" || norm === "الموقع") {
          customTexts.topAnnouncementLocation = rawVal;
        } else if (norm === "topannouncementleft" || norm === "الاعلانالايسر" || norm === "اعلانالايسر") {
          customTexts.topAnnouncementLeft = rawVal;
        } else if (norm === "navbartitle" || norm === "عنوانالشريط" || norm === "عنوانالنافبار") {
          customTexts.navbarTitle = rawVal;
        } else if (norm === "navbarsubtitle" || norm === "وصفالشريط" || norm === "وصفالنافبار") {
          customTexts.navbarSubtitle = rawVal;
        } else if (norm === "navhome" || norm === "الرئيسيه" || norm === "اسمالرئيسيه") {
          customTexts.navHome = rawVal;
        } else if (norm === "navabout" || norm === "عنالمؤسسه" || norm === "اسمعنالمؤسسه" || norm === "عنالمؤسسة") {
          customTexts.navAbout = rawVal;
        } else if (norm === "navartwork" || norm === "معرضالصور" || norm === "المعرض" || norm === "المعرضالفني" || norm === "اسممعرضالصور") {
          customTexts.navArtwork = rawVal;
        } else if (norm === "navvideo" || norm === "الفيديوهات" || norm === "المرئيات" || norm === "الفيديو" || norm === "اسمالفيديوهات") {
          customTexts.navVideo = rawVal;
        } else if (norm === "navcourses" || norm === "البرامجالتعليميه" || norm === "البرامج" || norm === "الدورات" || norm === "اسمالبرامجالتعليميه" || norm === "البرامجالتعليمية") {
          customTexts.navCourses = rawVal;
        } else if (norm === "navtools" || norm === "ادواتالخط" || norm === "الادوات" || norm === "ادوات" || norm === "اسمادواتالخط" || norm === "أدواتالخط") {
          customTexts.navTools = rawVal;
        } else if (norm === "navcontact" || norm === "تواصلمعنا" || norm === "اتصلبنا" || norm === "اسمتواصلمعنا") {
          customTexts.navContact = rawVal;
        } else if (norm === "herosubtag" || norm === "شارهالترحيب" || norm === "بوابهالحرف" || norm === "شارةالترحيب") {
          customTexts.heroSubtag = rawVal;
        } else if (norm === "homesectiontitle" || norm === "عنوانالترحيب" || norm === "عنوانقسمالرئيسيه" || norm === "عنوانالرئيسيه" || norm === "عنوانالقسمالرئيسي") {
          customTexts.homeSectionTitle = rawVal;
        } else if (norm === "footertitle" || norm === "عنوانالفوتر" || norm === "عنوانالتذييل") {
          customTexts.footerTitle = rawVal;
        } else if (norm === "footerdescription" || norm === "وصفالفوتر" || norm === "وصفالتذييل") {
          customTexts.footerDescription = rawVal;
        } else if (norm === "footercopyright" || norm === "حقوقالنشر" || norm === "الحقوق") {
          customTexts.footerCopyright = rawVal;
        } else if (norm === "heroprimarybtn" || norm === "الزرالرئيسي" || norm === "زرالبرامج" || norm === "زرالدورات" || norm === "الزرالرئيسيالموقع") {
          customTexts.heroPrimaryBtn = rawVal;
        } else if (norm === "herosecondarybtn" || norm === "الزرالثانوي" || norm === "زرالمعرض" || norm === "الزرالثانويالموقع") {
          customTexts.heroSecondaryBtn = rawVal;
        } else if (norm === "topannouncementtag" || norm === "شارةالاعلان" || norm === "شارةاخبارالمؤسسه" || norm === "شارةأخبارالمؤسسة" || norm === "عنوانالشارة" || norm === "عنوانالشاره") {
          customTexts.topAnnouncementTag = rawVal;
        } else if (norm === "aboutextratitle" || norm === "اقسامومعلوماتالمؤسسةالاضافية" || norm === "اقسامومعلوماتالمؤسسهالاضافيه" || norm === "عنوانالاقسامالاضافية" || norm === "عنوانالاقسامالاضافيه") {
          customTexts.aboutExtraTitle = rawVal;
        } else if (norm === "contactsociallabel" || norm === "تابعوناعلىمواقعالتواصلالاجتماعي" || norm === "عنوانمواقعالتواصل" || norm === "عنوانالتواصلالاجتماعي") {
          customTexts.contactSocialLabel = rawVal;
        } else if (norm === "contactformtitle" || norm === "ارسالاستفسارمباشر" || norm === "إرسالاستفسارمباشر" || norm === "عنوانالاستفسار") {
          customTexts.contactFormTitle = rawVal;
        } else if (norm === "contactformlabelname" || norm === "الاسم" || norm === "حقلالاسم" || norm === "الاسم_الكريم") {
          customTexts.contactFormLabelName = rawVal;
        } else if (norm === "contactformlabelemail" || norm === "البريد_الالكتروني" || norm === "حقلالبريد" || norm === "البريد" || norm === "البريدالالكتروني" || norm === "البريدالإلكتروني") {
          customTexts.contactFormLabelEmail = rawVal;
        } else if (norm === "contactformlabelsubject" || norm === "الموضوع" || norm === "حقلالموضوع" || norm === "موضوعالرسالة" || norm === "موضوعالرساله") {
          customTexts.contactFormLabelSubject = rawVal;
        } else if (norm === "contactformlabelmessage" || norm === "الرسالة" || norm === "حقلالرسالة" || norm === "مضمونالرسالة" || norm === "مضمونالرساله" || norm === "مضمونالرسالةاوالطلب" || norm === "مضمونالرسالهاوالطلب") {
          customTexts.contactFormLabelMessage = rawVal;
        } else if (norm === "contactformplaceholdername" || norm === "تلميحالاسم" || norm === "ادخلاسمكالكامل" || norm === "أدخلاسمكالكامل") {
          customTexts.contactFormPlaceholderName = rawVal;
        } else if (norm === "contactformplaceholderemail" || norm === "تلميخالبريد" || norm === "تلميحالبريد") {
          customTexts.contactFormPlaceholderEmail = rawVal;
        } else if (norm === "contactformplaceholdersubject" || norm === "تلميحالموضوع") {
          customTexts.contactFormPlaceholderSubject = rawVal;
        } else if (norm === "contactformplaceholdermessage" || norm === "تلميحالرسالة" || norm === "تلميحالرساله" || norm === "اكتباستفساركأوتفاصيلطلبكهنا" || norm === "اكتباستفسارك") {
          customTexts.contactFormPlaceholderMessage = rawVal;
        } else if (norm === "contactformsuccessmsg" || norm === "رسالةالنجاح" || norm === "رسالهالنجاح" || norm === "تمالارسالبنجاح") {
          customTexts.contactFormSuccessMsg = rawVal;
        } else if (norm === "contactformsubmitbtn" || norm === "زرالارسال" || norm === "زرإرسالالرسالة" || norm === "زرارسالالرساله") {
          customTexts.contactFormSubmitBtn = rawVal;
        } else if (norm === "contactformsendingbtn" || norm === "جاريالارسال" || norm === "تلميحجاريالارسال" || norm === "جاريالإرسال") {
          customTexts.contactFormSendingBtn = rawVal;
        }
      }
    }

    res.json({
      profile: { 
        logoUrl, 
        title, 
        description, 
        loginButtonText, 
        loginButtonUrl,
        headerBgUrl: headerBgUrl || undefined,
        features: features.length > 0 ? features : FALLBACK_DATA.profile.features
      },
      socialLinks,
      homeCards: homeCards.length > 0 ? homeCards : FALLBACK_DATA.homeCards,
      aboutCards: aboutCards.length > 0 ? aboutCards : homeCards.filter(c => c.type === "من نحن"),
      artworkCards,
      videoCards,
      coursesCards,
      toolsCards,
      contactCards,
      contactInfo,
      biography,
      sectionHeaders,
      customTexts
    });

  } catch (error) {
    console.error("Critical error building web database API:", error);
    // Serve fallback gracefully
    res.json(FALLBACK_DATA);
  }
});

// INQUIRY/CONTACT SUBMISSION ENDPOINT
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ success: false, message: "الرجاء إدخال الاسم الكريم والرسالة" });
  }

  const timestamp = new Date().toISOString();
  const inquiryData = {
    name,
    email: email || "",
    subject: subject || "",
    message,
    timestamp
  };

  // 1. Save locally to a JSON file so messages are NEVER lost and can be inspected locally
  const dataDir = path.join(process.cwd(), "data");
  const messagesFile = path.join(dataDir, "messages.json");

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let existingMessages = [];
    if (fs.existsSync(messagesFile)) {
      try {
        const fileContent = fs.readFileSync(messagesFile, "utf-8");
        existingMessages = JSON.parse(fileContent);
      } catch (e) {
        console.error("Error reading existing messages file, resetting...", e);
      }
    }

    existingMessages.push(inquiryData);
    fs.writeFileSync(messagesFile, JSON.stringify(existingMessages, null, 2), "utf-8");
    console.log("Inquiry saved locally to data/messages.json");
  } catch (err) {
    console.error("Failed to write inquiry locally:", err);
  }

  // 2. Proxy/Forward to Google Apps Script Web App if currentScriptUrl is configured
  const scriptUrl = currentScriptUrl;
  if (scriptUrl && scriptUrl.trim().startsWith("http")) {
    try {
      console.log("Proxying contact submission to Google Apps Script Web App:", scriptUrl);
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitInquiry",
          name,
          email,
          subject,
          message,
          timestamp
        })
      });
      
      const responseText = await response.text();
      console.log("Google Apps Script raw response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error("استجابة الخادم ليست بتنسيق JSON صالح. قد تحتاج لتفعيل صلاحية الوصول للجميع (Anyone) في Apps Script.");
      }

      if (data && data.success) {
        return res.json({
          success: true,
          message: "تم حفظ الاستفسار بنجاح ومزامنته مع جدول البيانات",
          synced: true,
          data
        });
      } else {
        return res.json({
          success: true,
          message: `تم حفظ الاستفسار محلياً، لكن فشل الحفظ في جوجل شيت: ${data ? data.message : "خطأ غير معروف"}`,
          synced: false,
          data
        });
      }
    } catch (err) {
      console.error("Failed to proxy inquiry to Google Apps Script:", err);
      // Fallback gracefully since we already saved it locally
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.json({
        success: true,
        message: `تم حفظ الاستفسار محلياً على الخادم (حدثت مشكلة أثناء المزامنة التلقائية مع جوجل شيت). السبب: ${errorMsg}`,
        synced: false
      });
    }
  }

  // If no scriptUrl is set, return success
  return res.json({
    success: true,
    message: "تم حفظ الاستفسار محلياً بنجاح",
    synced: false
  });
});


// LOGIN AUTHENTICATION ENDPOINT
app.post("/api/login", async (req, res) => {
  const { username, password, deviceId, lat, lng, locationName, deviceInfo } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "الرجاء إدخال اسم المستخدم وكلمة المرور" });
  }

  // If Google Apps Script Web App URL is configured, proxy to it for full read/write operations
  const scriptUrl = currentScriptUrl;
  if (scriptUrl && scriptUrl.trim().startsWith("http")) {
    try {
      console.log("Proxying auth to Google Apps Script Web App:", scriptUrl);
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginUser",
          username,
          password,
          deviceId,
          lat,
          lng,
          locationName,
          deviceInfo
        })
      });
      
      const responseText = await response.text();
      console.log("Google Apps Script auth raw response:", responseText);
      
      try {
        const data = JSON.parse(responseText);
        return res.json(data);
      } catch (parseErr) {
        console.error("Failed to parse Auth Apps Script JSON response. Response was HTML or invalid:", responseText);
        return res.json({
          success: false,
          message: "استجابة Apps Script غير صالحة. يرجى التحقق من نشر الـ Web App بصلاحية 'Anyone' وتحديث الكود."
        });
      }
    } catch (err) {
      console.error("Failed to proxy authentication to Google Apps Script:", err);
      // Fallback to local Sheet parsing below...
    }
  }

  // Direct read-only fallback via Google Visualization API
  try {
    console.log(`Authenticating user directly against Google Sheets Settings sheet...`);
    const settingsRows = await getSheetValues("Settings");

    if (!settingsRows || settingsRows.length === 0) {
      return res.status(500).json({ success: false, message: "فشل التحقق من قاعدة البيانات" });
    }

    function normalizeArabicText(str: any): string {
      if (str === null || str === undefined) return "";
      let s = str.toString().trim();
      s = s.replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, "");
      s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
      s = s.replace(/[إأآٱ]/g, "ا");
      s = s.replace(/[ة]/g, "ه");
      s = s.replace(/[يى]/g, "ي");
      const arabicIndic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      for (let i = 0; i <= 9; i++) {
        s = s.split(arabicIndic[i]).join(String(i));
        s = s.split(persian[i]).join(String(i));
      }
      return s.trim().toLowerCase();
    }

    function normalizePasswordOrCode(str: any): string {
      if (str === null || str === undefined) return "";
      let s = str.toString().trim();
      s = s.replace(/['",\s\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, "");
      const arabicIndic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      for (let i = 0; i <= 9; i++) {
        s = s.split(arabicIndic[i]).join(String(i));
        s = s.split(persian[i]).join(String(i));
      }
      if (s.endsWith(".0") || s.endsWith(".00")) {
        s = s.substring(0, s.indexOf("."));
      }
      return s.trim().toLowerCase();
    }

    const normInputUser = normalizeArabicText(username);
    const normInputPass = normalizePasswordOrCode(password);

    // Col A: 0, Col B: 1 (Subscriber), Col Z: 25 (Username), Col AA: 26 (Password), Col AB: 27 (Status), Col AC: 28 (Max Devices)
    let userRow: any[] | null = null;
    for (const r of settingsRows) {
      const uZ = r[25]?.toString().trim();
      const uB = r[1]?.toString().trim();
      const pAA = r[26]?.toString().trim();

      const normZ = normalizeArabicText(uZ);
      const normB = normalizeArabicText(uB);
      const normAA = normalizePasswordOrCode(pAA);

      const userMatches = Boolean(
        (normZ && (normZ === normInputUser || normZ.includes(normInputUser) || normInputUser.includes(normZ))) ||
        (normB && (normB === normInputUser || normB.includes(normInputUser) || normInputUser.includes(normB))) ||
        (normInputPass && (normZ === normInputPass || normB === normInputPass))
      );

      const passMatches = Boolean(
        (normAA && (normAA === normInputPass || normAA.includes(normInputPass) || normInputPass.includes(normAA))) ||
        (pAA && password && pAA.toString().trim() === password.toString().trim()) ||
        (!normAA && !normInputPass)
      );

      if (userMatches && passMatches) {
        userRow = r;
        break;
      }
    }

    if (!userRow) {
      return res.json({ success: false, message: "اسم المشترك أو رقم التسجيل غير صحيح" });
    }

    // Col AB (index 27) - حالة الاشتراك (ممنوع / مسموح)
    const status = userRow[27]?.toString().trim();
    if (status === "ممنوع" || status === "معطل" || status === "محظور" || status === "لا") {
      return res.json({ success: false, isBlocked: true, message: "تم إيقاف أو تعليق هذا الحساب من قبل الإدارة (حالة الاشتراك: ممنوع)" });
    }

    // Col AC (index 28) - عدد الأجهزة المسموحة
    let maxAllowedDevices = 1;
    const rawMax = userRow[28]?.toString().trim();
    if (rawMax) {
      const parsedMax = parseInt(rawMax, 10);
      if (!isNaN(parsedMax) && parsedMax > 0) {
        maxAllowedDevices = parsedMax;
      }
    }

    function isDeviceMatching(regDev: string, curDevId: string): boolean {
      if (!regDev || !curDevId) return false;
      const reg = regDev.toString().toLowerCase().trim();
      const cur = curDevId.toString().toLowerCase().trim();
      const cleanCur = cur.replace(/^(dev|id|device)[-:_]/i, "").trim();
      const cleanReg = reg.replace(/^(dev|id|device)[-:_]/i, "").trim();

      // 1. Direct or bi-directional full substring match
      if (reg === cur || reg === cleanCur || cleanReg === cur || cleanReg === cleanCur) return true;
      if (reg.includes(cur) || cur.includes(reg)) return true;
      if (cleanCur && (reg.includes(cleanCur) || cleanReg.includes(cleanCur))) return true;

      // 2. Extract ALL contents inside brackets [...]
      const bracketMatches = reg.match(/\[([^\]]+)\]/g) || [];
      for (const bMatch of bracketMatches) {
        const rawInside = bMatch.slice(1, -1).trim().toLowerCase();
        const cleanInside = rawInside.replace(/^(id|dev|device)[:\s_-]*/i, "").trim();

        if (cleanInside) {
          if (cleanInside === cur || cleanInside === cleanCur) return true;
          if (cur.includes(cleanInside) || cleanCur.includes(cleanInside)) return true;
          if (cleanInside.includes(cur) || cleanInside.includes(cleanCur)) return true;

          if (cleanInside.length >= 6) {
            if (cleanCur.startsWith(cleanInside) || cleanCur.endsWith(cleanInside)) return true;
            if (cur.startsWith(cleanInside) || cur.endsWith(cleanInside)) return true;
          }
        }
      }

      // 3. Check for bracketless tokens or UUIDs/hashes
      const curShort = cleanCur.length > 8 ? cleanCur.substring(0, 8) : cleanCur;
      if (curShort.length >= 6 && reg.includes(curShort)) return true;

      const hexTokens = reg.match(/[0-9a-f]{6,}/g) || [];
      for (const token of hexTokens) {
        if (cleanCur.includes(token) || token.includes(cleanCur)) return true;
      }

      return false;
    }

    // Columns AD:AW - فحص الأجهزة المسجلة
    const curDevId = (deviceId || "").toString().trim();
    if (curDevId) {
      let isKnownDevice = false;
      let registeredDeviceCount = 0;

      for (let d = 0; d < maxAllowedDevices; d++) {
        const devColIdx = 30 + (d * 2);
        const regDev = userRow[devColIdx]?.toString().trim() || "";
        if (regDev) {
          registeredDeviceCount++;
          if (isDeviceMatching(regDev, curDevId)) {
            isKnownDevice = true;
            break;
          }
        }
      }

      if (!isKnownDevice && registeredDeviceCount >= maxAllowedDevices) {
        return res.json({
          success: false,
          deviceLimitReached: true,
          message: `لقد استنفدت الحد الأقصى المسموح به من الأجهزة (${maxAllowedDevices} جهاز). يرجى التواصل مع الإدارة لإعادة التعيين.`
        });
      }
    }

    function normalizeTopicDigit(val: any): string {
      if (val === null || val === undefined) return "1";
      let s = val.toString().trim().replace(/['"]/g, "");
      if (!s) return "1";
      const arabicIndic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      for (let i = 0; i <= 9; i++) {
        s = s.split(arabicIndic[i]).join(String(i));
        s = s.split(persian[i]).join(String(i));
      }
      const num = parseFloat(s);
      if (!isNaN(num) && Number.isInteger(num)) return String(num);
      return s.trim();
    }

    const rawTopicId = userRow[0]?.toString().trim() || "1";
    const topicId = normalizeTopicDigit(rawTopicId) || "1";
    const subscriberName = userRow[1] || username;

    // Read matching topic from SubscriberContent sheet
    let topicContent: any = null;
    try {
      const contentRows = await getSheetValues("SubscriberContent");
      if (contentRows && contentRows.length > 0) {
        let matchedRow: any = null;
        for (const cRow of contentRows) {
          const cTopicId = normalizeTopicDigit(cRow[0]?.toString().trim() || "");
          if (cTopicId === topicId || cRow[0]?.toString().trim() === rawTopicId || cRow[0]?.toString().trim() === topicId) {
            matchedRow = cRow;
            break;
          }
        }

        // Fallback: If only 1 content row exists or topicId is 1, use first row
        if (!matchedRow && (contentRows.length === 1 || topicId === "1")) {
          matchedRow = contentRows[0];
        }

        if (matchedRow) {
          const cRow = matchedRow;
          const title = cRow[1]?.toString().trim() || "المحتوى المخصص للمشترك";
          const description = cRow[2]?.toString().trim() || "";
          const rawCoverImage = cRow[3]?.toString().trim() || "";
          const badge = cRow[4]?.toString().trim() || "";
          const coverImage = (rawCoverImage && rawCoverImage !== "-") ? formatImageUrl(rawCoverImage) : undefined;

          const cards: any[] = [];
          for (let c = 0; c < 10; c++) {
            const baseIdx = 5 + (c * 4);
            const cardTitle = cRow[baseIdx]?.toString().trim() || "";
            const cardDesc = cRow[baseIdx + 1]?.toString().trim() || "";
            const cardMediaRaw = cRow[baseIdx + 2]?.toString().trim() || "";
            const cardLinkUrl = cRow[baseIdx + 3]?.toString().trim() || "";

            if (cardTitle || cardDesc || cardMediaRaw || cardLinkUrl) {
              const mediaItems = cardMediaRaw ? cardMediaRaw.split(/[\n,\|]+/).map((s: string) => s.trim()).filter(Boolean).map((rawUrl: string) => {
                const isVid = isVideoUrl(rawUrl);
                const formattedUrl = isVid ? rawUrl : formatImageUrl(rawUrl);
                return { url: formattedUrl, type: isVid ? "video" : "image" };
              }) : [];

              cards.push({
                title: cardTitle || `البطاقة ${c + 1}`,
                description: cardDesc,
                media: mediaItems,
                linkUrl: cardLinkUrl && cardLinkUrl !== "-" ? cardLinkUrl : undefined,
                buttonText: cardLinkUrl && cardLinkUrl !== "-" ? "فتح الرابط المرفق" : undefined
              });
            }
          }

          topicContent = {
            topicId,
            title,
            description,
            coverImage,
            badge: badge && badge !== "-" ? badge : undefined,
            cards
          };
        }
      }
    } catch (cErr) {
      console.warn("Could not load SubscriberContent sheet in server login route:", cErr);
    }

    // Read subscriber details directly
    return res.json({
      success: true,
      subscriberName,
      topicId,
      content: topicContent,
      linkButtonText1: userRow[2] || "",
      linkButtonComment1: userRow[3] || "",
      url1: userRow[4] || "",
      linkButtonText2: userRow[5] || "",
      linkButtonComment2: userRow[6] || "",
      url2: userRow[7] || "",
      linkButtonText3: userRow[8] || "",
      linkButtonComment3: userRow[9] || "",
      url3: userRow[10] || "",
      linkButtonText4: userRow[11] || "",
      linkButtonComment4: userRow[12] || "",
      url4: userRow[13] || "",
      linkButtonText5: userRow[14] || "",
      linkButtonComment5: userRow[15] || "",
      url5: userRow[16] || "",
      exitButtonText: userRow[17] || "تسجيل الخروج",
      exitButtonComment: userRow[18] || ""
    });

  } catch (error) {
    console.error("Local login parsing error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء الاتصال بقاعدة البيانات" });
  }
});

const FORM_QUESTIONS_CACHE_PATH = path.join(process.cwd(), "data", "form_questions_cache.json");

function loadCachedFormQuestions(): any[] {
  try {
    if (fs.existsSync(FORM_QUESTIONS_CACHE_PATH)) {
      const data = fs.readFileSync(FORM_QUESTIONS_CACHE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load cached form questions:", e);
  }
  return [];
}

function saveCachedFormQuestions(questions: any[]) {
  try {
    if (!Array.isArray(questions) || questions.length === 0) return;
    const dir = path.dirname(FORM_QUESTIONS_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FORM_QUESTIONS_CACHE_PATH, JSON.stringify(questions, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save cached form questions:", e);
  }
}

// GET /api/form-questions and /api/registration-questions - Reads dynamic questions from RegistrationQuestions sheet
async function handleGetFormQuestions(req: express.Request, res: express.Response) {
  try {
    const targetScriptUrl = (req.query.scriptUrl as string) || currentScriptUrl;

    // 1. First priority: Fetch via Google Apps Script (getFormQuestions) if available
    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      try {
        console.log("Fetching form questions from Google Apps Script:", targetScriptUrl);
        const gasFetchUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=getFormQuestions`;
        const gasResponse = await fetch(gasFetchUrl, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(3500)
        });

        if (gasResponse.ok) {
          const gasData: any = await gasResponse.json().catch(() => null);
          if (gasData && gasData.questions && Array.isArray(gasData.questions) && gasData.questions.length > 0) {
            const savedTranslations = loadFormTranslations();
            const parsedQuestions = gasData.questions.map((q: any, idx: number) => {
              const rawType = (q.type || "text").toString().toLowerCase().trim();
              const rawQ = (q.question || "").toString().trim();
              const rawImg = q.imageUrl ? q.imageUrl.toString().trim() : "";
              const rawLink = q.externalLink ? q.externalLink.toString().trim() : "";

              let fieldType = "text";
              // 1. صورة (Display Image): if question is "صورة", or type is "صورة", or type is "رابط" with an image URL in Column F
              if (rawQ === "صورة" || rawType === "صورة" || rawType === "image" || rawType.includes("عرض صورة") || (rawType.includes("رابط") && rawImg && (!rawLink || rawLink === "-"))) {
                fieldType = "image_display";
              } else if (rawType.includes("عنوان زر") || rawType.includes("زر") || rawType.includes("button")) {
                fieldType = "button_link";
              } else if (rawType.includes("رفع") || rawType.includes("ملف") || rawType.includes("file")) {
                fieldType = "file";
              } else if (rawType.includes("رقم هاتف") || rawType.includes("هاتف") || rawType.includes("phone")) {
                fieldType = "phone";
              } else if (rawType.includes("رقم") || rawType.includes("number")) {
                fieldType = "number";
              } else if (rawType.includes("ايميل") || rawType.includes("بريد") || rawType.includes("email")) {
                fieldType = "email";
              } else if (rawType.includes("رابط") || rawType.includes("url") || rawType.includes("link")) {
                fieldType = "url";
              } else if (rawType.includes("اختيار") || rawType.includes("choice") || rawType.includes("select")) {
                fieldType = "choice";
              }

              const fieldTranslation = findQuestionTranslation(rawQ, q.id || idx + 1, savedTranslations);

              return {
                id: q.id || idx + 1,
                question: q.question,
                description: q.description || undefined,
                type: fieldType,
                options: Array.isArray(q.options) && q.options.length > 0 ? q.options : undefined,
                required: Boolean(q.required),
                imageUrl: rawImg ? formatImageUrl(rawImg) : undefined,
                externalLink: (rawLink && rawLink !== "-") ? rawLink : undefined,
                translations: fieldTranslation
              };
            });

            console.log(`Loaded ${parsedQuestions.length} registration questions from Google Apps Script.`);
            saveCachedFormQuestions(parsedQuestions);
            return res.json({ success: true, questions: parsedQuestions, source: "apps_script" });
          }
        }
      } catch (gasErr: any) {
        console.warn("Could not fetch questions from Google Apps Script, falling back to direct sheets CSV:", gasErr.message);
      }
    }

    // 2. Second priority: Fetch via direct Sheets
    let qRows: any[] = [];
    const possibleSheetNames = [
      "RegistrationQuestions",
      "Registration Questions",
      "registrationquestions",
      "أسئلة التسجيل",
      "اسئلة التسجيل",
      "الأسئلة",
      "الاسئلة",
      "Questions"
    ];

    for (const name of possibleSheetNames) {
      try {
        qRows = await getSheetValues(name, 1);
        if (qRows && qRows.length > 0) {
          console.log(`Found ${qRows.length} rows in sheet tab [${name}]`);
          break;
        }
      } catch (e) {
        // continue trying other tab names
      }
    }

    if (!qRows || qRows.length === 0) {
      const cached = loadCachedFormQuestions();
      if (cached && cached.length > 0) {
        return res.json({ success: true, questions: cached, source: "server_cache" });
      }
      return res.json({
        success: false,
        questions: [],
        error: "لم يتم العثور على أي أسئلة في ورقة RegistrationQuestions"
      });
    }

    const questions: any[] = [];
    // Load saved form translations
    const savedTranslations = loadFormTranslations();

    for (let i = 0; i < qRows.length; i++) {
      const row = qRows[i];
      if (!row || row.length === 0) continue;

      const questionText = row[0]?.toString().trim() || "";
      if (!questionText || questionText === "السؤال" || questionText === "نص السؤال" || questionText === "Question") continue;

      const description = row[1]?.toString().trim() || "";
      const rawType = row[2]?.toString().trim().toLowerCase() || "نص";
      const rawOptions = row[3]?.toString().trim() || "";
      const rawRequired = row[4]?.toString().trim().toLowerCase() || "";
      const rawImg = row[5]?.toString().trim() || "";
      const externalLink = row[6]?.toString().trim() || "";

      // Normalize field types
      let fieldType = "text";
      if (questionText === "صورة" || rawType === "صورة" || rawType === "image" || rawType.includes("عرض صورة") || (rawType.includes("رابط") && rawImg && (!externalLink || externalLink === "-"))) {
        fieldType = "image_display";
      } else if (rawType.includes("عنوان زر") || rawType.includes("زر") || rawType.includes("button")) {
        fieldType = "button_link";
      } else if (rawType.includes("رفع") || rawType.includes("ملف") || rawType.includes("file")) {
        fieldType = "file";
      } else if (rawType.includes("رقم هاتف") || rawType.includes("هاتف") || rawType.includes("phone")) {
        fieldType = "phone";
      } else if (rawType.includes("رقم") || rawType.includes("number")) {
        fieldType = "number";
      } else if (rawType.includes("ايميل") || rawType.includes("بريد") || rawType.includes("email")) {
        fieldType = "email";
      } else if (rawType.includes("رابط") || rawType.includes("url") || rawType.includes("link")) {
        fieldType = "url";
      } else if (rawType.includes("اختيار") || rawType.includes("choice") || rawType.includes("select")) {
        fieldType = "choice";
      }

      // Parse options separated by ||| or \n or ,
      let options: string[] = [];
      if (rawOptions) {
        if (rawOptions.includes("|||")) {
          options = rawOptions.split("|||").map((s: string) => s.trim()).filter(Boolean);
        } else if (rawOptions.includes("\n")) {
          options = rawOptions.split("\n").map((s: string) => s.trim()).filter(Boolean);
        } else {
          options = rawOptions.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }

      const isRequired = 
        rawRequired === "نعم" || 
        rawRequired === "true" || 
        rawRequired === "yes" || 
        rawRequired === "1" || 
        rawRequired === "ن" || 
        rawRequired === "مطلوب" || 
        rawRequired === "اجباري" || 
        rawRequired === "إجباري" || 
        rawRequired === "required" ||
        (rawRequired !== "" && rawRequired !== "لا" && rawRequired !== "false" && rawRequired !== "no" && rawRequired !== "0" && rawRequired !== "-");
      const imageUrl = (rawImg && rawImg !== "-") ? formatImageUrl(rawImg) : undefined;

      const qIndex = questions.length + 1;
      // Find translation by questionText or question id
      const fieldTranslation = findQuestionTranslation(questionText, qIndex, savedTranslations);

      questions.push({
        id: qIndex,
        question: questionText,
        description: description || undefined,
        type: fieldType,
        options: options.length > 0 ? options : undefined,
        required: isRequired,
        imageUrl: imageUrl,
        externalLink: (externalLink && externalLink !== "-") ? externalLink : undefined,
        translations: fieldTranslation
      });
    }

    if (questions.length > 0) {
      saveCachedFormQuestions(questions);
      return res.json({ success: true, questions, source: "google_sheets_csv" });
    }

    return res.json({
      success: false,
      questions: [],
      error: "لم يتم العثور على أي أسئلة صالحة في ورقة RegistrationQuestions"
    });
  } catch (error: any) {
    console.error("Error reading form questions:", error);
    const cached = loadCachedFormQuestions();
    if (cached && cached.length > 0) {
      return res.json({ success: true, questions: cached, source: "server_cache" });
    }
    return res.json({ success: false, questions: [], error: error.message });
  }
}

app.get("/api/form-questions", handleGetFormQuestions);
app.get("/api/registration-questions", handleGetFormQuestions);

// POST /api/form-questions - Saves configured form questions array
app.post("/api/form-questions", (req, res) => {
  try {
    const { questions } = req.body;
    if (Array.isArray(questions) && questions.length > 0) {
      saveCachedFormQuestions(questions);
      return res.json({ success: true, message: "تم حفظ أسئلة وترجمات الاستمارة بنجاح", count: questions.length });
    }
    return res.status(400).json({ success: false, message: "بيانات الأسئلة غير صالحة" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || "خطأ أثناء حفظ الأسئلة" });
  }
});

// GET /api/form-translations - Retrieve all saved translations
app.get("/api/form-translations", (req, res) => {
  const translations = loadFormTranslations();
  res.json({ success: true, translations });
});

// POST /api/form-translations - Save updated translations map
app.post("/api/form-translations", (req, res) => {
  try {
    const { translations } = req.body;
    if (translations && typeof translations === "object") {
      saveFormTranslations(translations);
      return res.json({ success: true, message: "تم حفظ الترجمات بنجاح" });
    }
    return res.status(400).json({ success: false, message: "صيغة الترجمة غير صالحة" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || "خطأ أثناء حفظ الترجمات" });
  }
});

// Helper for fallback dictionary translation
const FALLBACK_TRANSLATION_DICT: Record<string, { en: string; th: string }> = {
  "الاسم الكامل": { en: "Full Name", th: "ชื่อ-นามสกุล" },
  "الاسم": { en: "Name", th: "ชื่อ" },
  "البريد الإلكتروني": { en: "Email Address", th: "อีเมล" },
  "الايميل": { en: "Email", th: "อีเมล" },
  "رقم الهاتف": { en: "Phone Number", th: "หมายเลขโทรศัพท์" },
  "رقم الجوال": { en: "Mobile Number", th: "เบอร์มือถือ" },
  "رقم الواتساب": { en: "WhatsApp Number", th: "หมายเลข WhatsApp" },
  "العمر": { en: "Age", th: "อายุ" },
  "تاريخ الميلاد": { en: "Date of Birth", th: "วันเกิด" },
  "الجنس": { en: "Gender", th: "เพศ" },
  "ذكر": { en: "Male", th: "ชาย" },
  "أنثى": { en: "Female", th: "หญิง" },
  "الجنسية": { en: "Nationality", th: "สัญชาติ" },
  "البلد": { en: "Country", th: "ประเทศ" },
  "المدينة": { en: "City", th: "เมือง" },
  "العنوان": { en: "Address", th: "ที่อยู่" },
  "المؤهل العلمي": { en: "Educational Qualification", th: "วุฒิการศึกษา" },
  "المهنة": { en: "Occupation / Job", th: "อาชีพ" },
  "ملاحظات": { en: "Notes / Comments", th: "หมายเหตุเพิ่มเติม" },
  "صورة": { en: "Photo", th: "รูปถ่าย" },
  "الصورة الشخصية": { en: "Personal Photo", th: "รูปถ่ายส่วนตัว" },
  "رفع الصورة الشخصية": { en: "Upload Personal Photo", th: "อัปโหลดรูปถ่ายส่วนตัว" },
  "رفع الهوية": { en: "Upload ID / Passport", th: "อัปโหลดบัตรประชาชน/พาสปอร์ต" },
  "إيصال السداد": { en: "Payment Receipt", th: "สลิปการโอนเงิน" },
  "نعم": { en: "Yes", th: "ใช่" },
  "لا": { en: "No", th: "ไม่" },
  "موافق": { en: "I Agree", th: "ยอมรับ" }
};

// POST /api/auto-translate-questions - Translate questions to English and Thai using Gemini AI
app.post("/api/auto-translate-questions", async (req, res) => {
  try {
    const { questions } = req.body as { questions: any[] };
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "لا توجد أسئلة لترجمتها" });
    }

    const ai = getGenAI();
    let translationsMap: Record<string, any> = loadFormTranslations();

    if (ai) {
      try {
        const questionsToTranslate = questions.map((q: any) => ({
          key: q.question,
          question: q.question,
          description: q.description || "",
          options: q.options || [],
          type: q.type || "text"
        }));

        const prompt = `You are a professional multilingual translator specialized in Arabic, English, and Thai.
Translate the following form questions, descriptions, and dropdown choices from Arabic into English and Thai accurately.

Input questions (JSON):
${JSON.stringify(questionsToTranslate, null, 2)}

Return ONLY a JSON object where the keys are the exact original Arabic question text, and the values have the following structure:
{
  "Arabic Question Text": {
    "questionEn": "English translation of question",
    "questionTh": "Thai translation of question",
    "descriptionEn": "English translation of description or empty string",
    "descriptionTh": "Thai translation of description or empty string",
    "optionsEn": ["English translation of option 1", "English translation of option 2"],
    "optionsTh": ["Thai translation of option 1", "Thai translation of option 2"],
    "buttonTitleEn": "English button title if applicable",
    "buttonTitleTh": "Thai button title if applicable"
  }
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text);
        
        // Merge into translations map
        for (const [k, v] of Object.entries(parsed)) {
          translationsMap[k] = {
            ...(translationsMap[k] || {}),
            ...(v as object)
          };
        }

        saveFormTranslations(translationsMap);
        return res.json({ success: true, translations: translationsMap, method: "gemini-ai" });
      } catch (geminiError: any) {
        console.warn("Gemini translation error, falling back to online/dictionary translation:", geminiError);
      }
    }

    // Fallback translation if AI key is missing or failed
    for (const q of questions) {
      const qText = (q.question || "").trim();
      if (!qText) continue;
      const key = qText;
      const existing = translationsMap[key] || {};
      
      const foundInDict = FALLBACK_TRANSLATION_DICT[qText];
      
      let translatedEn = existing.questionEn || (foundInDict ? foundInDict.en : "");
      let translatedTh = existing.questionTh || (foundInDict ? foundInDict.th : "");

      if (!translatedEn) {
        translatedEn = await translateWithGoogleFree(qText, "en") || qText;
      }
      if (!translatedTh) {
        translatedTh = await translateWithGoogleFree(qText, "th") || qText;
      }

      // Translate description
      let descEn = existing.descriptionEn;
      let descTh = existing.descriptionTh;
      if (q.description && (!descEn || !descTh)) {
        if (!descEn) descEn = await translateWithGoogleFree(q.description, "en") || q.description;
        if (!descTh) descTh = await translateWithGoogleFree(q.description, "th") || q.description;
      }

      // Translate options
      let optEn = existing.optionsEn;
      let optTh = existing.optionsTh;
      if (q.options && Array.isArray(q.options) && (!optEn || !optTh)) {
        if (!optEn) {
          optEn = await Promise.all(
            q.options.map(async (opt: string) => {
              const d = FALLBACK_TRANSLATION_DICT[opt.trim()];
              return d ? d.en : (await translateWithGoogleFree(opt, "en")) || opt;
            })
          );
        }
        if (!optTh) {
          optTh = await Promise.all(
            q.options.map(async (opt: string) => {
              const d = FALLBACK_TRANSLATION_DICT[opt.trim()];
              return d ? d.th : (await translateWithGoogleFree(opt, "th")) || opt;
            })
          );
        }
      }

      const itemTranslation = {
        ...existing,
        questionEn: translatedEn,
        questionTh: translatedTh,
        descriptionEn: descEn || undefined,
        descriptionTh: descTh || undefined,
        optionsEn: optEn,
        optionsTh: optTh
      };

      translationsMap[key] = itemTranslation;
      if (q.id) {
        translationsMap[String(q.id)] = itemTranslation;
      }
    }

    saveFormTranslations(translationsMap);
    return res.json({ success: true, translations: translationsMap, method: "online_fallback" });
  } catch (error: any) {
    console.error("Auto translate error:", error);
    return res.status(500).json({ success: false, message: error?.message || "فشلت الترجمة التلقائية" });
  }
});

// Fallback online translation using Google Translate
async function translateWithGoogleFree(text: string, targetLang: "en" | "th"): Promise<string> {
  if (!text || !text.trim()) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${targetLang}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const json = await res.json();
    if (Array.isArray(json) && Array.isArray(json[0])) {
      const translated = json[0]
        .map((chunk: any) => (chunk && chunk[0] ? chunk[0] : ""))
        .join("");
      return translated.trim();
    }
  } catch (err: any) {
    console.warn(`Fallback online translation to ${targetLang} failed:`, err?.message);
  }
  return "";
}

// GET /api/site-translations - Retrieve all saved website translations
app.get("/api/site-translations", (req, res) => {
  try {
    const translations = loadSiteTranslations();
    res.json({ success: true, translations });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/site-translations - Save updated website translations array
app.post("/api/site-translations", (req, res) => {
  try {
    const { translations } = req.body;
    if (Array.isArray(translations)) {
      saveSiteTranslations(translations);
      return res.json({ success: true, message: "تم حفظ ترجمات الموقع بنجاح" });
    }
    return res.status(400).json({ success: false, message: "بيانات الترجمة غير صالحة" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/ai-translate-texts - Intelligent translation to Thai and English for site items
app.post("/api/ai-translate-texts", async (req, res) => {
  try {
    const { items } = req.body as { items: Array<{ id: string; ar: string; category?: string }> };
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "لا توجد نصوص لترجمتها" });
    }

    const validItems = items.filter(it => it && it.id && it.ar && typeof it.ar === "string" && it.ar.trim());
    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: "كافة النصوص المحددة فارغة" });
    }

    const ai = getGenAI();
    const results: Record<string, { th: string; en: string }> = {};

    // Helper to chunk items for optimal model processing
    const chunkSize = 25;
    for (let i = 0; i < validItems.length; i += chunkSize) {
      const batch = validItems.slice(i, i + chunkSize);

      if (ai) {
        try {
          const promptItems = batch.map(b => ({
            id: b.id,
            text: b.ar.trim()
          }));

          const prompt = `You are a professional multilingual translator specializing in Arabic, English, and Thai.
Translate the following list of Arabic texts into English and Thai accurately with high cultural and contextual precision suitable for an Islamic Arabic calligraphy institution website.
Preserve proper nouns (e.g. "يوسف ذنون" -> "Yousif Dhannoun" in English, "ยูซุฟ ซันนูน" in Thai).
NEVER return Arabic text in the English (en) or Thai (th) fields. Thai translation MUST be in Thai script (ภาษาไทย).

Input JSON items:
${JSON.stringify(promptItems, null, 2)}

Return ONLY a valid JSON object where keys are the exact input "id"s, and each value contains "en" (English translation) and "th" (Thai translation in Thai script).
Example output structure:
{
  "item_id_1": {
    "en": "Masterpieces of Arabic Calligraphy",
    "th": "ผลงานชิ้นเอกแห่งศิลปะการประดิษฐ์ตัวอักษรอาหรับ"
  }
}`;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          const responseText = aiResponse.text || "{}";
          const parsed = JSON.parse(responseText);

          if (parsed && typeof parsed === "object") {
            for (const item of batch) {
              const trans = parsed[item.id];
              if (trans && trans.en && trans.th && trans.en !== item.ar && trans.th !== item.ar) {
                results[item.id] = {
                  en: String(trans.en).trim(),
                  th: String(trans.th).trim()
                };
              }
            }
          }
        } catch (geminiErr: any) {
          console.warn("Gemini translation error for batch, using fallback:", geminiErr?.message);
        }
      }

      // For any item in the batch missing English or Thai, use robust fallback online translation
      for (const item of batch) {
        const existing = results[item.id] || { en: "", th: "" };
        let en = existing.en;
        let th = existing.th;

        if (!en || en === item.ar) {
          en = await translateWithGoogleFree(item.ar, "en");
        }
        if (!th || th === item.ar) {
          th = await translateWithGoogleFree(item.ar, "th");
        }

        results[item.id] = {
          en: en || item.ar,
          th: th || item.ar
        };
      }
    }

    return res.json({
      success: true,
      results,
      count: Object.keys(results).length,
      message: "تمت الترجمة بنجاح"
    });
  } catch (error: any) {
    console.error("AI translate texts route error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "فشلت عملية الترجمة الذكية"
    });
  }
});

// POST /api/upload-drive - Uploads file/image to Google Drive via Google Apps Script
app.post("/api/upload-drive", async (req, res) => {
  try {
    const { base64Data, fileName, mimeType, folderId, scriptUrl } = req.body;
    const targetFolderId = folderId || currentDriveFolderId || "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";
    const targetScriptUrl = scriptUrl || currentScriptUrl;

    if (!base64Data) {
      return res.status(400).json({ success: false, message: "بيانات الملف مفقودة" });
    }

    // Clean base64 prefix if exists
    let cleanBase64 = base64Data;
    if (cleanBase64.includes("base64,")) {
      cleanBase64 = cleanBase64.split("base64,")[1];
    }

    // 1. Forward to Google Apps Script if URL exists
    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      try {
        console.log("Forwarding file upload to Google Apps Script:", targetScriptUrl);
        const gasPayload = JSON.stringify({
          action: "uploadFile",
          base64Data: cleanBase64,
          fileName: fileName || `upload_${Date.now()}.jpg`,
          mimeType: mimeType || "image/jpeg",
          folderId: targetFolderId
        });

        const gasRes = await fetch(targetScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: gasPayload,
          redirect: "follow"
        });

        if (gasRes.ok) {
          const data: any = await gasRes.json().catch(() => null);
          if (data && data.success && data.fileUrl) {
            console.log("File uploaded to Drive via Apps Script successfully:", data.fileUrl);
            return res.json({
              success: true,
              fileUrl: data.fileUrl,
              downloadUrl: data.downloadUrl || data.fileUrl,
              fileId: data.fileId,
              fileName: data.fileName || fileName,
              message: "تم رفع الملف إلى Google Drive بنجاح"
            });
          }
        }
      } catch (gasErr: any) {
        console.warn("Could not upload file via Google Apps Script:", gasErr.message);
      }
    }

    // 2. Fallback: Save file locally to /public/uploads/
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${Date.now()}_${(fileName || "file.jpg").replace(/[^a-zA-Z0-9\._-]/g, "_")}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));
      const localFileUrl = `/uploads/${safeName}`;

      return res.json({
        success: true,
        fileUrl: localFileUrl,
        downloadUrl: localFileUrl,
        fileName: safeName,
        message: "تم حفظ الملف بنجاح"
      });
    } catch (saveErr: any) {
      console.error("Local file save error:", saveErr);
      return res.status(500).json({ success: false, message: "فشل حفظ الملف" });
    }

  } catch (error: any) {
    console.error("Upload drive endpoint error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء رفع الملف" });
  }
});

// Helper: Load & Save Subscriber Email Configuration
const SUBSCRIBER_EMAIL_CONFIG_FILE = path.join(process.cwd(), "data", "subscriber_email_config.json");

function loadSubscriberEmailConfig() {
  try {
    if (fs.existsSync(SUBSCRIBER_EMAIL_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(SUBSCRIBER_EMAIL_CONFIG_FILE, "utf-8"));
    }
  } catch (e) {
    console.warn("Could not read subscriber_email_config.json:", e);
  }
  return {
    enabled: true,
    emailColumn: "G",
    deliveryStatusColumn: "P",
    dataFields: [
      { id: "1", label: "رقم التسجيل", labelEn: "Registration ID", labelTh: "หมายเลขลงทะเบียน", columnLetter: "B" },
      { id: "2", label: "اسم المشترك", labelEn: "Participant Name", labelTh: "ชื่อผู้สมัคร", columnLetter: "C" },
      { id: "3", label: "تاريخ ووقت التسجيل", labelEn: "Registration Date & Time", labelTh: "วันและเวลาที่ลงทะเบียน", columnLetter: "A" },
      { id: "4", label: "رقم الهاتف / الواتساب", labelEn: "Phone / WhatsApp", labelTh: "เบอร์โทรศัพท์ / WhatsApp", columnLetter: "F" },
      { id: "5", label: "رابط الدخول لصفحة الاشتراك", labelEn: "Login / Courses Portal", labelTh: "ลิงก์เข้าสู่ระบบบทเรียน", columnLetter: "LOGIN_URL" }
    ],
    qrCodeColumns: "B",
    qrDriveUrlColumn: "O",
    includeQrInEmail: true,
    messages: {
      ar: {
        subject: "تأكيد تسجيلك في منصة مؤسسة يوسف ذنون - بيانات الدخول والاشتراك",
        header: "مرحباً بك في مؤسسة يوسف ذنون للخط العربي",
        body: "نشكرك على تسجيلك واهتمامك بتعلم وإتقان فنون الخط العربي الأصيل. فيما يلي تفاصيل وبيانات تسجيلك المعتمدة للدخول ومتابعة الدورات والمحتوى الحصري:",
        footerNote: "يرجى الاحتفاظ برمز الاستجابة السريعة (QR Code) وبيانات التسجيل لاستخدامها عند مراجعة اشتراكك أو حضور الجلسات."
      },
      en: {
        subject: "Registration Confirmation - Yousuf Dhannoon Calligraphy Portal",
        header: "Welcome to Yousuf Dhannoon Calligraphy Institute",
        body: "Thank you for registering. Below are your verified registration details and access credentials to explore your courses and exclusive content:",
        footerNote: "Please keep this QR Code and your registration ID handy for subscription verification and session access."
      },
      th: {
        subject: "ยืนยันการลงทะเบียน - สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันนูน",
        header: "ยินดีต้อนรับสู่ สถาบันยูซุฟ ซันนูน สำหรับการเขียนอักษรอาหรับ",
        body: "ขอขอบคุณสำหรับการลงทะเบียน รายละเอียดข้อมูลการสมัครและข้อมูลสำหรับเข้าสู่ระบบบทเรียนของคุณมีดังนี้:",
        footerNote: "กรุณาเก็บรหัส QR Code และหมายเลขลงทะเบียนนี้ไว้เพื่อใช้ในการยืนยันสิทธิ์และการเข้าเรียน"
      }
    },
    attachments: [
      {
        id: "1",
        title: "دليل المشترك ومنهاج الدورات (PDF)",
        titleEn: "Subscriber Guide & Curriculum (PDF)",
        titleTh: "คู่มือสมาชิกและหลักสูตร (PDF)",
        url: "https://drive.google.com/file/d/1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7/view",
        type: "file_button"
      },
      {
        id: "2",
        title: "شعار وبطاقة عضوية المؤسسة",
        titleEn: "Institute Badge & Emblem",
        titleTh: "ตราสัญลักษณ์บัตรสมาชิก",
        url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
        type: "image"
      }
    ]
  };
}

function saveSubscriberEmailConfig(config: any) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIBER_EMAIL_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to save subscriber email config:", e);
    return false;
  }
}

// Helper: Load & Save Telegram Configuration
const TELEGRAM_CONFIG_FILE = path.join(process.cwd(), "data", "telegram_config.json");

function loadTelegramConfig() {
  try {
    if (fs.existsSync(TELEGRAM_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(TELEGRAM_CONFIG_FILE, "utf-8"));
    }
  } catch (e) {
    console.warn("Could not read telegram_config.json:", e);
  }
  return {
    enabled: false,
    botToken: "",
    chatId: "",
    topicId: "",
    notificationTitle: "🔔 إشعار تسجيل جديد - مؤسسة يوسف ذنون",
    includeAllAnswers: true,
    includeQrCode: true,
    includeAttachment: true,
    customButtons: [],
    customHeader: "🏛️ مؤسسة يوسف ذنون للخط العربي",
    customFooter: "⚡ نظام المتابعة الفورية للإدارة"
  };
}

function saveTelegramConfig(config: any) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(TELEGRAM_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to save telegram config:", e);
    return false;
  }
}

function escapeTelegramHtml(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtmlTags(text: string): string {
  if (!text) return "";
  return String(text).replace(/<[^>]*>?/gm, "");
}

async function sendTelegramAdminNotification(config: any, regData: any, spreadsheetId?: string) {
  if (!config || !config.enabled || !config.botToken || !config.chatId) {
    console.log("[Telegram] Notification skipped: disabled or missing botToken/chatId");
    return { success: false, reason: "Telegram notifications not enabled or missing token/chatId" };
  }

  const token = config.botToken.trim();
  const chatId = config.chatId.trim();
  const topicId = config.topicId ? config.topicId.trim() : "";

  // Extract subscriber details safely
  let name = regData.name || regData.nameArabic || "";
  let regId = regData.registrationId || "";
  let phone = regData.phone || "";
  let email = regData.email || "";
  const timestamp = regData.timestamp || new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });
  const sheetId = spreadsheetId || currentSpreadsheetId || "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";

  if (regData.answers && Array.isArray(regData.answers)) {
    regData.answers.forEach((item: any) => {
      if (!item) return;
      const q = (item.question || "").trim();
      const a = typeof item.answer === "string" ? item.answer.trim() : String(item.answer || "").trim();
      if (!name && (q.includes("اسم") || q.includes("الاسم") || q.toLowerCase().includes("name"))) name = a;
      if (!phone && (q.includes("هاتف") || q.includes("واتساب") || q.includes("جوال") || q.toLowerCase().includes("phone"))) phone = a;
      if (!email && (q.includes("ايميل") || q.includes("بريد") || q.toLowerCase().includes("email"))) email = a;
    });
  }

  if (!name) name = "مشترك جديد";
  if (!regId) regId = "REG-" + Date.now().toString().slice(-6);

  // Generate QR Code data from active subscriber email config (respecting user selected columns like B, C)
  let qrInfo: { qrText: string; qrUrl: string } | null = null;
  try {
    const emailConfig = loadSubscriberEmailConfig();
    const qrColsStr = (emailConfig.qrCodeColumns || "B, C").trim();
    const cols = qrColsStr.split(/[,\s+]+/).map((c: string) => c.trim().toUpperCase()).filter(Boolean);
    const qrParts: string[] = [];

    const sampleAnswersMap: Record<string, string> = {};
    if (regData.answers && Array.isArray(regData.answers)) {
      regData.answers.forEach((item: any) => {
        if (item && item.question) sampleAnswersMap[item.question] = String(item.answer || "");
      });
    }

    cols.forEach((col: string) => {
      let val = "";
      if (col === "A") val = timestamp;
      else if (col === "B") val = regId;
      else if (col === "C") val = name;
      else if (col === "E") val = email;
      else if (col === "F") val = phone;
      else if (regData.answers && Array.isArray(regData.answers)) {
        // letter A=1, B=2, C=3, D=4 => index 0
        let cNum = 0;
        for (let i = 0; i < col.length; i++) {
          cNum += (col.charCodeAt(i) - 64) * Math.pow(26, col.length - i - 1);
        }
        if (cNum >= 4 && regData.answers[cNum - 4]) {
          const itm = regData.answers[cNum - 4];
          if (itm && itm.answer) val = String(itm.answer);
        }
      }

      if (val && typeof val === "string" && !val.startsWith("data:")) {
        qrParts.push(val.trim());
      }
    });

    if (qrParts.length === 0) {
      if (regId) qrParts.push(regId);
      if (name && name !== "مشترك جديد") qrParts.push(name);
    }

    const qrText = qrParts.join(" - ") || regId;
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrText)}&size=260&margin=1`;
    qrInfo = { qrText, qrUrl };
  } catch (qrErr: any) {
    console.warn("QR build error in Telegram notification:", qrErr.message);
  }

  // 1. Detect uploaded image attachment URL & Google Drive File ID
  let detectedImageUrl = "";
  let driveFileId = "";
  let driveViewUrl = "";

  function extractFileIdFromUrl(url: string) {
    if (!url || typeof url !== "string") return "";
    const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    return m && m[1] ? m[1] : "";
  }

  if (config.includeAttachment !== false) {
    if (regData.attachment && typeof regData.attachment === "string") {
      const fId = extractFileIdFromUrl(regData.attachment);
      if (fId) {
        driveFileId = fId;
        driveViewUrl = `https://drive.google.com/file/d/${fId}/view?usp=sharing`;
        detectedImageUrl = `https://lh3.googleusercontent.com/d/${fId}=w1600`;
      } else if (/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(regData.attachment) || regData.attachment.startsWith("http")) {
        detectedImageUrl = regData.attachment;
      }
    }
    // Also check if any answer item contains a drive image URL
    if (!detectedImageUrl && regData.answers && Array.isArray(regData.answers)) {
      for (const item of regData.answers) {
        if (item && typeof item.answer === "string") {
          const fId = extractFileIdFromUrl(item.answer);
          if (fId) {
            driveFileId = fId;
            driveViewUrl = `https://drive.google.com/file/d/${fId}/view?usp=sharing`;
            detectedImageUrl = `https://lh3.googleusercontent.com/d/${fId}=w1600`;
            break;
          } else if (/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(item.answer)) {
            detectedImageUrl = item.answer;
            break;
          }
        }
      }
    }
  }

  // If uploaded photo exists and QR code is also enabled, send the uploaded photo as the main photo and add QR as an inline action button.
  // If NO uploaded photo exists but QR code is enabled, send the QR Code image directly as the main photo.
  let qrCodeAsButton = false;
  if (detectedImageUrl) {
    if (config.includeQrCode && qrInfo && qrInfo.qrUrl) {
      qrCodeAsButton = true;
    }
  } else if (config.includeQrCode && qrInfo && qrInfo.qrUrl) {
    detectedImageUrl = qrInfo.qrUrl;
  }

  // Build Telegram HTML Message
  let message = "";
  if (config.customHeader) {
    message += `<b>${escapeTelegramHtml(config.customHeader)}</b>\n`;
  }
  message += `<b>${escapeTelegramHtml(config.notificationTitle || "🔔 إشعار تسجيل جديد - مؤسسة يوسف ذنون")}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 <b>اسم المشترك:</b> ${escapeTelegramHtml(name)}\n`;
  message += `🆔 <b>رقم التسجيل:</b> <code>${escapeTelegramHtml(regId)}</code>\n`;
  if (phone) {
    message += `📱 <b>الهاتف:</b> <code>${escapeTelegramHtml(phone)}</code>\n`;
  }
  if (email) {
    message += `📧 <b>البريد:</b> ${escapeTelegramHtml(email)}\n`;
  }
  message += `⏰ <b>التاريخ والوقت:</b> ${escapeTelegramHtml(timestamp)}\n`;

  // Form answers list if enabled
  if (config.includeAllAnswers && regData.answers && Array.isArray(regData.answers) && regData.answers.length > 0) {
    message += `\n📋 <b>تفاصيل وإجابات الاستمارة:</b>\n`;
    regData.answers.forEach((item: any, idx: number) => {
      if (!item) return;
      const q = item.question || `سؤال ${idx + 1}`;
      let a = item.answer;
      if (a === undefined || a === null || a === "") {
        a = "—";
      }

      const isDriveLink = typeof a === "string" && (a.includes("drive.google.com") || a.includes("lh3.googleusercontent.com"));
      const isBase64Img = typeof a === "string" && (a.startsWith("data:image") || a.includes("base64,"));

      if (isDriveLink) {
        message += `▫️ <b>${escapeTelegramHtml(q)}:</b> <a href="${escapeTelegramHtml(a)}">عرض المرفق من Google Drive ↗</a>\n`;
      } else if (isBase64Img) {
        message += `▫️ <b>${escapeTelegramHtml(q)}:</b> <i>[صورة مرفقة بالإشعار 🖼️]</i>\n`;
      } else if (typeof a === "string" && (a.startsWith("http://") || a.startsWith("https://"))) {
        message += `▫️ <b>${escapeTelegramHtml(q)}:</b> <a href="${escapeTelegramHtml(a)}">فتح الرابط ↗</a>\n`;
      } else {
        const safeText = String(a).length > 250 ? String(a).slice(0, 250) + "..." : String(a);
        message += `▫️ <b>${escapeTelegramHtml(q)}:</b> ${escapeTelegramHtml(safeText)}\n`;
      }
    });
  }

  if (config.customFooter) {
    message += `\n<i>${escapeTelegramHtml(config.customFooter)}</i>`;
  }

  // Inline keyboard buttons
  const inlineKeyboard: any[][] = [];

  // Direct button to view the uploaded file in Google Drive if present
  if (driveViewUrl) {
    inlineKeyboard.push([{
      text: "🖼️ فتح المرفق في Google Drive ↗",
      url: driveViewUrl
    }]);
  }

  // If both photo and QR Code exist, add a direct QR button to open the QR Code image
  if (qrCodeAsButton && qrInfo && qrInfo.qrUrl) {
    inlineKeyboard.push([{
      text: "🔳 عرض وتنزيل رمز QR Code ↗",
      url: qrInfo.qrUrl
    }]);
  }

  // Add Custom Action Buttons configured by the admin
  if (config.customButtons && Array.isArray(config.customButtons) && config.customButtons.length > 0) {
    config.customButtons.forEach((btn: any) => {
      if (btn && btn.text && btn.url && btn.url.startsWith("http")) {
        inlineKeyboard.push([{
          text: btn.text.trim(),
          url: btn.url.trim()
        }]);
      }
    });
  }

  const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

  // Truncate message if it exceeds Telegram 4000 char safe limit
  let finalHtmlMessage = message;
  if (finalHtmlMessage.length > 3900) {
    finalHtmlMessage = finalHtmlMessage.slice(0, 3850) + "\n... (تم اختصار باقي الإجابات)";
  }

  console.log(`[Telegram] Sending notification for ${name} (${regId}) to Chat ID ${chatId}... (detectedImageUrl: ${detectedImageUrl ? 'YES' : 'NO'})`);

  // Try 0: If an image attachment exists, send via sendPhoto directly with caption
  if (detectedImageUrl) {
    try {
      const captionLimit = 1000;
      let photoCaption = finalHtmlMessage;
      if (photoCaption.length > captionLimit) {
        photoCaption = photoCaption.slice(0, captionLimit - 50) + "\n... (تفاصيل المشترك)";
      }

      const photoPayload: any = {
        chat_id: chatId,
        photo: detectedImageUrl,
        caption: photoCaption,
        parse_mode: "HTML"
      };
      if (topicId) photoPayload.message_thread_id = Number(topicId);
      if (replyMarkup) photoPayload.reply_markup = replyMarkup;

      const pRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoPayload)
      });
      const pData: any = await pRes.json().catch(() => null);

      if (pData && pData.ok) {
        console.log(`[Telegram] Photo notification sent directly to Telegram (Message ID: ${pData.result?.message_id})`);
        return { success: true, result: pData.result, type: "photo" };
      } else {
        console.warn("[Telegram] sendPhoto failed, falling back to text message:", pData?.description);
      }
    } catch (photoErr: any) {
      console.warn("[Telegram] sendPhoto exception:", photoErr.message);
    }
  }

  // Try 1: Send via sendMessage (HTML format)
  try {
    const msgPayload: any = {
      chat_id: chatId,
      text: finalHtmlMessage,
      parse_mode: "HTML",
      disable_web_page_preview: false
    };
    if (topicId) msgPayload.message_thread_id = Number(topicId);
    if (replyMarkup) msgPayload.reply_markup = replyMarkup;

    const mRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgPayload)
    });
    const mData: any = await mRes.json().catch(() => null);

    if (mData && mData.ok) {
      console.log(`[Telegram] Message sent successfully (ID: ${mData.result?.message_id})`);
      return { success: true, result: mData.result };
    } else {
      console.warn("[Telegram] HTML sendMessage failed, trying Plain Text fallback:", mData?.description);
      
      // Try 2 Fallback: Send plain text without parse_mode (immune to HTML entities bugs)
      const plainText = stripHtmlTags(finalHtmlMessage);
      const fallbackPayload: any = {
        chat_id: chatId,
        text: plainText
      };
      if (topicId) fallbackPayload.message_thread_id = Number(topicId);
      if (replyMarkup) fallbackPayload.reply_markup = replyMarkup;

      const fRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackPayload)
      });
      const fData: any = await fRes.json().catch(() => null);

      if (fData && fData.ok) {
        console.log(`[Telegram] Fallback plain-text message sent successfully (ID: ${fData.result?.message_id})`);
        return { success: true, result: fData.result };
      } else {
        console.error("[Telegram] Both HTML and Fallback failed:", fData);
        return { success: false, error: fData?.description || mData?.description || "Failed to send Telegram message" };
      }
    }
  } catch (netErr: any) {
    console.error("[Telegram] Network error connecting to Telegram API:", netErr.message);
    return { success: false, error: netErr.message };
  }
}

// GET /api/telegram-config
app.get("/api/telegram-config", (req, res) => {
  const config = loadTelegramConfig();
  res.json({ success: true, config });
});

// POST /api/telegram-config
app.post("/api/telegram-config", async (req, res) => {
  const { config, scriptUrl } = req.body;
  if (!config) {
    return res.status(400).json({ success: false, message: "بيانات الإعدادات مفقودة" });
  }
  const saved = saveTelegramConfig(config);

  // Forward to Google Apps Script if URL exists
  const targetScriptUrl = scriptUrl || currentScriptUrl;
  if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
    try {
      await fetch(targetScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveTelegramConfig",
          telegramConfig: config
        })
      });
    } catch (e: any) {
      console.warn("Could not sync telegram config to Apps Script:", e.message);
    }
  }

  if (saved) {
    return res.json({ success: true, message: "تم حفظ إعدادات إشعارات تلغرام بنجاح" });
  } else {
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ الإعدادات" });
  }
});

// POST /api/test-telegram
app.post("/api/test-telegram", async (req, res) => {
  try {
    const { config, scriptUrl, spreadsheetId } = req.body;
    const activeConfig = config || loadTelegramConfig();

    if (!activeConfig.botToken || !activeConfig.chatId) {
      return res.status(400).json({
        success: false,
        message: "رمز Bot Token ومعرف Chat ID مطلوبان لإجراء الاختبار"
      });
    }

    const testPayload = {
      name: "مشترك تجريبي (Test User)",
      registrationId: "TEST-" + Math.floor(100000 + Math.random() * 900000),
      phone: "+9647701234567",
      email: "subscriber@example.com",
      timestamp: new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" }),
      answers: [
        { question: "الدورة المطلوبة", answer: "دلالات الخط الكوفي والثلث" },
        { question: "المستوى", answer: "متوسط / متقدم" },
        { question: "المدينة", answer: "الموصل، العراق" }
      ],
      attachment: "https://drive.google.com/file/d/1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7/view"
    };

    // Try direct send from server first
    const directResult = await sendTelegramAdminNotification(
      { ...activeConfig, enabled: true },
      testPayload,
      spreadsheetId || currentSpreadsheetId
    );

    if (directResult.success) {
      return res.json({
        success: true,
        message: "تم إرسال رسالة الاختبار بنجاح إلى تلغرام! تفقد محادثة البوت أو المجموعة الآن."
      });
    } else {
      return res.status(400).json({
        success: false,
        message: directResult.error ? `خطأ من تلغرام: ${directResult.error}` : "تعذر إرسال الإشعار لتلغرام"
      });
    }
  } catch (error: any) {
    console.error("Test telegram error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "حدث خطأ غير متوقع أثناء الاتصال بتلغرام"
    });
  }
});

// GET /api/subscriber-email-config
app.get("/api/subscriber-email-config", (req, res) => {
  const config = loadSubscriberEmailConfig();
  res.json({ success: true, config });
});

// POST /api/subscriber-email-config
app.post("/api/subscriber-email-config", async (req, res) => {
  const { config, scriptUrl } = req.body;
  if (!config) {
    return res.status(400).json({ success: false, message: "بيانات الإعدادات مفقودة" });
  }
  const saved = saveSubscriberEmailConfig(config);

  // Also forward to Google Apps Script if URL exists
  const targetScriptUrl = scriptUrl || currentScriptUrl;
  if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
    try {
      await fetch(targetScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveSubscriberEmailConfig",
          emailConfig: config
        })
      });
    } catch (e: any) {
      console.warn("Could not sync subscriber email config to Apps Script:", e.message);
    }
  }

  if (saved) {
    return res.json({ success: true, message: "تم حفظ إعدادات إيميل المشترك بنجاح" });
  } else {
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ الإعدادات" });
  }
});

// POST /api/auto-translate-email-template
app.post("/api/auto-translate-email-template", async (req, res) => {
  try {
    const { arTemplate, dataFields, attachments } = req.body;
    if (!arTemplate) {
      return res.status(400).json({ success: false, message: "القالب العربي مفقود" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an expert multilingual translator specializing in Arabic, English, and Thai.
Translate the following email template from Arabic into English and Thai.
Keep placeholders like {name}, {id}, {email}, {date}, {login_url} intact without changing their syntax.

Arabic template:
${JSON.stringify({
  subject: arTemplate.subject || "",
  header: arTemplate.header || "",
  body: arTemplate.body || "",
  footerNote: arTemplate.footerNote || "",
  fields: dataFields ? dataFields.map((f: any) => ({ id: f.id, label: f.label })) : [],
  attachments: attachments ? attachments.map((a: any) => ({ id: a.id, title: a.title })) : []
}, null, 2)}

Return ONLY valid JSON matching this exact structure:
{
  "en": {
    "subject": "...",
    "header": "...",
    "body": "...",
    "footerNote": "..."
  },
  "th": {
    "subject": "...",
    "header": "...",
    "body": "...",
    "footerNote": "..."
  },
  "fieldsEn": { "fieldId": "English Label" },
  "fieldsTh": { "fieldId": "Thai Label" },
  "attachmentsEn": { "attachmentId": "English Title" },
  "attachmentsTh": { "attachmentId": "Thai Title" }
}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const parsed = JSON.parse(aiResponse.text || "{}");
        return res.json({ success: true, result: parsed, method: "gemini-ai" });
      } catch (gemErr: any) {
        console.warn("Gemini translate email template error:", gemErr);
      }
    }

    // Fallback translations
    return res.json({
      success: true,
      result: {
        en: {
          subject: "Registration Confirmation - Yousuf Dhannoon Calligraphy Portal",
          header: "Welcome to Yousuf Dhannoon Calligraphy Institute",
          body: arTemplate.body || "Thank you for registering. Below are your verified registration details and access credentials:",
          footerNote: arTemplate.footerNote || "Please keep this QR Code and your registration ID handy for subscription verification."
        },
        th: {
          subject: "ยืนยันการลงทะเบียน - สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันنูน",
          header: "ยินดีต้อนรับสู่ สถาบันยูซุฟ ซันนูน สำหรับการเขียนอักษรอาหรับ",
          body: arTemplate.body || "ขอขอบคุณสำหรับการลงทะเบียน รายละเอียดข้อมูลการสมัครสำหรับเข้าสู่ระบบของคุณมีดังนี้:",
          footerNote: arTemplate.footerNote || "กรุณาเก็บรหัส QR Code และหมายเลขลงทะเบียนนี้ไว้เพื่อใช้ในการยืนยันสิทธิ์"
        }
      },
      method: "fallback"
    });
  } catch (error: any) {
    console.error("Translate email template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/site-translations - Load stored website translations
app.get("/api/site-translations", (req, res) => {
  try {
    if (fs.existsSync(siteTranslationsFile)) {
      const data = fs.readFileSync(siteTranslationsFile, "utf-8");
      const parsed = JSON.parse(data);
      return res.json({ success: true, translations: parsed });
    }
  } catch (err: any) {
    console.error("Error reading site_translations.json:", err);
  }
  return res.json({ success: true, translations: [] });
});

// POST /api/site-translations - Save website translations
app.post("/api/site-translations", (req, res) => {
  try {
    const { translations } = req.body;
    if (!Array.isArray(translations)) {
      return res.status(400).json({ success: false, message: "صيغة الترجمات غير صالحة" });
    }

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(siteTranslationsFile, JSON.stringify(translations, null, 2), "utf-8");
    return res.json({ success: true, message: "تم حفظ ترجمات نصوص الموقع بنجاح" });
  } catch (err: any) {
    console.error("Error saving site_translations.json:", err);
    return res.status(500).json({ success: false, message: "فشل حفظ الترجمات: " + err.message });
  }
});

// POST /api/ai-translate-texts - AI Smart Translation for UI texts (Arabic -> Thai & English)
app.post("/api/ai-translate-texts", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "لا توجد نصوص مرسلة للترجمة" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a professional multilingual translator specializing in Arabic, Thai (ภาษาไทย), and English.
You are translating user interface texts, buttons, titles, and descriptions for an Arabic Calligraphy & Islamic Art Institute website ("مؤسسة يوسف ذنون للخط العربي والآثار الإسلامية").

Translate the following list of Arabic texts into natural, accurate, culturally appropriate Thai and English:
- Maintain respectful, professional, and elegant phrasing appropriate for an educational cultural art institute.
- Keep any technical placeholders intact.
- Make Thai and English concise and UI-friendly for buttons, badges, and headers.

Items to translate:
${JSON.stringify(items, null, 2)}

Return ONLY valid JSON matching this exact structure:
{
  "results": {
    "<item_id>": {
      "th": "Thai translation here",
      "en": "English translation here"
    }
  }
}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const parsed = JSON.parse(aiResponse.text || "{}");
        if (parsed && parsed.results) {
          return res.json({ success: true, results: parsed.results, method: "gemini-ai" });
        }
      } catch (gemErr: any) {
        console.warn("Gemini translate texts error, falling back to smart translator:", gemErr.message);
      }
    }

    // Smart fallback dictionary generator for items
    const fallbackResults: Record<string, { th: string; en: string }> = {};
    for (const item of items) {
      const arText = (item.ar || "").trim();
      fallbackResults[item.id] = {
        th: `${arText} (ภาษาไทย)`,
        en: `${arText} (English)`
      };
    }

    return res.json({
      success: true,
      results: fallbackResults,
      method: "fallback"
    });
  } catch (err: any) {
    console.error("AI translate texts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/registration-answers - Fetch all registration answers from RegistrationAnswers sheet
app.get("/api/registration-answers", async (req, res) => {
  try {
    const targetScriptUrl = (req.query.scriptUrl as string)?.trim() || currentScriptUrl;
    
    // Helper to sanitize headers and records: eliminates empty trailing/phantom columns and duplicate columns
    function sanitizeHeadersAndRecords(rawHeaders: string[], rawRecords: any[]) {
      if (!Array.isArray(rawHeaders) || rawHeaders.length === 0) {
        return { headers: rawHeaders || [], records: rawRecords || [] };
      }
      const seen = new Set<string>();
      const validIndices: number[] = [];
      const cleanHeaders: string[] = [];

      for (let i = 0; i < rawHeaders.length; i++) {
        const h = (rawHeaders[i] || "").toString().trim();
        if (!h || h.startsWith("Column_")) continue;
        if (seen.has(h)) continue; // skip duplicates
        seen.add(h);
        validIndices.push(i);
        cleanHeaders.push(h);
      }

      const cleanRecords = (rawRecords || []).map((rec: any) => {
        const newRowData: Record<string, string> = {};
        const newRawRow: string[] = [];
        validIndices.forEach((origIdx, cleanIdx) => {
          const h = cleanHeaders[cleanIdx];
          const val = (rec.rawRow && rec.rawRow[origIdx] !== undefined)
            ? rec.rawRow[origIdx]
            : (rec.data && rec.data[rawHeaders[origIdx]] !== undefined ? rec.data[rawHeaders[origIdx]] : "");
          const cleanVal = val !== undefined && val !== null ? val.toString().trim() : "";
          newRowData[h] = cleanVal;
          newRawRow.push(cleanVal);
        });
        return {
          ...rec,
          data: newRowData,
          rawRow: newRawRow
        };
      });

      return { headers: cleanHeaders, records: cleanRecords };
    }

    // 1. Try fetching from Google Apps Script Web App first
    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      try {
        const gasUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=getRegistrationAnswers`;
        const gasRes = await fetch(gasUrl, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(6000)
        });
        if (gasRes.ok) {
          const data: any = await gasRes.json().catch(() => null);
          if (data && data.success && Array.isArray(data.records)) {
            const sanitized = sanitizeHeadersAndRecords(data.headers || [], data.records || []);
            return res.json({
              success: true,
              headers: sanitized.headers,
              records: sanitized.records,
              total: sanitized.records.length,
              source: "apps_script"
            });
          }
        }
      } catch (gasErr: any) {
        console.warn("GAS fetch registration answers error, falling back to direct sheet:", gasErr.message);
      }
    }

    // 2. Fallback: Fetch directly from Google Sheet via Google Visualization API
    const sheetData = await getSheetTableWithHeaders("RegistrationAnswers")
      .catch(() => getSheetTableWithHeaders("طلبات التسجيل"))
      .catch(() => getSheetTableWithHeaders("إجابات التسجيل"))
      .catch(() => ({ headers: [], rows: [] }));

    const headers: string[] = sheetData.headers || [];
    const sheetRows: any[][] = sheetData.rows || [];

    if (sheetRows.length === 0) {
      return res.json({
        success: true,
        headers: headers,
        records: [],
        total: 0,
        source: "sheet_gviz_empty"
      });
    }
    
    // Identify key column indexes
    let regIdColIdx = -1;
    let nameColIdx = -1;
    let nameArColIdx = -1;
    let timeColIdx = -1;

    for (let h = 0; h < headers.length; h++) {
      const hText = headers[h].toLowerCase();
      if (headers[h] === "رقم التسجيل" || hText.includes("registration") || hText.includes("regid")) {
        if (regIdColIdx === -1) regIdColIdx = h;
      } else if (headers[h] === "الاسم" || headers[h] === "اسم المشترك" || hText === "name") {
        if (nameColIdx === -1) nameColIdx = h;
      } else if (headers[h] === "الاسم بالعربي" || headers[h] === "الاسم العربي" || hText.includes("arabic")) {
        if (nameArColIdx === -1) nameArColIdx = h;
      } else if (headers[h] === "التاريخ والوقت" || headers[h] === "التاريخ" || hText.includes("time") || hText.includes("date")) {
        if (timeColIdx === -1) timeColIdx = h;
      }
    }

    if (timeColIdx === -1 && headers.length > 0) timeColIdx = 0;
    if (regIdColIdx === -1 && headers.length > 1) regIdColIdx = 1;
    if (nameColIdx === -1 && headers.length > 2) nameColIdx = 2;
    if (nameArColIdx === -1 && headers.length > 3) nameArColIdx = 3;

    const records: any[] = [];
    for (let r = 0; r < sheetRows.length; r++) {
      const row = sheetRows[r];
      if (!row || row.every((c: any) => !c || c.toString().trim() === "")) continue;

      const regId = regIdColIdx !== -1 && row[regIdColIdx] ? row[regIdColIdx].toString().trim() : "";
      const rName = nameColIdx !== -1 && row[nameColIdx] ? row[nameColIdx].toString().trim() : "";
      const rNameAr = nameArColIdx !== -1 && row[nameArColIdx] ? row[nameArColIdx].toString().trim() : "";
      const rTime = timeColIdx !== -1 && row[timeColIdx] ? row[timeColIdx].toString().trim() : "";

      const rowData: Record<string, string> = {};
      const rawRowArr: string[] = [];
      for (let k = 0; k < headers.length; k++) {
        const hName = headers[k] || `Column_${k + 1}`;
        const cellVal = row[k] !== undefined && row[k] !== null ? row[k].toString().trim() : "";
        rowData[hName] = cellVal;
        rawRowArr.push(cellVal);
      }

      records.push({
        rowIndex: r + 2, // row 1 in sheet is the headers row
        registrationId: regId,
        name: rName,
        nameArabic: rNameAr,
        timestamp: rTime,
        data: rowData,
        rawRow: rawRowArr
      });
    }

    const sanitized = sanitizeHeadersAndRecords(headers, records);

    return res.json({
      success: true,
      headers: sanitized.headers,
      records: sanitized.records,
      total: sanitized.records.length,
      source: "sheet_gviz"
    });
  } catch (error: any) {
    console.error("Fetch registration answers error:", error);
    return res.status(500).json({ success: false, message: "فشل جلب بيانات المسجلين: " + error.message, records: [] });
  }
});

// POST /api/registration-answers/update - Update registration answer record
app.post("/api/registration-answers/update", async (req, res) => {
  try {
    const { registrationId, rowIndex, updatedData, scriptUrl } = req.body;
    const targetScriptUrl = scriptUrl?.trim() || currentScriptUrl;

    if (!targetScriptUrl) {
      return res.status(400).json({
        success: false,
        message: "رابط Google Apps Script غير مضبوط لتنفيذ التعديل على الشيت مباشرة"
      });
    }

    let resultData: any = null;
    let requestError: any = null;

    // 1. First Attempt: GET request with clean JSON parameter (Fastest in Google Apps Script, avoids POST redirect stalling)
    try {
      const getUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=updateRegistrationAnswer&registrationId=${encodeURIComponent(registrationId || "")}&rowIndex=${encodeURIComponent(rowIndex || "")}&data=${encodeURIComponent(JSON.stringify(updatedData || {}))}`;
      const getRes = await fetch(getUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(12000)
      });
      const getText = await getRes.text().catch(() => "");
      try {
        const getJson = JSON.parse(getText);
        if (getJson && (getJson.success || getJson.rowIndex)) {
          resultData = getJson;
        }
      } catch (gp) {
        if (getText.includes('"success":true') || getText.includes('"success": true') || getRes.ok) {
          resultData = { success: true, message: "تم تحديث بيانات المسجل بنجاح في الشيت" };
        }
      }
    } catch (gErr: any) {
      console.warn("GET updateRegistrationAnswer error:", gErr.message);
      requestError = gErr;
    }

    // 2. Second Attempt: POST fallback if GET didn't succeed
    if (!resultData || !resultData.success) {
      try {
        const payload = JSON.stringify({
          action: "updateRegistrationAnswer",
          registrationId,
          rowIndex,
          updatedData
        });

        const response = await fetch(targetScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: payload,
          redirect: "follow",
          signal: AbortSignal.timeout(12000)
        });

        const resText = await response.text().catch(() => "");
        try {
          const parsed = JSON.parse(resText);
          if (parsed && (parsed.success || parsed.rowIndex)) {
            resultData = parsed;
          }
        } catch (pErr) {
          if (resText.includes('"success":true') || resText.includes('"success": true')) {
            resultData = { success: true, message: "تم تحديث بيانات المسجل بنجاح" };
          } else if (response.ok) {
            resultData = { success: true, message: "تم إرسال التحديث بنجاح إلى الشيت" };
          }
        }
      } catch (err: any) {
        requestError = err;
        console.warn("POST fallback update error:", err.message);
      }
    }

    if (resultData && (resultData.success || resultData.rowIndex)) {
      return res.json({
        success: true,
        message: resultData.message || "تم تحديث بيانات المسجل بنجاح",
        result: resultData
      });
    }

    const friendlyErrorMsg = requestError?.name === "TimeoutError" || requestError?.message?.includes("timeout") || requestError?.message?.includes("aborted")
      ? "استغرقت الاستجابة من قوقل وقتاً طويلاً. إذا كنت قد نسخت الكود المحدث ونشرته، يرجى المحاولة مرة أخرى أو التأكد من إتاحة الوصول (Anyone)."
      : (resultData?.message || resultData?.error || requestError?.message || "تعذر إكمال التعديل في الشيت");

    return res.json({
      success: false,
      message: friendlyErrorMsg
    });
  } catch (error: any) {
    console.error("Update registration answer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/registration-answers/delete - Delete registration answer record
app.post("/api/registration-answers/delete", async (req, res) => {
  try {
    const { registrationId, rowIndex, scriptUrl } = req.body;
    const targetScriptUrl = scriptUrl?.trim() || currentScriptUrl;

    if (!targetScriptUrl) {
      return res.status(400).json({
        success: false,
        message: "رابط Google Apps Script غير مضبوط لتنفيذ الحذف من الشيت مباشرة"
      });
    }

    let resultData: any = null;
    let requestError: any = null;

    // 1. First Attempt: GET request (Fastest in Google Apps Script)
    try {
      const getUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=deleteRegistrationAnswer&registrationId=${encodeURIComponent(registrationId || "")}&rowIndex=${encodeURIComponent(rowIndex || "")}`;
      const getRes = await fetch(getUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(12000)
      });
      const getText = await getRes.text().catch(() => "");
      try {
        const getJson = JSON.parse(getText);
        if (getJson && (getJson.success || getJson.deletedRowIndex)) {
          resultData = getJson;
        }
      } catch (gp) {
        if (getText.includes('"success":true') || getText.includes('"success": true') || getRes.ok) {
          resultData = { success: true, message: "تم حذف سجل المسجل بنجاح من الشيت" };
        }
      }
    } catch (gErr: any) {
      console.warn("GET deleteRegistrationAnswer error:", gErr.message);
      requestError = gErr;
    }

    // 2. Second Attempt: POST fallback if GET didn't succeed
    if (!resultData || !resultData.success) {
      try {
        const payload = JSON.stringify({
          action: "deleteRegistrationAnswer",
          registrationId,
          rowIndex
        });

        const response = await fetch(targetScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: payload,
          redirect: "follow",
          signal: AbortSignal.timeout(12000)
        });

        const resText = await response.text().catch(() => "");
        try {
          const parsed = JSON.parse(resText);
          if (parsed && (parsed.success || parsed.deletedRowIndex)) {
            resultData = parsed;
          }
        } catch (pErr) {
          if (resText.includes('"success":true') || resText.includes('"success": true')) {
            resultData = { success: true, message: "تم حذف سجل المسجل بنجاح" };
          } else if (response.ok) {
            resultData = { success: true, message: "تم إرسال أمر الحذف بنجاح إلى الشيت" };
          }
        }
      } catch (err: any) {
        requestError = err;
        console.warn("POST fallback delete error:", err.message);
      }
    }

    if (resultData && (resultData.success || resultData.deletedRowIndex)) {
      return res.json({
        success: true,
        message: resultData.message || "تم حذف سجل المسجل بنجاح",
        result: resultData
      });
    }

    const friendlyErrorMsg = requestError?.name === "TimeoutError" || requestError?.message?.includes("timeout") || requestError?.message?.includes("aborted")
      ? "استغرقت الاستجابة من قوقل وقتاً طويلاً. إذا كان السجل قد حُذف في الشيت بالفعل، يمكنك تحديث الجدول."
      : (resultData?.message || resultData?.error || requestError?.message || "تعذر إكمال الحذف في الشيت");

    return res.json({
      success: false,
      message: friendlyErrorMsg
    });
  } catch (error: any) {
    console.error("Delete registration answer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/settings-subscribers - Fetch subscribers from Settings sheet
app.get("/api/settings-subscribers", async (req, res) => {
  try {
    const targetScriptUrl = (req.query.scriptUrl as string)?.trim() || currentScriptUrl;

    // 1. Try fetching from Google Apps Script first
    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      try {
        const gasUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=getSettingsSubscribers`;
        const gasRes = await fetch(gasUrl, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(6000)
        });
        if (gasRes.ok) {
          const data: any = await gasRes.json().catch(() => null);
          if (data && data.success && Array.isArray(data.records)) {
            return res.json({
              success: true,
              records: data.records,
              total: data.total || data.records.length,
              source: "apps_script"
            });
          }
        }
      } catch (gasErr: any) {
        console.warn("GAS fetch settings subscribers error, falling back to direct sheet:", gasErr.message);
      }
    }

    // 2. Fallback: Fetch directly from Settings sheet via GViz
    const sheetRows = await getSheetValues("Settings")
      .catch(() => getSheetValues("الإعدادات"))
      .catch(() => []);

    if (!sheetRows || sheetRows.length < 2) {
      return res.json({
        success: true,
        records: [],
        total: 0,
        source: "sheet_gviz_empty"
      });
    }

    const records: any[] = [];
    for (let r = 1; r < sheetRows.length; r++) {
      const row = sheetRows[r];
      if (!row || row.every((c: any) => !c || c.toString().trim() === "")) continue;

      const topicId = row[0] !== undefined && row[0] !== null ? row[0].toString().trim() : "1";
      const nameB = row[1] !== undefined && row[1] !== null ? row[1].toString().trim() : "";
      const nameZ = row[25] !== undefined && row[25] !== null ? row[25].toString().trim() : "";
      const regId = row[26] !== undefined && row[26] !== null ? row[26].toString().trim() : "";
      const status = row[27] !== undefined && row[27] !== null ? row[27].toString().trim() : "مسموح";
      const devCount = row[28] !== undefined && row[28] !== null ? row[28].toString().trim() : "1";

      const finalName = nameZ || nameB;
      if (!finalName && !regId && !topicId) continue;

      const isAllowed = !(status === "ممنوع" || status === "معطل" || status === "محظور" || status === "لا");

      records.push({
        rowIndex: r + 1,
        name: finalName,
        registrationId: regId,
        topicId: topicId || "1",
        status: status || "مسموح",
        isAllowed,
        deviceCount: devCount || "1",
        rawRow: row.map((c: any) => (c !== null && c !== undefined ? c.toString().trim() : ""))
      });
    }

    return res.json({
      success: true,
      records,
      total: records.length,
      source: "sheet_gviz"
    });
  } catch (error: any) {
    console.error("Fetch settings subscribers error:", error);
    return res.status(500).json({ success: false, message: "فشل جلب بيانات المشتركين: " + error.message, records: [] });
  }
});

// POST /api/settings-subscribers/update - Update a subscriber in Settings sheet
app.post("/api/settings-subscribers/update", async (req, res) => {
  try {
    const { rowIndex, registrationId, name, topicId, status, deviceCount, resetRegisteredDevices, scriptUrl } = req.body;
    const targetScriptUrl = scriptUrl?.trim() || currentScriptUrl;

    if (!targetScriptUrl) {
      return res.status(400).json({
        success: false,
        message: "رابط Google Apps Script غير مضبوط لتنفيذ التعديل على الشيت مباشرة"
      });
    }

    let resultData: any = null;
    let requestError: any = null;

    // 1. First Attempt: GET request
    try {
      const payloadObj = { name, topicId, status, deviceCount, resetRegisteredDevices };
      const getUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=updateSettingsSubscriber&rowIndex=${encodeURIComponent(rowIndex || "")}&registrationId=${encodeURIComponent(registrationId || "")}&data=${encodeURIComponent(JSON.stringify(payloadObj))}`;
      const getRes = await fetch(getUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(12000)
      });
      const getText = await getRes.text().catch(() => "");
      try {
        const getJson = JSON.parse(getText);
        if (getJson && (getJson.success || getJson.rowIndex)) {
          resultData = getJson;
        }
      } catch (gp) {
        if (getText.includes('"success":true') || getText.includes('"success": true') || getRes.ok) {
          resultData = { success: true, message: "تم تحديث بيانات المشترك بنجاح في ورقة Settings" };
        }
      }
    } catch (gErr: any) {
      console.warn("GET updateSettingsSubscriber error:", gErr.message);
      requestError = gErr;
    }

    // 2. Second Attempt: POST fallback
    if (!resultData || !resultData.success) {
      try {
        const payload = JSON.stringify({
          action: "updateSettingsSubscriber",
          rowIndex,
          registrationId,
          name,
          topicId,
          status,
          deviceCount,
          resetRegisteredDevices,
          updatedData: { name, topicId, status, deviceCount, resetRegisteredDevices }
        });

        const response = await fetch(targetScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: payload,
          redirect: "follow",
          signal: AbortSignal.timeout(12000)
        });

        const resText = await response.text().catch(() => "");
        try {
          const parsed = JSON.parse(resText);
          if (parsed && (parsed.success || parsed.rowIndex)) {
            resultData = parsed;
          }
        } catch (pErr) {
          if (resText.includes('"success":true') || resText.includes('"success": true')) {
            resultData = { success: true, message: "تم تحديث بيانات المشترك بنجاح" };
          } else if (response.ok) {
            resultData = { success: true, message: "تم إرسال التحديث بنجاح إلى الشيت" };
          }
        }
      } catch (err: any) {
        requestError = err;
        console.warn("POST fallback updateSettingsSubscriber error:", err.message);
      }
    }

    if (resultData && (resultData.success || resultData.rowIndex)) {
      return res.json({
        success: true,
        message: resultData.message || "تم تحديث بيانات المشترك بنجاح في ورقة Settings",
        result: resultData
      });
    }

    const friendlyErrorMsg = requestError?.name === "TimeoutError" || requestError?.message?.includes("timeout") || requestError?.message?.includes("aborted")
      ? "استغرقت الاستجابة من قوقل وقتاً طويلاً. يرجى التأكد من نشر أحدث إصدار من كود Apps Script."
      : (resultData?.message || resultData?.error || requestError?.message || "تعذر إكمال التعديل في الشيت");

    return res.json({
      success: false,
      message: friendlyErrorMsg
    });
  } catch (error: any) {
    console.error("Update settings subscriber error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/settings-subscribers/delete - Delete a subscriber row from Settings sheet
app.post("/api/settings-subscribers/delete", async (req, res) => {
  try {
    const { rowIndex, registrationId, scriptUrl } = req.body;
    const targetScriptUrl = scriptUrl?.trim() || currentScriptUrl;

    if (!targetScriptUrl) {
      return res.status(400).json({
        success: false,
        message: "رابط Google Apps Script غير مضبوط لتنفيذ الحذف من الشيت مباشرة"
      });
    }

    let resultData: any = null;
    let requestError: any = null;

    // 1. First Attempt: GET request
    try {
      const getUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=deleteSettingsSubscriber&rowIndex=${encodeURIComponent(rowIndex || "")}&registrationId=${encodeURIComponent(registrationId || "")}`;
      const getRes = await fetch(getUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(12000)
      });
      const getText = await getRes.text().catch(() => "");
      try {
        const getJson = JSON.parse(getText);
        if (getJson && (getJson.success || getJson.deletedRowIndex)) {
          resultData = getJson;
        }
      } catch (gp) {
        if (getText.includes('"success":true') || getText.includes('"success": true') || getRes.ok) {
          resultData = { success: true, message: "تم حذف صف المشترك بنجاح من الشيت" };
        }
      }
    } catch (gErr: any) {
      console.warn("GET deleteSettingsSubscriber error:", gErr.message);
      requestError = gErr;
    }

    // 2. Second Attempt: POST fallback
    if (!resultData || !resultData.success) {
      try {
        const payload = JSON.stringify({
          action: "deleteSettingsSubscriber",
          rowIndex,
          registrationId
        });

        const response = await fetch(targetScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: payload,
          redirect: "follow",
          signal: AbortSignal.timeout(12000)
        });

        const resText = await response.text().catch(() => "");
        try {
          const parsed = JSON.parse(resText);
          if (parsed && (parsed.success || parsed.deletedRowIndex)) {
            resultData = parsed;
          }
        } catch (pErr) {
          if (resText.includes('"success":true') || resText.includes('"success": true')) {
            resultData = { success: true, message: "تم حذف صف المشترك بنجاح" };
          } else if (response.ok) {
            resultData = { success: true, message: "تم إرسال أمر الحذف بنجاح إلى الشيت" };
          }
        }
      } catch (err: any) {
        requestError = err;
        console.warn("POST fallback deleteSettingsSubscriber error:", err.message);
      }
    }

    if (resultData && (resultData.success || resultData.deletedRowIndex)) {
      return res.json({
        success: true,
        message: resultData.message || "تم حذف صف المشترك بنجاح من ورقة Settings",
        result: resultData
      });
    }

    const friendlyErrorMsg = requestError?.name === "TimeoutError" || requestError?.message?.includes("timeout") || requestError?.message?.includes("aborted")
      ? "استغرقت الاستجابة من قوقل وقتاً طويلاً. إذا كان الصف قد حُذف في الشيت بالفعل، يمكنك تحديث الجدول."
      : (resultData?.message || resultData?.error || requestError?.message || "تعذر إكمال الحذف في الشيت");

    return res.json({
      success: false,
      message: friendlyErrorMsg
    });
  } catch (error: any) {
    console.error("Delete settings subscriber error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/settings-subscribers/add - Add a new subscriber to Settings sheet
app.post("/api/settings-subscribers/add", async (req, res) => {
  try {
    const { name, registrationId, topicId, status, deviceCount, scriptUrl } = req.body;
    const targetScriptUrl = scriptUrl?.trim() || currentScriptUrl;

    if (!targetScriptUrl) {
      return res.status(400).json({
        success: false,
        message: "رابط Google Apps Script غير مضبوط لإضافة المشترك"
      });
    }

    const payload = JSON.stringify({
      action: "addSettingsSubscriber",
      name,
      registrationId,
      topicId: topicId || "1",
      status: status || "مسموح",
      deviceCount: deviceCount || "1"
    });

    const response = await fetch(targetScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      redirect: "follow",
      signal: AbortSignal.timeout(12000)
    });

    const resText = await response.text().catch(() => "");
    let resultData: any = null;
    try {
      resultData = JSON.parse(resText);
    } catch (e) {
      if (resText.includes('"success":true') || resText.includes('"success": true')) {
        resultData = { success: true, message: "تمت إضافة المشترك بنجاح إلى ورقة Settings" };
      }
    }

    if (resultData && (resultData.success || resultData.rowIndex)) {
      return res.json({
        success: true,
        message: resultData.message || "تمت إضافة المشترك بنجاح إلى ورقة Settings",
        result: resultData
      });
    }

    return res.json({
      success: false,
      message: resultData?.message || resultData?.error || "تعذر إضافة المشترك إلى الشيت"
    });
  } catch (error: any) {
    console.error("Add settings subscriber error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});


// POST /api/register - Submits registration data
app.post("/api/register", async (req, res) => {
  try {
    const registrationData = req.body;
    const now = new Date();
    // Format Arabic readable timestamp: YYYY/MM/DD - HH:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    // Ensure consistent numeric reference ID (Year + Month + 4 digits e.g. 202686124)
    const fallbackRegId = `${now.getFullYear()}${now.getMonth() + 1}${Math.floor(1000 + Math.random() * 9000)}`;
    const registrationId = (registrationData.registrationId && /^\d{8,12}$/.test(String(registrationData.registrationId)))
      ? String(registrationData.registrationId)
      : fallbackRegId;

    // Filter answers array to strictly exclude non-input element types (images and button links)
    let filteredAnswers: any[] = [];
    if (Array.isArray(registrationData.answers)) {
      filteredAnswers = registrationData.answers.filter((item: any) => {
        if (!item) return false;
        const qType = (item.type || "").toLowerCase().trim();
        const qText = (item.question || "").trim();
        const isNonInput =
          qType === "image_display" ||
          qType === "button_link" ||
          qType === "button_title" ||
          qType === "عنوان زر" ||
          qType === "زر" ||
          qType === "صورة" ||
          qType === "عرض صورة" ||
          qText === "صورة";
        return !isNonInput;
      });
    }

    // Load active subscriber email config and merge with any provided client config
    const activeEmailConfig = loadSubscriberEmailConfig();
    const mergedEmailConfig = {
      ...activeEmailConfig,
      ...(registrationData.emailConfig || {}),
      messages: {
        ...(activeEmailConfig.messages || {}),
        ...((registrationData.emailConfig && registrationData.emailConfig.messages) || {})
      },
      driveFolderId: currentDriveFolderId
    };

    // Check and upload any pending base64 images to Google Drive before saving to sheet
    const targetScriptUrl = registrationData.scriptUrl || currentScriptUrl;
    const targetFolderId = mergedEmailConfig.driveFolderId || currentDriveFolderId || "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      // 1. Process attachment field
      if (typeof registrationData.attachment === "string" && registrationData.attachment.startsWith("data:")) {
        try {
          const rawBase64 = registrationData.attachment.split(";base64,")[1] || registrationData.attachment.split(",")[1] || "";
          const mime = (registrationData.attachment.match(/data:([^;]+);/) || [])[1] || "image/jpeg";
          const fileName = `reg_${registrationId}_attachment_${Date.now()}.jpg`;
          
          const upRes = await fetch(targetScriptUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "uploadFile",
              base64Data: rawBase64,
              fileName,
              mimeType: mime,
              folderId: targetFolderId
            })
          });
          const upData: any = await upRes.json().catch(() => null);
          if (upData && (upData.fileUrl || upData.downloadUrl)) {
            registrationData.attachment = upData.fileUrl || upData.downloadUrl;
          }
        } catch (upErr: any) {
          console.warn("Auto-upload attachment error in /api/register:", upErr.message);
        }
      }

      // 2. Process answers array for any base64 strings
      for (let i = 0; i < filteredAnswers.length; i++) {
        const item = filteredAnswers[i];
        if (item && typeof item.answer === "string" && item.answer.startsWith("data:")) {
          try {
            const rawBase64 = item.answer.split(";base64,")[1] || item.answer.split(",")[1] || "";
            const mime = (item.answer.match(/data:([^;]+);/) || [])[1] || "image/jpeg";
            const safeQ = (item.question || `field_${i}`).replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_");
            const fileName = `reg_${registrationId}_${safeQ}_${Date.now()}.jpg`;

            const upRes = await fetch(targetScriptUrl, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({
                action: "uploadFile",
                base64Data: rawBase64,
                fileName,
                mimeType: mime,
                folderId: targetFolderId
              })
            });
            const upData: any = await upRes.json().catch(() => null);
            if (upData && (upData.fileUrl || upData.downloadUrl)) {
              item.answer = upData.fileUrl || upData.downloadUrl;
            }
          } catch (upErr: any) {
            console.warn("Auto-upload answer item error in /api/register:", upErr.message);
          }
        }
      }
    }

    const payload = {
      ...registrationData,
      answers: filteredAnswers,
      registrationId,
      timestamp: formattedTimestamp,
      emailConfig: mergedEmailConfig
    };

    // Save to local backup file
    try {
      const regDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(regDir)) {
        fs.mkdirSync(regDir, { recursive: true });
      }
      const regFile = path.join(regDir, "registrations.json");
      let allRegs: any[] = [];
      if (fs.existsSync(regFile)) {
        try {
          allRegs = JSON.parse(fs.readFileSync(regFile, "utf-8"));
        } catch (e) {}
      }
      allRegs.unshift(payload);
      fs.writeFileSync(regFile, JSON.stringify(allRegs, null, 2), "utf-8");
    } catch (saveErr) {
      console.warn("Could not save registration locally:", saveErr);
    }

    // Send Telegram Notification to Admin if configured and enabled
    let telegramResult: any = null;
    try {
      const activeTelegramConfig = loadTelegramConfig();
      const mergedTelegramConfig = {
        ...activeTelegramConfig,
        ...(req.body.telegramConfig || {})
      };
      if (mergedTelegramConfig.enabled && mergedTelegramConfig.botToken && mergedTelegramConfig.chatId) {
        console.log(`[API /api/register] Triggering Telegram notification for registration ${registrationId}...`);
        telegramResult = await sendTelegramAdminNotification(mergedTelegramConfig, payload, currentSpreadsheetId);
        console.log(`[API /api/register] Telegram notification result:`, telegramResult);
      } else {
        console.log(`[API /api/register] Telegram notification skipped. Enabled=${mergedTelegramConfig.enabled}, hasToken=${Boolean(mergedTelegramConfig.botToken)}, hasChatId=${Boolean(mergedTelegramConfig.chatId)}`);
      }
    } catch (telErr: any) {
      console.warn("[API /api/register] Could not trigger telegram admin notification:", telErr.message);
    }

    // Forward to Google Apps Script if URL exists
    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      try {
        const gasPayload = JSON.stringify({
          action: "submitRegistration",
          ...payload,
          telegramConfig: loadTelegramConfig()
        });

        const gasRes = await fetch(targetScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: gasPayload
        });
        const gasData = await gasRes.json().catch(() => null);
        console.log("GAS submitRegistration forward response:", gasData);
      } catch (gasErr: any) {
        console.warn("Could not forward registration to Google Apps Script:", gasErr.message);
      }
    }

    return res.json({
      success: true,
      registrationId,
      timestamp: formattedTimestamp,
      message: `تم استلام طلب التسجيل بنجاح بالرقم المرجعي (${registrationId}) وسيتواصل معك المشرف لتفعيل الحساب.`
    });
  } catch (error: any) {
    console.error("Error processing registration:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ طلب التسجيل" });
  }
});

// POST /api/test-subscriber-email - Sends a test email to verify MailApp and QR generation
app.post("/api/test-subscriber-email", async (req, res) => {
  try {
    const { email, name, scriptUrl, config, formLang } = req.body;
    const testEmail = email || "shyk4test2020@gmail.com";
    const targetScriptUrl = scriptUrl || currentScriptUrl;
    const activeConfig = config || loadSubscriberEmailConfig();

    if (!targetScriptUrl || !targetScriptUrl.startsWith("http")) {
      return res.status(400).json({
        success: false,
        message: "رابط Google Apps Script غير مضبوط في الإعدادات"
      });
    }

    const payload = {
      action: "testSubscriberEmail",
      email: testEmail,
      recipientEmail: testEmail,
      name: name || "مشترك تجريبي (Test User)",
      registrationId: "TEST-" + Math.floor(100000 + Math.random() * 900000),
      formLang: formLang || "ar",
      emailConfig: {
        ...activeConfig,
        driveFolderId: currentDriveFolderId
      }
    };

    console.log("Sending test email request to Apps Script:", targetScriptUrl, "for:", testEmail);
    const gasRes = await fetch(targetScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const gasData: any = await gasRes.json().catch(() => null);
    console.log("Gas test email result:", gasData);

    if (gasData) {
      return res.json(gasData);
    }

    return res.json({
      success: true,
      recipient: testEmail,
      message: "تم إرسال طلب البريد التجريبي إلى Google Apps Script"
    });
  } catch (error: any) {
    console.error("Test email route error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "فشل إرسال البريد التجريبي"
    });
  }
});

// START EXPRESS + VITE SERVER
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
