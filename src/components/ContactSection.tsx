import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, Phone, Mail, Clock, Send, Check, Facebook, Instagram, Youtube, Compass,
  Star, Award, Landmark, PenTool, GraduationCap, Users, ShieldCheck, Sparkles
} from "lucide-react";
import { SheetRow, SocialLinks, ContactDetails, CustomTexts } from "../types";
import { submitContactInquiryBridge } from "../utils/googleBackendBridge";
import { useLanguage } from "../context/LanguageContext";

interface ContactSectionProps {
  cards: SheetRow[];
  socialLinks: SocialLinks;
  contactInfo?: ContactDetails;
  customTexts?: CustomTexts;
}

function getContactIcon(iconName: string) {
  const name = (iconName || "").toLowerCase().trim();
  switch (name) {
    case "map-pin":
    case "pin":
    case "خارطة":
    case "موقع":
    case "عنوان":
      return <MapPin className="w-5 h-5" />;
    case "phone":
    case "هاتف":
    case "موبايل":
    case "جوال":
      return <Phone className="w-5 h-5" />;
    case "mail":
    case "email":
    case "بريد":
    case "ايميل":
      return <Mail className="w-5 h-5" />;
    case "clock":
    case "time":
    case "ساعة":
    case "وقت":
    case "دوام":
      return <Clock className="w-5 h-5" />;
    case "award":
    case "جائزة":
    case "شهادة":
      return <Award className="w-5 h-5" />;
    case "landmark":
    case "مؤسسة":
      return <Landmark className="w-5 h-5" />;
    case "pentool":
    case "قلم":
    case "ريشة":
    case "خط":
      return <PenTool className="w-5 h-5" />;
    case "graduation-cap":
    case "تعليم":
    case "دراسة":
      return <GraduationCap className="w-5 h-5" />;
    case "users":
    case "ناس":
    case "مشتركين":
      return <Users className="w-5 h-5" />;
    case "shield":
    case "ضمان":
    case "أمان":
      return <ShieldCheck className="w-5 h-5" />;
    case "sparkles":
    case "نجوم":
    case "إبداع":
      return <Sparkles className="w-5 h-5" />;
    default:
      return <Star className="w-5 h-5" />;
  }
}

export default function ContactSection({ cards, socialLinks, contactInfo, customTexts }: ContactSectionProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;

    setIsSending(true);
    setErrorMessage("");
    
    try {
      const res = await submitContactInquiryBridge({ name, email, subject, message });
      if (res.success) {
        setSentSuccess(true);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setTimeout(() => setSentSuccess(false), 7000);
      } else {
        setErrorMessage(res.message || t("contact_error_fail", "فشل إرسال الاستفسار. الرجاء المحاولة مجدداً."));
      }
    } catch (err: any) {
      console.warn("Contact form submission error:", err);
      setErrorMessage(err?.message || t("contact_error_conn", "حدث خطأ في الاتصال بالخادم."));
    } finally {
      setIsSending(false);
    }
  };

  const socialPlatforms = [
    { icon: Facebook, url: socialLinks.facebook, name: "فيسبوك", color: "hover:bg-blue-600 hover:text-white hover:border-transparent" },
    { icon: Instagram, url: socialLinks.instagram, name: "إنستغرام", color: "hover:bg-pink-600 hover:text-white hover:border-transparent" },
    { icon: Youtube, url: socialLinks.youtube, name: "يوتيوب", color: "hover:bg-red-600 hover:text-white hover:border-transparent" },
    { icon: Compass, url: socialLinks.line, name: "لاين", color: "hover:bg-green-600 hover:text-white hover:border-transparent" },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold font-sans tracking-widest text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full uppercase">
          {t("contact_badge", contactInfo?.badge || "نسعد دائماً بخدمتكم وتواصلكم")}
        </span>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mt-4 leading-normal">
          {t("contact_title", contactInfo?.title || "تواصل معنا والتحق بنا")}
        </h2>
        <p className="text-slate-400 font-sans mt-4 text-sm leading-relaxed">
          {t("contact_description", contactInfo?.description || "لديك استفسار حول الدورات أو ترغب بطلب لوحة خطية مخصصة؟ راسلنا أو تواصل معنا عبر قنواتنا الرسمية، أو تشرفنا بزيارتك لمقر المؤسسة.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        
        {/* Contact Info panel */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-8">
          <div className="space-y-6 text-right">
            <h3 className="font-serif font-bold text-2xl text-amber-400">
              {t("contact_info_panel_title", contactInfo?.panelTitle || "مقر المؤسسة وقنوات التواصل")}
            </h3>
            <p className="text-slate-400 font-sans text-xs sm:text-sm leading-relaxed">
              {t("contact_panel_desc", contactInfo?.panelDescription || "تستقبلكم المؤسسة يومياً لاستقبال الاستفسارات وتوفير أدوات الخط الفاخرة لطلاب الحرف الشريف.")}
            </p>

            <div className="space-y-4 pt-4">
              {contactInfo?.cards && contactInfo.cards.length > 0 ? (
                contactInfo.cards.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      {getContactIcon(item.icon)}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-100">{t(item.title, item.title)}</h4>
                      <p className="text-slate-400 text-xs sm:text-sm font-sans mt-0.5 leading-relaxed">
                        {t(item.value, item.value)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-100">
                        {t("contact_card_address_title", "العنوان والموقع")}
                      </h4>
                      <p className="text-slate-400 text-xs sm:text-sm font-sans mt-0.5 leading-relaxed">
                        {t("contact_card_address_val", "العراق، الموصل، الجانب الأيمن، قرب جامع النوري الكبير")}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-100">
                        {t("contact_card_phone_title", "رقم الهاتف")}
                      </h4>
                      <p className="text-slate-400 text-xs sm:text-sm font-sans mt-0.5 leading-relaxed" dir="ltr">
                        +964 770 123 4567
                      </p>
                    </div>
                  </div>

                  {/* Mail */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-100">
                        {t("contact_card_email_title", "البريد الإلكتروني")}
                      </h4>
                      <p className="text-slate-400 text-xs sm:text-sm font-sans mt-0.5 leading-relaxed">
                        info@yousifdhannoun.org
                      </p>
                    </div>
                  </div>

                  {/* Work Hours */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-100">
                        {t("contact_card_hours_title", "أوقات العمل")}
                      </h4>
                      <p className="text-slate-400 text-xs sm:text-sm font-sans mt-0.5 leading-relaxed">
                        {t("contact_card_hours_val", "السبت - الخميس: من ٩:٠٠ صباحاً وحتى ٥:٠٠ مساءً")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Social Icons Bar */}
          <div className="space-y-4 pt-6 border-t border-slate-900">
            <p className="text-slate-300 font-sans text-xs font-bold text-right">
              {t("contact_social_label", contactInfo?.contactSocialLabel || customTexts?.contactSocialLabel || "تابعونا على مواقع التواصل الاجتماعي:")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {socialPlatforms.map((plat, pIdx) => {
                const Icon = plat.icon;
                return (
                  <a
                    key={pIdx}
                    href={plat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center transition-all ${plat.color}`}
                    title={plat.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic inquiry form */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-6 text-right">
            <h3 className="font-serif font-bold text-2xl text-amber-400">
              {t("contact_form_title", contactInfo?.contactFormTitle || customTexts?.contactFormTitle || "أرسل لنا رسالة مباشرة")}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans font-semibold text-slate-400">
                  {t("contact_form_label_name", contactInfo?.contactFormLabelName || customTexts?.contactFormLabelName || "الاسم الكامل")} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("contact_form_label_name", contactInfo?.contactFormPlaceholderName || customTexts?.contactFormPlaceholderName || "الاسم الكامل")}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/55 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-colors font-sans"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans font-semibold text-slate-400">
                  {t("contact_form_label_email", contactInfo?.contactFormLabelEmail || customTexts?.contactFormLabelEmail || "البريد الإلكتروني")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={contactInfo?.contactFormPlaceholderEmail || customTexts?.contactFormPlaceholderEmail || "name@example.com"}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/55 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-colors font-sans"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-sans font-semibold text-slate-400">
                {t("contact_form_label_subject", contactInfo?.contactFormLabelSubject || customTexts?.contactFormLabelSubject || "موضوع الرسالة")}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("contact_form_label_subject", contactInfo?.contactFormPlaceholderSubject || customTexts?.contactFormPlaceholderSubject || "موضوع الرسالة")}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/55 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-colors font-sans"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-sans font-semibold text-slate-400">
                {t("contact_form_label_message", contactInfo?.contactFormLabelMessage || customTexts?.contactFormLabelMessage || "نص الرسالة أو الاستفسار")} *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("contact_form_label_message", contactInfo?.contactFormPlaceholderMessage || customTexts?.contactFormPlaceholderMessage || "نص الرسالة أو الاستفسار")}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/55 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-colors font-sans resize-none"
              ></textarea>
            </div>

            {/* Feedback Notifications */}
            <AnimatePresence>
              {sentSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3 text-green-400 text-xs sm:text-sm font-sans"
                >
                  <Check className="w-5 h-5 shrink-0 text-green-400" />
                  <span>
                    {t("contact_form_success_msg", contactInfo?.contactFormSuccessMsg || customTexts?.contactFormSuccessMsg || "شكراً لتواصلك معنا! تم استلام رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت.")}
                  </span>
                </motion.div>
              )}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs sm:text-sm font-sans"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm py-4 px-4 rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSending 
                  ? t("contact_form_sending_btn", contactInfo?.contactFormSendingBtn || customTexts?.contactFormSendingBtn || "جاري إرسال رسالتك...") 
                  : t("contact_form_submit_btn", contactInfo?.contactFormSubmitBtn || customTexts?.contactFormSubmitBtn || "إرسال الرسالة الآن")}
              </span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
