import { motion } from "motion/react";
import { BookOpen, Award, FileText, Shield } from "lucide-react";
import { SheetRow, BiographyData, SectionHeaderData, CustomTexts } from "../types";
import CardMediaSlider from "./CardMediaSlider";
import { useLanguage } from "../context/LanguageContext";

interface AboutSectionProps {
  cards: SheetRow[];
  biography?: BiographyData;
  header?: SectionHeaderData;
  customTexts?: CustomTexts;
}

export default function AboutSection({ cards, biography, header, customTexts }: AboutSectionProps) {
  const { t } = useLanguage();
  // If we have custom About cards, render them. Otherwise render a premium biography structure
  const hasCustomCards = cards && cards.length > 0;

  const features = [
    {
      icon: Award,
      title: t("about_feat_1_title", "الحفاظ على التراث"),
      description: t("about_feat_1_desc", "صيانة مقتنيات الأستاذ يوسف ذنون ومخطوطاته النادرة وحمايتها كإرث حضاري إسلامي ثري."),
    },
    {
      icon: BookOpen,
      title: t("about_feat_2_title", "التدريس الأكاديمي"),
      description: t("about_feat_2_desc", "توفير مناهج تعليمية متكاملة لتعليم الخط العربي وإجازة الخطاطين وفق الطرق التقليدية الرصينة."),
    },
    {
      icon: FileText,
      title: t("about_feat_3_title", "البحث العلمي والآثار"),
      description: t("about_feat_3_desc", "دعم الباحثين في مجالات الخط، النقوش الإسلامية والآثار، وإصدار كتب ومجلدات تخصصية."),
    },
    {
      icon: Shield,
      title: t("about_feat_4_title", "الترخيص والإجازة"),
      description: t("about_feat_4_desc", "منح إجازات خطية معتمدة دولياً من كبار أساتذة الخط العربي لرعاية الأجيال الخطاطة الجديدة."),
    },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      {/* Visual Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold font-sans tracking-widest text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full uppercase">
          {t("about_header_badge", header?.badge || "إرث حضاري إسلامي خالد")}
        </span>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mt-4 leading-normal">
          {t("about_header_title", header?.title || "عن مؤسسة يوسف ذنون للخط العربي")}
        </h2>
        <p className="text-slate-300 font-sans mt-4 text-sm sm:text-base leading-relaxed">
          {t("about_header_desc", header?.description || "تأسست المؤسسة لتكون مناراً إسلامياً وثقافياً يحمل اسم الراحل الكبير الأستاذ يوسف ذنون، عميد ومؤرخ الخط العربي، لنشر هذا الفن الشريف ورعاية أجيال الخطاطين في شتى أنحاء العالم الإسلامي.")}
        </p>
      </div>

      {/* Main Biography Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-slate-950/40 border border-slate-800/60 rounded-3xl p-6 sm:p-10 mb-20 shadow-2xl">
        <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl border border-amber-500/20">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 z-10"></div>
          <img
            src={biography?.bioImage || "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=600"}
            alt={biography?.bioName || "الأستاذ يوسف ذنون"}
            className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 right-4 left-4 z-20 text-right">
            <h4 className="font-serif font-bold text-lg text-amber-400">{t(biography?.bioName || "الأستاذ يوسف ذنون", biography?.bioName || "الأستاذ يوسف ذنون")}</h4>
            <p className="text-xs text-slate-300 font-sans">{t(biography?.bioSubtitle || "عميد ومؤرخ الخط العربي والآثار الإسلامية (١٩٣٢ - ٢٠٢٠)", biography?.bioSubtitle || "عميد ومؤرخ الخط العربي والآثار الإسلامية (١٩٣٢ - ٢٠٢٠)")}</p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6 text-right">
          <h3 className="font-serif font-bold text-2xl text-amber-400">
            {t("about_bio_title", biography?.bioTitle || "سيرة عميد الخطاطين ونشأة المؤسسة")}
          </h3>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans whitespace-pre-line">
            {t("about_bio_desc1", biography?.bioDesc1 || "ولد الخطاط والمؤرخ العراقي الأستاذ يوسف ذنون في مدينة الموصل الحدباء عام ١٩٣٢. كرس حياته لخدمة كتابة المصحف الشريف والبحث في أصول الحرف العربي وعلم الآثار والنقوش الإسلامية. كاتب بارز ومحاضر دولي أجاز عشرات الخطاطين الذين أصبحوا بدورهم قادة فن الخط في مختلف الأقطار.")}
          </p>
          {biography?.bioDesc2 ? (
            <p className="text-slate-300 text-sm leading-relaxed font-sans whitespace-pre-line">
              {t("about_bio_desc2", biography.bioDesc2)}
            </p>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              {t("about_bio_desc2_fallback", "تحولت المؤسسة بجهود تلامذته والمحبين لفنه إلى منبر ثقافي يضم مكتبته النادرة، مخطوطاته الإبداعية، ودراساته التأصيلية، لتقديم برامج تعليمية مميزة تعتمد على إجازته ومدرسته الفريدة في كتابة خطوط الثلث والنسخ والديواني والكوفي.")}
            </p>
          )}
        </div>
      </div>

      {/* Dynamic Cards Rendered from Google Sheet if available */}
      {hasCustomCards ? (
        <div className="space-y-12">
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-amber-400 border-r-4 border-amber-500 pr-3 mb-8">
            {t("about_extra_title", customTexts?.aboutExtraTitle || "أقسام ومعلومات المؤسسة الإضافية")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-serif font-bold text-lg text-amber-400 mb-3">{t(card.title, card.title)}</h4>
                  <p className="text-slate-300 text-sm font-sans leading-relaxed whitespace-pre-line">{t(card.description, card.description)}</p>
                  
                  {card.media && card.media.length > 0 && (
                    <div className="mt-4">
                      <CardMediaSlider media={card.media} title={card.title} description={card.description} />
                    </div>
                  )}
                </div>
                {card.linkUrl && (
                  <a
                    href={card.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-6 text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-sans font-semibold py-2.5 rounded-xl border border-amber-500/20 transition-all"
                  >
                    {t(card.buttonText || "تفاصيل إضافية", card.buttonText || "تفاصيل إضافية")}
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Core Values/Goals Grid (Fallback layout if sheet lacks explicit cards) */
        <div>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-amber-400 border-r-4 border-amber-500 pr-3 mb-10">
            {t("about_goals_title", "أهدافنا ورسالتنا الحضارية")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/60 hover:border-amber-500/30 rounded-2xl p-6 text-right transition-all duration-300 group shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-slate-100 mb-2 group-hover:text-amber-400 transition-colors">
                    {t(feat.title, feat.title)}
                  </h4>
                  <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
                    {t(feat.description, feat.description)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
