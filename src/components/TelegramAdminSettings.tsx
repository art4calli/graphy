import { useState, useEffect } from "react";
import {
  Send,
  Bot,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  QrCode,
  Paperclip,
  Check,
  Info,
  HelpCircle,
  Hash,
  Plus,
  Trash2,
  Link,
  FileSpreadsheet,
  Image as ImageIcon
} from "lucide-react";
import { TelegramConfig, TelegramCustomButton } from "../types";
import {
  executeAppsScriptPost,
  fetchTelegramConfigBridge,
  saveTelegramConfigBridge,
  DEFAULT_SCRIPT_URL,
  DEFAULT_SPREADSHEET_ID
} from "../utils/googleBackendBridge";

interface TelegramAdminSettingsProps {
  currentSpreadsheetId?: string;
  currentScriptUrl?: string;
}

const DEFAULT_CONFIG: TelegramConfig = {
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

export default function TelegramAdminSettings({
  currentSpreadsheetId = "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY",
  currentScriptUrl = ""
}: TelegramAdminSettingsProps) {
  const [config, setConfig] = useState<TelegramConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // UI state
  const [showToken, setShowToken] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const cloudConfig = await fetchTelegramConfigBridge(currentSpreadsheetId, currentScriptUrl);
      if (cloudConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...cloudConfig });
      }
    } catch (e) {
      console.warn("Error fetching telegram config:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    setTestResult(null);

    try {
      const activeScriptUrl = currentScriptUrl || (typeof window !== "undefined" ? (localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url") || "") : "") || DEFAULT_SCRIPT_URL;
      await saveTelegramConfigBridge(config, activeScriptUrl, currentSpreadsheetId);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e: any) {
      setSaveError(e.message || "تعذر الاتصال بالخادم");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!config.botToken.trim() || !config.chatId.trim()) {
      setTestResult({
        success: false,
        message: "يرجى إدخال رمز توكن البوت (Bot Token) ومعرف الدردشة (Chat ID) أولاً قبل الاختبار."
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const activeScriptUrl = currentScriptUrl || (typeof window !== "undefined" ? (localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url") || "") : "") || DEFAULT_SCRIPT_URL;
      
      let isSuccess = false;
      let message = "";

      // 1. Try local server
      try {
        const res = await fetch("/api/test-telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config,
            scriptUrl: activeScriptUrl,
            spreadsheetId: currentSpreadsheetId || DEFAULT_SPREADSHEET_ID
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            isSuccess = true;
            message = data.message;
          }
        }
      } catch (e) {}

      // 2. Direct Apps Script bridge
      if (!isSuccess) {
        const bridgeRes = await executeAppsScriptPost("testTelegram", {
          config,
          spreadsheetId: currentSpreadsheetId || DEFAULT_SPREADSHEET_ID
        }, activeScriptUrl);
        if (bridgeRes.success) {
          isSuccess = true;
          message = bridgeRes.data?.message;
        }
      }

      // 3. Direct Telegram Bot API fallback if direct calling is allowed
      if (!isSuccess) {
        try {
          const telegramApiUrl = `https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`;
          const testText = `🏛️ *اختبار إشعار تلغرام - مؤسسة يوسف ذنون*\n\n✅ تم التحقق من اتصال بوت الإدارة بنجاح!\n📅 الوقت: ${new Date().toLocaleString("ar-IQ")}\n⚡ النظام جاهز لاستقبال إشعارات التسجيل الفورية.`;
          
          const tgRes = await fetch(telegramApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: config.chatId.trim(),
              message_thread_id: config.topicId ? Number(config.topicId) : undefined,
              text: testText,
              parse_mode: "Markdown"
            })
          });
          const tgData = await tgRes.json();
          if (tgData && tgData.ok) {
            isSuccess = true;
            message = "تم إرسال رسالة الاختبار إلى تلغرام مباشرة بنجاح!";
          }
        } catch (tgErr) {}
      }

      if (isSuccess) {
        setTestResult({
          success: true,
          message: message || "تم إرسال رسالة الاختبار إلى تلغرام بنجاح! تفقد تطبيق تلغرام الآن."
        });
      } else {
        setTestResult({
          success: false,
          message: "فشل إرسال الإشعار لتلغرام. يرجى التأكد من صلاحية البوت وصحة المعرفات."
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: "حدث خطأ في الاتصال أثناء إرسال رسالة الاختبار: " + e.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
        <p className="text-sm font-sans">جاري تحميل إعدادات إشعارات تلغرام...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-950 border border-sky-500/30 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-sky-300">إشعارات تلغرام الفورية للإدارة</h3>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border bg-sky-500/10 text-sky-300 border-sky-500/30">
                  Telegram Bot API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                استقبال إشعارات فورية على هاتفك أو في مجموعة الإدارة فور قيام أي مشترك بإرسال استمارة التسجيل.
              </p>
            </div>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 px-4 rounded-xl border border-slate-800 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-300 font-sans">
              {config.enabled ? "الإشعارات مفعلة" : "الإشعارات متوقفة"}
            </span>
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.enabled ? "bg-sky-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? "-translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Guide & Bot Setup Helper Button */}
      <div className="flex items-center justify-between bg-slate-900/80 p-3.5 px-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>كيفية إنشاء بوت تلغرام والحصول على الـ Token و Chat ID بسهولة</span>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition-colors"
        >
          <span>{showHelp ? "إخفاء الدليل" : "عرض خطوات الإعداد"}</span>
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expandable Setup Instructions */}
      {showHelp && (
        <div className="p-5 bg-sky-950/20 border border-sky-500/20 rounded-xl space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <h4 className="font-bold text-sky-300 flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            خطوات ربط بوت تلغرام خلال دقيقتين:
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 pr-1">
            <li>
              افتح تطبيق تلغرام وابحث عن البوت الرسمي: <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-400 font-bold underline">@BotFather</a>
            </li>
            <li>
              أرسل له الأمر <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-300 border border-slate-800">/newbot</code> ثم اختر اسماً للبوت واسم مستخدم (ينتهي بـ <code className="text-amber-400">bot</code>).
            </li>
            <li>
              سيعطيك BotFather رمز الـ <b className="text-sky-300">Bot Token</b> (مثال: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">123456789:ABCdefGhI...</code>) - انسخه وضعه في حقل التوكن أدناه.
            </li>
            <li>
              <b>للحصول على Chat ID:</b>
              <ul className="list-disc list-inside pr-4 mt-1 space-y-1 text-slate-400">
                <li>إذا كنت تريد استلام الرسائل في محادثتك الخاصة: افتح البوت واضغط <b className="text-sky-300">Start</b>، ثم ابحث عن بوت <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-400 underline">@userinfobot</a> واضغط Start لمعرفة الـ Id الخاص بك (رقم موجب مثل <code className="text-amber-300">987654321</code>).</li>
                <li>إذا كنت تريد الإشعارات في <b>مجموعة للإدارة</b>: أضف بوتك إلى المجموعة وقم بترقيته لمشرف (Admin)، ثم احصل على معرف المجموعة (يبدأ بـ <code className="text-amber-300">-100</code>).</li>
              </ul>
            </li>
          </ol>
        </div>
      )}

      {/* Grid: Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Form Fields (Left on Desktop, Right in RTL) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Card 1: Connection Credentials */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-md">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Bot className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-bold text-slate-200">بيانات الاتصال بالبوت (Credentials)</h4>
            </div>

            {/* Bot Token Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                رمز توكن البوت (Telegram Bot Token) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={config.botToken}
                  onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                  placeholder="مثال: 123456789:AAHk1_xyzABC..."
                  dir="ltr"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showToken ? "إخفاء التوكن" : "إظهار التوكن"}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">الرمز الذي حصلت عليه من @BotFather.</p>
            </div>

            {/* Chat ID Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                معرف الدردشة أو المجموعة (Chat ID / Group ID) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={config.chatId}
                onChange={(e) => setConfig({ ...config, chatId: e.target.value.trim() })}
                placeholder="مثال: 987654321 أو -1001234567890 للمجموعات"
                dir="ltr"
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400">معرف حسابك الشخصي أو معرف مجموعة إدارة المشتركين.</p>
            </div>

            {/* Topic / Thread ID (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>معرف الموضوع / القسم (Topic / Thread ID)</span>
                <span className="text-[10px] text-slate-400 font-normal">اختياري (للمجموعات ذات المواضيع)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.topicId || ""}
                  onChange={(e) => setConfig({ ...config, topicId: e.target.value.trim() })}
                  placeholder="مثال: 42 (فقط إذا كانت المجموعة مقسمة لمواضيع)"
                  dir="ltr"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
                <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Card 2: Message Content Customization */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-md">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-200">تخصيص محتوى رسالة الإشعار</h4>
            </div>

            {/* Notification Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                عنوان الرسالة والإشعار
              </label>
              <input
                type="text"
                value={config.notificationTitle}
                onChange={(e) => setConfig({ ...config, notificationTitle: e.target.value })}
                placeholder="🔔 إشعار تسجيل جديد - مؤسسة يوسف ذنون"
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Content Toggles */}
            <div className="space-y-3 pt-2">
              
              {/* Include All Answers */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">تضمين جميع إجابات وحقول الاستمارة</span>
                    <span className="text-[10px] text-slate-400">عرض كافة الأسئلة والإجابات المدخلة من قبل المشترك بالتفصيل</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeAllAnswers}
                  onChange={(e) => setConfig({ ...config, includeAllAnswers: e.target.checked })}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </label>

              {/* Include QR Code */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">إرسال صورة كيو آر كود التسجيل (QR Code)</span>
                    <span className="text-[10px] text-slate-400">إرسال صورة الـ QR Code مباشرة كصورة الرسالة الأساسية في تلغرام</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeQrCode}
                  onChange={(e) => setConfig({ ...config, includeQrCode: e.target.checked })}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </label>

              {/* Include Attachment */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">إرفاق رابط أو ملف المرفق المرفوع</span>
                    <span className="text-[10px] text-slate-400">إدراج رابط الصورة أو الملف الذي رفعه المشترك إلى Google Drive</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeAttachment}
                  onChange={(e) => setConfig({ ...config, includeAttachment: e.target.checked })}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </label>

              {/* Custom Buttons / Links Section */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Link className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">أزرار وروابط تفاعلية مخصصة</span>
                      <span className="text-[10px] text-slate-400">أضف أزرار وروابط إضافية تظهر أسفل إشعار التلغرام</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newBtn: TelegramCustomButton = {
                        id: "btn_" + Date.now(),
                        text: "رابط جديد",
                        url: "https://"
                      };
                      setConfig({
                        ...config,
                        customButtons: [...(config.customButtons || []), newBtn]
                      });
                    }}
                    className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة زر آخر</span>
                  </button>
                </div>

                {(!config.customButtons || config.customButtons.length === 0) ? (
                  <div className="text-center py-3 px-2 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
                    <p className="text-[11px] text-slate-400">لا توجد أزرار مخصصة بعد. اضغط "إضافة زر آخر" لإنشاء زر مخصص في تلغرام.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {config.customButtons.map((btn, index) => (
                      <div
                        key={btn.id || index}
                        className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-center gap-2"
                      >
                        <div className="w-full sm:w-1/3">
                          <label className="text-[10px] text-slate-400 block mb-0.5">نص الزر</label>
                          <input
                            type="text"
                            value={btn.text}
                            onChange={(e) => {
                              const updated = [...(config.customButtons || [])];
                              updated[index] = { ...updated[index], text: e.target.value };
                              setConfig({ ...config, customButtons: updated });
                            }}
                            placeholder="مثلاً: الموقع الرسمي"
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="w-full sm:w-2/3 flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 block mb-0.5">الرابط (URL)</label>
                            <input
                              type="url"
                              value={btn.url}
                              onChange={(e) => {
                                const updated = [...(config.customButtons || [])];
                                updated[index] = { ...updated[index], url: e.target.value };
                                setConfig({ ...config, customButtons: updated });
                              }}
                              placeholder="https://example.com"
                              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 font-mono text-left focus:outline-none focus:border-indigo-500"
                              dir="ltr"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (config.customButtons || []).filter((_, i) => i !== index);
                              setConfig({ ...config, customButtons: updated });
                            }}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-900 transition-colors"
                            title="حذف هذا الزر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Live Telegram Preview (Right on Desktop, Left in RTL) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              معاينة حية لرسالة التلغرام
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Telegram Dark UI</span>
          </div>

          {/* Telegram Mock Frame */}
          <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-4 shadow-2xl space-y-3 font-sans text-xs">
            
            {/* Telegram Bubble */}
            <div className="bg-[#1e2c3a] border border-[#2b3a4a] rounded-xl overflow-hidden text-slate-200">
              
              {/* Photo Preview banner at top */}
              {config.includeAttachment ? (
                <div className="relative w-full h-36 bg-slate-900 border-b border-[#2b3a4a] flex flex-col items-center justify-center text-slate-400 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80"
                    alt="Sample Drive Attachment"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e2c3a] via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 right-2.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded text-[10px] text-amber-300 font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span>صورة المرفق المرفوعة من المشترك</span>
                  </div>
                </div>
              ) : config.includeQrCode ? (
                <div className="relative w-full py-4 bg-slate-950 border-b border-[#2b3a4a] flex flex-col items-center justify-center text-slate-400 overflow-hidden">
                  <div className="p-2 bg-white rounded-xl shadow-lg">
                    <img
                      src="https://quickchart.io/qr?text=REG-20268482%20-%20%D9%85%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%84%D9%87%20%D8%A7%D9%84%D9%86%D8%B9%D9%8A%D9%85%D9%8A&size=140&margin=1"
                      alt="Telegram QR Photo"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <div className="mt-2 px-2.5 py-0.5 bg-slate-900/90 border border-amber-500/30 rounded text-[10px] text-amber-300 font-medium flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-amber-400" />
                    <span>صورة رمز QR المشترك المباشرة في التلغرام</span>
                  </div>
                </div>
              ) : null}

              <div className="p-3.5 space-y-2.5">
                {/* Title & Brand */}
                <div className="border-b border-[#2b3a4a] pb-2">
                  <div className="text-sky-400 font-bold text-[13px]">{config.notificationTitle || "🔔 إشعار تسجيل جديد"}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{config.customHeader || "🏛️ مؤسسة يوسف ذنون للخط العربي"}</div>
                </div>

                {/* Key Details */}
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <div>👤 <b className="text-slate-100">الاسم:</b> محمد عبد الله النعيمي</div>
                  <div>🆔 <b className="text-slate-100">رقم التسجيل:</b> <code className="text-amber-300 bg-slate-900/60 px-1 py-0.5 rounded font-mono">REG-20268482</code></div>
                  <div>📱 <b className="text-slate-100">الهاتف:</b> <span dir="ltr" className="text-slate-300 font-mono">+964 770 123 4567</span></div>
                  <div>📧 <b className="text-slate-100">البريد:</b> <span className="text-sky-300">subscriber@example.com</span></div>
                  <div>⏰ <b className="text-slate-100">التاريخ:</b> 2026/08/26 - 10:30 ص</div>
                </div>

                {/* Answers preview if enabled */}
                {config.includeAllAnswers && (
                  <div className="pt-2 border-t border-[#2b3a4a] space-y-1 text-[11px]">
                    <div className="font-bold text-amber-400 mb-1">📋 تفاصيل الاستمارة:</div>
                    <div className="text-slate-300">▫️ <span className="text-slate-400">الدورة المطلوبة:</span> دلالات الخط الكوفي والثلث</div>
                    <div className="text-slate-300">▫️ <span className="text-slate-400">المستوى:</span> متوسط / متقدم</div>
                    <div className="text-slate-300">▫️ <span className="text-slate-400">المدينة / الدولة:</span> الموصل، العراق</div>
                    <div className="text-slate-300">▫️ <span className="text-slate-400">المرفق:</span> <i className="text-amber-300">[تم الحفظ في Drive]</i></div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-[10px] text-slate-400 pt-1 text-left" dir="ltr">
                  {config.customFooter || "⚡ نظام المتابعة الفورية للإدارة"} • 10:30 AM
                </div>
              </div>
            </div>

            {/* Telegram Inline Action Buttons Mock */}
            <div className="space-y-1.5">
              {/* QR Code Action Button (Shown when uploaded photo is the main photo) */}
              {config.includeAttachment && config.includeQrCode && (
                <a
                  href="https://quickchart.io/qr?text=REG-20268482&size=300"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 bg-[#242f3d] hover:bg-[#2b3a4a] border border-amber-500/40 rounded-lg text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>🔳 عرض وتنزيل رمز QR Code ↗</span>
                </a>
              )}

              {/* Custom configured buttons */}
              {config.customButtons && config.customButtons.map((cBtn, idx) => (
                <a
                  key={cBtn.id || idx}
                  href={cBtn.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 bg-[#242f3d] hover:bg-[#2b3a4a] border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Link className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{cBtn.text || "رابط مخصص"} ↗</span>
                </a>
              ))}
            </div>

          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-sans leading-relaxed flex items-start gap-2.5 ${
                testResult.success
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{testResult.success ? "نجح الاختبار:" : "فشل الاختبار:"}</p>
                <p className="mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Save Status Banner */}
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم حفظ وتفعيل إعدادات إشعارات تلغرام بنجاح!</span>
            </div>
          )}
          {saveError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

        </div>

      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
        
        {/* Test Button */}
        <button
          type="button"
          onClick={handleTestNotification}
          disabled={isTesting || !config.botToken || !config.chatId}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            isTesting || !config.botToken || !config.chatId
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 hover:border-sky-500 shadow-lg shadow-sky-950/50"
          }`}
        >
          {isTesting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري إرسال الإشعار التجريبي...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>إرسال إشعار تجريبي لتلغرام ⚡</span>
            </>
          )}
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            isSaving
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95"
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري الحفظ والمزامنة...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>حفظ وتفعيل إعدادات تلغرام</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
