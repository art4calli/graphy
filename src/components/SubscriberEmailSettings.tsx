import { useState, useEffect } from "react";
import { 
  Mail, 
  QrCode, 
  Paperclip, 
  Plus, 
  Trash2, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Eye, 
  RefreshCw, 
  Info, 
  Check, 
  Smartphone, 
  Send, 
  ExternalLink, 
  ShieldCheck 
} from "lucide-react";
import { translateBatchWithAI } from "../utils/translatorService";
import { SubscriberEmailConfig, EmailFieldMapping, EmailAttachmentLink } from "../types";
import { executeAppsScriptPost, DEFAULT_SCRIPT_URL, DEFAULT_SPREADSHEET_ID } from "../utils/googleBackendBridge";

export function toDirectImageUrl(url: string): string {
  if (!url) return "";
  const raw = url.trim();
  let fileId = "";
  if (raw.includes("/file/d/")) {
    const part = raw.split("/file/d/")[1];
    fileId = part.split("/")[0].split("?")[0].split("&")[0];
  } else if (raw.includes("id=")) {
    const part = raw.split("id=")[1];
    fileId = part.split("&")[0].split("#")[0].split("/")[0];
  }
  if (fileId && fileId.length > 5) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return raw;
}

interface SubscriberEmailSettingsProps {
  currentDriveFolderId?: string;
  currentScriptUrl?: string;
}

const DEFAULT_CONFIG: SubscriberEmailConfig = {
  enabled: true,
  emailColumn: "G",
  deliveryStatusColumn: "P",
  dataFields: [
    { id: "1", label: "رقم التسجيل", labelEn: "Registration ID", labelTh: "หมายเลขลงทะเบียน", columnLetter: "B" },
    { id: "2", label: "اسم المشترك", labelEn: "Participant Name", labelTh: "ชื่อผู้สมัคร", columnLetter: "C" },
    { id: "3", label: "تاريخ ووقت التسجيل", labelEn: "Registration Date & Time", labelTh: "วันและเวลาที่ลงทะเบียน", columnLetter: "A" },
    { id: "4", label: "رقم الهاتف / الواتساب", labelEn: "Phone / WhatsApp", labelTh: "เบอร์โทรศัพท์ / WhatsApp", columnLetter: "F" },
    { id: "5", label: "رابط الدخول لصفحة الاشتراك", labelEn: "Login / Courses Portal", labelTh: "ลิงก์เข้าสู่ระบบบทเรียน", columnLetter: "LOGIN_URL" }
  ],
  qrCodeColumns: "B",
  qrDriveUrlColumn: "O",
  includeQrInEmail: true,
  messages: {
    ar: {
      subject: "تأكيد تسجيلك في منصة مؤسسة يوسف ذنون - بيانات الدخول والاشتراك",
      header: "مرحباً بك في مؤسسة يوسف ذنون للخط العربي",
      body: "نشكرك على تسجيلك واهتمامك بتعلم وإتقان فنون الخط العربي الأصيل. فيما يلي تفاصيل وبيانات تسجيلك المعتمدة للدخول ومتابعة الدورات والمحتوى الحصري:",
      footerNote: "يرجى الاحتفاظ برمز الاستجابة السريعة (QR Code) وبيانات التسجيل لاستخدامها عند مراجعة اشتراكك أو حضور الجلسات."
    },
    en: {
      subject: "Registration Confirmation - Yousuf Dhannoon Calligraphy Portal",
      header: "Welcome to Yousuf Dhannoon Calligraphy Institute",
      body: "Thank you for registering. Below are your verified registration details and access credentials to explore your courses and exclusive content:",
      footerNote: "Please keep this QR Code and your registration ID handy for subscription verification and session access."
    },
    th: {
      subject: "ยืนยันการลงทะเบียน - สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันนูน",
      header: "ยินดีต้อนรับสู่ สถาบันยูซุฟ ซันนูน สำหรับการเขียนอักษรอาหรับ",
      body: "ขอขอบคุณสำหรับการลงทะเบียน รายละเอียดข้อมูลการสมัครและข้อมูลสำหรับเข้าสู่ระบบบทเรียนของคุณมีดังนี้:",
      footerNote: "กรุณาเก็บรหัส QR Code และหมายเลขลงทะเบียนนี้ไว้เพื่อใช้ในการยืนยันสิทธิ์และการเข้าเรียน"
    }
  },
  attachments: [
    {
      id: "1",
      title: "دليل المشترك ومنهاج الدورات (PDF)",
      titleEn: "Subscriber Guide & Curriculum (PDF)",
      titleTh: "คู่มือสมาชิกและหลักสูตร (PDF)",
      url: "https://drive.google.com/file/d/1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7/view",
      type: "file_button"
    },
    {
      id: "2",
      title: "شعار وبطاقة عضوية المؤسسة",
      titleEn: "Institute Badge & Emblem",
      titleTh: "ตราสัญลักษณ์บัตรสมาชิก",
      url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
      type: "image"
    }
  ]
};

export default function SubscriberEmailSettings({ currentDriveFolderId, currentScriptUrl }: SubscriberEmailSettingsProps) {
  const [config, setConfig] = useState<SubscriberEmailConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<"ar" | "en" | "th">("ar");
  const [previewLang, setPreviewLang] = useState<"ar" | "en" | "th">("ar");

  // Test Email States
  const [testRecipientEmail, setTestRecipientEmail] = useState("shyk4test2020@gmail.com");
  const [testRecipientName, setTestRecipientName] = useState("مشترك تجريبي");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    success?: boolean;
    message?: string;
    recipient?: string;
    qrDriveUrl?: string;
    error?: string;
  } | null>(null);

  // Load config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSendTestEmail = async () => {
    if (!testRecipientEmail || !testRecipientEmail.includes("@")) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح لإرسال الإيميل التجريبي");
      return;
    }
    setIsSendingTest(true);
    setTestResponse(null);
    setErrorMessage(null);
    try {
      const activeScriptUrl = (currentScriptUrl || (typeof window !== "undefined" ? (localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url") || "") : "")).trim() || DEFAULT_SCRIPT_URL;
      
      let testOk = false;
      let respData: any = null;

      // 1. Try local server endpoint first
      try {
        const res = await fetch("/api/test-subscriber-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testRecipientEmail.trim(),
            name: testRecipientName.trim(),
            scriptUrl: activeScriptUrl,
            config: config,
            formLang: previewLang
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            testOk = true;
            respData = data;
          }
        }
      } catch (e) {}

      // 2. Direct Apps Script bridge
      if (!testOk) {
        const bridgeRes = await executeAppsScriptPost("testSubscriberEmail", {
          email: testRecipientEmail.trim(),
          name: testRecipientName.trim(),
          config: config,
          formLang: previewLang
        }, activeScriptUrl);
        if (bridgeRes.success) {
          testOk = true;
          respData = bridgeRes.data || {
            success: true,
            message: `تم إرسال الإيميل التجريبي والـ QR Code بنجاح إلى (${testRecipientEmail.trim()})!`,
            recipient: testRecipientEmail.trim()
          };
        }
      }

      if (testOk && respData) {
        setTestResponse(respData);
      } else {
        setTestResponse({
          success: false,
          error: "فشل إرسال الإيميل التجريبي. يرجى التأكد من تفعيل صلاحيات MailApp في Google Apps Script."
        });
      }
    } catch (err: any) {
      setTestResponse({
        success: false,
        error: err?.message || "تعذر الاتصال بالخادم لإرسال البريد التجريبي"
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const fetchConfig = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/subscriber-email-config");
      const data = await res.json();
      if (data && data.success && data.config) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...data.config,
          messages: {
            ...DEFAULT_CONFIG.messages,
            ...(data.config.messages || {})
          }
        });
      }
    } catch (err: any) {
      console.warn("Could not fetch subscriber email config:", err);
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("thnoon_subscriber_email_config");
        if (local) {
          try {
            setConfig(JSON.parse(local));
          } catch (e) {}
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("thnoon_subscriber_email_config", JSON.stringify(config));
        } catch (e) {}
      }

      const activeScriptUrl = (currentScriptUrl || (typeof window !== "undefined" ? (localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url") || "") : "")).trim() || DEFAULT_SCRIPT_URL;
      
      let saved = false;

      // 1. Try local server
      try {
        const res = await fetch("/api/subscriber-email-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config, scriptUrl: activeScriptUrl })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            saved = true;
          }
        }
      } catch (e) {}

      // 2. Direct Apps Script sync
      if (!saved) {
        const bridgeRes = await executeAppsScriptPost("saveSubscriberEmailConfig", { config }, activeScriptUrl);
        if (bridgeRes.success) {
          saved = true;
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || "تعذر الاتصال بالخادم");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const arTemplate = config.messages.ar;
      
      // 1. Try Express API if server is running
      try {
        const res = await fetch("/api/auto-translate-email-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            arTemplate,
            dataFields: config.dataFields,
            attachments: config.attachments
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.result) {
            const { en, th, fieldsEn, fieldsTh, attachmentsEn, attachmentsTh } = data.result;

            const updatedMessages = {
              ...config.messages,
              en: en ? { ...config.messages.en, ...en } : config.messages.en,
              th: th ? { ...config.messages.th, ...th } : config.messages.th
            };

            const updatedFields = config.dataFields.map(f => ({
              ...f,
              labelEn: (fieldsEn && fieldsEn[f.id]) || f.labelEn || f.label,
              labelTh: (fieldsTh && fieldsTh[f.id]) || f.labelTh || f.label
            }));

            const updatedAttachments = (config.attachments || []).map(a => ({
              ...a,
              titleEn: (attachmentsEn && attachmentsEn[a.id]) || a.titleEn || a.title,
              titleTh: (attachmentsTh && attachmentsTh[a.id]) || a.titleTh || a.title
            }));

            setConfig(prev => ({
              ...prev,
              messages: updatedMessages,
              dataFields: updatedFields,
              attachments: updatedAttachments
            }));

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            return;
          }
        }
      } catch (err) {
        // Fallback to client-side translator
      }

      // 2. Client-side fallback translator
      const itemsToTranslate: Array<{ id: string; ar: string }> = [];
      if (arTemplate.subject) itemsToTranslate.push({ id: "subj", ar: arTemplate.subject });
      if (arTemplate.greeting) itemsToTranslate.push({ id: "greet", ar: arTemplate.greeting });
      if (arTemplate.body) itemsToTranslate.push({ id: "body", ar: arTemplate.body });
      if (arTemplate.footer) itemsToTranslate.push({ id: "footer", ar: arTemplate.footer });

      config.dataFields.forEach((f) => {
        itemsToTranslate.push({ id: `f_${f.id}`, ar: f.label });
      });

      (config.attachments || []).forEach((a) => {
        itemsToTranslate.push({ id: `a_${a.id}`, ar: a.title });
      });

      const batchResults = await translateBatchWithAI(itemsToTranslate);

      const enMsg = {
        subject: batchResults["subj"]?.en || arTemplate.subject,
        greeting: batchResults["greet"]?.en || arTemplate.greeting,
        body: batchResults["body"]?.en || arTemplate.body,
        footer: batchResults["footer"]?.en || arTemplate.footer,
      };

      const thMsg = {
        subject: batchResults["subj"]?.th || arTemplate.subject,
        greeting: batchResults["greet"]?.th || arTemplate.greeting,
        body: batchResults["body"]?.th || arTemplate.body,
        footer: batchResults["footer"]?.th || arTemplate.footer,
      };

      const updatedMessages = {
        ...config.messages,
        en: { ...config.messages.en, ...enMsg },
        th: { ...config.messages.th, ...thMsg }
      };

      const updatedFields = config.dataFields.map(f => ({
        ...f,
        labelEn: batchResults[`f_${f.id}`]?.en || f.labelEn || f.label,
        labelTh: batchResults[`f_${f.id}`]?.th || f.labelTh || f.label
      }));

      const updatedAttachments = (config.attachments || []).map(a => ({
        ...a,
        titleEn: batchResults[`a_${a.id}`]?.en || a.titleEn || a.title,
        titleTh: batchResults[`a_${a.id}`]?.th || a.titleTh || a.title
      }));

      setConfig(prev => ({
        ...prev,
        messages: updatedMessages,
        dataFields: updatedFields,
        attachments: updatedAttachments
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || "خطأ أثناء الترجمة");
    } finally {
      setIsTranslating(false);
    }
  };

  // Add field mapping
  const addField = (label = "حقل جديد", columnLetter = "B") => {
    const newField: EmailFieldMapping = {
      id: Date.now().toString(),
      label,
      columnLetter: columnLetter.toUpperCase()
    };
    setConfig(prev => ({
      ...prev,
      dataFields: [...prev.dataFields, newField]
    }));
  };

  const removeField = (id: string) => {
    setConfig(prev => ({
      ...prev,
      dataFields: prev.dataFields.filter(f => f.id !== id)
    }));
  };

  const updateField = (id: string, updates: Partial<EmailFieldMapping>) => {
    setConfig(prev => ({
      ...prev,
      dataFields: prev.dataFields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  // Add Attachment
  const addAttachment = () => {
    const newAtt: EmailAttachmentLink = {
      id: Date.now().toString(),
      title: "مرفق جديد",
      url: "https://",
      type: "file_button"
    };
    setConfig(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAtt]
    }));
  };

  const removeAttachment = (id: string) => {
    setConfig(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== id)
    }));
  };

  const updateAttachment = (id: string, updates: Partial<EmailAttachmentLink>) => {
    setConfig(prev => ({
      ...prev,
      attachments: (prev.attachments || []).map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const insertVariableIntoBody = (varCode: string) => {
    const currentLang = activeLangTab;
    const currentTemplate = config.messages[currentLang] || config.messages.ar;
    const newBody = (currentTemplate.body ? currentTemplate.body + " " : "") + varCode;
    
    setConfig(prev => ({
      ...prev,
      messages: {
        ...prev.messages,
        [currentLang]: {
          ...prev.messages[currentLang],
          body: newBody
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400 font-sans space-y-3">
        <RefreshCw className="w-7 h-7 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm">جاري تحميل إعدادات إيميل المشترك...</p>
      </div>
    );
  }

  const currentMsg = config.messages[activeLangTab] || config.messages.ar;
  const previewMsg = config.messages[previewLang] || config.messages.ar;

  return (
    <div className="space-y-8 font-sans pb-8">
      
      {/* Top Banner & Main Toggle */}
      <div className="p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-300 font-serif flex items-center gap-2">
              <span>إرسال إيميل تلقائي للمشترك عند إتمام التسجيل</span>
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-sans">
                نظام آلي متكامل
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              يقوم النظام فور حفظ طلب التسجيل بتوليد رمز QR وحفظه في Google Drive وإرسال بطاقة بيانات المشترك مع روابط الدخول والمرفقات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-13 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
          <span className="text-xs font-bold text-slate-200">
            {config.enabled ? "مُفعّل ✅" : "مُعطّل ⏸️"}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">تم حفظ إعدادات إيميل المشترك بنجاح وتحديث القوالب!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: Sheet Columns */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm border-b border-slate-800 pb-3">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>1. تحديد أعمدة ورقة الإجابات (RegistrationAnswers)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Column */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>حرف عامود الإيميل للمشترك:</span>
              <span className="text-[10px] text-amber-400 font-mono">افتراضي: G</span>
            </label>
            <input
              type="text"
              value={config.emailColumn}
              onChange={(e) => setConfig(prev => ({ ...prev, emailColumn: e.target.value.toUpperCase().trim() }))}
              placeholder="G"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm font-mono text-amber-200 text-center uppercase focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-400">
              العامود الذي يحتوي على البريد الإلكتروني للمشترك في ورقة RegistrationAnswers.
            </p>
          </div>

          {/* Delivery Status Column */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>حرف عامود تأكيد حالة الإرسال:</span>
              <span className="text-[10px] text-amber-400 font-mono">افتراضي: P</span>
            </label>
            <input
              type="text"
              value={config.deliveryStatusColumn}
              onChange={(e) => setConfig(prev => ({ ...prev, deliveryStatusColumn: e.target.value.toUpperCase().trim() }))}
              placeholder="P"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm font-mono text-amber-200 text-center uppercase focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-400">
              العامود الذي سيُكتب فيه تلقائياً "تم الإرسال: [التاريخ والوقت]" في الشيت بعد إرسال الإيميل.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Data Fields Mapping */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>2. جدول البيانات المرسلة في الإيميل (Data Table)</span>
          </div>
          <button
            type="button"
            onClick={() => addField()}
            className="self-start sm:self-auto px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة حقل جديد</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          حدد الحقول التي ستُعرض في الجدول المنظم داخل رسالة الإيميل، مع تعيين اسم الحقل وحرف العامود الخاص به في الشيت:
        </p>

        {/* Fields list */}
        <div className="space-y-3">
          {config.dataFields.map((field, idx) => (
            <div 
              key={field.id || idx}
              className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-3 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </div>

              {/* Arabic Label */}
              <div className="flex-1 w-full space-y-1">
                <span className="text-[10px] text-slate-400">تسمية الحقل (عربي):</span>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  placeholder="مثال: رقم التسجيل"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* English Label */}
              <div className="flex-1 w-full space-y-1">
                <span className="text-[10px] text-slate-400">English Label:</span>
                <input
                  type="text"
                  value={field.labelEn || ""}
                  onChange={(e) => updateField(field.id, { labelEn: e.target.value })}
                  placeholder="e.g. Registration ID"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 text-left font-sans"
                />
              </div>

              {/* Column Letter */}
              <div className="w-full md:w-32 space-y-1">
                <span className="text-[10px] text-slate-400">عامود الشيت:</span>
                <input
                  type="text"
                  value={field.columnLetter}
                  onChange={(e) => updateField(field.id, { columnLetter: e.target.value.toUpperCase().trim() })}
                  placeholder="B أو LOGIN_URL"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-300 font-mono text-center uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors self-end md:self-center mt-2 md:mt-4 cursor-pointer"
                title="حذف هذا الحقل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick Add Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">إضافة سريعة:</span>
          <button
            type="button"
            onClick={() => addField("رقم التسجيل", "B")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 rounded-lg border border-slate-700 transition-colors"
          >
            + رقم التسجيل (B)
          </button>
          <button
            type="button"
            onClick={() => addField("اسم المشترك", "C")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 rounded-lg border border-slate-700 transition-colors"
          >
            + اسم المشترك (C)
          </button>
          <button
            type="button"
            onClick={() => addField("تاريخ ووقت التسجيل", "A")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 rounded-lg border border-slate-700 transition-colors"
          >
            + تاريخ التسجيل (A)
          </button>
          <button
            type="button"
            onClick={() => addField("رابط الدخول لصفحة الاشتراك", "LOGIN_URL")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 rounded-lg border border-slate-700 transition-colors"
          >
            + رابط صفحة الدخول (LOGIN_URL)
          </button>
        </div>
      </div>

      {/* SECTION 3: QR Code Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>3. إعدادات رمز الاستجابة السريعة (QR Code) المشترك للإيميل وتلغرام</span>
          </div>
          <span className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
            مشترك بين البريد وتلغرام ⚡
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Controls column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* QR Data Columns with interactive tags */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>تحديد عامود / بيانات توليد رمز الـ QR:</span>
                <span className="text-[10px] text-amber-400 font-mono">يقبل عامود واحد أو عدة أعمدة</span>
              </label>

              {/* Direct comma-separated input */}
              <div className="relative">
                <input
                  type="text"
                  value={config.qrCodeColumns}
                  onChange={(e) => setConfig(prev => ({ ...prev, qrCodeColumns: e.target.value.toUpperCase() }))}
                  placeholder="مثال: B, C أو B, C, F"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm font-mono text-amber-200 text-center uppercase focus:outline-none transition-colors"
                />
              </div>

              {/* Active Columns Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 ml-1">الأعمدة المعتمدة حالياً:</span>
                {(() => {
                  const cols = (config.qrCodeColumns || "")
                    .split(/[,\s+]+/)
                    .map(c => c.trim().toUpperCase())
                    .filter(Boolean);

                  if (cols.length === 0) {
                    return <span className="text-[11px] text-rose-400 font-mono">لم يتم تحديد أعمدة (سيتم استخدام B تلقائياً)</span>;
                  }

                  const colNames: Record<string, string> = {
                    "A": "تاريخ التسجيل",
                    "B": "رقم التسجيل",
                    "C": "اسم المشترك",
                    "D": "السؤال الأول",
                    "E": "البريد الإلكتروني",
                    "F": "رقم الهاتف / الواتساب",
                    "G": "السؤال 4"
                  };

                  return cols.map((col, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg"
                    >
                      <span className="font-mono">{col}</span>
                      {colNames[col] && <span className="text-[10px] font-normal text-slate-300">({colNames[col]})</span>}
                      <button
                        type="button"
                        onClick={() => {
                          const newCols = cols.filter((_, i) => i !== idx);
                          setConfig(prev => ({ ...prev, qrCodeColumns: newCols.join(", ") }));
                        }}
                        className="text-amber-400 hover:text-rose-400 hover:bg-rose-500/20 rounded p-0.5 ml-0.5 transition-colors cursor-pointer"
                        title="إزالة هذا العامود"
                      >
                        ✕
                      </button>
                    </span>
                  ));
                })()}
              </div>

              {/* Quick Add / Toggle Buttons */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 block mb-1.5">إضافة سريعة أو تبديل الأعمدة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { col: "B", label: "رقم التسجيل (B)" },
                    { col: "C", label: "اسم المشترك (C)" },
                    { col: "A", label: "تاريخ التسجيل (A)" },
                    { col: "F", label: "رقم الهاتف (F)" },
                    { col: "E", label: "البريد (E)" },
                    { col: "D", label: "سؤال 1 (D)" }
                  ].map((item) => {
                    const currentCols = (config.qrCodeColumns || "")
                      .split(/[,\s+]+/)
                      .map(c => c.trim().toUpperCase())
                      .filter(Boolean);
                    const isSelected = currentCols.includes(item.col);

                    return (
                      <button
                        key={item.col}
                        type="button"
                        onClick={() => {
                          let newCols: string[];
                          if (isSelected) {
                            newCols = currentCols.filter(c => c !== item.col);
                          } else {
                            newCols = [...currentCols, item.col];
                          }
                          setConfig(prev => ({ ...prev, qrCodeColumns: newCols.join(", ") }));
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                        }`}
                      >
                        <span>{isSelected ? "✓" : "+"}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                💡 يمكنك كتابة أي حروف أعمدة مفصولة بفواصل (مثل: <code className="text-amber-300 font-mono">B, C</code> أو <code className="text-amber-300 font-mono">B, C, F</code>) ليتم دمج قيمها معاً داخل رمز الـ QR Code لضمان قراءة كامل التفاصيل عند المسح بالهاتف.
              </p>
            </div>

            {/* QR Drive URL Column */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>عامود تسجيل رابط صورة الـ QR في Google Drive:</span>
                <span className="text-[10px] text-amber-400 font-mono">افتراضي: O</span>
              </label>
              <input
                type="text"
                value={config.qrDriveUrlColumn}
                onChange={(e) => setConfig(prev => ({ ...prev, qrDriveUrlColumn: e.target.value.toUpperCase().trim() }))}
                placeholder="O"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm font-mono text-amber-200 text-center uppercase focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400">
                العامود في الشيت الذي سيُحفظ فيه تلقائياً الرابط السحابي لصورة الـ QR Code المنشأة في Google Drive.
              </p>
            </div>

            {/* Include QR in Email Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeQrInEmail !== false}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeQrInEmail: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    تضمين صورة رمز الـ QR Code مباشرة داخل رسالة الإيميل
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    تظهر بطاقة رقمية أنيقة تحتوي على الرمز المربع مع رابط حفظ النسخة بدقة عالية من Google Drive.
                  </span>
                </div>
              </label>
            </div>

          </div>

          {/* Live QR Encoding & Visual Preview Box */}
          <div className="lg:col-span-5 bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">المعاينة الحية لتشفير الـ QR</span>
                  <span className="text-[10px] text-amber-400">تحديث فوري حسب الأعمدة المختارة</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                Live QR
              </span>
            </div>

            {/* Simulated Encoded Text */}
            {(() => {
              const cols = (config.qrCodeColumns || "")
                .split(/[,\s+]+/)
                .map(c => c.trim().toUpperCase())
                .filter(Boolean);

              const sampleData: Record<string, string> = {
                "A": "2026/08/26 - 10:30 ص",
                "B": "REG-202686124",
                "C": "أحمد مصطفى الفهد",
                "D": "دورة الخط الكوفي والثلث",
                "E": "subscriber@example.com",
                "F": "+9647701234567",
                "G": "المستوى المتقدم"
              };

              let parts: string[] = [];
              if (cols.length > 0) {
                parts = cols.map(c => sampleData[c] || `بيانات (${c})`);
              } else {
                parts = ["REG-202686124", "أحمد مصطفى الفهد"];
              }

              const encodedString = parts.join(" - ");
              const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(encodedString)}&size=160&margin=1`;

              return (
                <div className="space-y-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-semibold">النص والبيانات المشفرة داخل الـ QR:</span>
                    <p className="text-xs text-amber-300 font-mono break-all leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-800">
                      {encodedString}
                    </p>
                  </div>

                  {/* Visual QR Image */}
                  <div className="text-center bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="inline-block p-2 bg-white rounded-xl shadow-md">
                      <img
                        src={qrUrl}
                        alt="Live QR Preview"
                        className="w-28 h-28 mx-auto object-contain"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>متوافق مع جميع أجهزة وقارئات QR Code</span>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>

      {/* SECTION 4: Email Message Templates (Multilingual) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>4. قالب ورسالة الإيميل بلغات متعددة</span>
          </div>

          <button
            type="button"
            onClick={handleAutoTranslate}
            disabled={isTranslating}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isTranslating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>جاري الترجمة بالذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>ترجمة الرسالة بالذكاء الاصطناعي (AI)</span>
              </>
            )}
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveLangTab("ar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeLangTab === "ar"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>🇸🇦 العربية (الأساسي)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLangTab("en")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeLangTab === "en"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>🇬🇧 English</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLangTab("th")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeLangTab === "th"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>🇹🇭 ภาษาไทย</span>
          </button>
        </div>

        {/* Template Inputs */}
        <div className="space-y-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              عنوان الرسالة (Subject):
            </label>
            <input
              type="text"
              value={currentMsg.subject}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                messages: {
                  ...prev.messages,
                  [activeLangTab]: {
                    ...prev.messages[activeLangTab],
                    subject: e.target.value
                  }
                }
              }))}
              placeholder="تأكيد تسجيلك في منصة مؤسسة يوسف ذنون..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
            />
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              الترويسة الترحيبية داخل الإيميل (Header):
            </label>
            <input
              type="text"
              value={currentMsg.header}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                messages: {
                  ...prev.messages,
                  [activeLangTab]: {
                    ...prev.messages[activeLangTab],
                    header: e.target.value
                  }
                }
              }))}
              placeholder="مرحباً بك في مؤسسة يوسف ذنون للخط العربي"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200">
                نص الرسالة الأساسي (Email Body):
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>إدراج متغير:</span>
                <button
                  type="button"
                  onClick={() => insertVariableIntoBody("{name}")}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-mono text-[10px]"
                >
                  {"{name}"}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariableIntoBody("{id}")}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-mono text-[10px]"
                >
                  {"{id}"}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariableIntoBody("{date}")}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-mono text-[10px]"
                >
                  {"{date}"}
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={currentMsg.body}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                messages: {
                  ...prev.messages,
                  [activeLangTab]: {
                    ...prev.messages[activeLangTab],
                    body: e.target.value
                  }
                }
              }))}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-slate-100 leading-relaxed focus:outline-none transition-colors"
            />
          </div>

          {/* Footer Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              الملاحظة السفلية أو الإرشادات (Footer Note):
            </label>
            <input
              type="text"
              value={currentMsg.footerNote}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                messages: {
                  ...prev.messages,
                  [activeLangTab]: {
                    ...prev.messages[activeLangTab],
                    footerNote: e.target.value
                  }
                }
              }))}
              placeholder="يرجى الاحتفاظ برمز الاستجابة السريعة (QR Code)..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Attachments & Links */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
            <Paperclip className="w-4 h-4 text-amber-400" />
            <span>5. المرفقات والروابط التوضيحية (Attachments & Resource Links)</span>
          </div>

          <button
            type="button"
            onClick={addAttachment}
            className="self-start sm:self-auto px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مرفق / رابط جديد</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          الصور تُعرض مباشرة كمعاينة بصرية داخل الإيميل، بينما روابط الملفات (PDF أو المنهاج) تظهر كأزرار تحميل أنيقة وواضحة للمشترك:
        </p>

        {/* Attachments List */}
        <div className="space-y-3">
          {(config.attachments || []).map((att, idx) => (
            <div
              key={att.id || idx}
              className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  {att.type === "image" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  <span>المرفق رقم {idx + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Title */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">عنوان المرفق أو نص الزر (عربي):</span>
                  <input
                    type="text"
                    value={att.title}
                    onChange={(e) => updateAttachment(att.id, { title: e.target.value })}
                    placeholder="مثال: دليل المشترك ومنهاج الدورات"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* URL */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">الرابط السحابي (URL):</span>
                  <input
                    type="url"
                    value={att.url}
                    onChange={(e) => updateAttachment(att.id, { url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">طريقة العرض في الإيميل:</span>
                  <select
                    value={att.type}
                    onChange={(e) => updateAttachment(att.id, { type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="file_button">📄 زر فتح / تحميل ملف (PDF / Word)</option>
                    <option value="image">🖼️ صورة مضمنة تظهر مباشرة</option>
                    <option value="link">🔗 رابط موقع خارجي</option>
                  </select>
                </div>
              </div>

              {/* Image Live Preview Thumbnail for Google Drive / Web links */}
              {att.type === "image" && att.url && (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3">
                  <img
                    src={toDirectImageUrl(att.url)}
                    alt={att.title || "معاينة الصورة"}
                    className="w-14 h-14 object-cover rounded-lg border border-slate-700 bg-slate-950 shrink-0 shadow"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="text-[11px] text-slate-300 space-y-0.5 overflow-hidden">
                    <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>معاينة الصورة المضمنة:</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[10px] truncate max-w-md">
                      {toDirectImageUrl(att.url)}
                    </div>
                    {att.url.includes("drive.google.com") && (
                      <div className="text-emerald-400 text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> 
                        <span>تم تحويل رابط Google Drive بنجاح لعرض الصورة المباشرة في الإيميل</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: Realistic Interactive Live Email Preview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>6. معاينة حية لشكل الإيميل النهائي للمشترك (Live Email Preview)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPreviewLang("ar")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                previewLang === "ar" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang("en")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                previewLang === "en" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang("th")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                previewLang === "th" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ภาษาไทย
            </button>
          </div>
        </div>

        {/* Email Simulation Container */}
        <div className="bg-[#090d16] border border-slate-700/80 rounded-2xl p-4 md:p-6 max-w-xl mx-auto shadow-2xl space-y-4">
          
          {/* Mock Client Header */}
          <div className="border-b border-slate-800 pb-3 text-xs space-y-1 text-slate-400">
            <div className="flex items-center justify-between">
              <div><strong className="text-slate-300">من:</strong> إدارة مؤسسة يوسف ذنون &lt;noreply@thnoon.org&gt;</div>
              <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded">بريد رسمي</span>
            </div>
            <div><strong className="text-slate-300">إلى:</strong> طالب العلم &lt;subscriber@example.com&gt;</div>
            <div className="text-amber-300 font-semibold pt-1">
              <strong>الموضوع:</strong> {previewMsg.subject || "تأكيد تسجيلك في منصة مؤسسة يوسف ذنون"}
            </div>
          </div>

          {/* Email Body Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-center border-b-2 border-amber-500 space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[11px] font-bold">
                {previewLang === "en" ? "Official Registration Pass" : (previewLang === "th" ? "บัตรยืนยันการลงทะเบียน" : "بطاقة التسجيل والاشتراك المعتمدة")}
              </span>
              <h4 className="text-base font-bold text-slate-100 font-serif">
                {previewMsg.header}
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                أحمد مصطفى الفهد | {previewLang === "en" ? "Reg ID:" : "رقم القيد:"} <span className="text-amber-400 font-bold">202686124</span>
              </p>
            </div>

            {/* Content Area */}
            <div className="p-5 space-y-5 text-xs text-slate-200 leading-relaxed">
              <p>
                {previewMsg.body
                  .replace(/{name}/g, "أحمد مصطفى الفهد")
                  .replace(/{id}/g, "202686124")
                  .replace(/{email}/g, "subscriber@example.com")
                  .replace(/{date}/g, "2026/08/24 - 10:30 ص")}
              </p>

              {/* Data Table */}
              <div className="space-y-2">
                <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{previewLang === "en" ? "📋 Registration & Access Details" : (previewLang === "th" ? "📋 ข้อมูลการลงทะเบียน" : "📋 بيانات التسجيل والدخول المعتمدة")}</span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      {config.dataFields.map((f, i) => (
                        <tr key={i} className="border-b border-slate-800/80 last:border-0">
                          <td className="p-2.5 bg-slate-950/80 text-slate-400 font-semibold w-2/5">
                            {previewLang === "en" ? (f.labelEn || f.label) : (previewLang === "th" ? (f.labelTh || f.label) : f.label)}
                          </td>
                          <td className="p-2.5 bg-slate-900/90 text-slate-200 font-medium">
                            {f.columnLetter === "LOGIN_URL" ? (
                              <span className="text-amber-400 font-bold underline">صفحة منصة المشتركين ↗</span>
                            ) : f.label.includes("رقم") ? (
                              <span className="font-mono text-amber-300">202686124</span>
                            ) : f.label.includes("اسم") ? (
                              "أحمد مصطفى الفهد"
                            ) : f.label.includes("تاريخ") ? (
                              "2026/08/24 - 10:30 ص"
                            ) : (
                              "قيمة تجريبية"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QR Code Pass Card */}
              {config.includeQrInEmail !== false && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-center space-y-2.5">
                  <span className="text-[11px] font-bold text-amber-400 block">
                    {previewLang === "en" ? "📱 Your Digital Access Pass (QR Code)" : (previewLang === "th" ? "📱 บัตรดิจิทัลและรหัส QR Code" : "📱 رمز الاستجابة السريعة (بطاقة الدخول الذكية)")}
                  </span>
                  <div className="inline-block p-2 bg-white rounded-lg shadow-md">
                    <img
                      src="https://quickchart.io/qr?text=YOUSUF-DHANNOON-REG:202686124&size=140&margin=1"
                      alt="QR Code"
                      className="w-28 h-28 mx-auto"
                    />
                  </div>
                  <div className="text-[10px] text-amber-400/90 underline">
                    🔗 حفظ نسخة بدقة عالية من Google Drive
                  </div>
                </div>
              )}

              {/* Attachments */}
              {(config.attachments || []).length > 0 && (
                <div className="border-t border-slate-800 pt-3 space-y-2 text-center">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    📁 المرفقات والروابط التوضيحية
                  </span>
                  <div className="flex flex-col gap-3 items-center">
                    {config.attachments.map((att, i) => (
                      att.type === "image" ? (
                        <div key={i} className="text-center space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold">{att.title}</span>
                          <img 
                            src={toDirectImageUrl(att.url)} 
                            alt={att.title} 
                            className="max-w-[200px] max-h-48 object-contain rounded-lg border border-slate-700 mx-auto shadow"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                      ) : (
                        <a
                          key={i}
                          href="#preview"
                          onClick={(e) => e.preventDefault()}
                          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs shadow-md inline-flex items-center gap-1.5"
                        >
                          <span>📥 {att.title}</span>
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Note */}
              {previewMsg.footerNote && (
                <div className="p-3 bg-amber-500/10 border-r-2 border-amber-500 rounded-lg text-[11px] text-amber-300/90 leading-relaxed">
                  ℹ️ {previewMsg.footerNote}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-3 text-center text-[10px] text-slate-500 border-t border-slate-800">
              مؤسسة يوسف ذنون للخط العربي والتربية الفنية © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 7: Live Test & Verification Runner */}
      <div className="bg-slate-900/90 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm border-b border-slate-800 pb-3">
          <Send className="w-4 h-4 text-amber-400" />
          <span>7. اختبار إرسال الإيميل الفعلي وتوليد الـ QR Code (Live Dispatch Test)</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          يمكنك إرسال رسالة بريد إلكتروني تجريبية فورية للتحقق من وصول الرسالة للمشترك، والتأكد من توليد الـ QR Code وحفظه في قوقل درايف، وظهور الصور بشكل سليم:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">البريد الإلكتروني المستلم للتجربة:</label>
            <input
              type="email"
              value={testRecipientEmail}
              onChange={(e) => setTestRecipientEmail(e.target.value)}
              placeholder="shyk4test2020@gmail.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">اسم المشترك التجريبي:</label>
            <input
              type="text"
              value={testRecipientName}
              onChange={(e) => setTestRecipientName(e.target.value)}
              placeholder="مشترك تجريبي"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={isSendingTest}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSendingTest ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري إرسال الإيميل التجريبي والـ QR Code...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>إرسال إيميل تجريبي الآن 🚀</span>
              </>
            )}
          </button>
        </div>

        {/* Test Result Message */}
        {testResponse && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            testResponse.success 
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}>
            <div className="font-bold flex items-center gap-2">
              {testResponse.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{testResponse.message || "تم إرسال الإيميل التجريبي وتوليد الـ QR Code بنجاح!"}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>فشل إرسال الإيميل: {testResponse.error || testResponse.message || "حدث خطأ غير معروف"}</span>
                </>
              )}
            </div>

            {testResponse.recipient && (
              <div className="text-[11px] text-slate-300 font-mono">
                المستلم: <span className="text-amber-300">{testResponse.recipient}</span>
              </div>
            )}

            {testResponse.qrDriveUrl && (
              <div className="text-[11px] pt-1">
                <a
                  href={testResponse.qrDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline font-semibold flex items-center gap-1 hover:text-amber-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>عرض ملف الـ QR Code الذي تم حفظه على Google Drive ↗</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Permission tip box */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>ملاحظة هامة لتفويض الصلاحيات (MailApp Permission):</span>
          </div>
          <p className="leading-relaxed">
            عند تحديث كود <strong className="text-slate-100 font-mono">Code.gs</strong> في قوقل شيت لأول مرة لاستخدام ميزة إرسال الإيميلات، يحتاج Google Apps Script إلى منحه إذن إرسال البريد وحفظ الملفات في الدرايف. يمكنك فتح محرر Google Apps Script واختيار الدالة <span className="text-amber-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">testSendSubscriberEmailDirectly</span> والضغط على <strong className="text-slate-100">تشغيل (Run)</strong> للموافقة على إذن الإرسال بنقرة واحدة.
          </p>
        </div>
      </div>

      {/* Save Button Floating Bar */}
      <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl z-20">
        <div className="text-xs text-slate-400 flex items-center gap-2 w-full sm:w-auto">
          {saveSuccess ? (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم حفظ وتحديث إعدادات إيميل المشترك بنجاح! ⚡</span>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>احرص على حفظ الإعدادات بعد تعديل الحقول لتطبيقها في الشيت وتحديث ملفات التكوين.</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`px-7 py-3 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
            saveSuccess
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/40 ring-2 ring-emerald-500/50"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-900/30"
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جاري حفظ الإعدادات...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>تم الحفظ بنجاح! ✓</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات إيميل المشترك</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
