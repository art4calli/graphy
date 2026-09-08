import { DEFAULT_TELEGRAM_CONFIG } from "../src/data/defaultConfigs";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const activeConfig = {
    ...DEFAULT_TELEGRAM_CONFIG,
    enabled: process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== "false" && DEFAULT_TELEGRAM_CONFIG.enabled,
    botToken: process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_CONFIG.botToken,
    chatId: process.env.TELEGRAM_CHAT_ID || DEFAULT_TELEGRAM_CONFIG.chatId
  };

  return res.status(200).json({
    success: true,
    config: activeConfig
  });
}
