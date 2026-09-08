import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  FileText,
  Calendar,
  Phone,
  Mail,
  User,
  Hash,
  Share2,
  Folder,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Copy,
  Layers,
  ShieldAlert,
  Filter,
  Settings2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square
} from "lucide-react";
import { RegistrationAnswerRecord } from "../types";
import {
  fetchRegistrationAnswersBridge,
  executeAppsScriptPost,
  DEFAULT_SCRIPT_URL,
  DEFAULT_SPREADSHEET_ID
} from "../utils/googleBackendBridge";

interface RegistrationAnswersViewerProps {
  scriptUrl?: string;
  spreadsheetId?: string;
}

interface DuplicateMatch {
  matchedRecord: RegistrationAnswerRecord;
  reasons: string[];
  severity: "high" | "medium"; // high = exact match, medium = partial name
}

// Configurable monitored fields
export interface DuplicateMonitorConfig {
  checkRegistrationId: boolean;
  checkName: boolean;
  checkNameArabic: boolean;
  checkPhone: boolean;
  checkEmail: boolean;
  checkLineId: boolean;
  checkFacebook: boolean;
  customColumns: string[]; // Any additional sheet header names selected by user
}

const DEFAULT_MONITOR_CONFIG: DuplicateMonitorConfig = {
  checkRegistrationId: true,
  checkName: true,
  checkNameArabic: true,
  checkPhone: true,
  checkEmail: true,
  checkLineId: true,
  checkFacebook: true,
  customColumns: [],
};

// Arabic Text Normalizer
function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Phone Number Normalizer
function normalizePhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.toString().replace(/\D/g, "");
  return digits.length > 8 ? digits.slice(-9) : digits;
}

// Email Normalizer
function normalizeEmail(email: string): string {
  if (!email) return "";
  return email.toString().trim().toLowerCase();
}

// Social / ID Normalizer
function normalizeHandle(handle: string): string {
  if (!handle) return "";
  return handle
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?(facebook\.com\/|fb\.me\/|line\.me\/R\/ti\/p\/~?|line\.me\/ti\/p\/~?|line\.naver\.jp\/ti\/p\/~?|t\.me\/)?/gi, "")
    .replace(/^@/, "")
    .replace(/[\/\?#].*$/, "")
    .trim();
}

export default function RegistrationAnswersViewer({
  scriptUrl,
  spreadsheetId,
}: RegistrationAnswersViewerProps) {
  const [records, setRecords] = useState<RegistrationAnswerRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState(false);

  // Monitor Settings Modal / Drawer
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [monitorConfig, setMonitorConfig] = useState<DuplicateMonitorConfig>(() => {
    try {
      const saved = localStorage.getItem("thnoon_duplicate_monitor_config");
      if (saved) {
        return { ...DEFAULT_MONITOR_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_MONITOR_CONFIG;
  });

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<RegistrationAnswerRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<RegistrationAnswerRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Delete modal state
  const [deletingRecord, setDeletingRecord] = useState<RegistrationAnswerRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
  const [actionSuccessBanner, setActionSuccessBanner] = useState<string | null>(null);

  // Active comparison modal
  const [comparingRecord, setComparingRecord] = useState<{
    original: RegistrationAnswerRecord;
    duplicate: RegistrationAnswerRecord;
    reasons: string[];
  } | null>(null);

  // Save monitor config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("thnoon_duplicate_monitor_config", JSON.stringify(monitorConfig));
    } catch (e) {}
  }, [monitorConfig]);

  // Fetch records
  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      const activeSpreadsheet = spreadsheetId || (typeof window !== "undefined" ? localStorage.getItem("thnoon_spreadsheet_id") : "") || DEFAULT_SPREADSHEET_ID;
      
      const data = await fetchRegistrationAnswersBridge(activeScript, activeSpreadsheet);

      if (data && data.success) {
        setRecords(data.records || []);
        setHeaders(data.headers || []);
        setLastUpdated(new Date());
      } else {
        setError(data.message || "تعذر جلب بيانات المسجلين من ورقة RegistrationAnswers");
      }
    } catch (err: any) {
      console.error("Error fetching registration answers:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم لجلب السجلات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [scriptUrl, spreadsheetId]);

  // Helper to extract key fields from raw row data
  const extractPrimaryFields = (rec: RegistrationAnswerRecord) => {
    let email = "";
    let phone = "";
    let lineId = "";
    let facebook = "";

    for (const [key, val] of Object.entries(rec.data || {})) {
      const kLower = key.toLowerCase();
      const strVal = (val || "").toString().trim();
      if (!strVal) continue;

      // Email
      if (!email && (kLower.includes("email") || kLower.includes("بريد") || kLower.includes("ايميل") || (strVal.includes("@") && strVal.includes(".")))) {
        email = strVal;
      }

      // Phone
      if (!phone && (kLower.includes("phone") || kLower.includes("هاتف") || kLower.includes("جوال") || kLower.includes("موبايل") || kLower.includes("واتساب") || kLower.includes("tel"))) {
        phone = strVal;
      }

      // Line ID
      if (!lineId && (kLower.includes("line") || kLower.includes("لاين") || kLower.includes("line id") || kLower.includes("معرف لاين"))) {
        lineId = strVal;
      }

      // Facebook
      if (!facebook && (kLower.includes("facebook") || kLower.includes("فيس") || kLower.includes("فيسبوك") || kLower.includes("fb") || strVal.includes("facebook.com"))) {
        facebook = strVal;
      }
    }

    return { email, phone, lineId, facebook };
  };

  // -------------------------------------------------------------
  // CONFIGURABLE DUPLICATE & SIMILARITY DETECTION ENGINE
  // ONLY on Primary Fields and Explicitly Selected Columns
  // -------------------------------------------------------------
  const duplicatesMap = useMemo(() => {
    const map = new Map<string, DuplicateMatch[]>();

    const getRecKey = (r: RegistrationAnswerRecord, idx: number) =>
      r.registrationId || `row_${r.rowIndex || idx}`;

    for (let i = 0; i < records.length; i++) {
      const recA = records[i];
      const keyA = getRecKey(recA, i);
      const matches: DuplicateMatch[] = [];

      const nameA = normalizeArabic(recA.name || recA.data["الاسم"] || "");
      const nameArA = normalizeArabic(recA.nameArabic || recA.data["الاسم بالعربي"] || "");
      const { email: emailA, phone: phoneA, lineId: lineA, facebook: fbA } = extractPrimaryFields(recA);
      
      const normEmailA = normalizeEmail(emailA);
      const normPhoneA = normalizePhone(phoneA);
      const normLineA = normalizeHandle(lineA);
      const normFbA = normalizeHandle(fbA);

      for (let j = 0; j < records.length; j++) {
        if (i === j) continue;
        const recB = records[j];
        const reasons: string[] = [];
        let isHigh = false;

        const nameB = normalizeArabic(recB.name || recB.data["الاسم"] || "");
        const nameArB = normalizeArabic(recB.nameArabic || recB.data["الاسم بالعربي"] || "");
        const { email: emailB, phone: phoneB, lineId: lineB, facebook: fbB } = extractPrimaryFields(recB);
        
        const normEmailB = normalizeEmail(emailB);
        const normPhoneB = normalizePhone(phoneB);
        const normLineB = normalizeHandle(lineB);
        const normFbB = normalizeHandle(fbB);

        // 1. Check Registration ID
        if (
          monitorConfig.checkRegistrationId &&
          recA.registrationId &&
          recB.registrationId &&
          recA.registrationId === recB.registrationId
        ) {
          reasons.push(`تطابق مكرر لرقم التسجيل المرجعي #${recA.registrationId}`);
          isHigh = true;
        }

        // 2. Check Name
        if (monitorConfig.checkName && nameA && nameB) {
          if (nameA === nameB && nameA.length > 3) {
            reasons.push(`تطابق تام في الاسم (${recA.name || recA.data["الاسم"]})`);
            isHigh = true;
          } else {
            // Token similarity
            const tokensA = nameA.split(" ").filter((t) => t.length > 2);
            const tokensB = nameB.split(" ").filter((t) => t.length > 2);
            if (tokensA.length >= 2 && tokensB.length >= 2) {
              const shared = tokensA.filter((t) => tokensB.includes(t));
              if (shared.length >= 3 || (tokensA.length === 2 && shared.length === 2)) {
                reasons.push(`تشابه كبير في الاسم [${shared.join("، ")}]`);
              }
            }
          }
        }

        // 3. Check Name Arabic
        if (monitorConfig.checkNameArabic) {
          if (nameArA && nameArB && nameArA === nameArB && nameArA.length > 3) {
            reasons.push(`تطابق تام في الاسم العربي (${recA.nameArabic || recA.data["الاسم بالعربي"]})`);
            isHigh = true;
          } else if (nameA && nameArB && nameA === nameArB && nameA.length > 3) {
            reasons.push(`تطابق الاسم مع الاسم العربي`);
            isHigh = true;
          }
        }

        // 4. Check Phone
        if (
          monitorConfig.checkPhone &&
          normPhoneA &&
          normPhoneB &&
          normPhoneA === normPhoneB &&
          normPhoneA.length >= 7
        ) {
          reasons.push(`تطابق رقم الهاتف / الجوال (${phoneA})`);
          isHigh = true;
        }

        // 5. Check Email
        if (
          monitorConfig.checkEmail &&
          normEmailA &&
          normEmailB &&
          normEmailA === normEmailB &&
          normEmailA.length > 5
        ) {
          reasons.push(`تطابق البريد الإلكتروني (${emailA})`);
          isHigh = true;
        }

        // 6. Check Line ID
        if (
          monitorConfig.checkLineId &&
          normLineA &&
          normLineB &&
          normLineA === normLineB &&
          normLineA.length >= 3
        ) {
          reasons.push(`تطابق معرف Line ID (${lineA})`);
          isHigh = true;
        }

        // 7. Check Facebook
        if (
          monitorConfig.checkFacebook &&
          normFbA &&
          normFbB &&
          normFbA === normFbB &&
          normFbA.length >= 3
        ) {
          reasons.push(`تطابق حساب Facebook (${fbA})`);
          isHigh = true;
        }

        // 8. Custom Monitored Columns (if explicitly chosen by user)
        if (monitorConfig.customColumns && monitorConfig.customColumns.length > 0) {
          for (const colName of monitorConfig.customColumns) {
            const valA = (recA.data[colName] || "").toString().trim().toLowerCase();
            const valB = (recB.data[colName] || "").toString().trim().toLowerCase();
            if (valA && valB && valA === valB && valA.length >= 3) {
              reasons.push(`تطابق عمود [${colName}]: (${recA.data[colName]})`);
              isHigh = true;
            }
          }
        }

        if (reasons.length > 0) {
          matches.push({
            matchedRecord: recB,
            reasons,
            severity: isHigh ? "high" : "medium"
          });
        }
      }

      if (matches.length > 0) {
        map.set(keyA, matches);
      }
    }

    return map;
  }, [records, monitorConfig]);

  // Total count of records with duplicate alerts
  const totalDuplicateRecordsCount = useMemo(() => {
    return duplicatesMap.size;
  }, [duplicatesMap]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = records;

    // Filter duplicates only
    if (filterDuplicatesOnly) {
      result = result.filter((rec, idx) => {
        const key = rec.registrationId || `row_${rec.rowIndex || idx}`;
        return duplicatesMap.has(key);
      });
    }

    // Search query filter
    if (!searchQuery.trim()) return result;
    const query = searchQuery.trim().toLowerCase();

    return result.filter((rec) => {
      if (rec.registrationId && rec.registrationId.toLowerCase().includes(query)) return true;
      if (rec.name && rec.name.toLowerCase().includes(query)) return true;
      if (rec.nameArabic && rec.nameArabic.toLowerCase().includes(query)) return true;
      if (rec.timestamp && rec.timestamp.toLowerCase().includes(query)) return true;
      
      // Search inside all data values
      for (const key of Object.keys(rec.data || {})) {
        const val = rec.data[key];
        if (val && typeof val === "string" && val.toLowerCase().includes(query)) {
          return true;
        }
      }
      return false;
    });
  }, [records, searchQuery, filterDuplicatesOnly, duplicatesMap]);

  // Open Edit Modal
  const handleOpenEdit = (rec: RegistrationAnswerRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRecord(rec);
    setEditFormData({ ...rec.data });
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSavingEdit(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      
      let isSuccess = false;
      let msg = "";

      // 1. Try local server endpoint first if available
      try {
        const res = await fetch("/api/registration-answers/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationId: editingRecord.registrationId,
            rowIndex: editingRecord.rowIndex,
            updatedData: editFormData,
            scriptUrl: activeScript
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            isSuccess = true;
            msg = data.message;
          }
        }
      } catch (e) {}

      // 2. Direct Apps Script fallback
      if (!isSuccess) {
        const bridgeRes = await executeAppsScriptPost("updateRegistrationAnswer", {
          registrationId: editingRecord.registrationId,
          rowIndex: editingRecord.rowIndex,
          updatedData: editFormData
        }, activeScript);
        if (bridgeRes.success) {
          isSuccess = true;
          msg = bridgeRes.data?.message;
        }
      }

      if (isSuccess) {
        setEditSuccessMsg("تم حفظ التعديلات بنجاح في ورقة RegistrationAnswers!");
        setActionSuccessBanner(`تم تحديث بيانات المسجل [${editingRecord.name || editingRecord.registrationId}] بنجاح`);
        setTimeout(() => setActionSuccessBanner(null), 5000);

        // Update local state
        setRecords((prev) =>
          prev.map((r) => {
            if (r.rowIndex === editingRecord.rowIndex || (r.registrationId && r.registrationId === editingRecord.registrationId)) {
              return {
                ...r,
                name: editFormData["الاسم"] || r.name,
                nameArabic: editFormData["الاسم بالعربي"] || r.nameArabic,
                data: { ...editFormData }
              };
            }
            return r;
          })
        );

        if (selectedRecord && (selectedRecord.rowIndex === editingRecord.rowIndex || selectedRecord.registrationId === editingRecord.registrationId)) {
          setSelectedRecord({
            ...selectedRecord,
            name: editFormData["الاسم"] || selectedRecord.name,
            nameArabic: editFormData["الاسم بالعربي"] || selectedRecord.nameArabic,
            data: { ...editFormData }
          });
        }

        setTimeout(() => {
          setEditingRecord(null);
          setEditSuccessMsg(null);
        }, 1200);
      } else {
        setEditErrorMsg(msg || "تعذر حفظ التعديلات في الشيت");
      }
    } catch (err: any) {
      setEditErrorMsg("حدث خطأ أثناء الاتصال بالخادم لتحديث السجل: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (rec: RegistrationAnswerRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingRecord(rec);
    setDeleteErrorMsg(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    setDeleteErrorMsg(null);

    const targetToDelete = deletingRecord;

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      
      let isSuccess = false;
      let msg = "";

      // 1. Try local server
      try {
        const res = await fetch("/api/registration-answers/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationId: targetToDelete.registrationId,
            rowIndex: targetToDelete.rowIndex,
            scriptUrl: activeScript
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            isSuccess = true;
            msg = data.message;
          }
        }
      } catch (e) {}

      // 2. Direct Apps script fallback
      if (!isSuccess) {
        const bridgeRes = await executeAppsScriptPost("deleteRegistrationAnswer", {
          registrationId: targetToDelete.registrationId,
          rowIndex: targetToDelete.rowIndex
        }, activeScript);
        if (bridgeRes.success) {
          isSuccess = true;
          msg = bridgeRes.data?.message;
        }
      }

      if (isSuccess) {
        setActionSuccessBanner(`تم حذف سجل المسجل [${targetToDelete.name || targetToDelete.registrationId}] بنجاح من الشيت`);
        setTimeout(() => setActionSuccessBanner(null), 5000);

        // Remove from local state immediately
        setRecords((prev) =>
          prev.filter(
            (r) =>
              r.rowIndex !== targetToDelete.rowIndex &&
              !(r.registrationId && r.registrationId === targetToDelete.registrationId)
          )
        );

        if (selectedRecord && (selectedRecord.rowIndex === targetToDelete.rowIndex || selectedRecord.registrationId === targetToDelete.registrationId)) {
          setSelectedRecord(null);
        }

        setDeletingRecord(null);
      } else {
        setDeleteErrorMsg(msg || "تعذر حذف السجل من جدول البيانات");
      }
    } catch (err: any) {
      setDeleteErrorMsg("حدث خطأ أثناء الاتصال بالخادم لحذف السجل: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headerCols = headers.length > 0 ? headers : ["رقم التسجيل", "الاسم", "الاسم بالعربي", "التاريخ والوقت"];
    const csvRows: string[] = [];
    
    csvRows.push(headerCols.map(h => `"${(h || "").replace(/"/g, '""')}"`).join(","));

    records.forEach(rec => {
      const row = headerCols.map(h => {
        const val = rec.data[h] || "";
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RegistrationAnswers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Custom Column in Monitor Config
  const toggleCustomColumn = (col: string) => {
    setMonitorConfig((prev) => {
      const exists = prev.customColumns.includes(col);
      return {
        ...prev,
        customColumns: exists
          ? prev.customColumns.filter((c) => c !== col)
          : [...prev.customColumns, col],
      };
    });
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-xl border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 flex-wrap">
              <span>سجل المشتركين المسجلين</span>
              <span className="px-2 py-0.5 text-xs font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full">
                {records.length} مسجل
              </span>
              {totalDuplicateRecordsCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>{totalDuplicateRecordsCount} حالات تشابه في البيانات الأساسية</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              بيانات ورقة <code className="text-amber-400/90 font-mono">RegistrationAnswers</code> مع فحص ذكي مقتصر على الحقول الأساسية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Settings for Duplicate Monitor Fields */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
              showSettingsDrawer
                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
            title="تخصيص الحقول والأعمدة التي يراقبها نظام التشابه"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>حقول المراقبة</span>
          </button>

          {/* Duplicate Filter Toggle */}
          {totalDuplicateRecordsCount > 0 && (
            <button
              onClick={() => setFilterDuplicatesOnly(!filterDuplicatesOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                filterDuplicatesOnly
                  ? "bg-rose-500 text-slate-950 border-rose-400 shadow-lg shadow-rose-500/20"
                  : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30"
              }`}
              title="تصفية وعرض السجلات التي تحتوي على تشابه فقط"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{filterDuplicatesOnly ? "عرض كافة المسجلين" : `المتشابه والمكرر فقط (${totalDuplicateRecordsCount})`}</span>
            </button>
          )}

          <button
            onClick={fetchRecords}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="تحديث البيانات من الشيت"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            <span>{isLoading ? "جاري التحديث..." : "تحديث"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors disabled:opacity-40"
            title="تصدير السجلات كملف CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MONITORED COLUMNS CONFIGURATION PANEL (ACCORDION / DRAWER) */}
      {/* ========================================================================= */}
      {showSettingsDrawer && (
        <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-300">
                إعدادات مراقبة الحقول الأساسية لكشف التشابه والتكرار
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              (الأسئلة الإضافية مستثناة تلقائياً ولا تدخل في الفحص ما لم تحددها)
            </span>
          </div>

          {/* Primary Built-in Fields */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-300 block">
              الحقول الأساسية المعتمدة في المراقبة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Check 1: Reg ID */}
              <button
                type="button"
                onClick={() =>
                  setMonitorConfig((prev) => ({
                    ...prev,
                    checkRegistrationId: !prev.checkRegistrationId,
                  }))
                }
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  monitorConfig.checkRegistrationId
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {monitorConfig.checkRegistrationId ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>رقم التسجيل (ID)</span>
              </button>

              {/* Check 2: Name */}
              <button
                type="button"
                onClick={() =>
                  setMonitorConfig((prev) => ({
                    ...prev,
                    checkName: !prev.checkName,
                  }))
                }
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  monitorConfig.checkName
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {monitorConfig.checkName ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>الاسم (Name)</span>
              </button>

              {/* Check 3: Name Arabic */}
              <button
                type="button"
                onClick={() =>
                  setMonitorConfig((prev) => ({
                    ...prev,
                    checkNameArabic: !prev.checkNameArabic,
                  }))
                }
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  monitorConfig.checkNameArabic
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {monitorConfig.checkNameArabic ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>الاسم بالعربي</span>
              </button>

              {/* Check 4: Phone */}
              <button
                type="button"
                onClick={() =>
                  setMonitorConfig((prev) => ({
                    ...prev,
                    checkPhone: !prev.checkPhone,
                  }))
                }
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  monitorConfig.checkPhone
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {monitorConfig.checkPhone ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>رقم الهاتف / الجوال</span>
              </button>

              {/* Check 5: Email */}
              <button
                type="button"
                onClick={() =>
                  setMonitorConfig((prev) => ({
                    ...prev,
                    checkEmail: !prev.checkEmail,
                  }))
                }
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  monitorConfig.checkEmail
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {monitorConfig.checkEmail ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>البريد الإلكتروني</span>
              </button>

              {/* Check 6: Line ID */}
              <button
                type="button"
                onClick={() =>
                  setMonitorConfig((prev) => ({
                    ...prev,
                    checkLineId: !prev.checkLineId,
                  }))
                }
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  monitorConfig.checkLineId
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {monitorConfig.checkLineId ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>معرف Line ID</span>
              </button>

              {/* Check 7: Facebook */}
              <button
                type="button"
                onClick={() =>
                  setMonitorConfig((prev) => ({
                    ...prev,
                    checkFacebook: !prev.checkFacebook,
                  }))
                }
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  monitorConfig.checkFacebook
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {monitorConfig.checkFacebook ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>فيسبوك (Facebook)</span>
              </button>
            </div>
          </div>

          {/* Other Sheet Columns if user wants to add any specific one */}
          {headers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-[11px] font-semibold text-slate-300 block">
                أعمدة إضافية من جدول الشيت (اختياري - انقر لتفعيل المراقبة عليها):
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {headers
                  .filter(
                    (h) =>
                      h &&
                      !["الاسم", "الاسم بالعربي", "رقم التسجيل", "التاريخ والوقت", "Timestamp"].includes(h)
                  )
                  .map((headerCol) => {
                    const isChecked = monitorConfig.customColumns.includes(headerCol);
                    return (
                      <button
                        key={headerCol}
                        type="button"
                        onClick={() => toggleCustomColumn(headerCol)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                          isChecked
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>{headerCol}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>يتم حفظ خياراتك تلقائياً وتطبيقها فوراً على جدول المسجلين.</span>
            <button
              type="button"
              onClick={() => setMonitorConfig(DEFAULT_MONITOR_CONFIG)}
              className="text-amber-400 hover:underline"
            >
              استعادة الحقول الافتراضية
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Indicator Notice */}
      {totalDuplicateRecordsCount > 0 && !filterDuplicatesOnly && (
        <div className="flex items-center justify-between p-3 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>نظام مراقبة البيانات الأساسية:</strong> تم رصد <strong>{totalDuplicateRecordsCount} مسجلين</strong> لديهم تشابه في (الاسم، الهاتف، البريد، Line، أو فيسبوك).
            </span>
          </div>
          <button
            onClick={() => setFilterDuplicatesOnly(true)}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg transition-colors"
          >
            عزل المتشابهين
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {actionSuccessBanner && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccessBanner}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-500/40 text-red-300 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <div className="flex-1">
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRecords}
            className="px-2.5 py-1 text-xs bg-red-800/60 hover:bg-red-800 text-white rounded-md"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث برقم التسجيل، الاسم، الاسم بالعربي، الإيميل، الهاتف، Line ID، فيسبوك..."
          className="w-full pr-10 pl-4 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
          >
            مسح
          </button>
        )}
      </div>

      {/* Records Table Container */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        {isLoading && records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-xs font-medium">جاري قراءة البيانات من ورقة RegistrationAnswers...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 text-center px-4">
            <FileText className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">
              {filterDuplicatesOnly
                ? "لا توجد سجلات مكررة أو متشابهة مطابقة للتصفية"
                : searchQuery
                ? "لا توجد نتائج مطابقة لبحثك"
                : "لا توجد سجلات مسجلين حالياً في ورقة RegistrationAnswers"}
            </p>
            {filterDuplicatesOnly && (
              <button
                onClick={() => setFilterDuplicatesOnly(false)}
                className="mt-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                العودة لعرض كافة السجلات
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 w-1/4 text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-400" />
                      <span>رقم التسجيل</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-1/3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>الاسم ومؤشر التشابه</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-1/4">
                    <div className="flex items-center gap-1.5">
                      <span>الاسم بالعربي</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-32 text-center">
                    <span>الإجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((record, idx) => {
                  const recKey = record.registrationId || `row_${record.rowIndex || idx}`;
                  const duplicateMatches = duplicatesMap.get(recKey) || [];
                  const hasDuplicates = duplicateMatches.length > 0;
                  const isHighSeverity = duplicateMatches.some((m) => m.severity === "high");

                  return (
                    <tr
                      key={record.registrationId || `row-${record.rowIndex || idx}`}
                      onClick={() => setSelectedRecord(record)}
                      className={`transition-colors cursor-pointer group ${
                        hasDuplicates
                          ? isHighSeverity
                            ? "bg-rose-950/25 hover:bg-rose-950/40 border-r-4 border-r-rose-500"
                            : "bg-amber-950/20 hover:bg-amber-950/35 border-r-4 border-r-amber-500"
                          : "hover:bg-amber-500/5"
                      }`}
                    >
                      {/* Column 1: Registration ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              hasDuplicates
                                ? isHighSeverity
                                  ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                                  : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                                : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                            }`}
                          >
                            {record.registrationId || `ID-${record.rowIndex}`}
                          </span>
                          {record.timestamp && (
                            <span className="text-[10px] text-slate-500 font-sans hidden md:inline">
                              {record.timestamp}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Name & Duplicate Badge */}
                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-semibold transition-colors ${
                                hasDuplicates
                                  ? isHighSeverity
                                    ? "text-rose-200 group-hover:text-rose-100"
                                    : "text-amber-200 group-hover:text-amber-100"
                                  : "group-hover:text-amber-300"
                              }`}
                            >
                              {record.name || record.data["الاسم"] || "—"}
                            </span>
                            <Eye className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Duplicate Marker Badge */}
                          {hasDuplicates && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isHighSeverity
                                    ? "bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm shadow-rose-500/20"
                                    : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                                }`}
                                title={duplicateMatches.map((m) => `مشابه لـ: ${m.matchedRecord.name} (${m.reasons.join("، ")})`).join(" \n ")}
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>
                                  {isHighSeverity ? "⚠️ تطابق في البيانات الأساسية" : "⚠️ تشابه في الاسم"} ({duplicateMatches.length} مسجلين)
                                </span>
                              </span>

                              <span className="text-[10px] text-slate-400 font-arabic truncate max-w-[200px] hidden sm:inline">
                                مع: {duplicateMatches.map((m) => m.matchedRecord.name || m.matchedRecord.nameArabic || `صف ${m.matchedRecord.rowIndex}`).join("، ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Name Arabic */}
                      <td className="py-3.5 px-4 text-slate-300 font-arabic">
                        <div className="flex flex-col">
                          <span>{record.nameArabic || record.data["الاسم بالعربي"] || "—"}</span>
                          {hasDuplicates && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              صف {record.rowIndex}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Actions (Edit & Delete) */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(record, e)}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors"
                            title="تعديل بيانات المسجل في الشيت"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenDelete(record, e)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="حذف هذا المسجل من الشيت"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>انقر على أي سطر لعرض التفاصيل الشاملة ومقارنة السجلات المتشابهة.</span>
        </span>
        {lastUpdated && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>آخر تحديث: {lastUpdated.toLocaleTimeString("ar-EG")}</span>
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          dir="rtl"
        >
          <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                    <span>{selectedRecord.name || selectedRecord.nameArabic || "تفاصيل المسجل"}</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono rounded">
                      #{selectedRecord.registrationId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    بيانات الصف رقم {selectedRecord.rowIndex} في ورقة RegistrationAnswers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[62vh]">
              {/* DUPLICATES ALERT CARD IN MODAL */}
              {(() => {
                const recKey = selectedRecord.registrationId || `row_${selectedRecord.rowIndex}`;
                const duplicateMatches = duplicatesMap.get(recKey) || [];
                if (duplicateMatches.length === 0) return null;

                return (
                  <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>تنبيه نظام التشابه: تم رصد {duplicateMatches.length} سجلات مطابقة أو مشابهة في الحقول الأساسية</span>
                    </div>

                    <div className="space-y-2">
                      {duplicateMatches.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-rose-500/20 rounded-lg text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{m.matchedRecord.name || "مشترك"}</span>
                              <span className="font-mono text-amber-400 text-[10px]">#{m.matchedRecord.registrationId}</span>
                              <span className="text-slate-500 text-[10px]">(صف {m.matchedRecord.rowIndex})</span>
                            </div>
                            <div className="text-[11px] text-rose-300/90 mt-0.5">
                              {m.reasons.join(" • ")}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setComparingRecord({
                                  original: selectedRecord,
                                  duplicate: m.matchedRecord,
                                  reasons: m.reasons
                                });
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-lg transition-colors"
                            >
                              مقارنة السجلين
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Quick Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 block">رقم التسجيل المرجعي</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {selectedRecord.registrationId || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">تاريخ ووقت التسجيل</span>
                  <span className="text-xs text-slate-300">
                    {selectedRecord.timestamp || selectedRecord.data["التاريخ والوقت"] || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الاسم بالعربي</span>
                  <span className="text-xs text-slate-200 font-arabic font-semibold">
                    {selectedRecord.nameArabic || selectedRecord.data["الاسم بالعربي"] || "—"}
                  </span>
                </div>
              </div>

              {/* All Data Fields List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-amber-400/90 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>كافة البيانات والإجابات المسجلة في الجدول:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(selectedRecord.data || {}).map(([key, val]) => {
                    const isUrl =
                      typeof val === "string" &&
                      (val.startsWith("http://") || val.startsWith("https://") || val.includes("drive.google.com"));
                    const isImage = isUrl && (val.includes("thumbnail") || val.includes(".jpg") || val.includes(".png") || val.includes(".jpeg") || key.includes("صورة"));

                    return (
                      <div
                        key={key}
                        className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1 hover:border-slate-700 transition-colors"
                      >
                        <div className="text-[11px] font-semibold text-amber-300/80">{key}</div>
                        
                        {isUrl ? (
                          <div className="space-y-2 pt-1">
                            {isImage && (
                              <div className="relative w-full h-28 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                                <img
                                  src={val}
                                  alt={key}
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                            <a
                              href={val}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>فتح الرابط / الملف</span>
                            </a>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-200 break-words font-medium">
                            {val ? val : <span className="text-slate-600 font-normal">غير محدد (فارغ)</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60">
              <button
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  handleOpenEdit(rec);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل هذا المسجل</span>
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SIDE-BY-SIDE DUPLICATE COMPARISON MODAL */}
      {/* ========================================================================= */}
      {comparingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div className="relative w-full max-w-4xl bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-500/20 bg-slate-950/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                    <span>مقارنة السجلات المتشابهة</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    أسباب التشابه: {comparingRecord.reasons.join(" • ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setComparingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Two Column Comparison */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[68vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Record A */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400">السجل الأول (الصف {comparingRecord.original.rowIndex})</span>
                    <span className="font-mono text-xs text-amber-300">#{comparingRecord.original.registrationId}</span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(comparingRecord.original.data || {}).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold">{k}</div>
                        <div className="text-xs text-slate-200 break-words font-medium">{v || "—"}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        const rec = comparingRecord.original;
                        setComparingRecord(null);
                        handleOpenDelete(rec);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف هذا السجل</span>
                    </button>
                  </div>
                </div>

                {/* Record B */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-rose-400">السجل المشابه (الصف {comparingRecord.duplicate.rowIndex})</span>
                    <span className="font-mono text-xs text-rose-300">#{comparingRecord.duplicate.registrationId}</span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(comparingRecord.duplicate.data || {}).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold">{k}</div>
                        <div className="text-xs text-slate-200 break-words font-medium">{v || "—"}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        const rec = comparingRecord.duplicate;
                        setComparingRecord(null);
                        handleOpenDelete(rec);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف هذا السجل</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
              <button
                onClick={() => setComparingRecord(null)}
                className="px-5 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                إغلاق المقارنة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT RECORD MODAL */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          dir="rtl"
        >
          <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                    <span>تعديل بيانات المسجل</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono rounded">
                      #{editingRecord.registrationId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    تعديل وحفظ البيانات مباشرة في ورقة RegistrationAnswers (الصف رقم {editingRecord.rowIndex})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                disabled={isSavingEdit}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form Body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 max-h-[62vh]">
                {editSuccessMsg && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{editSuccessMsg}</span>
                  </div>
                )}

                {editErrorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-500/40 text-red-300 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{editErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {Object.keys(editFormData).map((fieldKey) => {
                    const isReadOnly = fieldKey === "التاريخ والوقت" || fieldKey === "Timestamp";
                    return (
                      <div key={fieldKey} className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                          <span>{fieldKey}</span>
                          {isReadOnly && <span className="text-[10px] text-slate-500">(للقراءة فقط)</span>}
                        </label>
                        <input
                          type="text"
                          value={editFormData[fieldKey] || ""}
                          disabled={isReadOnly || isSavingEdit}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              [fieldKey]: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 bg-slate-950/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all ${
                            isReadOnly
                              ? "opacity-60 bg-slate-900 border-slate-800 cursor-not-allowed"
                              : "border-slate-700 focus:border-amber-500"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحفظ في الشيت...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ التعديلات في الشيت</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">تأكيد حذف المسجل</h3>
                <p className="text-xs text-slate-400">هل أنت متأكد من رغبتك بحذف هذا المسجل؟</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <div>
                <span className="text-slate-500">رقم التسجيل: </span>
                <span className="font-mono font-bold text-amber-400">
                  {deletingRecord.registrationId || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">الاسم: </span>
                <span className="font-semibold text-slate-100">
                  {deletingRecord.name || deletingRecord.data["الاسم"] || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">الاسم بالعربي: </span>
                <span className="text-slate-200">
                  {deletingRecord.nameArabic || deletingRecord.data["الاسم بالعربي"] || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">رقم الصف في الشيت: </span>
                <span className="text-slate-400">الصف رقم {deletingRecord.rowIndex}</span>
              </div>
            </div>

            {deleteErrorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-500/40 text-red-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <p className="text-xs text-red-300/80">
              تنبيه: سيتم حذف هذا الصف بالكامل من ورقة RegistrationAnswers في Google Sheets فوراً.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/20 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>نعم، احذف المسجل</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
