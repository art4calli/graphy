import { RegistrationQuestion } from "../types";
import { DEFAULT_FORM_TRANSLATIONS } from "./defaultFormTranslations";

/**
 * Official Form Questions & Translations
 * Source of truth configured in "ترجمة ولغات الاستمارة"
 */
export const DEFAULT_CONFIGURED_QUESTIONS: RegistrationQuestion[] = [
  {
    id: 1,
    question: "الاسم",
    description: "يرجى كتابة اسمك الكامل كما هو مدون في الهوية",
    type: "text",
    required: true,
    translations: {
      questionEn: "Full Name",
      questionTh: "ชื่อ-นามสกุล",
      descriptionEn: "Please write your full name as shown on your ID",
      descriptionTh: "กรุณาระบุชื่อ-นามสกุลเต็มตามที่ปรากฏบนบัตรประจำตัว"
    }
  },
  {
    id: 2,
    question: "الاسم بالعربي",
    description: "اسمك الكريم باللغة العربية (إن وُجد)",
    type: "text",
    required: true,
    translations: {
      questionEn: "Name in Arabic",
      questionTh: "ชื่อภาษาอาหรับ",
      descriptionEn: "Your name in Arabic (if any)",
      descriptionTh: "ชื่อของคุณเป็นภาษาอาหรับ (ถ้ามี)"
    }
  },
  {
    id: 3,
    question: "العمر",
    description: "العمر بالسنوات (أرقام فقط)",
    type: "number",
    required: true,
    translations: {
      questionEn: "Age",
      questionTh: "อายุ",
      descriptionEn: "Age in years (numbers only)",
      descriptionTh: "อายุเป็นปี (ตัวเลขเท่านั้น)"
    }
  },
  {
    id: 4,
    question: "رقم الهاتف",
    description: "رقم الهاتف أو الواتساب مع مفتاح الدولة",
    type: "phone",
    required: true,
    translations: {
      questionEn: "Phone Number",
      questionTh: "หมายเลขโทรศัพท์",
      descriptionEn: "Phone or WhatsApp number with country code",
      descriptionTh: "เบอร์โทรศัพท์หรือ WhatsApp พร้อมรหัสประเทศ"
    }
  },
  {
    id: 5,
    question: "ايميل",
    description: "بريدك الإلكتروني المعتمد لاستلام الإشعار",
    type: "email",
    required: true,
    translations: {
      questionEn: "Email",
      questionTh: "อีเมล",
      descriptionEn: "Your approved email to receive notifications",
      descriptionTh: "อีเมลที่ใช้สำหรับรับการแจ้งเตือน"
    }
  },
  {
    id: 6,
    question: "ID Line",
    description: "معرف تطبيق لاين الخاص بك للتواصل السريع",
    type: "text",
    required: false,
    imageUrl: "https://lh3.googleusercontent.com/d/1wUPfYMrl3t6j0RPaw6Vk-WiqAaECbSNQ",
    translations: {
      questionEn: "Line ID",
      questionTh: "LINE ID",
      descriptionEn: "Your Line ID for quick communication",
      descriptionTh: "LINE ID ของคุณสำหรับการติดต่ออย่างรวดเร็ว"
    }
  },
  {
    id: 7,
    question: "افتح ملف بي دي اف",
    type: "button_title",
    required: false,
    externalLink: "https://drive.google.com/thumbnail?id=1wUPfYMrl3t6j0RPaw6Vk-WiqAaECbSNQ&sz=w1201",
    translations: {
      questionEn: "Open PDF File",
      questionTh: "เปิดไฟล์ PDF",
      descriptionEn: "Click to open the PDF document",
      descriptionTh: "คลิกเพื่อเปิดเอกสาร PDF",
      buttonTitleEn: "Open PDF Document",
      buttonTitleTh: "เปิดดูเอกสาร PDF"
    }
  },
  {
    id: 8,
    question: "فيس بوك",
    description: "رابط أو اسم حسابك على فيسبوك",
    type: "text",
    required: false,
    externalLink: "https://drive.google.com/thumbnail?id=1wUPfYMrl3t6j0RPaw6Vk-WiqAaECbSNQ&sz=w1201",
    translations: {
      questionEn: "Facebook",
      questionTh: "Facebook",
      descriptionEn: "Link or name of your Facebook account",
      descriptionTh: "ลิงก์หรือชื่อบัญชี Facebook ของคุณ"
    }
  },
  {
    id: 9,
    question: "هل تحب الخط العربي؟",
    description: "اختر الإجابة المناسبة لمستواك",
    type: "choice",
    options: [
      "✅ نعم = เคย",
      "❌ لا = ไม่เคย"
    ],
    required: true,
    translations: {
      questionEn: "Do you like Arabic calligraphy?",
      questionTh: "คุณชอบศิลปะการเขียนตัวอักษรอาหรับหรือไม่?",
      descriptionEn: "Choose the answer suitable for your level",
      descriptionTh: "เลือกคำตอบที่ตรงกับระดับความรู้ของคุณ",
      optionsEn: [
        "✅ Yes = Ever",
        "❌ No = Never"
      ],
      optionsTh: [
        "✅ ใช่ = เคย",
        "❌ ไม่ = ไม่เคย"
      ]
    }
  },
  {
    id: 10,
    question: "ما اسم استاذك الذي علمك الخط؟",
    description: "اسم الخطاط أو المعلم الذي تعلمت على يديه",
    type: "text",
    required: false,
    translations: {
      questionEn: "What is the name of your calligraphy teacher?",
      questionTh: "อาจารย์ผู้สอนการเขียนตัวอักษรอาหรับให้คุณชื่ออะไร?",
      descriptionEn: "Name of the calligrapher or teacher who taught you",
      descriptionTh: "ชื่อของครูหรือผู้เชี่ยวชาญที่สอนคุณ"
    }
  },
  {
    id: 11,
    question: "هل تعرفين انوان الخط",
    description: "1",
    type: "choice",
    options: [
      "✅ نعم = เคย",
      "❌ لا = ไม่เคย"
    ],
    required: true,
    translations: {
      questionEn: "Do you know the types of calligraphy scripts?",
      questionTh: "คุณรู้จักประเภทของลายมือ/ฟอนต์อาหรับหรือไม่?",
      descriptionEn: "Types of Arabic calligraphy scripts",
      descriptionTh: "ประเภทและรูปแบบของอักษรวิจิตรอาหรับ",
      optionsEn: [
        "✅ Yes = Ever",
        "❌ No = Never"
      ],
      optionsTh: [
        "✅ ใช่ = เคย",
        "❌ ไม่ = ไม่เคย"
      ]
    }
  },
  {
    id: 12,
    question: "هل تحب الفن",
    description: "2",
    type: "text",
    required: false,
    translations: {
      questionEn: "Do you love art?",
      questionTh: "คุณรักศิลปะหรือไม่?",
      descriptionEn: "General artistic interest",
      descriptionTh: "ความสนใจด้านศิลปะทั่วไป"
    }
  },
  {
    id: 13,
    question: "صورة",
    type: "image_display",
    required: false,
    imageUrl: "https://lh3.googleusercontent.com/d/1wUPfYMrl3t6j0RPaw6Vk-WiqAaECbSNQ",
    translations: {
      questionEn: "Image",
      questionTh: "รูปภาพ",
      descriptionEn: "Displayed image",
      descriptionTh: "รูปภาพที่แสดง"
    }
  },
  {
    id: 14,
    question: "رفع ملف",
    type: "file",
    required: false,
    translations: {
      questionEn: "Upload File",
      questionTh: "อัปโหลดไฟล์",
      descriptionEn: "Upload your document or image",
      descriptionTh: "อัปโหลดเอกสารหรือรูปภาพของคุณ"
    }
  },
  {
    id: 15,
    question: "افتح ملف بي دي اف",
    type: "button_title",
    required: false,
    externalLink: "https://drive.google.com/thumbnail?id=1wUPfYMrl3t6j0RPaw6Vk-WiqAaECbSNQ&sz=w1201",
    translations: {
      questionEn: "Open PDF File",
      questionTh: "เปิดไฟล์ PDF",
      descriptionEn: "Click to open the PDF document",
      descriptionTh: "คลิกเพื่อเปิดเอกสาร PDF",
      buttonTitleEn: "Open PDF Document",
      buttonTitleTh: "เปิดดูเอกสาร PDF"
    }
  }
];

const STORAGE_KEY = "thnoon_configured_form_questions";

/**
 * Retrieve form questions directly from configured translations module
 * Never queries Google Sheet directly during registration form display
 */
export function getSavedFormQuestions(): RegistrationQuestion[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading configured questions from storage:", e);
    }
  }
  return DEFAULT_CONFIGURED_QUESTIONS;
}

/**
 * Save form questions with their translations
 */
export function saveConfiguredFormQuestions(questions: RegistrationQuestion[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
      // Notify all listening components
      window.dispatchEvent(new CustomEvent("thnoon_translations_updated", {
        detail: { questions }
      }));
    } catch (e) {
      console.warn("Error saving configured questions to storage:", e);
    }
  }
}
