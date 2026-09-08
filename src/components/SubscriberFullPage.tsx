import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ExternalLink,
  X,
  FileText,
  BookOpen,
  Award,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  AlertTriangle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { SubscriberState, SubscriberCard, SubscriberTopicContent, SocialLinks } from "../types";
import { formatImageUrl } from "../utils/imageUtils";
import { checkSubscriberAccountStatus, fetchSubscriberTopicContent } from "../utils/googleBackendBridge";
import { useLanguage } from "../context/LanguageContext";

interface SubscriberFullPageProps {
  subscriber: SubscriberState;
  onLogout: () => void;
  logoUrl?: string;
  institutionTitle?: string;
  socialLinks?: SocialLinks;
}

// Media Carousel for Cards (Images with Lightbox or Embedded Video Player)
function CardMediaCarousel({ media }: { media: { url: string; type?: "image" | "video" }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!media || media.length === 0) return null;

  const currentItem = media[currentIndex] || media[0];
  const formattedUrl = formatImageUrl(currentItem.url);

  const nextItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const vidId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=0`;
    }
    if (url.includes("youtu.be/")) {
      const vidId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=0`;
    }
    if (url.includes("vimeo.com/")) {
      const vidId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${vidId}`;
    }
    return url;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group my-4 shadow-inner">
      {/* Media Display Container */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-black/50">
        {currentItem.type === "video" ? (
          currentItem.url.includes("youtube.com") || currentItem.url.includes("youtu.be") || currentItem.url.includes("vimeo.com") ? (
            <iframe
              src={getEmbedUrl(currentItem.url)}
              title="Card Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={formattedUrl}
              controls
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <div
            className="relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setLightboxUrl(formattedUrl)}
          >
            <img
              src={formattedUrl}
              alt="Card Media"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80";
              }}
            />
            <div className="absolute top-3 left-3 p-2 bg-slate-950/80 text-amber-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-amber-500/30">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Multiple media controls */}
      {media.length > 1 && (
        <>
          <button
            onClick={prevItem}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-950/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full transition-all shadow-lg z-10 border border-slate-700/60 cursor-pointer"
            aria-label="Previous Media"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={nextItem}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-950/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full transition-all shadow-lg z-10 border border-slate-700/60 cursor-pointer"
            aria-label="Next Media"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 inset-x-0 flex justify-center items-center gap-1.5 z-10">
            {media.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? "w-6 bg-amber-400" : "w-2 bg-white/40 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Fullscreen Media Lightbox Modal */}
      <AnimatePresence>
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-6 left-6 p-3 bg-slate-900/80 hover:bg-red-500 text-white rounded-full transition-all cursor-pointer z-50 border border-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxUrl}
              alt="Fullscreen Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SubscriberFullPage({
  subscriber,
  onLogout,
  logoUrl,
  institutionTitle,
  socialLinks,
}: SubscriberFullPageProps) {
  const { t, dir } = useLanguage();
  const [topicContent, setTopicContent] = useState<SubscriberTopicContent | null>(subscriber.content || null);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(
    !subscriber.content || !subscriber.content.cards || subscriber.content.cards.length === 0
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [blockedAlert, setBlockedAlert] = useState<string | null>(null);

  // Helper to load topic content directly from Google Sheets
  const reloadContent = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const topicIdToFetch = subscriber.topicId || "1";
      const fetched = await fetchSubscriberTopicContent(topicIdToFetch);
      if (fetched && fetched.cards && fetched.cards.length > 0) {
        setTopicContent(fetched);
      }
    } catch (err) {
      console.warn("Could not reload topic content:", err);
    } finally {
      setIsLoadingContent(false);
      if (manual) setIsRefreshing(false);
    }
  }, [subscriber.topicId]);

  // Initial load & sync if content is missing on mobile / tablet
  useEffect(() => {
    if (subscriber.content && subscriber.content.cards && subscriber.content.cards.length > 0) {
      setTopicContent(subscriber.content);
      setIsLoadingContent(false);
    } else {
      setIsLoadingContent(true);
      reloadContent(false);
    }
  }, [subscriber.content, subscriber.topicId, reloadContent]);

  // Live account status watcher (Columns AB status: if set to ممنوع, kick out immediately)
  useEffect(() => {
    const verifyStatus = async () => {
      const username = subscriber.subscriberName;
      if (!username) return;
      try {
        const res = await checkSubscriberAccountStatus(username);
        if (res.isBlocked) {
          setBlockedAlert(t("subscriber_blocked_alert_msg", "تم إيقاف أو تعليق هذا الحساب من قبل الإدارة (حالة الاشتراك: ممنوع)"));
          setTimeout(() => {
            onLogout();
          }, 3000);
        }
      } catch (err) {
        console.warn("Live status check error:", err);
      }
    };

    verifyStatus();
    const interval = setInterval(verifyStatus, 15000);
    window.addEventListener("focus", verifyStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", verifyStatus);
    };
  }, [subscriber.subscriberName, onLogout, t]);

  const socialPlatforms = [
    { name: "Facebook", url: socialLinks?.facebook, icon: Facebook, color: "hover:text-blue-500 hover:border-blue-500/40" },
    { name: "Instagram", url: socialLinks?.instagram, icon: Instagram, color: "hover:text-pink-500 hover:border-pink-500/40" },
    { name: "YouTube", url: socialLinks?.youtube, icon: Youtube, color: "hover:text-red-500 hover:border-red-500/40" },
    { name: "Line", url: socialLinks?.line, icon: Globe, color: "hover:text-emerald-500 hover:border-emerald-500/40" },
  ].filter(p => !!p.url);

  const activeContent = topicContent || subscriber.content;
  const hasTopicCards = activeContent && activeContent.cards && activeContent.cards.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950" dir={dir}>
      
      {/* Blocked Account Notification Modal */}
      <AnimatePresence>
        {blockedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-xl text-red-400">
                {t("subscriber_blocked_title", "تم تعليق الحساب")}
              </h3>
              <p className="text-slate-300 font-sans text-sm leading-relaxed">
                {blockedAlert}
              </p>
              <p className="text-slate-400 font-sans text-xs">
                {t("subscriber_blocked_logging_out", "جاري تسجيل الخروج وإعادتك للصفحة الرئيسية...")}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. TOP STICKY SUBSCRIBER BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/40 p-0.5 bg-slate-950"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h1 className="font-serif font-bold text-base sm:text-lg text-amber-400 leading-tight">
                {institutionTitle || t("header_title", "مؤسسة يوسف ذنون")}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{t("subscriber_portal_badge", "بوابة المشتركين")}</span>
              </div>
            </div>
          </div>

          {/* Subscriber Status, Refresh & Exit Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-full px-4 py-1.5 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-bold">
                {t("subscriber_welcome_greeting", "مرحباً بك مجدداً،")} {subscriber.subscriberName || t("subscriber_name_default", "مشترك")}
              </span>
            </div>

            {/* Quick Refresh Button */}
            <button
              onClick={() => reloadContent(true)}
              disabled={isRefreshing || isLoadingContent}
              title={t("subscriber_refresh_cards_tooltip", "تحديث بطاقات ومحتوى الموضوع")}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("subscriber_refresh_cards_btn", "تحديث البطاقات")}</span>
            </button>

            {/* Prominent Exit Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/15 to-red-600/15 hover:from-red-500 hover:to-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{subscriber.exitButtonText ? t(subscriber.exitButtonText, subscriber.exitButtonText) : t("subscriber_exit_portal_btn", "الخروج والعودة للرئيسية")}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO COVER BANNER (Column D - Clear Cover Image with No Overlaid Text) */}
      {activeContent?.coverImage && (
        <section className="relative w-full overflow-hidden bg-slate-900 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="relative w-full h-52 sm:h-72 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
              <img
                src={formatImageUrl(activeContent.coverImage)}
                alt="Topic Cover"
                className="w-full h-full object-cover object-center"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      )}

      {/* 3. TOPIC HEADER & MAIN CARDS GRID (10 CARDS) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isLoadingContent ? (
          /* Smooth Loading Skeleton for mobile / tablet */
          <div className="space-y-8 animate-pulse">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h3 className="font-serif font-bold text-xl text-amber-400">
                {t("subscriber_loading_topic_title", "جاري قراءة وتجهيز بطاقات المحتوى التعليمي...")}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-sans max-w-md mx-auto">
                {t("subscriber_loading_topic_desc", "يتم الآن جلب البطاقات والروابط المخصصة لموضوعك من جدول البيانات، يرجى الانتظار ثوانٍ معدودة.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 h-64 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-800 rounded-xl w-1/2"></div>
                    <div className="h-4 bg-slate-800/60 rounded-lg w-5/6"></div>
                    <div className="h-4 bg-slate-800/40 rounded-lg w-4/6"></div>
                  </div>
                  <div className="h-10 bg-slate-800 rounded-2xl w-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : hasTopicCards ? (
          <div>
            {/* Topic Header: Columns B, C and Column E (Badge) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10 pb-6 border-b border-slate-800">
              <div className="space-y-3 max-w-4xl">
                {/* Column B: Main Topic Title */}
                <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-amber-400 leading-tight">
                  {activeContent?.title ? t(activeContent.title, activeContent.title) : t("subscriber_custom_content_title", "المحتوى الخاص والدروس المخصصة")}
                </h2>

                {/* Column C: Topic Description & Header */}
                {activeContent?.description && (
                  <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-line">
                    {t(activeContent.description, activeContent.description)}
                  </p>
                )}
              </div>

              {/* Column E: Topic Badge */}
              {activeContent?.badge && (
                <div className="shrink-0 pt-1">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 text-xs sm:text-sm font-bold py-2 px-4 rounded-2xl border border-amber-500/30 shadow-md">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t(activeContent.badge, activeContent.badge)}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Responsive Grid for Cards (Without card number tags) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {activeContent?.cards.map((card: SubscriberCard, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Card Title */}
                    <div className="mb-3">
                      <h4 className="font-serif font-bold text-amber-400 text-xl leading-snug">
                        {t(card.title, card.title)}
                      </h4>
                    </div>

                    {/* Description */}
                    {card.description && (
                      <p className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
                        {t(card.description, card.description)}
                      </p>
                    )}

                    {/* Media Slideshow / Video */}
                    {card.media && card.media.length > 0 && (
                      <CardMediaCarousel media={card.media} />
                    )}
                  </div>

                  {/* Action Link Button */}
                  {card.linkUrl && (
                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <a
                        href={card.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-sm font-bold py-3 px-5 rounded-2xl text-center shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-4.5 h-4.5" />
                        <span>{card.buttonText ? t(card.buttonText, card.buttonText) : t("subscriber_open_link_btn", "فتح الرابط / المورد المرفق")}</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FALLBACK: LEGACY CUSTOM LINKS */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-800">
              <FileText className="w-6 h-6 text-amber-400" />
              <h3 className="font-serif font-bold text-2xl text-slate-100">
                {t("subscriber_custom_links_header", "روابطك التعليمية المخصصة")}
              </h3>
            </div>

            {subscriber.links && subscriber.links.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {subscriber.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-6 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-2 mb-6">
                      <h4 className="font-serif font-bold text-amber-400 text-lg">
                        {t(link.text, link.text)}
                      </h4>
                      {link.comment && (
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {t(link.comment, link.comment)}
                        </p>
                      )}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-3 px-4 rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{t("subscriber_open_custom_link", "زيارة وتصفح الرابط المرفق")}</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-300 text-sm font-sans max-w-md mx-auto">
                  {t("subscriber_empty_cards_msg", "لا توجد بطاقات أو روابط مضافة لموضوعك حالياً. يمكنك النقر على زر التحديث أدناه أو مراسلة الإدارة.")}
                </p>
                <button
                  onClick={() => reloadContent(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{t("subscriber_retry_fetch_cards", "إعادة محاولة جلب البطاقات الآن")}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. DEDICATED SUBSCRIBER FOOTER (Social Links + Clean Logout Button) */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 sm:px-6 mt-auto">
        <div className={`max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center ${
          dir === "rtl" ? "sm:text-right" : "sm:text-left"
        }`}>
          
          {/* Social Channels */}
          <div className="flex items-center gap-3">
            {socialPlatforms.length > 0 && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 font-bold ml-1 hidden sm:inline">
                  {t("subscriber_footer_social_label", "قنوات التواصل:")}
                </span>
                {socialPlatforms.map((plat, pIdx) => {
                  const Icon = plat.icon;
                  return (
                    <a
                      key={pIdx}
                      href={plat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 ${plat.color} transition-all shadow-md`}
                      aria-label={plat.name}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copyright info */}
          <p className="text-slate-500 text-xs font-sans">
            {t("footer_rights", "جميع الحقوق محفوظة")} © {new Date().getFullYear()} {institutionTitle || t("header_title", "مؤسسة يوسف ذنون")}
          </p>
        </div>
      </footer>
    </div>
  );
}
