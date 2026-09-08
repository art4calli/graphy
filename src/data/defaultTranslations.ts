export type LanguageCode = "ar" | "th" | "en";

export interface TranslationItem {
  id: string;
  category: string;
  categoryLabel: string;
  label: string;
  ar: string;
  th: string;
  en: string;
}

export const DEFAULT_SITE_TRANSLATIONS: TranslationItem[] = [
  // -------------------------------------------------------------
  // 1. ترويسة الموقع والتنقل (Header & Navigation)
  // -------------------------------------------------------------
  {
    id: "header_announcement_1",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "شريط الإعلانات (النص الأول)",
    ar: "مرحباً بكم في المنصة الرسمية المتطورة لمؤسسة يوسف ذنون للخط العربي",
    th: "ยินดีต้อนรับสู่แพลตฟอร์มอย่างเป็นทางการของสถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันนูน",
    en: "Welcome to the official platform of Yousuf Dhannoon Arabic Calligraphy Institute"
  },
  {
    id: "header_announcement_2",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "شريط الإعلانات (الموقع)",
    ar: "الموصل، العراق",
    th: "โมซูล, อิรัก",
    en: "Mosul, Iraq"
  },
  {
    id: "header_announcement_3",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "شريط الإعلانات (النص الثالث)",
    ar: "تأسست لحفظ وإحياء تراث عميد الخط العربي الأستاذ يوسف ذنون",
    th: "ก่อตั้งขึ้นเพื่ออนุรักษ์และสืบทอดมรดกของปรมาจารย์แห่งอักษรอาหรับ ยูซุฟ ซันนูน",
    en: "Established to preserve and revive the legacy of Master Arabic Calligrapher Yousuf Dhannoon"
  },
  {
    id: "header_announcement_tag",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "شارة شريط الإعلانات",
    ar: "أخبار المؤسسة",
    th: "ข่าวสารสถาบัน",
    en: "Institute News"
  },
  {
    id: "navbar_brand_title",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "اسم المؤسسة في القائمة",
    ar: "مؤسسة يوسف ذنون",
    th: "สถาบัน ยูซุฟ ซันนูน",
    en: "Yousuf Dhannoon Institute"
  },
  {
    id: "navbar_brand_subtitle",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "الوصف تحت اسم المؤسسة",
    ar: "للخط العربي والآثار الإسلامية",
    th: "สำหรับศิลปะอักษรอาหรับและโบราณคดีอิสลาม",
    en: "For Arabic Calligraphy and Islamic Antiquities"
  },
  {
    id: "nav_home",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر القائمة: الرئيسية",
    ar: "الرئيسية",
    th: "หน้าแรก",
    en: "Home"
  },
  {
    id: "nav_about",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر القائمة: عن المؤسسة",
    ar: "عن المؤسسة",
    th: "เกี่ยวกับเรา",
    en: "About Us"
  },
  {
    id: "nav_artwork",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر القائمة: معرض الصور",
    ar: "معرض الصور",
    th: "แกลเลอรีผลงาน",
    en: "Gallery"
  },
  {
    id: "nav_video",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر القائمة: الفيديوهات",
    ar: "الفيديوهات",
    th: "วิดีโอ",
    en: "Videos"
  },
  {
    id: "nav_courses",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر القائمة: البرامج التعليمية",
    ar: "البرامج التعليمية",
    th: "หลักสูตรอบรม",
    en: "Courses"
  },
  {
    id: "nav_tools",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر القائمة: أدوات الخط",
    ar: "أدوات الخط",
    th: "อุปกรณ์การเขียน",
    en: "Calligraphy Tools"
  },
  {
    id: "nav_contact",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر القائمة: تواصل معنا",
    ar: "تواصل معنا",
    th: "ติดต่อเรา",
    en: "Contact Us"
  },
  {
    id: "nav_subscriber_portal",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر بوابة المشتركين",
    ar: "بوابة المشتركين",
    th: "พอร์ทัลสมาชิก",
    en: "Subscriber Portal"
  },
  {
    id: "nav_admin_settings",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر لوحة الإعدادات للمشرف",
    ar: "لوحة الإعدادات",
    th: "แผงการตั้งค่า",
    en: "Settings Panel"
  },
  {
    id: "nav_admin_logout",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر خروج المشرف",
    ar: "خروج المشرف",
    th: "ออกจากระบบแอดมิน",
    en: "Admin Logout"
  },
  {
    id: "nav_logout",
    category: "header_nav",
    categoryLabel: "الترويسة وقوائم التنقل",
    label: "زر تسجيل الخروج",
    ar: "تسجيل خروج",
    th: "ออกจากระบบ",
    en: "Logout"
  },

  // -------------------------------------------------------------
  // 2. الصفحة الرئيسية والبطاقات الترحيبية (Home & Hero)
  // -------------------------------------------------------------
  {
    id: "hero_welcome_badge",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "شارة الترحيب العلوية",
    ar: "منصة تعليمية وتوثيقية متكاملة",
    th: "แพลตฟอร์มการเรียนรู้และรวบรวมข้อมูลแบบครบวงจร",
    en: "Integrated Educational & Archival Platform"
  },
  {
    id: "hero_main_title",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "العنوان الرئيسي للموقع",
    ar: "مؤسسة يوسف ذنون للخط العربي والآثار الإسلامية",
    th: "สถาบันศิลปะการเขียนตัวอักษรอาหรับและโบราณคดีอิสลาม ยูซุฟ ซันนูน",
    en: "Yousuf Dhannoon Institute for Arabic Calligraphy & Islamic Antiquities"
  },
  {
    id: "hero_main_description",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "الوصف التعريفي بالرئيسية",
    ar: "أهلاً بكم في المنصة الرسمية لمؤسسة يوسف ذنون. نهدف إلى تقديم أرقى الموارد والدروس الأكاديمية ونشر تراث فن الخط العربي الأصيل للأجيال القادمة.",
    th: "ยินดีต้อนรับสู่แพลตฟอร์มทางการของสถาบัน ยูซุฟ ซันนูน เรามุ่งมั่นนำเสนอแหล่งข้อมูล บทเรียนเชิงวิชาการ และส่งต่อมรดกศิลปะอักษรวิจิตรอาหรับแก่คนรุ่นหลัง",
    en: "Welcome to the official platform of Yousuf Dhannoon Institute. We are dedicated to providing premier educational resources and preserving the authentic legacy of Arabic calligraphy."
  },
  {
    id: "hero_primary_btn",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "زر الإجراء الرئيسي (استكشف المعرض)",
    ar: "استكشف المعرض والأعمال",
    th: "สำรวจผลงานและแกลเลอรี",
    en: "Explore Gallery & Artworks"
  },
  {
    id: "hero_secondary_btn",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "زر الإجراء الثانوي (الدورات التدريبية)",
    ar: "الدورات والبرامج المتاحة",
    th: "หลักสูตรและโปรแกรมที่เปิดสอน",
    en: "Available Courses & Programs"
  },
  {
    id: "home_cards_section_title",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "عنوان قسم الأخبار والبطاقات",
    ar: "أحدث المستجدات والفعاليات",
    th: "ข่าวสารและกิจกรรมล่าสุด",
    en: "Latest Updates & Events"
  },
  {
    id: "home_section_title",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "عنوان قسم الواجهة الترحيبية ومستجدات المؤسسة",
    ar: "الواجهة الترحيبية ومستجدات المؤسسة",
    th: "หน้าต้อนรับและข่าวสารอัปเดตของสถาบัน",
    en: "Welcome Interface & Institution Updates"
  },
  {
    id: "about_extra_title",
    category: "about",
    categoryLabel: "عن المؤسسة والسيرة",
    label: "عنوان أقسام ومعلومات المؤسسة الإضافية",
    ar: "أقسام ومعلومات المؤسسة الإضافية",
    th: "หมวดหมู่และข้อมูลเพิ่มเติมของสถาบัน",
    en: "Additional Sections & Information"
  },
  {
    id: "feat_taalim",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "كلمة ميزة: تعليم",
    ar: "تعليم",
    th: "การศึกษา",
    en: "Education"
  },
  {
    id: "feat_qalam",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "كلمة ميزة: قلم",
    ar: "قلم",
    th: "ปากกาคัดลายมือ",
    en: "Calligraphy Pen"
  },
  {
    id: "feat_daman",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "كلمة ميزة: ضمان",
    ar: "ضمان",
    th: "การรับประกันคุณภาพ",
    en: "Quality Guarantee"
  },
  {
    id: "feat_shahada",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "كلمة ميزة: شهادة",
    ar: "شهادة",
    th: "ใบประกาศนียบัตร / إجازة",
    en: "Certificate / License"
  },
  {
    id: "feat_ijaza_title",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "عنوان ميزة: الترخيص الخطّي",
    ar: "الترخيص الخطّي",
    th: "การอนุญาตและใบประกาศนียบัตร",
    en: "Calligraphic Licensing"
  },
  {
    id: "feat_ijaza_desc",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "وصف ميزة: الترخيص الخطّي",
    ar: "تمنح المؤسسة إجازات خطية معتمدة دولياً",
    th: "สถาบันมอบใบอนุญาตการเขียนตัวอักษรที่ได้รับการรับรองระดับสากล",
    en: "The institute grants internationally recognized calligraphic certifications"
  },
  {
    id: "feat_nizami_title",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "عنوان ميزة: التعليم النظامي",
    ar: "التعليم النظامي",
    th: "การศึกษาตามหลักสูตร",
    en: "Structured Learning"
  },
  {
    id: "feat_nizami_desc",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "وصف ميزة: التعليم النظامي",
    ar: "دورات حضورية وأخرى رقمية عن بُعد",
    th: "คอร์สอบรมทั้งแบบพบตัวจริงและแบบออนไลน์",
    en: "In-person workshops and remote digital courses"
  },
  {
    id: "feat_maktaba_title",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "عنوان ميزة: مكتبة نادرة",
    ar: "مكتبة نادرة",
    th: "ห้องสมุดหายาก",
    en: "Rare Library"
  },
  {
    id: "feat_maktaba_desc",
    category: "home_hero",
    categoryLabel: "الرئيسية والواجهة",
    label: "وصف ميزة: مكتبة نادرة",
    ar: "مئات الكتب والمجلدات عن الحرف والآثار",
    th: "หนังสือและเอกสารโบราณหลายร้อยเล่มเกี่ยวกับอักษรและโบราณคดี",
    en: "Hundreds of rare books and volumes on scripts and archaeology"
  },

  // -------------------------------------------------------------
  // 3. البرامج والدورات التعليمية (Courses Section)
  // -------------------------------------------------------------
  {
    id: "courses_badge",
    category: "courses",
    categoryLabel: "البرامج التعليمية والدورات",
    label: "شارة قسم الدورات",
    ar: "تعليم أكاديمي بإجازات معتمدة",
    th: "การศึกษาทางวิชาการพร้อมใบรับรอง",
    en: "Academic Training with Certified Credentials"
  },
  {
    id: "courses_title",
    category: "courses",
    categoryLabel: "البرامج التعليمية والدورات",
    label: "عنوان قسم الدورات",
    ar: "البرامج التدريبية والدورات التخصصية",
    th: "โปรแกรมการฝึกอบรมและหลักสูตรเฉพาะทาง",
    en: "Specialized Courses & Training Programs"
  },
  {
    id: "courses_description",
    category: "courses",
    categoryLabel: "البرامج التعليمية والدورات",
    label: "وصف قسم الدورات",
    ar: "تعلم أصول وقواعد الخطوط العربية المختلفة (الثلث، النسخ، الرقعة، الديواني، الكوفي، والتعليق) بإشراف نخبة من كبار الأساتذة والمجازين.",
    th: "เรียนรู้กฎและรากฐานของรูปแบบอักษรอาหรับต่างๆ (ธุลุษ, นัสค์, รุกอะฮ์, ดีวานีย์, คูฟีย์, ตะอ์ลีค) ภายใต้การดูแลของผู้เชี่ยวชาญระดับปรมาจารย์",
    en: "Master the rules and styles of classical Arabic scripts (Thuluth, Naskh, Ruq'ah, Diwani, Kufic, Ta'liq) under the mentorship of certified master calligraphers."
  },
  {
    id: "courses_enroll_btn",
    category: "courses",
    categoryLabel: "البرامج التعليمية والدورات",
    label: "زر التسجيل في الدورة",
    ar: "التسجيل في هذا البرنامج",
    th: "ลงทะเบียนเข้าร่วมหลักสูตร",
    en: "Enroll in This Program"
  },
  {
    id: "courses_view_details",
    category: "courses",
    categoryLabel: "البرامج التعليمية والدورات",
    label: "زر تفاصيل الدورة",
    ar: "عرض التفاصيل والمحتوى",
    th: "ดูรายละเอียดและเนื้อหา",
    en: "View Details & Curriculum"
  },

  // -------------------------------------------------------------
  // 4. أدوات الخط العربي (Tools Section)
  // -------------------------------------------------------------
  {
    id: "tools_badge",
    category: "tools",
    categoryLabel: "أدوات ومستلزمات الخط",
    label: "شارة قسم الأدوات",
    ar: "مستلزمات فاخرة للخطاطين",
    th: "อุปกรณ์พรีเมียมสำหรับนักคัดลายมือ",
    en: "Premium Supplies for Calligraphers"
  },
  {
    id: "tools_title",
    category: "tools",
    categoryLabel: "أدوات ومستلزمات الخط",
    label: "عنوان قسم الأدوات",
    ar: "أدوات ومستلزمات الخط العربي",
    th: "อุปกรณ์และเครื่องมือศิลปะการเขียนอักษร",
    en: "Calligraphy Tools & Materials"
  },
  {
    id: "tools_description",
    category: "tools",
    categoryLabel: "أدوات ومستلزمات الخط",
    label: "وصف قسم الأدوات",
    ar: "نوفر أجود أنواع الأقلام الطبيعية (القصب والجاوي)، والأحبار التقليدية المعتقة، والأوراق المقهرة يدوياً لضمان أعلى جودة في الإنجاز الفني.",
    th: "เราคัดสรรปากกาธรรมชาติ (กิ่งอ้อและไม้ชวา) หมึกสูตรโบราณ และกระดาษเคลือบมูการ์ เพื่อผลงานคุณภาพสูงสุด",
    en: "We provide the finest traditional reed pens (Qalam), archival inks, and hand-treated Ahar papers to ensure peak artistic craftsmanship."
  },
  {
    id: "tools_order_btn",
    category: "tools",
    categoryLabel: "أدوات ومستلزمات الخط",
    label: "زر طلب الأداة",
    ar: "طلب واستفسار",
    th: "สั่งซื้อและสอบถาม",
    en: "Order & Inquire"
  },

  // -------------------------------------------------------------
  // 5. قسم الفيديوهات (Videos Section)
  // -------------------------------------------------------------
  {
    id: "video_badge",
    category: "videos",
    categoryLabel: "المكتبة المرئية والفيديوهات",
    label: "شارة قسم الفيديوهات",
    ar: "مكتبة مرئية غنية",
    th: "คลังวิดีโอเพื่อการเรียนรู้",
    en: "Visual & Video Library"
  },
  {
    id: "video_title",
    category: "videos",
    categoryLabel: "المكتبة المرئية والفيديوهات",
    label: "عنوان قسم الفيديوهات",
    ar: "الدروس المرئية والمحاضرات",
    th: "บทเรียนวิดีโอและการบรรยาย",
    en: "Video Tutorials & Lectures"
  },
  {
    id: "video_description",
    category: "videos",
    categoryLabel: "المكتبة المرئية والفيديوهات",
    label: "وصف قسم الفيديوهات",
    ar: "شاهد شروحات تفصيلية لكتابة الحروف، ولقاءات وثائقية مع عميد الخط العربي يوسف ذنون، وتحليلات للوحات التاريخية الخالدة.",
    th: "รับชมการสาธิตการเขียนตัวอักษรแบบละเอียด สารคดีบทสัมภาษณ์ปรมาจารย์ยูซุฟ ซันนูน และการวิเคราะห์ผลงานประวัติศาสตร์",
    en: "Watch detailed step-by-step stroke demonstrations, documentary interviews with Master Yousuf Dhannoon, and analyses of historic masterpieces."
  },
  {
    id: "video_watch_btn",
    category: "videos",
    categoryLabel: "المكتبة المرئية والفيديوهات",
    label: "زر تشغيل الفيديو",
    ar: "مشاهدة الفيديو",
    th: "รับชมวิดีโอ",
    en: "Watch Video"
  },

  // -------------------------------------------------------------
  // 6. معرض الصور واللوحات (Gallery Section)
  // -------------------------------------------------------------
  {
    id: "gallery_badge",
    category: "gallery",
    categoryLabel: "معرض الصور واللوحات",
    label: "شارة قسم المعرض",
    ar: "روائع التراث والإبداع",
    th: "สุดยอดมรดกและผลงานสร้างสรรค์",
    en: "Masterpieces of Heritage & Art"
  },
  {
    id: "gallery_title",
    category: "gallery",
    categoryLabel: "معرض الصور واللوحات",
    label: "عنوان قسم المعرض",
    ar: "معرض اللوحات والمخطوطات النادرة",
    th: "แกลเลอรีภาพผลงานและเอกสารตัวเขียนหายาก",
    en: "Exhibition of Rare Calligraphies & Manuscripts"
  },
  {
    id: "gallery_description",
    category: "gallery",
    categoryLabel: "معرض الصور واللوحات",
    label: "وصف قسم المعرض",
    ar: "مجموعة مختارة من نوادر الأعمال الخطية، والتكوينات الهندسية، والزخارف الإسلامية البديعة المنفذة بأيدي كبار الخطاطين.",
    th: "คอลเลกชันผลงานอักษรวิจิตรชั้นยอด โครงสร้างเรขาคณิต และลวดลายอิสลามอันประณีตโดยปรมาจารย์ชื่อดัง",
    en: "A curated collection of rare calligraphic pieces, intricate geometric compositions, and classical Islamic illuminations."
  },
  {
    id: "gallery_view_image",
    category: "gallery",
    categoryLabel: "معرض الصور واللوحات",
    label: "زر عرض الصورة بحجم كامل",
    ar: "عرض بدقة عالية",
    th: "ดูภาพขนาดเต็มความละเอียดสูง",
    en: "View Full Resolution"
  },

  // -------------------------------------------------------------
  // 7. عن المؤسسة والسيرة الذاتية (About Section)
  // -------------------------------------------------------------
  {
    id: "about_badge",
    category: "about",
    categoryLabel: "عن المؤسسة والسيرة الذاتية",
    label: "شارة قسم عن المؤسسة",
    ar: "مسيرة عطاء وتراث خالد",
    th: "เส้นทางแห่งการอุทิศและมรดกอันเป็นนิรันดร์",
    en: "A Journey of Dedication & Timeless Heritage"
  },
  {
    id: "about_title",
    category: "about",
    categoryLabel: "عن المؤسسة والسيرة الذاتية",
    label: "عنوان قسم عن المؤسسة",
    ar: "عميد الخط العربي الأستاذ يوسف ذنون",
    th: "ปรมาจารย์แห่งอักษรอาหรับ ยูซุฟ ซันนูน",
    en: "Master of Arabic Calligraphy: Yousuf Dhannoon"
  },
  {
    id: "about_subtitle",
    category: "about",
    categoryLabel: "عن المؤسسة والسيرة الذاتية",
    label: "الوصف التعريفي للعميد",
    ar: "قامة علمية وفنية بارزة في تاريخ الخط العربي، قضى أكثر من ستين عاماً في البحث والتدريس والتأليف وتخريج أجيال من الخطاطين في شتى أرجاء العالم الإسلامي.",
    th: "บุคคลสำคัญทางวิชาการและศิลปะแห่งประวัติศาสตร์อักษรอาหรับ ผู้อุทิศเวลากว่า 60 ปีในการวิจัย การสอน และการผลิตนักคัดลายมือทั่วโลกอิสลาม",
    en: "An eminent scholarly and artistic pillar in Arabic calligraphy history, dedicating over sixty years to research, teaching, and mentoring calligraphers globally."
  },
  {
    id: "about_stat1_label",
    category: "about",
    categoryLabel: "عن المؤسسة والسيرة الذاتية",
    label: "تسمية الإحصائية الأولى",
    ar: "عاماً من العطاء الفني",
    th: "ปีแห่งการอุทิศตนเพื่อศิลปะ",
    en: "Years of Artistic Contribution"
  },
  {
    id: "about_stat2_label",
    category: "about",
    categoryLabel: "عن المؤسسة والسيرة الذاتية",
    label: "تسمية الإحصائية الثانية",
    ar: "إجازة خطية معتمدة",
    th: "ใบประกาศนียบัตรที่มอบให้ศิษย์",
    en: "Certified Ijazah Credentials"
  },
  {
    id: "about_stat3_label",
    category: "about",
    categoryLabel: "عن المؤسسة والسيرة الذاتية",
    label: "تسمية الإحصائية الثالثة",
    ar: "مؤلف وبحث في فن الخط",
    th: "ผลงานเขียนและงานวิจัย",
    en: "Authored Books & Researches"
  },

  // -------------------------------------------------------------
  // 8. التواصل ونموذج المراسلة (Contact Section)
  // -------------------------------------------------------------
  {
    id: "contact_badge",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "شارة قسم التواصل",
    ar: "نسعد دائماً بخدمتكم وتواصلكم",
    th: "ยินดีให้บริการและรับฟังข้อความของคุณเสมอ",
    en: "Always Pleased to Serve & Connect with You"
  },
  {
    id: "contact_title",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "عنوان قسم التواصل",
    ar: "تواصل معنا والتحق بنا",
    th: "ติดต่อเราและเข้าร่วมกับเรา",
    en: "Get in Touch & Join Us"
  },
  {
    id: "contact_description",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "وصف قسم التواصل",
    ar: "لديك استفسار حول الدورات أو ترغب بطلب لوحة خطية مخصصة؟ راسلنا أو تواصل معنا عبر قنواتنا الرسمية، أو تشرفنا بزيارتك لمقر المؤسسة.",
    th: "มีข้อสงสัยเกี่ยวกับหลักสูตรหรือต้องการสั่งทำชิ้นงานอักษรวิจิตรพิเศษ? ส่งข้อความหาเราหรือเดินทางมาเยี่ยมชมสถาบันได้ทุกเมื่อ",
    en: "Have an inquiry regarding programs or wish to commission bespoke calligraphy art? Contact us through our official channels or visit our institute."
  },
  {
    id: "contact_info_panel_title",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "عنوان لوحة بيانات التواصل",
    ar: "مقر المؤسسة وقنوات التواصل",
    th: "ที่ทำการสถาบันและช่องทางการติดต่อ",
    en: "Institute Headquarters & Channels"
  },
  {
    id: "contact_card_address_title",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "عنوان بطاقة العنوان",
    ar: "العنوان والموقع",
    th: "ที่อยู่และที่ตั้ง",
    en: "Address & Location"
  },
  {
    id: "contact_card_phone_title",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "عنوان بطاقة الهاتف",
    ar: "رقم الهاتف",
    th: "หมายเลขโทรศัพท์",
    en: "Phone Number"
  },
  {
    id: "contact_card_email_title",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "عنوان بطاقة البريد",
    ar: "البريد الإلكتروني",
    th: "อีเมล",
    en: "Email Address"
  },
  {
    id: "contact_card_hours_title",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "عنوان بطاقة أوقات العمل",
    ar: "أوقات العمل",
    th: "เวลาทำการ",
    en: "Working Hours"
  },
  {
    id: "contact_form_title",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "عنوان نموذج إرسال الرسالة",
    ar: "أرسل لنا رسالة مباشرة",
    th: "ส่งข้อความถึงเราโดยตรง",
    en: "Send Us a Direct Message"
  },
  {
    id: "contact_form_label_name",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "حقل الاسم",
    ar: "الاسم الكامل",
    th: "ชื่อ-นามสกุล",
    en: "Full Name"
  },
  {
    id: "contact_form_label_email",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "حقل البريد",
    ar: "البريد الإلكتروني",
    th: "อีเมลของคุณ",
    en: "Email Address"
  },
  {
    id: "contact_form_label_subject",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "حقل الموضوع",
    ar: "موضوع الرسالة",
    th: "หัวข้อข้อความ",
    en: "Subject"
  },
  {
    id: "contact_form_label_message",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "حقل نص الرسالة",
    ar: "نص الرسالة أو الاستفسار",
    th: "ข้อความหรือข้อซักถาม",
    en: "Your Message"
  },
  {
    id: "contact_form_submit_btn",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "زر إرسال الرسالة",
    ar: "إرسال الرسالة الآن",
    th: "ส่งข้อความทันที",
    en: "Send Message Now"
  },
  {
    id: "contact_form_sending_btn",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "زر حالة جاري الإرسال",
    ar: "جاري إرسال رسالتك...",
    th: "กำลังส่งข้อความ...",
    en: "Sending Message..."
  },
  {
    id: "contact_form_success_msg",
    category: "contact",
    categoryLabel: "التواصل ونموذج المراسلة",
    label: "رسالة نجاح إرسال الرسالة",
    ar: "شكراً لتواصلك معنا! تم استلام رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت.",
    th: "ขอบคุณสำหรับการติดต่อ! เราได้รับข้อความของคุณแล้วและจะติดต่อกลับโดยเร็วที่สุด",
    en: "Thank you for reaching out! Your message has been received and we will get back to you shortly."
  },

  // -------------------------------------------------------------
  // 9. استمارة التسجيل والتأكيد (Registration Form & Modal)
  // -------------------------------------------------------------
  {
    id: "reg_modal_title",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "عنوان نافذة التسجيل",
    ar: "استمارة التسجيل والالتحاق",
    th: "แบบฟอร์มการลงทะเบียนและสมัครสมาชิก",
    en: "Registration & Enrollment Form"
  },
  {
    id: "reg_modal_subtitle",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "الوصف تحت عنوان الاستمارة",
    ar: "يرجى تعبئة الحقول التالية بدقة لاستكمال عملية التسجيل وتوليد بطاقتك الخاصة",
    th: "กรุณากรอกข้อมูลในช่องต่อไปนี้ให้ครบถ้วนเพื่อดำเนินการสมัครและสร้างบัตรประจำตัวของคุณ",
    en: "Please fill out the following fields accurately to complete registration and generate your digital pass"
  },
  {
    id: "reg_submit_btn",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "زر تأكيد وإرسال التسجيل",
    ar: "تأكيد وإرسال التسجيل",
    th: "ยืนยันและส่งการลงทะเบียน",
    en: "Confirm & Submit Registration"
  },
  {
    id: "reg_submitting_btn",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "زر جاري حفظ التسجيل",
    ar: "جاري حفظ التسجيل ورفع البيانات...",
    th: "กำลังบันทึกข้อมูลและอัปโหลด...",
    en: "Saving Registration & Uploading..."
  },
  {
    id: "reg_required_note",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "ملاحظة الحقول الإجبارية",
    ar: "الحقول المؤشرة بعلامة (*) مطلوبة",
    th: "ช่องที่มีเครื่องหมาย (*) จำเป็นต้องกรอก",
    en: "Fields marked with (*) are required"
  },
  {
    id: "reg_file_upload_btn",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "زر اختيار ورفع الملف",
    ar: "اختيار ملف أو صورة من جهازك",
    th: "เลือกไฟล์หรือรูปภาพจากอุปกรณ์ของคุณ",
    en: "Choose File or Image from Device"
  },
  {
    id: "reg_success_title",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "عنوان رسالة نجاح التسجيل",
    ar: "تم تسجيلك بنجاح في المنصة!",
    th: "การลงทะเบียนของคุณสำเร็จเรียบร้อยแล้ว!",
    en: "Registration Completed Successfully!"
  },
  {
    id: "reg_id_label",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "تسمية رقم التسجيل",
    ar: "رقم التسجيل الخاص بك:",
    th: "หมายเลขลงทะเบียนของคุณ:",
    en: "Your Registration ID:"
  },
  {
    id: "reg_copy_id_btn",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "زر نسخ رقم التسجيل",
    ar: "نسخ الرقم",
    th: "คัดลอกหมายเลข",
    en: "Copy ID"
  },
  {
    id: "reg_copied_toast",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "رسالة تم النسخ",
    ar: "تم نسخ رقم التسجيل بنجاح",
    th: "คัดลอกหมายเลขลงทะเบียนสำเร็จ",
    en: "Registration ID copied to clipboard"
  },
  {
    id: "reg_download_qr_btn",
    category: "registration",
    categoryLabel: "استمارة التسجيل والاشتراك",
    label: "زر تنزيل رمز QR",
    ar: "تنزيل رمز QR للمشترك",
    th: "ดาวน์โหลดรหัส QR ของสมาชิก",
    en: "Download Member QR Code"
  },

  // -------------------------------------------------------------
  // 10. بوابة المشتركين (Subscriber Portal)
  // -------------------------------------------------------------
  {
    id: "subscriber_login_title",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "عنوان نافذة تسجيل دخول المشترك",
    ar: "تسجيل دخول بوابة المشتركين",
    th: "เข้าสู่ระบบพอร์ทัลสมาชิก",
    en: "Subscriber Portal Login"
  },
  {
    id: "subscriber_login_subtitle",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "وصف نافذة تسجيل الدخول",
    ar: "أدخل رقم التسجيل الخاص بك أو امسح رمز الاستجابة السريعة (QR Code) للوصول المباشر إلى موادك الخاصة",
    th: "กรอกหมายเลขลงทะเบียนของคุณหรือสแกน QR Code เพื่อเข้าถึงเนื้อหาพิเศษของคุณทันที",
    en: "Enter your Registration ID or scan your QR Code to access your dedicated materials"
  },
  {
    id: "subscriber_id_placeholder",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "حقل إدخال رقم التسجيل",
    ar: "أدخل رقم التسجيل (مثال: YD-10203)",
    th: "กรอกหมายเลขลงทะเบียน (เช่น YD-10203)",
    en: "Enter Registration ID (e.g. YD-10203)"
  },
  {
    id: "subscriber_login_btn",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "زر الدخول للبوابة",
    ar: "تسجيل الدخول الآن",
    th: "เข้าสู่ระบบทันที",
    en: "Log In Now"
  },
  {
    id: "subscriber_scan_qr_btn",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "زر مسح رمز QR بالكاميرا",
    ar: "مسح رمز QR بالكاميرا",
    th: "สแกน QR Code ด้วยกล้อง",
    en: "Scan QR Code with Camera"
  },
  {
    id: "subscriber_welcome_greeting",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "تحية المشترك المسجل",
    ar: "مرحباً بك مجدداً،",
    th: "ยินดีต้อนรับกลับ,",
    en: "Welcome back,"
  },
  {
    id: "subscriber_exit_portal_btn",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "زر الخروج من صفحة المشترك",
    ar: "الخروج والعودة للرئيسية",
    th: "ออกจากระบบและกลับสู่หน้าหลัก",
    en: "Exit to Homepage"
  },
  {
    id: "subscriber_portal_badge",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "شارة بوابة المشتركين",
    ar: "بوابة المشتركين",
    th: "พอร์ทัลสมาชิก",
    en: "Subscriber Portal"
  },
  {
    id: "subscriber_or_manual_login",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "نص فاصل الدخول اليدوي",
    ar: "أو الدخول اليدوي بالاسم وكلمة المرور",
    th: "หรือเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน",
    en: "Or log in manually with username and password"
  },
  {
    id: "subscriber_username_label",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "عنوان حقل اسم المستخدم",
    ar: "اسم المستخدم للخطاط / المشترك",
    th: "ชื่อผู้ใช้สำหรับสมาชิก / นักคัดลายมือ",
    en: "Username for Subscriber / Calligrapher"
  },
  {
    id: "subscriber_password_label",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "عنوان حقل كلمة المرور",
    ar: "كلمة المرور أو رقم التسجيل الخاص بك",
    th: "รหัสผ่านหรือหมายเลขลงทะเบียนของคุณ",
    en: "Password or Registration Number"
  },
  {
    id: "subscriber_password_placeholder",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "تلميح حقل كلمة المرور",
    ar: "أدخل كلمة السر الخاصة بك",
    th: "กรอกรหัสผ่านของคุณ",
    en: "Enter your password"
  },
  {
    id: "subscriber_login_verifying",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "نص زر جاري التحقق",
    ar: "جاري التحقق وقراءة موضوع الطالب، يرجى الانتظار...",
    th: "กำลังตรวจสอบข้อมูลและเตรียมเนื้อหา โปรดรอสักครู่...",
    en: "Verifying credentials and preparing content, please wait..."
  },
  {
    id: "subscriber_new_user_prompt",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "سؤال المشترك الجديد",
    ar: "هل أنت مشترك جديد وغير مسجل بعد؟",
    th: "คุณเป็นสมาชิกใหม่และยังไม่ได้ลงทะเบียนหรือไม่?",
    en: "Are you a new subscriber not yet registered?"
  },
  {
    id: "subscriber_contact_for_reg",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "رابط التواصل للتسجيل",
    ar: "راسل الإدارة الآن للحصول على حسابك وتفعيل الإشتراك",
    th: "ติดต่อฝ่ายบริหารเพื่อรับบัญชีและเปิดใช้งานการเป็นสมาชิก",
    en: "Contact administration now to receive your account and activate subscription"
  },
  {
    id: "subscriber_open_reg_form_btn",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "زر تعبئة استمارة تسجيل مشترك جديد (فورم التسجيل)",
    ar: "تعبئة استمارة تسجيل مشترك جديد (فورم التسجيل)",
    th: "กรอกแบบฟอร์มลงทะเบียนสมาชิกใหม่ (แบบฟอร์มลงทะเบียน)",
    en: "Fill New Subscriber Registration Form"
  },
  {
    id: "subscriber_refresh_cards_btn",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "زر تحديث بطاقات المشترك",
    ar: "تحديث البطاقات",
    th: "รีเฟรชการ์ดเนื้อหา",
    en: "Refresh Cards"
  },
  {
    id: "subscriber_custom_links_header",
    category: "subscriber",
    categoryLabel: "بوابة المشتركين والدخول",
    label: "عنوان الروابط المخصصة للمشترك",
    ar: "روابطك التعليمية المخصصة",
    th: "ลิงก์การเรียนรู้พิเศษของคุณ",
    en: "Your Dedicated Educational Links"
  },

  // -------------------------------------------------------------
  // 11. التذييل والأزرار العامة (Footer & Common)
  // -------------------------------------------------------------
  {
    id: "footer_title",
    category: "footer",
    categoryLabel: "التذييل وحقوق النشر",
    label: "عنوان المؤسسة في التذييل",
    ar: "مؤسسة يوسف ذنون",
    th: "สถาบัน ยูซุฟ ซันนูน",
    en: "Yousuf Dhannoon Institute"
  },
  {
    id: "footer_about_title",
    category: "footer",
    categoryLabel: "التذييل وحقوق النشر",
    label: "عنوان التذييل الكامل",
    ar: "مؤسسة يوسف ذنون للخط العربي",
    th: "สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันนูน",
    en: "Yousuf Dhannoon Arabic Calligraphy Institute"
  },
  {
    id: "footer_description",
    category: "footer",
    categoryLabel: "التذييل وحقوق النشر",
    label: "وصف المؤسسة في التذييل",
    ar: "مؤسسة مرخصة تُعنى برعاية الخطاطين وحفظ الموروث الفني والإرث الآثاري للأستاذ عميد الخط العربي يوسف ذنون رحمه الله.",
    th: "สถาบันที่ได้รับอนุญาตอย่างเป็นทางการ มุ่งเน้นการดูแลนักเขียนอักษรวิจิตร และอนุรักษ์มรดกทางศิลปะและโบราณคดีของปรมาจารย์ ยูซุฟ ซันนูน ขอพระเจ้าทรงเมตตาท่าน",
    en: "A licensed institution dedicated to nurturing calligraphers and preserving the artistic and archaeological legacy of the Dean of Arabic Calligraphy, Master Yousuf Dhannoon, may Allah have mercy on him."
  },
  {
    id: "footer_about_description",
    category: "footer",
    categoryLabel: "التذييل وحقوق النشر",
    label: "نص التذييل البديل",
    ar: "صرح ثقافي أكاديمي يسعى لترسيخ أصالة الخط العربي وتوثيق روائع الفنون الإسلامية والتعليم المستمر لطلاب العلم.",
    th: "สถาบันทางวิชาการและวัฒนธรรมที่มุ่งเน้นการส่งเสริมศิลปะอักษรอาหรับและเผยแพร่ความรู้แก่นักศึกษาทั่วโลก",
    en: "An academic and cultural institution dedicated to fostering Arabic calligraphy and sharing classical Islamic arts."
  },
  {
    id: "footer_copyright",
    category: "footer",
    categoryLabel: "التذييل وحقوق النشر",
    label: "حقوق النشر والملكية",
    ar: "جميع الحقوق محفوظة ومسجلة",
    th: "สงวนลิขสิทธิ์และจดทะเบียนถูกต้อง",
    en: "All rights reserved and registered"
  },
  {
    id: "common_loading",
    category: "common",
    categoryLabel: "الرسائل والتنبيهات العامة",
    label: "نص جاري التحميل",
    ar: "جاري التحميل...",
    th: "กำลังโหลดข้อมูล...",
    en: "Loading..."
  },
  {
    id: "common_error_occurred",
    category: "common",
    categoryLabel: "الرسائل والتنبيهات العامة",
    label: "نص حدث خطأ",
    ar: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
    th: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง",
    en: "An unexpected error occurred. Please try again"
  },
  {
    id: "common_retry",
    category: "common",
    categoryLabel: "الرسائل والتنبيهات العامة",
    label: "زر إعادة المحاولة",
    ar: "إعادة المحاولة",
    th: "ลองใหม่อีกครั้ง",
    en: "Retry"
  },
  {
    id: "common_close",
    category: "common",
    categoryLabel: "الرسائل والتنبيهات العامة",
    label: "زر الإغلاق",
    ar: "إغلاق",
    th: "ปิด",
    en: "Close"
  },
  {
    id: "common_save_success",
    category: "common",
    categoryLabel: "الرسائل والتنبيهات العامة",
    label: "رسالة تم الحفظ بنجاح",
    ar: "تم الحفظ بنجاح",
    th: "บันทึกข้อมูลเรียบร้อยแล้ว",
    en: "Saved successfully"
  }
];
