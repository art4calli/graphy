import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ZoomIn, X, Film, Info, SlidersHorizontal, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { SheetRow, SectionHeaderData } from "../types";
import CardMediaSlider from "./CardMediaSlider";
import { useLanguage } from "../context/LanguageContext";

interface GallerySectionProps {
  cards: SheetRow[];
  header?: SectionHeaderData;
}

export default function GallerySection({ cards, header }: GallerySectionProps) {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; desc: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const sectionBadge = t("gallery_badge", header?.badge || "مخطوطات ولوحات فنية");
  const sectionTitle = t("gallery_title", header?.title || "معرض روائع الخط العربي");
  const sectionDesc = t("gallery_desc", header?.description || "مجموعة متميزة من اللوحات الفنية الإبداعية التي صاغها الأستاذ يوسف ذنون ومجموعة من تلامذته الأكاديميين بمختلف أنواع الخطوط التقليدية الرائعة.");

  // Extract all unique non-empty card.type values for dynamic categories
  const uniqueTypes = Array.from(new Set(cards.map(c => c.type).filter(Boolean)));
  const categories = ["all", ...uniqueTypes];

  const getCategoryLabel = (cat: string) => {
    if (cat === "all") return "الكل";
    if (cat === "بطاقة") return "لوحات متميزة (بطاقات)";
    if (cat === "معرض صور") return "معارض الصور الجماعية";
    return cat;
  };

  const filteredCards = cards.filter(card => {
    if (filterType === "all") return true;
    return card.type === filterType;
  });

  const handleOpenLightbox = (url: string, title: string, desc: string) => {
    setSelectedImage({ url, title, desc });
  };

  const handleOpenVideo = (url: string) => {
    // Standardize YouTube URLs for embed
    let embedUrl = url;
    if (url.includes("youtube.com/watch?v=")) {
      embedUrl = url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    }
    setSelectedVideo(embedUrl);
  };

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="text-right">
          <span className="text-xs font-bold font-sans tracking-widest text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full uppercase">
            {sectionBadge}
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mt-4 leading-normal">
            {sectionTitle}
          </h2>
          <p className="text-slate-400 font-sans mt-2 text-sm leading-relaxed max-w-2xl">
            {sectionDesc}
          </p>
        </div>

        {/* Categories/Filters */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-medium transition-all shrink-0 whitespace-nowrap ${
                filterType === cat ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid display of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCards.map((card, cardIdx) => (
          <motion.div
            key={cardIdx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: cardIdx * 0.05 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-slate-950/40 border border-slate-900 hover:border-amber-500/20 shadow-xl transition-all duration-300"
          >
            <div>
              {/* Media Display Panel */}
              {card.media && card.media.length > 0 ? (
                <div className="relative">
                  <CardMediaSlider media={card.media} title={card.title} description={card.description} />
                  <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-amber-500 text-[10px] font-sans font-semibold py-1 px-2.5 rounded-full border border-amber-500/20 z-10">
                    {card.type}
                  </span>
                </div>
              ) : (
                <div className="aspect-video w-full bg-slate-900/40 flex items-center justify-center border-b border-slate-900">
                  <ImageIcon className="w-10 h-10 text-slate-700" />
                </div>
              )}

              {/* Text Description */}
              <div className="p-6 text-right">
                <h3 className="font-serif font-bold text-xl text-slate-100 group-hover:text-amber-400 transition-colors">
                  {t(card.title, card.title)}
                </h3>
                <p className="text-slate-400 font-sans text-xs sm:text-sm leading-relaxed mt-2 line-clamp-3 whitespace-pre-line">
                  {t(card.description, card.description)}
                </p>
              </div>
            </div>

            {card.linkUrl && (
              <div className="p-6 pt-0 border-t border-slate-900 mt-auto">
                <a
                  href={card.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-block text-center mt-4 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-sans font-bold py-3 px-4 rounded-xl border border-amber-500/20 hover:border-transparent transition-all duration-300"
                >
                  {t(card.buttonText || header?.buttonText || "تصفح التفاصيل الإضافية", card.buttonText || header?.buttonText || "تصفح التفاصيل الإضافية")}
                </a>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* LIGHTBOX FOR IMAGES */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2.5 bg-slate-900/60 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800/80 rounded-3xl max-w-4xl w-full p-4 overflow-hidden shadow-2xl flex flex-col md:flex-row gap-6 items-center"
            >
              <div className="relative w-full md:w-3/5 max-h-[70vh] rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full md:w-2/5 text-right space-y-4 px-2">
                <span className="text-[10px] font-sans font-bold uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
                  لوحة تفصيلية
                </span>
                <h3 className="font-serif font-bold text-2xl text-amber-400">{selectedImage.title}</h3>
                <div className="border-b border-slate-850"></div>
                <p className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed max-h-[30vh] overflow-y-auto pr-1 whitespace-pre-line">
                  {selectedImage.desc}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX FOR VIDEOS */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedVideo(null)}
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
                src={selectedVideo}
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
