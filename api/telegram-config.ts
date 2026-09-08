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
    enabled: process.env.TELEGRAM_NOTIFICATIONS_ENABLED === "true",
    botToken: process.env.TELEGRAM_BOT_TOKEN ? "configured" : "",
    chatId: process.env.TELEGRAM_CHAT_ID ? "configured" : ""
  });
}
