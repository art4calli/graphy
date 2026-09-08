import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  UserCheck,
  Send,
  Upload,
  Camera,
  Check,
  AlertCircle,
  AlertTriangle,
  Share2,
  ExternalLink,
  Maximize2,
  Sparkles,
  Phone,
  Mail,
  Hash,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  RotateCw,
  RefreshCw,
  Loader2,
  File,
  Trash2,
  Folder,
  Languages,
  Globe
} from "lucide-react";
import { RegistrationQuestion, QuestionTranslation } from "../types";
import { DEFAULT_FORM_TRANSLATIONS } from "../data/defaultFormTranslations";
import { getSavedFormQuestions, DEFAULT_CONFIGURED_QUESTIONS } from "../data/configuredFormQuestions";
import { formatImageUrl } from "../utils/imageUtils";
import {
  submitRegistrationBridge,
  uploadFileToDriveBridge,
  fetchFormQuestionsBridge,
  DEFAULT_SCRIPT_URL,
  DEFAULT_DRIVE_FOLDER_ID
} from "../utils/googleBackendBridge";

export type FormLang = "ar" | "en" | "th";

export const FORM_UI_STRINGS = {
  ar: {
    title: "استمارة تسجيل المشتركين والطلاب",
    subtitle: "يرجى تعبئة الحقول والأسئلة التالية بدقة لتفعيل حسابك وإتاحة المحتوى والدروس الخاصة بك.",
    shareForm: "رابط الاستمارة",
    linkCopied: "تم نسخ الرابط!",
    syncingQuestions: "( جاري التحميل )",
    requiredBadge: "مطلوب",
    optionalBadge: "(اختياري)",
    explainingLink: "رابط توضيحي",
    uploadFileOrPhoto: "رفع ملف / صورة (Word, PDF, صور)",
    directCameraPhoto: "تصوير مباشر (كاميرا)",
    uploadingDrive: "جاري رفع الملف إلى مجلد Google Drive السحابي...",
    savedInDrive: "تم الحفظ في Google Drive",
    openDrive: "فتح في Google Drive",
    deleteFile: "حذف الملف",
    placeholderAnswer: "اكتب إجابتك هنا...",
    placeholderNumber: "أدخل رقماً...",
    placeholderPhone: "+964 770 000 0000",
    placeholderEmail: "name@example.com",
    placeholderUrl: "https://...",
    validationAlertTitle: "تنبيه: يوجد {count} حقول إجبارية لم يتم استكمالها!",
    validationAlertDesc: "تم تفعيل إجبار الإجابة لهذه الأسئلة. انقر على أي حقل أدناه للانتقال إليه فوراً وتعبئته:",
    fieldRequiredError: "حقل «{name}» إجباري، يرجى تعبئته أو إرفاق المطلوب",
    numberInvalidError: "يرجى إدخال أرقام صحيحة فقط",
    phoneInvalidError: "رقم الهاتف غير صحيح أو ناقص",
    emailInvalidError: "صيغة البريد الإلكتروني غير صحيحة",
    urlInvalidError: "الرابط يجب أن يبدأ بـ https:// أو http://",
    submitBtn: "إرسال طلب التسجيل والاشتراك",
    submittingBtn: "جاري إرسال وحفظ طلب التسجيل...",
    successTitle: "تم استلام طلب التسجيل بنجاح!",
    successDesc: "تم حفظ بياناتك وإجاباتك بنجاح في النظام، وسيقوم المشرف بمراجعة الطلب والتواصل معك لتفعيل الحساب.",
    closeSuccessBtn: "إغلاق والعودة للموقع",
    cameraPreviewTitle: "معاينة الصورة الملتقطة",
    cameraLiveTitle: "تصوير مباشر بالكاميرا",
    cameraPreviewSub: "تأكد من وضوح الصورة قبل الاعتماد",
    cameraLiveSub: "متوافق مع كاميرا الكمبيوتر، الجوال، والتابلت",
    cameraRetake: "إعادة التقاط",
    cameraConfirm: "اعتماد الصورة واستخدامها",
    cameraShutter: "التقاط الصورة",
    cameraPickFile: "ملف من الجهاز",
    cameraSwitch: "تبديل الكاميرا",
    zoomImage: "تكبير الصورة"
  },
  en: {
    title: "Student & Subscriber Registration Form",
    subtitle: "Please complete the following fields carefully to activate your membership and access your courses.",
    shareForm: "Form Link",
    linkCopied: "Link Copied!",
    syncingQuestions: "Loading...",
    requiredBadge: "Required",
    optionalBadge: "(Optional)",
    explainingLink: "Guide Link",
    uploadFileOrPhoto: "Upload File / Photo (PDF, Word, Images)",
    directCameraPhoto: "Live Camera Capture",
    uploadingDrive: "Uploading file to Google Drive cloud storage...",
    savedInDrive: "Saved in Google Drive",
    openDrive: "Open in Google Drive",
    deleteFile: "Delete file",
    placeholderAnswer: "Type your answer here...",
    placeholderNumber: "Enter number...",
    placeholderPhone: "+1 234 567 8900",
    placeholderEmail: "name@example.com",
    placeholderUrl: "https://...",
    validationAlertTitle: "Notice: {count} required fields are incomplete!",
    validationAlertDesc: "These fields are marked as required. Click on any field below to jump and fill it:",
    fieldRequiredError: "The field \"{name}\" is required. Please provide an answer.",
    numberInvalidError: "Please enter a valid numeric value",
    phoneInvalidError: "Invalid phone number format",
    emailInvalidError: "Invalid email address format",
    urlInvalidError: "URL must start with http:// or https://",
    submitBtn: "Submit Registration Application",
    submittingBtn: "Submitting and saving registration...",
    successTitle: "Registration Submitted Successfully!",
    successDesc: "Your registration information has been recorded. Our administrator will review your application shortly.",
    closeSuccessBtn: "Close & Return to Home",
    cameraPreviewTitle: "Captured Photo Preview",
    cameraLiveTitle: "Direct Camera Capture",
    cameraPreviewSub: "Please make sure the photo is clear before confirming",
    cameraLiveSub: "Works on desktop webcams, smartphones, and tablets",
    cameraRetake: "Retake Photo",
    cameraConfirm: "Accept & Use Photo",
    cameraShutter: "Capture Photo",
    cameraPickFile: "Choose from Device",
    cameraSwitch: "Switch Camera",
    zoomImage: "Zoom Image"
  },
  th: {
    title: "แบบฟอร์มลงทะเบียนสมาชิกและนักเรียน",
    subtitle: "กรุณากรอกข้อมูลในช่องต่อไปนี้ให้ครบถ้วนเพื่อเปิดใช้งานบัญชีและเข้าถึงบทเรียนของคุณ",
    shareForm: "ลิงก์แบบฟอร์ม",
    linkCopied: "คัดลอกลิงก์แล้ว!",
    syncingQuestions: "กำลังโหลด...",
    requiredBadge: "จำเป็น",
    optionalBadge: "(ไม่บังคับ)",
    explainingLink: "ลิงก์คำแนะนำ",
    uploadFileOrPhoto: "อัปโหลดไฟล์ / รูปภาพ (PDF, Word, รูปภาพ)",
    directCameraPhoto: "ถ่ายภาพสดด้วยกล้อง",
    uploadingDrive: "กำลังอัปโหลดไฟล์ไปยัง Google Drive...",
    savedInDrive: "บันทึกใน Google Drive แล้ว",
    openDrive: "เปิดใน Google Drive",
    deleteFile: "ลบไฟล์",
    placeholderAnswer: "กรอกคำตอบของคุณที่นี่...",
    placeholderNumber: "กรอกตัวเลข...",
    placeholderPhone: "+66 81 234 5678",
    placeholderEmail: "name@example.com",
    placeholderUrl: "https://...",
    validationAlertTitle: "แจ้งเตือน: มี {count} ช่องบังคับที่ยังไม่ได้กรอก!",
    validationAlertDesc: "คำถามเหล่านี้จำเป็นต้องตอบ คลิกที่ชื่อคำถามด้านล่างเพื่อไปยังช่องนั้นทันที:",
    fieldRequiredError: "ช่อง \"{name}\" เป็นช่องบังคับ กรุณากรอกข้อมูล",
    numberInvalidError: "กรุณากรอกเฉพาะตัวเลขที่ถูกต้อง",
    phoneInvalidError: "หมายเลขโทรศัพท์ไม่ถูกต้อง",
    emailInvalidError: "รูปแบบอีเมลไม่ถูกต้อง",
    urlInvalidError: "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://",
    submitBtn: "ส่งใบสมัครลงทะเบียน",
    submittingBtn: "กำลังบันทึกและส่งใบสมัคร...",
    successTitle: "ส่งใบสมัครลงทะเบียนสำเร็จแล้ว!",
    successDesc: "บันทึกข้อมูลและคำตอบของคุณในระบบเรียบร้อยแล้ว ผู้ดูแลระบบจะตรวจสอบและติดต่อกลับเพื่อเปิดใช้งานบัญชี",
    closeSuccessBtn: "ปิดหน้าต่างและกลับสู่หน้าหลัก",
    cameraPreviewTitle: "ตัวอย่างภาพที่ถ่าย",
    cameraLiveTitle: "ถ่ายภาพสดด้วยกล้อง",
    cameraPreviewSub: "กรุณาตรวจสอบความชัดเจนของภาพก่อนกดยืนยัน",
    cameraLiveSub: "รองรับทั้งกล้องคอมพิวเตอร์ โทรศัพท์มือถือ และแท็บเล็ต",
    cameraRetake: "ถ่ายใหม่",
    cameraConfirm: "ยืนยันและใช้รูปภาพนี้",
    cameraShutter: "กดถ่ายภาพ",
    cameraPickFile: "เลือกไฟล์จากอุปกรณ์",
    cameraSwitch: "สลับกล้อง",
    zoomImage: "ขยายรูปภาพ"
  }
};

export function normalizeArabicText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[؟?!\.,:;،\-–—_()\[\]{}"'״]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function getQuestionTranslation(
  q: RegistrationQuestion,
  customMap?: Record<string, any>
): QuestionTranslation | undefined {
  if (q.translations && (q.translations.questionEn || q.translations.questionTh)) {
    return q.translations;
  }

  let map = customMap;
  if (!map && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("thnoon_form_translations");
      if (stored) map = JSON.parse(stored);
    } catch (e) {}
  }

  if (map && typeof map === "object") {
    const qText = (q.question || "").trim();
    if (qText && map[qText]) return map[qText];
    if (q.id && map[String(q.id)]) return map[String(q.id)];

    const normTarget = normalizeArabicText(qText);
    if (normTarget) {
      for (const [k, v] of Object.entries(map)) {
        if (normalizeArabicText(k) === normTarget) return v;
      }
      for (const [k, v] of Object.entries(map)) {
        const normKey = normalizeArabicText(k);
        if (normKey && (normTarget.includes(normKey) || normKey.includes(normTarget))) {
          return v;
        }
      }
    }
  }

  // Built-in emergency fallbacks for common standard registration fields
  const qText = (q.question || "").trim();
  const normTarget = normalizeArabicText(qText);
  const fallbackDict: Record<string, QuestionTranslation> = {
    ...DEFAULT_FORM_TRANSLATIONS,
    "الاسم": { questionEn: "Full Name", questionTh: "ชื่อ-นามสกุล", descriptionEn: "Please write your full name as shown on your ID", descriptionTh: "กรุณาระบุชื่อ-นามสกุลเต็มตามที่ปรากฏบนบัตรประจำตัว" },
    "الاسم بالعربي": { questionEn: "Name in Arabic", questionTh: "ชื่อภาษาอาหรับ", descriptionEn: "Your name in Arabic (if any)", descriptionTh: "ชื่อของคุณเป็นภาษาอาหรับ (ถ้ามี)" },
    "العمر": { questionEn: "Age", questionTh: "อายุ", descriptionEn: "Age in years (numbers only)", descriptionTh: "อายุเป็นปี (ตัวเลขเท่านั้น)" },
    "رقم الهاتف": { questionEn: "Phone Number", questionTh: "หมายเลขโทรศัพท์", descriptionEn: "Phone or WhatsApp number with country code", descriptionTh: "เบอร์โทรศัพท์หรือ WhatsApp พร้อมรหัสประเทศ" },
    "ايميل": { questionEn: "Email", questionTh: "อีเมล", descriptionEn: "Your approved email to receive notifications", descriptionTh: "อีเมลที่ใช้สำหรับรับการแจ้งเตือน" },
    "البريد الالكتروني": { questionEn: "Email", questionTh: "อีเมล", descriptionEn: "Your approved email to receive notifications", descriptionTh: "อีเมลที่ใช้สำหรับรับการแจ้งเตือน" },
    "ID Line": { questionEn: "Line ID", questionTh: "LINE ID", descriptionEn: "Your Line ID for quick communication", descriptionTh: "LINE ID ของคุณสำหรับการติดต่ออย่างรวดเร็ว" },
    "فيس بوك": { questionEn: "Facebook", questionTh: "Facebook", descriptionEn: "Link or name of your Facebook account", descriptionTh: "ลิงก์หรือชื่อบัญชี Facebook ของคุณ" },
    "صورة": { questionEn: "Image", questionTh: "รูปภาพ" },
    "رفع ملف": { questionEn: "Upload File", questionTh: "อัปโหลดไฟล์" }
  };

  for (const [k, v] of Object.entries(fallbackDict)) {
    if (normTarget && (normalizeArabicText(k) === normTarget || normTarget.includes(normalizeArabicText(k)))) {
      return v;
    }
  }

  return undefined;
}

export function getLocalizedQuestionTitle(q: RegistrationQuestion, lang: FormLang, customMap?: Record<string, any>): string {
  if (lang === "ar") return q.question;
  const trans = getQuestionTranslation(q, customMap);
  if (lang === "en" && trans?.questionEn?.trim()) {
    return trans.questionEn.trim();
  }
  if (lang === "th" && trans?.questionTh?.trim()) {
    return trans.questionTh.trim();
  }
  return q.question;
}

export function getLocalizedQuestionDescription(q: RegistrationQuestion, lang: FormLang, customMap?: Record<string, any>): string | undefined {
  if (lang === "ar") return q.description;
  const trans = getQuestionTranslation(q, customMap);
  if (lang === "en" && trans?.descriptionEn?.trim()) {
    return trans.descriptionEn.trim();
  }
  if (lang === "th" && trans?.descriptionTh?.trim()) {
    return trans.descriptionTh.trim();
  }
  return q.description;
}

export function getLocalizedQuestionOptions(q: RegistrationQuestion, lang: FormLang, customMap?: Record<string, any>): string[] {
  if (lang === "ar") return q.options || [];
  const trans = getQuestionTranslation(q, customMap);
  if (lang === "en" && trans?.optionsEn && trans.optionsEn.length > 0) {
    return trans.optionsEn;
  }
  if (lang === "th" && trans?.optionsTh && trans.optionsTh.length > 0) {
    return trans.optionsTh;
  }
  return q.options || [];
}

export const DEFAULT_ACTIVE_QUESTIONS: RegistrationQuestion[] = [];

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions?: RegistrationQuestion[];
  scriptUrl?: string;
  spreadsheetId?: string;
  driveFolderId?: string;
}

export default function RegistrationModal({
  isOpen,
  onClose,
  questions: propQuestions,
  scriptUrl,
  spreadsheetId,
  driveFolderId = "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7"
}: RegistrationModalProps) {
  const [questions, setQuestions] = useState<RegistrationQuestion[]>(() => {
    if (propQuestions && propQuestions.length > 0) return propQuestions;
    return getSavedFormQuestions();
  });
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("ترجمة ولغات الاستمارة");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadedFileInfo, setUploadedFileInfo] = useState<
    Record<string, { name: string; url?: string; size?: string; isImage?: boolean; driveFileUrl?: string }>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ id?: string; message?: string }>({});
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [customButtonTitle, setCustomButtonTitle] = useState<string>("إرسال طلب التسجيل والاشتراك");
  const [translationsMap, setTranslationsMap] = useState<Record<string, any>>(() => {
    let base = { ...DEFAULT_FORM_TRANSLATIONS };
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thnoon_form_translations");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            base = { ...base, ...parsed };
          }
        }
      } catch (e) {}
    }
    return base;
  });

  // Real-time synchronization when translations are updated in Settings
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleSync = (e: any) => {
      if (e.detail && typeof e.detail === "object") {
        setTranslationsMap((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("thnoon_translations_updated", handleSync);
    return () => window.removeEventListener("thnoon_translations_updated", handleSync);
  }, []);

  // Multilingual State: 'ar' | 'en' | 'th'
  const [formLang, setFormLang] = useState<FormLang>(() => {
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const l = urlParams.get("lang");
        if (l === "en" || l === "th" || l === "ar") return l;
      } catch (e) {
        // ignore
      }
    }
    return "ar";
  });

  const modalBodyRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top when opening or changing language
  useEffect(() => {
    if (isOpen && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [isOpen, formLang]);

  const t = FORM_UI_STRINGS[formLang];

  const handleCopyDirectLink = () => {
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("register", "true");
      currentUrl.searchParams.set("lang", formLang);
      navigator.clipboard.writeText(currentUrl.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn("Clipboard error:", e);
    }
  };

  // Camera Live Modal States
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [activeCameraFieldKey, setActiveCameraFieldKey] = useState<string | null>(null);
  const activeCameraFieldKeyRef = useRef<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // File input refs for trigger
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cameraInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Sync camera stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream, isCameraModalOpen, capturedPhotoUrl]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async (facing: "user" | "environment" = "environment") => {
    setCameraError(null);
    setCapturedPhotoUrl(null);

    // Stop existing stream if running
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("المتصفح الحالي لا يدعم فتح الكاميرا المباشرة");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
      } catch {
        // Fallback for laptops and desktop webcams without facingMode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setCameraStream(stream);
      setCameraFacingMode(facing);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Camera access warning:", err);
      setCameraError("تعذر الوصول المباشر لكاميرا الجهاز. يمكنك السماح بالوصول للكاميرا من إعدادات المتصفح أو اختيار صورة من جهازك.");
    }
  };

  const openCameraModal = async (fieldKey: string) => {
    activeCameraFieldKeyRef.current = fieldKey;
    setActiveCameraFieldKey(fieldKey);
    setIsCameraModalOpen(true);
    setCapturedPhotoUrl(null);
    setCameraError(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      await startCamera(cameraFacingMode);
    } else {
      setIsCameraModalOpen(false);
      cameraInputRefs.current[fieldKey]?.click();
    }
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraModalOpen(false);
    setActiveCameraFieldKey(null);
    setCapturedPhotoUrl(null);
    setCameraError(null);
  };

  // Fast client-side image compressor: scales high-res camera / file images to max 1280px and quality 0.78
  // Reduces upload size from 8MB to ~150KB in under 20 milliseconds!
  const compressImage = async (source: string | HTMLVideoElement | File, maxWidth = 1280, maxHeight = 1280, quality = 0.78): Promise<string> => {
    return new Promise((resolve) => {
      try {
        if (source instanceof HTMLVideoElement) {
          const vWidth = source.videoWidth || 1280;
          const vHeight = source.videoHeight || 720;
          let targetW = vWidth;
          let targetH = vHeight;
          if (targetW > maxWidth || targetH > maxHeight) {
            const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
            targetW = Math.round(targetW * ratio);
            targetH = Math.round(targetH * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");
          if (cameraFacingMode === "user") {
            ctx.translate(targetW, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(source, 0, 0, targetW, targetH);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          return resolve(dataUrl);
        }

        if (source instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              let targetW = img.width;
              let targetH = img.height;
              if (targetW > maxWidth || targetH > maxHeight) {
                const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
                targetW = Math.round(targetW * ratio);
                targetH = Math.round(targetH * ratio);
              }
              const canvas = document.createElement("canvas");
              canvas.width = targetW;
              canvas.height = targetH;
              const ctx = canvas.getContext("2d");
              if (!ctx) return resolve(e.target?.result as string || "");
              ctx.drawImage(img, 0, 0, targetW, targetH);
              const compressed = canvas.toDataURL("image/jpeg", quality);
              resolve(compressed);
            };
            img.onerror = () => resolve(e.target?.result as string || "");
            img.src = e.target?.result as string;
          };
          reader.onerror = () => resolve("");
          reader.readAsDataURL(source);
          return;
        }

        if (typeof source === "string" && source.startsWith("data:image")) {
          const img = new Image();
          img.onload = () => {
            let targetW = img.width;
            let targetH = img.height;
            if (targetW > maxWidth || targetH > maxHeight) {
              const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
              targetW = Math.round(targetW * ratio);
              targetH = Math.round(targetH * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(source);
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          };
          img.onerror = () => resolve(source);
          img.src = source;
          return;
        }

        resolve(typeof source === "string" ? source : "");
      } catch (err) {
        console.warn("Image compression fallback:", err);
        resolve("");
      }
    });
  };

  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    try {
      const compressedDataUrl = await compressImage(video, 1280, 1280, 0.78);
      if (compressedDataUrl) {
        setCapturedPhotoUrl(compressedDataUrl);
      }
    } catch (err) {
      console.error("Take snapshot error:", err);
    }
  };

  const retakeSnapshot = () => {
    setCapturedPhotoUrl(null);
    if (!cameraStream) {
      startCamera(cameraFacingMode);
    }
  };

  const confirmSnapshot = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const dataUrl = capturedPhotoUrl;
    if (!dataUrl) return;

    const targetKey =
      activeCameraFieldKey ||
      activeCameraFieldKeyRef.current ||
      questions.find((q) => q.type === "file" || q.type === "رفع ملف" || q.type === "ملف")?.question ||
      "رفع ملف";

    const fileName = `camera_${Date.now()}.jpg`;

    // 1. Instant UI update so user immediately sees their photo in the form
    setFilePreviews((prev) => ({ ...prev, [targetKey]: dataUrl }));
    setAnswers((prev) => ({ ...prev, [targetKey]: dataUrl }));
    setUploadedFileInfo((prev) => ({
      ...prev,
      [targetKey]: {
        name: fileName,
        size: "صورة ملتقطة (مضغوطة بجودة عالية)",
        isImage: true
      }
    }));

    // 2. Clear field error immediately
    if (errors[targetKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[targetKey];
        return next;
      });
    }

    // 3. Close modal immediately
    closeCameraModal();

    // 4. Background upload to Google Drive with lightweight compressed base64
    const base64Data = dataUrl.split(",")[1] || "";
    if (base64Data) {
      setUploadingFiles((prev) => ({ ...prev, [targetKey]: true }));
      const activeScriptUrl = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || "";

      uploadFileToDriveBridge(
        base64Data,
        fileName,
        "image/jpeg",
        driveFolderId || DEFAULT_DRIVE_FOLDER_ID,
        activeScriptUrl
      )
        .then((data) => {
          if (data && data.success && data.fileUrl) {
            setAnswers((prev) => ({ ...prev, [targetKey]: data.fileUrl }));
            setUploadedFileInfo((prev) => ({
              ...prev,
              [targetKey]: {
                name: fileName,
                url: data.fileUrl,
                driveFileUrl: data.fileUrl,
                size: "تم الرفع للدرايف بنجاح",
                isImage: true
              }
            }));
          }
        })
        .catch((err) => {
          console.warn("Direct drive upload error for snapshot:", err);
        })
        .finally(() => {
          setUploadingFiles((prev) => ({ ...prev, [targetKey]: false }));
        });
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    startCamera(nextMode);
  };

  // Listen to external translations & questions update events (from settings modal or storage)
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail;
      if (detail && detail.questions && Array.isArray(detail.questions) && detail.questions.length > 0) {
        processQuestions(detail.questions);
        return;
      }
      const updatedMap = (detail && !detail.questions) ? detail : {};
      if (updatedMap && Object.keys(updatedMap).length > 0) {
        setTranslationsMap(updatedMap);
        setQuestions((prev) =>
          prev.map((q) => {
            const trans = getQuestionTranslation(q, updatedMap);
            return trans ? { ...q, translations: trans } : q;
          })
        );
      }
    };
    window.addEventListener("thnoon_translations_updated", handler);
    return () => window.removeEventListener("thnoon_translations_updated", handler);
  }, []);

  // Load configured questions whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (propQuestions && propQuestions.length > 0) {
        processQuestions(propQuestions);
      } else {
        loadConfiguredQuestions();
      }
    }
  }, [isOpen, propQuestions]);

  const processQuestions = (rawQuestions: RegistrationQuestion[], customTrans?: Record<string, any>) => {
    const currentTrans = customTrans || translationsMap;

    // Check if there is a purely global submit button title item
    const pureButtonTitle = rawQuestions.find(
      (q) => (q.type === "button_title" || q.type === "عنوان زر") && !q.externalLink
    );
    if (pureButtonTitle) {
      setCustomButtonTitle(pureButtonTitle.question || "إرسال طلب التسجيل والاشتراك");
    }

    // Keep all questions except a pure submit-button title row without external link
    const fields = rawQuestions
      .filter((q) => !((q.type === "button_title" || q.type === "عنوان زر") && !q.externalLink))
      .map((q) => {
        const trans = getQuestionTranslation(q, currentTrans);
        return {
          ...q,
          translations: trans || q.translations
        };
      });

    if (fields.length > 0) {
      setQuestions(fields);
      setLoadError(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("thnoon_cached_registration_questions", JSON.stringify(fields));
        } catch (e) {}
      }
    }
  };

  /**
   * Loads form questions directly from configured translations module
   * As specified: The registration form never queries the Google Sheet directly
   */
  const loadConfiguredQuestions = () => {
    setIsLoadingQuestions(false);
    setLoadError(null);
    try {
      const configured = getSavedFormQuestions();
      if (configured && configured.length > 0) {
        processQuestions(configured);
        setDataSource("ترجمة ولغات الاستمارة");
      } else {
        processQuestions(DEFAULT_CONFIGURED_QUESTIONS);
        setDataSource("الأسئلة والترجمات المعتمدة");
      }
    } catch (err: any) {
      console.warn("Could not load configured questions:", err);
      processQuestions(DEFAULT_CONFIGURED_QUESTIONS);
    }
  };

  const fetchQuestions = async () => {
    loadConfiguredQuestions();
  };

  const handleInputChange = (fieldKey: string, value: string, questionText?: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [fieldKey]: value };
      if (questionText) {
        next[questionText] = value;
      }
      return next;
    });
    // Clear error for this field when user types
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const handleFileProcess = async (fieldKey: string, file: File) => {
    if (!file) return;

    const isImg = file.type.startsWith("image/");
    const fileSizeKB = (file.size / 1024).toFixed(1) + " KB";
    
    // Read and compress if image for instant preview and lightweight Drive upload
    try {
      let dataUrl = "";
      if (isImg) {
        dataUrl = await compressImage(file, 960, 960, 0.68);
      }
      if (!dataUrl) {
        dataUrl = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string || "");
          reader.onerror = () => res("");
          reader.readAsDataURL(file);
        });
      }

      const base64Data = dataUrl.split(",")[1] || "";

      if (isImg) {
        setFilePreviews((prev) => ({ ...prev, [fieldKey]: dataUrl }));
      }

      setUploadedFileInfo((prev) => ({
        ...prev,
        [fieldKey]: {
          name: file.name,
          size: fileSizeKB,
          isImage: isImg
        }
      }));

      // Set instant local answer so submit is never empty
      setAnswers((prev) => ({ ...prev, [fieldKey]: dataUrl }));

      // Clear any field error
      if (errors[fieldKey]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      }

      // Auto-upload to Google Drive folder using universal bridge
      setUploadingFiles((prev) => ({ ...prev, [fieldKey]: true }));
      try {
        const activeScriptUrl = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : null) || DEFAULT_SCRIPT_URL;
        const uploadRes = await uploadFileToDriveBridge(
          base64Data,
          file.name,
          file.type || "application/octet-stream",
          driveFolderId || DEFAULT_DRIVE_FOLDER_ID,
          activeScriptUrl
        );

        if (uploadRes && uploadRes.success && uploadRes.fileUrl) {
          // Store Drive File URL as answer
          setAnswers((prev) => ({ ...prev, [fieldKey]: uploadRes.fileUrl }));
          setUploadedFileInfo((prev) => ({
            ...prev,
            [fieldKey]: {
              name: file.name,
              url: uploadRes.fileUrl,
              driveFileUrl: uploadRes.fileUrl,
              size: "تم الرفع للدرايف بنجاح",
              isImage: isImg
            }
          }));
        }
      } catch (uploadErr) {
        console.warn("Direct drive upload error, kept locally:", uploadErr);
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [fieldKey]: false }));
      }
    } catch (processErr) {
      console.warn("Error processing file:", processErr);
    }
  };

  const handleRemoveFile = (fieldKey: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setFilePreviews((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setUploadedFileInfo((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    questions.forEach((q) => {
      const key = String(q.id || q.question);
      const normType = (q.type || "").toLowerCase().trim();
      const val = (answers[key] || "").trim();
      const localizedTitle = getLocalizedQuestionTitle(q, formLang);

      // 1. Skip validation for Image Displays and Button Links (they have no answer inputs)
      const isImageDisplay =
        normType === "image_display" ||
        q.question === "صورة" ||
        normType === "صورة" ||
        normType === "عرض صورة" ||
        (normType === "رابط" && q.imageUrl && (!q.externalLink || q.externalLink === "-"));

      const isButtonLink =
        normType === "button_link" ||
        normType === "عنوان زر" ||
        normType === "زر" ||
        (normType === "button_title" && Boolean(q.externalLink));

      if (isImageDisplay || isButtonLink) {
        return;
      }

      // 2. Required Check (Column E in Google Sheets)
      if (q.required && !val) {
        newErrors[key] = t.fieldRequiredError.replace("{name}", localizedTitle);
        return;
      }

      // If value is provided, validate according to field type
      if (val) {
        // Number Validation
        if (normType === "number" || normType === "رقم") {
          if (isNaN(Number(val))) {
            newErrors[key] = t.numberInvalidError;
          }
        }

        // Phone Validation
        if (normType === "phone" || normType === "رقم هاتف" || normType === "هاتف" || normType === "جوال") {
          const cleanPhone = val.replace(/[\s\-\+\(\)]/g, "");
          if (!/^\d{6,16}$/.test(cleanPhone)) {
            newErrors[key] = t.phoneInvalidError;
          }
        }

        // Email Validation
        if (normType === "email" || normType === "ايميل" || normType === "بريد" || normType === "البريد الإلكتروني") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            newErrors[key] = t.emailInvalidError;
          }
        }

        // URL Validation
        if (normType === "url" || normType === "رابط") {
          if (!val.startsWith("http://") && !val.startsWith("https://")) {
            newErrors[key] = t.urlInvalidError;
          }
        }
      }
    });

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      // Find first error field and scroll smoothly to it
      const firstErrorKey = Object.keys(newErrors)[0];
      if (firstErrorKey) {
        setTimeout(() => {
          const el = document.getElementById(`field-box-${firstErrorKey}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 80);
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setSubmitErrorMessage(null);
    setUploadStatusMessage(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1. Wait for any active background image/file upload to finish (up to 25s)
      if (Object.values(uploadingFiles).some(Boolean)) {
        setUploadStatusMessage(formLang === 'ar' ? "جاري استكمال رفع المرفقات إلى Google Drive... يرجى الانتظار" : "Uploading attachments to Google Drive...");
        let waitLoops = 0;
        while (Object.values(uploadingFiles).some(Boolean) && waitLoops < 25) {
          await new Promise((r) => setTimeout(r, 800));
          waitLoops++;
        }
      }

      // Build structured payload for backend and Google Sheets
      const formattedAnswers = questions
        .filter((q) => {
          const normType = (q.type || "").toLowerCase().trim();
          const isImageDisplay =
            normType === "image_display" ||
            q.question === "صورة" ||
            normType === "صورة" ||
            normType === "عرض صورة" ||
            (normType === "رابط" && q.imageUrl && (!q.externalLink || q.externalLink === "-"));
          const isButtonLink =
            normType === "button_link" ||
            normType === "عنوان زر" ||
            normType === "زر" ||
            (normType === "button_title" && Boolean(q.externalLink));
          return !isImageDisplay && !isButtonLink;
        })
        .map((q) => {
          const key = String(q.id || q.question);
          const rawAns = answers[key] !== undefined ? answers[key] : (answers[q.question] || "");
          const driveUrl = filePreviews[key]?.driveFileUrl || uploadedFileInfo[key]?.driveFileUrl || filePreviews[q.question]?.driveFileUrl || uploadedFileInfo[q.question]?.driveFileUrl;
          let finalAns = rawAns;
          if (driveUrl && typeof finalAns === "string" && finalAns.startsWith("data:")) {
            finalAns = driveUrl;
          }
          return {
            questionId: q.id,
            question: q.question,
            type: q.type,
            answer: finalAns || ""
          };
        });

      // Find specific primary fields with strict priority
      let nameVal = answers["الاسم"] || answers["اسم المشترك"] || answers["الاسم الكامل"] || "";
      let nameArVal = answers["الاسم بالعربي"] || answers["الاسم باللغة العربية"] || "";
      let ageVal = answers["العمر"] || answers["السن"] || "";
      let phoneVal = answers["رقم الهاتف"] || answers["الهاتف"] || answers["الواتساب"] || answers["الجوال"] || "";
      let emailVal = answers["ايميل"] || answers["إيميل"] || answers["البريد الإلكتروني"] || answers["البريد الالكتروني"] || answers["البريد"] || "";
      let lineIdVal = answers["ID Line"] || answers["Line ID"] || answers["لاين"] || answers["معرف لاين"] || "";
      let facebookVal = answers["فيس بوك"] || answers["فيسبوك"] || answers["Facebook"] || "";

      // Precise semantic search across formatted answers
      for (const fa of formattedAnswers) {
        const qRaw = (fa.question || "").trim();
        const qNorm = qRaw.toLowerCase().replace(/[\s_\-\?\؟\:\.]/g, "");
        const normType = (fa.type || "").toLowerCase().trim();
        const aVal = typeof fa.answer === "string" ? fa.answer.trim() : (fa.answer ? String(fa.answer).trim() : "");
        if (!aVal) continue;

        // Subscriber Name - MUST NOT match questions about teacher, instructor, parent, etc.
        if (!nameVal) {
          const isOtherPerson = qNorm.includes("استاذ") || qNorm.includes("معلم") || qNorm.includes("شيخ") || qNorm.includes("صديق") || qNorm.includes("والد");
          const isSubscriberName = qNorm === "الاسم" || qNorm === "اسمالمشترك" || qNorm === "الاسمكامل" || qNorm === "الاسمالكامل" || qNorm === "name" || qNorm === "fullname" || qNorm === "subscribername";
          if (isSubscriberName && !isOtherPerson) {
            nameVal = aVal;
          }
        }

        // Arabic Name
        if (!nameArVal) {
          if (qNorm === "الاسمبالعربي" || qNorm === "اسمعربي" || qNorm === "arabicname" || qNorm.includes("باللغةالعربية") || qNorm.includes("بالعربيه")) {
            nameArVal = aVal;
          }
        }

        // Age
        if (!ageVal) {
          if (qNorm === "العمر" || qNorm === "السن" || qNorm === "age" || (normType === "number" && qNorm.includes("عمر"))) {
            ageVal = aVal;
          }
        }

        // Phone
        if (!phoneVal) {
          if (normType === "phone" || normType === "رقم هاتف" || normType === "هاتف" || qNorm === "رقمالهاتف" || qNorm === "الهاتف" || qNorm === "الواتساب" || qNorm === "الجوال" || qNorm === "phone") {
            phoneVal = aVal;
          }
        }

        // Email
        if (!emailVal) {
          if (normType === "email" || normType === "ايميل" || normType === "بريد" || qNorm === "ايميل" || qNorm === "البريدالالكتروني" || qNorm === "البريدالإلكتروني" || qNorm === "email" || (aVal.includes("@") && aVal.includes("."))) {
            emailVal = aVal;
          }
        }

        // Line ID
        if (!lineIdVal) {
          if (qNorm === "idline" || qNorm === "lineid" || qNorm === "لاين" || qNorm === "معرفلاين") {
            lineIdVal = aVal;
          }
        }

        // Facebook
        if (!facebookVal) {
          if (qNorm === "فيسبوك" || qNorm === "فيس" || qNorm === "facebook") {
            facebookVal = aVal;
          }
        }
      }

      // Safe fallback for subscriber name: if still not found, check the first text input
      if (!nameVal && formattedAnswers.length > 0) {
        const first = formattedAnswers.find((fa) => {
          const qNorm = (fa.question || "").toLowerCase();
          return !qNorm.includes("استاذ") && !qNorm.includes("معلم") && !qNorm.includes("ملف") && !qNorm.includes("صورة");
        });
        if (first && first.answer && typeof first.answer === "string") {
          nameVal = first.answer.trim();
        }
      }

      if (!nameVal) {
        nameVal = "مشترك جديد";
      }
      
      // Find attachment or file if present
      let attachmentVal = "";

      // 1. Check uploadedFileInfo for verified drive URL
      for (const info of Object.values(uploadedFileInfo)) {
        if (info && (info as any).driveFileUrl) {
          attachmentVal = (info as any).driveFileUrl;
          break;
        }
      }

      // 2. Check formatted answers for file types or Drive links
      if (!attachmentVal) {
        const fileAnswer = formattedAnswers.find((fa) => {
          const qLower = (fa.question || "").toLowerCase();
          const isFileQ = (fa.type === "file" || fa.type === "ملف" || fa.type === "رفع ملف" || qLower.includes("ملف") || qLower.includes("صورة") || qLower.includes("مرفق"));
          return isFileQ && fa.answer && (fa.answer.startsWith("http") || fa.answer.startsWith("data:"));
        });
        if (fileAnswer) {
          attachmentVal = fileAnswer.answer;
        }
      }

      // 3. Fallback scan across all answers
      if (!attachmentVal) {
        for (const [k, v] of Object.entries(answers)) {
          if (typeof v === "string" && (v.startsWith("http") || v.startsWith("data:"))) {
            if (k !== "فيس بوك" && k !== "Facebook" && !k.toLowerCase().includes("face") && !k.toLowerCase().includes("link")) {
              attachmentVal = v;
              break;
            }
          }
        }
      }

      const activeScriptUrl = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : null) || DEFAULT_SCRIPT_URL;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedTimestamp = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const unifiedRegId = `${now.getFullYear()}${now.getMonth() + 1}${Math.floor(1000 + Math.random() * 9000)}`;

      let cachedEmailConfig: any = null;
      try {
        const stored = localStorage.getItem("thnoon_subscriber_email_config");
        if (stored) cachedEmailConfig = JSON.parse(stored);
      } catch (e) {}

      let cachedTelegramConfig: any = null;
      try {
        const storedTel = localStorage.getItem("thnoon_telegram_config");
        if (storedTel) cachedTelegramConfig = JSON.parse(storedTel);
      } catch (e) {}

      const regPayload = {
        registrationId: unifiedRegId,
        topicId: 1,
        topic: 1,
        name: nameVal,
        nameArabic: nameArVal,
        age: ageVal,
        email: emailVal,
        phone: phoneVal,
        lineId: lineIdVal,
        facebook: facebookVal,
        attachment: attachmentVal,
        answers: formattedAnswers,
        formLang: formLang || "ar",
        scriptUrl: activeScriptUrl,
        timestamp: formattedTimestamp,
        emailConfig: cachedEmailConfig || undefined,
        telegramConfig: cachedTelegramConfig || undefined
      };

      // If attachment is a data: URL, ensure it uploads to Google Drive or format cleanly
      if (attachmentVal && attachmentVal.startsWith("data:")) {
        try {
          const rawB64 = attachmentVal.split(",")[1] || "";
          const mime = (attachmentVal.match(/data:([^;]+);/) || [])[1] || "image/jpeg";
          const upRes = await uploadFileToDriveBridge(
            rawB64,
            `reg_${unifiedRegId}_upload.jpg`,
            mime,
            driveFolderId || DEFAULT_DRIVE_FOLDER_ID,
            activeScriptUrl
          );
          if (upRes && upRes.success && upRes.fileUrl) {
            attachmentVal = upRes.fileUrl;
            regPayload.attachment = upRes.fileUrl;
          }
        } catch (e) {}
      }

      // Sanitize formattedAnswers so no giant base64 (> 25KB) string gets passed directly into Google Sheets cells
      const safeFormattedAnswers = formattedAnswers.map((item) => {
        if (item && typeof item.answer === "string" && item.answer.startsWith("data:") && item.answer.length > 25000) {
          return {
            ...item,
            answer: attachmentVal && !attachmentVal.startsWith("data:") ? attachmentVal : "مرفق صورة تم رفعها"
          };
        }
        return item;
      });
      regPayload.answers = safeFormattedAnswers;

      setUploadStatusMessage(formLang === 'ar' ? "جاري حفظ البيانات في Google Sheets وإرسال إشعار تلغرام الفوري..." : "Saving registration and dispatching Telegram alert...");

      // Universal submission bridge: works on Node dev server AND on static hosts (Vercel/GitHub Pages)
      const submitResult = await submitRegistrationBridge(regPayload, activeScriptUrl);
      setIsSubmitting(false);
      setUploadStatusMessage(null);

      if (submitResult && submitResult.success) {
        const finalId = submitResult.registrationId || unifiedRegId;
        setIsSuccess(true);
        setSuccessInfo({
          id: finalId,
          message: submitResult.message || `تم استلام وحفظ طلب تسجيلك بنجاح بالرقم المرجعي (${finalId}) ومزامنة البيانات وتلغرام!`
        });
      } else {
        setSubmitErrorMessage(
          submitResult?.message ||
          (formLang === 'ar'
            ? "تعذر تأكيد حفظ طلب التسجيل في جدول البيانات. يرجى التحقق من اتصال الإنترنت والضغط على إعادة المحاولة."
            : "Failed to confirm registration in the database. Please check your connection and retry.")
        );
      }
    } catch (err: any) {
      console.error("Critical submission error:", err);
      setIsSubmitting(false);
      setUploadStatusMessage(null);
      setSubmitErrorMessage(
        err?.message ||
        (formLang === 'ar'
          ? "حدث خطأ غير متوقع أثناء إرسال البيانات. بياناتك محفوظة في النموذج، يرجى الضغط على زر إعادة المحاولة."
          : "An unexpected error occurred. Your entered data is preserved, please click retry.")
      );
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setSubmitErrorMessage(null);
    setUploadStatusMessage(null);
    setAnswers({});
    setErrors({});
    setHasAttemptedSubmit(false);
    setFilePreviews({});
    setUploadedFileInfo({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
          dir={formLang === "ar" ? "rtl" : "ltr"}
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            className={`relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl z-10 overflow-hidden flex flex-col h-[94dvh] sm:h-auto sm:max-h-[90vh] ${
              formLang === "ar" ? "text-right" : "text-left"
            }`}
          >
            {/* Top Golden Ribbon */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

            {/* Action Buttons: Copy Direct Link, Refresh, and Close */}
            <div
              className={`absolute top-4 sm:top-5 ${
                formLang === "ar" ? "left-4 sm:left-5" : "right-4 sm:right-5"
              } flex items-center gap-1.5 sm:gap-2 z-20`}
            >
              <button
                type="button"
                onClick={handleCopyDirectLink}
                title={formLang === "ar" ? "نسخ رابط الاستمارة المباشر لنشره للمشتركين" : "Copy direct form link to share"}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded-xl text-[11px] sm:text-xs font-bold font-sans transition-all cursor-pointer shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-300">{t.linkCopied}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t.shareForm}</span>
                  </>
                )}
              </button>
              <button
                onClick={fetchQuestions}
                disabled={isLoadingQuestions}
                title="تحديث ومزامنة الأسئلة"
                className="p-1.5 sm:p-2 bg-slate-800/60 hover:bg-amber-500 hover:text-slate-950 text-slate-400 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoadingQuestions ? "animate-spin text-amber-400" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 bg-slate-800/60 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Header */}
            <div className="text-center pt-2 pb-3.5 border-b border-slate-800 shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-sm">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-serif font-black text-xl sm:text-2xl md:text-3xl text-amber-400">
                {t.title}
              </h3>
              <p className="text-slate-400 font-sans text-xs sm:text-sm mt-1 leading-relaxed max-w-md mx-auto line-clamp-2 sm:line-clamp-none">
                {t.subtitle}
              </p>

              {/* Language Switcher Tabs */}
              <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl w-fit mx-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setFormLang("ar")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                    formLang === "ar"
                      ? "bg-amber-500 text-slate-950 shadow-md font-black"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-sm">🇸🇦</span>
                  <span>العربية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormLang("en")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                    formLang === "en"
                      ? "bg-amber-500 text-slate-950 shadow-md font-black"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-sm">🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormLang("th")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                    formLang === "th"
                      ? "bg-amber-500 text-slate-950 shadow-md font-black"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-sm">🇹🇭</span>
                  <span>ภาษาไทย</span>
                </button>
              </div>

              {isLoadingQuestions && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-sans">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{t.syncingQuestions}</span>
                </div>
              )}
            </div>

            {/* Body Form */}
            <div
              ref={modalBodyRef}
              className="overflow-y-auto overscroll-contain pr-1 pl-1 sm:px-2 py-4 flex-1 min-h-0 space-y-4 sm:space-y-5 scrollbar-thin"
            >
              {isSuccess ? (
                /* SUCCESS VIEW */
                <div className="text-center py-8 px-4 space-y-5">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-2xl text-slate-100">
                      {t.successTitle}
                    </h4>
                    <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                      {t.successDesc}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleResetAndClose}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm px-8 py-3 rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      {t.closeSuccessBtn}
                    </button>
                  </div>
                </div>
              ) : questions.length === 0 ? (
                /* LOADING OR EMPTY / SYSTEM ERROR STATE */
                <div className="text-center py-12 px-4 space-y-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border ${
                      loadError && !isLoadingQuestions
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {loadError && !isLoadingQuestions ? (
                      <AlertCircle className="w-7 h-7" />
                    ) : (
                      <RefreshCw className={`w-7 h-7 ${isLoadingQuestions ? "animate-spin" : ""}`} />
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-200 font-serif">
                    {isLoadingQuestions
                      ? "جاري تحميل وتحديث أسئلة الاستمارة من ورقة RegistrationQuestions..."
                      : (loadError || "لم يتم العثور على أسئلة جاهزة في قوقل شيت")}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {isLoadingQuestions
                      ? "يرجى الانتظار بضع ثوانٍ لمزامنة الحقول تلقائياً مع جدول البيانات..."
                      : "حدث تعذر في قراءة الأسئلة من ورقة RegistrationQuestions. لن يتم عرض أسئلة افتراضية منعاً لحدوث أي لخبطة أثناء التسجيل. يرجى الضغط على الزر أدناه لإعادة المحاولة."}
                  </p>
                  {!isLoadingQuestions && (
                    <button
                      type="button"
                      onClick={fetchQuestions}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>إعادة محاولة جلب الأسئلة الآن</span>
                    </button>
                  )}
                </div>
              ) : (
                /* DYNAMIC QUESTIONS FORM */
                <form onSubmit={handleSubmit} className="space-y-6">
                  {questions.map((q, idx) => {
                    const fieldKey = String(q.id || q.question);
                    const val = answers[fieldKey] || "";
                    const err = errors[fieldKey];
                    const normType = (q.type || "text").toLowerCase().trim();

                    const localizedTitle = getLocalizedQuestionTitle(q, formLang, translationsMap);
                    const localizedDesc = getLocalizedQuestionDescription(q, formLang, translationsMap);
                    const localizedOptions = getLocalizedQuestionOptions(q, formLang, translationsMap);

                    // =========================================================================
                    // 1. عنصر صورة (Display Image / Banner): لا يوجد حقل إجابة
                    // =========================================================================
                    const isImageDisplay =
                      normType === "image_display" ||
                      q.question === "صورة" ||
                      normType === "صورة" ||
                      normType === "عرض صورة" ||
                      (normType === "رابط" && q.imageUrl && (!q.externalLink || q.externalLink === "-"));

                    if (isImageDisplay) {
                      const displayImgUrl = q.imageUrl ? formatImageUrl(q.imageUrl) : "";
                      return (
                        <div
                          key={idx}
                          className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 overflow-hidden shadow-lg space-y-3"
                        >
                          {/* Optional Title or Description if not purely "صورة" */}
                          {localizedTitle && localizedTitle !== "صورة" && (
                            <h4 className="font-serif font-bold text-base sm:text-lg text-amber-300">
                              {localizedTitle}
                            </h4>
                          )}
                          {localizedDesc && (
                            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                              {localizedDesc}
                            </p>
                          )}

                          {displayImgUrl && (
                            <div
                              className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group cursor-pointer"
                              onClick={() => setPreviewImageModal(displayImgUrl)}
                            >
                              <img
                                src={displayImgUrl}
                                alt={localizedTitle || "Media preview"}
                                className="w-full max-h-72 object-contain rounded-xl bg-slate-950/60"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white gap-2 text-xs font-bold backdrop-blur-[2px]">
                                <Maximize2 className="w-4 h-4 text-amber-400" />
                                <span>{t.zoomImage}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // =========================================================================
                    // 2. عنصر عنوان زر (Action Button Link): لا يوجد حقل إجابة - يفتح الرابط في G
                    // =========================================================================
                    const isButtonLink =
                      normType === "button_link" ||
                      normType === "عنوان زر" ||
                      normType === "زر" ||
                      (normType === "button_title" && Boolean(q.externalLink));

                    if (isButtonLink) {
                      const buttonUrl = q.externalLink || q.imageUrl || "#";
                      return (
                        <div
                          key={idx}
                          className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-center"
                        >
                          {localizedDesc && (
                            <p className={`text-xs sm:text-sm text-slate-300 font-sans leading-relaxed mb-2 ${formLang === 'ar' ? 'text-right' : 'text-left'}`}>
                              {localizedDesc}
                            </p>
                          )}

                          <a
                            href={buttonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          >
                            <span>{localizedTitle}</span>
                            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                          </a>
                        </div>
                      );
                    }

                    // =========================================================================
                    // 3. الحقول العادية والتفاعلية (نص، رقم، هاتف، ايميل، رابط، اختيارات، رفع ملف)
                    // =========================================================================
                    return (
                      <div
                        key={idx}
                        id={`field-box-${fieldKey}`}
                        className={`bg-slate-950/60 border rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
                          err
                            ? "border-red-500 bg-red-500/10 ring-2 ring-red-500/40 shadow-xl shadow-red-950/40"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {/* Question Label Header */}
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <label className="font-serif font-bold text-base sm:text-lg text-slate-200 flex items-center gap-2">
                            <span>{localizedTitle}</span>
                            {q.required ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-red-300 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-md">
                                <span className="text-red-400 font-black text-xs">*</span>
                                <span>{t.requiredBadge}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs font-sans font-normal">{t.optionalBadge}</span>
                            )}
                          </label>

                          {/* Optional External Link Button */}
                          {q.externalLink && (
                            <a
                              href={q.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-all shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{t.explainingLink}</span>
                            </a>
                          )}
                        </div>

                        {/* Column B: Question Description (Smaller font, distinct muted color) */}
                        {localizedDesc && (
                          <p className="text-xs sm:text-sm text-amber-300/80 font-sans leading-relaxed mb-3">
                            {localizedDesc}
                          </p>
                        )}

                        {/* Column F: Question Image Thumbnail (if present) */}
                        {q.imageUrl && (
                          <div
                            className="my-3 max-w-sm rounded-xl overflow-hidden border border-slate-800 relative group cursor-pointer"
                            onClick={() => setPreviewImageModal(formatImageUrl(q.imageUrl))}
                          >
                            <img
                              src={formatImageUrl(q.imageUrl)}
                              alt="Question Media"
                              className="w-full max-h-48 object-cover rounded-xl"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white gap-1.5 text-xs font-bold">
                              <Maximize2 className="w-4 h-4" />
                              <span>{t.zoomImage}</span>
                            </div>
                          </div>
                        )}

                        {/* Field Input Elements by Type */}
                        <div className="mt-2">
                          {/* ========================================================================= */}
                          {/* أ) رفع ملف (File Upload + Direct Camera Capture) */}
                          {/* ========================================================================= */}
                          {(normType === "file" || normType === "رفع ملف" || normType === "ملف" || normType === "رفع") ? (
                            <div className="space-y-3">
                              {/* Hidden standard file input */}
                              <input
                                type="file"
                                ref={(el) => (fileInputRefs.current[fieldKey] = el)}
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileProcess(fieldKey, file);
                                }}
                              />

                              {/* Hidden direct camera capture input */}
                              <input
                                type="file"
                                ref={(el) => (cameraInputRefs.current[fieldKey] = el)}
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileProcess(fieldKey, file);
                                }}
                              />

                              {/* Dual Action Buttons: File Upload & Camera Capture */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* Button 1: Browse File / Document */}
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[fieldKey]?.click()}
                                  className="flex items-center justify-center gap-2.5 p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-slate-200 transition-all font-sans text-xs font-bold cursor-pointer"
                                >
                                  <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span>{t.uploadFileOrPhoto}</span>
                                </button>

                                {/* Button 2: Direct Camera Photo */}
                                <button
                                  type="button"
                                  onClick={() => openCameraModal(fieldKey)}
                                  className="flex items-center justify-center gap-2.5 p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-slate-200 transition-all font-sans text-xs font-bold cursor-pointer"
                                >
                                  <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span>{t.directCameraPhoto}</span>
                                </button>
                              </div>

                              {/* Upload Status & File Card Preview */}
                              {uploadingFiles[fieldKey] && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2 font-sans">
                                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                                  <span>{t.uploadingDrive}</span>
                                </div>
                              )}

                              {uploadedFileInfo[fieldKey] && !uploadingFiles[fieldKey] && (
                                <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {filePreviews[fieldKey] ? (
                                      <img
                                        src={filePreviews[fieldKey]}
                                        alt="Preview"
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0 cursor-pointer"
                                        onClick={() => setPreviewImageModal(filePreviews[fieldKey])}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-slate-800 text-amber-400 rounded-lg flex items-center justify-center shrink-0">
                                        <File className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div className={`min-w-0 ${formLang === 'ar' ? 'text-right' : 'text-left'}`}>
                                      <p className="text-xs text-slate-100 font-bold truncate">
                                        {uploadedFileInfo[fieldKey].name}
                                      </p>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans">
                                        <span>{uploadedFileInfo[fieldKey].size}</span>
                                        <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                          <CheckCircle2 className="w-3 h-3" />
                                          {t.savedInDrive}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {uploadedFileInfo[fieldKey].driveFileUrl && (
                                      <a
                                        href={uploadedFileInfo[fieldKey].driveFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                                        title={t.openDrive}
                                      >
                                        <Folder className="w-4 h-4" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFile(fieldKey)}
                                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                                      title={t.deleteFile}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (normType === "choice" || normType === "اختيار" || normType === "اختيارات") ? (
                            /* ب) خيارات متعددة */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                              {localizedOptions.map((opt, optIdx) => {
                                const originalOpt = (q.options || [])[optIdx] || opt;
                                const isSelected = val === opt || val === originalOpt;
                                return (
                                  <button
                                    type="button"
                                    key={optIdx}
                                    onClick={() => handleInputChange(fieldKey, opt, q.question)}
                                    className={`p-3 rounded-xl border text-sm font-sans font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      formLang === "ar" ? "text-right" : "text-left"
                                    } ${
                                      isSelected
                                        ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    <div
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                        isSelected ? "border-amber-400 bg-amber-500 text-slate-950" : "border-slate-700 bg-slate-950"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (normType === "phone" || normType === "رقم هاتف" || normType === "هاتف") ? (
                            /* ج) رقم هاتف */
                            <div className="relative">
                              <Phone className={`absolute ${formLang === 'ar' ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                              <input
                                type="tel"
                                dir="ltr"
                                value={val}
                                onChange={(e) => handleInputChange(fieldKey, e.target.value, q.question)}
                                placeholder={t.placeholderPhone}
                                className={`w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl py-3 text-sm text-slate-100 outline-none transition-colors font-mono ${
                                  formLang === "ar" ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                                }`}
                              />
                            </div>
                          ) : (normType === "email" || normType === "ايميل" || normType === "بريد") ? (
                            /* د) بريد إلكتروني */
                            <div className="relative">
                              <Mail className={`absolute ${formLang === 'ar' ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                              <input
                                type="email"
                                dir="ltr"
                                value={val}
                                onChange={(e) => handleInputChange(fieldKey, e.target.value, q.question)}
                                placeholder={t.placeholderEmail}
                                className={`w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl py-3 text-sm text-slate-100 outline-none transition-colors font-sans ${
                                  formLang === "ar" ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                                }`}
                              />
                            </div>
                          ) : (normType === "number" || normType === "رقم") ? (
                            /* هـ) رقم */
                            <div className="relative">
                              <Hash className={`absolute ${formLang === 'ar' ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                              <input
                                type="number"
                                value={val}
                                onChange={(e) => handleInputChange(fieldKey, e.target.value, q.question)}
                                placeholder={t.placeholderNumber}
                                className={`w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl py-3 text-sm text-slate-100 outline-none transition-colors font-sans ${
                                  formLang === "ar" ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                                }`}
                              />
                            </div>
                          ) : (normType === "url" || normType === "رابط") ? (
                            /* و) رابط */
                            <div className="relative">
                              <ExternalLink className={`absolute ${formLang === 'ar' ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                              <input
                                type="url"
                                dir="ltr"
                                value={val}
                                onChange={(e) => handleInputChange(fieldKey, e.target.value, q.question)}
                                placeholder={t.placeholderUrl}
                                className={`w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl py-3 text-sm text-slate-100 outline-none transition-colors font-mono ${
                                  formLang === "ar" ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                                }`}
                              />
                            </div>
                          ) : (
                            /* ز) نص عادي */
                            <div className="relative">
                              <FileText className={`absolute ${formLang === 'ar' ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleInputChange(fieldKey, e.target.value, q.question)}
                                placeholder={t.placeholderAnswer}
                                className={`w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl py-3 text-sm text-slate-100 outline-none transition-colors font-sans ${
                                  formLang === "ar" ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Error Message */}
                        {err && (
                          <div className="mt-2 flex items-center gap-1.5 text-red-400 text-xs font-sans">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Submit Area & Validation Alert */}
                  <div className="pt-3 space-y-3">
                    {/* Prominent Validation Alert Banner */}
                    {hasAttemptedSubmit && Object.keys(errors).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="p-4 sm:p-5 bg-gradient-to-br from-red-950/95 via-red-900/80 to-slate-950 border-2 border-red-500 rounded-2xl text-red-100 shadow-2xl space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5 animate-pulse text-red-400" />
                          </div>
                          <div className={`flex-1 ${formLang === 'ar' ? 'text-right' : 'text-left'}`}>
                            <h4 className="font-serif font-bold text-base text-red-200">
                              {t.validationAlertTitle.replace("{count}", String(Object.keys(errors).length))}
                            </h4>
                            <p className="text-xs text-red-300/90 font-sans mt-0.5 leading-relaxed">
                              {t.validationAlertDesc}
                            </p>
                          </div>
                        </div>

                        {/* Interactive pills for missing fields */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-red-800/60">
                          {questions
                            .filter((q) => errors[String(q.id || q.question)])
                            .map((q) => {
                              const key = String(q.id || q.question);
                              const localizedTitle = getLocalizedQuestionTitle(q, formLang, translationsMap);
                              return (
                                <button
                                  type="button"
                                  key={key}
                                  onClick={() => {
                                    const el = document.getElementById(`field-box-${key}`);
                                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/80 hover:bg-red-800 border border-red-400/60 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:scale-105 cursor-pointer"
                                >
                                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                                  <span>{localizedTitle}</span>
                                </button>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}

                    {/* Error message banner on failed submission */}
                    {submitErrorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-950/90 border-2 border-red-500/60 rounded-2xl text-red-200 text-sm flex items-start gap-3 shadow-lg my-2"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-red-300">{submitErrorMessage}</p>
                          <p className="text-xs text-slate-300">بياناتك لم تفقد. يرجى الضغط على زر "إعادة محاولة الإرسال" أدناه.</p>
                        </div>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-base py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin stroke-[2.5]" />
                      ) : submitErrorMessage ? (
                        <RefreshCw className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Send className="w-5 h-5 stroke-[2.5]" />
                      )}
                      <span>
                        {isSubmitting
                          ? t.submittingBtn
                          : submitErrorMessage
                          ? (formLang === 'ar' ? "إعادة محاولة الإرسال" : formLang === 'th' ? "ลองส่งอีกครั้ง" : "Retry Submission")
                          : (formLang === 'ar' ? customButtonTitle : t.submitBtn)}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Full Modal Submitting Overlay to prevent double clicks and reassure the user */}
              {isSubmitting && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4"
                  >
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-amber-400">
                      {formLang === 'ar' ? "جاري معالجة طلب التسجيل..." : formLang === 'th' ? "กำลังบันทึกและส่งข้อมูล..." : "Submitting Registration..."}
                    </h3>
                    <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                      {uploadStatusMessage || (formLang === 'ar'
                        ? "يرجى الانتظار لحظات ريثما يتم تسجيل بياناتك وإرسال الإشعارات وحفظ المرفقات في السحابة."
                        : formLang === 'th'
                        ? "กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลและส่งการแจ้งเตือน..."
                        : "Please wait a moment while your registration is being recorded and notifications are sent.")}
                    </p>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Lightbox Fullscreen for Question Images */}
            {previewImageModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
                onClick={() => setPreviewImageModal(null)}
              >
                <button
                  onClick={() => setPreviewImageModal(null)}
                  className="absolute top-6 left-6 p-3 bg-slate-800 text-white rounded-full hover:bg-red-500 transition-colors shadow-xl cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={previewImageModal}
                  alt="Enlarged view"
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-amber-500/40"
                />
              </div>
            )}

            {/* Universal Live Camera Modal (Desktop, Laptop, Mobile & Tablet) */}
            {isCameraModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className={formLang === 'ar' ? 'text-right' : 'text-left'}>
                        <h3 className="font-serif font-bold text-base text-slate-100">
                          {capturedPhotoUrl ? t.cameraPreviewTitle : t.cameraLiveTitle}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-sans">
                          {capturedPhotoUrl ? t.cameraPreviewSub : t.cameraLiveSub}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeCameraModal}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="إغلاق"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Camera Viewport / Preview */}
                  <div className="relative bg-black flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[380px] overflow-hidden">
                    {cameraError ? (
                      <div className="p-6 text-center space-y-4 max-w-md">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                          {cameraError}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                          <button
                            type="button"
                            onClick={() => startCamera(cameraFacingMode)}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
                          >
                            {t.cameraRetake}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              closeCameraModal();
                              if (activeCameraFieldKey) {
                                fileInputRefs.current[activeCameraFieldKey]?.click();
                              }
                            }}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
                          >
                            {t.cameraPickFile}
                          </button>
                        </div>
                      </div>
                    ) : capturedPhotoUrl ? (
                      /* Captured Preview */
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <img
                          src={capturedPhotoUrl}
                          alt="Captured"
                          className="max-h-[55vh] w-auto max-w-full object-contain rounded-2xl border border-slate-800 shadow-xl"
                        />
                      </div>
                    ) : (
                      /* Live Camera Feed */
                      <div className="w-full h-full flex items-center justify-center relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full max-h-[55vh] object-cover ${
                            cameraFacingMode === "user" ? "scale-x-[-1]" : ""
                          }`}
                        />

                        {/* Viewfinder Target Overlay Frame */}
                        <div className="absolute inset-4 sm:inset-8 border-2 border-amber-400/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                          <div className="flex justify-between">
                            <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400"></div>
                            <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400"></div>
                            <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls Footer */}
                  <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
                    {capturedPhotoUrl ? (
                      /* After Capture Actions */
                      <div className="flex items-center justify-between w-full gap-3">
                        <button
                          type="button"
                          onClick={retakeSnapshot}
                          className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-bold text-xs sm:text-sm rounded-xl transition-all"
                        >
                          <RotateCw className="w-4 h-4" />
                          <span>{t.cameraRetake}</span>
                        </button>

                        <button
                          type="button"
                          onClick={confirmSnapshot}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t.cameraConfirm}</span>
                        </button>
                      </div>
                    ) : (
                      /* Live Camera Actions */
                      <div className="flex items-center justify-between w-full">
                        {/* Switch Camera Button */}
                        <button
                          type="button"
                          onClick={toggleCameraFacingMode}
                          className="flex items-center gap-1.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-sans transition-all"
                          title={t.cameraSwitch}
                        >
                          <RotateCw className="w-4 h-4 text-amber-400" />
                          <span className="hidden sm:inline">
                            {cameraFacingMode === "environment" ? "كاميرا أمامية" : "كاميرا خلفية"}
                          </span>
                        </button>

                        {/* Big Shutter Button */}
                        <button
                          type="button"
                          onClick={takeSnapshot}
                          disabled={Boolean(cameraError)}
                          className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm sm:text-base rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-950"></div>
                          <span>{t.cameraShutter}</span>
                        </button>

                        {/* Fallback to file picker */}
                        <button
                          type="button"
                          onClick={() => {
                            closeCameraModal();
                            if (activeCameraFieldKey) {
                              fileInputRefs.current[activeCameraFieldKey]?.click();
                            }
                          }}
                          className="flex items-center gap-1.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-sans transition-all"
                          title={t.cameraPickFile}
                        >
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span className="hidden sm:inline">{t.cameraPickFile}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
