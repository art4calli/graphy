/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, SheetRow } from "../types";
import { formatImageUrl, isVideoUrl, isActualMediaUrl } from "./imageUtils";

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID || "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";

// Fallback quality data
export const FALLBACK_DATA: AppData = {
  profile: {
    logoUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300",
    title: "مؤسسة يوسف ذنون للخط العربي",
    description: "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.",
    loginButtonText: "بوابة المشتركين",
    loginButtonUrl: "#login",
    features: [
      {
        title: "الترخيص الخطّي",
        description: "تمنح المؤسسة إجازات خطية معتمدة دولياً",
        icon: "users"
      },
      {
        title: "التعليم النظامي",
        description: "دورات حضورية وأخرى رقمية عن بُعد",
        icon: "graduation-cap"
      },
      {
        title: "مكتبة نادرة",
        description: "مئات الكتب والمجلدات عن الحرف والآثار",
        icon: "book-open"
      }
    ]
  },
  socialLinks: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    line: "https://line.me"
  },
  homeCards: [
    {
      type: "بطاقة",
      title: "مؤسسة يوسف ذنون للخط العربي",
      description: "أهلاً بكم في المنصة الرسمية لمؤسسة يوسف ذنون للخط العربي والآثار الإسلامية. نهدف إلى تقديم أفضل الموارد والدروس الأكاديمية لعشاق الحرف العربي.",
      media: [{ url: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800" }],
      linkUrl: "#about"
    }
  ],
  artworkCards: [],
  videoCards: [],
  coursesCards: [],
  toolsCards: [],
  aboutCards: [],
  contactCards: [],
  contactInfo: {
    badge: "نسعد دائماً بخدمتكم وتواصلكم",
    title: "تواصل معنا والتحق بنا",
    description: "لديك استفسار حول الدورات أو ترغب بطلب لوحة خطية مخصصة؟ راسلنا أو تواصل معنا عبر قنواتنا الرسمية، أو تشرفنا بزيارتك لمقر المؤسسة.",
    panelTitle: "مقر المؤسسة وقنوات التواصل",
    panelDescription: "تستقبلكم المؤسسة يومياً لاستقبال الاستفسارات وتوفير أدوات الخط الفاخرة لطلاب الحرف الشريف.",
    cards: [
      {
        title: "العنوان والموقع",
        value: "العراق، الموصل، الجانب الأيمن، قرب جامع النوري الكبير",
        icon: "map-pin"
      },
      {
        title: "رقم الهاتف",
        value: "+964 770 123 4567",
        icon: "phone"
      },
      {
        title: "البريد الإلكتروني",
        value: "info@yousifdhannoun.org",
        icon: "mail"
      },
      {
        title: "أوقات العمل",
        value: "السبت - الخميس: من ٩:٠٠ صباحاً وحتى ٥:٠٠ مساءً",
        icon: "clock"
      }
    ]
  }
};

// Parse visualization API table layout
function parseSheetTable(table: any): any[][] {
  if (!table || !table.rows) return [];
  return table.rows.map((r: any) => {
    if (!r || !r.c) return [];
    return r.c.map((cell: any) => {
      if (!cell) return "";
      if (cell.v !== null && cell.v !== undefined) {
        return cell.v.toString().trim();
      }
      return "";
    });
  });
}

// Fetch public sheets directly from the browser
export async function getSheetValuesDirect(sheetName: string): Promise<any[][]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Invalid JSON wrap from Google Sheets");
    }
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonStr);
    return parseSheetTable(data.table);
  } catch (error) {
    console.error(`Error fetching sheet [${sheetName}] directly inside browser:`, error);
    return [];
  }
}

// Map standard spreadsheet content row
function mapContentRow(row: any[]): SheetRow | null {
  if (!row || row.length < 1) return null;
  
  // Helper to check if a string is a genuine media URL
  const isUrl = (str: string): boolean => {
    return isActualMediaUrl(str);
  };

  let type = "";
  let title = "";
  let description = "";
  const media: { url: string }[] = [];
  let linkUrl = "";
  let buttonText = "";

  const col0 = row[0] ? row[0].toString().trim() : "";
  const col1 = row[1] ? row[1].toString().trim() : "";
  const col2 = row[2] ? row[2].toString().trim() : "";

  const standardTypes = ["بطاقة", "معرض", "بطاقه", "سلايدر", "فيديو", "صورة", "صوره", "من نحن", "اتصال", "روابط", "كارد"];
  const isCol0Type = col0 && standardTypes.includes(col0);

  if (isCol0Type) {
    // Column A contains a standard card type
    type = col0;
    title = col1;
    description = col2;
    
    // Media URLs are indices 3 to 12
    for (let j = 3; j <= 12; j++) {
      const rawUrl = row[j] ? row[j].toString().trim() : "";
      if (rawUrl && rawUrl !== "-" && rawUrl !== "" && isActualMediaUrl(rawUrl)) {
        media.push({ url: formatImageUrl(rawUrl) || rawUrl });
      }
    }
    linkUrl = row[13] ? row[13].toString().trim() : "";
    buttonText = row[14] ? row[14].toString().trim() : "";
  } else {
    // Column A is omitted or empty
    if (col0 && !isUrl(col0)) {
      // Column A has Title, Column B has Description
      type = "";
      title = col0;
      description = col1;
      
      // Media URLs start at index 2 (Column C) to 11
      for (let j = 2; j <= 11; j++) {
        const rawUrl = row[j] ? row[j].toString().trim() : "";
        if (rawUrl && rawUrl !== "-" && rawUrl !== "" && isActualMediaUrl(rawUrl)) {
          media.push({ url: formatImageUrl(rawUrl) || rawUrl });
        }
      }
      linkUrl = row[12] ? row[12].toString().trim() : "";
      buttonText = row[13] ? row[13].toString().trim() : "";
    } else {
      // Column A is empty, Column B is Title, Column C is Description
      type = "";
      title = col1;
      description = col2;

      // Media URLs start at index 3 (Column D) to 12
      for (let j = 3; j <= 12; j++) {
        const rawUrl = row[j] ? row[j].toString().trim() : "";
        if (rawUrl && rawUrl !== "-" && rawUrl !== "" && isActualMediaUrl(rawUrl)) {
          media.push({ url: formatImageUrl(rawUrl) || rawUrl });
        }
      }
      linkUrl = row[13] ? row[13].toString().trim() : "";
      buttonText = row[14] ? row[14].toString().trim() : "";
    }
  }

  if (!title && !description) return null;

  return {
    type: type || "بطاقة",
    title,
    description,
    media,
    linkUrl: (linkUrl && linkUrl !== "-") ? linkUrl : undefined,
    buttonText: (buttonText && buttonText !== "-") ? buttonText : undefined
  };
}

function normalizeKey(str: string): string {
  if (!str) return "";
  let res = str.toString().trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

  // Robustly convert Arabic numerals to English numerals to support either system in the Google Sheets
  const arabicNums = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  for (let i = 0; i < 10; i++) {
    res = res.split(arabicNums[i]).join(i.toString());
  }
  return res;
}

function extractSectionMetadata(rows: any[][], sheetType: "about" | "standard" | "profile" | "contact" = "standard"): {
  cleanRows: any[][];
  metadata: {
    sectionTitle?: string;
    sectionDescription?: string;
    sectionBadge?: string;
    sectionButtonText?: string;
    [key: string]: any;
  };
} {
  const cleanRows: any[][] = [];
  const metadata: Record<string, any> = {};

  if (!rows || rows.length === 0) {
    return { cleanRows: [], metadata };
  }

  // Row 1 is usually headers, so keep it
  if (rows.length > 0) {
    cleanRows.push(rows[0]);
  }

  // contact and profile have their own custom index-based parsing, so return them completely unchanged
  if (sheetType === "contact" || sheetType === "profile") {
    for (let i = 1; i < rows.length; i++) {
      cleanRows.push(rows[i]);
    }
    return { cleanRows, metadata };
  }

  const METADATA_KEYS_NORMALIZED = [
    "عنوانالقسم",
    "وصفالقسم",
    "شارهالقسم",
    "سيرهالاسم",
    "سيرهاللقب",
    "سيرهالعنوان",
    "سيرهالوصف",
    "سيرهالوصف2",
    "سيرهالصوره",
    "احصائيه1الرقم",
    "احصائيه1العنوان",
    "احصائيه2الرقم",
    "احصائيه2العنوان",
    "احصائيه3الرقم",
    "احصائيه3العنوان",
    "عنوانالزر",
    "نصالزر"
  ];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Scan columns P and Q (index 15 and 16) for biography metadata overrides
    if (row.length > 15) {
      const pKey = row[15] ? row[15].toString().trim() : "";
      const qVal = row[16] ? row[16].toString().trim() : "";
      if (pKey) {
        const normP = normalizeKey(pKey);
        if (normP === "سيرهالاسم" || normP === "الاسم" || normP === "الاسمالكامل") metadata.bioName = qVal;
        else if (normP === "سيرهاللقب" || normP === "اللقب" || normP === "تاريخ") metadata.bioSubtitle = qVal;
        else if (normP === "سيرهالعنوان" || normP === "العنوان") metadata.bioTitle = qVal;
        else if (normP === "سيرهالوصف" || normP === "الوصف" || normP === "النصالاول" || normP === "الوصفالاول") metadata.bioDesc1 = qVal;
        else if (normP === "سيرهالوصف2" || normP === "الوصف2" || normP === "النصالثاني" || normP === "الوصفالثاني") metadata.bioDesc2 = qVal;
        else if (normP === "سيرهالصوره" || normP === "الصوره" || normP === "رابطالصوره") metadata.bioImage = qVal;
        else if (normP === "احصائيه1الرقم" || normP === "الرقم1" || normP === "احصائيه1") metadata.stat1Value = qVal;
        else if (normP === "احصائيه1العنوان" || normP === "الاسم1") metadata.stat1Label = qVal;
        else if (normP === "احصائيه2الرقم" || normP === "الرقم2" || normP === "احصائيه2") metadata.stat2Value = qVal;
        else if (normP === "احصائيه2العنوان" || normP === "الاسم2") metadata.stat2Label = qVal;
        else if (normP === "احصائيه3الرقم" || normP === "الرقم3" || normP === "احصائيه3") metadata.stat3Value = qVal;
        else if (normP === "احصائيه3العنوان" || normP === "الاسم3") metadata.stat3Label = qVal;
      }
    }

    const firstCell = row[0] ? row[0].toString().trim() : "";
    const secondCell = row[1] ? row[1].toString().trim() : "";
    const thirdCell = row[2] ? row[2].toString().trim() : "";

    const normKeyA = normalizeKey(firstCell);
    const normKeyB = normalizeKey(secondCell);

    // Determine if this row is a metadata row strictly based on key matching
    const isMetadataByKey = METADATA_KEYS_NORMALIZED.includes(normKeyA) || METADATA_KEYS_NORMALIZED.includes(normKeyB);

    if (isMetadataByKey) {
      // It is a metadata row. Extract the key-value pair and exclude from cleanRows.
      let keyToUse = "";
      let val = "";

      if (METADATA_KEYS_NORMALIZED.includes(normKeyA)) {
        keyToUse = normKeyA;
        val = secondCell || thirdCell; // Col A is key, so Col B is value, fallback to Col C
      } else if (METADATA_KEYS_NORMALIZED.includes(normKeyB)) {
        keyToUse = normKeyB;
        val = thirdCell || secondCell; // Col B is key, so Col C is value, fallback to Col B
      }

      if (keyToUse) {
        if (keyToUse === "عنوانالقسم") metadata.sectionTitle = val;
        else if (keyToUse === "وصفالقسم") metadata.sectionDescription = val;
        else if (keyToUse === "شارهالقسم") metadata.sectionBadge = val;
        else if (keyToUse === "سيرهالاسم") metadata.bioName = val;
        else if (keyToUse === "سيرهاللقب") metadata.bioSubtitle = val;
        else if (keyToUse === "سيرهالعنوان") metadata.bioTitle = val;
        else if (keyToUse === "سيرهالوصف") metadata.bioDesc1 = val;
        else if (keyToUse === "سيرهالوصف2") metadata.bioDesc2 = val;
        else if (keyToUse === "سيرهالصوره") metadata.bioImage = val;
        else if (keyToUse === "احصائيه1الرقم") metadata.stat1Value = val;
        else if (keyToUse === "احصائيه1العنوان") metadata.stat1Label = val;
        else if (keyToUse === "احصائيه2الرقم") metadata.stat2Value = val;
        else if (keyToUse === "احصائيه2العنوان") metadata.stat2Label = val;
        else if (keyToUse === "احصائيه3الرقم") metadata.stat3Value = val;
        else if (keyToUse === "احصائيه3العنوان") metadata.stat3Label = val;
        else if (keyToUse === "عنوانالزر" || keyToUse === "نصالزر") metadata.sectionButtonText = val;
      }
    } else {
      // Not a metadata row, it is a card row. Add to cleanRows.
      cleanRows.push(row);
    }
  }

  return { cleanRows, metadata };
}

// Full client-side assembler
export async function fetchAllAppDataDirect(): Promise<AppData> {
  const [
    profileRows,
    artworkRows,
    videoRows,
    coursesRows,
    toolsRows,
    contactRows,
    aboutRows,
    textsRows,
    transRows
  ] = await Promise.all([
    getSheetValuesDirect("Profile").catch(() => []),
    getSheetValuesDirect("Artwork").catch(() => []),
    getSheetValuesDirect("فيديو").catch(() => []),
    getSheetValuesDirect("Courses").catch(() => []),
    getSheetValuesDirect("Tools").catch(() => []),
    getSheetValuesDirect("Contact").catch(() => []),
    getSheetValuesDirect("About").catch(() => []),
    getSheetValuesDirect("نصوص").catch(() => []).then(rows => rows && rows.length > 0 ? rows : getSheetValuesDirect("Texts").catch(() => [])),
    getSheetValuesDirect("SiteTranslations").catch(() => []).then(rows => rows && rows.length > 0 ? rows : getSheetValuesDirect("ترجمات الموقع").catch(() => []))
  ]);

  // Extract Metadata & clean the records of section helpers with explicit sheetType parameters
  const { cleanRows: cleanProfileRows, metadata: profileMeta } = extractSectionMetadata(profileRows, "profile");
  const { cleanRows: cleanArtworkRows, metadata: artworkMeta } = extractSectionMetadata(artworkRows, "standard");
  const { cleanRows: cleanVideoRows, metadata: videoMeta } = extractSectionMetadata(videoRows, "standard");
  const { cleanRows: cleanCoursesRows, metadata: coursesMeta } = extractSectionMetadata(coursesRows, "standard");
  const { cleanRows: cleanToolsRows, metadata: toolsMeta } = extractSectionMetadata(toolsRows, "standard");
  const { cleanRows: cleanAboutRows, metadata: aboutMeta } = extractSectionMetadata(aboutRows, "standard");

  let logoUrl = FALLBACK_DATA.profile.logoUrl;
  let title = "مؤسسة يوسف ذنون للخط العربي";
  let description = "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.";
  let loginButtonText = "بوابة المشتركين";
  let loginButtonUrl = "#login";
  let headerBgUrl = "";
  const features: any[] = [];

  if (cleanProfileRows && cleanProfileRows.length > 1) {
    if (cleanProfileRows[1] && cleanProfileRows[1][2]) logoUrl = cleanProfileRows[1][2];
    if (cleanProfileRows[1] && cleanProfileRows[1][1]) title = cleanProfileRows[1][1];
    if (cleanProfileRows[2] && cleanProfileRows[2][1]) description = cleanProfileRows[2][1];
    // Column D of Row 2 is index 3 (cell D2)
    if (cleanProfileRows[1] && cleanProfileRows[1][3]) headerBgUrl = cleanProfileRows[1][3];
  }

  // Parse features dynamically from Rows 4 to 8 (index 3 to 7)
  if (cleanProfileRows && cleanProfileRows.length > 3) {
    const limit = Math.min(cleanProfileRows.length, 9);
    for (let i = 3; i < limit; i++) {
      const row = cleanProfileRows[i];
      if (row && row.length > 1) {
        const fTitle = row[1] ? row[1].toString().trim() : "";
        const fDesc = row[2] ? row[2].toString().trim() : "";
        const fIcon = row[3] ? row[3].toString().trim() : "";
        if (fTitle || fDesc) {
          features.push({
            title: fTitle,
            description: fDesc,
            icon: fIcon || "star" // fallback icon name
          });
        }
      }
    }
  }

  let socialLinks = { ...FALLBACK_DATA.socialLinks };
  let contactInfo = { ...FALLBACK_DATA.contactInfo };
  const contactCards: SheetRow[] = [];

  // Check if contactRows contains the new structured keywords in Column A of any row
  let isNewStructuredFormat = false;
  if (contactRows && contactRows.length > 1) {
    for (let i = 1; i < contactRows.length; i++) {
      const typeVal = contactRows[i][0] ? contactRows[i][0].toString().trim() : "";
      if (
        typeVal === "شارة البداية" ||
        typeVal === "العنوان الرئيسي" ||
        typeVal === "الوصف الرئيسي" ||
        typeVal === "عنوان اللوحة" ||
        typeVal === "وصف اللوحة" ||
        typeVal === "بطاقة تواصل" ||
        typeVal === "فيسبوك" ||
        typeVal === "إنستغرام" ||
        typeVal === "يوتيوب" ||
        typeVal === "لاين" ||
        typeVal === "عنوان مواقع التواصل" ||
        typeVal === "تابعونا على مواقع التواصل" ||
        typeVal === "عنوان الاستفسار" ||
        typeVal === "عنوان نموذج التواصل" ||
        typeVal === "عنوان النموذج" ||
        typeVal === "حقل الاسم" ||
        typeVal === "الاسم" ||
        typeVal === "حقل البريد" ||
        typeVal === "البريد الإلكتروني" ||
        typeVal === "حقل الموضوع" ||
        typeVal === "الموضوع" ||
        typeVal === "حقل الرسالة" ||
        typeVal === "الرسالة" ||
        typeVal === "تلميح الاسم" ||
        typeVal === "تلميح البريد" ||
        typeVal === "تلميح الموضوع" ||
        typeVal === "تلميح الرسالة" ||
        typeVal === "رسالة النجاح" ||
        typeVal === "زر الإرسال" ||
        typeVal === "زر الارسال" ||
        typeVal === "جاري الإرسال" ||
        typeVal === "جاري الارسال"
      ) {
        isNewStructuredFormat = true;
        break;
      }
    }
  }

  if (isNewStructuredFormat && contactRows) {
    const parsedCards: any[] = [];
    let badge = FALLBACK_DATA.contactInfo?.badge;
    let titleText = FALLBACK_DATA.contactInfo?.title;
    let descText = FALLBACK_DATA.contactInfo?.description;
    let panelTitleText = FALLBACK_DATA.contactInfo?.panelTitle;
    let panelDescText = FALLBACK_DATA.contactInfo?.panelDescription;

    let contactSocialLabel: string | undefined = undefined;
    let contactFormTitle: string | undefined = undefined;
    let contactFormLabelName: string | undefined = undefined;
    let contactFormLabelEmail: string | undefined = undefined;
    let contactFormLabelSubject: string | undefined = undefined;
    let contactFormLabelMessage: string | undefined = undefined;
    let contactFormPlaceholderName: string | undefined = undefined;
    let contactFormPlaceholderEmail: string | undefined = undefined;
    let contactFormPlaceholderSubject: string | undefined = undefined;
    let contactFormPlaceholderMessage: string | undefined = undefined;
    let contactFormSuccessMsg: string | undefined = undefined;
    let contactFormSubmitBtn: string | undefined = undefined;
    let contactFormSendingBtn: string | undefined = undefined;

    for (let i = 1; i < contactRows.length; i++) {
      const row = contactRows[i];
      if (!row || row.length === 0) continue;

      const rowType = row[0] ? row[0].toString().trim() : "";
      const rowTitle = row[1] ? row[1].toString().trim() : "";
      const rowValue = row[2] ? row[2].toString().trim() : "";
      const rowIconLink = row[3] ? row[3].toString().trim() : "";

      if (rowType === "شارة البداية") {
        badge = rowValue || rowTitle || badge;
      } else if (rowType === "العنوان الرئيسي") {
        titleText = rowValue || rowTitle || titleText;
      } else if (rowType === "الوصف الرئيسي") {
        descText = rowValue || rowTitle || descText;
      } else if (rowType === "عنوان اللوحة") {
        panelTitleText = rowValue || rowTitle || panelTitleText;
      } else if (rowType === "وصف اللوحة") {
        panelDescText = rowValue || rowTitle || panelDescText;
      } else if (rowType === "بطاقة تواصل") {
        if (rowTitle || rowValue) {
          parsedCards.push({
            title: rowTitle,
            value: rowValue,
            icon: rowIconLink || "star"
          });
        }
      } else if (rowType === "فيسبوك") {
        socialLinks.facebook = rowValue || rowIconLink || socialLinks.facebook;
      } else if (rowType === "إنستغرام") {
        socialLinks.instagram = rowValue || rowIconLink || socialLinks.instagram;
      } else if (rowType === "يوتيوب") {
        socialLinks.youtube = rowValue || rowIconLink || socialLinks.youtube;
      } else if (rowType === "لاين") {
        socialLinks.line = rowValue || rowIconLink || socialLinks.line;
      } else if (rowType === "عنوان مواقع التواصل" || rowType === "تابعونا على مواقع التواصل" || rowType === "مواقع التواصل") {
        contactSocialLabel = rowValue || rowTitle;
      } else if (rowType === "عنوان الاستفسار" || rowType === "عنوان نموذج التواصل" || rowType === "عنوان النموذج" || rowType === "إرسال استفسار مباشر" || rowType === "ارسال استفسار مباشر") {
        contactFormTitle = rowValue || rowTitle;
      } else if (rowType === "تسمية حقل الاسم" || rowType === "تسمية الاسم" || rowType === "حقل الاسم" || rowType === "الاسم") {
        contactFormLabelName = rowValue || rowTitle;
      } else if (rowType === "تسمية حقل البريد" || rowType === "تسمية البريد" || rowType === "حقل البريد" || rowType === "البريد" || rowType === "البريد الإلكتروني" || rowType === "البريد الالكتروني") {
        contactFormLabelEmail = rowValue || rowTitle;
      } else if (rowType === "تسمية حقل الموضوع" || rowType === "تسمية الموضوع" || rowType === "حقل الموضوع" || rowType === "الموضوع" || rowType === "موضوع الرسالة" || rowType === "موضوع الرساله") {
        contactFormLabelSubject = rowValue || rowTitle;
      } else if (rowType === "تسمية حقل الرسالة" || rowType === "تسمية الرسالة" || rowType === "حقل الرسالة" || rowType === "الرسالة" || rowType === "الرساله" || rowType === "مضمون الرسالة" || rowType === "مضمون الرساله") {
        contactFormLabelMessage = rowValue || rowTitle;
      } else if (rowType === "تلميح حقل الاسم" || rowType === "تلميح الاسم" || rowType === "تلميح اسم") {
        contactFormPlaceholderName = rowValue || rowTitle;
      } else if (rowType === "تلميح حقل البريد" || rowType === "تلميح البريد" || rowType === "تلميح بريد") {
        contactFormPlaceholderEmail = rowValue || rowTitle;
      } else if (rowType === "تلميح حقل الموضوع" || rowType === "تلميح الموضوع" || rowType === "تلميح موضوع") {
        contactFormPlaceholderSubject = rowValue || rowTitle;
      } else if (rowType === "تلميح حقل الرسالة" || rowType === "تلميح الرسالة" || rowType === "تلميح رسالة" || rowType === "تلميح رساله") {
        contactFormPlaceholderMessage = rowValue || rowTitle;
      } else if (rowType === "رسالة النجاح" || rowType === "نص النجاح" || rowType === "تم الارسال بنجاح" || rowType === "تم الإرسال بنجاح") {
        contactFormSuccessMsg = rowValue || rowTitle;
      } else if (rowType === "زر الإرسال" || rowType === "زر الارسال") {
        contactFormSubmitBtn = rowValue || rowTitle;
      } else if (rowType === "جاري الإرسال" || rowType === "جاري الارسال") {
        contactFormSendingBtn = rowValue || rowTitle;
      }
    }

    contactInfo = {
      badge,
      title: titleText,
      description: descText,
      panelTitle: panelTitleText,
      panelDescription: panelDescText,
      cards: parsedCards.length > 0 ? parsedCards : (FALLBACK_DATA.contactInfo?.cards || []),
      contactSocialLabel,
      contactFormTitle,
      contactFormLabelName,
      contactFormLabelEmail,
      contactFormLabelSubject,
      contactFormLabelMessage,
      contactFormPlaceholderName,
      contactFormPlaceholderEmail,
      contactFormPlaceholderSubject,
      contactFormPlaceholderMessage,
      contactFormSuccessMsg,
      contactFormSubmitBtn,
      contactFormSendingBtn
    };
  } else {
    // Old style fallback:
    if (contactRows && contactRows.length > 0 && contactRows[0]) {
      socialLinks.facebook = contactRows[0][0] || socialLinks.facebook;
      socialLinks.instagram = contactRows[0][1] || socialLinks.instagram;
      socialLinks.youtube = contactRows[0][2] || socialLinks.youtube;
      socialLinks.line = contactRows[0][3] || socialLinks.line;
    }

    if (contactRows && contactRows.length > 8) {
      for (let i = 8; i < contactRows.length; i++) {
        const mapped = mapContentRow(contactRows[i]);
        if (mapped) contactCards.push(mapped);
      }
    }
  }

  const homeCards: SheetRow[] = [];
  if (cleanProfileRows && cleanProfileRows.length > 10) {
    for (let i = 10; i < cleanProfileRows.length; i++) {
      const mapped = mapContentRow(cleanProfileRows[i]);
      if (mapped) homeCards.push(mapped);
    }
  }

  const aboutCards: SheetRow[] = [];
  if (cleanAboutRows && cleanAboutRows.length > 1) {
    for (let i = 1; i < cleanAboutRows.length; i++) {
      const mapped = mapContentRow(cleanAboutRows[i]);
      if (mapped) aboutCards.push(mapped);
    }
  }

  const artworkCards: SheetRow[] = [];
  if (cleanArtworkRows && cleanArtworkRows.length > 1) {
    for (let i = 1; i < cleanArtworkRows.length; i++) {
      const mapped = mapContentRow(cleanArtworkRows[i]);
      if (mapped) artworkCards.push(mapped);
    }
  }

  const videoCards: SheetRow[] = [];
  if (cleanVideoRows && cleanVideoRows.length > 1) {
    for (let i = 1; i < cleanVideoRows.length; i++) {
      const mapped = mapContentRow(cleanVideoRows[i]);
      if (mapped) videoCards.push(mapped);
    }
  }

  const coursesCards: SheetRow[] = [];
  if (cleanCoursesRows && cleanCoursesRows.length > 1) {
    for (let i = 1; i < cleanCoursesRows.length; i++) {
      const mapped = mapContentRow(cleanCoursesRows[i]);
      if (mapped) coursesCards.push(mapped);
    }
  }

  const toolsCards: SheetRow[] = [];
  if (cleanToolsRows && cleanToolsRows.length > 1) {
    for (let i = 1; i < cleanToolsRows.length; i++) {
      const mapped = mapContentRow(cleanToolsRows[i]);
      if (mapped) toolsCards.push(mapped);
    }
  }

  const sectionHeaders: Record<string, { badge?: string; title?: string; description?: string; buttonText?: string }> = {
    artwork: {
      badge: artworkMeta.sectionBadge || undefined,
      title: artworkMeta.sectionTitle || undefined,
      description: artworkMeta.sectionDescription || undefined,
      buttonText: artworkMeta.sectionButtonText || undefined
    },
    video: {
      badge: videoMeta.sectionBadge || undefined,
      title: videoMeta.sectionTitle || undefined,
      description: videoMeta.sectionDescription || undefined,
      buttonText: videoMeta.sectionButtonText || undefined
    },
    courses: {
      badge: coursesMeta.sectionBadge || undefined,
      title: coursesMeta.sectionTitle || undefined,
      description: coursesMeta.sectionDescription || undefined,
      buttonText: coursesMeta.sectionButtonText || undefined
    },
    tools: {
      badge: toolsMeta.sectionBadge || undefined,
      title: toolsMeta.sectionTitle || undefined,
      description: toolsMeta.sectionDescription || undefined,
      buttonText: toolsMeta.sectionButtonText || undefined
    },
    about: {
      badge: aboutMeta.sectionBadge || undefined,
      title: aboutMeta.sectionTitle || undefined,
      description: aboutMeta.sectionDescription || undefined,
      buttonText: aboutMeta.sectionButtonText || undefined
    }
  };

  const biography = {
    sectionTitle: aboutMeta.sectionTitle || profileMeta.sectionTitle || undefined,
    sectionDescription: aboutMeta.sectionDescription || profileMeta.sectionDescription || undefined,
    sectionBadge: aboutMeta.sectionBadge || profileMeta.sectionBadge || undefined,
    bioName: aboutMeta.bioName || profileMeta.bioName || undefined,
    bioSubtitle: aboutMeta.bioSubtitle || profileMeta.bioSubtitle || undefined,
    bioTitle: aboutMeta.bioTitle || profileMeta.bioTitle || undefined,
    bioDesc1: aboutMeta.bioDesc1 || profileMeta.bioDesc1 || undefined,
    bioDesc2: aboutMeta.bioDesc2 || profileMeta.bioDesc2 || undefined,
    bioImage: aboutMeta.bioImage || profileMeta.bioImage || undefined,
    stat1Value: aboutMeta.stat1Value || profileMeta.stat1Value || undefined,
    stat1Label: aboutMeta.stat1Label || profileMeta.stat1Label || undefined,
    stat2Value: aboutMeta.stat2Value || profileMeta.stat2Value || undefined,
    stat2Label: aboutMeta.stat2Label || profileMeta.stat2Label || undefined,
    stat3Value: aboutMeta.stat3Value || profileMeta.stat3Value || undefined,
    stat3Label: aboutMeta.stat3Label || profileMeta.stat3Label || undefined
  };

  // Parse Texts Sheet
  const customTexts: Record<string, string> = {};
  if (textsRows && textsRows.length > 0) {
    for (let i = 0; i < textsRows.length; i++) {
      const row = textsRows[i];
      if (!row || row.length < 2) continue;
      const rawKey = row[0] ? row[0].toString().trim() : "";
      const rawVal = row[1] ? row[1].toString().trim() : "";
      if (!rawKey) continue;

      const norm = normalizeKey(rawKey);

      if (norm === "topannouncementright" || norm === "الاعلانالايمن" || norm === "اعلانالايمن") {
        customTexts.topAnnouncementRight = rawVal;
      } else if (norm === "topannouncementlocation" || norm === "الاعلانالموقع" || norm === "موقعالاعلان" || norm === "الموقع") {
        customTexts.topAnnouncementLocation = rawVal;
      } else if (norm === "topannouncementleft" || norm === "الاعلانالايسر" || norm === "اعلانالايسر") {
        customTexts.topAnnouncementLeft = rawVal;
      } else if (norm === "navbartitle" || norm === "عنوانالشريط" || norm === "عنوانالنافبار") {
        customTexts.navbarTitle = rawVal;
      } else if (norm === "navbarsubtitle" || norm === "وصفالشريط" || norm === "وصفالنافبار") {
        customTexts.navbarSubtitle = rawVal;
      } else if (norm === "navhome" || norm === "الرئيسيه" || norm === "اسمالرئيسيه") {
        customTexts.navHome = rawVal;
      } else if (norm === "navabout" || norm === "عنالمؤسسه" || norm === "اسمعنالمؤسسه" || norm === "عنالمؤسسة") {
        customTexts.navAbout = rawVal;
      } else if (norm === "navartwork" || norm === "معرضالصور" || norm === "المعرض" || norm === "المعرضالفني" || norm === "اسممعرضالصور") {
        customTexts.navArtwork = rawVal;
      } else if (norm === "navvideo" || norm === "الفيديوهات" || norm === "المرئيات" || norm === "الفيديو" || norm === "اسمالفيديوهات") {
        customTexts.navVideo = rawVal;
      } else if (norm === "navcourses" || norm === "البرامجالتعليميه" || norm === "البرامج" || norm === "الدورات" || norm === "اسمالبرامجالتعليميه" || norm === "البرامجالتعليمية") {
        customTexts.navCourses = rawVal;
      } else if (norm === "navtools" || norm === "ادواتالخط" || norm === "الادوات" || norm === "ادوات" || norm === "اسمادواتالخط" || norm === "أدواتالخط") {
        customTexts.navTools = rawVal;
      } else if (norm === "navcontact" || norm === "تواصلمعنا" || norm === "اتصلبنا" || norm === "اسمتواصلمعنا") {
        customTexts.navContact = rawVal;
      } else if (norm === "herosubtag" || norm === "شارهالترحيب" || norm === "بوابهالحرف" || norm === "شارةالترحيب") {
        customTexts.heroSubtag = rawVal;
      } else if (norm === "homesectiontitle" || norm === "عنوانالترحيب" || norm === "عنوانقسمالرئيسيه" || norm === "عنوانالرئيسيه" || norm === "عنوانالقسمالرئيسي") {
        customTexts.homeSectionTitle = rawVal;
      } else if (norm === "footertitle" || norm === "عنوانالفوتر" || norm === "عنوانالتذييل") {
        customTexts.footerTitle = rawVal;
      } else if (norm === "footerdescription" || norm === "وصفالفوتر" || norm === "وصفالتذييل") {
        customTexts.footerDescription = rawVal;
      } else if (norm === "footercopyright" || norm === "حقوقالنشر" || norm === "الحقوق") {
        customTexts.footerCopyright = rawVal;
      } else if (norm === "heroprimarybtn" || norm === "الزرالرئيسي" || norm === "زرالبرامج" || norm === "زرالدورات" || norm === "الزرالرئيسيالموقع") {
        customTexts.heroPrimaryBtn = rawVal;
      } else if (norm === "herosecondarybtn" || norm === "الزرالثانوي" || norm === "زرالمعرض" || norm === "الزرالثانويالموقع") {
        customTexts.heroSecondaryBtn = rawVal;
      } else if (norm === "topannouncementtag" || norm === "شارةالاعلان" || norm === "شارةاخبارالمؤسسه" || norm === "شارةأخبارالمؤسسة" || norm === "عنوانالشارة" || norm === "عنوانالشاره") {
        customTexts.topAnnouncementTag = rawVal;
      } else if (norm === "aboutextratitle" || norm === "اقسامومعلوماتالمؤسسةالاضافية" || norm === "اقسامومعلوماتالمؤسسهالاضافيه" || norm === "عنوانالاقسامالاضافية" || norm === "عنوانالاقسامالاضافيه") {
        customTexts.aboutExtraTitle = rawVal;
      } else if (norm === "contactsociallabel" || norm === "تابعوناعلىمواقعالتواصلالاجتماعي" || norm === "عنوانمواقعالتواصل" || norm === "عنوانالتواصلالاجتماعي") {
        customTexts.contactSocialLabel = rawVal;
      } else if (norm === "contactformtitle" || norm === "ارسالاستفسارمباشر" || norm === "إرسالاستفسارمباشر" || norm === "عنوانالاستفسار") {
        customTexts.contactFormTitle = rawVal;
      } else if (norm === "contactformlabelname" || norm === "الاسم" || norm === "حقلالاسم" || norm === "الاسم_الكريم") {
        customTexts.contactFormLabelName = rawVal;
      } else if (norm === "contactformlabelemail" || norm === "البريد_الالكتروني" || norm === "حقلالبريد" || norm === "البريد" || norm === "البريدالالكتروني" || norm === "البريدالإلكتروني") {
        customTexts.contactFormLabelEmail = rawVal;
      } else if (norm === "contactformlabelsubject" || norm === "الموضوع" || norm === "حقلالموضوع" || norm === "موضوعالرسالة" || norm === "موضوعالرساله") {
        customTexts.contactFormLabelSubject = rawVal;
      } else if (norm === "contactformlabelmessage" || norm === "الرسالة" || norm === "حقلالرسالة" || norm === "مضمونالرسالة" || norm === "مضمونالرساله" || norm === "مضمونالرسالةاوالطلب" || norm === "مضمونالرسالهاوالطلب") {
        customTexts.contactFormLabelMessage = rawVal;
      } else if (norm === "contactformplaceholdername" || norm === "تلميحالاسم" || norm === "ادخلاسمكالكامل" || norm === "أدخلاسمكالكامل") {
        customTexts.contactFormPlaceholderName = rawVal;
      } else if (norm === "contactformplaceholderemail" || norm === "تلميخالبريد" || norm === "تلميحالبريد") {
        customTexts.contactFormPlaceholderEmail = rawVal;
      } else if (norm === "contactformplaceholdersubject" || norm === "تلميحالموضوع") {
        customTexts.contactFormPlaceholderSubject = rawVal;
      } else if (norm === "contactformplaceholdermessage" || norm === "تلميحالرسالة" || norm === "تلميحالرساله" || norm === "اكتباستفساركأوتفاصيلطلبكهنا" || norm === "اكتباستفسارك") {
        customTexts.contactFormPlaceholderMessage = rawVal;
      } else if (norm === "contactformsuccessmsg" || norm === "رسالةالنجاح" || norm === "رسالهالنجاح" || norm === "تمالارسالبنجاح") {
        customTexts.contactFormSuccessMsg = rawVal;
      } else if (norm === "contactformsubmitbtn" || norm === "زرالارسال" || norm === "زرإرسالالرسالة" || norm === "زرارسالالرساله") {
        customTexts.contactFormSubmitBtn = rawVal;
      } else if (norm === "contactformsendingbtn" || norm === "جاريالارسال" || norm === "تلميحجاريالارسال" || norm === "جاريالإرسال") {
        customTexts.contactFormSendingBtn = rawVal;
      }
    }
  }

  // Parse SiteTranslations sheet if present
  const siteTranslations: any[] = [];
  if (transRows && transRows.length > 1) {
    for (let i = 1; i < transRows.length; i++) {
      const row = transRows[i];
      if (!row || !row[0]) continue;
      const id = row[0].toString().trim();
      if (!id) continue;
      siteTranslations.push({
        id,
        category: row[1] ? row[1].toString().trim() : "general",
        label: row[2] ? row[2].toString().trim() : id,
        ar: row[3] !== undefined && row[3] !== null ? row[3].toString() : "",
        th: row[4] !== undefined && row[4] !== null ? row[4].toString() : "",
        en: row[5] !== undefined && row[5] !== null ? row[5].toString() : "",
      });
    }
  }

  return {
    profile: { 
      logoUrl, 
      title, 
      description, 
      loginButtonText, 
      loginButtonUrl,
      headerBgUrl: headerBgUrl || undefined,
      features: features.length > 0 ? features : FALLBACK_DATA.profile.features
    },
    socialLinks,
    homeCards: homeCards.length > 0 ? homeCards : FALLBACK_DATA.homeCards,
    aboutCards: aboutCards.length > 0 ? aboutCards : homeCards.filter(c => c.type === "من نحن"),
    artworkCards,
    videoCards,
    coursesCards,
    toolsCards,
    contactCards,
    contactInfo,
    biography,
    sectionHeaders,
    customTexts,
    siteTranslations: siteTranslations.length > 0 ? siteTranslations : undefined
  };
}

export function parseMediaUrls(mediaRaw: string): { url: string; type?: "image" | "video" }[] {
  if (!mediaRaw || typeof mediaRaw !== "string") return [];
  const items = mediaRaw.split(/[\n,\|]+/).map(s => s.trim()).filter(Boolean);
  return items.map(rawUrl => {
    const isVid = isVideoUrl(rawUrl);
    const formattedUrl = isVid ? rawUrl : formatImageUrl(rawUrl);
    return {
      url: formattedUrl,
      type: isVid ? ("video" as const) : ("image" as const)
    };
  });
}

export function parseSubscriberTopicContent(row: any[]): SubscriberTopicContent {
  const topicId = row[0] ? row[0].toString().trim() : "1";
  const title = row[1] ? row[1].toString().trim() : "المحتوى المخصص للمشترك";
  const description = row[2] ? row[2].toString().trim() : "";
  const rawCoverImage = row[3] ? row[3].toString().trim() : "";
  const badge = row[4] ? row[4].toString().trim() : "";

  const coverImage = (rawCoverImage && rawCoverImage !== "-") ? formatImageUrl(rawCoverImage) : undefined;

  const cards: SubscriberCard[] = [];

  // Up to 10 cards starting at column F (index 5)
  for (let c = 0; c < 10; c++) {
    const baseIdx = 5 + (c * 4);
    const cardTitle = row[baseIdx] ? row[baseIdx].toString().trim() : "";
    const cardDesc = row[baseIdx + 1] ? row[baseIdx + 1].toString().trim() : "";
    const cardMediaRaw = row[baseIdx + 2] ? row[baseIdx + 2].toString().trim() : "";
    const cardLinkUrl = row[baseIdx + 3] ? row[baseIdx + 3].toString().trim() : "";

    if (cardTitle || cardDesc || cardMediaRaw || cardLinkUrl) {
      cards.push({
        title: cardTitle || `البطاقة ${c + 1}`,
        description: cardDesc,
        media: parseMediaUrls(cardMediaRaw),
        linkUrl: (cardLinkUrl && cardLinkUrl !== "-") ? cardLinkUrl : undefined,
        buttonText: (cardLinkUrl && cardLinkUrl !== "-") ? "فتح الرابط المرفق" : undefined
      });
    }
  }

  return {
    topicId,
    title,
    description,
    coverImage,
    badge: (badge && badge !== "-") ? badge : undefined,
    cards
  };
}

// Client-side authentication fallback (Apps Script proxy OR Direct Sheets validation)
export async function loginSubscriberDirect(usernameInput: string, passwordInput: string, deviceId: string): Promise<any> {
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";

  // 1. If Apps Script URL is provided via environment variables, use it securely
  if (scriptUrl) {
    try {
      // Direct POST to Google Apps Script Web App
      const response = await fetch(scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginUser",
          username: usernameInput,
          password: passwordInput,
          deviceId: deviceId
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Apps Script POST failed or CORS blocked. Trying JSONP fallback GET request...", e);
      try {
        // Fallback GET request to Apps Script Web App
        const getUrl = `${scriptUrl}?action=loginUser&username=${encodeURIComponent(usernameInput)}&password=${encodeURIComponent(passwordInput)}&deviceId=${encodeURIComponent(deviceId)}`;
        const response = await fetch(getUrl);
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.error("Apps Script direct client communication failed:", err);
      }
    }
  }

  // 2. Direct browser-side zero-config fallback using public sheet to ensure instant deployment success!
  try {
    const rows = await getSheetValuesDirect("Settings");
    if (!rows || rows.length === 0) {
      return { success: false, message: "فشل الاتصال بجدول المشتركين" };
    }

    for (const row of rows) {
      if (!row || row.length < 27) continue;

      const sheetUsername = row[25] ? row[25].toString().trim() : "";
      const sheetPassword = row[26] ? row[26].toString().trim() : "";
      
      if (sheetUsername.toLowerCase() === usernameInput.toLowerCase()) {
        if (sheetPassword !== passwordInput) {
          return { success: false, message: "كلمة المرور أو رقم التسجيل غير صحيح" };
        }

        const status = row[27] ? row[27].toString().trim() : "";
        if (status === "ممنوع" || status === "معطل" || status === "محظور" || status === "لا") {
          return { success: false, isBlocked: true, message: "تم إيقاف أو تعليق هذا الحساب من قبل الإدارة (حالة الاشتراك: ممنوع)" };
        }

        // Column AC (index 28): عدد الأجهزة المسموحة
        let maxAllowedDevices = 1;
        const rawMax = row[28] ? row[28].toString().trim() : "";
        if (rawMax) {
          const parsedMax = parseInt(rawMax, 10);
          if (!isNaN(parsedMax) && parsedMax > 0) {
            maxAllowedDevices = parsedMax;
          }
        }

        // Columns AD:AW: فحص الأجهزة المسجلة
        if (deviceId) {
          let isKnownDevice = false;
          let registeredDeviceCount = 0;
          const cleanCurDevId = deviceId.toString().trim();
          const devShortId = cleanCurDevId.length > 8 ? cleanCurDevId.slice(-8) : cleanCurDevId;

          for (let d = 0; d < maxAllowedDevices; d++) {
            const devColIdx = 30 + (d * 2);
            const regDev = row[devColIdx] ? row[devColIdx].toString().trim() : "";
            if (regDev) {
              registeredDeviceCount++;
              if (
                regDev === cleanCurDevId ||
                regDev.includes(cleanCurDevId) ||
                cleanCurDevId.includes(regDev) ||
                regDev.includes(devShortId)
              ) {
                isKnownDevice = true;
                break;
              }
            }
          }

          if (!isKnownDevice && registeredDeviceCount >= maxAllowedDevices) {
            return {
              success: false,
              deviceLimitReached: true,
              message: `لقد استنفدت الحد الأقصى المسموح به من الأجهزة (${maxAllowedDevices} جهاز). يرجى التواصل مع الإدارة لإعادة التعيين.`
            };
          }
        }

        const rawTopicId = row[0] ? row[0].toString().trim() : "1";
        const cleanTopicNum = (s: string) => {
          const clean = (s || "").toString().trim().replace(/['"]/g, "");
          const num = parseFloat(clean);
          return (!isNaN(num) && Number.isInteger(num)) ? String(num) : clean;
        };
        const topicId = cleanTopicNum(rawTopicId) || "1";
        const subscriberName = row[1] || usernameInput;

        // Try to fetch matching topic content from SubscriberContent sheet
        let topicContent: SubscriberTopicContent | undefined = undefined;
        try {
          const contentRows = await getSheetValuesDirect("SubscriberContent");
          if (contentRows && contentRows.length > 0) {
            for (const cRow of contentRows) {
              const rawCTopic = cRow[0] ? cRow[0].toString().trim() : "";
              const cTopicId = cleanTopicNum(rawCTopic);
              if (cTopicId === topicId || rawCTopic === rawTopicId || rawCTopic === topicId) {
                topicContent = parseSubscriberTopicContent(cRow);
                break;
              }
            }
          }
        } catch (cErr) {
          console.warn("Could not load SubscriberContent sheet directly:", cErr);
        }

        return {
          success: true,
          subscriberName,
          topicId,
          content: topicContent,
          linkButtonText1: row[2] || "",
          linkButtonComment1: row[3] || "",
          url1: row[4] || "",
          linkButtonText2: row[5] || "",
          linkButtonComment2: row[6] || "",
          url2: row[7] || "",
          linkButtonText3: row[8] || "",
          linkButtonComment3: row[9] || "",
          url3: row[10] || "",
          linkButtonText4: row[11] || "",
          linkButtonComment4: row[12] || "",
          url4: row[13] || "",
          linkButtonText5: row[14] || "",
          linkButtonComment5: row[15] || "",
          url5: row[16] || "",
          exitButtonText: row[17] || "تسجيل الخروج",
          exitButtonComment: row[18] || ""
        };
      }
    }

    return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  } catch (error) {
    console.error("Browser-side direct login failed:", error);
    return { success: false, message: "حدث خطأ أثناء الاتصال بقاعدة البيانات المباشرة" };
  }
}

