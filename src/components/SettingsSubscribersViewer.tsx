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
  UserPlus,
  Archive,
  FolderArchive,
  Sparkles,
  Layers,
  ChevronDown,
  GraduationCap,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  ArrowUpRight
} from "lucide-react";
import { SettingsSubscriberRecord, SubscriberStageStatus } from "../types";
import { 
  fetchSettingsSubscribersBridge, 
  updateSettingsSubscriberBridge, 
  deleteSettingsSubscriberBridge, 
  addSettingsSubscriberBridge,
  archiveCompletedCourseBridge,
  DEFAULT_SCRIPT_URL,
  DEFAULT_SPREADSHEET_ID
} from "../utils/googleBackendBridge";

interface SettingsSubscribersViewerProps {
  scriptUrl?: string;
  spreadsheetId?: string;
  onRefreshParent?: () => void;
}

// Stage Status Definition with Colors & Badges
interface StatusMeta {
  key: SubscriberStageStatus;
  label: string;
  colorDot: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  rowBg: string;
  borderRight: string;
  cardBg: string;
  description: string;
}

const STATUS_CONFIGS: Record<SubscriberStageStatus, StatusMeta> = {
  "معتمد": {
    key: "معتمد",
    label: "معتمد / نشط",
    colorDot: "bg-emerald-500",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-200 dark:border-emerald-800",
    rowBg: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
    borderRight: "border-r-4 border-r-emerald-500",
    cardBg: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-300 dark:border-emerald-800",
    description: "طالب مؤكد بالصفحة الافتراضية وبدأ بالدراسة"
  },
  "متقدم": {
    key: "متقدم",
    label: "متقدم / مرحلة 2",
    colorDot: "bg-sky-500",
    badgeBg: "bg-sky-50 dark:bg-sky-950/40",
    badgeText: "text-sky-700 dark:text-sky-300",
    badgeBorder: "border-sky-200 dark:border-sky-800",
    rowBg: "hover:bg-sky-50/40 dark:hover:bg-sky-950/20",
    borderRight: "border-r-4 border-r-sky-500",
    cardBg: "from-sky-500/10 via-sky-500/5 to-transparent border-sky-300 dark:border-sky-800",
    description: "طالب انتقل للمرحلة الثانية أو الصفحة المتقدمة 2"
  },
  "قيد المراجعة": {
    key: "قيد المراجعة",
    label: "قيد المراجعة",
    colorDot: "bg-amber-500",
    badgeBg: "bg-amber-50 dark:bg-amber-950/40",
    badgeText: "text-amber-800 dark:text-amber-300",
    badgeBorder: "border-amber-200 dark:border-amber-800",
    rowBg: "hover:bg-amber-50/40 dark:hover:bg-amber-950/20",
    borderRight: "border-r-4 border-r-amber-500",
    cardBg: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 dark:border-amber-800",
    description: "تسجيل جديد بانتظار التأكيد أو الاعتماد"
  },
  "مؤرشف": {
    key: "مؤرشف",
    label: "أرشيف / مكتمل",
    colorDot: "bg-slate-400",
    badgeBg: "bg-slate-100 dark:bg-slate-800/80",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-700",
    rowBg: "hover:bg-slate-50/40 dark:hover:bg-slate-900/40 opacity-80",
    borderRight: "border-r-4 border-r-slate-400",
    cardBg: "from-slate-500/10 via-slate-500/5 to-transparent border-slate-300 dark:border-slate-700",
    description: "طالب أنهى الدورة أو تم أرشفته دون حذفه من الشيت"
  }
};

export const SettingsSubscribersViewer: React.FC<SettingsSubscribersViewerProps> = ({
  scriptUrl,
  spreadsheetId,
  onRefreshParent
}) => {
  const [records, setRecords] = useState<SettingsSubscriberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "stages">("table");
  const [stageFilter, setStageFilter] = useState<"all" | SubscriberStageStatus>("all");
  const [hideArchived, setHideArchived] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [actionSuccessBanner, setActionSuccessBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<SettingsSubscriberRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editRegId, setEditRegId] = useState("");
  const [editTopicId, setEditTopicId] = useState("1");
  const [editStatus, setEditStatus] = useState("مسموح");
  const [editSubscriberStatus, setEditSubscriberStatus] = useState<SubscriberStageStatus>("معتمد");
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
  const [newSubscriberStatus, setNewSubscriberStatus] = useState<SubscriberStageStatus>("معتمد");
  const [newDeviceCount, setNewDeviceCount] = useState("1");
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Archive Course Modal State
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSheetName, setArchiveSheetName] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // Helper to normalize status string
  const getNormalizedStatus = (statusStr?: string): SubscriberStageStatus => {
    if (!statusStr) return "معتمد";
    if (statusStr.includes("متقدم") || statusStr === "2") return "متقدم";
    if (statusStr.includes("مراجعة")) return "قيد المراجعة";
    if (statusStr.includes("أرشيف") || statusStr.includes("مؤرشف") || statusStr.includes("مكتمل")) return "مؤرشف";
    return "معتمد";
  };

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

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const active = records.filter(r => getNormalizedStatus(r.subscriberStatus) === "معتمد").length;
    const advanced = records.filter(r => getNormalizedStatus(r.subscriberStatus) === "متقدم").length;
    const pending = records.filter(r => getNormalizedStatus(r.subscriberStatus) === "قيد المراجعة").length;
    const archived = records.filter(r => r.isArchived || getNormalizedStatus(r.subscriberStatus) === "مؤرشف").length;
    const allowed = records.filter(r => r.isAllowed).length;
    const blocked = records.filter(r => !r.isAllowed).length;
    return { total, active, advanced, pending, archived, allowed, blocked };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const currentNormStatus = getNormalizedStatus(rec.subscriberStatus);

      // Hide archived toggle
      if (hideArchived && (rec.isArchived || currentNormStatus === "مؤرشف")) {
        return false;
      }

      // Stage status filter
      if (stageFilter !== "all" && currentNormStatus !== stageFilter) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const matchName = rec.name && rec.name.toLowerCase().includes(q);
      const matchRegId = rec.registrationId && rec.registrationId.toLowerCase().includes(q);
      const matchTopic = rec.topicId && rec.topicId.toLowerCase().includes(q);
      const matchStatus = rec.status && rec.status.toLowerCase().includes(q);
      const matchSubStatus = rec.subscriberStatus && rec.subscriberStatus.toLowerCase().includes(q);

      return matchName || matchRegId || matchTopic || matchStatus || matchSubStatus;
    });
  }, [records, searchQuery, stageFilter, hideArchived]);

  // Grouped records for Stages View
  const groupedRecords = useMemo(() => {
    const groups: Record<SubscriberStageStatus, SettingsSubscriberRecord[]> = {
      "معتمد": [],
      "متقدم": [],
      "قيد المراجعة": [],
      "مؤرشف": []
    };

    filteredRecords.forEach((rec) => {
      const st = getNormalizedStatus(rec.subscriberStatus);
      groups[st].push(rec);
    });

    return groups;
  }, [filteredRecords]);

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
    setEditSubscriberStatus(getNormalizedStatus(rec.subscriberStatus));
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
      const isArchivedVal = editSubscriberStatus === "مؤرشف";

      const res = await updateSettingsSubscriberBridge({
        rowIndex: editingRecord.rowIndex,
        registrationId: editRegId || editingRecord.registrationId,
        name: editName,
        topicId: editTopicId || "1",
        status: editStatus,
        deviceCount: editDeviceCount || "1",
        subscriberStatus: editSubscriberStatus,
        resetRegisteredDevices: editResetDevices
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تم تحديث بيانات المشترك [${editName || editRegId}] وحالته إلى (${STATUS_CONFIGS[editSubscriberStatus].label}) بنجاح!`);
        setTimeout(() => setActionSuccessBanner(null), 5000);

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
                  deviceCount: editDeviceCount || "1",
                  subscriberStatus: editSubscriberStatus,
                  isArchived: isArchivedVal
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

  // Quick Change Subscriber Stage Status
  const handleQuickChangeStage = async (rec: SettingsSubscriberRecord, newStage: SubscriberStageStatus) => {
    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      
      // Calculate Topic ID smartly based on stage if switching between 1 and 2
      let nextTopicId = rec.topicId || "1";
      if (newStage === "متقدم" && nextTopicId === "1") {
        nextTopicId = "2";
      } else if (newStage === "معتمد" && nextTopicId === "2") {
        nextTopicId = "1";
      }

      // Optimistic update
      setRecords((prev) =>
        prev.map((r) =>
          r.rowIndex === rec.rowIndex
            ? { 
                ...r, 
                subscriberStatus: newStage, 
                topicId: nextTopicId,
                isArchived: newStage === "مؤرشف" 
              }
            : r
        )
      );

      const res = await updateSettingsSubscriberBridge({
        rowIndex: rec.rowIndex,
        registrationId: rec.registrationId,
        name: rec.name,
        topicId: nextTopicId,
        status: rec.status,
        deviceCount: rec.deviceCount,
        subscriberStatus: newStage
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تم تغيير حالة [${rec.name || rec.registrationId}] إلى "${STATUS_CONFIGS[newStage].label}" وتلوين الصف في الشيت تلقائياً.`);
        setTimeout(() => setActionSuccessBanner(null), 4000);
        if (onRefreshParent) onRefreshParent();
      } else {
        fetchSubscribers();
      }
    } catch (err) {
      fetchSubscribers();
    }
  };

  // Quick Toggle Allowed/Blocked
  const handleQuickToggleStatus = async (rec: SettingsSubscriberRecord) => {
    const nextStatus = rec.isAllowed ? "ممنوع" : "مسموح";
    const isAllowedVal = nextStatus === "مسموح";

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      
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
        deviceCount: rec.deviceCount,
        subscriberStatus: rec.subscriberStatus
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تم تغيير صلاحية المشترك [${rec.name || rec.registrationId}] إلى "${nextStatus}" بنجاح.`);
        setTimeout(() => setActionSuccessBanner(null), 4000);
        if (onRefreshParent) onRefreshParent();
      } else {
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
        topicId: newTopicId.trim() || (newSubscriberStatus === "متقدم" ? "2" : "1"),
        status: newStatus.trim() || "مسموح",
        deviceCount: newDeviceCount.trim() || "1",
        subscriberStatus: newSubscriberStatus
      }, activeScript);

      if (res.success) {
        setActionSuccessBanner(`تمت إضافة المشترك [${newName || newRegId}] بحالة (${STATUS_CONFIGS[newSubscriberStatus].label}) بنجاح.`);
        setTimeout(() => setActionSuccessBanner(null), 5000);

        setIsAddModalOpen(false);
        setNewName("");
        setNewRegId("");
        setNewTopicId("1");
        setNewStatus("مسموح");
        setNewSubscriberStatus("معتمد");
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

  // Open Course Archiving Modal
  const handleOpenArchiveModal = () => {
    const defaultName = `ارشيف_الدورة_${new Date().getFullYear()}_${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
    setArchiveSheetName(defaultName);
    setArchiveError(null);
    setIsArchiveModalOpen(true);
  };

  // Execute Course Archiving
  const handleConfirmArchiveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsArchiving(true);
    setArchiveError(null);

    try {
      const activeScript = scriptUrl || (typeof window !== "undefined" ? localStorage.getItem("thnoon_script_url") : "") || DEFAULT_SCRIPT_URL;
      const res = await archiveCompletedCourseBridge(archiveSheetName.trim(), activeScript);

      if (res.success) {
        setActionSuccessBanner(
          `تمت أرشفة الدورة بنجاح في ورقة (${res.archiveSheetName || archiveSheetName}) مع فرز وتلوين المشتركين حسب الحالات، وحفظ بياناتهم في النظام!`
        );
        setTimeout(() => setActionSuccessBanner(null), 7000);
        setIsArchiveModalOpen(false);
        fetchSubscribers();
        if (onRefreshParent) onRefreshParent();
      } else {
        setArchiveError(res.message || "فشل تنفيذ أرشفة الدورة في Google Sheets");
      }
    } catch (err: any) {
      setArchiveError("حدث خطأ أثناء أرشفة الدورة: " + err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Info & Stats Dashboard */}
      <div className="bg-gradient-to-l from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  تسجيل المشتركين (ورقة Settings)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  إدارة الحالات والألوان &amp; الأرشفة
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                تصنيف المشتركين بالألوان الأربعة الرسمية، التلوين التلقائي في الشيت، الفرز السريع، وأرشفة الدورات المكتملة دون فقدان البيانات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0 self-end lg:self-center">
            {/* زر أرشفة الدورة */}
            <button
              id="btn-archive-course"
              onClick={handleOpenArchiveModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs"
              title="أرشفة الدورة الحالية ونقل/نسخ المشتركين لورقة جديدة مرتبة بالألوان"
            >
              <FolderArchive className="w-4 h-4 text-amber-300" />
              <span>أرشفة الدورة</span>
            </button>

            {/* زر إضافة مشترك جديد */}
            <button
              id="btn-add-settings-subscriber"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs shadow-emerald-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مشترك</span>
            </button>

            {/* زر التحديث */}
            <button
              id="btn-refresh-settings-subscribers"
              onClick={fetchSubscribers}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-xs"
              title="تحديث البيانات من قوقل شيت"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* Status Category Badges & Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/40">
          {/* 🟢 معتمد */}
          <button 
            type="button"
            onClick={() => setStageFilter(stageFilter === "معتمد" ? "all" : "معتمد")}
            className={`text-right p-3 rounded-xl border transition-all ${
              stageFilter === "معتمد"
                ? "bg-emerald-100/90 dark:bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                : "bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>🟢 معتمد / نشط</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">صفحة 1</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-1">
              {stats.active} <span className="text-xs font-normal text-slate-500">طالب</span>
            </div>
          </button>

          {/* 🔵 متقدم */}
          <button 
            type="button"
            onClick={() => setStageFilter(stageFilter === "متقدم" ? "all" : "متقدم")}
            className={`text-right p-3 rounded-xl border transition-all ${
              stageFilter === "متقدم"
                ? "bg-sky-100/90 dark:bg-sky-950/60 border-sky-400 ring-2 ring-sky-500/20 shadow-xs"
                : "bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>🔵 متقدم</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">صفحة 2</span>
            </div>
            <div className="text-xl font-extrabold text-sky-800 dark:text-sky-200 mt-1">
              {stats.advanced} <span className="text-xs font-normal text-slate-500">طالب</span>
            </div>
          </button>

          {/* 🟡 قيد المراجعة */}
          <button 
            type="button"
            onClick={() => setStageFilter(stageFilter === "قيد المراجعة" ? "all" : "قيد المراجعة")}
            className={`text-right p-3 rounded-xl border transition-all ${
              stageFilter === "قيد المراجعة"
                ? "bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 ring-2 ring-amber-500/20 shadow-xs"
                : "bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>🟡 قيد المراجعة</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">جديد</span>
            </div>
            <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200 mt-1">
              {stats.pending} <span className="text-xs font-normal text-slate-500">طالب</span>
            </div>
          </button>

          {/* ⚪ أرشيف */}
          <button 
            type="button"
            onClick={() => setStageFilter(stageFilter === "مؤرشف" ? "all" : "مؤرشف")}
            className={`text-right p-3 rounded-xl border transition-all ${
              stageFilter === "مؤرشف"
                ? "bg-slate-200 dark:bg-slate-700 border-slate-400 ring-2 ring-slate-500/20 shadow-xs"
                : "bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>⚪ مؤرشف / مكتمل</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">أرشيف</span>
            </div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
              {stats.archived} <span className="text-xs font-normal text-slate-500">طالب</span>
            </div>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessBanner && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-medium animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{actionSuccessBanner}</span>
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

      {/* Controls Bar: View Mode Switcher + Search + Soft Archive Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Switch View Tabs: 📋 جدول المشتركين vs 🎨 العرض والفرز السريع */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start">
          <button
            id="tab-view-table"
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>جدول المشتركين ({records.length})</span>
          </button>

          <button
            id="tab-view-stages"
            type="button"
            onClick={() => setViewMode("stages")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              viewMode === "stages"
                ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>العرض والفرز السريع بالألوان</span>
          </button>
        </div>

        {/* Search input & Hide Archived Toggle */}
        <div className="flex items-center gap-2 flex-1 max-w-xl justify-end">
          {/* Hide Archived Toggle */}
          <button
            type="button"
            onClick={() => setHideArchived(!hideArchived)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              hideArchived
                ? "bg-slate-800 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
            title="إخفاء بيانات الطلاب المؤرشفين لتقليل الزحام دون حذفهم من الشيت"
          >
            {hideArchived ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span>{hideArchived ? "المؤرشفون مخفيون" : "إخفاء المؤرشفين"}</span>
          </button>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-settings-subscribers"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، رقم القيد، الحالة..."
              className="w-full pl-8 pr-9 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: FULL DATA TABLE VIEW (جدول المشتركين) */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse" id="table-settings-subscribers">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">اسم المشترك</th>
                  <th className="py-3 px-3 min-w-[140px]">رقم القيد (AA)</th>
                  <th className="py-3 px-3 min-w-[150px]">حالة المشترك (C)</th>
                  <th className="py-3 px-3 w-24 text-center">الصفحة (A)</th>
                  <th className="py-3 px-3 w-28 text-center">الدخول (AB)</th>
                  <th className="py-3 px-3 w-20 text-center">الأجهزة</th>
                  <th className="py-3 px-4 w-32 text-center">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="text-sm font-medium">جاري قراءة المشتركين من ورقة Settings...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                          {searchQuery || stageFilter !== "all" ? "لا توجد نتائج تطابق خيارات البحث أو التصفية" : "لا يوجد مشتركون مسجلون في ورقة Settings حالياً"}
                        </span>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {hideArchived && stats.archived > 0 ? "قد يكون بعض الطلاب مخفيين تحت خيار 'المؤرشفون مخفيون'. قم بإلغاء التفعيل لعرضهم." : "يمكنك إضافة مشترك جديد بالضغط على زر إضافة مشترك"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const normStatus = getNormalizedStatus(rec.subscriberStatus);
                    const statusMeta = STATUS_CONFIGS[normStatus];
                    const isAllowed = rec.isAllowed;
                    const rowId = `sub-row-${rec.rowIndex}`;

                    return (
                      <tr 
                        key={rowId}
                        className={`transition-colors group ${statusMeta.rowBg} ${statusMeta.borderRight}`}
                      >
                        {/* Row Index */}
                        <td className="py-3 px-3 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                          {rec.rowIndex}
                        </td>

                        {/* 1. اسم المشترك */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                              normStatus === "معتمد" 
                                ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                : normStatus === "متقدم"
                                ? "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                                : normStatus === "قيد المراجعة"
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                                : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            }`}>
                              {rec.name ? rec.name.trim().charAt(0) : "ط"}
                            </div>

                            <div className="min-w-0">
                              <span 
                                className="font-semibold text-sm truncate block max-w-[200px] text-slate-900 dark:text-white"
                                title={rec.name}
                              >
                                {rec.name || <span className="text-slate-400 italic">بدون اسم</span>}
                              </span>
                              {rec.archiveTag && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {rec.archiveTag}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. رقم التسجيل */}
                        <td className="py-3 px-3 font-mono text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                              {rec.registrationId || "—"}
                            </span>
                            {rec.registrationId && (
                              <button
                                onClick={() => handleCopy(rec.registrationId, `reg-${rec.rowIndex}`)}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                                title="نسخ رقم القيد"
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

                        {/* 3. حالة المشترك والألوان (العامود C) مع قائمة سريعة لتغيير الحالة */}
                        <td className="py-3 px-3">
                          <div className="relative inline-block">
                            <select
                              value={normStatus}
                              onChange={(e) => handleQuickChangeStage(rec, e.target.value as SubscriberStageStatus)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer appearance-none pl-6 pr-2 ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder} focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                              title="اضغط للتغيير السريع لحالة الطالب في قوقل شيت"
                            >
                              <option value="معتمد">🟢 معتمد / نشط</option>
                              <option value="متقدم">🔵 متقدم</option>
                              <option value="قيد المراجعة">🟡 قيد المراجعة</option>
                              <option value="مؤرشف">⚪ مؤرشف</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                        </td>

                        {/* 4. رقم الصفحة الخاصة (العامود A) */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            rec.topicId === "2"
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 border border-sky-300"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200"
                          }`}>
                            صفحة {rec.topicId || "1"}
                          </span>
                        </td>

                        {/* 5. حالة الدخول المسموح/الممنوع (العامود AB) */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleQuickToggleStatus(rec)}
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold border transition-colors cursor-pointer ${
                              isAllowed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100"
                            }`}
                            title={isAllowed ? "مسموح بالدخول (اضغط للتعطيل)" : "محظور من الدخول (اضغط للسماح)"}
                          >
                            {isAllowed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>مسموح</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>ممنوع</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* 6. عدد الأجهزة */}
                        <td className="py-3 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
                          {rec.deviceCount || "1"}
                        </td>

                        {/* 7. الإجراءات (تعديل + حذف) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-edit-subscriber-${rec.rowIndex}`}
                              onClick={() => handleOpenEdit(rec)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                              title="تعديل بيانات المشترك كاملة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              id={`btn-delete-subscriber-${rec.rowIndex}`}
                              onClick={() => handleOpenDelete(rec)}
                              className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                              title="حذف المشترك نهائياً من ورقة Settings"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Footer Bar */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>الألوان والحالات تنعكس فوراً وتلون الصفوف مباشرة في Google Sheets.</span>
            </span>
            <span>المعروض: {filteredRecords.length} من أصل {records.length} مشترك</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FAST STAGES & COLOR GROUPED VIEW (تبويب العرض والفرز السريع بالألوان) */}
      {/* ========================================================================= */}
      {viewMode === "stages" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. قائمة المعتمدين / النشطين 🟢 */}
            <div className="bg-white dark:bg-slate-800/95 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    الطلاب المعتمدون / النشطون (🟢)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    {groupedRecords["معتمد"].length}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">صفحة 1 الافتراضية</span>
              </div>

              <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {groupedRecords["معتمد"].length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لا يوجد طلاب معتمدون حالياً</p>
                ) : (
                  groupedRecords["معتمد"].map((rec) => (
                    <div 
                      key={`stage-acc-${rec.rowIndex}`}
                      className="flex items-center justify-between p-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl transition-all"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">{rec.name || "بدون اسم"}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">القيد: {rec.registrationId || "—"}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickChangeStage(rec, "متقدم")}
                          className="px-2 py-1 text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 hover:bg-sky-200 rounded-lg transition-colors"
                          title="ترقية الطالب إلى مرحلة متقدمة (صفحة 2)"
                        >
                          نقل لمتقدم 🔵
                        </button>
                        <button
                          onClick={() => handleQuickChangeStage(rec, "مؤرشف")}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                          title="أرشفة الطالب"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. قائمة المتقدمين 🔵 */}
            <div className="bg-white dark:bg-slate-800/95 border-2 border-sky-300 dark:border-sky-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-sky-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50"></span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    الطلاب المتقدمون (🔵)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                    {groupedRecords["متقدم"].length}
                  </span>
                </div>
                <span className="text-[11px] text-sky-700 dark:text-sky-300 font-mono">صفحة 2 المتقدمة</span>
              </div>

              <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {groupedRecords["متقدم"].length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لا يوجد طلاب متقدمون في المرحلة الثانية</p>
                ) : (
                  groupedRecords["متقدم"].map((rec) => (
                    <div 
                      key={`stage-adv-${rec.rowIndex}`}
                      className="flex items-center justify-between p-2.5 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 rounded-xl transition-all"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">{rec.name || "بدون اسم"}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">القيد: {rec.registrationId || "—"}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickChangeStage(rec, "معتمد")}
                          className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 hover:bg-emerald-200 rounded-lg transition-colors"
                          title="إعادة للمرحلة الأولى (صفحة 1)"
                        >
                          إعادة لمعتمد 🟢
                        </button>
                        <button
                          onClick={() => handleQuickChangeStage(rec, "مؤرشف")}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                          title="أرشفة الطالب بعد إتمام المرحلة المتقدمة"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. قائمة قيد المراجعة 🟡 */}
            <div className="bg-white dark:bg-slate-800/95 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-amber-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    طلبات بانتظار التأكيد والمراجعة (🟡)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    {groupedRecords["قيد المراجعة"].length}
                  </span>
                </div>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">تسجيلات جديدة</span>
              </div>

              <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {groupedRecords["قيد المراجعة"].length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لا توجد طلبات معلقة بانتظار المراجعة</p>
                ) : (
                  groupedRecords["قيد المراجعة"].map((rec) => (
                    <div 
                      key={`stage-pen-${rec.rowIndex}`}
                      className="flex items-center justify-between p-2.5 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 rounded-xl transition-all"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">{rec.name || "بدون اسم"}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">القيد: {rec.registrationId || "—"}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickChangeStage(rec, "معتمد")}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
                          title="اعتماد الطالب وتأكيد اشتراكه وبدء الدراسة"
                        >
                          اعتماد الطالب 🟢
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 4. قائمة الأرشيف والمكتملين ⚪ */}
            <div className="bg-white dark:bg-slate-800/95 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    الأرشيف والطلاب المكتملون (⚪)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {groupedRecords["مؤرشف"].length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">بيانات محفوظة بأمان</span>
              </div>

              <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {groupedRecords["مؤرشف"].length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لا يوجد طلاب مؤرشفون حالياً</p>
                ) : (
                  groupedRecords["مؤرشف"].map((rec) => (
                    <div 
                      key={`stage-arc-${rec.rowIndex}`}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">{rec.name || "بدون اسم"}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">القيد: {rec.registrationId || "—"}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickChangeStage(rec, "معتمد")}
                          className="px-2 py-1 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                          title="إلغاء الأرشفة وإعادة التفعيل"
                        >
                          استعادة للنشط ↩️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    تحديث الحالات والألوان والصلاحيات مباشرة في الشيت
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

              {/* 1. اسم المشترك */}
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

              {/* 2. رقم التسجيل */}
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

              {/* 3. حالة المشترك والألوان (العامود C الجديد) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  3- حالة المشترك والتلوين <span className="font-mono text-emerald-600 font-normal">(العامود C)</span>
                </label>
                <select
                  id="select-edit-subscriber-status"
                  value={editSubscriberStatus}
                  onChange={(e) => {
                    const nextSt = e.target.value as SubscriberStageStatus;
                    setEditSubscriberStatus(nextSt);
                    if (nextSt === "متقدم" && editTopicId === "1") {
                      setEditTopicId("2");
                    } else if (nextSt === "معتمد" && editTopicId === "2") {
                      setEditTopicId("1");
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="معتمد">🟢 معتمد / نشط (طالب مؤكد بالصفحة 1)</option>
                  <option value="متقدم">🔵 متقدم (منقول للمرحلة 2 أو صفحة متقدمة)</option>
                  <option value="قيد المراجعة">🟡 قيد المراجعة (تسجيل جديد بانتظار التأكيد)</option>
                  <option value="مؤرشف">⚪ مؤرشف / مكتمل (أنهى الدورة أو مؤرشف)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">يحدد لون الصف التلقائي في Google Sheets وتصنيف الطالب في النظام.</p>
              </div>

              {/* 4. رقم الصفحة الخاصة (العامود A) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  4- رقم الصفحة الخاصة <span className="font-mono text-emerald-600 font-normal">(العامود A)</span>
                </label>
                <input
                  id="input-edit-topicid"
                  type="text"
                  value={editTopicId}
                  onChange={(e) => setEditTopicId(e.target.value)}
                  placeholder="1 أو 2"
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 5. مسموح / ممنوع للدخول (العامود AB) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    5- حالة الدخول <span className="font-mono text-emerald-600 font-normal">(العامود AB)</span>
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

                {/* 6. عدد الأجهزة (العامود AC) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    6- عدد الأجهزة <span className="font-mono text-emerald-600 font-normal">(العامود AC)</span>
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

              {/* خيار مسح بصمات الأجهزة المسجلة */}
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
                ⚠️ إذا كنت تريد فقط إخفاء بياناته أو إنهائه للدورة، يُفضل تغيير حالته إلى <span className="font-bold">"مؤرشف ⚪"</span> بدلاً من الحذف لتجنب تكرار تسجيله.
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
                    إنشاء حساب مباشر وتحديد حالته ولونه في جدول البيانات
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

              {/* 3. حالة المشترك */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  3- حالة المشترك والتلوين <span className="font-mono text-emerald-600 font-normal">(العامود C)</span>
                </label>
                <select
                  id="select-new-subscriber-status"
                  value={newSubscriberStatus}
                  onChange={(e) => {
                    const st = e.target.value as SubscriberStageStatus;
                    setNewSubscriberStatus(st);
                    if (st === "متقدم") setNewTopicId("2");
                    else if (st === "معتمد") setNewTopicId("1");
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="معتمد">🟢 معتمد / نشط (صفحة 1)</option>
                  <option value="متقدم">🔵 متقدم (صفحة 2)</option>
                  <option value="قيد المراجعة">🟡 قيد المراجعة (تسجيل جديد)</option>
                  <option value="مؤرشف">⚪ مؤرشف / مكتمل</option>
                </select>
              </div>

              {/* 4. رقم الصفحة الخاصة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  4- رقم الصفحة الخاصة <span className="font-mono text-emerald-600 font-normal">(العامود A)</span>
                </label>
                <input
                  id="input-new-topicid"
                  type="text"
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value)}
                  placeholder="1 أو 2"
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 5. حالة الدخول */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    5- حالة الدخول <span className="font-mono text-emerald-600 font-normal">(العامود AB)</span>
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

                {/* 6. عدد الأجهزة */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    6- عدد الأجهزة <span className="font-mono text-emerald-600 font-normal">(العامود AC)</span>
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

      {/* ------------------------------------------------------------- */}
      {/* ARCHIVE COURSE MODAL (أرشفة الدورة كاملة دون حذف) */}
      {/* ------------------------------------------------------------- */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base">
                    أرشفة الدورة وترتيب المشتركين بالألوان
                  </h4>
                  <p className="text-xs text-slate-300">
                    إنشاء ورقة أرشيف جديدة مصنفة دون حذف البيانات الأصلية
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmArchiveCourse} className="p-5 space-y-4">
              {archiveError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{archiveError}</span>
                </div>
              )}

              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ماذا يحدث أثناء أرشفة الدورة؟</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pr-1 text-slate-600 dark:text-slate-300">
                  <li>يتم إنشاء ورقة أرشيف جديدة في Google Sheets باسم الدورة.</li>
                  <li>يتم فرز المشتركين حسب الألوان: المعتمدون أولاً 🟢 ثم المتقدمون 🔵 ثم المراجعون 🟡.</li>
                  <li>يتم تمييز سجلاتهم بوسام الأرشيف بحيث لا تتكرر أرشفتهم.</li>
                  <li>تبقى أرقام قيدهم مسجلة لمنع تكرار إعادة التسجيل من نفس المشترك!</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم ورقة الأرشيف الجديدة في Google Sheets
                </label>
                <input
                  id="input-archive-sheet-name"
                  type="text"
                  value={archiveSheetName}
                  onChange={(e) => setArchiveSheetName(e.target.value)}
                  placeholder="مثال: ارشيف_الدورة_2026_09"
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  id="btn-confirm-archive-course-submit"
                  type="submit"
                  disabled={isArchiving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isArchiving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>جاري الأرشفة والترتيب بالألوان...</span>
                    </>
                  ) : (
                    <span>تنفيذ الأرشفة الآن</span>
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
