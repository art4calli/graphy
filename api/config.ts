const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwdupPOk2KJr9MzfZM_JTA8GCbQFx8mlFH6cCxn0JLcH6J8g_yfrKmMTt08zZpLEcZ/exec";
const DEFAULT_SPREADSHEET_ID = "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";
const DEFAULT_DRIVE_FOLDER_ID = "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID,
    scriptUrl: process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL,
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_DRIVE_FOLDER_ID
  });
}
