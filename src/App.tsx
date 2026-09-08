import { useState, useEffect } from "react";
import { Landmark, ArrowUp, Loader2, Sparkles, AlertCircle, BookOpen, GraduationCap, Users, Award, PenTool, Book, Compass, ShieldCheck, Star, Shield, Lock } from "lucide-react";
import Header from "./components/Header";
import HomeCard from "./components/HomeCard";
import AboutSection from "./components/AboutSection";
import GallerySection from "./components/GallerySection";
import VideoSection from "./components/VideoSection";
import CoursesSection from "./components/CoursesSection";
import ToolsSection from "./components/ToolsSection";
import ContactSection from "./components/ContactSection";
import SubscriberPortal from "./components/SubscriberPortal";
import SubscriberFullPage from "./components/SubscriberFullPage";
import IntegrationSettingsModal from "./components/IntegrationSettingsModal";
import RegistrationModal from "./components/RegistrationModal";
import AdminLoginModal from "./components/AdminLoginModal";
import { AppData, SubscriberState } from "./types";
import { fetchAllAppDataDirect } from "./utils/sheetParser";
import { loginSubscriberBridge, checkSubscriberAccountStatus, fetchFormQuestionsBridge, DEFAULT_SCRIPT_URL, DEFAULT_SPREADSHEET_ID, DEFAULT_DRIVE_FOLDER_ID } from "./utils/googleBackendBridge";
import { useLanguage } from "./context/LanguageContext";

function getFeatureIcon(iconName: string) {
  const name = (iconName || "").toLowerCase().trim();
  switch (name) {
    case "users":
    case "ناس":
    case "مستخدمين":
      return <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "graduation-cap":
    case "graduation":
    case "تعليم":
    case "قبعة":
    case "دراسة":
      return <GraduationCap className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "book-open":
    case "مكتبة":
    case "كتاب":
    case "كتب":
      return <BookOpen className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "landmark":
    case "مؤسسة":
    case "بناء":
    case "مبنى":
      return <Landmark className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "award":
    case "جائزة":
    case "وسام":
    case "شهادة":
      return <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "pentool":
    case "قلم":
    case "خط":
    case "ريشة":
      return <PenTool className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "compass":
    case "بوصلة":
    case "اتجاه":
      return <Compass className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "shield":
    case "ضمان":
    case "درع":
    case "أمان":
      return <ShieldCheck className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "sparkles":
    case "نجوم":
    case "إبداع":
      return <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    default:
      return <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
  }
}

export default function App() {
  const { t, currentLang, dir, syncWithAppData, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState("home");
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize site translations dynamically when AppData from Google Sheets is loaded
  useEffect(() => {
    if (appData) {
      syncWithAppData(appData);
    }
  }, [appData, syncWithAppData]);

  // Subscriber session state
  const [subscriber, setSubscriber] = useState<SubscriberState>({
    isLoggedIn: false,
    links: [],
  });
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);

  // Admin authentication & settings state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Configuration state with robust persistence & fallback for Vercel/GitHub Pages
  const [currentScriptUrl, setCurrentScriptUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url");
      if (saved && saved.trim().startsWith("http")) return saved.trim();
    }
    const envUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (envUrl && envUrl.trim().startsWith("http")) return envUrl.trim();
    return DEFAULT_SCRIPT_URL;
  });
  const [currentSpreadsheetId, setCurrentSpreadsheetId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thnoon_spreadsheet_id");
      if (saved && saved.trim()) return saved.trim();
    }
    const envId = import.meta.env.VITE_SPREADSHEET_ID;
    if (envId && envId.trim()) return envId.trim();
    return DEFAULT_SPREADSHEET_ID;
  });
  const [currentDriveFolderId, setCurrentDriveFolderId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thnoon_drive_folder_id");
      if (saved && saved.trim()) return saved.trim();
    }
    return DEFAULT_DRIVE_FOLDER_ID;
  });

  // Fetch configuration from server on mount (if available) with localStorage fallback
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.spreadsheetId) {
            setCurrentSpreadsheetId(cfg.spreadsheetId);
            localStorage.setItem("thnoon_spreadsheet_id", cfg.spreadsheetId);
          }
          if (cfg.scriptUrl && cfg.scriptUrl.trim().startsWith("http")) {
            setCurrentScriptUrl(cfg.scriptUrl.trim());
            localStorage.setItem("thnoon_script_url", cfg.scriptUrl.trim());
            localStorage.setItem("gas_script_url", cfg.scriptUrl.trim());
          }
          if (cfg.driveFolderId) {
            setCurrentDriveFolderId(cfg.driveFolderId);
            localStorage.setItem("thnoon_drive_folder_id", cfg.driveFolderId);
          }
          if (cfg.isAdmin) setIsAdminLoggedIn(true);
        } else {
          // Fallback for static hosts (Vercel, GitHub Pages) where /api/config is 404
          const localUrl = localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url");
          const localSheet = localStorage.getItem("thnoon_spreadsheet_id");
          const localFolder = localStorage.getItem("thnoon_drive_folder_id");
          if (localUrl && localUrl.trim().startsWith("http")) setCurrentScriptUrl(localUrl.trim());
          if (localSheet && localSheet.trim()) setCurrentSpreadsheetId(localSheet.trim());
          if (localFolder && localFolder.trim()) setCurrentDriveFolderId(localFolder.trim());
        }
      } catch (e) {
        console.warn("Could not fetch /api/config, checking localStorage:", e);
        const localUrl = localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url");
        const localSheet = localStorage.getItem("thnoon_spreadsheet_id");
        const localFolder = localStorage.getItem("thnoon_drive_folder_id");
        if (localUrl && localUrl.trim().startsWith("http")) setCurrentScriptUrl(localUrl.trim());
        if (localSheet && localSheet.trim()) setCurrentSpreadsheetId(localSheet.trim());
        if (localFolder && localFolder.trim()) setCurrentDriveFolderId(localFolder.trim());
      }
    };
    fetchConfig();

    // Prefetch Registration Questions from Google Sheet in the background on app load
    // so questions are already cached and ready instantly on any new device (phone/tablet/computer)
    fetchFormQuestionsBridge(currentScriptUrl, currentSpreadsheetId)
      .then((qs) => {
        if (qs && qs.length > 0) {
          console.log(`[App] Preloaded ${qs.length} registration questions from RegistrationQuestions sheet`);
        }
      })
      .catch(() => {});

    // Check saved admin session
    const savedAdminAuth =
      localStorage.getItem("thnoon_admin_auth") === "true" ||
      sessionStorage.getItem("thnoon_admin_auth") === "true";

    if (savedAdminAuth) {
      setIsAdminLoggedIn(true);
    }

    // Check saved subscriber session and verify Column AB status in Google Sheets
    const savedSubscriberRaw =
      sessionStorage.getItem("subscriberLogin") ||
      localStorage.getItem("thnoon_saved_subscriber");

    if (savedSubscriberRaw) {
      try {
        const parsed = JSON.parse(savedSubscriberRaw);
        const subData = parsed.data || parsed;
        const checkUser = parsed.username || subData?.subscriberName || "";

        if (checkUser) {
          checkSubscriberAccountStatus(checkUser).then((statusRes) => {
            if (statusRes.isBlocked) {
              // Account is blocked/ممنوع in Column AB! Force kick out immediately
              sessionStorage.removeItem("subscriberLogin");
              localStorage.removeItem("thnoon_saved_subscriber");
              setSubscriber({ isLoggedIn: false, links: [] });
              setIsDashboardOpen(false);
              setBlockedNotice("تم إيقاف أو تعليق هذا الحساب من قبل الإدارة (حالة الاشتراك في العمود AB: ممنوع)");
            } else if (subData && subData.success) {
              const links = [];
              for (let i = 1; i <= 5; i++) {
                const text = subData[`linkButtonText${i}`];
                const comment = subData[`linkButtonComment${i}`];
                const url = subData[`url${i}`];
                if (text && url) {
                  links.push({ text, comment, url });
                }
              }
              setSubscriber({
                isLoggedIn: true,
                subscriberName: subData.subscriberName,
                topicId: subData.topicId,
                content: subData.content,
                links,
                exitButtonText: subData.exitButtonText,
                exitButtonComment: subData.exitButtonComment,
              });
            }
          });
        }
      } catch (e) {
        console.warn("Error restoring subscriber session:", e);
      }
    }

    // Background pre-fetch form questions so form is ultra fast
    fetch("/api/form-questions")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          localStorage.setItem("thnoon_cached_registration_questions", JSON.stringify(data.questions));
        }
      })
      .catch(() => {});

    // Direct Link / Hash Routing for Registration, Subscriber Portal, and Admin
    const checkDirectRoutes = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hash = (window.location.hash || "").toLowerCase();

        // 1. Check language parameter (?lang=ar | ?lang=en | ?lang=th)
        const langParam = searchParams.get("lang");
        if (langParam === "ar" || langParam === "en" || langParam === "th") {
          setLanguage(langParam);
        }

        // 2. Direct Registration Form Link (?register=true | ?join=true | ?signup=true | ?form=register | #register | #join | #registration)
        const isRegisterRequested =
          searchParams.get("register") === "true" ||
          searchParams.get("register") === "1" ||
          searchParams.get("register") === "now" ||
          searchParams.get("join") === "true" ||
          searchParams.get("join") === "1" ||
          searchParams.get("signup") === "true" ||
          searchParams.get("form") === "register" ||
          searchParams.get("form") === "registration" ||
          searchParams.get("form") === "true" ||
          searchParams.get("page") === "register" ||
          searchParams.get("page") === "registration" ||
          hash === "#register" ||
          hash === "#registration" ||
          hash === "#join" ||
          hash === "#signup" ||
          hash === "#form";

        if (isRegisterRequested) {
          setIsRegistrationOpen(true);
        }

        // 3. Direct Subscriber Portal Login Link (?portal=true | ?subscriber=true | ?login=true | #portal | #login | #subscribers)
        const isPortalRequested =
          searchParams.get("portal") === "true" ||
          searchParams.get("portal") === "1" ||
          searchParams.get("portal") === "login" ||
          searchParams.get("subscriber") === "true" ||
          searchParams.get("subscribers") === "true" ||
          searchParams.get("login") === "true" ||
          searchParams.get("login") === "1" ||
          searchParams.get("page") === "portal" ||
          searchParams.get("page") === "subscriber" ||
          hash === "#portal" ||
          hash === "#login" ||
          hash === "#subscriber" ||
          hash === "#subscribers";

        if (isPortalRequested) {
          setIsLoginOpen(true);
        }

        // 4. Admin Link (?admin=true | #admin)
        const isAdminRequested =
          searchParams.get("admin") === "true" ||
          searchParams.get("admin") === "1" ||
          searchParams.get("page") === "admin" ||
          searchParams.get("page") === "settings" ||
          searchParams.get("settings") === "true" ||
          searchParams.get("secret") === "admin" ||
          hash === "#admin" ||
          hash === "#settings";

        if (isAdminRequested) {
          const isAuth =
            localStorage.getItem("thnoon_admin_auth") === "true" ||
            sessionStorage.getItem("thnoon_admin_auth") === "true";
          if (isAuth) {
            setIsAdminLoggedIn(true);
            setIsSettingsOpen(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }
      } catch (e) {
        console.warn("Error parsing URL direct routes:", e);
      }
    };

    checkDirectRoutes();
    window.addEventListener("hashchange", checkDirectRoutes);
    window.addEventListener("popstate", checkDirectRoutes);

    // Keyboard shortcut for discrete Admin login: Ctrl + Shift + A or Alt + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) || (e.altKey && (e.key === "a" || e.key === "A"))) {
        e.preventDefault();
        const isAuth =
          localStorage.getItem("thnoon_admin_auth") === "true" ||
          sessionStorage.getItem("thnoon_admin_auth") === "true";
        if (isAuth) {
          setIsAdminLoggedIn(true);
          setIsSettingsOpen(true);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hashchange", checkDirectRoutes);
      window.removeEventListener("popstate", checkDirectRoutes);
    };
  }, [setLanguage]);

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsAdminLoginOpen(false);
    setIsSettingsOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setIsSettingsOpen(false);
    localStorage.removeItem("thnoon_admin_auth");
    sessionStorage.removeItem("thnoon_admin_auth");
    fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
  };

  const reloadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/data");
      if (response.ok) {
        const data = await response.json();
        setAppData(data);
      } else {
        const directData = await fetchAllAppDataDirect();
        setAppData(directData);
      }
    } catch (err) {
      console.error("Failed to reload data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (newScriptUrl: string, newSpreadsheetId: string, newDriveFolderId?: string) => {
    const cleanUrl = (newScriptUrl || "").trim();
    const cleanSheet = (newSpreadsheetId || "").trim();
    const cleanFolder = (newDriveFolderId || currentDriveFolderId || "").trim();

    setCurrentScriptUrl(cleanUrl);
    setCurrentSpreadsheetId(cleanSheet);
    if (cleanFolder) {
      setCurrentDriveFolderId(cleanFolder);
      localStorage.setItem("thnoon_drive_folder_id", cleanFolder);
    }
    localStorage.setItem("thnoon_script_url", cleanUrl);
    localStorage.setItem("gas_script_url", cleanUrl);
    localStorage.setItem("thnoon_spreadsheet_id", cleanSheet);

    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptUrl: cleanUrl,
          spreadsheetId: cleanSheet,
          driveFolderId: cleanFolder
        })
      });
    } catch (err) {
      console.warn("Server config POST failed, updated client locally:", err);
    }

    // Refresh data with updated config
    await reloadData();
  };

  // Fetch initial database content with direct client-side fallback for static deploys (Vercel/GitHub Pages)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. First try calling the server API (works in AI Studio and dynamic servers)
        const response = await fetch("/api/data");
        if (response.ok) {
          const data = await response.json();
          setAppData(data);
        } else {
          // If server returns error, fallback directly to Google Sheets from the browser!
          console.warn("Express API returned non-ok, falling back to direct sheets fetching...");
          const directData = await fetchAllAppDataDirect();
          setAppData(directData);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Express API failed, falling back to direct sheets fetching:", err);
        try {
          // 2. Fetch directly from the Google Sheets Viz API (essential for Vercel/GitHub static sites)
          const directData = await fetchAllAppDataDirect();
          setAppData(directData);
          setIsLoading(false);
        } catch (fallbackErr) {
          console.error("Direct browser-sheets fetch failed too:", fallbackErr);
          setError("فشل الاتصال بقاعدة البيانات المباشرة لـ Google Sheets. تم تحميل التصاميم الاحتياطية.");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Recover login session from storage
    const storedLogin = sessionStorage.getItem("subscriberLogin");
    if (storedLogin) {
      try {
        const parsed = JSON.parse(storedLogin);
        if (parsed && parsed.success) {
          const links = [];
          for (let i = 1; i <= 5; i++) {
            const text = parsed[`linkButtonText${i}`];
            const comment = parsed[`linkButtonComment${i}`];
            const url = parsed[`url${i}`];
            if (text && url) {
              links.push({ text, comment, url });
            }
          }
          setSubscriber({
            isLoggedIn: true,
            subscriberName: parsed.subscriberName,
            topicId: parsed.topicId,
            content: parsed.content,
            links,
            exitButtonText: parsed.exitButtonText,
            exitButtonComment: parsed.exitButtonComment,
          });
        }
      } catch (e) {
        console.error("Failed to parse stored login session:", e);
      }
    }
  }, []);

  // Monitor window scroll to show "Back to top" button
  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = async (usernameInput: string, passwordInput: string) => {
    try {
      // Create a unique, ultra-persistent client fingerprint (localStorage + Cookies)
      let fingerprint = localStorage.getItem("thnoon_secure_device_id") || localStorage.getItem("deviceId");
      if (!fingerprint) {
        try {
          const match = document.cookie.match(/thnoon_device_id=([^;]+)/);
          if (match && match[1]) fingerprint = decodeURIComponent(match[1]);
        } catch (e) {}
      }
      if (!fingerprint) {
        const randomPart = (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : `id_${Math.random().toString(36).substring(2)}_${Date.now().toString(36)}`;
        fingerprint = `DEV-${randomPart}`;
      }
      // Guarantee persistence in both localStorage and long-lived cookie
      try {
        localStorage.setItem("thnoon_secure_device_id", fingerprint);
        localStorage.setItem("deviceId", fingerprint);
        document.cookie = `thnoon_device_id=${encodeURIComponent(fingerprint)}; path=/; max-age=315360000; SameSite=Lax`;
      } catch (e) {}

      // Check geo permission (optional coordinates)
      let coords: { latitude: number; longitude: number } | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        coords = pos.coords;
      } catch (e) {
        console.log("Geolocation omitted or rejected");
      }

      // Device and browser identification
      const userAgent = navigator.userAgent || "";
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      const browserInfo = isMobile ? "هاتف محمول / جوال" : "كمبيوتر / متصفح مكتبي";
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const fullDeviceInfo = `${browserInfo} (${navigator.platform || "Platform"}) - ${timezone}`;

      // Universal login execution through GoogleBackendBridge (Works on AI Studio, Vercel, and GitHub Pages)
      const data = await loginSubscriberBridge(
        usernameInput,
        passwordInput,
        fingerprint,
        {
          lat: coords?.latitude || null,
          lng: coords?.longitude || null,
          locationName: timezone ? `منطقة: ${timezone}` : "",
          deviceInfo: fullDeviceInfo
        }
      );

      if (data && data.success) {
        sessionStorage.setItem("subscriberLogin", JSON.stringify(data));
        localStorage.setItem("thnoon_saved_subscriber", JSON.stringify({ username: usernameInput, data }));
        const links = [];
        for (let i = 1; i <= 5; i++) {
          const text = data[`linkButtonText${i}`];
          const comment = data[`linkButtonComment${i}`];
          const url = data[`url${i}`];
          if (text && url) {
            links.push({ text, comment, url });
          }
        }
        setSubscriber({
          isLoggedIn: true,
          subscriberName: data.subscriberName,
          topicId: data.topicId,
          content: data.content,
          links,
          exitButtonText: data.exitButtonText,
          exitButtonComment: data.exitButtonComment,
        });
        setIsDashboardOpen(true);
        return { success: true };
      } else {
        if (data?.isBlocked) {
          sessionStorage.removeItem("subscriberLogin");
          localStorage.removeItem("thnoon_saved_subscriber");
          setBlockedNotice(data.message || "تم إيقاف أو تعليق هذا الحساب من قبل الإدارة (حالة الاشتراك: ممنوع)");
        }
        return { success: false, message: data?.message || "اسم المستخدم أو كلمة المرور غير صحيحة" };
      }
    } catch (err) {
      console.error("Login execution failed completely:", err);
      return { success: false, message: "فشل التحقق بسبب عطل في الشبكة" };
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("subscriberLogin");
    localStorage.removeItem("thnoon_saved_subscriber");
    setSubscriber({ isLoggedIn: false, links: [] });
    setIsDashboardOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Luxury Spinner page load screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-amber-500 animate-spin relative z-10" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-amber-400">مؤسسة يوسف ذنون للخط العربي</h2>
        <p className="text-slate-400 font-sans text-xs mt-2 animate-pulse tracking-wider">
          جاري قراءة البيانات الحية من قاعدة بيانات Google Sheets وتصميم المنصة الإبداعية...
        </p>
      </div>
    );
  }

  // Safe Fallback defaults
  const profile = appData?.profile || {
    logoUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300",
    title: "مؤسسة يوسف ذنون للخط العربي",
    description: "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.",
    loginButtonText: "بوابة المشتركين",
    loginButtonUrl: "#login",
    features: [
      {
        title: "الترخيص الخطّي",
        description: "تمنح المؤسسة إجازات خطية معتمدة دولياً",
        icon: "users"
      },
      {
        title: "التعليم النظامي",
        description: "دورات حضورية وأخرى رقمية عن بُعد",
        icon: "graduation-cap"
      },
      {
        title: "مكتبة نادرة",
        description: "مئات الكتب والمجلدات عن الحرف والآثار",
        icon: "book-open"
      }
    ]
  };

  const socialLinks = appData?.socialLinks || {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    line: "https://line.me",
  };

  // If Subscriber is logged in, directly render the Full Dedicated Subscriber Page
  if (subscriber.isLoggedIn) {
    return (
      <SubscriberFullPage
        subscriber={subscriber}
        onLogout={handleLogout}
        logoUrl={profile.logoUrl}
        institutionTitle={profile.title}
        socialLinks={socialLinks}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between overflow-x-hidden">
      
      {/* 1. Header Navigation Component */}
      <Header
        profile={profile}
        socialLinks={socialLinks}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenLogin={() => setIsLoginOpen(true)}
        isLoggedIn={subscriber.isLoggedIn}
        subscriberName={subscriber.subscriberName}
        onLogout={handleLogout}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAdmin={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        customTexts={appData?.customTexts}
      />

      {/* 2. Hero Luxury Parallax Banner Section */}
      {activeSection === "home" && (
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-900 overflow-hidden">
          {profile.headerBgUrl ? (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={profile.headerBgUrl}
                alt={profile.title}
                className="w-full h-full object-cover opacity-50 animate-slow-zoom"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/95"></div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4a017_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"></div>
              {/* Soft Golden ambient glow */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </>
          )}

          <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 text-xs font-sans font-bold py-1.5 px-3.5 rounded-full border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("hero_badge", appData?.customTexts?.heroSubtag || "بوابة الحرف العربي والآثار الإسلامية")}</span>
            </div>

            <h1 className="font-serif font-black text-4xl sm:text-5xl md:text-6xl text-amber-400 leading-tight tracking-wide">
              {t("hero_title", profile.title)}
            </h1>

            <p className="max-w-2xl mx-auto text-slate-300 font-sans text-sm sm:text-base md:text-lg leading-relaxed">
              {t("hero_description", profile.description)}
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={() => handleNavigate("courses")}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm py-3 px-6 rounded-xl shadow-lg shadow-amber-500/15 transition-all transform hover:scale-105 cursor-pointer"
              >
                {t("hero_primary_btn", appData?.customTexts?.heroPrimaryBtn || "استكشف البرامج التعليمية")}
              </button>
              <button
                onClick={() => handleNavigate("artwork")}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-amber-400 text-sm font-sans font-bold py-3 px-6 rounded-xl transition-all"
              >
                {t("hero_secondary_btn", appData?.customTexts?.heroSecondaryBtn || "عرض المعرض الفني")}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Database Connection Warning Banner (If direct query fails) */}
      {error && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3.5 px-4 text-center flex items-center justify-center gap-2 text-amber-400 text-xs sm:text-sm font-sans">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Main content render space */}
      <main className="flex-grow">
        
        {/* HOME SECTION */}
        {activeSection === "home" && (
          <div id="home">
            <section className="py-16 px-4 max-w-7xl mx-auto">
              <h3 className="font-serif font-bold text-2xl text-amber-400 border-r-4 border-amber-500 pr-3 mb-10 text-right">
                {t("home_section_title", appData?.customTexts?.homeSectionTitle || "الواجهة الترحيبية ومستجدات المؤسسة")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {appData?.homeCards.map((card, idx) => (
                  <HomeCard
                    key={idx}
                    card={card}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>

              {/* Premium quick-link metric summary */}
              {profile.features && profile.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20 border-t border-slate-900/60 pt-12">
                  {profile.features.map((feature, fIdx) => (
                    <div key={fIdx} className="text-center p-4">
                      {getFeatureIcon(feature.icon || "star")}
                      <h4 className="font-serif font-bold text-lg text-slate-200">
                        {t(feature.title, feature.title)}
                      </h4>
                      <p className="text-slate-400 font-sans text-xs mt-1 leading-relaxed">
                        {t(feature.description, feature.description)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CONTACT SECTION - Rendered directly underneath Home profile */}
            <div className="border-t border-slate-900/40">
              <ContactSection cards={appData?.contactCards || []} socialLinks={socialLinks} contactInfo={appData?.contactInfo} customTexts={appData?.customTexts} />
            </div>
          </div>
        )}

        {/* ABOUT SECTION */}
        {activeSection === "about" && (
          <div id="about" className="pt-24 md:pt-28">
            <AboutSection cards={appData?.aboutCards || []} biography={appData?.biography} header={appData?.sectionHeaders?.about} customTexts={appData?.customTexts} />
          </div>
        )}

        {/* ARTWORK GALLERY SECTION */}
        {activeSection === "artwork" && (
          <div id="artwork" className="pt-24 md:pt-28">
            <GallerySection cards={appData?.artworkCards || []} header={appData?.sectionHeaders?.artwork} />
          </div>
        )}

        {/* VIDEO LIBRARY SECTION */}
        {activeSection === "video" && (
          <div id="video" className="pt-24 md:pt-28">
            <VideoSection cards={appData?.videoCards || []} header={appData?.sectionHeaders?.video} />
          </div>
        )}

        {/* EDUCATIONAL COURSES SECTION */}
        {activeSection === "courses" && (
          <div id="courses" className="pt-24 md:pt-28">
            <CoursesSection cards={appData?.coursesCards || []} header={appData?.sectionHeaders?.courses} />
          </div>
        )}

        {/* TOOLS AND SUPPLIES SECTION */}
        {activeSection === "tools" && (
          <div id="tools" className="pt-24 md:pt-28">
            <ToolsSection cards={appData?.toolsCards || []} header={appData?.sectionHeaders?.tools} />
          </div>
        )}

        {/* CONTACT SECTION (Independent Page View) */}
        {activeSection === "contact" && (
          <div id="contact" className="pt-24 md:pt-28">
            <ContactSection cards={appData?.contactCards || []} socialLinks={socialLinks} contactInfo={appData?.contactInfo} customTexts={appData?.customTexts} />
          </div>
        )}

      </main>

      {/* 4. Highly Elegant Arabic Calligraphy Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-center md:text-right">
          
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-serif font-bold text-xl text-amber-400">
              {t("footer_title", appData?.customTexts?.footerTitle || "مؤسسة يوسف ذنون")}
            </h4>
            <p className="text-slate-400 font-sans text-xs leading-relaxed">
              {t("footer_description", appData?.customTexts?.footerDescription || "مؤسسة مرخصة تُعنى برعاية الخطاطين وحفظ الموروث الفني والإرث الآثاري للأستاذ عميد الخط العربي يوسف ذنون رحمه الله.")}
            </p>
          </div>

          <div className="md:col-span-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-sans text-slate-400">
            <button onClick={() => handleNavigate("home")} className="hover:text-amber-400 transition-colors">
              {t("nav_home", appData?.customTexts?.navHome || "الرئيسية")}
            </button>
            <button onClick={() => handleNavigate("about")} className="hover:text-amber-400 transition-colors">
              {t("nav_about", appData?.customTexts?.navAbout || "عن المؤسسة")}
            </button>
            <button onClick={() => handleNavigate("artwork")} className="hover:text-amber-400 transition-colors">
              {t("nav_artwork", appData?.customTexts?.navArtwork || "معرض الصور")}
            </button>
            <button onClick={() => handleNavigate("video")} className="hover:text-amber-400 transition-colors">
              {t("nav_video", appData?.customTexts?.navVideo || "الفيديوهات")}
            </button>
            <button onClick={() => handleNavigate("courses")} className="hover:text-amber-400 transition-colors">
              {t("nav_courses", appData?.customTexts?.navCourses || "البرامج التعليمية")}
            </button>
            <button onClick={() => handleNavigate("tools")} className="hover:text-amber-400 transition-colors">
              {t("nav_tools", appData?.customTexts?.navTools || "أدوات الخط")}
            </button>
            <button onClick={() => handleNavigate("contact")} className="hover:text-amber-400 transition-colors">
              {t("nav_contact", appData?.customTexts?.navContact || "تواصل معنا")}
            </button>
          </div>

          <div className="md:col-span-4 text-center md:text-left space-y-1">
            <p className="text-slate-500 font-sans text-[11px] leading-normal">
              {t("footer_copyright", appData?.customTexts?.footerCopyright || "جميع الحقوق محفوظة ومسجلة")} © {new Date().getFullYear()}
            </p>
            <p className="text-slate-600 font-sans text-[10px]">
              {t("navbar_brand_title", appData?.customTexts?.navbarTitle || "مؤسسة يوسف ذنون")} {t("navbar_brand_subtitle", appData?.customTexts?.navbarSubtitle || "للخط العربي والآثار الإسلامية")}
            </p>
            {/* Discrete Admin Link trigger */}
            <div className="pt-2 flex justify-center md:justify-start">
              <button
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setIsSettingsOpen(true);
                  } else {
                    setIsAdminLoginOpen(true);
                  }
                }}
                className="text-slate-700 hover:text-amber-500/80 transition-colors text-[10px] flex items-center gap-1 opacity-70 hover:opacity-100 font-mono"
                title="بوابة إعدادات المشرف (خاص بالإدارة)"
              >
                <Lock className="w-3 h-3 text-slate-600 hover:text-amber-500" />
                <span>{isAdminLoggedIn ? t("admin_connected", "لوحة المشرف (متصل)") : t("admin_login_btn", "دخول المشرف")}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal (Protected access for settings) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Integration & Settings Modal */}
      <IntegrationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentScriptUrl={currentScriptUrl}
        currentSpreadsheetId={currentSpreadsheetId}
        currentDriveFolderId={currentDriveFolderId}
        onSaveConfig={handleSaveConfig}
        onAdminLogout={handleAdminLogout}
      />

      {/* 5. Subscriber Login Modal */}
      <SubscriberPortal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        subscriber={subscriber}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenRegistration={() => {
          setIsLoginOpen(false);
          setIsRegistrationOpen(true);
        }}
      />

      {/* 6. Dynamic Registration Modal (RegistrationQuestions Sheet) */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        scriptUrl={currentScriptUrl}
        spreadsheetId={currentSpreadsheetId}
        driveFolderId={currentDriveFolderId}
      />

      {/* 7. Blocked / Suspended Account Notification Modal */}
      {blockedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" dir="rtl">
          <div className="bg-slate-900 border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-red-400">حساب موقوف</h3>
            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              {blockedNotice}
            </p>
            <button
              onClick={() => setBlockedNotice(null)}
              className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-sans font-bold text-sm rounded-xl transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 8. Back-to-Top circular button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full shadow-2xl transition-all transform hover:scale-110 z-40"
          title="العودة لأعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

    </div>
  );
}
