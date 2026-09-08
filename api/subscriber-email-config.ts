import fs from "fs";
import path from "path";
import { DEFAULT_SUBSCRIBER_EMAIL_CONFIG } from "../src/data/defaultConfigs";

const SUBSCRIBER_EMAIL_CONFIG_FILE = path.join(process.cwd(), "data", "subscriber_email_config.json");

function loadConfig() {
  try {
    if (fs.existsSync(SUBSCRIBER_EMAIL_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUBSCRIBER_EMAIL_CONFIG_FILE, "utf-8"));
      if (data && typeof data === "object") {
        return {
          ...DEFAULT_SUBSCRIBER_EMAIL_CONFIG,
          ...data,
          attachments: (Array.isArray(data.attachments) && data.attachments.length > 0)
            ? data.attachments
            : DEFAULT_SUBSCRIBER_EMAIL_CONFIG.attachments
        };
      }
    }
  } catch (e) {
    console.warn("Could not read subscriber_email_config.json:", e);
  }
  return DEFAULT_SUBSCRIBER_EMAIL_CONFIG;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const { config, scriptUrl } = req.body || {};
      if (!config) {
        return res.status(400).json({ success: false, message: "بيانات الإعدادات مفقودة" });
      }

      // 1. Try to save locally if filesystem writable
      try {
        const dir = path.dirname(SUBSCRIBER_EMAIL_CONFIG_FILE);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SUBSCRIBER_EMAIL_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
      } catch (saveErr) {
        console.warn("Vercel readonly filesystem note for subscriber_email_config:", saveErr);
      }

      // 2. Sync to Google Apps Script
      const targetScriptUrl = scriptUrl || process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbza2PFARh0xlhXbxvsMQo0cije7GbPKsSuDlOB17bTEPkH9IUWWWzxBh7JEKjag-y80Ww/exec";
      if (targetScriptUrl && targetScriptUrl.startsWith("http")) {
        try {
          await fetch(targetScriptUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "saveSubscriberEmailConfig",
              config
            })
          });
        } catch (gasErr: any) {
          console.warn("Could not sync email config to Apps Script:", gasErr.message);
        }
      }

      return res.status(200).json({ success: true, message: "تم حفظ إعدادات إيميل المشترك بنجاح" });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || "حدث خطأ أثناء الحفظ" });
    }
  }

  const activeConfig = loadConfig();
  return res.status(200).json({
    success: true,
    config: activeConfig
  });
}
