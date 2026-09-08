import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Film, X, Calendar, Share2, Eye } from "lucide-react";
import { SheetRow, SectionHeaderData } from "../types";
import CardMediaSlider from "./CardMediaSlider";
import { useLanguage } from "../context/LanguageContext";

interface VideoSectionProps {
  cards: SheetRow[];
  header?: SectionHeaderData;
}

export default function VideoSection({ cards, header }: VideoSectionProps) {
  const { t } = useLanguage();
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const sectionBadge = t("video_badge", header?.badge || "البعد البصري والتعليمي");
  const sectionTitle = t("video_title", header?.title || "المكتبة المرئية والمحاضرات");
  const sectionDesc = t("video_desc", header?.description || "وثائقيات نادرة، محاضرات علمية للأستاذ يوسف ذنون، ودروس تطبيقية مسجلة تبسط قواعد الحرف وأسرار التركيب لطلاب ومحبي الخط العربي.");

  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const getYoutubeThumbnail = (url: string) => {
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&q=80&w=600";
  };

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold font-sans tracking-widest text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full uppercase">
          {sectionBadge}
        </span>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mt-4 leading-normal">
          {sectionTitle}
        </h2>
        <p className="text-slate-400 font-sans mt-4 text-sm leading-relaxed">
          {sectionDesc}
        </p>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((video, idx) => {
          // Determine the video URL and the preview thumbnail image
          let videoUrl = "";
          let previewImg = "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&q=80&w=600";

          if (video.media && video.media.length > 0) {
            const firstMedia = video.media[0];
            // If the first item is an image, and it has a paired video url
            if (firstMedia.pairUrl) {
              videoUrl = firstMedia.pairUrl;
              previewImg = firstMedia.url;
            } else if (firstMedia.url.includes("youtube.com") || firstMedia.url.includes("youtu.be")) {
              videoUrl = firstMedia.url;
              previewImg = getYoutubeThumbnail(firstMedia.url);
            } else {
              previewImg = firstMedia.url;
            }
          }

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-slate-950/40 border border-slate-900 rounded-3xl overflow-hidden hover:border-amber-500/20 shadow-lg flex flex-col justify-between group"
            >
              <div>
                {/* Video Preview Container */}
                {video.media && video.media.length > 0 ? (
                  <div className="relative">
                    <CardMediaSlider media={video.media} title={video.title} description={video.description} />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-slate-900/40 flex items-center justify-center border-b border-slate-900">
                    <Film className="w-10 h-10 text-slate-700" />
                  </div>
                )}

                {/* Video Info Content */}
                <div className="p-6 text-right space-y-3">
                  <h3 className="font-serif font-bold text-lg text-slate-100 group-hover:text-amber-400 transition-colors leading-relaxed">
                    {t(video.title, video.title)}
                  </h3>
                  <p className="text-slate-400 font-sans text-xs sm:text-sm leading-relaxed line-clamp-3 whitespace-pre-line">
                    {t(video.description, video.description)}
                  </p>
                </div>
              </div>

               {video.linkUrl && (
                <div className="p-6 pt-0 mt-auto">
                  <a
                    href={video.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-sans font-bold py-3 px-4 rounded-xl border border-amber-500/20 hover:border-transparent transition-all duration-300"
                  >
                    <span>{t(video.buttonText || header?.buttonText || "فتح رابط الدرس المرفق", video.buttonText || header?.buttonText || "فتح رابط الدرس المرفق")}</span>
                  </a>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* OVERLAY CUSTOM PLAYER MODAL */}
      <AnimatePresence>
        {selectedVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedVideoUrl(null)}
              className="absolute top-6 right-6 p-2.5 bg-slate-900/60 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800"
            >
              <iframe
                src={selectedVideoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
