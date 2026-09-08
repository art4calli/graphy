import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MediaItem {
  url: string;
  pairUrl?: string;
}

interface CardMediaSliderProps {
  media: MediaItem[];
  title: string;
  description?: string;
  aspectRatioClassName?: string; // e.g. "aspect-video" or "aspect-square"
}

export default function CardMediaSlider({
  media,
  title,
  description = "",
  aspectRatioClassName = "aspect-video"
}: CardMediaSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const mediaList = media || [];
  const hasMultipleMedia = mediaList.length > 1;

  const isVideo = (url: string): boolean => {
    if (!url) return false;
    const s = url.toLowerCase();
    return (
      s.endsWith(".mp4") ||
      s.endsWith(".webm") ||
      s.endsWith(".ogg") ||
      s.includes("youtube.com") ||
      s.includes("youtu.be")
    );
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
      let videoId = null;
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v");
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
      } else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("youtube.com/embed/")[1]?.split("?")[0];
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
      return null;
    }
  };

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mediaList.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mediaList.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  // Swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (mediaList.length === 0) {
    return null;
  }

  const currentMedia = mediaList[activeIndex];

  return (
    <div className="w-full relative">
      {/* Slide media panel */}
      <div
        className={`overflow-hidden rounded-2xl relative ${aspectRatioClassName} bg-slate-950 group border border-slate-900 shadow-inner`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Display Media */}
        <div className="w-full h-full flex items-center justify-center">
          {isVideo(currentMedia.url) ? (
            getYouTubeEmbedUrl(currentMedia.url) ? (
              <iframe
                src={getYouTubeEmbedUrl(currentMedia.url) || ""}
                className="w-full h-full rounded-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              ></iframe>
            ) : (
              <video
                src={currentMedia.url}
                controls
                className="w-full h-full object-contain rounded-2xl"
              />
            )
          ) : (
            <div
              className="w-full h-full relative cursor-pointer overflow-hidden"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img
                src={currentMedia.url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=600";
                }}
              />
              {/* Hover feedback overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                <Maximize2 className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="font-sans text-xs text-amber-400 font-semibold bg-slate-950/80 px-2.5 py-1 rounded-full border border-amber-400/20">
                  توسيع العرض
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Carousel controls if multi media */}
        {hasMultipleMedia && (
          <>
            {/* Arrow Left */}
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/80 border border-slate-800 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md z-10 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Arrow Right */}
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/80 border border-slate-800 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md z-10 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-slate-950/60 px-2 py-1 rounded-full border border-slate-900">
              {mediaList.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    activeIndex === i ? "bg-amber-500 w-3" : "bg-slate-600 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>

            {/* Floating Index Counter label */}
            <span className="absolute top-3 left-3 bg-slate-950/80 text-amber-400 text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-500/25">
              {activeIndex + 1} / {mediaList.length}
            </span>
          </>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX */}
      <AnimatePresence>
        {isLightboxOpen && !isVideo(currentMedia.url) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-lg flex flex-col justify-between p-4 select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Header toolbar */}
            <div
              className="flex justify-between items-center max-w-7xl w-full mx-auto py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 flex items-center justify-center border border-slate-800 hover:border-transparent transition-all cursor-pointer shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-right">
                <h5 className="font-serif font-bold text-base sm:text-lg text-slate-100">{title}</h5>
                {hasMultipleMedia && (
                  <p className="text-[10px] sm:text-xs font-mono text-amber-500 mt-0.5">
                    الوسائط {activeIndex + 1} من {mediaList.length}
                  </p>
                )}
              </div>
            </div>

            {/* Display stage */}
            <div className="flex-grow flex items-center justify-center relative max-w-7xl w-full mx-auto px-4">
              {hasMultipleMedia && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  className="absolute left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 border border-slate-800 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all shadow-xl z-20 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              <motion.img
                key={activeIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
                src={currentMedia.url}
                alt={title}
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-900/60"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />

              {hasMultipleMedia && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  className="absolute right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 border border-slate-800 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all shadow-xl z-20 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Thumbnail pagination under image */}
            {hasMultipleMedia && (
              <div
                className="max-w-md mx-auto py-2 flex flex-wrap gap-2 justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {mediaList.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative overflow-hidden rounded-lg w-10 h-10 sm:w-12 sm:h-12 border-2 transition-all cursor-pointer ${
                      activeIndex === idx
                        ? "border-amber-500 scale-110 shadow-lg"
                        : "border-slate-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {isVideo(m.url) ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Play className="w-4 h-4 text-amber-400" />
                      </div>
                    ) : (
                      <img
                        src={m.url}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
