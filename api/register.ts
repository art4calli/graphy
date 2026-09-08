const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxc-9cJ1Yh16hWRVAIGwZJCxQc4H8goaLUeB_4EuWtJi7tb6qhveCqbfTGkd3gQqHC7CQ/exec";
const DEFAULT_SPREADSHEET_ID = "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";
const DEFAULT_DRIVE_FOLDER_ID = "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

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

      // Answers items
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

    const payload = {
      ...registrationData,
      answers: filteredAnswers,
      registrationId,
      timestamp: formattedTimestamp
    };

    // 2. Forward to Google Apps Script
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
