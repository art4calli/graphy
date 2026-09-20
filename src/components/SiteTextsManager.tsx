import React, { useState, useMemo } from "react";
import {
  Languages,
  Sparkles,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  SlidersHorizontal,
  Bookmark,
  Layers
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { TranslationItem } from "../data/defaultTranslations";

export default function SiteTextsManager() {
  const {
    translations,
    updateTranslationItem,
    updateMultipleTranslations,
    resetToDefaults,
    saveTranslationsToServer,
    isTranslatingAI,
    translateItemWithAI,
    translateCategoryWithAI,
    translateAllWithAI,
  } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [translatingItemId, setTranslatingItemId] = useState<string | null>(null);
  const [translatingCategory, setTranslatingCategory] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Categories extraction
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    translations.forEach((item) => {
      const existing = map.get(item.category);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(item.category, {
          id: item.category,
          label: item.categoryLabel || item.category,
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [translations]);

  // Filtered list
  const filteredTranslations = useMemo(() => {
    return translations.filter((item) => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.ar.toLowerCase().includes(q) ||
        item.th.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q)
      );
    });
  }, [translations, selectedCategory, searchQuery]);

  // Group filtered items by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, { label: string; items: TranslationItem[] }> = {};
    filteredTranslations.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = {
          label: item.categoryLabel || item.category,
          items: [],
        };
      }
      groups[item.category].items.push(item);
    });
    return groups;
  }, [filteredTranslations]);

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: prev[catId] !== undefined ? !prev[catId] : false, // default is open
    }));
  };

  const handleTranslateSingle = async (id: string) => {
    setTranslatingItemId(id);
    setStatusMsg(null);
    const res = await translateItemWithAI(id);
    setTranslatingItemId(null);
    if (res.success) {
      setStatusMsg({ type: "success", text: res.message });
    } else {
      setStatusMsg({ type: "error", text: res.message });
    }
  };

  const handleTranslateCategory = async (catId: string) => {
    setTranslatingCategory(catId);
    setStatusMsg(null);
    const res = await translateCategoryWithAI(catId);
    setTranslatingCategory(null);
    if (res.success) {
      setStatusMsg({ type: "success", text: res.message });
    } else {
      setStatusMsg({ type: "error", text: res.message });
    }
  };

  const handleTranslateAll = async () => {
    if (!window.confirm("هل ترغب في ترجمة كافة نصوص الموقع بالكامل إلى التايلاندية والإنجليزية باستخدام الذكاء الاصطناعي؟")) {
      return;
    }
    setStatusMsg(null);
    const res = await translateAllWithAI();
    if (res.success) {
      setStatusMsg({ type: "success", text: res.message });
    } else {
      setStatusMsg({ type: "error", text: res.message });
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    const res = await saveTranslationsToServer();
    setIsSaving(false);
    setStatusMsg({ type: "success", text: res.message });
  };

  const handleReset = () => {
    if (window.confirm("هل أنت متأكد من استعادة كافة النصوص والترجمات إلى القيم الافتراضية؟")) {
      resetToDefaults();
      setStatusMsg({ type: "info", text: "تمت استعادة كافة النصوص والترجمات الافتراضية بنجاح" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & AI Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 p-5 rounded-2xl border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Languages className="w-6 h-6 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-300">
                إدارة نصوص الموقع والترجمات الذكية (3 لغات)
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تحكم بجميع نصوص الموقع (العربية 🇸🇦، التايلاندية 🇹🇭، والإنجليزية 🇬🇧) مع إمكانية التعديل المباشر أو الترجمة التلقائية الفورية بالذكاء الاصطناعي بضغطة زر واحدة.
            </p>
          </div>

          {/* Global Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleTranslateAll}
              disabled={isTranslatingAI}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isTranslatingAI && !translatingCategory && !translatingItemId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              )}
              <span>ترجمة كافة الموقع بالذكاء الاصطناعي 🪄</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>حفظ التعديلات</span>
            </button>

            <button
              onClick={handleReset}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              title="استعادة النصوص الافتراضية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الافتراضي</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-200 ${
              statusMsg.type === "success"
                ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                : statusMsg.type === "error"
                ? "bg-red-950/80 border border-red-500/40 text-red-300"
                : "bg-blue-950/80 border border-blue-500/40 text-blue-300"
            }`}
          >
            {statusMsg.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusMsg.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {statusMsg.type === "info" && <Bookmark className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في أي نص عربي، تايلاندي، أو إنجليزي..."
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-amber-500 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              مسح
            </button>
          )}
        </div>

        {/* Counter Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-slate-800 shrink-0">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>عدد النصوص: </span>
          <span className="text-amber-400 font-bold">{filteredTranslations.length}</span>
          <span>من إجمالي</span>
          <span className="text-white font-bold">{translations.filter(t => t.category !== "registration").length}</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-500/20">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === "all"
              ? "bg-amber-500 text-slate-950 shadow-md font-bold"
              : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <span>كافة الأقسام</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === "all" ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
            {translations.filter(t => t.category !== "registration").length}
          </span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Category Sections & Items */}
      <div className="space-y-6">
        {Object.entries(groupedByCategory).length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <Languages className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">لا توجد نصوص مطابقة لبحثك</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-3 text-xs text-amber-400 hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          (Object.entries(groupedByCategory) as [string, { label: string; items: TranslationItem[] }][]).map(([catId, catData]) => {
            const isCollapsed = expandedCategories[catId] === true;
            const isCategoryTranslating = translatingCategory === catId;

            return (
              <div
                key={catId}
                className="bg-slate-900/80 border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg"
              >
                {/* Category Header */}
                <div className="bg-slate-950/90 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-2.5 cursor-pointer select-none flex-1"
                    onClick={() => toggleCategoryExpand(catId)}
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <h3 className="font-serif font-bold text-sm text-amber-300">
                      {catData.label}
                    </h3>
                    <span className="text-[11px] bg-slate-800/90 text-slate-400 px-2 py-0.5 rounded-full font-sans">
                      {catData.items.length} نصوص
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  {/* Translate Category Action */}
                  <button
                    onClick={() => handleTranslateCategory(catId)}
                    disabled={isTranslatingAI}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="ترجمة جميع نصوص هذا القسم إلى التايلاندية والإنجليزية"
                  >
                    {isCategoryTranslating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>ترجمة القسم بالذكاء الاصطناعي 🪄</span>
                  </button>
                </div>

                {/* Items List */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-800/60 p-4 space-y-4">
                    {catData.items.map((item) => {
                      const isItemTranslating = translatingItemId === item.id;

                      return (
                        <div key={item.id} className="pt-4 first:pt-0">
                          {/* Item Label & Quick Translate */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-xs font-bold text-slate-200">
                                {item.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded">
                                {item.id}
                              </span>
                            </div>

                            <button
                              onClick={() => handleTranslateSingle(item.id)}
                              disabled={isTranslatingAI}
                              className="text-[11px] bg-slate-950 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="ترجمة هذا النص تلقائياً إلى التايلاندية والإنجليزية"
                            >
                              {isItemTranslating ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-amber-400" />
                              )}
                              <span>ترجمة ذكية 🪄</span>
                            </button>
                          </div>

                          {/* 3 Fields: Arabic, Thai, English */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {/* Arabic (Original from Sheet) */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <span>🇸🇦</span>
                                  <span>النص العربي {item.category.startsWith("sheet_") ? "(الأصل من قوقل شيت)" : "(الأصل)"}</span>
                                </span>
                                {item.category.startsWith("sheet_") ? (
                                  <span className="text-[10px] text-amber-500/90 bg-amber-500/10 px-2 py-0.5 rounded font-sans border border-amber-500/20">
                                    قراءة فقط (مصدر الشيت)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-sans">RTL</span>
                                )}
                              </div>
                              <textarea
                                value={item.ar || ""}
                                readOnly={item.category.startsWith("sheet_")}
                                onChange={(e) => {
                                  if (!item.category.startsWith("sheet_")) {
                                    updateTranslationItem(item.id, { ar: e.target.value });
                                  }
                                }}
                                dir="rtl"
                                rows={item.ar.length > 60 ? 3 : 2}
                                className={`w-full border rounded-xl px-3 py-2 text-xs font-sans leading-relaxed focus:outline-none transition-colors ${
                                  item.category.startsWith("sheet_")
                                    ? "bg-slate-900/60 border-slate-800 text-slate-300 cursor-not-allowed select-text"
                                    : "bg-slate-950 border-slate-700/80 focus:border-amber-500 text-white"
                                }`}
                              />
                            </div>

                            {/* Thai Translation */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-blue-400 mb-1">
                                <span className="flex items-center gap-1">
                                  <span>🇹🇭</span>
                                  <span>ภาษาไทย (التايلاندية)</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-sans">LTR</span>
                              </div>
                              <textarea
                                value={item.th || ""}
                                onChange={(e) => updateTranslationItem(item.id, { th: e.target.value })}
                                dir="ltr"
                                rows={item.ar.length > 60 ? 3 : 2}
                                placeholder="ترجمة تايلاندية..."
                                className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-blue-100 font-sans leading-relaxed focus:outline-none transition-colors"
                              />
                            </div>

                            {/* English Translation */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1">
                                <span className="flex items-center gap-1">
                                  <span>🇬🇧</span>
                                  <span>English (الإنجليزية)</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-sans">LTR</span>
                              </div>
                              <textarea
                                value={item.en || ""}
                                onChange={(e) => updateTranslationItem(item.id, { en: e.target.value })}
                                dir="ltr"
                                rows={item.ar.length > 60 ? 3 : 2}
                                placeholder="English translation..."
                                className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-100 font-sans leading-relaxed focus:outline-none transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
