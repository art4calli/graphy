import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Sparkles,
  Globe,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Link,
  Video,
  Play,
  X,
  Maximize2,
  Check,
  Languages
} from "lucide-react";
import { SubscriberTopicContent, SubscriberCard } from "../types";
import {
  fetchAllSubscriberTopicsBridge,
  saveSubscriberTopicBridge,
  deleteSubscriberTopicBridge,
  getLocalSubscriberTopics,
  saveLocalSubscriberTopics
} from "../utils/googleBackendBridge";
import { formatImageUrl } from "../utils/imageUtils";

interface SubscriberContentManagerProps {
  currentScriptUrl?: string;
  currentSpreadsheetId?: string;
  initialTopicId?: string;
  onOpenTopicPreview?: (topicId: string) => void;
}

export default function SubscriberContentManager({
  currentScriptUrl,
  currentSpreadsheetId,
  initialTopicId,
  onOpenTopicPreview
}: SubscriberContentManagerProps) {
  const [topics, setTopics] = useState<SubscriberTopicContent[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("1");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [activeLangTab, setActiveLangTab] = useState<"ar" | "en" | "th">("ar");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewLang, setPreviewLang] = useState<"ar" | "en" | "th">("ar");

  // Load topics from cache and remote sheet
  const loadTopics = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // First check local system storage
      const local = getLocalSubscriberTopics();
      if (local.length > 0) {
        setTopics(local);
        if (initialTopicId && local.some((t) => t.topicId === initialTopicId)) {
          setSelectedTopicId(initialTopicId);
        } else if (!local.some((t) => t.topicId === selectedTopicId)) {
          setSelectedTopicId(local[0].topicId);
        }
      }

      // Sync fresh from Google Sheets / backend
      const res = await fetchAllSubscriberTopicsBridge(currentSpreadsheetId, currentScriptUrl);
      if (res.success && res.topics && res.topics.length > 0) {
        setTopics(res.topics);
        if (initialTopicId && res.topics.some((t) => t.topicId === initialTopicId)) {
          setSelectedTopicId(initialTopicId);
        } else if (!res.topics.some((t) => t.topicId === selectedTopicId)) {
          setSelectedTopicId(res.topics[0].topicId);
        }
      }
    } catch (e: any) {
      console.warn("Failed loading subscriber topics:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [currentSpreadsheetId, currentScriptUrl]);

  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);

  // Current active topic
  const currentTopic = useMemo(() => {
    const found = topics.find((t) => t.topicId === selectedTopicId);
    if (found) return found;
    return (
      topics[0] || {
        topicId: "1",
        title: "",
        description: "",
        cards: []
      }
    );
  }, [topics, selectedTopicId]);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Mutate current topic
  const updateCurrentTopic = (mutator: (prev: SubscriberTopicContent) => SubscriberTopicContent) => {
    setTopics((prevTopics) => {
      const idx = prevTopics.findIndex((t) => t.topicId === selectedTopicId);
      if (idx === -1) {
        const updated = mutator({
          topicId: selectedTopicId,
          title: "",
          description: "",
          cards: []
        });
        const next = [...prevTopics, updated];
        saveLocalSubscriberTopics(next);
        return next;
      }
      const updated = mutator(prevTopics[idx]);
      const next = [...prevTopics];
      next[idx] = updated;
      saveLocalSubscriberTopics(next);
      return next;
    });
  };

  // Add new topic page (row)
  const handleAddNewTopic = () => {
    // Determine next topicId number
    const numericIds = topics
      .map((t) => parseInt(t.topicId.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : topics.length + 1;
    const newTopicIdStr = nextId.toString();

    const newTopic: SubscriberTopicContent = {
      topicId: newTopicIdStr,
      rowIndex: topics.length + 2,
      title: `صفحة جديدة رقم ${newTopicIdStr}`,
      titleEn: `New Topic Page #${newTopicIdStr}`,
      titleTh: `หน้าหัวข้อใหม่ #${newTopicIdStr}`,
      description: "أهلاً بك في صفحتك المخصصة لمتابعة الدورة والمحتوى التعليمي.",
      descriptionEn: "Welcome to your customized course page and learning materials.",
      descriptionTh: "ยินดีต้อนรับสู่หน้าหลักสูตรและสื่อการเรียนรู้ที่คุณกำหนดเอง",
      badge: "دورة تدريبية",
      badgeEn: "Training Course",
      badgeTh: "หลักสูตรฝึกอบรม",
      cards: [
        {
          id: "card_1",
          title: "المحور الأول: الدرس والمحتوى الرئيسي",
          titleEn: "Unit 1: Main Lesson and Content",
          titleTh: "หน่วยที่ 1: บทเรียนและเนื้อหาหลัก",
          description: "تفاصيل وشرح المحور الأول، تجد هنا المواد والشروحات المرفقة.",
          descriptionEn: "Details and explanation for the first unit, find attached resources here.",
          descriptionTh: "รายละเอียดและคำอธิบายสำหรับหน่วยแรก ค้นหาแหล่งข้อมูลที่แนบมาได้ที่นี่",
          media: [],
          mediaUrl: "",
          linkUrl: ""
        }
      ],
      updatedAt: new Date().toISOString()
    };

    const nextTopics = [...topics, newTopic];
    setTopics(nextTopics);
    saveLocalSubscriberTopics(nextTopics);
    setSelectedTopicId(newTopicIdStr);
    showNotification(`تمت إضافة صفحة جديدة بنجاح (رقم ${newTopicIdStr})`);
  };

  // Delete current topic page
  const handleDeleteCurrentTopic = async () => {
    if (topics.length <= 1) {
      showNotification("يجب الإبقاء على صفحة واحدة على الأقل في النظام", "error");
      return;
    }
    const confirmed = window.confirm(
      `هل أنت متأكد من رغبتك في حذف الصفحة رقم (${currentTopic.topicId}) "${currentTopic.title}" من النظام والشيت؟`
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);
      await deleteSubscriberTopicBridge(currentTopic.topicId, currentTopic.rowIndex, currentScriptUrl);
      const remaining = topics.filter((t) => t.topicId !== currentTopic.topicId);
      setTopics(remaining);
      saveLocalSubscriberTopics(remaining);
      setSelectedTopicId(remaining[0].topicId);
      showNotification("تم حذف الصفحة بنجاح من النظام");
    } catch (e: any) {
      showNotification("حدث خطأ أثناء محاولة الحذف: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Card Management
  const handleAddCard = () => {
    updateCurrentTopic((prev) => {
      const currentCards = prev.cards || [];
      const newCardNum = currentCards.length + 1;
      const newCard: SubscriberCard = {
        id: `card_${Date.now()}_${newCardNum}`,
        title: `الدرس ${newCardNum}: عنوان المحور أو المادة`,
        titleEn: `Lesson ${newCardNum}: Topic Title`,
        titleTh: `บทเรียนที่ ${newCardNum}: หัวข้อ`,
        description: "شرح مختصر وتوجيهات عملية للمشترك.",
        descriptionEn: "Brief explanation and practical instructions.",
        descriptionTh: "คำอธิบายโดยย่อและคำแนะนำการปฏิบัติ",
        media: [],
        mediaUrl: "",
        linkUrl: ""
      };
      return {
        ...prev,
        cards: [...currentCards, newCard]
      };
    });
    showNotification("تمت إضافة بطاقة جديدة بنجاح");
  };

  const handleRemoveCard = (cardIndex: number) => {
    updateCurrentTopic((prev) => {
      const nextCards = [...(prev.cards || [])];
      nextCards.splice(cardIndex, 1);
      return { ...prev, cards: nextCards };
    });
  };

  const handleMoveCard = (index: number, direction: "up" | "down") => {
    updateCurrentTopic((prev) => {
      const cards = [...(prev.cards || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= cards.length) return prev;
      const temp = cards[index];
      cards[index] = cards[targetIndex];
      cards[targetIndex] = temp;
      return { ...prev, cards };
    });
  };

  // Smart Translation Engine using AI
  const handleTranslateAllWithAI = async () => {
    if (!currentTopic) return;
    setIsTranslating(true);
    showNotification("جاري تشغيل الترجمة الذكية بالذكاء الاصطناعي للنصوص...", "info");

    try {
      const itemsToTranslate: Array<{ id: string; ar: string }> = [];

      // 1. Header items
      if (currentTopic.title && currentTopic.title.trim()) {
        itemsToTranslate.push({ id: "header_title", ar: currentTopic.title.trim() });
      }
      if (currentTopic.description && currentTopic.description.trim()) {
        itemsToTranslate.push({ id: "header_desc", ar: currentTopic.description.trim() });
      }
      if (currentTopic.badge && currentTopic.badge.trim()) {
        itemsToTranslate.push({ id: "header_badge", ar: currentTopic.badge.trim() });
      }

      // 2. Card items
      (currentTopic.cards || []).forEach((c, idx) => {
        if (c.title && c.title.trim()) {
          itemsToTranslate.push({ id: `card_${idx}_title`, ar: c.title.trim() });
        }
        if (c.description && c.description.trim()) {
          itemsToTranslate.push({ id: `card_${idx}_desc`, ar: c.description.trim() });
        }
      });

      if (itemsToTranslate.length === 0) {
        showNotification("لا توجد نصوص عربية مدخلة لترجمتها", "error");
        setIsTranslating(false);
        return;
      }

      const res = await fetch("/api/ai-translate-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToTranslate })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success && data.results) {
        const results = data.results;

        updateCurrentTopic((prev) => {
          const updated: SubscriberTopicContent = { ...prev };

          if (results["header_title"]) {
            updated.titleEn = results["header_title"].en || prev.titleEn;
            updated.titleTh = results["header_title"].th || prev.titleTh;
          }
          if (results["header_desc"]) {
            updated.descriptionEn = results["header_desc"].en || prev.descriptionEn;
            updated.descriptionTh = results["header_desc"].th || prev.descriptionTh;
          }
          if (results["header_badge"]) {
            updated.badgeEn = results["header_badge"].en || prev.badgeEn;
            updated.badgeTh = results["header_badge"].th || prev.badgeTh;
          }

          updated.cards = (prev.cards || []).map((card, idx) => {
            const titleRes = results[`card_${idx}_title`];
            const descRes = results[`card_${idx}_desc`];
            return {
              ...card,
              titleEn: titleRes?.en || card.titleEn,
              titleTh: titleRes?.th || card.titleTh,
              descriptionEn: descRes?.en || card.descriptionEn,
              descriptionTh: descRes?.th || card.descriptionTh
            };
          });

          return updated;
        });

        showNotification("تمت الترجمة الذكية بنجاح باللغتين الإنجليزية والتايلاندية!");
      } else {
        showNotification(data?.message || "تعذر إتمام الترجمة الذكية، تحقق من الاتصال", "error");
      }
    } catch (err: any) {
      showNotification("خطأ أثناء الترجمة: " + err.message, "error");
    } finally {
      setIsTranslating(false);
    }
  };

  // Save to system store & sync with Google Sheets
  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      const res = await saveSubscriberTopicBridge(currentTopic, currentScriptUrl);
      if (res.success) {
        showNotification(res.message || "تم حفظ الصفحة بنجاح في النظام وفي قوقل شيت!", "success");
      } else {
        showNotification(res.message || "فشلت المزامنة في الشيت", "error");
      }
    } catch (e: any) {
      showNotification("حدث خطأ أثناء الحفظ: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" dir="rtl">
      {/* Top Banner & Context Info */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>إدارة المحتوى المباشر • ورقة SubscriberContent</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              محتوى المشتركين والصفحات الخاصة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              إدارة صفحات المحتوى والبطاقات مباشرة من داخل النظام بسرعة فائقة، مع دعم الترجمة الذكية بالذكاء الاصطناعي والمزامنة التلقائية مع قوقل شيت.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Refresh from Sheet */}
            <button
              onClick={() => loadTopics(true)}
              disabled={isLoading || isSaving}
              title="تحديث البيانات من قوقل شيت"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>تحديث الشيت</span>
            </button>

            {/* Smart AI Translation Button */}
            <button
              onClick={handleTranslateAllWithAI}
              disabled={isTranslating || isSaving}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-300 border border-indigo-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Languages className={`w-4 h-4 text-indigo-400 ${isTranslating ? "animate-spin" : ""}`} />
              <span>{isTranslating ? "جاري الترجمة..." : "ترجمة ذكية بالذكاء الاصطناعي"}</span>
            </button>

            {/* Live Preview Button */}
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الصفحة</span>
            </button>

            {/* Main Save & Sync Button */}
            <button
              onClick={handleSaveAndSync}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
              <span>{isSaving ? "جاري الحفظ والمزامنة..." : "حفظ ومزامنة في قوقل شيت"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-2xl border text-xs sm:text-sm flex items-center gap-2.5 transition-all animate-fadeIn ${
              feedback.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : feedback.type === "error"
                ? "bg-red-500/15 border-red-500/30 text-red-300"
                : "bg-blue-500/15 border-blue-500/30 text-blue-300"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {feedback.type === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
            {feedback.type === "info" && <Sparkles className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Pages / Topics Switcher Row */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-bold ml-1">اختر الصفحة (رقم الصف في الورقة):</span>
          {topics.map((t) => {
            const isCurrent = t.topicId === selectedTopicId;
            return (
              <button
                key={t.topicId}
                onClick={() => setSelectedTopicId(t.topicId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isCurrent
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                صفحة #{t.topicId} {t.title ? `• ${t.title.slice(0, 18)}...` : ""}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewTopic}
            className="inline-flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة صفحة جديدة (صف جديد)</span>
          </button>

          {topics.length > 1 && (
            <button
              onClick={handleDeleteCurrentTopic}
              title="حذف هذه الصفحة الحالية"
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Language View Tabs for Editor */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold ml-2">لغة حقول النصوص المعروضة:</span>
          <button
            onClick={() => setActiveLangTab("ar")}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeLangTab === "ar"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            🇸🇦 العربية (الأصل في الشيت)
          </button>
          <button
            onClick={() => setActiveLangTab("en")}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeLangTab === "en"
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            🇬🇧 English (المترجمة)
          </button>
          <button
            onClick={() => setActiveLangTab("th")}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeLangTab === "th"
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            🇹🇭 ภาษาไทย (المترجمة)
          </button>
        </div>

        <div className="text-xs text-slate-400">
          عدد البطاقات المضافة: <span className="text-amber-400 font-bold">{currentTopic.cards?.length || 0}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* القسم الأول: الهيدر (الأعمدة B:E - عنوان وترويسة الصفحة) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-amber-400">
              القسم الأول: ترويسة وهيدر الصفحة (الأعمدة B:E)
            </h3>
            <p className="text-xs text-slate-400">
              يحدد عنوان الصفحة، نص الوصف الترحيبي، صورة الغلاف البارزة، والشارة التصنيفية.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Column B: Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>العامود B: عنوان الصفحة / الدورة</span>
              <span className="text-amber-400/80 text-[11px] font-mono">Column B</span>
            </label>
            {activeLangTab === "ar" && (
              <input
                type="text"
                value={currentTopic.title || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: دورة خط الرقعة والديواني للمشتركين"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            )}
            {activeLangTab === "en" && (
              <input
                type="text"
                dir="ltr"
                value={currentTopic.titleEn || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, titleEn: e.target.value }))}
                placeholder="Course Title in English"
                className="w-full bg-slate-950 border border-indigo-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-indigo-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            )}
            {activeLangTab === "th" && (
              <input
                type="text"
                dir="ltr"
                value={currentTopic.titleTh || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, titleTh: e.target.value }))}
                placeholder="ชื่อหลักสูตรภาษาไทย"
                className="w-full bg-slate-950 border border-purple-700/60 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-purple-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            )}
          </div>

          {/* Column E: Badge */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>العامود E: الشارة أو التصنيف (Badge)</span>
              <span className="text-amber-400/80 text-[11px] font-mono">Column E</span>
            </label>
            {activeLangTab === "ar" && (
              <input
                type="text"
                value={currentTopic.badge || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, badge: e.target.value }))}
                placeholder="مثال: دورة تدريبية متقدمة • إجازة في الخط"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            )}
            {activeLangTab === "en" && (
              <input
                type="text"
                dir="ltr"
                value={currentTopic.badgeEn || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, badgeEn: e.target.value }))}
                placeholder="Badge in English (e.g. Advanced Course)"
                className="w-full bg-slate-950 border border-indigo-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-indigo-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            )}
            {activeLangTab === "th" && (
              <input
                type="text"
                dir="ltr"
                value={currentTopic.badgeTh || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, badgeTh: e.target.value }))}
                placeholder="ตราสัญลักษณ์ภาษาไทย (เช่น หลักสูตรขั้นสูง)"
                className="w-full bg-slate-950 border border-purple-700/60 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-purple-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            )}
          </div>

          {/* Column C: Description (Full Width) */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>العامود C: الوصف الترحيبي أو مقدمة الصفحة</span>
              <span className="text-amber-400/80 text-[11px] font-mono">Column C</span>
            </label>
            {activeLangTab === "ar" && (
              <textarea
                rows={3}
                value={currentTopic.description || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="أهلاً بك في صفحتك الخاصة. تجد هنا كافة الدروس والمحاور التعليمية المخصصة لاشتراكك..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all leading-relaxed"
              />
            )}
            {activeLangTab === "en" && (
              <textarea
                rows={3}
                dir="ltr"
                value={currentTopic.descriptionEn || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, descriptionEn: e.target.value }))}
                placeholder="Welcome description in English..."
                className="w-full bg-slate-950 border border-indigo-700/60 focus:border-indigo-500 rounded-xl p-3 text-sm text-indigo-100 placeholder-slate-500 focus:outline-none transition-all leading-relaxed"
              />
            )}
            {activeLangTab === "th" && (
              <textarea
                rows={3}
                dir="ltr"
                value={currentTopic.descriptionTh || ""}
                onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, descriptionTh: e.target.value }))}
                placeholder="คำอธิบายภาษาไทย..."
                className="w-full bg-slate-950 border border-purple-700/60 focus:border-purple-500 rounded-xl p-3 text-sm text-purple-100 placeholder-slate-500 focus:outline-none transition-all leading-relaxed"
              />
            )}
          </div>

          {/* Column D: Cover Image / Media URL (Full Width) */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>العامود D: رابط صورة الغلاف أو الفيديو الرئيسي (Cover Image)</span>
              <span className="text-amber-400/80 text-[11px] font-mono">Column D</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="url"
                  dir="ltr"
                  value={currentTopic.coverImage || ""}
                  onChange={(e) => updateCurrentTopic((prev) => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/... أو رابط درايف مباشر أو يوتيوب"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>

              {currentTopic.coverImage && (
                <div className="relative w-16 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                  <img
                    src={formatImageUrl(currentTopic.coverImage)}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              صورة غلاف أفقية عريضة تظهر في أعلى الصفحة لتمنح المشترك مظهراً احترافياً وأنيقاً.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* القسم الثاني: البيانات والمحاور (الأعمدة F:I / J:M / N:Q / R:U...) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-400">
                القسم الثاني: محاور وبطاقات الصفحة (الأعمدة F:I / J:M...)
              </h3>
              <p className="text-xs text-slate-400">
                كل بطاقة تتكون من 4 أعمدة في الشيت: عنوان البطاقة، الوصف والشرح، رابط الوسائط، ورابط الزر الخارجي.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddCard}
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بطاقة / درس جديد</span>
          </button>
        </div>

        {/* Empty state */}
        {(!currentTopic.cards || currentTopic.cards.length === 0) && (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 p-6">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-bold">لا توجد بطاقات في هذه الصفحة حالياً</p>
            <p className="text-slate-500 text-xs mt-1">
              انقر على زر "إضافة بطاقة / درس جديد" لإضافة المحور الأول في صفحتك.
            </p>
            <button
              onClick={handleAddCard}
              className="mt-4 inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة البطاقة الأولى</span>
            </button>
          </div>
        )}

        {/* Cards List */}
        <div className="space-y-4">
          {(currentTopic.cards || []).map((card, idx) => {
            // Compute column letters representation for user insight (F:I, J:M, N:Q, R:U...)
            const startColIdx = 5 + idx * 4;
            const getColLetter = (n: number) => {
              let s = "";
              while (n >= 0) {
                s = String.fromCharCode((n % 26) + 65) + s;
                n = Math.floor(n / 26) - 1;
              }
              return s;
            };
            const colRangeLabel = `${getColLetter(startColIdx)}:${getColLetter(startColIdx + 3)}`;

            return (
              <div
                key={card.id || idx}
                className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 transition-all hover:border-slate-700 space-y-4 shadow-md"
              >
                {/* Card Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-200">
                      البطاقة {idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-amber-400/70 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                      أعمدة الشيت: {colRangeLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveCard(idx, "up")}
                      disabled={idx === 0}
                      title="تحريك لأعلى"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveCard(idx, "down")}
                      disabled={idx === (currentTopic.cards || []).length - 1}
                      title="تحريك لأسفل"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveCard(idx)}
                      title="حذف البطاقة"
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Field 1: Card Title */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>عنوان البطاقة / المحور (العمود الأول في المجموعة)</span>
                      <span className="text-amber-400/80 text-[11px] font-mono">{getColLetter(startColIdx)}</span>
                    </label>
                    {activeLangTab === "ar" && (
                      <input
                        type="text"
                        value={card.title || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = { ...nextCards[idx], title: val };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="مثال: الدرس الأول: قواعد الخط والميزان النقطي"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                    )}
                    {activeLangTab === "en" && (
                      <input
                        type="text"
                        dir="ltr"
                        value={card.titleEn || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = { ...nextCards[idx], titleEn: val };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="Card Title in English"
                        className="w-full bg-slate-900 border border-indigo-700/60 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-indigo-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                    )}
                    {activeLangTab === "th" && (
                      <input
                        type="text"
                        dir="ltr"
                        value={card.titleTh || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = { ...nextCards[idx], titleTh: val };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="ชื่อบทเรียนภาษาไทย"
                        className="w-full bg-slate-900 border border-purple-700/60 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-purple-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                    )}
                  </div>

                  {/* Field 2: Card Description */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>الوصف والتفاصيل (العمود الثاني في المجموعة)</span>
                      <span className="text-amber-400/80 text-[11px] font-mono">{getColLetter(startColIdx + 1)}</span>
                    </label>
                    {activeLangTab === "ar" && (
                      <textarea
                        rows={2}
                        value={card.description || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = { ...nextCards[idx], description: val };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="شرح وتوجيهات عملية وإرشادات التطبيق للمشترك..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                    )}
                    {activeLangTab === "en" && (
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={card.descriptionEn || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = { ...nextCards[idx], descriptionEn: val };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="Card explanation in English..."
                        className="w-full bg-slate-900 border border-indigo-700/60 focus:border-indigo-500 rounded-xl p-3 text-sm text-indigo-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                    )}
                    {activeLangTab === "th" && (
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={card.descriptionTh || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = { ...nextCards[idx], descriptionTh: val };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="คำอธิบายและแนวทางการปฏิบัติภาษาไทย..."
                        className="w-full bg-slate-900 border border-purple-700/60 focus:border-purple-500 rounded-xl p-3 text-sm text-purple-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                    )}
                  </div>

                  {/* Field 3: Media URL */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-amber-400" />
                        <span>رابط الوسائط (صورة، يوتيوب، درايف)</span>
                      </span>
                      <span className="text-amber-400/80 text-[11px] font-mono">{getColLetter(startColIdx + 2)}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        value={card.mediaUrl || (card.media && card.media[0] ? card.media[0].url : "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = {
                              ...nextCards[idx],
                              mediaUrl: val,
                              media: val ? [{ url: formatImageUrl(val), type: "image" }] : []
                            };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="https://youtu.be/... أو رابط صورة أو درايف"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                      {(card.mediaUrl || (card.media && card.media[0])) && (
                        <a
                          href={card.mediaUrl || (card.media && card.media[0]?.url)}
                          target="_blank"
                          rel="noreferrer"
                          title="فتح ومعاينة الرابط"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Field 4: External Action Link URL */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-amber-400" />
                        <span>رابط الزر الخارجي المرفق (تلغرام، PDF، موقع)</span>
                      </span>
                      <span className="text-amber-400/80 text-[11px] font-mono">{getColLetter(startColIdx + 3)}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        value={card.linkUrl || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentTopic((prev) => {
                            const nextCards = [...(prev.cards || [])];
                            nextCards[idx] = { ...nextCards[idx], linkUrl: val };
                            return { ...prev, cards: nextCards };
                          });
                        }}
                        placeholder="https://t.me/... أو رابط ملف PDF للتنزيل"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                      />
                      {card.linkUrl && (
                        <a
                          href={card.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="اختبار الرابط"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Add Card Helper */}
        {(currentTopic.cards || []).length > 0 && (
          <div className="pt-2">
            <button
              onClick={handleAddCard}
              className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl text-slate-300 hover:text-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بطاقة / درس جديد للموضوع</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Save Reminder Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>التعديلات تحفظ فوراً في النظام، انقر للمزامنة مع قوقل شيت.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">معاينة الطالب</span>
          </button>

          <button
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "جاري الحفظ..." : "حفظ ومزامنة في قوقل شيت"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Live Preview Modal (Exact view seen by subscriber) */}
      {/* ========================================================================= */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-100">
                    معاينة الصفحة الخاصة للمشترك (الصفحة #{currentTopic.topicId})
                  </h3>
                  <p className="text-xs text-slate-400">
                    المظهر الفعلي والتفاعلي كما يظهر للمشترك عند تسجيل الدخول
                  </p>
                </div>
              </div>

              {/* Language Switcher in Preview */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setPreviewLang("ar")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      previewLang === "ar" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => setPreviewLang("en")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      previewLang === "en" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setPreviewLang("th")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      previewLang === "th" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    ไทย
                  </button>
                </div>

                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Preview Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-950" dir={previewLang === "ar" ? "rtl" : "ltr"}>
              {/* Cover Image */}
              {currentTopic.coverImage && (
                <div className="relative w-full h-48 sm:h-64 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
                  <img
                    src={formatImageUrl(currentTopic.coverImage)}
                    alt="Cover"
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Title & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-amber-400 leading-snug">
                    {previewLang === "en"
                      ? currentTopic.titleEn || currentTopic.title
                      : previewLang === "th"
                      ? currentTopic.titleTh || currentTopic.title
                      : currentTopic.title || "عنوان الصفحة الخاصة"}
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed whitespace-pre-line">
                    {previewLang === "en"
                      ? currentTopic.descriptionEn || currentTopic.description
                      : previewLang === "th"
                      ? currentTopic.descriptionTh || currentTopic.description
                      : currentTopic.description || "الوصف الترحيبي..."}
                  </p>
                </div>

                {(currentTopic.badge || (previewLang === "en" && currentTopic.badgeEn) || (previewLang === "th" && currentTopic.badgeTh)) && (
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 text-xs sm:text-sm font-bold py-1.5 px-3.5 rounded-2xl border border-amber-500/30">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>
                        {previewLang === "en"
                          ? currentTopic.badgeEn || currentTopic.badge
                          : previewLang === "th"
                          ? currentTopic.badgeTh || currentTopic.badge
                          : currentTopic.badge}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(currentTopic.cards || []).map((c, idx) => {
                  const cardTitle =
                    previewLang === "en"
                      ? c.titleEn || c.title
                      : previewLang === "th"
                      ? c.titleTh || c.title
                      : c.title;

                  const cardDesc =
                    previewLang === "en"
                      ? c.descriptionEn || c.description
                      : previewLang === "th"
                      ? c.descriptionTh || c.description
                      : c.description;

                  const cardMediaUrl = c.mediaUrl || (c.media && c.media[0]?.url);

                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl"
                    >
                      <div>
                        <h4 className="font-serif font-bold text-amber-400 text-lg sm:text-xl mb-2">
                          {cardTitle}
                        </h4>
                        {cardDesc && (
                          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 whitespace-pre-line">
                            {cardDesc}
                          </p>
                        )}

                        {cardMediaUrl && (
                          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video mb-4">
                            <img
                              src={formatImageUrl(cardMediaUrl)}
                              alt={cardTitle}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {c.linkUrl && (
                        <div className="pt-4 border-t border-slate-800">
                          <a
                            href={c.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl text-center shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>
                              {previewLang === "en"
                                ? "Open Resource / Link"
                                : previewLang === "th"
                                ? "เปิดทรัพยากร / ลิงก์"
                                : "فتح الرابط / المورد المرفق"}
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-end">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
