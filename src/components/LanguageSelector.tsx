import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LanguageCode } from "../data/defaultTranslations";

interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: "rtl" | "ltr";
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    dir: "rtl",
  },
  {
    code: "th",
    name: "Thai",
    nativeName: "ภาษาไทย",
    flag: "🇹🇭",
    dir: "ltr",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    dir: "ltr",
  },
];

interface LanguageSelectorProps {
  variant?: "header" | "compact" | "mobile";
  className?: string;
}

export default function LanguageSelector({ variant = "header", className = "" }: LanguageSelectorProps) {
  const { currentLang, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === "mobile") {
    return (
      <div className={`w-full bg-slate-900/90 rounded-2xl p-2 border border-amber-500/20 ${className}`}>
        <div className="text-[11px] font-sans font-bold text-slate-400 px-3 py-1.5 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>اختر لغة الموقع / Choose Language / เลือกภาษา</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                    : "bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-base leading-none mb-1">{lang.flag}</span>
                <span className="text-[11px] leading-tight truncate">{lang.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-amber-500/30 hover:border-amber-500/60 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
        title="تغيير لغة الموقع / Change Language"
      >
        <span className="text-base sm:text-sm leading-none">{activeOption.flag}</span>
        <span className="font-sans font-bold hidden lg:inline">{activeOption.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-amber-400/90 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-44 rounded-2xl bg-slate-950 border border-amber-500/30 shadow-2xl shadow-black/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-amber-400 font-bold border-b border-slate-800">
            Language / اللغة
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-amber-500/15 text-amber-400 font-bold"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold leading-tight">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{lang.name}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
