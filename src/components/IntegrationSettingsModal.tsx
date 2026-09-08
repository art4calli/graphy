import { useState, useEffect } from "react";
import { X, Copy, Check, Link2, Database, Code2, Sparkles, AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Layers, Folder, Languages, Globe, Bot, Mail, Send, Users, Shield, KeyRound, LogOut, Lock, UserCheck } from "lucide-react";
import { GAS_BACKEND_CODE } from "../data/appsScriptCode";
import { RegistrationQuestion, FormTranslationsMap, QuestionTranslation } from "../types";
import SubscriberEmailSettings from "./SubscriberEmailSettings";
import TelegramAdminSettings from "./TelegramAdminSettings";
import RegistrationAnswersViewer from "./RegistrationAnswersViewer";
import SettingsSubscribersViewer from "./SettingsSubscribersViewer";
import SiteTextsManager from "./SiteTextsManager";
import { translateBatchWithAI } from "../utils/translatorService";
import { DEFAULT_FORM_TRANSLATIONS } from "../data/defaultFormTranslations";
import { getSavedFormQuestions, saveConfiguredFormQuestions } from "../data/configuredFormQuestions";
import { fetchFormQuestionsBridge, DEFAULT_SPREADSHEET_ID } from "../utils/googleBackendBridge";

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxc-9cJ1Yh16hWRVAIGwZJCxQc4H8goaLUeB_4EuWtJi7tb6qhveCqbfTGkd3gQqHC7CQ/exec";

interface IntegrationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScriptUrl: string;
  currentSpreadsheetId: string;
  currentDriveFolderId?: string;
  onSaveConfig: (newScriptUrl: string, newSpreadsheetId: string, newDriveFolderId?: string) => Promise<void>;
  onAdminLogout?: () => void;
}

export default function IntegrationSettingsModal({
  isOpen,
  onClose,
  currentScriptUrl,
  currentSpreadsheetId,
  currentDriveFolderId = "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7",
  onSaveConfig,
  onAdminLogout,
}: IntegrationSettingsModalProps) {
  const [scriptUrl, setScriptUrl] = useState(currentScriptUrl || DEFAULT_SCRIPT_URL);
  const [spreadsheetId, setSpreadsheetId] = useState(currentSpreadsheetId);
  const [driveFolderId, setDriveFolderId] = useState(currentDriveFolderId);
  const [copied, setCopied] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "admin_auth" | "site_texts" | "settings_subscribers" | "registrants" | "translations" | "subscriber_email" | "telegram_admin" | "code" | "instructions">("settings");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin Credentials State
  const [adminCurrentPass, setAdminCurrentPass] = useState("");
  const [adminNewUser, setAdminNewUser] = useState("admin");
  const [adminNewPass, setAdminNewPass] = useState("");
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);
  const [adminUpdateMsg, setAdminUpdateMsg] = useState<string | null>(null);
  const [adminUpdateErr, setAdminUpdateErr] = useState<string | null>(null);

  // Form Translations State
  const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);
  const [translations, setTranslations] = useState<FormTranslationsMap>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [isSavingTranslations, setIsSavingTranslations] = useState(false);
  const [translationSuccessMsg, setTranslationSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setScriptUrl(currentScriptUrl || DEFAULT_SCRIPT_URL);
    setSpreadsheetId(currentSpreadsheetId);
    setDriveFolderId(currentDriveFolderId);
  }, [currentScriptUrl, currentSpreadsheetId, currentDriveFolderId, isOpen]);

  // Load questions and translations when tab is opened
  useEffect(() => {
    if (isOpen && activeTab === "translations") {
      fetchQuestionsAndTranslations();
    }
  }, [isOpen, activeTab]);

  const fetchQuestionsAndTranslations = async () => {
    setIsLoadingTranslations(true);
    setTranslationSuccessMsg(null);
    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      const activeSpreadsheet = spreadsheetId || (typeof window !== "undefined" ? localStorage.getItem("thnoon_spreadsheet_id") : "") || DEFAULT_SPREADSHEET_ID;
      
      // 1. Fetch questions directly from sheet or fall back to saved configured questions
      let loadedQuestions: RegistrationQuestion[] = [];
      try {
        loadedQuestions = await fetchFormQuestionsBridge(activeScript, activeSpreadsheet);
      } catch (err) {
        console.warn("Could not fetch questions from Google Sheet:", err);
      }

      if (!loadedQuestions || loadedQuestions.length === 0) {
        loadedQuestions = getSavedFormQuestions();
      }
      setQuestions(loadedQuestions);

      // 2. Fetch translations: initialize with DEFAULT_FORM_TRANSLATIONS
      let loadedTranslations: FormTranslationsMap = { ...DEFAULT_FORM_TRANSLATIONS };
      
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("thnoon_form_translations");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
              loadedTranslations = { ...loadedTranslations, ...parsed };
            }
          }
        } catch (e) {}
      }

      // 3. Try reading from server if available
      try {
        const tRes = await fetch("/api/form-translations");
        if (tRes.ok) {
          const contentType = tRes.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const tData = await tRes.json();
            if (tData.translations && typeof tData.translations === "object") {
              loadedTranslations = { ...loadedTranslations, ...tData.translations };
            }
          }
        }
      } catch (e) {}
      
      // Initialize and merge any missing question keys in translations map
      const mergedTranslations = { ...loadedTranslations };
      loadedQuestions.forEach((q) => {
        const key = q.question;
        const fallback = DEFAULT_FORM_TRANSLATIONS[key] || DEFAULT_FORM_TRANSLATIONS[key.trim()];
        const current = mergedTranslations[key] || q.translations || fallback;

        if (current) {
          mergedTranslations[key] = current;
          if (q.id) {
            mergedTranslations[String(q.id)] = current;
          }
        } else {
          const placeholder: QuestionTranslation = {
            questionEn: "",
            questionTh: "",
            descriptionEn: "",
            descriptionTh: "",
            optionsEn: q.options ? [...q.options] : [],
            optionsTh: q.options ? [...q.options] : []
          };
          mergedTranslations[key] = placeholder;
          if (q.id) {
            mergedTranslations[String(q.id)] = placeholder;
          }
        }
      });
      setTranslations(mergedTranslations);
    } catch (e) {
      console.error("Error loading questions & translations:", e);
    } finally {
      setIsLoadingTranslations(false);
    }
  };

  const handleAutoTranslate = async () => {
    if (questions.length === 0) return;
    setIsAutoTranslating(true);
    setTranslationSuccessMsg(null);
    try {
      let finalTranslations: FormTranslationsMap = { ...translations };
      let translationSucceeded = false;
      let methodUsed = "الذكاء الاصطناعي";

      // 1. Try Express API if server is running
      try {
        const res = await fetch("/api/auto-translate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions })
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json();
            if (data.success && data.translations) {
              finalTranslations = { ...finalTranslations, ...data.translations };
              translationSucceeded = true;
              methodUsed = data.method === "gemini-ai" ? "Gemini AI" : "الترجمة الذكية";
            }
          }
        }
      } catch (err) {
        // Fallback to client-side translator
      }

      // 2. Client-side fallback translator (works seamlessly on Vercel & GitHub Pages)
      if (!translationSucceeded) {
        const itemsToTranslate: Array<{ id: string; ar: string }> = [];
        questions.forEach((q) => {
          itemsToTranslate.push({ id: `${q.id}__question`, ar: q.question });
          if (q.description) {
            itemsToTranslate.push({ id: `${q.id}__desc`, ar: q.description });
          }
          if (q.options && q.options.length > 0) {
            q.options.forEach((opt, optIdx) => {
              itemsToTranslate.push({ id: `${q.id}__opt_${optIdx}`, ar: opt });
            });
          }
        });

        const batchResults = await translateBatchWithAI(itemsToTranslate);

        questions.forEach((q) => {
          const defaultQ = DEFAULT_FORM_TRANSLATIONS[q.question] || DEFAULT_FORM_TRANSLATIONS[q.question.trim()];
          const qRes = batchResults[`${q.id}__question`] || { 
            th: defaultQ?.questionTh || q.question, 
            en: defaultQ?.questionEn || q.question 
          };
          const descRes = q.description 
            ? (batchResults[`${q.id}__desc`] || { th: defaultQ?.descriptionTh || q.description, en: defaultQ?.descriptionEn || q.description }) 
            : undefined;

          const optEn: string[] = [];
          const optTh: string[] = [];
          if (q.options && q.options.length > 0) {
            q.options.forEach((opt, optIdx) => {
              const optDefaultEn = defaultQ?.optionsEn?.[optIdx];
              const optDefaultTh = defaultQ?.optionsTh?.[optIdx];
              const optRes = batchResults[`${q.id}__opt_${optIdx}`] || { 
                th: optDefaultTh || opt, 
                en: optDefaultEn || opt 
              };
              optEn.push(optRes.en);
              optTh.push(optRes.th);
            });
          }

          const itemTrans: QuestionTranslation = {
            questionEn: qRes.en || defaultQ?.questionEn || q.question,
            questionTh: qRes.th || defaultQ?.questionTh || q.question,
            descriptionEn: descRes?.en || defaultQ?.descriptionEn,
            descriptionTh: descRes?.th || defaultQ?.descriptionTh,
            optionsEn: optEn.length > 0 ? optEn : defaultQ?.optionsEn,
            optionsTh: optTh.length > 0 ? optTh : defaultQ?.optionsTh,
          };

          // Save by BOTH Arabic question text AND question ID
          finalTranslations[q.question] = itemTrans;
          if (q.id) {
            finalTranslations[String(q.id)] = itemTrans;
          }
        });
        translationSucceeded = true;
      }

      // Update UI state immediately!
      setTranslations({ ...finalTranslations });

      // Compile configured questions with the new translations
      const questionsWithTranslations = questions.map((q) => {
        const fallbackTrans = DEFAULT_FORM_TRANSLATIONS[q.question] || DEFAULT_FORM_TRANSLATIONS[q.question.trim()];
        const trans = finalTranslations[q.question] || (q.id ? finalTranslations[String(q.id)] : undefined) || fallbackTrans || q.translations;
        return {
          ...q,
          translations: trans
        };
      });

      // Automatically persist to localStorage and notify all components
      saveConfiguredFormQuestions(questionsWithTranslations);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("thnoon_form_translations", JSON.stringify(finalTranslations));
        } catch (e) {}
      }

      // Persist to server
      try {
        await fetch("/api/form-translations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations: finalTranslations })
        });
      } catch (e) {}

      try {
        await fetch("/api/form-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: questionsWithTranslations })
        });
      } catch (e) {}

      setTranslationSuccessMsg(`تمت ترجمة جميع الأسئلة والخيارات وتفعيلها في الاستمارة بنجاح بواسطة ${methodUsed}!`);
      setTimeout(() => setTranslationSuccessMsg(null), 4000);
    } catch (e) {
      console.error("Auto translate failed:", e);
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleSaveTranslations = async () => {
    setIsSavingTranslations(true);
    setTranslationSuccessMsg(null);
    try {
      // 1. Compile questions with their respective translations
      const questionsWithTranslations = questions.map((q) => {
        const fallbackTrans = DEFAULT_FORM_TRANSLATIONS[q.question] || DEFAULT_FORM_TRANSLATIONS[q.question.trim()];
        const trans = translations[q.question] || (q.id ? translations[String(q.id)] : undefined) || fallbackTrans || q.translations;
        return {
          ...q,
          translations: trans
        };
      });

      // 2. Persist to configured questions (localStorage + custom event)
      saveConfiguredFormQuestions(questionsWithTranslations);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("thnoon_form_translations", JSON.stringify(translations));
        } catch (e) {}
      }

      // 3. Persist to server
      try {
        await fetch("/api/form-translations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations })
        });
      } catch (e) {}

      try {
        await fetch("/api/form-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: questionsWithTranslations })
        });
      } catch (e) {}

      setTranslationSuccessMsg("تم حفظ وتفعيل أسئلة وترجمات الاستمارة بنجاح على جميع الأجهزة!");
      setTimeout(() => setTranslationSuccessMsg(null), 4000);
    } catch (e) {
      console.error("Save translations failed:", e);
    } finally {
      setIsSavingTranslations(false);
    }
  };

  const handleUpdateTranslationField = (
    qKey: string,
    field: keyof QuestionTranslation,
    val: any,
    qId?: number | string
  ) => {
    setTranslations((prev) => {
      const existing = prev[qKey] || (qId ? prev[String(qId)] : {}) || {};
      const updated = {
        ...existing,
        [field]: val
      };
      const next = {
        ...prev,
        [qKey]: updated
      };
      if (qId) {
        next[String(qId)] = updated;
      }
      return next;
    });
  };

  const handleCopyLanguageLink = (lang: string) => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const url = `${origin}/?register=true&lang=${lang}`;
      navigator.clipboard.writeText(url);
      setCopiedLang(lang);
      setTimeout(() => setCopiedLang(null), 2500);
    }
  };

  const handleCopyPortalLink = () => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const url = `${origin}/?portal=true`;
      navigator.clipboard.writeText(url);
      setCopiedLang("portal");
      setTimeout(() => setCopiedLang(null), 2500);
    }
  };

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GAS_BACKEND_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setTestResult(null);
    try {
      await onSaveConfig(scriptUrl.trim(), spreadsheetId.trim(), driveFolderId.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAdmin(true);
    setAdminUpdateMsg(null);
    setAdminUpdateErr(null);

    const cleanCurrent = adminCurrentPass.trim();
    const cleanUser = adminNewUser.trim();
    const cleanPass = adminNewPass.trim();

    if (!cleanCurrent) {
      setAdminUpdateErr("يرجى إدخال رمز الدخول الحالي للمشرف");
      setIsUpdatingAdmin(false);
      return;
    }
    if (!cleanUser || cleanUser.length < 2) {
      setAdminUpdateErr("يجب ألا يقل اسم المشرف عن حرفين");
      setIsUpdatingAdmin(false);
      return;
    }
    if (!cleanPass || cleanPass.length < 3) {
      setAdminUpdateErr("يجب ألا يقل رمز الدخول الجديد عن 3 خانات");
      setIsUpdatingAdmin(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: cleanCurrent,
          newUsername: cleanUser,
          newPassword: cleanPass
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        localStorage.setItem("thnoon_custom_admin_user", cleanUser);
        localStorage.setItem("thnoon_custom_admin_pass", cleanPass);
        localStorage.setItem("thnoon_admin_user", cleanUser);
        setAdminUpdateMsg("تم تحديث بيانات دخول المشرف بنجاح!");
        setAdminCurrentPass("");
        setAdminNewPass("");
      } else {
        setAdminUpdateErr((data && data.message) || "فشل تحديث البيانات. تأكد من صحة رمز الدخول الحالي.");
      }
    } catch (err) {
      localStorage.setItem("thnoon_custom_admin_user", cleanUser);
      localStorage.setItem("thnoon_custom_admin_pass", cleanPass);
      localStorage.setItem("thnoon_admin_user", cleanUser);
      setAdminUpdateMsg("تم حفظ بيانات الدخول محلياً بنجاح!");
      setAdminCurrentPass("");
      setAdminNewPass("");
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const urlToTest = scriptUrl.trim();
      if (!urlToTest) {
        // Test direct Google Sheets Visualization connection
        const sheetTestUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}/gviz/tq?tqx=out:json&sheet=Profile`;
        const res = await fetch(sheetTestUrl);
        if (res.ok) {
          setTestResult({
            success: true,
            message: "تم الاتصال بجدول البيانات المباشر بنجاح! البيانات قابلة للقراءة."
          });
        } else {
          setTestResult({
            success: false,
            message: "تعذر القراءة من جدول البيانات. تأكد من أن جدول البيانات مشارك لصلاحية 'أي شخص لديه الرابط يمكنه العرض'."
          });
        }
      } else {
        // Test Google Apps Script Web App
        const res = await fetch(urlToTest + (urlToTest.includes("?") ? "&" : "?") + "action=getFormQuestions");
        const data = await res.json();
        if (data && (data.success || data.questions || data.profile)) {
          setTestResult({
            success: true,
            message: "تم الاتصال بتطبيق الويب Google Apps Script بنجاح! جميع العمليات (القراءة والكتابة) نشطة."
          });
        } else {
          setTestResult({
            success: true,
            message: "تم استقبال استجابة من السكريبت ولكن يرجى التأكد من اختيار 'Anyone' عند نشر التطبيق."
          });
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "تعذر الاتصال بالرابط المدخل. تأكد من صحة الرابط ونشره بصلاحية Anyone."
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-400">إعدادات ربط الخادم وجدول البيانات</h2>
              <p className="text-xs text-slate-400 font-sans">إدارة روابط التحديث، معرف الشيت، وكود Google Apps Script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Sticky & Never Collapses */}
        <div className="flex-shrink-0 sticky top-0 z-20 flex border-b border-slate-800 bg-slate-950 px-4 md:px-6 gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-700 py-1 shadow-sm">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "settings"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>بيانات الربط والروابط</span>
          </button>

          <button
            onClick={() => setActiveTab("admin_auth")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "admin_auth"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>أمان المشرف ورابط الإعدادات</span>
          </button>

          <button
            onClick={() => setActiveTab("site_texts")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "site_texts"
                ? "border-amber-500 text-amber-400 bg-amber-500/10 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Languages className="w-4 h-4 text-amber-400 shrink-0" />
            <span>نصوص الصفحة والترجمات (3 لغات)</span>
          </button>

          <button
            onClick={() => setActiveTab("settings_subscribers")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "settings_subscribers"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تسجيل المشتركين (Settings)</span>
          </button>

          <button
            onClick={() => setActiveTab("registrants")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "registrants"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>سجل المشتركين (RegistrationAnswers)</span>
          </button>
          
          <button
            onClick={() => setActiveTab("translations")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "translations"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Languages className="w-4 h-4 shrink-0" />
            <span>ترجمة ولغات الاستمارة</span>
          </button>

          <button
            onClick={() => setActiveTab("subscriber_email")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "subscriber_email"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span>إيميل المشترك (الربط والرسائل)</span>
          </button>

          <button
            onClick={() => setActiveTab("telegram_admin")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "telegram_admin"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>رسائل تلغرام (الإدارة)</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "code"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span>كود Google Apps Script</span>
          </button>

          <button
            onClick={() => setActiveTab("instructions")}
            className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === "instructions"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>خطوات التحديث والربط</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: SETTINGS FORM */}
          {activeTab === "settings" && (
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Alert Notice */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200/90 text-xs leading-relaxed flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300 mb-1">تعديل روابط الربط المباشر:</p>
                  <p>عند نشر تحديث جديد لكود Apps Script من جوجل شيت، قم بنسخ رابط التطبيق المنشور (Web App URL) ولصقه في الحقل أدناه ليتم التحديث فوراً دون الحاجة لتعديل الكود البرمجي للموقع.</p>
                </div>
              </div>

              {/* Input: Spreadsheet ID */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    معرف جدول البيانات (Google Spreadsheet ID):
                  </span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>فتح الشيت في جوجل</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="مثال: 1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 font-mono focus:outline-none transition-colors"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  المعرف الموجود بين <code className="text-amber-300">/d/</code> و <code className="text-amber-300">/edit</code> في رابط الشيت الخاص بك.
                </p>
              </div>

              {/* Input: Web App URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-amber-300 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-amber-400" />
                    <span>رابط نشر تطبيق جوجل (Google Apps Script Web App URL):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setScriptUrl(DEFAULT_SCRIPT_URL)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-sans"
                    title="استعادة الرابط الافتراضي للربط"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>استعادة الرابط الافتراضي</span>
                  </button>
                </div>
                <input
                  type="url"
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 font-mono focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-slate-400">
                  الرابط الناتج من عملية النشر (Deploy -&gt; New Deployment -&gt; Web app) في محرر Apps Script.
                </p>
              </div>

              {/* Input: Google Drive Folder ID */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-400" />
                    معرف مجلد Google Drive لحفظ المرفقات والصور (Folder ID):
                  </span>
                  <a
                    href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>فتح المجلد في درايف</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="مثال: 1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 font-mono focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-slate-400">
                  المجلد السحابي الذي تُحفظ فيه ملفات المشتركين وصور الكاميرا المرفوعة تلقائياً مع صلاحيات المشاهدة.
                </p>
              </div>

              {/* Direct Form Link for Sharing */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-serif">
                    <Link2 className="w-4 h-4 text-amber-400" />
                    <span>رابط الاستمارة المباشر (المستقل للمشتركين)</span>
                  </label>
                  <span className="text-[10px] text-amber-400/80 bg-amber-500/20 px-2 py-0.5 rounded-full font-sans">
                    يفتح الاستمارة مباشرة
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  يمكنك نسخ هذا الرابط المباشر وإرساله للطلاب أو نشره في وسائل التواصل ليدخلوا إلى استمارة التسجيل مباشرة:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/?register=true`}
                    className="flex-1 px-3 py-2 bg-slate-950/90 border border-slate-700 rounded-xl text-xs text-amber-200 font-mono focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(`${window.location.origin}/?register=true`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                      }
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "تم النسخ!" : "نسخ"}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${isTesting ? "animate-spin" : ""}`} />
                  <span>{isTesting ? "جاري اختبار الاتصال..." : "اختبار الاتصال بالخادم"}</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري حفظ الإعدادات...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>حفظ وثبيت الإعدادات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>تم حفظ وتطبيق إعدادات الربط بنجاح! الموقع يستخدم الآن البيانات والروابط المحدثة.</span>
                </div>
              )}

              {testResult && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

            </form>
          )}

          {/* TAB: ADMIN ACCESS & CREDENTIALS MANAGEMENT */}
          {activeTab === "admin_auth" && (
            <div className="space-y-6">
              
              {/* Header Notice */}
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300 font-serif">حماية الإعدادات والروابط المخصصة</h3>
                  <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                    تم فصل زر الإعدادات وحمايته برابط خاص وبيانات دخول سرية للمشرف فقط، حتى لا يظهر للعامة.
                  </p>
                </div>
              </div>

              {/* SECTION 1: Direct Admin Link */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2 font-serif">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>رابط الدخول المباشر لصفحة الإعدادات (خاص بالمشرف):</span>
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-sans">
                    محمي برمز الدخول
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  استخدم هذا الرابط للوصول السريع إلى شاشة تسجيل دخول المشرف وفتح الإعدادات من أي جهاز أو متصفح:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== "undefined" ? `${window.location.origin}/?admin=true` : "/?admin=true"}
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(`${window.location.origin}/?admin=true`);
                        setCopiedAdminLink(true);
                        setTimeout(() => setCopiedAdminLink(false), 2500);
                      }
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow"
                  >
                    {copiedAdminLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAdminLink ? "تم النسخ!" : "نسخ رابط المشرف"}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: Default Google Apps Script Link */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2 font-serif">
                    <Link2 className="w-4 h-4 text-amber-400" />
                    <span>رابط الربط الافتراضي (Google Apps Script Default URL):</span>
                  </h4>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    الرابط المعتمد
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  الرابط الافتراضي للاتصال بـ Google Apps Script الخاص بالنظام. يمكنك نسخه أو اعتماده في حقل الربط:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={DEFAULT_SCRIPT_URL}
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-200/90 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScriptUrl(DEFAULT_SCRIPT_URL);
                      setActiveTab("settings");
                    }}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors shrink-0"
                    title="تطبيق هذا الرابط في خانة إعدادات الربط"
                  >
                    تعيين في الإعدادات
                  </button>
                </div>
              </div>

              {/* SECTION 3: Change Admin Credentials Form */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2 font-serif">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>تعديل بيانات دخول المشرف (اسم المستخدم ورقم/رمز الدخول):</span>
                </h4>

                {adminUpdateMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{adminUpdateMsg}</span>
                  </div>
                )}

                {adminUpdateErr && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminUpdateErr}</span>
                  </div>
                )}

                <form onSubmit={handleChangeAdminCredentials} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        رمز الدخول الحالي *
                      </label>
                      <input
                        type="password"
                        value={adminCurrentPass}
                        onChange={(e) => setAdminCurrentPass(e.target.value)}
                        placeholder="أدخل الرمز الحالي (افتراضياً: 1234)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        اسم المشرف الجديد *
                      </label>
                      <input
                        type="text"
                        value={adminNewUser}
                        onChange={(e) => setAdminNewUser(e.target.value)}
                        placeholder="مثال: admin"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        رمز / رقم الدخول الجديد *
                      </label>
                      <input
                        type="password"
                        value={adminNewPass}
                        onChange={(e) => setAdminNewPass(e.target.value)}
                        placeholder="الرمز السري الجديد"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingAdmin}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isUpdatingAdmin ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري التحديث...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>حفظ بيانات المشرف الجديدة</span>
                        </>
                      )}
                    </button>

                    {onAdminLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          onAdminLogout();
                          onClose();
                        }}
                        className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل خروج المشرف</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB: FORM TRANSLATIONS & MULTILINGUAL */}
          {activeTab === "translations" && (
            <div className="space-y-6">
              
              {/* Header & Action Toolbar */}
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 font-serif">
                      <Languages className="w-4 h-4 text-amber-400" />
                      <span>إدارة وترجمة أسئلة الاستمارة (العربية - English - ภาษาไทย)</span>
                    </h3>
                    <p className="text-xs text-slate-300 font-sans mt-0.5">
                      يتم جلب الأسئلة العربية من ورقة <code className="text-amber-400">RegistrationQuestions</code> وتبقى ثابتة، ويتم ترجمتها هنا. استمارة التسجيل تأخذ الأسئلة والترجمات حصرياً من هنا دون اتصال مباشر بالشيت لضمان السرعة الفورية على جميع الأجهزة.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchQuestionsAndTranslations}
                      disabled={isLoadingTranslations}
                      title="إعادة قراءة الأسئلة من جوجل شيت"
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTranslations ? "animate-spin text-amber-400" : "text-slate-300"}`} />
                      <span>تحديث الأسئلة من الشيت</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoTranslate}
                      disabled={isAutoTranslating || isLoadingTranslations || questions.length === 0}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-50"
                    >
                      {isAutoTranslating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري الترجمة...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>ترجمة بالذكاء الاصطناعي</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveTranslations}
                      disabled={isSavingTranslations || isLoadingTranslations}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSavingTranslations ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري الحفظ...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>حفظ الترجمات</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feedback message */}
                {translationSuccessMsg && (
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{translationSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Direct Language Links Box */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-serif">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>روابط الاستمارة المباشرة المخصصة لكل لغة (للنشر والمشاركة):</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full">
                    تفتح الاستمارة مباشرة باللغة المحددة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Subscriber Portal Direct Link */}
                  <div className="p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base">🔐</span>
                      <div className="text-right truncate">
                        <p className="text-xs font-bold text-amber-300">بوابة المشتركين</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">?portal=true</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPortalLink}
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedLang === "portal" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === "portal" ? "تم!" : "نسخ"}</span>
                    </button>
                  </div>

                  {/* Arabic Direct Link */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base">🇸🇦</span>
                      <div className="text-right truncate">
                        <p className="text-xs font-bold text-amber-300">استمارة التسجيل (عربي)</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">?register=true&lang=ar</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLanguageLink("ar")}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedLang === "ar" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === "ar" ? "تم!" : "نسخ"}</span>
                    </button>
                  </div>

                  {/* English Direct Link */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base">🇬🇧</span>
                      <div className="text-right truncate">
                        <p className="text-xs font-bold text-amber-300">Form Link (English)</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">?register=true&lang=en</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLanguageLink("en")}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedLang === "en" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === "en" ? "تم!" : "نسخ"}</span>
                    </button>
                  </div>

                  {/* Thai Direct Link */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base">🇹🇭</span>
                      <div className="text-right truncate">
                        <p className="text-xs font-bold text-amber-300">แบบฟอร์ม (Thai)</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">?register=true&lang=th</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLanguageLink("th")}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedLang === "th" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === "th" ? "تم!" : "نسخ"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions Translation Cards */}
              {isLoadingTranslations ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-400" />
                  <p className="text-sm">جاري قراءة الأسئلة والترجمات الحالية...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                  <p className="text-sm font-bold text-slate-300">لم يتم العثور على أسئلة في ورقة RegistrationQuestions</p>
                  <p className="text-xs">تأكد من وجود أسئلة في الشيت ثم اضغط على زر التحديث.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const qKey = q.question;
                    const fallbackTrans = DEFAULT_FORM_TRANSLATIONS[qKey] || DEFAULT_FORM_TRANSLATIONS[qKey.trim()];
                    const curTrans = translations[qKey] || translations[qKey.trim()] || (q.id ? translations[String(q.id)] : undefined) || fallbackTrans || {};

                    return (
                      <div
                        key={idx}
                        className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md hover:border-slate-700 transition-colors"
                      >
                        {/* Question Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                              نوع الحقل: {q.type}
                            </span>
                            {q.required && (
                              <span className="text-[10px] text-red-300 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-md font-bold">
                                مطلوب
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1. Base Arabic Display - Fixed & Protected */}
                        <div className="p-3.5 bg-slate-900/90 border border-amber-500/20 rounded-xl space-y-1.5 text-right">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                              <span>🇸🇦 نص السؤال العربي (من ورقة RegistrationQuestions):</span>
                            </span>
                            <span className="text-[10px] bg-slate-800/90 text-amber-300/90 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                              ثابت ومحمي
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-100 font-serif leading-snug">{q.question}</p>
                          {q.description && (
                            <p className="text-xs text-slate-400 font-sans">{q.description}</p>
                          )}
                          {q.options && q.options.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[11px] text-slate-400">الخيارات:</span>
                              {q.options.map((opt, oIdx) => (
                                <span key={oIdx} className="text-[11px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. Translations Grid (English & Thai) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Column 1: English Translation 🇬🇧 */}
                          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2.5" dir="ltr">
                            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
                              <span className="text-base">🇬🇧</span>
                              <span className="text-xs font-bold text-slate-200 font-sans">English Translation</span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 font-medium">Question in English:</label>
                              <input
                                type="text"
                                value={curTrans.questionEn ?? fallbackTrans?.questionEn ?? ""}
                                placeholder="Enter English translation..."
                                onChange={(e) => handleUpdateTranslationField(qKey, "questionEn", e.target.value, q.id)}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 font-medium">Description (optional):</label>
                              <input
                                type="text"
                                value={curTrans.descriptionEn ?? fallbackTrans?.descriptionEn ?? ""}
                                placeholder="English helper text..."
                                onChange={(e) => handleUpdateTranslationField(qKey, "descriptionEn", e.target.value, q.id)}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                              />
                            </div>

                            {/* Option Translations in English */}
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <label className="text-[11px] text-slate-400 font-medium">Dropdown Options (English):</label>
                                {q.options.map((opt, optIdx) => {
                                  const curOptsEn = curTrans.optionsEn || fallbackTrans?.optionsEn || [];
                                  const currentVal = curOptsEn[optIdx] !== undefined ? curOptsEn[optIdx] : "";

                                  return (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 w-4">{optIdx + 1}.</span>
                                      <input
                                        type="text"
                                        value={currentVal}
                                        placeholder={`Translation for "${opt}"`}
                                        onChange={(e) => {
                                          const nextOpts = [...(curTrans.optionsEn || fallbackTrans?.optionsEn || q.options || [])];
                                          nextOpts[optIdx] = e.target.value;
                                          handleUpdateTranslationField(qKey, "optionsEn", nextOpts, q.id);
                                        }}
                                        className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Column 2: Thai Translation 🇹🇭 */}
                          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2.5" dir="ltr">
                            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
                              <span className="text-base">🇹🇭</span>
                              <span className="text-xs font-bold text-slate-200 font-sans">ภาษาไทย (Thai Translation)</span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 font-medium">คำถามภาษาไทย (Thai Question):</label>
                              <input
                                type="text"
                                value={curTrans.questionTh ?? fallbackTrans?.questionTh ?? ""}
                                placeholder="กรอกคำถามภาษาไทย..."
                                onChange={(e) => handleUpdateTranslationField(qKey, "questionTh", e.target.value, q.id)}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 font-medium">คำอธิบายเพิ่มเติม (Thai Description):</label>
                              <input
                                type="text"
                                value={curTrans.descriptionTh ?? fallbackTrans?.descriptionTh ?? ""}
                                placeholder="คำอธิบายหรือคำแนะนำ..."
                                onChange={(e) => handleUpdateTranslationField(qKey, "descriptionTh", e.target.value, q.id)}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                              />
                            </div>

                            {/* Option Translations in Thai */}
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <label className="text-[11px] text-slate-400 font-medium">ตัวเลือกรายการ (Thai Options):</label>
                                {q.options.map((opt, optIdx) => {
                                  const curOptsTh = curTrans.optionsTh || fallbackTrans?.optionsTh || [];
                                  const currentVal = curOptsTh[optIdx] !== undefined ? curOptsTh[optIdx] : "";

                                  return (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 w-4">{optIdx + 1}.</span>
                                      <input
                                        type="text"
                                        value={currentVal}
                                        placeholder={`คำแปลสำหรับ "${opt}"`}
                                        onChange={(e) => {
                                          const nextOpts = [...(curTrans.optionsTh || fallbackTrans?.optionsTh || q.options || [])];
                                          nextOpts[optIdx] = e.target.value;
                                          handleUpdateTranslationField(qKey, "optionsTh", nextOpts, q.id);
                                        }}
                                        className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Save Bar */}
              {questions.length > 0 && (
                <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    لا تنسَ حفظ التغييرات بعد الانتهاء من مراجعة الترجمات.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveTranslations}
                    disabled={isSavingTranslations}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    {isSavingTranslations ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري حفظ الترجمات...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>حفظ جميع الترجمات الآن</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB: SITE TEXTS & 3-LANGUAGE TRANSLATIONS */}
          {activeTab === "site_texts" && (
            <SiteTextsManager />
          )}

          {/* TAB: SUBSCRIBERS FROM SETTINGS SHEET */}
          {activeTab === "settings_subscribers" && (
            <SettingsSubscribersViewer
              scriptUrl={scriptUrl}
              spreadsheetId={spreadsheetId}
            />
          )}

          {/* TAB: REGISTRANTS FROM REGISTRATION ANSWERS */}
          {activeTab === "registrants" && (
            <RegistrationAnswersViewer
              scriptUrl={scriptUrl}
              spreadsheetId={spreadsheetId}
            />
          )}

          {/* TAB: SUBSCRIBER EMAIL CONFIGURATION */}
          {activeTab === "subscriber_email" && (
            <SubscriberEmailSettings 
              currentDriveFolderId={driveFolderId} 
              currentScriptUrl={scriptUrl}
            />
          )}

          {/* TAB: TELEGRAM ADMIN NOTIFICATIONS */}
          {activeTab === "telegram_admin" && (
            <TelegramAdminSettings
              currentSpreadsheetId={spreadsheetId}
              currentScriptUrl={scriptUrl}
            />
          )}

          {/* TAB 2: APPS SCRIPT CODE */}
          {activeTab === "code" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-300">كود Google Apps Script الشامل (آخر تحديث)</h3>
                  <p className="text-xs text-slate-400">يمكنك انسخ هذا الكود بالكامل ولصقه في محرر البرمجيات بجدول البيانات.</p>
                </div>
                
                <button
                  onClick={handleCopyCode}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    copied
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تم نسخ الكود بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الكود بالكامل</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-[11px] font-mono text-amber-200/90 overflow-x-auto max-h-[400px] leading-relaxed dir-ltr text-left select-all">
                  <code>{GAS_BACKEND_CODE}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: INSTRUCTIONS */}
          {activeTab === "instructions" && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-amber-300 border-b border-slate-800 pb-2">خطوات ربط الشيت وتطبيق Google Apps Script:</h3>

              <ol className="list-decimal list-inside space-y-3 marker:text-amber-400 marker:font-bold">
                <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <strong className="text-amber-300">فتح جدول البيانات:</strong> افتح جوجل شيت واذهب إلى القائمة العلوية اختر <code className="text-amber-400">الإضافات (Extensions)</code> -&gt; <code className="text-amber-400">Apps Script</code>.
                </li>

                <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <strong className="text-amber-300">لصق الكود:</strong> امسح أي كود سابق في المحرر، وانتقل إلى تبويب <span className="text-amber-400">"كود Google Apps Script"</span> هنا واضغط على <span className="text-amber-400">"نسخ الكود بالكامل"</span> ثم الصقه هناك واضغط حفظ (Ctrl + S).
                </li>

                <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <strong className="text-amber-300">النشر كتطبيق ويب (Deploy):</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 pr-4">
                    <li>اضغط على الزر الأزرق <code className="text-amber-300">نشر (Deploy)</code> -&gt; <code className="text-amber-300">تطبيق ويب جديد (New deployment)</code>.</li>
                    <li>في خانة <strong>Who has access (من ينفذ الإجراء)</strong>: اختر <code className="text-emerald-400 font-bold">Anyone (أي شخص)</code>.</li>
                    <li>اضغط Deploy وامنح الصلاحيات المطلوبة (Review permissions -&gt; Advanced -&gt; Go to Project).</li>
                  </ul>
                </li>

                <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <strong className="text-amber-300">وضع الرابط في الموقع:</strong> انسخ رابط Web App URL الصادر من جوجل شيت، وضعْه هنا في تبويب <span className="text-amber-400 font-bold">"بيانات الربط والروابط"</span> واضغط حفظ.
                </li>
              </ol>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
}
