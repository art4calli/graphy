import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Lock,
  X,
  LogIn,
  AlertTriangle,
  QrCode,
  Camera,
  Sparkles,
  Share2,
  Check,
  UserPlus,
  ExternalLink
} from "lucide-react";
import { SubscriberState } from "../types";
import { useLanguage } from "../context/LanguageContext";
import QrCodeScannerModal, { QrScanResult } from "./QrCodeScannerModal";

interface SubscriberPortalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: SubscriberState;
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onLogout: () => void;
  onOpenRegistration?: () => void;
}

export default function SubscriberPortal({
  isOpen,
  onClose,
  subscriber,
  onLogin,
  onOpenRegistration
}: SubscriberPortalProps) {
  const { t, dir, currentLang, setLanguage } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPortalLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("portal", "true");
      url.searchParams.set("lang", currentLang);
      url.hash = "portal";
      navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn("Clipboard error:", e);
    }
  };

  const performLogin = async (u: string, p: string) => {
    if (!u || !p) {
      setError(t("subscriber_login_missing_fields", "الرجاء إدخال اسم المستخدم وكلمة المرور"));
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const response = await onLogin(u, p);
      if (response.success) {
        setUsername("");
        setPassword("");
        onClose();
      } else {
        setIsLoading(false);
        setError(response.message || t("subscriber_login_error_credentials", "اسم المستخدم أو كلمة المرور غير صحيحة"));
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(t("subscriber_login_error_general", "حدث خطأ أثناء محاولة الدخول والتحقق"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    performLogin(username, password);
  };

  const handleQrScanSuccess = (result: QrScanResult) => {
    const userToUse = result.username || result.registrationId || result.raw;
    const passToUse = result.password || result.registrationId || result.raw;
    setUsername(userToUse);
    setPassword(passToUse);

    // Auto trigger login with scanned data
    performLogin(userToUse, passToUse);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !subscriber.isLoggedIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={dir}>
            {/* Background Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className={`relative w-full max-w-md bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden ${
                dir === "rtl" ? "text-right" : "text-left"
              }`}
            >
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>

              {/* Top Controls: Share & Close */}
              <div className={`absolute top-4 ${dir === "rtl" ? "left-4" : "right-4"} flex items-center gap-1.5 z-20`}>
                <button
                  type="button"
                  onClick={handleCopyPortalLink}
                  title="نسخ رابط بوابة المشتركين المباشر لنشره"
                  className="p-1.5 bg-slate-800/60 hover:bg-amber-500 hover:text-slate-950 text-amber-400 rounded-full transition-all cursor-pointer flex items-center gap-1"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 bg-slate-800/60 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title Header */}
              <div className="text-center mt-2 mb-4">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-amber-400">
                  {t("subscriber_login_title", "تسجيل دخول بوابة المشتركين")}
                </h3>
                <p className="text-slate-400 font-sans text-xs mt-1 leading-relaxed">
                  {t("subscriber_login_subtitle", "أدخل رقم التسجيل الخاص بك أو امسح رمز الاستجابة السريعة (QR Code) للوصول المباشر إلى موادك الخاصة")}
                </p>

                {/* Multilingual Selector Pills for Portal */}
                <div className="mt-3 flex items-center justify-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl w-fit mx-auto shadow-inner">
                  <button
                    type="button"
                    onClick={() => setLanguage("ar")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                      currentLang === "ar"
                        ? "bg-amber-500 text-slate-950 shadow-md font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-sm">🇸🇦</span>
                    <span>العربية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                      currentLang === "en"
                        ? "bg-amber-500 text-slate-950 shadow-md font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-sm">🇬🇧</span>
                    <span>English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("th")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                      currentLang === "th"
                        ? "bg-amber-500 text-slate-950 shadow-md font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-sm">🇹🇭</span>
                    <span>ภาษาไทย</span>
                  </button>
                </div>
              </div>

              {/* QR Scanner Quick Action Button */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 hover:border-amber-400 rounded-2xl text-amber-300 font-sans font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer group"
                >
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className={dir === "rtl" ? "text-right" : "text-left"}>
                    <span className="block text-amber-300 font-bold">
                      {t("subscriber_scan_qr_btn", "مسح رمز QR بالكاميرا")}
                    </span>
                    <span className="block text-slate-400 text-[10px] font-normal">
                      {t("subscriber_scan_qr_desc", "تسجيل دخول فوري وسريع عبر بطاقة المشترك أو الإيميل")}
                    </span>
                  </div>
                  <QrCode className={`w-4.5 h-4.5 text-amber-400 ${dir === "rtl" ? "mr-auto" : "ml-auto"} opacity-75 shrink-0`} />
                </button>
                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-slate-500 text-[11px] font-sans">
                    {t("subscriber_or_manual_login", "أو الدخول اليدوي بالاسم وكلمة المرور")}
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>
              </div>

              {/* Form elements */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans font-semibold text-slate-400">
                    {t("subscriber_username_label", "اسم المستخدم للخطاط / المشترك")}
                  </label>
                  <div className="relative">
                    <User className={`absolute ${dir === "rtl" ? "right-3.5" : "left-3.5"} top-3.5 w-4.5 h-4.5 text-amber-500/80`} />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t("subscriber_id_placeholder", "أدخل رقم التسجيل (مثال: YD-10203)")}
                      className={`w-full bg-slate-950 border border-slate-800 focus:border-amber-500/55 rounded-xl ${
                        dir === "rtl" ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                      } py-3 text-sm text-slate-100 outline-none transition-colors font-sans`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans font-semibold text-slate-400">
                    {t("subscriber_password_label", "كلمة المرور أو رقم التسجيل الخاص بك")}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${dir === "rtl" ? "right-3.5" : "left-3.5"} top-3.5 w-4.5 h-4.5 text-amber-500/80`} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("subscriber_password_placeholder", "أدخل كلمة السر الخاصة بك")}
                      className={`w-full bg-slate-950 border border-slate-800 focus:border-amber-500/55 rounded-xl ${
                        dir === "rtl" ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                      } py-3 text-sm text-slate-100 outline-none transition-colors font-sans`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <LogIn className="w-4.5 h-4.5" />
                  )}
                  <span>
                    {isLoading
                      ? t("subscriber_login_verifying", "جاري التحقق وقراءة موضوع الطالب، يرجى الانتظار...")
                      : t("subscriber_login_btn", "تسجيل الدخول الآن")}
                  </span>
                </button>
              </form>

              {/* Modal Loading Lock Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <h4 className="font-serif font-bold text-amber-400 text-lg">
                    {t("subscriber_loading_header", "جاري التحقق وقراءة بيانات الطالب...")}
                  </h4>
                  <p className="text-slate-300 text-xs font-sans max-w-xs">
                    {t("subscriber_loading_desc", "يرجى الانتظار لحظات ريثما يتم جلب موضوعك المخصص من جدول البيانات وتجهيز صفحتك.")}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-2">
                <p className="text-slate-400 text-xs font-sans">
                  {t("subscriber_new_user_prompt", "هل أنت مشترك جديد وترغب في الانضمام؟")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenRegistration) {
                      onOpenRegistration();
                    } else {
                      window.location.href = "#contact";
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-xl text-amber-300 font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{t("subscriber_open_reg_form_btn", "تعبئة استمارة تسجيل مشترك جديد (فورم التسجيل)")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Scanner Camera Modal */}
      <QrCodeScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
        title={t("subscriber_scan_qr_modal_title", "مسح رمز المشترك (QR Code)")}
        subtitle={t("subscriber_scan_qr_modal_sub", "وجّه كاميرا الهاتف أو الكمبيوتر أو التابلت نحو بطاقتك أو الإيميل ليتم تسجيل دخولك فوراً")}
      />
    </>
  );
}
