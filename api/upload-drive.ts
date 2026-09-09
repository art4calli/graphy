const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwdupPOk2KJr9MzfZM_JTA8GCbQFx8mlFH6cCxn0JLcH6J8g_yfrKmMTt08zZpLEcZ/exec";
const DEFAULT_DRIVE_FOLDER_ID = "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

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
    body = body || {};

    const { base64Data, fileName, mimeType, folderId, scriptUrl } = body;
    const targetScriptUrl = scriptUrl || process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
    const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_DRIVE_FOLDER_ID;

    if (!base64Data) {
      return res.status(400).json({ success: false, message: "Missing base64Data" });
    }

    const cleanBase64 = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
    const cleanMime = mimeType || (base64Data.match(/data:([^;]+);/) || [])[1] || "image/jpeg";

    const gasRes = await fetch(targetScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "uploadFile",
        base64Data: cleanBase64,
        fileName: fileName || `upload_${Date.now()}.jpg`,
        mimeType: cleanMime,
        folderId: targetFolderId
      })
    });

    const gasData = await gasRes.json().catch(() => null);
    if (gasData && (gasData.fileUrl || gasData.downloadUrl)) {
      return res.status(200).json({
        success: true,
        fileUrl: gasData.fileUrl || gasData.downloadUrl,
        downloadUrl: gasData.downloadUrl || gasData.fileUrl,
        fileName: gasData.fileName || fileName
      });
    }

    return res.status(200).json(gasData || { success: false, message: "Failed to upload file to Google Drive" });
  } catch (error: any) {
    console.error("[Vercel /api/upload-drive] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
