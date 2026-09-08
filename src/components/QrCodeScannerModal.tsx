import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  X,
  RefreshCw,
  Upload,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  ZapOff
} from "lucide-react";
import jsQR from "jsqr";

export interface QrScanResult {
  raw: string;
  registrationId?: string;
  username?: string;
  password?: string;
}

interface QrCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: QrScanResult) => void;
  title?: string;
  subtitle?: string;
}

export default function QrCodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = "مسح رمز الاستجابة السريعة (QR Code)",
  subtitle = "وجّه كاميرا جهازك نحو رمز QR الخاص بك في الاستمارة أو بطاقة الاشتراك لتسجيل الدخول الفوري"
}: QrCodeScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFacingBack, setIsFacingBack] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [scannedData, setScannedData] = useState<QrScanResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play a brief pleasant success beep
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (e) {}
  };

  // Smart Parser for extracted QR text
  const parseQrText = (text: string): QrScanResult => {
    const raw = text.trim();
    let registrationId = "";
    let username = "";
    let password = "";

    // 1. Check for JSON format
    try {
      if (raw.startsWith("{") && raw.endsWith("}")) {
        const parsed = JSON.parse(raw);
        if (parsed.registrationId || parsed.regId || parsed.id) {
          registrationId = (parsed.registrationId || parsed.regId || parsed.id).toString().trim();
        }
        if (parsed.username || parsed.user || parsed.name) {
          username = (parsed.username || parsed.user || parsed.name).toString().trim();
        }
        if (parsed.password || parsed.pass) {
          password = (parsed.password || parsed.pass).toString().trim();
        }
        if (registrationId && !password) password = registrationId;
        return { raw, registrationId, username: username || registrationId, password: password || registrationId };
      }
    } catch (e) {}

    // 2. Check for URL with query params
    if (raw.includes("?") || raw.startsWith("http")) {
      try {
        const url = new URL(raw);
        const regParam = url.searchParams.get("regId") || url.searchParams.get("id") || url.searchParams.get("code");
        const userParam = url.searchParams.get("user") || url.searchParams.get("name");
        const passParam = url.searchParams.get("pass") || url.searchParams.get("password");
        if (regParam) registrationId = regParam.trim();
        if (userParam) username = userParam.trim();
        if (passParam) password = passParam.trim();
        if (registrationId) {
          return {
            raw,
            registrationId,
            username: username || registrationId,
            password: password || registrationId
          };
        }
      } catch (e) {}
    }

    // 3. Multi-line or formatted delimiter patterns
    // e.g. "رقم التسجيل: REG-2026-1234\nالاسم: أحمد الخطاط"
    // e.g. "REG-2026-1234 - أحمد الخطاط"
    // e.g. "REG-2026-1234"
    const lines = raw.split(/[\n\r]+/);
    for (const line of lines) {
      const cleanLine = line.trim();
      // Match REG ID
      const regMatch = cleanLine.match(/(?:رقم التسجيل|كود المشترك|ID|Code|REG)\s*[:=\-]\s*([A-Za-z0-9\-_]+)/i);
      if (regMatch && regMatch[1]) {
        registrationId = regMatch[1].trim();
      }
      // Match Name
      const nameMatch = cleanLine.match(/(?:الاسم|اسم المشترك|المشترك|Name)\s*[:=\-]\s*(.+)/i);
      if (nameMatch && nameMatch[1]) {
        username = nameMatch[1].trim();
      }
    }

    // Delimited with " - " or " | "
    if (!registrationId && raw.includes(" - ")) {
      const parts = raw.split(" - ").map((p) => p.trim());
      for (const p of parts) {
        if (/^REG[-_0-9A-Za-z]+$/i.test(p) || /^\d{3,10}$/.test(p)) {
          registrationId = p;
        } else if (!username && p.length > 1) {
          username = p;
        }
      }
    }

    // Direct REG string
    if (!registrationId) {
      const directReg = raw.match(/REG[-_A-Za-z0-9]+/i);
      if (directReg) {
        registrationId = directReg[0].trim();
      }
    }

    if (!registrationId && !username) {
      // If it's a simple number or text code, use raw
      if (/^[A-Za-z0-9\-_]{3,25}$/.test(raw)) {
        registrationId = raw;
        username = raw;
        password = raw;
      } else {
        username = raw;
        password = raw;
      }
    } else {
      if (registrationId && !username) username = registrationId;
      if (registrationId && !password) password = registrationId;
    }

    return {
      raw,
      registrationId: registrationId || undefined,
      username: username || registrationId || raw,
      password: password || registrationId || raw
    };
  };

  const handleScanHit = (codeText: string) => {
    if (!codeText || scannedData) return;
    const parsed = parseQrText(codeText);
    setScannedData(parsed);
    playBeep();

    // Stop camera
    stopCamera();

    setTimeout(() => {
      onScanSuccess(parsed);
      onClose();
    }, 600);
  };

  const startCamera = async (facingBack = isFacingBack) => {
    stopCamera();
    setErrorMessage("");
    setHasPermission(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("كاميرا المتصفح غير مدعومة على هذا الجهاز أو المتصفح.");
        setHasPermission(false);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingBack ? { ideal: "environment" } : { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      // Check for torch/flashlight capability
      try {
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        if (caps && caps.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        setHasTorch(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        requestScanFrame();
      }
    } catch (err: any) {
      console.warn("Camera start error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("تم رفض إذن الوصول للكاميرا. يرجى السماح بالوصول للكاميرا من إعدادات المتصفح.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("لم يتم العثور على كاميرا متصلة بالجهاز.");
      } else {
        setErrorMessage("تعذر فتح الكاميرا (" + (err.message || "خطأ غير معروف") + "). يمكنك رفع صورة الرمز بدلاً من ذلك.");
      }
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const newStatus = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newStatus }]
      });
      setTorchOn(newStatus);
    } catch (e) {
      console.warn("Torch toggle failed:", e);
    }
  };

  const switchCamera = () => {
    const nextFacing = !isFacingBack;
    setIsFacingBack(nextFacing);
    setTorchOn(false);
    startCamera(nextFacing);
  };

  const requestScanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        });

        if (code && code.data && code.data.trim()) {
          handleScanHit(code.data);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(requestScanFrame);
  };

  // Image File Scanner (Pick from gallery or screenshot)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          setIsProcessingFile(false);

          if (code && code.data) {
            handleScanHit(code.data);
          } else {
            setErrorMessage("لم يتم التعرف على رمز QR صالح في هذه الصورة. يرجى تجربة صورة أوضح أو توجيه الكاميرا مباشرة.");
          }
        } else {
          setIsProcessingFile(false);
          setErrorMessage("تعذر معالجة الصورة في المتصفح.");
        }
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setErrorMessage("تعذر تحميل ملف الصورة.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (isOpen) {
      setScannedData(null);
      setErrorMessage("");
      setTorchOn(false);
      startCamera(isFacingBack);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 text-right overflow-hidden flex flex-col items-center"
      >
        {/* Top Gold Accent */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-slate-800/80 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors z-20 cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mt-1 mb-4 w-full">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mb-2 border border-amber-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-amber-400">{title}</h3>
          <p className="text-slate-400 font-sans text-xs mt-1 max-w-sm mx-auto leading-relaxed">{subtitle}</p>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="relative w-full aspect-square max-w-[320px] bg-slate-950 rounded-2xl border-2 border-amber-500/30 overflow-hidden shadow-inner flex items-center justify-center my-2">
          {/* Video stream element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Hidden Canvas used for frame processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Overlay Box with Laser Animation */}
          {hasPermission && !scannedData && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="relative w-full h-full border-2 border-amber-400/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(217,119,6,0.25)]">
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-amber-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-amber-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-amber-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-amber-400 rounded-br" />

                {/* Animated Laser Line */}
                <motion.div
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                  className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b]"
                />
              </div>
            </div>
          )}

          {/* Scanned Success Feedback */}
          {scannedData && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-2 z-20 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-emerald-400 font-bold text-base">تم التعرف على رمز QR بنجاح!</h4>
              {scannedData.registrationId && (
                <div className="bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-300 font-mono text-xs">
                  {scannedData.registrationId}
                </div>
              )}
              {scannedData.username && (
                <p className="text-slate-300 text-xs font-sans">المشترك: {scannedData.username}</p>
              )}
            </div>
          )}

          {/* Loading or Error State */}
          {hasPermission === null && !errorMessage && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-slate-400 text-xs">جاري تشغيل الكاميرا...</p>
            </div>
          )}

          {errorMessage && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-2 z-10">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="text-amber-300 text-xs leading-relaxed max-w-xs">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startCamera(isFacingBack)}
                className="mt-2 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="w-full flex items-center justify-center gap-3 mt-3">
          {/* Flip Camera Button */}
          <button
            type="button"
            onClick={switchCamera}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="تبديل الكاميرا (أمامية / خلفية)"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>تبديل الكاميرا</span>
          </button>

          {/* Flashlight / Torch Toggle */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`py-2.5 px-3 rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold ${
                torchOn
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title="تشغيل / إطفاء الفلاش"
            >
              {torchOn ? <Zap className="w-4 h-4 text-slate-950" /> : <ZapOff className="w-4 h-4 text-slate-400" />}
              <span>{torchOn ? "الفلاش يعمل" : "الفلاش"}</span>
            </button>
          )}

          {/* File Picker Scan */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="flex-1 py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="اختيار صورة رمز QR من الجهاز"
          >
            {isProcessingFile ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Upload className="w-4 h-4 text-amber-400" />
            )}
            <span>اختر صورة QR</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center w-full">
          <p className="text-slate-500 text-[11px] font-sans">
            رمز QR يتم إنشاؤه تلقائياً وإرساله في إيميل القبول وتأكيد التسجيل أو في بطاقة الطالب.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
