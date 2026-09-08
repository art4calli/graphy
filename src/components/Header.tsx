import { useState, useEffect } from "react";
import { BookOpen, Image as ImageIcon, Play, ShoppingBag, Phone, HelpCircle, LogIn, Menu, X, Landmark, Globe, Sparkles, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProfileData, SocialLinks, CustomTexts } from "../types";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "./LanguageSelector";

interface HeaderProps {
  profile: ProfileData;
  socialLinks: SocialLinks;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  subscriberName?: string;
  onLogout: () => void;
  onOpenDashboard: () => void;
  onOpenSettings?: () => void;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
  customTexts?: CustomTexts;
}

export default function Header({
  profile,
  activeSection,
  onNavigate,
  onOpenLogin,
  isLoggedIn,
  subscriberName,
  onLogout,
  onOpenDashboard,
  onOpenSettings,
  isAdmin = false,
  onAdminLogout,
  customTexts,
}: HeaderProps) {
  const { t, dir } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  const announcements = [
    t("header_announcement_1", customTexts?.topAnnouncementRight || "مرحباً بكم في المنصة الرسمية المتطورة لمؤسسة يوسف ذنون للخط العربي"),
    t("header_announcement_2", customTexts?.topAnnouncementLocation || "الموصل، العراق"),
    t("header_announcement_3", customTexts?.topAnnouncementLeft || "تأسست لحفظ وإحياء تراث عميد الخط العربي الأستاذ يوسف ذنون")
  ].filter(Boolean);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % announcements.length);
    }, 6000); // 6 seconds display time
    return () => clearInterval(interval);
  }, [announcements.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", label: t("nav_home", customTexts?.navHome || "الرئيسية"), icon: Landmark },
    { id: "about", label: t("nav_about", customTexts?.navAbout || "عن المؤسسة"), icon: HelpCircle },
    { id: "artwork", label: t("nav_artwork", customTexts?.navArtwork || "معرض الصور"), icon: ImageIcon },
    { id: "video", label: t("nav_video", customTexts?.navVideo || "الفيديوهات"), icon: Play },
    { id: "courses", label: t("nav_courses", customTexts?.navCourses || "البرامج التعليمية"), icon: BookOpen },
    { id: "tools", label: t("nav_tools", customTexts?.navTools || "أدوات الخط"), icon: ShoppingBag },
    { id: "contact", label: t("nav_contact", customTexts?.navContact || "تواصل معنا"), icon: Phone },
  ];

  return (
    <header className="relative w-full z-50">
      {/* Top golden announcement bar */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-700 text-white text-xs py-2 px-4 font-sans font-bold flex justify-between items-center shadow-md overflow-hidden min-h-[38px] relative">
        <div className="flex items-center gap-2 z-10 pr-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
        </div>

        {/* Animated Carousel wrapper */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden h-6 mx-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={announcementIdx}
              initial={{ x: dir === "rtl" ? "-100%" : "100%", opacity: 0 }}
              animate={{ x: "0%", opacity: 1 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%", opacity: 0 }}
              transition={{ 
                x: { duration: 1.8, ease: "easeInOut" },
                opacity: { duration: 1.2 } 
              }}
              className="absolute text-center whitespace-nowrap text-white text-[11px] sm:text-xs font-bold tracking-wide select-none filter drop-shadow"
              dir={dir}
            >
              {announcements[announcementIdx]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden sm:flex items-center gap-2 z-10 shrink-0 pl-2">
          <span className="text-[10px] bg-slate-950/40 text-amber-200 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">
            {t("header_announcement_tag", customTexts?.topAnnouncementTag || "أخبار المؤسسة")}
          </span>
        </div>
      </div>

      {/* Main navigation header */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled || activeSection !== "home"
            ? "fixed top-0 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 py-2 shadow-xl"
            : "absolute bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="relative group">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img
                src={profile.logoUrl}
                alt={profile.title}
                className="relative w-12 h-12 rounded-full object-cover border-2 border-amber-500/40 p-0.5 bg-slate-900 group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300";
                }}
              />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-xl text-amber-400 leading-tight tracking-wide">
                {t("navbar_brand_title", customTexts?.navbarTitle || "مؤسسة يوسف ذنون")}
              </h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase">
                {t("navbar_brand_subtitle", customTexts?.navbarSubtitle || "للخط العربي والآثار الإسلامية")}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "text-slate-300 hover:text-amber-300 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop User Authentication Actions, Language Switcher & Admin Mode (>= lg) */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Language Selector Dropdown */}
            <LanguageSelector variant="header" />

            {isAdmin && onOpenSettings && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 px-2.5 py-1.5 rounded-full">
                <button
                  onClick={onOpenSettings}
                  title="فتح لوحة إعدادات المشرف"
                  className="text-amber-400 hover:text-amber-300 font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>{t("nav_admin_settings", "لوحة الإعدادات")}</span>
                </button>
                {onAdminLogout && (
                  <button
                    onClick={onAdminLogout}
                    title="تسجيل خروج المشرف"
                    className="text-[10px] bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-red-400 px-2 py-0.5 rounded-full transition-colors"
                  >
                    {t("nav_admin_logout", "خروج المشرف")}
                  </button>
                )}
              </div>
            )}

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenDashboard}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-full font-sans text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4" />
                  <span>{t("subscriber_welcome_greeting", "لوحة المشترك")}: {subscriberName}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-2 rounded-full font-sans text-xs transition-colors"
                >
                  {t("nav_logout", "تسجيل خروج")}
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="relative group overflow-hidden bg-slate-900 border border-amber-500/30 text-amber-400 hover:text-slate-950 px-4 py-2 rounded-full font-sans text-xs font-semibold shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-500 to-yellow-600 scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-300 ease-out"></span>
                <span className="relative flex items-center gap-1.5 z-10">
                  <LogIn className="w-4 h-4" />
                  <span>{t("nav_subscriber_portal", profile.loginButtonText || "بوابة المشتركين")}</span>
                </span>
              </button>
            )}
          </div>

          {/* Hamburger Menu Icon for Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector variant="header" />
            <button
              className="text-slate-300 hover:text-amber-400 p-1.5 rounded-lg focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/98 lg:hidden flex flex-col justify-center px-6 overflow-y-auto pt-16 pb-8">
          <div className="flex flex-col gap-4 py-4">
            {/* Mobile Language Selector */}
            <LanguageSelector variant="mobile" />

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl font-sans text-base font-medium transition-all ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-slate-300 hover:text-amber-300"
                  }`}
                >
                  <Icon className="w-5 h-5 text-amber-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {isAdmin && onOpenSettings && (
              <div className="flex flex-col gap-2 bg-slate-900 border border-amber-500/30 rounded-xl p-3">
                <button
                  onClick={() => {
                    onOpenSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 font-sans text-sm font-semibold text-amber-400"
                >
                  <Settings className="w-5 h-5 text-amber-500" />
                  <span>{t("nav_admin_settings", "لوحة إعدادات المشرف والربط")}</span>
                </button>
                {onAdminLogout && (
                  <button
                    onClick={() => {
                      onAdminLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xs text-red-400 text-right pr-8 hover:underline"
                  >
                    {t("nav_admin_logout", "تسجيل خروج المشرف")}
                  </button>
                )}
              </div>
            )}

            <div className="border-t border-slate-800/80 my-2"></div>

            {isLoggedIn ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onOpenDashboard();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 rounded-xl font-sans text-sm font-semibold shadow-lg text-center flex items-center justify-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                  <span>{t("subscriber_welcome_greeting", "لوحة المشترك")}: {subscriberName}</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-sans text-sm border border-red-500/20 text-center"
                >
                  {t("nav_logout", "تسجيل خروج المشترك")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 py-3.5 rounded-xl font-sans text-sm font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>{t("nav_subscriber_portal", profile.loginButtonText || "بوابة المشتركين")}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
