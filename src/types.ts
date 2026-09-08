/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SheetRow {
  type: string;        // 'بطاقة' | 'معرض صور' | 'من نحن'
  title: string;
  description: string;
  media: {
    url: string;
    pairUrl?: string; // YouTube video URL paired with image, or vice versa
  }[];
  linkUrl?: string;
  buttonText?: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ProfileData {
  logoUrl: string;
  title: string;
  description: string;
  loginButtonText: string;
  loginButtonUrl: string;
  headerBgUrl?: string;
  features?: FeatureItem[];
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  line: string;
}

export interface ContactCardItem {
  title: string;
  value: string;
  icon: string;
}

export interface BiographyData {
  sectionTitle?: string;
  sectionDescription?: string;
  sectionBadge?: string;
  bioName?: string;
  bioSubtitle?: string;
  bioTitle?: string;
  bioDesc1?: string;
  bioDesc2?: string;
  bioImage?: string;
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  stat3Value?: string;
  stat3Label?: string;
}

export interface SectionHeaderData {
  badge?: string;
  title?: string;
  description?: string;
  buttonText?: string;
}

export interface ContactDetails {
  badge?: string;
  title?: string;
  description?: string;
  panelTitle?: string;
  panelDescription?: string;
  cards: ContactCardItem[];
  contactSocialLabel?: string;
  contactFormTitle?: string;
  contactFormLabelName?: string;
  contactFormLabelEmail?: string;
  contactFormLabelSubject?: string;
  contactFormLabelMessage?: string;
  contactFormPlaceholderName?: string;
  contactFormPlaceholderEmail?: string;
  contactFormPlaceholderSubject?: string;
  contactFormPlaceholderMessage?: string;
  contactFormSuccessMsg?: string;
  contactFormSubmitBtn?: string;
  contactFormSendingBtn?: string;
}

export interface CustomTexts {
  topAnnouncementRight?: string;
  topAnnouncementLocation?: string;
  topAnnouncementLeft?: string;
  navbarTitle?: string;
  navbarSubtitle?: string;
  navHome?: string;
  navAbout?: string;
  navArtwork?: string;
  navVideo?: string;
  navCourses?: string;
  navTools?: string;
  navContact?: string;
  heroSubtag?: string;
  homeSectionTitle?: string;
  footerTitle?: string;
  footerDescription?: string;
  footerCopyright?: string;
  heroPrimaryBtn?: string;
  heroSecondaryBtn?: string;
  topAnnouncementTag?: string;
  aboutExtraTitle?: string;
  contactSocialLabel?: string;
  contactFormTitle?: string;
  contactFormLabelName?: string;
  contactFormLabelEmail?: string;
  contactFormLabelSubject?: string;
  contactFormLabelMessage?: string;
  contactFormPlaceholderName?: string;
  contactFormPlaceholderEmail?: string;
  contactFormPlaceholderSubject?: string;
  contactFormPlaceholderMessage?: string;
  contactFormSuccessMsg?: string;
  contactFormSubmitBtn?: string;
  contactFormSendingBtn?: string;
}

export interface AppData {
  profile: ProfileData;
  socialLinks: SocialLinks;
  homeCards: SheetRow[];
  artworkCards: SheetRow[];
  videoCards: SheetRow[];
  coursesCards: SheetRow[];
  toolsCards: SheetRow[];
  aboutCards: SheetRow[];
  contactCards: SheetRow[];
  contactInfo?: ContactDetails;
  biography?: BiographyData;
  sectionHeaders?: Record<string, SectionHeaderData>;
  customTexts?: CustomTexts;
  siteTranslations?: any[];
}

export interface SubscriberCard {
  title: string;
  description: string;
  media: { url: string; type?: "image" | "video" }[];
  linkUrl?: string;
  buttonText?: string;
}

export interface SubscriberTopicContent {
  topicId: string;
  title: string;
  description: string;
  coverImage?: string;
  badge?: string;
  cards: SubscriberCard[];
}

export interface SubscriberState {
  isLoggedIn: boolean;
  subscriberName?: string;
  topicId?: string;
  content?: SubscriberTopicContent;
  links: {
    text: string;
    comment: string;
    url: string;
  }[];
  exitButtonText?: string;
  exitButtonComment?: string;
}

export interface QuestionTranslation {
  questionEn?: string;
  questionTh?: string;
  descriptionEn?: string;
  descriptionTh?: string;
  optionsEn?: string[];
  optionsTh?: string[];
  buttonTitleEn?: string;
  buttonTitleTh?: string;
}

export type FormTranslationsMap = Record<string, QuestionTranslation>;

export interface RegistrationQuestion {
  id: string | number;
  question: string;         // Column A: نص السؤال
  description?: string;     // Column B: الوصف (تحت السؤال بحجم خط أقل ولون مختلف)
  type: "text" | "number" | "phone" | "email" | "url" | "choice" | "file" | "button_title" | string; // Column C: نوع العنصر
  options?: string[];       // Column D: خيارات
  required: boolean;        // Column E: اجبار الاجابة (نعم / لا)
  imageUrl?: string;        // Column F: رابط الصورة
  externalLink?: string;    // Column G: رابط خارجي
  translations?: QuestionTranslation; // Multilingual translations (EN, TH)
}

export interface EmailFieldMapping {
  id: string;
  label: string;          // نص التسمية (مثال: رقم التسجيل، اسم المشترك، اسم الدورة)
  labelEn?: string;
  labelTh?: string;
  columnLetter: string;   // حرف العامود في الشيت (مثال: B, C, D)
}

export interface EmailAttachmentLink {
  id: string;
  title: string;          // عنوان المرفق / الزر (مثال: دليل المشترك PDF)
  titleEn?: string;
  titleTh?: string;
  url: string;            // الرابط
  type: "image" | "file_button" | "link"; // نوع المرفق: صورة مضمنة | زر فتح ملف | رابط
}

export interface EmailLanguageTemplate {
  subject: string;
  header: string;
  body: string;
  footerNote: string;
}

export interface SubscriberEmailConfig {
  enabled: boolean;
  emailColumn: string;              // عامود الايميل في ورقة RegistrationAnswers (مثال: E)
  deliveryStatusColumn: string;     // عامود تسجيل نص (تم الإرسال) (مثال: Z)
  dataFields: EmailFieldMapping[];  // قائمة الحقول (نص التسمية + حرف العامود)
  qrCodeColumns: string;            // الأعمدة أو البيانات التي سيتم توليد الـ QR Code منها (مثال: B أو A,B)
  qrDriveUrlColumn: string;         // عامود حفظ رابط صورة كيو آر كود في قوقل درايف (مثال: Y)
  includeQrInEmail: boolean;        // تضمين صورة QR كود في نص الإيميل
  messages: {
    ar: EmailLanguageTemplate;
    en: EmailLanguageTemplate;
    th: EmailLanguageTemplate;
  };
  attachments: EmailAttachmentLink[];
}

export interface TelegramCustomButton {
  id: string;
  text: string;
  url: string;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;              // رمز توكن البوت من @BotFather
  chatId: string;                // معرف الدردشة / المجموعة / القناة المستلمة
  topicId?: string;              // معرف الموضوع (Thread/Topic ID) للمجموعات المقسمة
  notificationTitle: string;     // عنوان الإشعار
  includeAllAnswers: boolean;    // إرفاق وتضمين جميع إجابات وحقول الاستمارة
  includeQrCode: boolean;        // إرفاق صورة رمز الـ QR
  includeAttachment: boolean;    // إرفاق رابط أو صورة الملف المرفوع من المشترك
  includeWhatsappButton?: boolean;// (اختياري / ملغى)
  includeSheetButton?: boolean;   // (اختياري / ملغى)
  customButtons?: TelegramCustomButton[]; // أزرار روابط مخصصة إضافية
  customHeader?: string;         // ترويسة إضافية للرسالة
  customFooter?: string;         // تذييل إضافي للرسالة
}

export interface RegistrationAnswerRecord {
  rowIndex: number;            // رقم الصف في ورقة الشيت (2, 3...)
  registrationId: string;      // رقم التسجيل
  name: string;                // الاسم
  nameArabic: string;          // الاسم بالعربي
  timestamp?: string;          // التاريخ والوقت
  data: Record<string, string>; // تفاصيل الحقول كاملة
  rawRow?: string[];           // القيم الخام للصف
}

export interface SettingsSubscriberRecord {
  rowIndex: number;            // رقم الصف في ورقة Settings (2, 3...)
  name: string;                // العامود Z: اسم المشترك
  registrationId: string;      // العامود AA: رقم التسجيل
  topicId: string;             // العامود A: رقم الصفحة الخاصة
  status: string;              // العامود AB: مسموح / ممنوع للدخول
  isAllowed: boolean;          // حالة السماح بالدخول
  deviceCount: string;         // العامود AC: عدد الأجهزة
  rawRow?: string[];           // القيم الخام للصف
}

