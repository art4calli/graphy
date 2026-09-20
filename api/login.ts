import { DEFAULT_SCRIPT_URL, DEFAULT_SPREADSHEET_ID } from "../src/utils/googleBackendBridge";

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
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const { username, password, deviceId, lat, lng, locationName, deviceInfo, scriptUrl } = body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "الرجاء إدخال اسم المستخدم وكلمة المرور" });
    }

    const activeScriptUrl = (scriptUrl && scriptUrl.trim().startsWith("http")) 
      ? scriptUrl.trim() 
      : (process.env.VITE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL);

    // Format rich location text
    let fullLocation = locationName || "";
    if (lat && lng) {
      if (fullLocation) fullLocation += " | ";
      fullLocation += `إحداثيات: ${lat}, ${lng}`;
    }
    if (!fullLocation) {
      fullLocation = "متصفح الويب";
    }

    console.log(`[Vercel /api/login] Authenticating user: "${username}" with device: "${deviceId}" at location: "${fullLocation}"`);

    // 1. Try Google Apps Script POST/GET to ensure device & location are recorded in Google Sheets
    if (activeScriptUrl && activeScriptUrl.startsWith("http")) {
      let responseText = "";
      try {
        const gasPostRes = await fetch(activeScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "loginUser",
            username,
            password,
            deviceId: deviceId || "",
            lat: lat || "",
            lng: lng || "",
            locationName: fullLocation,
            deviceInfo: deviceInfo || ""
          })
        });
        responseText = await gasPostRes.text();
      } catch (postErr: any) {
        console.warn("[Vercel /api/login] GAS POST error, falling back to GET:", postErr.message);
      }

      // If POST was HTML/empty, try GET request
      if (!responseText || responseText.trim().startsWith("<")) {
        try {
          const getParams = new URLSearchParams({
            action: "loginUser",
            username: String(username || ""),
            password: String(password || ""),
            deviceId: String(deviceId || ""),
            lat: lat ? String(lat) : "",
            lng: lng ? String(lng) : "",
            locationName: fullLocation,
            deviceInfo: String(deviceInfo || ""),
            _cb: String(Date.now())
          });
          const gasGetUrl = `${activeScriptUrl}${activeScriptUrl.includes("?") ? "&" : "?"}${getParams.toString()}`;
          const gasGetRes = await fetch(gasGetUrl);
          responseText = await gasGetRes.text();
        } catch (getErr: any) {
          console.warn("[Vercel /api/login] GAS GET error:", getErr.message);
        }
      }

      if (responseText && !responseText.trim().startsWith("<")) {
        try {
          const gasData = JSON.parse(responseText);
          if (gasData) {
            console.log("[Vercel /api/login] Apps Script response:", gasData.success, gasData.message || "");
            return res.status(200).json(gasData);
          }
        } catch (parseErr) {
          console.warn("[Vercel /api/login] Could not parse Apps Script response as JSON:", responseText.slice(0, 100));
        }
      }
    }

    // 2. Direct Google Sheets GVIZ fallback if Apps Script was unavailable
    console.log("[Vercel /api/login] Falling back to GVIZ verification...");
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=Settings&_cb=${Date.now()}`;
    const gvizRes = await fetch(gvizUrl);
    if (!gvizRes.ok) {
      return res.status(500).json({ success: false, message: "فشل التحقق من قاعدة البيانات" });
    }

    const gvizText = await gvizRes.text();
    const jsonStart = gvizText.indexOf("{");
    const jsonEnd = gvizText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(500).json({ success: false, message: "خطأ في قراءة بيانات المشتركين" });
    }

    const sheetJson = JSON.parse(gvizText.substring(jsonStart, jsonEnd + 1));
    const rows = sheetJson.table?.rows || [];

    function normalizeText(val: any): string {
      if (!val) return "";
      let s = val.toString().trim().toLowerCase();
      s = s.replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, "");
      s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
      s = s.replace(/[إأآٱ]/g, "ا").replace(/[ة]/g, "ه").replace(/[يى]/g, "ي");
      const ar = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
      for (let i = 0; i <= 9; i++) s = s.split(ar[i]).join(String(i));
      return s.trim();
    }

    const normTargetUser = normalizeText(username);
    const normTargetPass = normalizeText(password);

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const r = rows[rIdx]?.c || [];
      const getVal = (idx: number) => {
        if (!r[idx] || r[idx].v === null || r[idx].v === undefined) return "";
        return r[idx].f !== undefined ? r[idx].f.toString().trim() : r[idx].v.toString().trim();
      };

      const topicId = getVal(0) || "1";
      const nameB = getVal(1);
      const nameZ = getVal(25);
      const regId = getVal(26);
      const status = getVal(27) || "مسموح";
      const devCount = getVal(28) || "1";

      const normZ = normalizeText(nameZ);
      const normB = normalizeText(nameB);
      const normAA = normalizeText(regId);

      const userMatches = (normZ && (normZ === normTargetUser || normZ.includes(normTargetUser) || normTargetUser.includes(normZ))) ||
                          (normB && (normB === normTargetUser || normB.includes(normTargetUser) || normTargetUser.includes(normB))) ||
                          (normAA && (normAA === normTargetUser || normTargetUser.includes(normAA)));

      const passMatches = (normAA && (normAA === normTargetPass || normAA.includes(normTargetPass) || normTargetPass.includes(normAA))) ||
                          (regId && password && regId === password.toString().trim());

      if (userMatches && passMatches) {
        if (status === "ممنوع" || status === "معطل" || status === "محظور") {
          return res.status(200).json({
            success: false,
            isBlocked: true,
            message: "تم إيقاف أو تعليق هذا الحساب من قبل الإدارة"
          });
        }

        const maxDevices = parseInt(devCount, 10) || 1;
        const cleanDev = (deviceId || "").toString().trim();
        let isKnownDevice = false;
        let registeredCount = 0;

        for (let d = 0; d < maxDevices; d++) {
          const devIdx = 30 + (d * 2);
          const devVal = getVal(devIdx);
          if (devVal) {
            registeredCount++;
            if (cleanDev && devVal.toLowerCase().includes(cleanDev.toLowerCase())) {
              isKnownDevice = true;
              break;
            }
          }
        }

        if (!isKnownDevice && registeredCount >= maxDevices) {
          return res.status(200).json({
            success: false,
            deviceLimitReached: true,
            message: `لقد استنفدت الحد الأقصى المسموح به من الأجهزة (${maxDevices} جهاز). يرجى التواصل مع الإدارة لإعادة التعيين.`
          });
        }

        // Fire-and-retry background update to Apps Script
        if (activeScriptUrl && activeScriptUrl.startsWith("http")) {
          const syncUrl = `${activeScriptUrl}${activeScriptUrl.includes("?") ? "&" : "?"}action=loginUser&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&deviceId=${encodeURIComponent(deviceId || "")}&locationName=${encodeURIComponent(fullLocation)}&deviceInfo=${encodeURIComponent(deviceInfo || "")}&_cb=${Date.now()}`;
          fetch(syncUrl).catch(() => {});
        }

        return res.status(200).json({
          success: true,
          topicId,
          subscriberName: nameB || nameZ || username,
          username: nameZ || nameB || username,
          registrationId: regId || password,
          message: "تم تسجيل الدخول بنجاح"
        });
      }
    }

    return res.status(200).json({
      success: false,
      message: "اسم المشترك أو رقم القيد غير موجود، يرجى التأكد من صحة البيانات"
    });
  } catch (error: any) {
    console.error("[Vercel /api/login] Error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ غير متوقع أثناء تسجيل الدخول: " + error.message });
  }
}
