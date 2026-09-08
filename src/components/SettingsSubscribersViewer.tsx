import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Smartphone, 
  FileText, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  X, 
  HelpCircle,
  Database,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserPlus
} from "lucide-react";
import { SettingsSubscriberRecord } from "../types";
import { 
  fetchSettingsSubscribersBridge, 
  updateSettingsSubscriberBridge, 
  deleteSettingsSubscriberBridge, 
  addSettingsSubscriberBridge,
  DEFAULT_SCRIPT_URL,
  DEFAULT_SPREADSHEET_ID
} from "../utils/googleBackendBridge";

interface SettingsSubscribersViewerProps {
  scriptUrl?: string;
  spreadsheetId?: string;
  onRefreshParent?: () => void;
}

export const SettingsSubscribersViewer: React.FC<SettingsSubscribersViewerProps> = ({
  scriptUrl,
  spreadsheetId,
  onRefreshParent
}) => {
  const [records, setRecords] = useState<SettingsSubscriberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "allowed" | "blocked">("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [actionSuccessBanner, setActionSuccessBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<SettingsSubscriberRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editRegId, setEditRegId] = useState("");
  const [editTopicId, setEditTopicId] = useState("1");
  const [editStatus, setEditStatus] = useState("مسموح");
  const [editDeviceCount, setEditDeviceCount] = useState("1");
  const [editResetDevices, setEditResetDevices] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingRecord, setDeletingRecord] = useState<SettingsSubscriberRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRegId, setNewRegId] = useState("");
  const [newTopicId, setNewTopicId] = useState("1");
  const [newStatus, setNewStatus] = useState("مسموح");
  const [newDeviceCount, setNewDeviceCount] = useState("1");
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Fetch subscribers from Settings sheet
  const fetchSubscribers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      const activeSpreadsheet = spreadsheetId || (typeof window !== "undefined" ? localStorage.getItem("thnoon_spreadsheet_id") : "") || DEFAULT_SPREADSHEET_ID;

      const data = await fetchSettingsSubscribersBridge(activeScript, activeSpreadsheet);
      if (data && data.success) {
        setRecords(data.records || []);
        setLastUpdated(new Date());
      } else {
        setError(data.message || "تعذر جلب بيانات المشتركين من ورقة Settings");
      }
    } catch (err: any) {
      console.error("Error fetching Settings subscribers:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم لجلب المشتركين");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [scriptUrl, spreadsheetId]);

  // Filtered records based on search and status
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Status filter
      if (statusFilter === "allowed" && !rec.isAllowed) return false;
      if (statusFilter === "blocked" && rec.isAllowed) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const matchName = rec.name && rec.name.toLowerCase().includes(q);
      const matchRegId = rec.registrationId && rec.registrationId.toLowerCase().includes(q);
      const matchTopic = rec.topicId && rec.topicId.toLowerCase().includes(q);
      const matchStatus = rec.status && rec.status.toLowerCase().includes(q);
      const matchDev = rec.deviceCount && rec.deviceCount.toLowerCase().includes(q);

      return matchName || matchRegId || matchTopic || matchStatus || matchDev;
    });
  }, [records, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const allowed = records.filter((r) => r.isAllowed).length;
    const blocked = records.filter((r) => !r.isAllowed).length;
    return { total, allowed, blocked };
  }, [records]);

  // Copy handler
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: SettingsSubscriberRecord) => {
    setEditingRecord(rec);
    setEditName(rec.name || "");
    setEditRegId(rec.registrationId || "");
    setEditTopicId(rec.topicId || "1");
    setEditStatus(rec.status || "مسموح");
    setEditDeviceCount(rec.deviceCount || "1");
    setEditResetDevices(false);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSavingEdit(true);
    setEditError(null);

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      const isAllowedVal = !(editStatus === "ممنوع" || editStatus === "معطل" || editStatus === "محظور" || editStatus === "لا");

      const res = await updateSettingsSubscriberBridge({
        rowIndex: editingRecord.rowIndex,
        registrationId: editRegId || editingRecord.registrationId,
        name: editName,
        topicId: editTopicId || "1",
        status: editStatus,
        deviceCount: editDeviceCount || "1",
        resetRegisteredDevices: editResetDevices
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تم تحديث بيانات المشترك [${editName || editRegId}] بنجاح في ورقة Settings!`);
        setTimeout(() => setActionSuccessBanner(null), 5000);

        // Update local state
        setRecords((prev) =>
          prev.map((r) =>
            r.rowIndex === editingRecord.rowIndex
              ? {
                  ...r,
                  name: editName,
                  registrationId: editRegId,
                  topicId: editTopicId || "1",
                  status: editStatus,
                  isAllowed: isAllowedVal,
                  deviceCount: editDeviceCount || "1"
                }
              : r
          )
        );

        setEditingRecord(null);
        if (onRefreshParent) onRefreshParent();
      } else {
        setEditError(res.message || "فشل حفظ التعديلات في ورقة Settings");
      }
    } catch (err: any) {
      setEditError("حدث خطأ أثناء حفظ التعديلات: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Quick Toggle Status (مسموح <-> ممنوع)
  const handleQuickToggleStatus = async (rec: SettingsSubscriberRecord) => {
    const nextStatus = rec.isAllowed ? "ممنوع" : "مسموح";
    const isAllowedVal = nextStatus === "مسموح";

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      
      // Optimistic update
      setRecords((prev) =>
        prev.map((r) =>
          r.rowIndex === rec.rowIndex
            ? { ...r, status: nextStatus, isAllowed: isAllowedVal }
            : r
        )
      );

      const res = await updateSettingsSubscriberBridge({
        rowIndex: rec.rowIndex,
        registrationId: rec.registrationId,
        name: rec.name,
        topicId: rec.topicId,
        status: nextStatus,
        deviceCount: rec.deviceCount
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تم تغيير حالة المشترك [${rec.name || rec.registrationId}] إلى "${nextStatus}" بنجاح.`);
        setTimeout(() => setActionSuccessBanner(null), 4000);
        if (onRefreshParent) onRefreshParent();
      } else {
        // Revert on error
        fetchSubscribers();
      }
    } catch (err) {
      fetchSubscribers();
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (rec: SettingsSubscriberRecord) => {
    setDeletingRecord(rec);
    setDeleteError(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;

      const res = await deleteSettingsSubscriberBridge({
        rowIndex: deletingRecord.rowIndex,
        registrationId: deletingRecord.registrationId
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تم حذف صف المشترك [${deletingRecord.name || deletingRecord.registrationId}] كاملاً من ورقة Settings بنجاح.`);
        setTimeout(() => setActionSuccessBanner(null), 5000);

        setRecords((prev) => prev.filter((r) => r.rowIndex !== deletingRecord.rowIndex));
        setDeletingRecord(null);
        if (onRefreshParent) onRefreshParent();
      } else {
        setDeleteError(res.message || "فشل حذف صف المشترك من ورقة Settings");
      }
    } catch (err: any) {
      setDeleteError("حدث خطأ أثناء الحذف: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add New Subscriber
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() && !newRegId.trim()) {
      setAddError("يرجى إدخال اسم المشترك أو رقم التسجيل على الأقل");
      return;
    }
    setIsSavingNew(true);
    setAddError(null);

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;

      const res = await addSettingsSubscriberBridge({
        name: newName.trim(),
        registrationId: newRegId.trim(),
        topicId: newTopicId.trim() || "1",
        status: newStatus.trim() || "مسموح",
        deviceCount: newDeviceCount.trim() || "1"
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تمت إضافة المشترك [${newName || newRegId}] بنجاح إلى ورقة Settings.`);
        setTimeout(() => setActionSuccessBanner(null), 5000);

        setIsAddModalOpen(false);
        setNewName("");
        setNewRegId("");
        setNewTopicId("1");
        setNewStatus("مسموح");
        setNewDeviceCount("1");

        fetchSubscribers();
        if (onRefreshParent) onRefreshParent();
      } else {
        setAddError(res.message || "فشل إضافة المشترك إلى الشيت");
      }
    } catch (err: any) {
      setAddError("حدث خطأ أثناء إضافة المشترك: " + err.message);
    } finally {
      setIsSavingNew(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Info & Stats */}
      <div className="bg-gradient-to-l from-emerald-50 via-teal-50/60 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  تسجيل المشتركين (ورقة Settings)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  إدارة الصلاحيات والأجهزة
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                عرض وتعديل حسابات المشتركين المسجلة في ورقة <code className="px-1.5 py-0.5 bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 rounded font-mono text-xs">Settings</code>، والتحكم بحالة الدخول المسموح/الممنوع، عدد الأجهزة المسموحة، ورقم الصفحة المخصصة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              id="btn-add-settings-subscriber"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs shadow-emerald-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مشترك جديد</span>
            </button>

            <button
              id="btn-refresh-settings-subscribers"
              onClick={fetchSubscribers}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors shadow-xs"
              title="تحديث البيانات من قوقل شيت"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/40">
          <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">إجمالي المشتركين</div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{stats.total}</div>
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === "allowed" ? "all" : "allowed")}
            className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${
              statusFilter === "allowed" 
                ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400 ring-2 ring-emerald-500/20" 
                : "bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300"
            }`}
          >
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مسموح للدخول</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.allowed}</div>
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === "blocked" ? "all" : "blocked")}
            className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${
              statusFilter === "blocked" 
                ? "bg-rose-100 dark:bg-rose-900/50 border-rose-400 ring-2 ring-rose-500/20" 
                : "bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300"
            }`}
          >
            <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>ممنوع / محظور</span>
            </div>
            <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">{stats.blocked}</div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessBanner && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-medium animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessBanner}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-sm font-medium shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button 
            onClick={fetchSubscribers} 
            className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 text-rose-900 dark:text-rose-200 text-xs rounded-lg font-semibold transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-settings-subscribers"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، رقم التسجيل، رقم الصفحة..."
            className="w-full pl-9 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              id="filter-status-all"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              الكل ({stats.total})
            </button>
            <button
              id="filter-status-allowed"
              onClick={() => setStatusFilter("allowed")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "allowed"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
              }`}
            >
              مسموح ({stats.allowed})
            </button>
            <button
              id="filter-status-blocked"
              onClick={() => setStatusFilter("blocked")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "blocked"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "text-rose-700 dark:text-rose-400 hover:text-rose-900"
              }`}
            >
              ممنوع ({stats.blocked})
            </button>
          </div>

          {lastUpdated && (
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden lg:inline font-mono">
              آخر تحديث: {lastUpdated.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Main Subscribers Table */}
      <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse" id="table-settings-subscribers">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 min-w-[180px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>اسم المشترك</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 dark:bg-slate-700 rounded text-slate-500 font-mono">العامود Z</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[150px]">
                  <div className="flex items-center gap-1.5">
                    <span>رقم التسجيل</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 dark:bg-slate-700 rounded text-slate-500 font-mono">العامود AA</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>رقم الصفحة الخاصة</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 dark:bg-slate-700 rounded text-slate-500 font-mono">العامود A</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[140px] text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>حالة الدخول</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 dark:bg-slate-700 rounded text-slate-500 font-mono">العامود AB</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[120px] text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>عدد الأجهزة</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 dark:bg-slate-700 rounded text-slate-500 font-mono">العامود AC</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[140px] text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-sm font-medium">جاري قراءة المشتركين من ورقة Settings...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery ? "لا توجد نتائج تطابق بحثك" : "لا يوجد مشتركون مسجلون في ورقة Settings حالياً"}
                      </span>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery ? "جرب البحث بكلمات أخرى أو إزالة الفلترة" : "يمكنك إضافة مشترك جديد باستخدام زر 'إضافة مشترك جديد' أعلاه"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const isAllowed = rec.isAllowed;
                  const rowId = `sub-row-${rec.rowIndex}`;

                  return (
                    <tr 
                      key={rowId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                        {rec.rowIndex}
                      </td>

                      {/* 1. العامود Z: اسم المشترك */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                            {rec.name ? rec.name.trim().charAt(0) : "م"}
                          </div>
                          <span className="truncate max-w-[200px]" title={rec.name}>
                            {rec.name || <span className="text-slate-400 italic">بدون اسم</span>}
                          </span>
                        </div>
                      </td>

                      {/* 2. العامود AA: رقم التسجيل */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/80 rounded-md border border-slate-200 dark:border-slate-600">
                            {rec.registrationId || <span className="text-slate-400 italic">غير محدد</span>}
                          </span>
                          {rec.registrationId && (
                            <button
                              onClick={() => handleCopy(rec.registrationId, `reg-${rec.rowIndex}`)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                              title="نسخ رقم التسجيل"
                            >
                              {copiedId === `reg-${rec.rowIndex}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 3. العامود A: رقم الصفحة الخاصة */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg font-mono text-xs font-bold">
                          <FileText className="w-3 h-3 text-blue-500" />
                          <span>الصفحة #{rec.topicId || "1"}</span>
                        </span>
                      </td>

                      {/* 4. العامود AB: مسموح / ممنوع للدخول */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleQuickToggleStatus(rec)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                            isAllowed
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-100"
                          }`}
                          title="اضغط للتبديل الفوري بين مسموح وممنوع"
                        >
                          {isAllowed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مسموح</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>ممنوع</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 5. العامود AC: عدد الاجهزة */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md font-bold">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          <span>{rec.deviceCount || "1"}</span>
                        </span>
                      </td>

                      {/* 6. العامود الاخير: زر تعديل وزر الحذف الصف كاملا */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر تعديل */}
                          <button
                            id={`btn-edit-subscriber-${rec.rowIndex}`}
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                            title="تعديل بيانات المشترك"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* زر الحذف الصف كاملاً */}
                          <button
                            id={`btn-delete-subscriber-${rec.rowIndex}`}
                            onClick={() => handleOpenDelete(rec)}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            title="حذف الصف كاملاً من ورقة Settings"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50/80 dark:bg-slate-900/60 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>يتم تطبيق أي تعديل أو حذف مباشرة على ورقة <strong className="text-slate-700 dark:text-slate-300 font-mono">Settings</strong> في قوقل شيت.</span>
          <span>عدد السجلات المعروضة: {filteredRecords.length} من {records.length}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EDIT MODAL */}
      {/* ------------------------------------------------------------- */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    تعديل بيانات المشترك (الصف #{editingRecord.rowIndex})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تعديل القيم المباشرة في ورقة Settings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* 1. اسم المشترك (العامود Z) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1- اسم المشترك <span className="font-mono text-emerald-600 font-normal">(العامود Z والعامود B)</span>
                </label>
                <input
                  id="input-edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="مثال: يوسف أحمد"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 2. رقم التسجيل (العامود AA) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2- رقم التسجيل <span className="font-mono text-emerald-600 font-normal">(العامود AA)</span>
                </label>
                <input
                  id="input-edit-regid"
                  type="text"
                  value={editRegId}
                  onChange={(e) => setEditRegId(e.target.value)}
                  placeholder="مثال: 202686124"
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 3. رقم الصفحة الخاصة (العامود A) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  3- رقم الصفحة الخاصة <span className="font-mono text-emerald-600 font-normal">(العامود A)</span>
                </label>
                <input
                  id="input-edit-topicid"
                  type="text"
                  value={editTopicId}
                  onChange={(e) => setEditTopicId(e.target.value)}
                  placeholder="مثال: 1"
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">يحدد محتوى ورقة SubscriberContent الذي يظهر لهذا المشترك (افتراضياً: 1).</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 4. مسموح / ممنوع للدخول (العامود AB) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    4- حالة الدخول <span className="font-mono text-emerald-600 font-normal">(العامود AB)</span>
                  </label>
                  <select
                    id="select-edit-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="مسموح">مسموح (متاح الدخول)</option>
                    <option value="ممنوع">ممنوع (محظور الدخول)</option>
                  </select>
                </div>

                {/* 5. عدد الأجهزة (العامود AC) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    5- عدد الأجهزة <span className="font-mono text-emerald-600 font-normal">(العامود AC)</span>
                  </label>
                  <input
                    id="input-edit-devicecount"
                    type="number"
                    min="1"
                    max="10"
                    value={editDeviceCount}
                    onChange={(e) => setEditDeviceCount(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                  />
                </div>
              </div>

              {/* خيار إضافي: مسح بصمات الأجهزة المسجلة */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editResetDevices}
                    onChange={(e) => setEditResetDevices(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>إعادة ضبط ومسح بصمات الأجهزة المسجلة مسبقاً (السماح بالتسجيل من جهاز جديد)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  id="btn-save-subscriber-edit"
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ في الشيت...</span>
                    </>
                  ) : (
                    <span>حفظ التعديلات في الشيت</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                تأكيد حذف صف المشترك كاملاً
              </h4>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف صف المشترك{" "}
                <strong className="text-slate-900 dark:text-white font-bold">
                  [{deletingRecord.name || deletingRecord.registrationId}]
                </strong>{" "}
                (الصف رقم <span className="font-mono font-bold text-rose-600">{deletingRecord.rowIndex}</span>) بالكامل من ورقة <code className="font-mono bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">Settings</code>؟
              </p>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 text-right">
                ⚠️ سيتم حذف هذا الصف نهائياً من جدول البيانات في قوقل درايف ولن يتمكن المشترك من تسجيل الدخول بعد الآن.
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium text-right flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
              >
                إلغاء التراجع
              </button>
              <button
                id="btn-confirm-delete-subscriber"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs shadow-rose-600/20"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحذف من الشيت...</span>
                  </>
                ) : (
                  <span>نعم، احذف الصف الآن</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD NEW SUBSCRIBER MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    إضافة مشترك جديد إلى ورقة Settings
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إنشاء حساب مباشر للمشترك في جدول البيانات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* 1. اسم المشترك */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1- اسم المشترك <span className="font-mono text-emerald-600 font-normal">(العامود Z)</span>
                </label>
                <input
                  id="input-new-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: يوسف أحمد"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* 2. رقم التسجيل */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2- رقم التسجيل <span className="font-mono text-emerald-600 font-normal">(العامود AA)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-new-regid"
                    type="text"
                    value={newRegId}
                    onChange={(e) => setNewRegId(e.target.value)}
                    placeholder="مثال: 202686124"
                    required
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = `${new Date().getFullYear()}${new Date().getMonth() + 1}${Math.floor(1000 + Math.random() * 9000)}`;
                      setNewRegId(rand);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-200 shrink-0"
                    title="توليد رقم عشوائي"
                  >
                    توليد رقم
                  </button>
                </div>
              </div>

              {/* 3. رقم الصفحة الخاصة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  3- رقم الصفحة الخاصة <span className="font-mono text-emerald-600 font-normal">(العامود A)</span>
                </label>
                <input
                  id="input-new-topicid"
                  type="text"
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value)}
                  placeholder="1"
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 4. حالة الدخول */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    4- حالة الدخول <span className="font-mono text-emerald-600 font-normal">(العامود AB)</span>
                  </label>
                  <select
                    id="select-new-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="مسموح">مسموح</option>
                    <option value="ممنوع">ممنوع</option>
                  </select>
                </div>

                {/* 5. عدد الأجهزة */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    5- عدد الأجهزة <span className="font-mono text-emerald-600 font-normal">(العامود AC)</span>
                  </label>
                  <input
                    id="input-new-devicecount"
                    type="number"
                    min="1"
                    max="10"
                    value={newDeviceCount}
                    onChange={(e) => setNewDeviceCount(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  id="btn-submit-add-subscriber"
                  type="submit"
                  disabled={isSavingNew}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs shadow-emerald-600/20"
                >
                  {isSavingNew ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الإضافة إلى الشيت...</span>
                    </>
                  ) : (
                    <span>إضافة المشترك الآن</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsSubscribersViewer;
