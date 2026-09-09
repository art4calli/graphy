import fs from "fs";
import path from "path";
import { DEFAULT_SUBSCRIBER_EMAIL_CONFIG, DEFAULT_TELEGRAM_CONFIG } from "../src/data/defaultConfigs";

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwdupPOk2KJr9MzfZM_JTA8GCbQFx8mlFH6cCxn0JLcH6J8g_yfrKmMTt08zZpLEcZ/exec";
const DEFAULT_SPREADSHEET_ID = "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";
const DEFAULT_DRIVE_FOLDER_ID = "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

async function sendTelegramAlert(config: any, regData: any) {
  if (!config || !config.enabled || !config.botToken || !config.chatId) {
    return;
  }
  const token = config.botToken.trim();
  const chatId = config.chatId.trim();
  const topicId = config.topicId ? config.topicId.trim() : "";

  let name = regData.name || regData.nameArabic || "مشترك جديد";
  let regId = regData.registrationId || "";
  let phone = regData.phone || "";
  let email = regData.email || "";
  const timestamp = regData.timestamp || new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" });

  if (regData.answers && Array.isArray(regData.answers)) {
    regData.answers.forEach((item: any) => {
      if (!item) return;
      const q = (item.question || "").trim();
      const a = typeof item.answer === "string" ? item.answer.trim() : String(item.answer || "").trim();
      if ((!name || name === "مشترك جديد") && (q.includes("اسم") || q.toLowerCase().includes("name"))) name = a;
      if (!phone && (q.includes("هاتف") || q.includes("واتساب") || q.includes("جوال") || q.toLowerCase().includes("phone"))) phone = a;
      if (!email && (q.includes("ايميل") || q.includes("بريد") || q.toLowerCase().includes("email"))) email = a;
    });
  }

  let text = `<b>${config.customHeader || "🏛️ مؤسسة يوسف ذنون للخط العربي"}</b>\n`;
  text += `<b>${config.notificationTitle || "🔔 إشعار تسجيل جديد"}</b>\n\n`;
  text += `👤 <b>اسم المشترك:</b> ${name}\n`;
  text += `🆔 <b>رقم التسجيل:</b> <code>${regId}</code>\n`;
  if (phone) text += `📱 <b>الهاتف / الواتساب:</b> <code>${phone}</code>\n`;
  if (email) text += `📧 <b>البريد الإلكتروني:</b> <code>${email}</code>\n`;
  text += `📅 <b>تاريخ ووقت التسجيل:</b> ${timestamp}\n\n`;

  if (config.includeAllAnswers && regData.answers && Array.isArray(regData.answers)) {
    text += `📋 <b>إجابات استمارة التسجيل:</b>\n`;
    regData.answers.forEach((item: any, idx: number) => {
      if (!item || !item.answer) return;
      const q = item.question || `سؤال ${idx + 1}`;
      const a = String(item.answer).trim();
      if (a.startsWith("http")) {
        text += `• <b>${q}:</b> <a href="${a}">عرض الرابط / المرفق ↗</a>\n`;
      } else {
        text += `• <b>${q}:</b> ${a}\n`;
      }
    });
    text += `\n`;
  }

  if (config.customFooter) {
    text += `<i>${config.customFooter}</i>\n`;
  }

  const inline_keyboard: any[][] = [];
  const row1: any[] = [];
  if (config.includeWhatsappButton && phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone) {
      row1.push({ text: "💬 محادثة واتساب", url: `https://wa.me/${cleanPhone}` });
    }
  }
  if (config.includeSheetButton) {
    row1.push({ text: "📊 فتح الشيت", url: `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit` });
  }
  if (row1.length > 0) inline_keyboard.push(row1);

  if (Array.isArray(config.customButtons)) {
    config.customButtons.forEach((btn: any) => {
      if (btn && btn.text && btn.url && btn.url.startsWith("http")) {
        inline_keyboard.push([{ text: btn.text, url: btn.url }]);
      }
    });
  }

  const telBody: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: false
  };
  if (topicId) telBody.message_thread_id = topicId;
  if (inline_keyboard.length > 0) {
    telBody.reply_markup = { inline_keyboard };
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telBody)
    });
    console.log("[Vercel /api/register] Telegram notification sent successfully to chat:", chatId);
  } catch (err: any) {
    console.warn("[Vercel /api/register] Telegram fetch error:", err.message);
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
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
    let registrationData = req.body;
    if (typeof registrationData === "string") {
      try {
        registrationData = JSON.parse(registrationData);
      } catch (e) {
        registrationData = {};
      }
    }
    registrationData = registrationData || {};

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formattedTimestamp = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const fallbackRegId = `${now.getFullYear()}${now.getMonth() + 1}${Math.floor(1000 + Math.random() * 9000)}`;
    const registrationId = registrationData.registrationId && /^\d{8,12}$/.test(String(registrationData.registrationId))
      ? String(registrationData.registrationId)
      : fallbackRegId;

    // Filter answers array to strictly exclude non-input element types (images and buttons)
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

    const targetScriptUrl = registrationData.scriptUrl || process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
    const targetFolderId = registrationData.driveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_DRIVE_FOLDER_ID;

    // 1. Convert any base64 attachment or answers to Drive URLs before sending
    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      // Attachment
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
          console.warn("[Vercel /api/register] Auto-upload attachment error:", upErr.message);
        }
      }

      // Answers with base64 images
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
            console.warn("[Vercel /api/register] Auto-upload answer error:", upErr.message);
          }
        }
      }
    }

    let activeEmailConfig = DEFAULT_SUBSCRIBER_EMAIL_CONFIG;
    try {
      const emailConfigFile = path.join(process.cwd(), "data", "subscriber_email_config.json");
      if (fs.existsSync(emailConfigFile)) {
        const parsed = JSON.parse(fs.readFileSync(emailConfigFile, "utf-8"));
        if (parsed && typeof parsed === "object") {
          activeEmailConfig = {
            ...DEFAULT_SUBSCRIBER_EMAIL_CONFIG,
            ...parsed
          };
        }
      }
    } catch (e) {}

    let clientAttachments = registrationData.emailConfig && registrationData.emailConfig.attachments;
    if (Array.isArray(clientAttachments) && clientAttachments.length > 0) {
      if (clientAttachments.some((a: any) => a && a.url && a.url.includes("unsplash"))) {
        clientAttachments = null;
      }
    }

    const mergedEmailConfig = {
      ...activeEmailConfig,
      ...(registrationData.emailConfig || {}),
      messages: {
        ...activeEmailConfig.messages,
        ...((registrationData.emailConfig && registrationData.emailConfig.messages) || {})
      },
      dataFields: (registrationData.emailConfig && Array.isArray(registrationData.emailConfig.dataFields) && registrationData.emailConfig.dataFields.length > 0)
        ? registrationData.emailConfig.dataFields
        : activeEmailConfig.dataFields,
      attachments: (clientAttachments && clientAttachments.length > 0)
        ? clientAttachments
        : activeEmailConfig.attachments,
      driveFolderId: targetFolderId,
      qrDriveUrlColumn: "O",
      deliveryStatusColumn: "P",
      emailColumn: "G"
    };

    const mergedTelegramConfig = {
      ...DEFAULT_TELEGRAM_CONFIG,
      ...(registrationData.telegramConfig || {}),
      botToken: (registrationData.telegramConfig && registrationData.telegramConfig.botToken) || DEFAULT_TELEGRAM_CONFIG.botToken,
      chatId: (registrationData.telegramConfig && registrationData.telegramConfig.chatId) || DEFAULT_TELEGRAM_CONFIG.chatId,
      enabled: registrationData.telegramConfig ? registrationData.telegramConfig.enabled !== false : DEFAULT_TELEGRAM_CONFIG.enabled
    };

    const payload = {
      ...registrationData,
      answers: filteredAnswers,
      registrationId,
      timestamp: formattedTimestamp,
      emailConfig: mergedEmailConfig,
      telegramConfig: mergedTelegramConfig
    };

    // 2. Dispatch Telegram notification directly from Vercel function
    sendTelegramAlert(mergedTelegramConfig, payload).catch((telErr) => {
      console.warn("[Vercel /api/register] Direct Telegram alert error:", telErr.message);
    });

    // 3. Forward to Google Apps Script
    let gasResult: any = null;
    if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
      try {
        const gasPayload = JSON.stringify({
          action: "submitRegistration",
          ...payload
        });

        const gasRes = await fetch(targetScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: gasPayload
        });
        gasResult = await gasRes.json().catch(() => null);
        console.log("[Vercel /api/register] GAS response:", gasResult);
      } catch (gasErr: any) {
        console.warn("[Vercel /api/register] Could not forward to Google Apps Script:", gasErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      registrationId,
      timestamp: formattedTimestamp,
      gasResult,
      message: `تم استلام وحفظ طلب التسجيل بنجاح بالرقم المرجعي (${registrationId}) في جدول البيانات!`
    });
  } catch (error: any) {
    console.error("[Vercel /api/register] Error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء معالجة طلب التسجيل: " + error.message });
  }
}
