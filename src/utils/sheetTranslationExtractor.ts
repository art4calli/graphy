import { AppData, SheetRow } from "../types";
import { DEFAULT_SITE_TRANSLATIONS, TranslationItem } from "../data/defaultTranslations";
import { getInstantLookup } from "./translatorService";

export interface SheetExtractionResult {
  sheetItems: TranslationItem[];
  allTranslationsMerged: TranslationItem[];
}

/**
 * Normalizes text to create consistent, clean translation item keys
 */
export function generateTranslationKey(prefix: string, text: string): string {
  if (!text) return prefix;
  const sanitized = text
    .slice(0, 30)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0621-\u064A]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${prefix}_${sanitized || Math.abs(hashCode(text)).toString(36)}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Scans AppData (which represents the loaded 7 Google Sheets) and extracts all Arabic texts
 * categorized clearly by Sheet / Section name.
 */
export function extractTranslationsFromAppData(
  appData: AppData | null,
  existingTranslations: TranslationItem[] = []
): SheetExtractionResult {
  if (!appData) {
    return {
      sheetItems: [],
      allTranslationsMerged: existingTranslations
    };
  }

  const existingMap = new Map<string, TranslationItem>();
  const arabicLookupMap = new Map<string, { th: string; en: string }>();

  // 1. Map defaults
  DEFAULT_SITE_TRANSLATIONS.forEach((item) => {
    if (item && item.ar && item.ar.trim()) {
      const cleanAr = item.ar.trim();
      if (!arabicLookupMap.has(cleanAr) && (item.th || item.en)) {
        arabicLookupMap.set(cleanAr, { th: item.th || "", en: item.en || "" });
      }
    }
  });

  // 2. Map existing saved translations (takes precedence)
  existingTranslations.forEach((item) => {
    if (item && item.id) {
      existingMap.set(item.id, item);
    }
    if (item && item.ar && item.ar.trim() && (item.th || item.en)) {
      arabicLookupMap.set(item.ar.trim(), { th: item.th || "", en: item.en || "" });
    }
  });

  // 3. Map sheet-saved master translations from Google Sheets (SiteTranslations sheet tab)
  if (appData.siteTranslations && Array.isArray(appData.siteTranslations)) {
    appData.siteTranslations.forEach((item) => {
      if (item && item.id) {
        existingMap.set(item.id, item);
      }
      if (item && item.ar && item.ar.trim() && (item.th || item.en)) {
        arabicLookupMap.set(item.ar.trim(), { th: item.th || "", en: item.en || "" });
      }
    });
  }

  const extractedItems: TranslationItem[] = [];

  const addItem = (
    id: string,
    category: string,
    categoryLabel: string,
    label: string,
    arText?: string,
    defaultTh: string = "",
    defaultEn: string = ""
  ) => {
    if (!arText || typeof arText !== "string" || !arText.trim()) return;
    const trimmedAr = arText.trim();
    
    // Check if we already have saved translations for this key or matching text
    const existing = existingMap.get(id);
    const arMatch = arabicLookupMap.get(trimmedAr);
    const instant = (!existing?.th || !existing?.en) ? getInstantLookup(trimmedAr) : null;
    
    const item: TranslationItem = {
      id,
      category,
      categoryLabel,
      label,
      ar: trimmedAr,
      th: existing?.th || defaultTh || arMatch?.th || instant?.th || "",
      en: existing?.en || defaultEn || arMatch?.en || instant?.en || "",
    };

    extractedItems.push(item);
  };

  // -------------------------------------------------------------
  // 1. ورقة Profile (الصفحة الرئيسية والواجهة)
  // -------------------------------------------------------------
  addItem(
    "home_section_title",
    "sheet_profile",
    "ورقة Profile (الرئيسية والواجهة)",
    "عنوان قسم الواجهة الترحيبية ومستجدات المؤسسة",
    appData.customTexts?.homeSectionTitle || "الواجهة الترحيبية ومستجدات المؤسسة",
    "หน้าต้อนรับและข่าวสารอัปเดตของสถาบัน",
    "Welcome Interface & Institution Updates"
  );

  if (appData.profile) {
    if (appData.profile.title) {
      addItem(
        "sheet_profile_title",
        "sheet_profile",
        "ورقة Profile (الرئيسية والواجهة)",
        "العنوان الرئيسي للمؤسسة",
        appData.profile.title,
        "สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันนูน",
        "Yousuf Dhannoon Arabic Calligraphy Institute"
      );
    }
    if (appData.profile.description) {
      addItem(
        "sheet_profile_desc",
        "sheet_profile",
        "ورقة Profile (الرئيسية والواجهة)",
        "الوصف الترحيبي للمؤسسة",
        appData.profile.description
      );
    }
    if (appData.profile.loginButtonText) {
      addItem(
        "sheet_profile_login_btn",
        "sheet_profile",
        "ورقة Profile (الرئيسية والواجهة)",
        "نص زر تسجيل الدخول",
        appData.profile.loginButtonText,
        "เข้าสู่ระบบ",
        "Login"
      );
    }
    if (appData.profile.features && Array.isArray(appData.profile.features)) {
      appData.profile.features.forEach((feat, idx) => {
        if (feat.title) {
          addItem(
            `sheet_profile_feat_${idx + 1}_title`,
            "sheet_profile",
            "ورقة Profile (الرئيسية والواجهة)",
            `ميزة ${idx + 1} - العنوان`,
            feat.title
          );
        }
        if (feat.description) {
          addItem(
            `sheet_profile_feat_${idx + 1}_desc`,
            "sheet_profile",
            "ورقة Profile (الرئيسية والواجهة)",
            `ميزة ${idx + 1} - الوصف`,
            feat.description
          );
        }
      });
    }
  }

  // Home Cards inside Profile Sheet
  if (appData.homeCards && Array.isArray(appData.homeCards)) {
    appData.homeCards.forEach((card, idx) => {
      if (card.title) {
        addItem(
          `sheet_home_card_${idx + 1}_title`,
          "sheet_profile",
          "ورقة Profile (الرئيسية والواجهة)",
          `بطاقة رئيسية ${idx + 1} - العنوان`,
          card.title
        );
      }
      if (card.description) {
        addItem(
          `sheet_home_card_${idx + 1}_desc`,
          "sheet_profile",
          "ورقة Profile (الرئيسية والواجهة)",
          `بطاقة رئيسية ${idx + 1} - الوصف`,
          card.description
        );
      }
      if (card.buttonText) {
        addItem(
          `sheet_home_card_${idx + 1}_btn`,
          "sheet_profile",
          "ورقة Profile (الرئيسية والواجهة)",
          `بطاقة رئيسية ${idx + 1} - زر الإجراء`,
          card.buttonText
        );
      }
    });
  }

  // -------------------------------------------------------------
  // 2. ورقة About (عن المؤسسة والسيرة الذاتية)
  // -------------------------------------------------------------
  addItem(
    "about_extra_title",
    "sheet_about",
    "ورقة About (عن المؤسسة)",
    "عنوان أقسام ومعلومات المؤسسة الإضافية",
    appData.customTexts?.aboutExtraTitle || "أقسام ومعلومات المؤسسة الإضافية",
    "หมวดหมู่และข้อมูลเพิ่มเติมของสถาบัน",
    "Additional Sections & Information"
  );

  if (appData.sectionHeaders?.about) {
    const h = appData.sectionHeaders.about;
    if (h.badge) {
      addItem("sheet_about_header_badge", "sheet_about", "ورقة About (عن المؤسسة)", "شارة قسم عن المؤسسة", h.badge);
    }
    if (h.title) {
      addItem("sheet_about_header_title", "sheet_about", "ورقة About (عن المؤسسة)", "عنوان قسم عن المؤسسة", h.title);
    }
    if (h.description) {
      addItem("sheet_about_header_desc", "sheet_about", "ورقة About (عن المؤسسة)", "وصف قسم عن المؤسسة", h.description);
    }
  }

  if (appData.biography) {
    const b = appData.biography;
    if (b.bioTitle) {
      addItem("sheet_about_bio_title", "sheet_about", "ورقة About (عن المؤسسة)", "عنوان السيرة الذاتية", b.bioTitle);
    }
    if (b.bioDesc1) {
      addItem("sheet_about_bio_desc1", "sheet_about", "ورقة About (عن المؤسسة)", "فقرة السيرة الأولى", b.bioDesc1);
    }
    if (b.bioDesc2) {
      addItem("sheet_about_bio_desc2", "sheet_about", "ورقة About (عن المؤسسة)", "فقرة السيرة الثانية", b.bioDesc2);
    }
    if (b.bioName) {
      addItem("sheet_about_bio_name", "sheet_about", "ورقة About (عن المؤسسة)", "اسم صاحب السيرة", b.bioName);
    }
    if (b.bioSubtitle) {
      addItem("sheet_about_bio_subtitle", "sheet_about", "ورقة About (عن المؤسسة)", "لقب صاحب السيرة", b.bioSubtitle);
    }
  }

  if (appData.aboutCards && Array.isArray(appData.aboutCards)) {
    appData.aboutCards.forEach((card, idx) => {
      if (card.title) {
        addItem(
          `sheet_about_card_${idx + 1}_title`,
          "sheet_about",
          "ورقة About (عن المؤسسة)",
          `بطاقة من نحن ${idx + 1} - العنوان`,
          card.title
        );
      }
      if (card.description) {
        addItem(
          `sheet_about_card_${idx + 1}_desc`,
          "sheet_about",
          "ورقة About (عن المؤسسة)",
          `بطاقة من نحن ${idx + 1} - الوصف`,
          card.description
        );
      }
      if (card.buttonText) {
        addItem(
          `sheet_about_card_${idx + 1}_btn`,
          "sheet_about",
          "ورقة About (عن المؤسسة)",
          `بطاقة من نحن ${idx + 1} - زر الإجراء`,
          card.buttonText
        );
      }
    });
  }

  // -------------------------------------------------------------
  // 3. ورقة Artwork (معرض الصور واللوحات)
  // -------------------------------------------------------------
  if (appData.sectionHeaders?.artwork) {
    const h = appData.sectionHeaders.artwork;
    if (h.badge) addItem("sheet_artwork_header_badge", "sheet_artwork", "ورقة Artwork (معرض اللوحات)", "شارة المعرض", h.badge);
    if (h.title) addItem("sheet_artwork_header_title", "sheet_artwork", "ورقة Artwork (معرض اللوحات)", "عنوان المعرض", h.title);
    if (h.description) addItem("sheet_artwork_header_desc", "sheet_artwork", "ورقة Artwork (معرض اللوحات)", "وصف المعرض", h.description);
  }

  if (appData.artworkCards && Array.isArray(appData.artworkCards)) {
    appData.artworkCards.forEach((card, idx) => {
      if (card.title) {
        addItem(
          `sheet_artwork_card_${idx + 1}_title`,
          "sheet_artwork",
          "ورقة Artwork (معرض اللوحات)",
          `لوحة ${idx + 1} - العنوان`,
          card.title
        );
      }
      if (card.description) {
        addItem(
          `sheet_artwork_card_${idx + 1}_desc`,
          "sheet_artwork",
          "ورقة Artwork (معرض اللوحات)",
          `لوحة ${idx + 1} - الوصف`,
          card.description
        );
      }
      if (card.buttonText) {
        addItem(
          `sheet_artwork_card_${idx + 1}_btn`,
          "sheet_artwork",
          "ورقة Artwork (معرض اللوحات)",
          `لوحة ${idx + 1} - زر الإجراء`,
          card.buttonText
        );
      }
    });
  }

  // -------------------------------------------------------------
  // 4. ورقة فيديو / Video (الفيديوهات والمرئيات)
  // -------------------------------------------------------------
  if (appData.sectionHeaders?.video) {
    const h = appData.sectionHeaders.video;
    if (h.badge) addItem("sheet_video_header_badge", "sheet_video", "ورقة فيديو (الفيديوهات والمرئيات)", "شارة الفيديوهات", h.badge);
    if (h.title) addItem("sheet_video_header_title", "sheet_video", "ورقة فيديو (الفيديوهات والمرئيات)", "عنوان الفيديوهات", h.title);
    if (h.description) addItem("sheet_video_header_desc", "sheet_video", "ورقة فيديو (الفيديوهات والمرئيات)", "وصف الفيديوهات", h.description);
  }

  if (appData.videoCards && Array.isArray(appData.videoCards)) {
    appData.videoCards.forEach((card, idx) => {
      if (card.title) {
        addItem(
          `sheet_video_card_${idx + 1}_title`,
          "sheet_video",
          "ورقة فيديو (الفيديوهات والمرئيات)",
          `فيديو ${idx + 1} - العنوان`,
          card.title
        );
      }
      if (card.description) {
        addItem(
          `sheet_video_card_${idx + 1}_desc`,
          "sheet_video",
          "ورقة فيديو (الفيديوهات والمرئيات)",
          `فيديو ${idx + 1} - الوصف`,
          card.description
        );
      }
      if (card.buttonText) {
        addItem(
          `sheet_video_card_${idx + 1}_btn`,
          "sheet_video",
          "ورقة فيديو (الفيديوهات والمرئيات)",
          `فيديو ${idx + 1} - زر الإجراء`,
          card.buttonText
        );
      }
    });
  }

  // -------------------------------------------------------------
  // 5. ورقة Courses (البرامج والمناهج التعليمية)
  // -------------------------------------------------------------
  if (appData.sectionHeaders?.courses) {
    const h = appData.sectionHeaders.courses;
    if (h.badge) addItem("sheet_courses_header_badge", "sheet_courses", "ورقة Courses (البرامج التعليمية)", "شارة البرامج", h.badge);
    if (h.title) addItem("sheet_courses_header_title", "sheet_courses", "ورقة Courses (البرامج التعليمية)", "عنوان البرامج", h.title);
    if (h.description) addItem("sheet_courses_header_desc", "sheet_courses", "ورقة Courses (البرامج التعليمية)", "وصف البرامج", h.description);
  }

  if (appData.coursesCards && Array.isArray(appData.coursesCards)) {
    appData.coursesCards.forEach((card, idx) => {
      if (card.title) {
        addItem(
          `sheet_courses_card_${idx + 1}_title`,
          "sheet_courses",
          "ورقة Courses (البرامج التعليمية)",
          `برنامج ${idx + 1} - العنوان`,
          card.title
        );
      }
      if (card.description) {
        addItem(
          `sheet_courses_card_${idx + 1}_desc`,
          "sheet_courses",
          "ورقة Courses (البرامج التعليمية)",
          `برنامج ${idx + 1} - الوصف`,
          card.description
        );
      }
      if (card.buttonText) {
        addItem(
          `sheet_courses_card_${idx + 1}_btn`,
          "sheet_courses",
          "ورقة Courses (البرامج التعليمية)",
          `برنامج ${idx + 1} - زر الإجراء`,
          card.buttonText
        );
      }
    });
  }

  // -------------------------------------------------------------
  // 6. ورقة Tools (أدوات ومستلزمات الخط)
  // -------------------------------------------------------------
  if (appData.sectionHeaders?.tools) {
    const h = appData.sectionHeaders.tools;
    if (h.badge) addItem("sheet_tools_header_badge", "sheet_tools", "ورقة Tools (أدوات ومستلزمات الخط)", "شارة قسم الأدوات", h.badge);
    if (h.title) addItem("sheet_tools_header_title", "sheet_tools", "ورقة Tools (أدوات ومستلزمات الخط)", "عنوان قسم الأدوات", h.title);
    if (h.description) addItem("sheet_tools_header_desc", "sheet_tools", "ورقة Tools (أدوات ومستلزمات الخط)", "وصف قسم الأدوات", h.description);
  }

  if (appData.toolsCards && Array.isArray(appData.toolsCards)) {
    appData.toolsCards.forEach((card, idx) => {
      if (card.title) {
        addItem(
          `sheet_tools_card_${idx + 1}_title`,
          "sheet_tools",
          "ورقة Tools (أدوات ومستلزمات الخط)",
          `أداة ${idx + 1} - الاسم`,
          card.title
        );
      }
      if (card.description) {
        addItem(
          `sheet_tools_card_${idx + 1}_desc`,
          "sheet_tools",
          "ورقة Tools (أدوات ومستلزمات الخط)",
          `أداة ${idx + 1} - الوصف والمواصفات`,
          card.description
        );
      }
      if (card.buttonText) {
        addItem(
          `sheet_tools_card_${idx + 1}_btn`,
          "sheet_tools",
          "ورقة Tools (أدوات ومستلزمات الخط)",
          `أداة ${idx + 1} - زر الإجراء`,
          card.buttonText
        );
      }
    });
  }

  // -------------------------------------------------------------
  // 7. ورقة Contact (تواصل معنا والاتصال)
  // -------------------------------------------------------------
  if (appData.contactInfo) {
    const c = appData.contactInfo;
    if (c.badge) addItem("sheet_contact_badge", "sheet_contact", "ورقة Contact (تواصل معنا)", "شارة التواصل", c.badge);
    if (c.title) addItem("sheet_contact_title", "sheet_contact", "ورقة Contact (تواصل معنا)", "عنوان قسم التواصل", c.title);
    if (c.description) addItem("sheet_contact_desc", "sheet_contact", "ورقة Contact (تواصل معنا)", "وصف قسم التواصل", c.description);
    if (c.panelTitle) addItem("sheet_contact_panel_title", "sheet_contact", "ورقة Contact (تواصل معنا)", "عنوان لوحة المقر", c.panelTitle);
    if (c.panelDescription) addItem("sheet_contact_panel_desc", "sheet_contact", "ورقة Contact (تواصل معنا)", "وصف لوحة المقر", c.panelDescription);
    if (c.contactSocialLabel) addItem("sheet_contact_social_label", "sheet_contact", "ورقة Contact (تواصل معنا)", "عنوان مواقع التواصل", c.contactSocialLabel);

    if (c.cards && Array.isArray(c.cards)) {
      c.cards.forEach((card, idx) => {
        if (card.title) {
          addItem(`sheet_contact_card_${idx + 1}_title`, "sheet_contact", "ورقة Contact (تواصل معنا)", `بطاقة اتصال ${idx + 1} - العنوان`, card.title);
        }
        if (card.value) {
          addItem(`sheet_contact_card_${idx + 1}_val`, "sheet_contact", "ورقة Contact (تواصل معنا)", `بطاقة اتصال ${idx + 1} - القيمة / العنوان`, card.value);
        }
      });
    }

    if (c.contactFormTitle) addItem("sheet_contact_form_title", "sheet_contact", "ورقة Contact (تواصل معنا)", "عنوان نموذج الاستفسار", c.contactFormTitle);
    if (c.contactFormLabelName) addItem("sheet_contact_form_lbl_name", "sheet_contact", "ورقة Contact (تواصل معنا)", "تسمية حقل الاسم", c.contactFormLabelName);
    if (c.contactFormLabelEmail) addItem("sheet_contact_form_lbl_email", "sheet_contact", "ورقة Contact (تواصل معنا)", "تسمية حقل البريد", c.contactFormLabelEmail);
    if (c.contactFormLabelSubject) addItem("sheet_contact_form_lbl_subject", "sheet_contact", "ورقة Contact (تواصل معنا)", "تسمية حقل الموضوع", c.contactFormLabelSubject);
    if (c.contactFormLabelMessage) addItem("sheet_contact_form_lbl_message", "sheet_contact", "ورقة Contact (تواصل معنا)", "تسمية حقل الرسالة", c.contactFormLabelMessage);
    if (c.contactFormPlaceholderName) addItem("sheet_contact_form_ph_name", "sheet_contact", "ورقة Contact (تواصل معنا)", "تلميح حقل الاسم", c.contactFormPlaceholderName);
    if (c.contactFormPlaceholderEmail) addItem("sheet_contact_form_ph_email", "sheet_contact", "ورقة Contact (تواصل معنا)", "تلميح حقل البريد", c.contactFormPlaceholderEmail);
    if (c.contactFormPlaceholderSubject) addItem("sheet_contact_form_ph_subject", "sheet_contact", "ورقة Contact (تواصل معنا)", "تلميح حقل الموضوع", c.contactFormPlaceholderSubject);
    if (c.contactFormPlaceholderMessage) addItem("sheet_contact_form_ph_message", "sheet_contact", "ورقة Contact (تواصل معنا)", "تلميح حقل الرسالة", c.contactFormPlaceholderMessage);
    if (c.contactFormSuccessMsg) addItem("sheet_contact_form_success", "sheet_contact", "ورقة Contact (تواصل معنا)", "رسالة نجاح الإرسال", c.contactFormSuccessMsg);
    if (c.contactFormSubmitBtn) addItem("sheet_contact_form_submit_btn", "sheet_contact", "ورقة Contact (تواصل معنا)", "زر إرسال الرسالة", c.contactFormSubmitBtn);
    if (c.contactFormSendingBtn) addItem("sheet_contact_form_sending_btn", "sheet_contact", "ورقة Contact (تواصل معنا)", "نص جاري الإرسال", c.contactFormSendingBtn);
  }

  // Merge extracted sheet items with general UI translations
  const nonSheetItems = existingTranslations.filter(item => !item.category.startsWith("sheet_"));
  const allMerged = [...extractedItems, ...nonSheetItems];

  return {
    sheetItems: extractedItems,
    allTranslationsMerged: allMerged
  };
}
