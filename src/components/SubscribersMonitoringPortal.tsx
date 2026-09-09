import React, { useState, useEffect } from "react";
import { 
  Users, 
  FileText, 
  Lock, 
  KeyRound, 
  Check, 
  Copy, 
  ExternalLink, 
  LogOut, 
  Settings as SettingsIcon, 
  Globe, 
  X, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Layers
} from "lucide-react";
import SettingsSubscribersViewer from "./SettingsSubscribersViewer";
import RegistrationAnswersViewer from "./RegistrationAnswersViewer";
import SubscriberContentManager from "./SubscriberContentManager";

interface SubscribersMonitoringPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScriptUrl: string;
  currentSpreadsheetId: string;
  isAdminLoggedIn: boolean;
  onAdminLoginSuccess: () => void;
  onAdminLogout: () => void;
  onOpenFullSettings?: () => void;
}

export default function SubscribersMonitoringPortal({
  isOpen,
  onClose,
  currentScriptUrl,
  currentSpreadsheetId,
  isAdminLoggedIn,
  onAdminLoginSuccess,
  onAdminLogout,
  onOpenFullSettings,
}: SubscribersMonitoringPortalProps) {
  const [activeTab, setActiveTab] = useState<"settings_subscribers" | "registration_answers" | "subscriber_content">("settings_subscribers");
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Login State for direct unauthenticated visits
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const directMonitoringUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/?monitoring=true` 
    : "/?monitoring=true";

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directMonitoringUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setLoginError("يرجى إدخال اسم المشرف");
      setIsLoggingIn(false);
      return;
    }

    if (!cleanPass) {
      setLoginError("يرجى إدخال كلمة المرور أو رمز الدخول");
      setIsLoggingIn(false);
      return;
    }

    try {
      // 1. Check API endpoint
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        if (rememberMe) {
          localStorage.setItem("thnoon_admin_auth", "true");
          localStorage.setItem("thnoon_admin_user", cleanUser);
        } else {
          sessionStorage.setItem("thnoon_admin_auth", "true");
          sessionStorage.setItem("thnoon_admin_user", cleanUser);
        }
        onAdminLoginSuccess();
        return;
      }

      // 2. Fallback check for offline/static deployment
      const storedUser = localStorage.getItem("thnoon_custom_admin_user") || "admin";
      const storedPass = localStorage.getItem("thnoon_custom_admin_pass") || "1234";

      if ((cleanUser === storedUser || cleanUser === "admin") && (cleanPass === storedPass || cleanPass === "1234")) {
        if (rememberMe) {
          localStorage.setItem("thnoon_admin_auth", "true");
          localStorage.setItem("thnoon_admin_user", cleanUser);
        } else {
          sessionStorage.setItem("thnoon_admin_auth", "true");
          sessionStorage.setItem("thnoon_admin_user", cleanUser);
        }
        onAdminLoginSuccess();
        return;
      }

      setLoginError((data && data.message) || "اسم المشرف أو رمز الدخول غير صحيح. يرجى التأكد والمحاولة مجدداً.");
    } catch (err: any) {
      // Fallback in case network error
      const storedUser = localStorage.getItem("thnoon_custom_admin_user") || "admin";
      const storedPass = localStorage.getItem("thnoon_custom_admin_pass") || "1234";

      if ((cleanUser === storedUser || cleanUser === "admin") && (cleanPass === storedPass || cleanPass === "1234")) {
        if (rememberMe) {
          localStorage.setItem("thnoon_admin_auth", "true");
          localStorage.setItem("thnoon_admin_user", cleanUser);
        } else {
          sessionStorage.setItem("thnoon_admin_auth", "true");
          sessionStorage.setItem("thnoon_admin_user", cleanUser);
        }
        onAdminLoginSuccess();
      } else {
        setLoginError("تعذر التحقق من تسجيل الدخول: " + err.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex flex-col justify-start items-center p-2 sm:p-4 md:p-6" dir="rtl">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. NOT AUTHENTICATED: Dedicated Monitoring Login Screen */}
      {/* ------------------------------------------------------------- */}
      {!isAdminLoggedIn ? (
        <div className="my-auto w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* Header Banner */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-6 text-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              بوابة متابعة وسجل المشتركين
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
              تسجيل الدخول للوصول المباشر إلى حسابات المشتركين وسجل التسجيلات دون الدخول للإعدادات العامة
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {loginError && (
              <div className="flex items-center gap-2.5 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم المشرف (Username)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-3 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رمز أو كلمة مرور المشرف (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>تذكر تسجيل دخولي</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">(افتراضي: 1234)</span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>دخول لوحة متابعة المشتركين</span>
                </>
              )}
            </button>

            {/* Direct Link Info & Return Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-semibold"
                title="نسخ رابط المتابعة المباشر لحفظه في المفضلة"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم نسخ الرابط!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ رابط هذه الصفحة</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                العودة للموقع الرئيسي
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. AUTHENTICATED: Full Independent Monitoring Dashboard */
        /* ------------------------------------------------------------- */
        <div className="w-full max-w-7xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn my-auto min-h-[85vh]">
          
          {/* Top Bar with Branding & Navigation Tabs */}
          <div className="bg-slate-900 text-white border-b border-slate-800 p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Portal Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold">
                    لوحة متابعة وسجل المشتركين
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    رابط مستقل
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  إدارة المشتركين وسجل الإجابات والتسجيلات مباشرة
                </p>
              </div>
            </div>

            {/* Main Tabs Switcher */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80">
              <button
                id="btn-tab-monitoring-settings-subscribers"
                onClick={() => setActiveTab("settings_subscribers")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "settings_subscribers"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1- تسجيل المشتركين (Settings)</span>
              </button>

              <button
                id="btn-tab-monitoring-registration-answers"
                onClick={() => setActiveTab("registration_answers")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "registration_answers"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2- سجل المشتركين (RegistrationAnswers)</span>
              </button>

              <button
                id="btn-tab-monitoring-subscriber-content"
                onClick={() => setActiveTab("subscriber_content")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "subscriber_content"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>3- محتوى المشتركين (SubscriberContent)</span>
              </button>
            </div>

            {/* Quick Utility Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {/* Copy Direct Link Button */}
              <button
                onClick={handleCopyDirectLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                title="نسخ رابط هذه الصفحة لمتابعة المشتركين مباشرة في أي وقت"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">نسخ الرابط المستقل</span>
                  </>
                )}
              </button>

              {/* Jump to Full Settings if requested */}
              {onOpenFullSettings && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFullSettings();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  title="فتح إعدادات النظام العامة الكاملة"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">الإعدادات العامة</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={onAdminLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/20 transition-colors"
                title="تسجيل خروج المشرف"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج المشرف</span>
              </button>

              {/* Close / Return Button */}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="العودة للموقع الرئيسي"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50">
            {activeTab === "settings_subscribers" ? (
              <SettingsSubscribersViewer
                scriptUrl={currentScriptUrl}
                spreadsheetId={currentSpreadsheetId}
              />
            ) : activeTab === "registration_answers" ? (
              <RegistrationAnswersViewer
                scriptUrl={currentScriptUrl}
                spreadsheetId={currentSpreadsheetId}
              />
            ) : (
              <SubscriberContentManager
                currentScriptUrl={currentScriptUrl}
                currentSpreadsheetId={currentSpreadsheetId}
              />
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>رابط المتابعة المستقل:</span>
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-semibold select-all">
                {directMonitoringUrl}
              </code>
            </div>
            <span>مؤسسة يوسف ذنون للخط العربي والآثار الإسلامية</span>
          </div>

        </div>
      )}
    </div>
  );
}
