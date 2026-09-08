// =========================================================================
// كود تطبيق نص برمجيات جوجل (Google Apps Script) الشامل لمؤسسة يوسف ذنون
// =========================================================================

export const GAS_BACKEND_CODE = `// =========================================================================
// كود تطبيق نص برمجيات جوجل (Google Apps Script) الشامل لمؤسسة يوسف ذنون
// =========================================================================

// 1. استقبال طلبات GET (جلب البيانات العامة، والأسئلة الديناميكية)
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    
    // تسجيل دخول المشترك عبر GET
    if (action === "loginUser" || action === "login") {
      var getLoginResult = loginUser(
        e.parameter.username || "",
        e.parameter.password || "",
        e.parameter.deviceId || "",
        e.parameter.lat || "",
        e.parameter.lng || "",
        e.parameter.locationName || e.parameter.location || "",
        e.parameter.deviceInfo || e.parameter.userAgent || ""
      );
      return ContentService.createTextOutput(JSON.stringify(getLoginResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "getFormQuestions") {
      var questions = getFormQuestions();
      return ContentService.createTextOutput(JSON.stringify({ success: true, questions: questions }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // جلب بيانات وسجلات المسجلين من ورقة RegistrationAnswers
    if (action === "getRegistrationAnswers" || action === "getAnswers") {
      var answersData = getRegistrationAnswersSheetData();
      return ContentService.createTextOutput(JSON.stringify(answersData))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // تعديل مسجل عبر GET
    if (action === "updateRegistrationAnswer" || action === "updateAnswer") {
      var rawUpdateData = {};
      if (e.parameter.data) {
        try { rawUpdateData = JSON.parse(e.parameter.data); } catch(pe) {}
      }
      var updateGetRes = updateRegistrationAnswerInSheet({
        registrationId: e.parameter.registrationId || "",
        rowIndex: e.parameter.rowIndex || "",
        updatedData: rawUpdateData
      });
      return ContentService.createTextOutput(JSON.stringify(updateGetRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // حذف مسجل عبر GET
    if (action === "deleteRegistrationAnswer" || action === "deleteAnswer") {
      var deleteGetRes = deleteRegistrationAnswerFromSheet({
        registrationId: e.parameter.registrationId || "",
        rowIndex: e.parameter.rowIndex || ""
      });
      return ContentService.createTextOutput(JSON.stringify(deleteGetRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // جلب مشتركي ورقة Settings عبر GET
    if (action === "getSettingsSubscribers" || action === "getSubscribers") {
      var getSubsRes = getSettingsSubscribersData();
      return ContentService.createTextOutput(JSON.stringify(getSubsRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // تعديل مشترك في ورقة Settings عبر GET
    if (action === "updateSettingsSubscriber" || action === "updateSubscriber") {
      var subUpdateData = {};
      if (e.parameter.data) {
        try { subUpdateData = JSON.parse(e.parameter.data); } catch(pE) {}
      }
      var updateSubGetRes = updateSettingsSubscriberInSheet({
        rowIndex: e.parameter.rowIndex || "",
        registrationId: e.parameter.registrationId || "",
        name: e.parameter.name || subUpdateData.name || "",
        topicId: e.parameter.topicId || subUpdateData.topicId || "1",
        status: e.parameter.status || subUpdateData.status || "مسموح",
        deviceCount: e.parameter.deviceCount || subUpdateData.deviceCount || "1",
        updatedData: subUpdateData
      });
      return ContentService.createTextOutput(JSON.stringify(updateSubGetRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // حذف مشترك من ورقة Settings عبر GET
    if (action === "deleteSettingsSubscriber" || action === "deleteSubscriber") {
      var deleteSubGetRes = deleteSettingsSubscriberFromSheet({
        rowIndex: e.parameter.rowIndex || "",
        registrationId: e.parameter.registrationId || ""
      });
      return ContentService.createTextOutput(JSON.stringify(deleteSubGetRes))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // حفظ استفسار عبر GET
    if (action === "submitInquiry") {
      var result = submitInquiry({
        name: e.parameter.name || "",
        email: e.parameter.email || "",
        subject: e.parameter.subject || "",
        message: e.parameter.message || "",
        timestamp: new Date().toISOString()
      });
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // جلب ترجمات الموقع المحفوظة عبر GET
    if (action === "getSiteTranslations" || action === "getTranslations") {
      var transData = getSiteTranslationsSheetData();
      return ContentService.createTextOutput(JSON.stringify(transData))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // الوضع الافتراضي: جلب البيانات الإجمالية للموقع
  try {
    var data = getData();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. استقبال طلبات POST (تسجيل الدخول، إرسال الاستفسارات، وتعبئة نموذج التسجيل)
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;

    // أ) تسجيل دخول المشترك
    if (action === "loginUser") {
      var loginResult = loginUser(
        postData.username,
        postData.password,
        postData.deviceId || "",
        postData.lat || "",
        postData.lng || "",
        postData.locationName || postData.location || "",
        postData.deviceInfo || postData.userAgent || ""
      );
      return ContentService.createTextOutput(JSON.stringify(loginResult))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    
    // ب) حفظ رسائل الاتصال
    else if (action === "submitInquiry") {
      var inquiryResult = submitInquiry({
        name: postData.name,
        email: postData.email || "",
        subject: postData.subject || "",
        message: postData.message,
        timestamp: postData.timestamp || new Date().toISOString()
      });
      return ContentService.createTextOutput(JSON.stringify(inquiryResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ج) تقديم طلب تسجيل مشترك جديد + حفظ الإجابات + إرسال الإيميل
    else if (action === "submitRegistration") {
      var regResult = submitRegistration(postData);
      return ContentService.createTextOutput(JSON.stringify(regResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // د) اختبار إرسال إيميل المشترك المخصص والـ QR Code
    else if (action === "testSubscriberEmail" || action === "testEmail") {
      var testMailResult = testSubscriberEmailService(postData);
      return ContentService.createTextOutput(JSON.stringify(testMailResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // هـ) رفع ملف أو صورة إلى مجلد قوقل درايف
    else if (action === "uploadFile") {
      var uploadResult = uploadFileToDrive(
        postData.base64Data,
        postData.fileName,
        postData.mimeType,
        postData.folderId
      );
      return ContentService.createTextOutput(JSON.stringify(uploadResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // و) حفظ وتحديث إعدادات إيميل المشترك في خصائص السكريبت
    else if (action === "saveSubscriberEmailConfig" || action === "updateEmailConfig") {
      try {
        var cfgToSave = postData.emailConfig || postData.config || postData;
        PropertiesService.getScriptProperties().setProperty("SUBSCRIBER_EMAIL_CONFIG", JSON.stringify(cfgToSave));
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "تم حفظ إعدادات الإيميل بنجاح" }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch(savePropsErr) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: savePropsErr.message }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ز) حفظ وتحديث إعدادات إشعارات تلغرام للإدارة
    else if (action === "saveTelegramConfig" || action === "updateTelegramConfig") {
      try {
        var telCfg = postData.telegramConfig || postData.config || postData;
        PropertiesService.getScriptProperties().setProperty("TELEGRAM_CONFIG", JSON.stringify(telCfg));
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "تم حفظ إعدادات تلغرام بنجاح" }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch(telErr) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: telErr.message }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ح) اختبار إرسال إشعار تلغرام تجريبي للإدارة
    else if (action === "testTelegramNotification" || action === "testTelegram") {
      var testTelRes = testTelegramAdminService(postData);
      return ContentService.createTextOutput(JSON.stringify(testTelRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ط) جلب بيانات وسجلات المسجلين من ورقة RegistrationAnswers
    else if (action === "getRegistrationAnswers" || action === "getAnswers") {
      var ansData = getRegistrationAnswersSheetData();
      return ContentService.createTextOutput(JSON.stringify(ansData))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ي) تعديل بيانات مسجل في ورقة RegistrationAnswers
    else if (action === "updateRegistrationAnswer" || action === "updateAnswer") {
      var updateRes = updateRegistrationAnswerInSheet(postData);
      return ContentService.createTextOutput(JSON.stringify(updateRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ك) حذف سجل مسجل من ورقة RegistrationAnswers
    else if (action === "deleteRegistrationAnswer" || action === "deleteAnswer") {
      var deleteRes = deleteRegistrationAnswerFromSheet(postData);
      return ContentService.createTextOutput(JSON.stringify(deleteRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ل) جلب بيانات المشتركين من ورقة Settings
    else if (action === "getSettingsSubscribers" || action === "getSubscribers") {
      var settingsSubs = getSettingsSubscribersData();
      return ContentService.createTextOutput(JSON.stringify(settingsSubs))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // م) تعديل بيانات المشترك في ورقة Settings
    else if (action === "updateSettingsSubscriber" || action === "updateSubscriber") {
      var updateSubRes = updateSettingsSubscriberInSheet(postData);
      return ContentService.createTextOutput(JSON.stringify(updateSubRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ن) حذف صف مشترك كاملاً من ورقة Settings
    else if (action === "deleteSettingsSubscriber" || action === "deleteSubscriber") {
      var deleteSubRes = deleteSettingsSubscriberFromSheet(postData);
      return ContentService.createTextOutput(JSON.stringify(deleteSubRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // س) إضافة مشترك جديد إلى ورقة Settings
    else if (action === "addSettingsSubscriber" || action === "addSubscriber") {
      var addSubRes = addSettingsSubscriberToSheet(postData);
      return ContentService.createTextOutput(JSON.stringify(addSubRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ع) ترجمة النصوص الذكية باستخدام LanguageApp
    else if (action === "translateTexts" || action === "translate") {
      var transRes = translateTextsWithLanguageApp(postData);
      return ContentService.createTextOutput(JSON.stringify(transRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ف) حفظ وتحديث ترجمات الموقع في ورقة SiteTranslations
    else if (action === "saveSiteTranslations" || action === "saveTranslations") {
      var saveTransRes = saveSiteTranslationsToSheet(postData);
      return ContentService.createTextOutput(JSON.stringify(saveTransRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ص) جلب ترجمات الموقع من ورقة SiteTranslations
    else if (action === "getSiteTranslations" || action === "getTranslations") {
      var getTransRes = getSiteTranslationsSheetData();
      return ContentService.createTextOutput(JSON.stringify(getTransRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "إجراء غير معروف" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. دالة جلب بيانات كافة الأوراق من جدول البيانات
function getData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
 
  var profileSheet = ss.getSheetByName('Profile');
  var artworkSheet = ss.getSheetByName('Artwork');
  var videoSheet = ss.getSheetByName('فيديو');
  var coursesSheet = ss.getSheetByName('Courses');
  var toolsSheet = ss.getSheetByName('Tools');
  var contactSheet = ss.getSheetByName('Contact');
  var aboutSheet = ss.getSheetByName('About');
  var settingsSheet = ss.getSheetByName('Settings');
  var subscriberContentSheet = ss.getSheetByName('SubscriberContent') || ss.getSheetByName('محتوى المشتركين');
  var siteTranslationsSheet = ss.getSheetByName('SiteTranslations') || ss.getSheetByName('ترجمات الموقع');
 
  var siteTranslations = [];
  if (siteTranslationsSheet) {
    try {
      var transRes = getSiteTranslationsSheetData();
      if (transRes && transRes.translations) {
        siteTranslations = transRes.translations;
      }
    } catch(tErr) {}
  }

  return {
    profile: profileSheet ? profileSheet.getDataRange().getValues().slice(1) : [],
    artwork: artworkSheet ? artworkSheet.getDataRange().getValues().slice(1) : [],
    video: videoSheet ? videoSheet.getDataRange().getValues().slice(1) : [],
    courses: coursesSheet ? coursesSheet.getDataRange().getValues().slice(1) : [],
    tools: toolsSheet ? toolsSheet.getDataRange().getValues().slice(1) : [],
    contact: contactSheet ? contactSheet.getDataRange().getValues().slice(1) : [],
    about: aboutSheet ? aboutSheet.getDataRange().getValues().slice(1) : [],
    settings: settingsSheet ? settingsSheet.getDataRange().getValues().slice(1) : [],
    subscriberContent: subscriberContentSheet ? subscriberContentSheet.getDataRange().getValues().slice(1) : [],
    siteTranslations: siteTranslations
  };
}

// 4. دالة جلب أسئلة التسجيل (تنشئ ورقة "RegistrationQuestions" تلقائياً إذا لم توجد)
function getFormQuestions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "RegistrationQuestions";
  var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("أسئلة التسجيل");

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      "نص السؤال",
      "الوصف",
      "نوع العنصر",
      "خيارات",
      "اجبار الاجابة",
      "رابط الصورة",
      "رابط خارجي"
    ]);
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#D9EAD3");
    
    // إضافة الأسئلة الأساسية والافتراضية
    sheet.appendRow(["الاسم", "يرجى كتابة اسمك الكامل كما هو مدون في الهوية", "نص", "", "نعم", "", ""]);
    sheet.appendRow(["الاسم بالعربي", "اسمك الكريم باللغة العربية (إن وُجد)", "نص", "", "نعم", "", ""]);
    sheet.appendRow(["العمر", "العمر بالسنوات (أرقام فقط)", "رقم", "", "نعم", "", ""]);
    sheet.appendRow(["رقم الهاتف", "رقم الهاتف أو الواتساب مع مفتاح الدولة", "رقم هاتف", "", "نعم", "", ""]);
    sheet.appendRow(["ايميل", "بريدك الإلكتروني المعتمد لاستلام الإشعار", "ايميل", "", "نعم", "", ""]);
    sheet.appendRow(["ID Line", "معرف تطبيق لاين الخاص بك للتواصل السريع", "نص", "", "لا", "", ""]);
    sheet.appendRow(["فيس بوك", "رابط أو اسم حسابك على فيسبوك", "نص", "", "لا", "", ""]);
    sheet.appendRow(["هل تحب الخط العربي؟", "اختر الإجابة المناسبة لمستواك", "اختيارات", "✅ نعم = เคย|||❌ لا = ไม่เคย", "نعم", "", ""]);
    sheet.appendRow(["ما اسم استاذك الذي علمك الخط؟", "اسم الخطاط أو المعلم الذي تعلمت على يديه", "نص", "", "لا", "", ""]);
  }

  var values = sheet.getDataRange().getValues();
  var questions = [];
  for (var i = 1; i < values.length; i++) {
    var qText = values[i][0] ? values[i][0].toString().trim() : "";
    if (qText) {
      var qDesc = values[i][1] ? values[i][1].toString().trim() : "";
      var qType = values[i][2] ? values[i][2].toString().trim().toLowerCase() : "نص";
      var qOptionsStr = values[i][3] ? values[i][3].toString() : "";
      var qRequiredStr = values[i][4] ? values[i][4].toString().trim().toLowerCase() : "";
      var qImg = values[i][5] ? values[i][5].toString().trim() : "";
      var qLink = values[i][6] ? values[i][6].toString().trim() : "";

      var optionsArr = [];
      if (qOptionsStr) {
        if (qOptionsStr.indexOf("|||") !== -1) {
          optionsArr = qOptionsStr.split("|||").map(function(s) { return s.trim(); });
        } else if (qOptionsStr.indexOf(String.fromCharCode(10)) !== -1) {
          optionsArr = qOptionsStr.split(String.fromCharCode(10)).map(function(s) { return s.trim(); });
        } else {
          optionsArr = qOptionsStr.split(",").map(function(s) { return s.trim(); });
        }
      }

      var isReq = (
        qRequiredStr === "نعم" || 
        qRequiredStr === "true" || 
        qRequiredStr === "yes" || 
        qRequiredStr === "1" || 
        qRequiredStr === "ن" || 
        qRequiredStr === "مطلوب" || 
        qRequiredStr === "اجباري" || 
        qRequiredStr === "إجباري" || 
        qRequiredStr === "required" ||
        (qRequiredStr !== "" && qRequiredStr !== "لا" && qRequiredStr !== "false" && qRequiredStr !== "no" && qRequiredStr !== "0" && qRequiredStr !== "-")
      );

      questions.push({
        id: i,
        question: qText,
        description: qDesc,
        type: qType,
        options: optionsArr,
        required: isReq,
        imageUrl: qImg,
        externalLink: qLink
      });
    }
  }
  return questions;
}

// 5. دالة حفظ إجابات نموذج التسجيل وتوليد الرقم المرجعي
function submitRegistration(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "RegistrationAnswers";
    var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("طلبات التسجيل") || ss.getSheetByName("إجابات التسجيل");

    // 1. التاريخ والوقت بتنسيق عربي مقروء ومحدد (مثال: 2026/08/19 - 04:36 م)
    var timestamp = Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd - hh:mm a");

    // 2. توحيد رقم التسجيل المرجعي (أرقام فقط: السنة + الشهر + 4 أرقام حرة مثل 202686124)
    var nowObj = new Date();
    var regYear = nowObj.getFullYear().toString();
    var regMonth = (nowObj.getMonth() + 1).toString();
    var regRand = Math.floor(1000 + Math.random() * 9000).toString();
    var autoRegId = regYear + regMonth + regRand;

    var registrationId = (data.registrationId && /^\d{8,12}$/.test(data.registrationId.toString().trim()))
      ? data.registrationId.toString().trim()
      : (data.registrationId ? data.registrationId.toString().trim() : autoRegId);

    var displayName = data.name || data.nameArabic || "مشترك جديد";

    // 3. قراءة أسئلة الفورم من ورقة RegistrationQuestions لتحديد ترتيب الأعمدة بدقة
    var questionsSheet = ss.getSheetByName("RegistrationQuestions") || ss.getSheetByName("أسئلة التسجيل");
    var formQuestionsList = [];
    
    if (questionsSheet) {
      var qData = questionsSheet.getDataRange().getValues();
      for (var q = 1; q < qData.length; q++) {
        var qTitle = qData[q][0] ? qData[q][0].toString().trim() : "";
        var qType = qData[q][2] ? qData[q][2].toString().trim().toLowerCase() : "";
        
        // استبعاد عناصر العرض (الصور وأزرار الروابط) من الأعمدة
        var isNonInput = 
          qType === "image_display" ||
          qType === "button_link" ||
          qType === "button_title" ||
          qType === "عنوان زر" ||
          qType === "زر" ||
          qType === "صورة" ||
          qType === "عرض صورة" ||
          qTitle === "صورة";

        if (qTitle && !isNonInput) {
          formQuestionsList.push(qTitle);
        }
      }
    }

    // القائمة الافتراضية للأسئلة في حال لم تكن ورقة الأسئلة موجودة
    if (formQuestionsList.length === 0) {
      formQuestionsList = [
        "الاسم",
        "الاسم بالعربي",
        "العمر",
        "رقم الهاتف",
        "ايميل",
        "ID Line",
        "فيس بوك",
        "هل تحب الخط العربي؟",
        "ما اسم استاذك الذي علمك الخط؟",
        "رفع ملف"
      ];
    }

    // 4. تجهيز قاموس الإجابات من البيانات المستلمة
    var answersMap = {};
    if (data.answers && Array.isArray(data.answers)) {
      for (var i = 0; i < data.answers.length; i++) {
        var item = data.answers[i];
        if (!item) continue;
        var qText = (item.question || "").toString().trim();
        var qAns = (item.answer !== undefined && item.answer !== null) ? item.answer.toString().trim() : "";
        if (qText) {
          answersMap[qText] = qAns;
        }
      }
    }

    // مطابقة الحقول الأساسية
    if (data.name && !answersMap["الاسم"]) answersMap["الاسم"] = data.name;
    if (data.nameArabic && !answersMap["الاسم بالعربي"]) answersMap["الاسم بالعربي"] = data.nameArabic;
    if (data.age && !answersMap["العمر"]) answersMap["العمر"] = data.age;
    if (data.phone && !answersMap["رقم الهاتف"]) answersMap["رقم الهاتف"] = data.phone;
    if (data.email && !answersMap["ايميل"]) answersMap["ايميل"] = data.email;
    if (data.lineId && !answersMap["ID Line"]) answersMap["ID Line"] = data.lineId;
    if (data.facebook && !answersMap["فيس بوك"]) answersMap["فيس بوك"] = data.facebook;
    if (data.attachment && !answersMap["رفع ملف"]) answersMap["رفع ملف"] = data.attachment;

    // 5. فحص وتحويل أي ملفات أو صور Base64 إلى روابط Google Drive في المجلد المحدد
    var driveFolderId = data.driveFolderId || (data.emailConfig && data.emailConfig.driveFolderId) || "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";
    for (var aKey in answersMap) {
      var aVal = answersMap[aKey];
      if (typeof aVal === "string" && (aVal.indexOf("data:") === 0 || aVal.indexOf("base64,") !== -1)) {
        try {
          var mimeMatch = aVal.match(/data:([^;]+);/);
          var mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
          var safeField = aKey.split(" ").join("_").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "");
          var safeName = displayName.split(" ").join("_").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "");
          var autoFileName = (safeName || "user") + "_" + (safeField || "file") + "_" + Utilities.formatDate(new Date(), "GMT+3", "yyyyMMdd_HHmmss") + ".jpg";
          
          var uploadRes = uploadFileToDrive(aVal, autoFileName, mime, driveFolderId);
          if (uploadRes && uploadRes.success && (uploadRes.fileUrl || uploadRes.downloadUrl)) {
            answersMap[aKey] = uploadRes.fileUrl || uploadRes.downloadUrl;
          } else {
            answersMap[aKey] = (uploadRes && (uploadRes.fileUrl || uploadRes.error)) ? (uploadRes.fileUrl || uploadRes.error) : "صورة مرفوعة (Google Drive)";
          }
        } catch (upErr) {
          Logger.log("Base64 upload error: " + upErr.message);
          answersMap[aKey] = "صورة ملتقطة محفوظة";
        }
      }
    }

    // دوال المطابقة الذكية وتوحيد مسميات الحقول لمنع أي تكرار للأعمدة
    function normalizeFieldKey(str) {
      if (!str) return "";
      return str.toString()
        .toLowerCase()
        .replace(/[\u064B-\u065F]/g, "") // إزالة التشكيل
        .replace(/[إأآا]/g, "ا")
        .replace(/[ة]/g, "ه")
        .replace(/[يى]/g, "ي")
        .replace(/[^a-z0-9\u0600-\u06FF\u0E00-\u0E7F]/g, "")
        .trim();
    }

    function isSameFieldCategory(fieldA, fieldB) {
      if (!fieldA || !fieldB) return false;
      var normA = normalizeFieldKey(fieldA);
      var normB = normalizeFieldKey(fieldB);
      if (!normA || !normB) return false;
      if (normA === normB) return true;
      
      // استثناء الأسئلة التي تخص أشخاصاً آخرين (مثل الأستاذ، المعلم، الوالد، الصديق) من المطابقة مع اسم المشترك
      var hasOtherA = normA.indexOf("استاذ") !== -1 || normA.indexOf("معلم") !== -1 || normA.indexOf("شيخ") !== -1 || normA.indexOf("صديق") !== -1 || normA.indexOf("والد") !== -1;
      var hasOtherB = normB.indexOf("استاذ") !== -1 || normB.indexOf("معلم") !== -1 || normB.indexOf("شيخ") !== -1 || normB.indexOf("صديق") !== -1 || normB.indexOf("والد") !== -1;
      if (hasOtherA || hasOtherB) {
        if (hasOtherA && hasOtherB && normA === normB) return true;
        return false;
      }

      // فئة الاسم الكامل (اسم المشترك فقط)
      var isNameA = normA === "الاسم" || normA === "الاسمكامل" || normA === "اسمالمشترك" || normA === "name" || normA === "fullname" || normA === "ชื่อ";
      var isNameB = normB === "الاسم" || normB === "الاسمكامل" || normB === "اسمالمشترك" || normB === "name" || normB === "fullname" || normB === "ชื่อ";
      if (isNameA && isNameB) return true;

      // فئة الاسم بالعربي
      var isArNameA = normA.indexOf("اسمبالعربي") !== -1 || normA.indexOf("arabicname") !== -1;
      var isArNameB = normB.indexOf("اسمبالعربي") !== -1 || normB.indexOf("arabicname") !== -1;
      if (isArNameA && isArNameB) return true;

      // فئة البريد الإلكتروني
      var isEmailA = normA.indexOf("ايميل") !== -1 || normA.indexOf("بريد") !== -1 || normA.indexOf("email") !== -1 || normA.indexOf("mail") !== -1 || normA.indexOf("อีเมล") !== -1;
      var isEmailB = normB.indexOf("ايميل") !== -1 || normB.indexOf("بريد") !== -1 || normB.indexOf("email") !== -1 || normB.indexOf("mail") !== -1 || normB.indexOf("อีเมล") !== -1;
      if (isEmailA && isEmailB) return true;

      // فئة QR Code
      var isQrA = normA.indexOf("qr") !== -1 || normA.indexOf("باركود") !== -1 || normA.indexOf("استجابه") !== -1;
      var isQrB = normB.indexOf("qr") !== -1 || normB.indexOf("باركود") !== -1 || normB.indexOf("استجابه") !== -1;
      if (isQrA && isQrB) return true;

      // فئة رفع الملفات والمرفقات (استثناء أزرار PDF وأعمدة الـ QR)
      var isOpenPdfA = normA.indexOf("افتح") !== -1 || normA.indexOf("open") !== -1;
      var isOpenPdfB = normB.indexOf("افتح") !== -1 || normB.indexOf("open") !== -1;
      if (!isQrA && !isQrB && !isOpenPdfA && !isOpenPdfB) {
        var isUploadA = normA.indexOf("رفع") !== -1 || normA.indexOf("ارفاق") !== -1 || normA.indexOf("upload") !== -1 || normA.indexOf("attachment") !== -1 || normA === "ملف" || normA === "صورة";
        var isUploadB = normB.indexOf("رفع") !== -1 || normB.indexOf("ارفاق") !== -1 || normB.indexOf("upload") !== -1 || normB.indexOf("attachment") !== -1 || normB === "ملف" || normB === "صورة";
        if (isUploadA && isUploadB) return true;
      }

      // فئة الهاتف والواتساب
      var isPhoneA = normA.indexOf("هاتف") !== -1 || normA.indexOf("جوال") !== -1 || normA.indexOf("واتساب") !== -1 || normA.indexOf("phone") !== -1 || normA.indexOf("mobile") !== -1 || normA.indexOf("tel") !== -1 || normA.indexOf("โทร") !== -1;
      var isPhoneB = normB.indexOf("هاتف") !== -1 || normB.indexOf("جوال") !== -1 || normB.indexOf("واتساب") !== -1 || normB.indexOf("phone") !== -1 || normB.indexOf("mobile") !== -1 || normB.indexOf("tel") !== -1 || normB.indexOf("โทร") !== -1;
      if (isPhoneA && isPhoneB) return true;

      // فئة العمر
      var isAgeA = normA === "عمر" || normA === "العمر" || normA === "سن" || normA === "السن" || normA === "age" || normA === "อายุ";
      var isAgeB = normB === "عمر" || normB === "العمر" || normB === "سن" || normB === "السن" || normB === "age" || normB === "อายุ";
      if (isAgeA && isAgeB) return true;

      // فئة ID Line
      var isLineA = normA.indexOf("line") !== -1 || normA.indexOf("لاين") !== -1;
      var isLineB = normB.indexOf("line") !== -1 || normB.indexOf("لاين") !== -1;
      if (isLineA && isLineB) return true;

      // فئة Facebook
      var isFbA = normA.indexOf("face") !== -1 || normA.indexOf("فيس") !== -1;
      var isFbB = normB.indexOf("face") !== -1 || normB.indexOf("فيس") !== -1;
      if (isFbA && isFbB) return true;

      // فئة التاريخ والوقت
      var isTimeA = normA.indexOf("تاريخ") !== -1 || normA.indexOf("وقت") !== -1 || normA.indexOf("time") !== -1 || normA.indexOf("date") !== -1;
      var isTimeB = normB.indexOf("تاريخ") !== -1 || normB.indexOf("وقت") !== -1 || normB.indexOf("time") !== -1 || normB.indexOf("date") !== -1;
      if (isTimeA && isTimeB) return true;

      // فئة رقم التسجيل
      var isIdA = normA.indexOf("تسجيل") !== -1 || normA.indexOf("قيد") !== -1 || normA.indexOf("regid") !== -1;
      var isIdB = normB.indexOf("تسجيل") !== -1 || normB.indexOf("قيد") !== -1 || normB.indexOf("regid") !== -1;
      if (isIdA && isIdB && normA.indexOf("line") === -1 && normB.indexOf("line") === -1) return true;

      // فئة حالة وتأكيد الإرسال
      var isStatusA = (normA.indexOf("ارسال") !== -1 || normA.indexOf("status") !== -1) && (normA.indexOf("ايميل") !== -1 || normA.indexOf("حاله") !== -1 || normA.indexOf("تاكيد") !== -1);
      var isStatusB = (normB.indexOf("ارسال") !== -1 || normB.indexOf("status") !== -1) && (normB.indexOf("ايميل") !== -1 || normB.indexOf("حاله") !== -1 || normB.indexOf("تاكيد") !== -1);
      if (isStatusA && isStatusB) return true;

      return false;
    }

    // 6. بناء قائمة الأعمدة القياسية في حال كانت الورقة جديدة تماماً
    var defaultStandardHeaders = ["التاريخ والوقت", "رقم التسجيل"];
    for (var f = 0; f < formQuestionsList.length; f++) {
      var qName = (formQuestionsList[f] || "").toString().trim();
      if (qName && defaultStandardHeaders.indexOf(qName) === -1) {
        defaultStandardHeaders.push(qName);
      }
    }

    // 7. التأكد من وجود الورقة وقراءة الترويسة الحالية بدقة
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // قراءة الترويسة الحالية الفعلية من الصف الأول
    var lastCol = sheet.getLastColumn();
    var currentHeaders = [];
    if (lastCol > 0 && sheet.getLastRow() > 0) {
      var rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
      for (var rh = 0; rh < rawHeaders.length; rh++) {
        var hVal = rawHeaders[rh] ? rawHeaders[rh].toString().trim() : "";
        if (hVal) {
          currentHeaders.push(hVal);
        }
      }
    }

    // إذا كانت الورقة جديدة تماماً أو فارغة بدون ترويسة، يتم إنشاء الترويسة القياسية
    if (currentHeaders.length === 0) {
      sheet.getRange(1, 1, 1, defaultStandardHeaders.length).setValues([defaultStandardHeaders]);
      sheet.getRange(1, 1, 1, defaultStandardHeaders.length)
           .setFontWeight("bold")
           .setBackground("#1E293B")
           .setFontColor("#F8FAFC")
           .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
      currentHeaders = defaultStandardHeaders.slice();
    } else {
      // التحقق من الأسئلة الجديدة المخصصة في ورقة RegistrationQuestions وإضافتها فقط إذا كانت جديدة فعلاً
      for (var fq = 0; fq < formQuestionsList.length; fq++) {
        var formQ = (formQuestionsList[fq] || "").toString().trim();
        if (!formQ) continue;
        
        // التحقق إن كان السؤال موجوداً بالفعل أو مشابهاً لأي عامود حالي
        var alreadyExists = false;
        for (var ex = 0; ex < currentHeaders.length; ex++) {
          if (isSameFieldCategory(formQ, currentHeaders[ex])) {
            alreadyExists = true;
            break;
          }
        }

        // يضاف العامود فقط إذا كان سؤالاً إضافياً جديداً ولم يكن له أي عامود مماثل إطلاقاً
        if (!alreadyExists) {
          var nextColIdx = currentHeaders.length + 1;
          sheet.getRange(1, nextColIdx)
               .setValue(formQ)
               .setFontWeight("bold")
               .setBackground("#0F766E")
               .setFontColor("#FFFFFF")
               .setHorizontalAlignment("center");
          currentHeaders.push(formQ);
        }
      }
    }

    // 8. دالة استخراج القيمة المطابقة للعامود بأعلى دقة ومرونة
    function getAnswerForColumn(colHeader, cIndex) {
      if (!colHeader) return "";
      var cleanHeader = colHeader.toString().trim();
      
      // أ) مطابقة مباشرة بالاسم الدقيق
      if (answersMap[cleanHeader] !== undefined && answersMap[cleanHeader] !== null && answersMap[cleanHeader] !== "") {
        return answersMap[cleanHeader];
      }

      // ب) مطابقة الحقول الأساسية حسب الفئات الموحدة (عربي / إنجليزي / تايلاندي)
      if (isSameFieldCategory(cleanHeader, "ايميل")) {
        return answersMap["ايميل"] || answersMap["البريد الإلكتروني"] || answersMap["البريد"] || answersMap["Email"] || data.email || "";
      }
      if (isSameFieldCategory(cleanHeader, "رفع ملف")) {
        return answersMap["رفع ملف"] || answersMap["ملف"] || answersMap["صورة"] || answersMap["الصورة"] || answersMap["الصورة الشخصية"] || answersMap["رابط صورة"] || answersMap["ملف المرفقات / رابط Drive"] || data.attachment || "";
      }
      if (isSameFieldCategory(cleanHeader, "اسم بالعربي")) {
        return answersMap["الاسم بالعربي"] || data.nameArabic || "";
      }
      if (isSameFieldCategory(cleanHeader, "الاسم")) {
        return answersMap["الاسم"] || answersMap["الاسم الكامل"] || answersMap["اسم المشترك"] || data.name || data.nameArabic || "";
      }
      if (isSameFieldCategory(cleanHeader, "العمر")) {
        return answersMap["العمر"] || answersMap["Age"] || data.age || "";
      }
      if (isSameFieldCategory(cleanHeader, "رقم الهاتف")) {
        return answersMap["رقم الهاتف"] || answersMap["هاتف"] || answersMap["الواتساب"] || answersMap["الجوال"] || data.phone || "";
      }
      if (isSameFieldCategory(cleanHeader, "ID Line")) {
        return answersMap["ID Line"] || answersMap["Line ID"] || answersMap["لاين"] || data.lineId || "";
      }
      if (isSameFieldCategory(cleanHeader, "فيس بوك")) {
        return answersMap["فيس بوك"] || answersMap["Facebook"] || data.facebook || "";
      }
      if (isSameFieldCategory(cleanHeader, "التاريخ والوقت")) {
        return timestamp;
      }
      if (isSameFieldCategory(cleanHeader, "رقم التسجيل")) {
        return registrationId;
      }
      if (isSameFieldCategory(cleanHeader, "QR Code")) {
        return ""; // يترك فارغاً ليتم تعبئته لاحقاً برابط الـ QR
      }
      if (isSameFieldCategory(cleanHeader, "تأكيد الإرسال")) {
        return ""; // يترك فارغاً ليتم تعبئته بعد إرسال الإيميل
      }

      // ج) مطابقة الأسئلة المخصصة الإضافية
      for (var k in answersMap) {
        if (k && isSameFieldCategory(k, cleanHeader) && answersMap[k]) {
          return answersMap[k];
        }
      }

      // د) فحص من مصفوفة الإجابات answers
      if (data.answers && Array.isArray(data.answers)) {
        for (var ai = 0; ai < data.answers.length; ai++) {
          var aObj = data.answers[ai];
          if (!aObj) continue;
          var aQ = (aObj.question || "").toString().trim();
          if (aQ && isSameFieldCategory(aQ, cleanHeader)) {
            if (aObj.answer !== undefined && aObj.answer !== null) {
              return aObj.answer.toString().trim();
            }
          }
        }
      }

      return "";
    }

    // بناء صف الإجابات بما يطابق الأعمدة بدقة 100%
    var rowValues = [];
    for (var c = 0; c < currentHeaders.length; c++) {
      var col = (currentHeaders[c] || "").toString().trim();
      if (!col) continue;

      if (col === "التاريخ والوقت") {
        rowValues.push(timestamp);
      } else if (col === "رقم التسجيل") {
        rowValues.push(registrationId);
      } else if (col === "إجابات الأسئلة التفصيلية" || col === "ملخص الإجابات") {
        rowValues.push(""); // تفريغ أي عامود مجمع قديم
      } else {
        var val = getAnswerForColumn(col, c);
        rowValues.push(val || "");
      }
    }

    // إضافة الصف لورقة الإجابات
    sheet.appendRow(rowValues);

    // تنسيق الصف الجديد
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(lastRow, 1, 1, rowValues.length).setVerticalAlignment("middle");
      sheet.getRange(lastRow, 1).setHorizontalAlignment("center");
      sheet.getRange(lastRow, 2).setHorizontalAlignment("center").setFontWeight("bold");
    }

    // 9. التأكد من وجود أعمدة الـ QR Code وحالة الإرسال وتنسيقها
    var qrColIdx = 0;
    var statusColIdx = 0;

    // البحث في الأعمدة الحالية أولاً
    for (var chk = 0; chk < currentHeaders.length; chk++) {
      var headTxt = currentHeaders[chk] || "";
      if (!qrColIdx && (isSameFieldCategory(headTxt, "QR Code") || isSameFieldCategory(headTxt, "باركود"))) {
        qrColIdx = chk + 1;
      }
      if (!statusColIdx && (isSameFieldCategory(headTxt, "تأكيد الإرسال") || isSameFieldCategory(headTxt, "حالة الإرسال") || isSameFieldCategory(headTxt, "تم الإرسال"))) {
        statusColIdx = chk + 1;
      }
    }

    // إذا لم تكن موجودة، استخدام التكوين المحدد أو الأعمدة الافتراضية
    if (!qrColIdx) {
      var qrColLetter = (data.emailConfig && data.emailConfig.qrDriveUrlColumn) ? data.emailConfig.qrDriveUrlColumn : "";
      qrColIdx = qrColLetter ? colLetterToNumber(qrColLetter) : 0;
    }
    if (!statusColIdx) {
      var statusColLetter = (data.emailConfig && data.emailConfig.deliveryStatusColumn) ? data.emailConfig.deliveryStatusColumn : "";
      statusColIdx = statusColLetter ? colLetterToNumber(statusColLetter) : 0;
    }

    try {
      if (qrColIdx > 0) {
        if (sheet.getMaxColumns() < qrColIdx) {
          sheet.insertColumnsAfter(sheet.getMaxColumns(), qrColIdx - sheet.getMaxColumns() + 1);
        }
        if (sheet.getRange(1, qrColIdx).getValue() === "") {
          sheet.getRange(1, qrColIdx)
               .setValue("رابط صورة QR Code (Google Drive)")
               .setFontWeight("bold")
               .setBackground("#D97706")
               .setFontColor("#FFFFFF")
               .setHorizontalAlignment("center");
        }
      }
      if (statusColIdx > 0) {
        if (sheet.getMaxColumns() < statusColIdx) {
          sheet.insertColumnsAfter(sheet.getMaxColumns(), statusColIdx - sheet.getMaxColumns() + 1);
        }
        if (sheet.getRange(1, statusColIdx).getValue() === "") {
          sheet.getRange(1, statusColIdx)
               .setValue("حالة إرسال الإيميل (Email Status)")
               .setFontWeight("bold")
               .setBackground("#059669")
               .setFontColor("#FFFFFF")
               .setHorizontalAlignment("center");
        }
      }
    } catch(headErr) {
      Logger.log("Header setup note: " + headErr.message);
    }

    // 10. المزامنة التلقائية لبيانات المشترك في ورقة Settings (B + Z:AA)
    try {
      var settingsSheet = ss.getSheetByName("Settings");
      if (settingsSheet) {
        var sLastRow = settingsSheet.getLastRow();
        var targetSettingsRow = -1;
        
        // البحث عن صف المشترك إذا كان مسجلاً مسبقاً في Z أو AA
        if (sLastRow >= 2) {
          var zColData = settingsSheet.getRange(2, 26, sLastRow - 1, 2).getValues(); // Z:AA
          for (var sIdx = 0; sIdx < zColData.length; sIdx++) {
            var zVal = (zColData[sIdx][0] || "").toString().trim();
            var aaVal = (zColData[sIdx][1] || "").toString().trim();
            if ((displayName && zVal === displayName) || (registrationId && aaVal === registrationId)) {
              targetSettingsRow = sIdx + 2;
              break;
            }
          }
        }
        
        // إذا لم يكن موجوداً، ننشئ صفاً جديداً في ورقة Settings
        if (targetSettingsRow === -1) {
          targetSettingsRow = Math.max(sLastRow + 1, 2);
          if (settingsSheet.getMaxRows() < targetSettingsRow) {
            settingsSheet.insertRowAfter(settingsSheet.getMaxRows());
          }
        }

        // التأكد من توفر الأعمدة الكافية حتى AW (49 عاموداً)
        if (settingsSheet.getMaxColumns() < 49) {
          settingsSheet.insertColumnsAfter(settingsSheet.getMaxColumns(), 49 - settingsSheet.getMaxColumns() + 2);
        }

        // تسجيل البيانات المطلوبة بدقة:
        // 0. رقم الموضوع في العامود A (العمود 1) ليكون 1 افتراضياً لكل مشترك جديد
        var requestedTopic = (data.topicId !== undefined && data.topicId !== null) ? data.topicId : (data.topic || 1);
        var curTopicA = settingsSheet.getRange(targetSettingsRow, 1).getValue();
        var curTopicStr = (curTopicA !== null && curTopicA !== undefined) ? curTopicA.toString().trim() : "";
        if (curTopicStr === "" || curTopicStr === "0" || curTopicStr === "null" || curTopicStr === "undefined") {
          settingsSheet.getRange(targetSettingsRow, 1).setValue(Number(requestedTopic) || 1);
        }
        // 1. اسم المشترك في العامود B (العمود 2)
        settingsSheet.getRange(targetSettingsRow, 2).setValue(displayName);
        // 2. اسم المشترك في العامود Z (العمود 26)
        settingsSheet.getRange(targetSettingsRow, 26).setValue(displayName);
        // 3. رقم التسجيل في العامود AA (العمود 27)
        settingsSheet.getRange(targetSettingsRow, 27).setValue(registrationId);

        // إذا كان العمود AB (حالة الاشتراك) فارغاً، نتركه أو نضعه مسموح افتراضياً
        var curStatus = settingsSheet.getRange(targetSettingsRow, 28).getValue();
        if (!curStatus) {
          settingsSheet.getRange(targetSettingsRow, 28).setValue("مسموح");
        }
        // إذا كان العمود AC (عدد الأجهزة) فارغاً، نضعه 1 افتراضياً
        var curMaxDev = settingsSheet.getRange(targetSettingsRow, 29).getValue();
        if (!curMaxDev) {
          settingsSheet.getRange(targetSettingsRow, 29).setValue(1);
        }

        SpreadsheetApp.flush();
      }
    } catch (syncSettingsErr) {
      Logger.log("Settings auto-sync note: " + syncSettingsErr.message);
    }

    // إرسال البريد الإلكتروني للمشترك والمخصص بالكامل مع QR Code وجدول البيانات
    var emailResult = sendCustomSubscriberEmail(sheet, lastRow, data, rowValues, currentHeaders, data.emailConfig);

    // إرسال إشعار تلغرام المباشر للإدارة للمتابعة الفورية
    var telegramResult = null;
    try {
      telegramResult = sendTelegramNotificationToAdmin(data, rowValues, currentHeaders, data.telegramConfig);
    } catch (telErr) {
      Logger.log("Telegram notification error: " + telErr.message);
    }

    return {
      success: true,
      registrationId: registrationId,
      subscriberName: displayName,
      timestamp: timestamp,
      emailSent: emailResult && emailResult.success,
      emailRecipient: emailResult ? emailResult.recipient : "",
      emailError: emailResult && !emailResult.success ? emailResult.error : null,
      telegramSent: telegramResult && telegramResult.success,
      message: "تم استلام وحفظ طلب التسجيل بنجاح في ورقة RegistrationAnswers وتحديث Settings"
    };

  } catch (err) {
    return { success: false, message: "خطأ أثناء حفظ التسجيل: " + err.message };
  }
}

// دالة تحويل رابط قوقل درايف العادي إلى رابط صورة مباشر يعمل 100% داخل الإيميلات والمتصفح
function normalizeDriveImageUrl(url) {
  if (!url) return "";
  var raw = url.toString().trim();
  var fileId = "";
  if (raw.indexOf("/file/d/") !== -1) {
    var part = raw.split("/file/d/")[1];
    fileId = part.split("/")[0].split("?")[0].split("&")[0];
  } else if (raw.indexOf("id=") !== -1) {
    var part = raw.split("id=")[1];
    fileId = part.split("&")[0].split("#")[0].split("/")[0];
  }
  if (fileId && fileId.length > 5) {
    return "https://lh3.googleusercontent.com/d/" + fileId;
  }
  return raw;
}

// دالة تحويل حرف العامود (مثل A, B, Y, Z, AA) إلى رقم الفهرس 1-based
function colLetterToNumber(letter) {
  if (!letter) return 1;
  var clean = letter.toString().trim().toUpperCase();
  var column = 0;
  for (var i = 0; i < clean.length; i++) {
    column += (clean.charCodeAt(i) - 64) * Math.pow(26, clean.length - i - 1);
  }
  return column > 0 ? column : 1;
}

// دالة توليد بيانات ورابط رمز الاستجابة السريعة (QR Code) المشترك للإيميل وتلغرام بدقة 100%
function generateSubscriberQrData(qrColsConfig, data, rowValues, currentHeaders, sheet, rowIdx) {
  var qrColsStr = (qrColsConfig ? qrColsConfig.toString().trim() : "") || "B, C";
  var rawColsArr = qrColsStr.split(",");
  var qrColsArr = [];
  for (var ci = 0; ci < rawColsArr.length; ci++) {
    var cSub = rawColsArr[ci].split(" ");
    for (var cj = 0; cj < cSub.length; cj++) {
      var trimmed = cSub[cj].trim().toUpperCase();
      if (trimmed) qrColsArr.push(trimmed);
    }
  }

  var qrParts = [];
  var nameVal = data.name || data.nameArabic || (data.answersMap && (data.answersMap["الاسم"] || data.answersMap["اسم المشترك"])) || "";
  var regIdVal = data.registrationId || (data.answersMap && data.answersMap["رقم التسجيل"]) || "";
  var timeVal = data.timestamp || "";
  var phoneVal = data.phone || (data.answersMap && (data.answersMap["رقم الهاتف"] || data.answersMap["هاتف"] || data.answersMap["الواتساب"])) || "";
  var emailVal = data.email || (data.answersMap && (data.answersMap["ايميل"] || data.answersMap["البريد الإلكتروني"])) || "";

  for (var qci = 0; qci < qrColsArr.length; qci++) {
    var colLet = qrColsArr[qci];
    if (!colLet) continue;
    var cIdx = colLetterToNumber(colLet);
    var val = "";

    // 1. فحص مصفوفة قيم الصف المباشرة rowValues
    if (rowValues && rowValues.length >= cIdx && rowValues[cIdx - 1] !== undefined && rowValues[cIdx - 1] !== null) {
      val = rowValues[cIdx - 1].toString().trim();
    }
    
    // 2. فحص الخلية المباشرة في الشيت إن وُجدت
    if (!val && sheet && rowIdx) {
      try {
        var cellV = sheet.getRange(rowIdx, cIdx).getValue();
        if (cellV !== undefined && cellV !== null) val = cellV.toString().trim();
      } catch(e) {}
    }

    // 3. فحص التعيين المنطقي للأعمدة الشائعة
    if (!val) {
      if (colLet === "A") val = timeVal;
      else if (colLet === "B") val = regIdVal;
      else if (colLet === "C") val = nameVal;
      else if (colLet === "E") val = emailVal;
      else if (colLet === "F") val = phoneVal;
    }

    // 4. فحص مصفوفة الإجابات answers ومصفوفة الترويسات
    if (!val && currentHeaders && currentHeaders.length >= cIdx) {
      var hName = currentHeaders[cIdx - 1];
      if (hName && data.answersMap && data.answersMap[hName]) {
        val = data.answersMap[hName].toString().trim();
      }
    }

    // 5. فحص عناصر answers الترتيبية (السؤال الأول col 4 = index 0)
    if (!val && data.answers && Array.isArray(data.answers)) {
      if (cIdx >= 4 && data.answers[cIdx - 4] && data.answers[cIdx - 4].answer) {
        val = data.answers[cIdx - 4].answer.toString().trim();
      }
    }

    if (val && typeof val === "string" && val.indexOf("data:") === -1) {
      qrParts.push(val);
    }
  }

  // في حال عدم العثور على أي قيمة، نعتمد رقم التسجيل واسم المشترك كافتراضي آمن
  if (qrParts.length === 0) {
    if (regIdVal) qrParts.push(regIdVal);
    if (nameVal && nameVal !== "Valued Subscriber" && nameVal !== "المشترك الكريم") qrParts.push(nameVal);
  }

  var qrText = qrParts.join(" - ");
  if (!qrText) qrText = "REG-" + Date.now().toString().slice(-6);

  var qrUrl = "https://quickchart.io/qr?text=" + encodeURIComponent(qrText) + "&size=260&margin=1";

  return {
    qrText: qrText,
    qrUrl: qrUrl,
    parts: qrParts
  };
}

// دالة فحص وتجربة إرسال الإيميل التجريبي
function testSubscriberEmailService(postData) {
  try {
    var email = postData.email || postData.recipientEmail || Session.getActiveUser().getEmail() || "shyk4test2020@gmail.com";
    var result = sendCustomSubscriberEmail(
      null,
      null,
      {
        name: postData.name || "مشترك تجريبي (Test Subscriber)",
        email: email,
        registrationId: postData.registrationId || "TEST-202688",
        timestamp: Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd - hh:mm a"),
        formLang: postData.formLang || "ar",
        answersMap: {
          "رقم التسجيل": "TEST-202688",
          "اسم المشترك": postData.name || "مشترك تجريبي (Test Subscriber)",
          "الاسم": postData.name || "مشترك تجريبي (Test Subscriber)",
          "ايميل": email,
          "تاريخ ووقت التسجيل": Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd - hh:mm a")
        }
      },
      null,
      null,
      postData.emailConfig
    );
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// دالة إرسال إيميل المشترك المخصص بالكامل مع QR Code وجدول البيانات والمرفقات
function sendCustomSubscriberEmail(sheet, rowIdx, data, rowValues, currentHeaders, customEmailConfig) {
  try {
    var emailConfig = customEmailConfig;
    if (!emailConfig || Object.keys(emailConfig).length === 0) {
      try {
        var savedEmailStr = PropertiesService.getScriptProperties().getProperty("SUBSCRIBER_EMAIL_CONFIG");
        if (savedEmailStr) {
          emailConfig = JSON.parse(savedEmailStr);
        }
      } catch (e) {}
    }
    if (!emailConfig) emailConfig = {};

    var emailColLetter = emailConfig.emailColumn || "E";
    var emailColIdx = colLetterToNumber(emailColLetter);
    
    // استخراج البريد الإلكتروني بذكاء من كافة الاحتمالات الممكنة
    var recipientEmail = "";
    
    // 1. فحص العامود المحدد من قبل المستخدم
    if (rowValues && rowValues.length >= emailColIdx && rowValues[emailColIdx - 1]) {
      var cVal = rowValues[emailColIdx - 1].toString().trim();
      if (cVal && cVal.indexOf("@") !== -1) {
        recipientEmail = cVal;
      }
    }
    
    // 2. فحص بيانات الكائن المباشرة
    if (!recipientEmail && data.email && data.email.toString().indexOf("@") !== -1) {
      recipientEmail = data.email.toString().trim();
    }
    
    // 3. فحص خارطة الإجابات بأشهر التسميات
    if (!recipientEmail && data.answersMap) {
      var keys = ["ايميل", "إيميل", "البريد الإلكتروني", "البريد الالكتروني", "البريد", "Email", "email", "E-mail", "e-mail", "อีเมล"];
      for (var k = 0; k < keys.length; k++) {
        var aVal = data.answersMap[keys[k]];
        if (aVal && aVal.toString().indexOf("@") !== -1) {
          recipientEmail = aVal.toString().trim();
          break;
        }
      }
    }
    
    // 4. مسح كافة قيم الصف للعثور على أي بريد صالح
    if (!recipientEmail && rowValues) {
      for (var rvi = 0; rvi < rowValues.length; rvi++) {
        var rVal = (rowValues[rvi] || "").toString().trim();
        if (rVal && rVal.indexOf("@") !== -1 && rVal.indexOf(".") !== -1 && !rVal.startsWith("http")) {
          recipientEmail = rVal;
          break;
        }
      }
    }

    // 5. مسح مصفوفة الإجابات
    if (!recipientEmail && data.answers && Array.isArray(data.answers)) {
      for (var dai = 0; dai < data.answers.length; dai++) {
        var ansObj = data.answers[dai];
        var ansStr = (ansObj && ansObj.answer ? ansObj.answer : "").toString().trim();
        if (ansStr && ansStr.indexOf("@") !== -1 && ansStr.indexOf(".") !== -1 && !ansStr.startsWith("http")) {
          recipientEmail = ansStr;
          break;
        }
      }
    }
    
    if (!recipientEmail || recipientEmail.indexOf("@") === -1) {
      Logger.log("تنبيه: لم يتم العثور على بريد إلكتروني صالح للمشترك");
      return { success: false, error: "لم يتم العثور على بريد إلكتروني صالح في حقول الاستمارة" };
    }

    // تحديد لغة المشترك بدقة (عربي / إنجليزي / تايلاندي)
    var rawLang = (data.formLang || "ar").toString().toLowerCase().trim();
    var userLang = "ar";
    if (rawLang === "en" || rawLang.indexOf("en") !== -1) userLang = "en";
    else if (rawLang === "th" || rawLang.indexOf("th") !== -1) userLang = "th";

    var messages = emailConfig.messages || {};
    var selectedMsg = messages[userLang] || {};
    var arMsg = messages["ar"] || {};

    // القوالب الافتراضية الشاملة في حال لم يتم تعبئة أحد الحقول
    var defaultTemplates = {
      ar: {
        subject: "تأكيد تسجيلك في منصة مؤسسة يوسف ذنون - بيانات الدخول والاشتراك",
        header: "مرحباً بك في مؤسسة يوسف ذنون للخط العربي",
        body: "نشكرك على تسجيلك واهتمامك بتعلم وإتقان فنون الخط العربي الأصيل. فيما يلي تفاصيل وبيانات تسجيلك المعتمدة للدخول ومتابعة الدورات والمحتوى الحصري:",
        footerNote: "يرجى الاحتفاظ برمز الاستجابة السريعة (QR Code) وبيانات التسجيل لاستخدامها عند مراجعة اشتراكك."
      },
      en: {
        subject: "Registration Confirmation - Yousuf Dhannoon Calligraphy Portal",
        header: "Welcome to Yousuf Dhannoon Calligraphy Institute",
        body: "Thank you for registering. Below are your verified registration details and access credentials to explore your courses and exclusive content:",
        footerNote: "Please keep this QR Code and your registration ID handy for subscription verification and session access."
      },
      th: {
        subject: "ยืนยันการลงทะเบียน - สถาบันศิลปะการเขียนตัวอักษรอาหรับ ยูซุฟ ซันนูน",
        header: "ยินดีต้อนรับสู่ สถาบันยูซุฟ ซันนูน สำหรับการเขียนอักษรอาหรับ",
        body: "ขอขอบคุณสำหรับการลงทะเบียน รายละเอียดข้อมูลการสมัครและข้อมูลสำหรับเข้าสู่ระบบบทเรียนของคุณมีดังนี้:",
        footerNote: "กรุณาเก็บรหัส QR Code และหมายเลขลงทะเบียนนี้ไว้เพื่อใช้ในการยืนยันสิทธิ์และการเข้าเรียน"
      }
    };

    var fallback = defaultTemplates[userLang] || defaultTemplates.ar;
    var langTemplate = {
      subject: (selectedMsg.subject && selectedMsg.subject.trim()) || fallback.subject,
      header: (selectedMsg.header && selectedMsg.header.trim()) || fallback.header,
      body: (selectedMsg.body && selectedMsg.body.trim()) || fallback.body,
      footerNote: (selectedMsg.footerNote !== undefined && selectedMsg.footerNote !== null) ? selectedMsg.footerNote : fallback.footerNote
    };

    var displayName = data.name || (data.answersMap && (data.answersMap["الاسم"] || data.answersMap["اسم المشترك"])) || (userLang === "en" ? "Valued Subscriber" : (userLang === "th" ? "สมาชิกผู้ทรงเกียรติ" : "المشترك الكريم"));
    var registrationId = data.registrationId || (data.answersMap && data.answersMap["رقم التسجيل"]) || ("REG-" + Date.now().toString().slice(-6));
    var timestamp = data.timestamp || Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd - hh:mm a");

    // توليد الـ QR Code من الأعمدة المحددة (مثال: B, C) بدقة تامة
    var qrDataCols = (emailConfig && emailConfig.qrCodeColumns) ? emailConfig.qrCodeColumns.toString().trim() : "B, C";
    var qrInfo = generateSubscriberQrData(qrDataCols, data, rowValues, currentHeaders, sheet, rowIdx);
    var qrText = qrInfo.qrText;
    var qrImageUrl = qrInfo.qrUrl;
    var driveQrFileUrl = "";

    // حفظ صورة الـ QR Code في Google Drive
    try {
      var qrDriveFolderId = emailConfig.driveFolderId || "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";
      var qrBlob = null;
      try {
        qrBlob = UrlFetchApp.fetch(qrImageUrl).getBlob();
      } catch(fErr) {
        try {
          qrBlob = UrlFetchApp.fetch("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(qrText)).getBlob();
        } catch(fErr2) {}
      }

      if (qrBlob) {
        var safeName = displayName.split(" ").join("_").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "");
        qrBlob.setName("QR_" + (safeName || "user") + "_" + registrationId + ".png");
        
        var targetFolder = null;
        if (qrDriveFolderId) {
          try { targetFolder = DriveApp.getFolderById(qrDriveFolderId); } catch(fe) {}
        }
        var createdQrFile = targetFolder ? targetFolder.createFile(qrBlob) : DriveApp.createFile(qrBlob);
        if (createdQrFile) {
          try { createdQrFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(pe) {}
          driveQrFileUrl = "https://drive.google.com/file/d/" + createdQrFile.getId() + "/view?usp=sharing";
        }
      }
    } catch (qrErr) {
      Logger.log("QR Drive save note: " + qrErr.message);
    }

    // تسجيل رابط الـ QR في العامود المخصص بالورقة دائماً
    var qrColIdxToSave = 0;
    if (currentHeaders && currentHeaders.length > 0) {
      for (var qhi = 0; qhi < currentHeaders.length; qhi++) {
        var qHText = (currentHeaders[qhi] || "").toString().trim().toLowerCase();
        if (qHText.indexOf("qr") !== -1 || qHText.indexOf("باركود") !== -1 || qHText.indexOf("استجابة") !== -1 || qHText.indexOf("استجابه") !== -1) {
          qrColIdxToSave = qhi + 1;
          break;
        }
      }
    }
    if (!qrColIdxToSave && emailConfig && emailConfig.qrDriveUrlColumn) {
      qrColIdxToSave = colLetterToNumber(emailConfig.qrDriveUrlColumn);
    }
    
    if (sheet && rowIdx && qrColIdxToSave > 0) {
      try {
        if (sheet.getMaxColumns() < qrColIdxToSave) {
          sheet.insertColumnsAfter(sheet.getMaxColumns(), qrColIdxToSave - sheet.getMaxColumns() + 1);
        }
        sheet.getRange(rowIdx, qrColIdxToSave).setValue(driveQrFileUrl || qrImageUrl);
        SpreadsheetApp.flush();
      } catch(qSetErr) {
        Logger.log("QR Sheet write note: " + qSetErr.message);
      }
    }

    // بناء جدول البيانات المرسلة
    var dataFields = emailConfig.dataFields || [
      { label: "رقم التسجيل", labelEn: "Registration ID", labelTh: "หมายเลขลงทะเบียน", columnLetter: "B" },
      { label: "اسم المشترك", labelEn: "Subscriber Name", labelTh: "ชื่อผู้สมัคร", columnLetter: "C" },
      { label: "تاريخ ووقت التسجيل", labelEn: "Registration Date", labelTh: "วันเวลาที่ลงทะเบียน", columnLetter: "A" },
      { label: "رابط الدخول لصفحة الاشتراك", labelEn: "Subscriber Portal Link", labelTh: "ลิงก์เข้าสู่ระบบ", columnLetter: "LOGIN_URL" }
    ];

    var tableRowsHtml = "";
    for (var dfi = 0; dfi < dataFields.length; dfi++) {
      var field = dataFields[dfi];
      var fLabel = (userLang === "en" ? field.labelEn : (userLang === "th" ? field.labelTh : field.label)) || field.label;
      var fValue = "";

      if (field.columnLetter === "LOGIN_URL" || field.columnLetter === "رابط") {
        var linkText = userLang === "en" ? "Subscriber Portal Page ↗" : (userLang === "th" ? "หน้าพอร์ทัลสมาชิก ↗" : "صفحة منصة المشتركين ↗");
        fValue = '<a href="https://ais-pre-ir2kvvsxhah76liwnkywmg-140605651087.asia-east1.run.app" style="color:#d97706;font-weight:bold;text-decoration:none;">' + linkText + '</a>';
      } else {
        var colNum = colLetterToNumber(field.columnLetter);
        if (rowValues && rowValues.length >= colNum && rowValues[colNum - 1]) {
          fValue = rowValues[colNum - 1].toString().trim();
        } else if (data.answersMap && data.answersMap[field.label]) {
          fValue = data.answersMap[field.label];
        } else if (field.label === "رقم التسجيل") {
          fValue = registrationId;
        } else if (field.label === "الاسم" || field.label === "اسم المشترك") {
          fValue = displayName;
        } else if (field.label === "تاريخ ووقت التسجيل") {
          fValue = timestamp;
        }
      }

      tableRowsHtml += '<tr>' +
        '<td style="padding:12px 16px;border-bottom:1px solid #334155;background:#0f172a;color:#94a3b8;font-weight:bold;width:38%;">' + fLabel + '</td>' +
        '<td style="padding:12px 16px;border-bottom:1px solid #334155;background:#1e293b;color:#f8fafc;font-weight:600;">' + (fValue || "-") + '</td>' +
      '</tr>';
    }

    // بناء المرفقات والروابط والملفات المرفقة فعلياً بالإيميل
    var attachments = emailConfig.attachments || [];
    var attachmentsHtml = "";
    var emailFileBlobs = [];
    var inlineImagesMap = {};

    for (var ati = 0; ati < attachments.length; ati++) {
      var att = attachments[ati];
      if (!att || !att.url) continue;

      var attTitle = (userLang === "en" ? att.titleEn : (userLang === "th" ? att.titleTh : att.title)) || att.title || (userLang === "en" ? "Attached Resource" : (userLang === "th" ? "เอกสารแนบ" : "ملف مرفق"));
      var rawUrl = (att.url || "").toString().trim();
      var normalizedUrl = normalizeDriveImageUrl(rawUrl);
      var attType = (att.type || "file_button").toString().toLowerCase().trim();
      var isImg = attType === "image";

      var driveId = "";
      if (rawUrl.indexOf("/file/d/") !== -1) {
        driveId = rawUrl.split("/file/d/")[1].split("/")[0].split("?")[0].split("&")[0];
      } else if (rawUrl.indexOf("id=") !== -1) {
        driveId = rawUrl.split("id=")[1].split("&")[0].split("#")[0].split("/")[0];
      }

      var imgBlob = null;
      var fileBlob = null;

      // 1. جلب الملف أو الصورة من Google Drive إن وُجد
      if (driveId) {
        try {
          var dFile = DriveApp.getFileById(driveId);
          if (dFile && dFile.getSize() < 15 * 1024 * 1024) {
            var fetchedBlob = dFile.getBlob();
            var mime = (fetchedBlob.getContentType() || "").toLowerCase();
            var ext = mime.indexOf("png") !== -1 ? ".png" : (mime.indexOf("pdf") !== -1 ? ".pdf" : (mime.indexOf("jpeg") !== -1 || mime.indexOf("jpg") !== -1 ? ".jpg" : ""));
            var cleanName = attTitle;
            if (ext && cleanName.indexOf(ext) === -1 && cleanName.indexOf(".") === -1) {
              cleanName += ext;
            }
            fetchedBlob.setName(cleanName);
            
            if (isImg && mime.indexOf("image") !== -1) {
              imgBlob = fetchedBlob;
            } else {
              fileBlob = fetchedBlob;
              isImg = false;
            }
          }
        } catch(dErr) {
          Logger.log("Drive getFileById note: " + dErr.message);
        }
      }

      // 2. إذا كانت صورة خارجية ولم يتم جلبها بعد، جلبها كـ Blob
      if (isImg && !imgBlob && (normalizedUrl.indexOf("http") === 0)) {
        try {
          var fetched = UrlFetchApp.fetch(normalizedUrl, { muteHttpExceptions: true });
          if (fetched.getResponseCode() === 200) {
            imgBlob = fetched.getBlob();
            imgBlob.setName("attachment_" + (ati + 1) + ".jpg");
          }
        } catch(fErr) {
          Logger.log("UrlFetchApp image note: " + fErr.message);
        }
      }

      // إضافة الملف للمرفقات القابلة للتحميل
      if (fileBlob) {
        emailFileBlobs.push(fileBlob);
      } else if (imgBlob && isImg) {
        emailFileBlobs.push(imgBlob);
      }

      // تجهيز كود العرض داخل HTML
      var cidKey = "att_img_" + ati;
      if (isImg && imgBlob) {
        inlineImagesMap[cidKey] = imgBlob;
        attachmentsHtml += '<div style="margin-top:16px;text-align:center;background:#1e293b;padding:16px;border-radius:12px;border:1px solid #475569;">' +
          '<div style="color:#f8fafc;font-size:14px;margin-bottom:8px;font-weight:bold;">' + attTitle + '</div>' +
          '<img src="cid:' + cidKey + '" alt="' + attTitle + '" style="max-width:100%;max-height:280px;border-radius:8px;border:1px solid #64748b;display:block;margin:0 auto;" />' +
          '<div style="margin-top:8px;"><a href="' + rawUrl + '" target="_blank" style="color:#d97706;font-size:12px;text-decoration:none;font-weight:bold;">🔗 ' + (userLang === "en" ? "Open Image in Google Drive" : (userLang === "th" ? "เปิดรูปภาพใน Google Drive" : "فتح الصورة في Google Drive")) + ' ↗</a></div>' +
        '</div>';
      } else if (isImg) {
        attachmentsHtml += '<div style="margin-top:16px;text-align:center;background:#1e293b;padding:16px;border-radius:12px;border:1px solid #475569;">' +
          '<div style="color:#f8fafc;font-size:14px;margin-bottom:8px;font-weight:bold;">' + attTitle + '</div>' +
          '<img src="' + normalizedUrl + '" alt="' + attTitle + '" style="max-width:100%;max-height:280px;border-radius:8px;border:1px solid #64748b;display:block;margin:0 auto;" />' +
          '<div style="margin-top:8px;"><a href="' + rawUrl + '" target="_blank" style="color:#d97706;font-size:12px;text-decoration:none;font-weight:bold;">🔗 ' + (userLang === "en" ? "Open Image in Google Drive" : (userLang === "th" ? "เปิดรูปภาพใน Google Drive" : "فتح الصورة في Google Drive")) + ' ↗</a></div>' +
        '</div>';
      } else {
        attachmentsHtml += '<div style="margin:16px 0;text-align:center;">' +
          '<table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;display:inline-table;">' +
            '<tr>' +
              '<td align="center" style="background-color:#d97706;border-radius:10px;padding:12px 28px;box-shadow:0 4px 12px rgba(217,119,6,0.35);">' +
                '<a href="' + rawUrl + '" target="_blank" style="font-family:Arial,Tahoma,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;display:inline-block;">' +
                  '📄 ' + attTitle + ' (فتح وتحميل المرفق) ↗' +
                '</a>' +
              '</td>' +
            '</tr>' +
          '</table>' +
          '<div style="margin-top:6px;"><a href="' + rawUrl + '" target="_blank" style="color:#94a3b8;font-size:11px;text-decoration:underline;">' + rawUrl + '</a></div>' +
        '</div>';
      }
    }

    // جلب وحقن صورة QR Code كـ inline image لتظهر في جميع برامج وتطبيقات البريد
    var qrCidKey = "qrcode_pass_img";
    try {
      var qrFetch = UrlFetchApp.fetch(qrImageUrl, { muteHttpExceptions: true });
      if (qrFetch.getResponseCode() === 200) {
        var qrBlob = qrFetch.getBlob();
        qrBlob.setName("registration_qrcode.png");
        inlineImagesMap[qrCidKey] = qrBlob;
      }
    } catch (qrBlobErr) {
      Logger.log("QR Blob note: " + qrBlobErr.message);
    }

    // استبدال المتغيرات في الرسالة
    var subject = langTemplate.subject
      .replace(/{name}/g, displayName)
      .replace(/{id}/g, registrationId)
      .replace(/{email}/g, recipientEmail)
      .replace(/{date}/g, timestamp);

    var headerText = langTemplate.header
      .replace(/{name}/g, displayName)
      .replace(/{id}/g, registrationId)
      .replace(/{email}/g, recipientEmail)
      .replace(/{date}/g, timestamp);

    var bodyText = langTemplate.body
      .replace(/{name}/g, displayName)
      .replace(/{id}/g, registrationId)
      .replace(/{email}/g, recipientEmail)
      .replace(/{date}/g, timestamp);

    var footerNoteText = (langTemplate.footerNote || "")
      .replace(/{name}/g, displayName)
      .replace(/{id}/g, registrationId)
      .replace(/{email}/g, recipientEmail)
      .replace(/{date}/g, timestamp);

    // قالب HTML الاحترافي للإيميل
    var isRtl = userLang === "ar";
    var passBadge = userLang === "en" ? "Official Registration Pass" : (userLang === "th" ? "บัตรยืนยันการลงทะเบียนอย่างเป็นทางการ" : "بطاقة التسجيل والاشتراك المعتمدة");
    var regIdLabel = userLang === "en" ? "Reg ID:" : (userLang === "th" ? "รหัสการสมัคร:" : "رقم القيد:");
    var detailsHeader = userLang === "en" ? "📋 Registration & Access Details" : (userLang === "th" ? "📋 ข้อมูลการลงทะเบียนและการเข้าใช้งาน" : "📋 بيانات التسجيل والدخول المعتمدة");
    var qrHeader = userLang === "en" ? "📱 Your Digital Access Pass (QR Code)" : (userLang === "th" ? "📱 บัตรดิจิทัลและรหัส QR Code สำหรับเข้าใช้งาน" : "📱 رمز الاستجابة السريعة (بطاقة الدخول الذكية)");
    var qrSaveDriveText = userLang === "en" ? "🔗 Save High-Res Version from Google Drive" : (userLang === "th" ? "🔗 บันทึกรูปภาพความละเอียดสูงจาก Google Drive" : "🔗 حفظ نسخة بدقة عالية من Google Drive");
    var attHeader = userLang === "en" ? "📁 Attached Resources & Downloads" : (userLang === "th" ? "📁 เอกสารแนบและทรัพยากรการเรียนรู้" : "📁 المرفقات والروابط التوضيحية");
    var instituteName = userLang === "en" ? "Yousuf Dhannoon Calligraphy Institute" : (userLang === "th" ? "สถาบันศิลปะการเขียนอักษรอาหรับ ยูซุฟ ซันนูน" : "مؤسسة يوسف ذنون للخط العربي والتربية الفنية");

    var htmlBody = '<!DOCTYPE html>' +
      '<html dir="' + (isRtl ? 'rtl' : 'ltr') + '">' +
      '<head><meta charset="utf-8"></head>' +
      '<body style="margin:0;padding:24px 12px;background:#090d16;font-family:Arial,Tahoma,sans-serif;color:#f8fafc;direction:' + (isRtl ? 'rtl' : 'ltr') + ';">' +
        '<div style="max-width:620px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:18px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.6);">' +
          
          '<div style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);padding:30px 24px;text-align:center;border-bottom:2px solid #d97706;">' +
            '<div style="display:inline-block;padding:6px 16px;background:rgba(217,119,6,0.15);border:1px solid #d97706;border-radius:20px;color:#f59e0b;font-size:12px;font-weight:bold;margin-bottom:12px;">' +
              passBadge +
            '</div>' +
            '<h2 style="margin:0 0 8px 0;color:#f8fafc;font-size:22px;font-weight:bold;">' + headerText + '</h2>' +
            '<p style="margin:0;color:#94a3b8;font-size:14px;">' + displayName + ' | ' + regIdLabel + ' <span style="color:#f59e0b;font-weight:bold;">' + registrationId + '</span></p>' +
          '</div>' +

          '<div style="padding:28px 24px;">' +
            '<p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0 0 24px 0;">' + bodyText + '</p>' +

            (tableRowsHtml ? (
              '<div style="margin-bottom:28px;">' +
                '<h3 style="margin:0 0 12px 0;color:#f59e0b;font-size:16px;font-weight:bold;">' +
                  detailsHeader +
                '</h3>' +
                '<table style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #334155;border-radius:12px;overflow:hidden;font-size:14px;">' +
                  tableRowsHtml +
                '</table>' +
              '</div>'
            ) : '') +

            ((emailConfig.includeQrInEmail !== false) ? (
              '<div style="background:#1e293b;border:1px solid #475569;border-radius:14px;padding:20px;text-align:center;margin-bottom:28px;">' +
                '<div style="color:#f59e0b;font-size:14px;font-weight:bold;margin-bottom:8px;">' +
                  qrHeader +
                '</div>' +
                '<div style="background:#ffffff;padding:12px;display:inline-block;border-radius:12px;margin:8px 0;">' +
                  '<img src="' + (inlineImagesMap[qrCidKey] ? ('cid:' + qrCidKey) : qrImageUrl) + '" alt="QR Code" width="180" height="180" style="display:block;" />' +
                '</div>' +
                '<div style="color:#94a3b8;font-size:12px;margin-top:6px;">' + (driveQrFileUrl ? ('<a href="' + driveQrFileUrl + '" target="_blank" style="color:#d97706;text-decoration:none;">' + qrSaveDriveText + '</a>') : ('ID: ' + registrationId)) + '</div>' +
              '</div>'
            ) : '') +

            (attachmentsHtml ? (
              '<div style="margin-bottom:24px;border-top:1px solid #334155;padding-top:20px;">' +
                '<h3 style="margin:0 0 12px 0;color:#cbd5e1;font-size:15px;font-weight:bold;text-align:center;">' +
                  attHeader +
                '</h3>' +
                attachmentsHtml +
              '</div>'
            ) : '') +

            (footerNoteText ? (
              '<div style="padding:14px 18px;background:rgba(217,119,6,0.1);border-right:3px solid #d97706;border-radius:8px;color:#fcd34d;font-size:13px;line-height:1.6;margin-top:20px;">' +
                'ℹ️ ' + footerNoteText +
              '</div>'
            ) : '') +
          '</div>' +

          '<div style="background:#090d16;padding:20px;text-align:center;border-top:1px solid #1e293b;color:#64748b;font-size:12px;">' +
            '<div>' + instituteName + ' © ' + new Date().getFullYear() + '</div>' +
            '<div style="margin-top:4px;">Yousuf Dhannoon Calligraphy Institute</div>' +
          '</div>' +

        '</div>' +
      '</body>' +
      '</html>';

    // إرسال الإيميل عبر خدمة MailApp المعتمدة مع المرفقات والصور المضمنة
    var mailPayload = {
      to: recipientEmail,
      subject: subject,
      htmlBody: htmlBody
    };
    if (emailFileBlobs.length > 0) {
      mailPayload.attachments = emailFileBlobs;
    }
    if (Object.keys(inlineImagesMap).length > 0) {
      mailPayload.inlineImages = inlineImagesMap;
    }

    MailApp.sendEmail(mailPayload);

    // تسجيل حالة "تم الإرسال" في العامود المخصص بالورقة دائماً
    var statusColIdxToSave = 0;
    if (currentHeaders && currentHeaders.length > 0) {
      for (var shi = 0; shi < currentHeaders.length; shi++) {
        var sHText = (currentHeaders[shi] || "").toString().trim().toLowerCase();
        if (sHText.indexOf("إرسال") !== -1 || sHText.indexOf("ارسال") !== -1 || sHText.indexOf("حالة") !== -1 || sHText.indexOf("حاله") !== -1 || sHText.indexOf("تأكيد") !== -1 || sHText.indexOf("تاكيد") !== -1 || sHText.indexOf("status") !== -1) {
          statusColIdxToSave = shi + 1;
          break;
        }
      }
    }
    if (!statusColIdxToSave && emailConfig && emailConfig.deliveryStatusColumn) {
      statusColIdxToSave = colLetterToNumber(emailConfig.deliveryStatusColumn);
    }
    
    if (sheet && rowIdx && statusColIdxToSave > 0) {
      try {
        if (sheet.getMaxColumns() < statusColIdxToSave) {
          sheet.insertColumnsAfter(sheet.getMaxColumns(), statusColIdxToSave - sheet.getMaxColumns() + 1);
        }
        sheet.getRange(rowIdx, statusColIdxToSave).setValue("تم الإرسال: " + timestamp);
        SpreadsheetApp.flush();
      } catch(sSetErr) {
        Logger.log("Status Sheet write note: " + sSetErr.message);
      }
    }

    Logger.log("تم إرسال بريد المشترك بنجاح إلى: " + recipientEmail);
    return { success: true, recipient: recipientEmail, qrDriveUrl: driveQrFileUrl };

  } catch (mailErr) {
    Logger.log("خطأ أثناء إرسال بريد المشترك: " + mailErr.message);
    return { success: false, error: mailErr.message };
  }
}

// 6. دالة رفع ملف أو صورة إلى مجلد قوقل درايف وحفظ الرابط
function uploadFileToDrive(base64Data, fileName, mimeType, folderId) {
  try {
    if (!base64Data) {
      return { success: false, error: "بيانات الملف فارغة" };
    }

    var targetFolderId = folderId || "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

    // تنظيف البادئة في حال كانت موجودة واستخراج Base64 نقي
    var rawStr = base64Data.toString();
    var cleanBase64 = rawStr;
    var cleanMime = mimeType || "image/jpeg";

    if (rawStr.indexOf("data:") !== -1 && rawStr.indexOf(";base64,") !== -1) {
      var parts = rawStr.split(";base64,");
      cleanMime = parts[0].replace("data:", "");
      cleanBase64 = parts[1];
    } else if (rawStr.indexOf("base64,") !== -1) {
      cleanBase64 = rawStr.split("base64,")[1];
    }

    // إزالة الفراغات والأسطر الجديدة
    cleanBase64 = cleanBase64.split(" ").join("").split(String.fromCharCode(10)).join("").split(String.fromCharCode(13)).join("");

    var decodedBytes = Utilities.base64Decode(cleanBase64);
    var ext = cleanMime.indexOf("png") !== -1 ? ".png" : (cleanMime.indexOf("pdf") !== -1 ? ".pdf" : ".jpg");
    var cleanFileName = fileName || ("upload_" + Utilities.formatDate(new Date(), "GMT+3", "yyyyMMdd_HHmmss") + ext);
    if (cleanFileName.indexOf(".") === -1) cleanFileName += ext;

    var blob = Utilities.newBlob(decodedBytes, cleanMime, cleanFileName);
    var file = null;

    // محاولة إنشاء الملف داخل المجلد المحدد، وإن لم يتيسر يتم إنشاؤه في المجلد الرئيسي للدرايف
    if (targetFolderId) {
      try {
        var folder = DriveApp.getFolderById(targetFolderId);
        if (folder) {
          file = folder.createFile(blob);
        }
      } catch (folderErr) {
        file = null;
      }
    }

    if (!file) {
      file = DriveApp.createFile(blob);
    }

    if (!file) {
      return { success: false, error: "تعذر إنشاء ملف الصورة على Google Drive" };
    }

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (permErr) {
      Logger.log("Permission warning: " + permErr.message);
    }

    var fileId = file.getId();
    var fileUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
    var downloadUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

    return {
      success: true,
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      fileId: fileId,
      fileName: file.getName(),
      message: "تم رفع الملف إلى قوقل درايف بنجاح"
    };

  } catch (err) {
    return {
      success: false,
      error: "خطأ في صلاحية Google Drive: " + err.message
    };
  }
}

// 7. دالة اختبار وتفويض صلاحية Google Drive الشاملة (قراءة وإنشاء ملفات)
function testDrivePermission() {
  try {
    // تجربة إنشاء ملف تجريبي لفرض الحصول على صلاحية الكتابة الكاملة في Google Drive
    var testBlob = Utilities.newBlob("Test file creation for authorization", "text/plain", "thnoon_auth_test.txt");
    var testFile = DriveApp.createFile(testBlob);
    var fileId = testFile.getId();
    
    // حذف الملف التجريبي فوراً لإبقاء الدرايف نظيفاً
    testFile.setTrashed(true);
    
    Logger.log("تم تفويض وتأكيد صلاحية إنشاء الملفات في Google Drive بنجاح 100%");
    return "تم تفعيل صلاحية Google Drive الكاملة بنجاح";
  } catch (err) {
    Logger.log("خطأ في تفويض الدرايف: " + err.message);
    throw err;
  }
}

// 6. دالة حفظ رسائل الاستفسار
function submitInquiry(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "الرسائل";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["التاريخ والوقت", "الاسم الكريم", "البريد الإلكتروني", "الموضوع", "مضمون الرسالة"]);
      sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#FFF2CC");
    }
    
    sheet.appendRow([
      data.timestamp,
      data.name,
      data.email,
      data.subject,
      data.message
    ]);
    
    return { success: true, message: "تم حفظ رسالتك بنجاح" };
  } catch (err) {
    return { success: false, message: "خطأ في حفظ الرسالة: " + err.message };
  }
}

// 7. تسجيل الدخول الآمن للمشتركين والتحقق من الأجهزة وحالة الاشتراك
function loginUser(username, password, deviceId, lat, lng, locationName, deviceInfo) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) {
      return { success: false, message: "ورقة الإعدادات غير موجودة" };
    }
    
    var lastRow = settingsSheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, message: "لا يوجد مستخدمين مسجلين" };
    }

    // التأكد من توفر الأعمدة الكافية حتى AW
    if (settingsSheet.getMaxColumns() < 49) {
      settingsSheet.insertColumnsAfter(settingsSheet.getMaxColumns(), 49 - settingsSheet.getMaxColumns() + 2);
    }
    
    var usersRange = settingsSheet.getRange(2, 1, lastRow - 1, Math.max(49, settingsSheet.getMaxColumns()));
    var usersData = usersRange.getValues();
    var userRow = -1;
    var userRowIdx = -1;
    
    // دوال المطابقة المرنة للأسماء والأرقام
    function normArabic(str) {
      if (!str) return "";
      var s = str.toString().trim();
      s = s.replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, "");
      s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
      s = s.replace(/[إأآٱ]/g, "ا");
      s = s.replace(/[ة]/g, "ه");
      s = s.replace(/[يى]/g, "ي");
      var arDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      var faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      for (var d = 0; d <= 9; d++) {
        s = s.split(arDigits[d]).join(String(d));
        s = s.split(faDigits[d]).join(String(d));
      }
      return s.trim().toLowerCase();
    }

    function normCode(str) {
      if (!str) return "";
      var s = str.toString().trim().replace(/['",\s\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, "");
      var arDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      var faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      for (var d = 0; d <= 9; d++) {
        s = s.split(arDigits[d]).join(String(d));
        s = s.split(faDigits[d]).join(String(d));
      }
      if (s.indexOf(".0") !== -1 && s.slice(-2) === ".0") {
        s = s.substring(0, s.length - 2);
      }
      return s.trim().toLowerCase();
    }

    var targetNormUser = normArabic(username);
    var targetNormPass = normCode(password);

    for (var i = 0; i < usersData.length; i++) {
      var sheetColB = (usersData[i][1] || "").toString().trim(); // Column B (index 1)
      var sheetUser = (usersData[i][25] || "").toString().trim(); // Column Z (index 25)
      var sheetPass = (usersData[i][26] || "").toString().trim(); // Column AA (index 26)

      var normZ = normArabic(sheetUser);
      var normB = normArabic(sheetColB);
      var normAA = normCode(sheetPass);

      var uMatch = (normZ && (normZ === targetNormUser || normZ.indexOf(targetNormUser) !== -1 || targetNormUser.indexOf(normZ) !== -1)) ||
                   (normB && (normB === targetNormUser || normB.indexOf(targetNormUser) !== -1 || targetNormUser.indexOf(normB) !== -1)) ||
                   (targetNormPass && (normZ === targetNormPass || normB === targetNormPass));

      var pMatch = (normAA && (normAA === targetNormPass || normAA.indexOf(targetNormPass) !== -1 || targetNormPass.indexOf(normAA) !== -1)) ||
                   (sheetPass && password && sheetPass === password.toString().trim()) ||
                   (!normAA && !targetNormPass);

      if (uMatch && pMatch) {
        userRow = i + 2;
        userRowIdx = i;
        break;
      }
    }
    
    if (userRow === -1) {
      return { success: false, message: 'اسم المشترك غير موجود، يرجى التأكد من التسجيل' };
    }
    
    var userData = usersData[userRowIdx];

    // أ) فحص العامود AB (العمود 28 - الفهرس 27): حالة الاشتراك (ممنوع / مسموح)
    var accountStatus = (userData[27] || "").toString().trim();
    if (accountStatus === "ممنوع" || accountStatus === "معطل" || accountStatus === "محظور" || accountStatus === "لا") {
      return { 
        success: false, 
        isBlocked: true,
        message: 'تم إيقاف أو تعليق هذا الحساب من قبل الإدارة (حالة الاشتراك: ممنوع)' 
      };
    }

    // ب) فحص العامود AC (العمود 29 - الفهرس 28): عدد الأجهزة المسموحة
    var maxAllowedDevices = 1;
    var rawMaxDev = userData[28];
    if (rawMaxDev !== undefined && rawMaxDev !== null && rawMaxDev !== "") {
      var parsedMax = parseInt(rawMaxDev, 10);
      if (!isNaN(parsedMax) && parsedMax > 0) {
        maxAllowedDevices = parsedMax;
      }
    }

    // ج) التحقق من الجهاز وتسجيل بصمة وموقع الجهاز في الأعمدة AD:AW
    // AD=30(29), AE=31(30), AF=32(31), AG=33(32), AH=34(33), AI=35(34)...
    var currentDeviceId = (deviceId || "").toString().trim();
    var currentLocText = locationName || "";
    if (!currentLocText && lat && lng) {
      currentLocText = "إحداثيات: " + lat + ", " + lng;
    }
    if (!currentLocText) {
      currentLocText = Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd HH:mm");
    }
    var currentDevText = deviceInfo || currentDeviceId || "متصفح الويب";

    if (currentDeviceId) {
      var isKnownDevice = false;
      var registeredDeviceCount = 0;
      var firstEmptyDeviceSlotIndex = -1; // 0-based device slot (0, 1, 2...)
      var cleanCurDevId = currentDeviceId.toString().trim();

      for (var d = 0; d < maxAllowedDevices; d++) {
        var locColIdx = 29 + (d * 2); // 29 -> AD (Col 30), 31 -> AF (Col 32)...
        var devColIdx = 30 + (d * 2); // 30 -> AE (Col 31), 32 -> AG (Col 33)...
        
        var regLoc = (userData[locColIdx] || "").toString().trim();
        var regDev = (userData[devColIdx] || "").toString().trim();

        if (regDev) {
          registeredDeviceCount++;
          // فحص أمني شامل ودقيق 100% لبصمة الجهاز الفريدة (غير حساس لحالة الأحرف ويدعم [f658b6f9] و [ID:...])
          var normReg = regDev.toString().toLowerCase().trim();
          var normCur = cleanCurDevId.toLowerCase().trim();
          var cleanWithoutDev = normCur.replace(/^(dev|id|device)[-:_]/i, "").trim();

          var isMatch = false;

          // 1. مطابقة مباشرة وتضمينية
          if (normReg === normCur || normReg === cleanWithoutDev || normReg.indexOf(normCur) !== -1 || normCur.indexOf(normReg) !== -1) {
            isMatch = true;
          } else if (cleanWithoutDev && (normReg.indexOf(cleanWithoutDev) !== -1 || cleanWithoutDev.indexOf(normReg) !== -1)) {
            isMatch = true;
          }

          // 2. استخراج وفحص أي نص داخل الأقواس المربعة [...] مثل [f658b6f9] أو [ID:715350ca...]
          if (!isMatch) {
            var searchStart = 0;
            while (searchStart < normReg.length) {
              var openBracket = normReg.indexOf("[", searchStart);
              if (openBracket === -1) break;
              var closeBracket = normReg.indexOf("]", openBracket);
              if (closeBracket === -1) break;

              var rawInside = normReg.substring(openBracket + 1, closeBracket).trim();
              var cleanInside = rawInside.replace(/^(id|dev|device)[:\s_-]*/i, "").trim();

              if (cleanInside) {
                if (cleanInside === normCur || cleanInside === cleanWithoutDev) {
                  isMatch = true;
                  break;
                }
                if (normCur.indexOf(cleanInside) !== -1 || cleanWithoutDev.indexOf(cleanInside) !== -1) {
                  isMatch = true;
                  break;
                }
                if (cleanInside.indexOf(normCur) !== -1 || cleanInside.indexOf(cleanWithoutDev) !== -1) {
                  isMatch = true;
                  break;
                }
                // فحص المقاطع السداسية أو المعرفات المختصرة (6 أحرف فأكثر)
                if (cleanInside.length >= 6) {
                  if (cleanWithoutDev.indexOf(cleanInside) === 0 || normCur.indexOf(cleanInside) === 0) {
                    isMatch = true;
                    break;
                  }
                  if (cleanWithoutDev.indexOf(cleanInside) !== -1) {
                    isMatch = true;
                    break;
                  }
                }
              }

              searchStart = closeBracket + 1;
            }
          }

          // 3. فحص البداية المختصرة للرمز (أول 8 أحرف)
          if (!isMatch && cleanWithoutDev.length >= 6) {
            var curShort = cleanWithoutDev.substring(0, 8);
            if (normReg.indexOf(curShort) !== -1) {
              isMatch = true;
            }
          }

          if (isMatch) {
            isKnownDevice = true;
            // تحديث وقت آخر دخول وموقع الجهاز المعروف في خانته
            try {
              settingsSheet.getRange(userRow, locColIdx + 1).setValue(currentLocText + " (" + Utilities.formatDate(new Date(), "GMT+3", "dd/MM HH:mm") + ")");
            } catch(e) {}
            break;
          }
        } else {
          if (firstEmptyDeviceSlotIndex === -1) {
            firstEmptyDeviceSlotIndex = d;
          }
        }
      }

      // إذا كان جهازاً جديداً وغير معروف
      if (!isKnownDevice) {
        if (registeredDeviceCount >= maxAllowedDevices) {
          return {
            success: false,
            deviceLimitReached: true,
            message: 'لقد استنفدت الحد الأقصى المسموح به من الأجهزة (' + maxAllowedDevices + ' جهاز). يرجى التواصل مع الإدارة لإعادة التعيين.'
          };
        }

        // تسجيل الجهاز الجديد في أول خانة فارغة
        if (firstEmptyDeviceSlotIndex !== -1) {
          var targetLocCol = 30 + (firstEmptyDeviceSlotIndex * 2); // 1-based sheet column (AD=30, AF=32)
          var targetDevCol = 31 + (firstEmptyDeviceSlotIndex * 2); // 1-based sheet column (AE=31, AG=33)

          try {
            settingsSheet.getRange(userRow, targetLocCol).setValue(currentLocText);
            // نسجل المعرف الكامل مع وصف الجهاز لسهولة المطابقة الموثوقة 100% في المرات القادمة
            settingsSheet.getRange(userRow, targetDevCol).setValue(currentDevText + " [ID:" + cleanCurDevId + "]");
            SpreadsheetApp.flush();
          } catch(devWriteErr) {
            Logger.log("Device log error: " + devWriteErr.message);
          }
        }
      }
    }

    var rawTopicVal = (userData[0] !== undefined && userData[0] !== null) ? userData[0].toString().trim() : '';
    var rawTopicId = (rawTopicVal && rawTopicVal !== "0" && rawTopicVal !== "null" && rawTopicVal !== "undefined") ? rawTopicVal : '1';
    
    // إذا كان العامود A فارغاً في ورقة Settings، نضع 1 فوراً وتلقائياً ونحفظ
    if (!rawTopicVal || rawTopicVal === "" || rawTopicVal === "0") {
      try {
        settingsSheet.getRange(userRow, 1).setValue(1);
        SpreadsheetApp.flush();
      } catch(e) {}
    }

    function cleanTopicStr(s) {
      if (!s) return '1';
      var str = s.toString().trim().replace(/['"]/g, '');
      var num = parseFloat(str);
      return (!isNaN(num) && Math.floor(num) === num) ? num.toString() : str;
    }
    var topicId = cleanTopicStr(rawTopicId);
    var topicContent = null;
    
    try {
      var contentSheet = ss.getSheetByName("SubscriberContent");
      if (contentSheet) {
        var cData = contentSheet.getDataRange().getValues();
        for (var c = 1; c < cData.length; c++) {
          var rowTopicStr = cData[c][0] ? cData[c][0].toString().trim() : '';
          var cleanedRowTopic = cleanTopicStr(rowTopicStr);
          if (cleanedRowTopic === topicId || rowTopicStr === rawTopicId || rowTopicStr === topicId) {
            var cRow = cData[c];
            var cards = [];
            for (var k = 0; k < 10; k++) {
              var baseIdx = 5 + (k * 4);
              var cardTitle = cRow[baseIdx] ? cRow[baseIdx].toString().trim() : '';
              var cardDesc = cRow[baseIdx + 1] ? cRow[baseIdx + 1].toString().trim() : '';
              var cardMediaRaw = cRow[baseIdx + 2] ? cRow[baseIdx + 2].toString().trim() : '';
              var cardLinkUrl = cRow[baseIdx + 3] ? cRow[baseIdx + 3].toString().trim() : '';
              if (cardTitle || cardDesc || cardMediaRaw || cardLinkUrl) {
                var mediaArr = [];
                if (cardMediaRaw) {
                  var rawList = cardMediaRaw.split(String.fromCharCode(10)).join(',').split(String.fromCharCode(13)).join(',').split('|').join(',').split(',');
                  for (var m = 0; m < rawList.length; m++) {
                    var u = rawList[m].trim();
                    if (u) {
                      var isVid = u.toLowerCase().indexOf('youtube') !== -1 || u.toLowerCase().indexOf('youtu.be') !== -1 || u.toLowerCase().indexOf('.mp4') !== -1;
                      mediaArr.push({ url: u, type: isVid ? 'video' : 'image' });
                    }
                  }
                }
                cards.push({
                  title: cardTitle || ('البطاقة ' + (k + 1)),
                  description: cardDesc,
                  media: mediaArr,
                  linkUrl: (cardLinkUrl && cardLinkUrl !== '-') ? cardLinkUrl : undefined,
                  buttonText: (cardLinkUrl && cardLinkUrl !== '-') ? 'فتح الرابط المرفق' : undefined
                });
              }
            }
            topicContent = {
              topicId: topicId,
              title: cRow[1] ? cRow[1].toString().trim() : 'المحتوى المخصص للمشترك',
              description: cRow[2] ? cRow[2].toString().trim() : '',
              coverImage: (cRow[3] && cRow[3].toString().trim() !== '-') ? cRow[3].toString().trim() : undefined,
              badge: (cRow[4] && cRow[4].toString().trim() !== '-') ? cRow[4].toString().trim() : undefined,
              cards: cards
            };
            break;
          }
        }
      }
    } catch (e) {}

    return {
      success: true,
      subscriberName: userData[1] || username,
      topicId: topicId,
      content: topicContent,
      linkButtonText1: userData[2] || '',
      linkButtonComment1: userData[3] || '',
      url1: userData[4] || '',
      linkButtonText2: userData[5] || '',
      linkButtonComment2: userData[6] || '',
      url2: userData[7] || '',
      linkButtonText3: userData[8] || '',
      linkButtonComment3: userData[9] || '',
      url3: userData[10] || '',
      linkButtonText4: userData[11] || '',
      linkButtonComment4: userData[12] || '',
      url4: userData[13] || '',
      linkButtonText5: userData[14] || '',
      linkButtonComment5: userData[15] || '',
      url5: userData[16] || '',
      exitButtonText: userData[17] || 'تسجيل الخروج',
      exitButtonComment: userData[18] || ''
    };
  } catch (e) {
    return { success: false, message: 'خطأ في التحقق من الدخول: ' + e.message };
  }
}

// 8. دالة اختبار إرسال إيميل المشترك مباشرة من داخل محرر Google Apps Script لتفويض الصلاحيات
function testSendSubscriberEmailDirectly() {
  try {
    var myEmail = Session.getActiveUser().getEmail() || "shyk4test2020@gmail.com";
    Logger.log("بدء تجربة إرسال إيميل المشترك إلى: " + myEmail);
    var res = sendCustomSubscriberEmail(
      null, 
      null, 
      {
        name: "تجربة إيميل المشترك",
        email: myEmail,
        registrationId: "TEST-2026",
        timestamp: Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd - hh:mm a"),
        formLang: "ar",
        answersMap: {
          "الاسم": "تجربة إيميل المشترك",
          "ايميل": myEmail,
          "رقم التسجيل": "TEST-2026"
        }
      }, 
      null, 
      null, 
      null
    );
    Logger.log("نتيجة الإرسال: " + JSON.stringify(res));
    return res;
  } catch (err) {
    Logger.log("خطأ: " + err.message);
    throw err;
  }
}
// 9. دالة إرسال إشعار تلغرام المباشر للإدارة للمتابعة الفورية مع دعم إرفاق الصور والملفات
function sendTelegramNotificationToAdmin(data, rowValues, currentHeaders, customTelegramConfig) {
  try {
    var telegramConfig = customTelegramConfig;
    if (!telegramConfig) {
      var savedStr = PropertiesService.getScriptProperties().getProperty("TELEGRAM_CONFIG");
      if (savedStr) {
        try { telegramConfig = JSON.parse(savedStr); } catch(e) {}
      }
    }

    if (!telegramConfig || !telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
      return { success: false, reason: "Telegram not configured or disabled" };
    }

    var token = telegramConfig.botToken.toString().trim();
    var chatId = telegramConfig.chatId.toString().trim();
    var topicId = telegramConfig.topicId ? telegramConfig.topicId.toString().trim() : "";

    function escapeTelHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    var name = data.name || data.nameArabic || (data.answersMap && (data.answersMap["الاسم"] || data.answersMap["اسم المشترك"])) || "مشترك جديد";
    var regId = data.registrationId || "REG-" + Date.now().toString().slice(-6);
    var phone = data.phone || (data.answersMap && (data.answersMap["رقم الهاتف"] || data.answersMap["الهاتف"] || data.answersMap["الواتساب"])) || "";
    var email = data.email || (data.answersMap && (data.answersMap["ايميل"] || data.answersMap["البريد الإلكتروني"])) || "";
    var timestamp = data.timestamp || Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd - hh:mm a");

    // استخراج معرف Google Drive أو الصورة بدقة
    var driveFileId = "";
    var rawBase64 = "";
    var rawAttachmentUrl = "";

    function extractFileIdFromUrl(url) {
      if (!url || typeof url !== "string") return "";
      if (url.indexOf("/file/d/") !== -1) {
        return url.split("/file/d/")[1].split("/")[0].split("?")[0].split("&")[0];
      } else if (url.indexOf("id=") !== -1) {
        return url.split("id=")[1].split("&")[0].split("#")[0].split("/")[0];
      }
      return "";
    }

    if (telegramConfig.includeAttachment !== false) {
      // 1. فحص الحقل المباشر attachment
      if (data.attachment && typeof data.attachment === "string") {
        if (data.attachment.indexOf("data:") === 0 || data.attachment.indexOf("base64,") !== -1) {
          rawBase64 = data.attachment;
        } else {
          rawAttachmentUrl = data.attachment;
          driveFileId = extractFileIdFromUrl(data.attachment);
        }
      }

      // 2. فحص مصفوفة الإجابات
      if (!driveFileId && !rawBase64 && data.answers && Array.isArray(data.answers)) {
        for (var ak = 0; ak < data.answers.length; ak++) {
          var aItem = data.answers[ak];
          if (!aItem || !aItem.answer) continue;
          var aStr = aItem.answer.toString().trim();
          if (aStr.indexOf("data:") === 0 || aStr.indexOf("base64,") !== -1) {
            rawBase64 = aStr;
            break;
          }
          var fId = extractFileIdFromUrl(aStr);
          if (fId) {
            driveFileId = fId;
            rawAttachmentUrl = aStr;
            break;
          }
        }
      }

      // 3. فحص قاموس الإجابات answersMap
      if (!driveFileId && !rawBase64 && data.answersMap) {
        for (var amKey in data.answersMap) {
          var amVal = (data.answersMap[amKey] || "").toString().trim();
          if (!amVal) continue;
          if (amVal.indexOf("data:") === 0 || amVal.indexOf("base64,") !== -1) {
            rawBase64 = amVal;
            break;
          }
          var fId2 = extractFileIdFromUrl(amVal);
          if (fId2) {
            driveFileId = fId2;
            rawAttachmentUrl = amVal;
            break;
          }
        }
      }
    }

    // توليد بيانات ورابط رمز الـ QR Code الخاص بالمشترك للإشعار
    var qrInfo = null;
    var qrCodeCols = (data.emailConfig && data.emailConfig.qrCodeColumns) ? data.emailConfig.qrCodeColumns : "B, C";
    if (telegramConfig.includeQrCode !== false) {
      qrInfo = generateSubscriberQrData(qrCodeCols, data, rowValues, currentHeaders, null, null);
    }

    // تجهيز الملف أو الصورة كـ Blob لإرسالها مباشرة لـ Telegram
    var photoBlob = null;
    var driveViewUrl = "";

    // 1. جلب الصورة المرفوعة من Google Drive كـ Blob أصلي
    if (driveFileId) {
      try {
        var dFile = DriveApp.getFileById(driveFileId);
        if (dFile) {
          driveViewUrl = "https://drive.google.com/file/d/" + driveFileId + "/view?usp=sharing";
          if (dFile.getSize() < 15 * 1024 * 1024) {
            photoBlob = dFile.getBlob();
            var mime = (photoBlob.getContentType() || "").toLowerCase();
            var fName = dFile.getName() || "uploaded_file";
            if (mime.indexOf("png") !== -1 && fName.indexOf(".png") === -1) {
              photoBlob.setName(fName + ".png");
            } else if (mime.indexOf("webp") !== -1 && fName.indexOf(".webp") === -1) {
              photoBlob.setName(fName + ".webp");
            } else if (mime.indexOf("pdf") !== -1 && fName.indexOf(".pdf") === -1) {
              photoBlob.setName(fName + ".pdf");
            } else if (fName.indexOf(".") === -1) {
              photoBlob.setName(fName + ".jpg");
            }
          }
        }
      } catch (dErr) {
        Logger.log("Drive getBlob error for Telegram: " + dErr.message);
      }
    }

    // 2. إذا كانت الصورة مشفرة بـ Base64
    if (!photoBlob && rawBase64) {
      try {
        var cleanBase64 = rawBase64.indexOf("base64,") !== -1 ? rawBase64.split("base64,")[1] : rawBase64;
        cleanBase64 = cleanBase64.split(" ").join("").split(String.fromCharCode(10)).join("").split(String.fromCharCode(13)).join("");
        var decodedBytes = Utilities.base64Decode(cleanBase64);
        photoBlob = Utilities.newBlob(decodedBytes, "image/jpeg", "uploaded_photo.jpg");
      } catch(bErr) {
        Logger.log("Base64 blob decode error for Telegram: " + bErr.message);
      }
    }

    // 3. إذا لم تكن هناك صورة مرفوعة وكان الـ QR Code مفعلاً، نستخدم رمز الـ QR
    if (!photoBlob && telegramConfig.includeQrCode !== false && qrInfo && qrInfo.qrUrl) {
      try {
        photoBlob = UrlFetchApp.fetch(qrInfo.qrUrl, { muteHttpExceptions: true }).getBlob();
        photoBlob.setName("QR_" + regId + ".png");
      } catch(qrFetchErr) {}
    }

    var msgLines = [];
    if (telegramConfig.customHeader) {
      msgLines.push("<b>" + escapeTelHtml(telegramConfig.customHeader) + "</b>");
    }
    var title = telegramConfig.notificationTitle ? escapeTelHtml(telegramConfig.notificationTitle) : "🔔 إشعار تسجيل جديد - مؤسسة يوسف ذنون";
    msgLines.push("<b>" + title + "</b>");
    msgLines.push("━━━━━━━━━━━━━━━━━━━━");
    msgLines.push("👤 <b>اسم المشترك:</b> " + escapeTelHtml(name));
    msgLines.push("🆔 <b>رقم التسجيل:</b> <code>" + escapeTelHtml(regId) + "</code>");
    if (phone) msgLines.push("📱 <b>الهاتف:</b> <code>" + escapeTelHtml(phone) + "</code>");
    if (email) msgLines.push("📧 <b>البريد:</b> " + escapeTelHtml(email));
    msgLines.push("⏰ <b>التاريخ والوقت:</b> " + escapeTelHtml(timestamp));

    if (telegramConfig.includeAllAnswers && data.answers && Array.isArray(data.answers) && data.answers.length > 0) {
      msgLines.push("");
      msgLines.push("📋 <b>تفاصيل الاستمارة:</b>");
      for (var i = 0; i < data.answers.length; i++) {
        var it = data.answers[i];
        if (!it) continue;
        var q = it.question || ("سؤال " + (i + 1));
        var a = it.answer;
        if (a === undefined || a === null || a === "") a = "-";

        var isDriveLink = (typeof a === "string") && (
          a.indexOf("drive.google.com") !== -1 ||
          a.indexOf("lh3.googleusercontent.com") !== -1
        );

        var isBase64Img = (typeof a === "string") && (
          a.indexOf("data:image") === 0 ||
          a.indexOf("base64,") !== -1
        );

        if (isDriveLink) {
          msgLines.push("▫️ <b>" + escapeTelHtml(q) + ":</b> <a href='" + a + "'>عرض المرفق من Google Drive ↗</a>");
        } else if (isBase64Img) {
          msgLines.push("▫️ <b>" + escapeTelHtml(q) + ":</b> <i>[صورة مرفقة بالإشعار 🖼️]</i>");
        } else if (typeof a === "string" && (a.indexOf("http://") === 0 || a.indexOf("https://") === 0)) {
          msgLines.push("▫️ <b>" + escapeTelHtml(q) + ":</b> <a href='" + a + "'>فتح الرابط ↗</a>");
        } else {
          var safeStr = String(a).length > 250 ? String(a).slice(0, 250) + "..." : String(a);
          msgLines.push("▫️ <b>" + escapeTelHtml(q) + ":</b> " + escapeTelHtml(safeStr));
        }
      }
    }

    if (telegramConfig.customFooter) {
      msgLines.push("");
      msgLines.push("<i>" + escapeTelHtml(telegramConfig.customFooter) + "</i>");
    }

    var fullHtmlMessage = msgLines.join(String.fromCharCode(10));

    // أزرار الروابط المخصصة في تلغرام
    var inlineKeyboard = [];

    // زر مباشر لفتح الصورة المرفوعة في Google Drive إذا وُجدت
    if (driveViewUrl) {
      inlineKeyboard.push([{ text: "🖼️ فتح المرفق في Google Drive ↗", url: driveViewUrl }]);
    } else if (rawAttachmentUrl && rawAttachmentUrl.indexOf("http") === 0) {
      inlineKeyboard.push([{ text: "📎 فتح الملف المرفق ↗", url: rawAttachmentUrl }]);
    }

    // زر مباشر لفتح رمز الـ QR Code دائماً في حال توفره
    if (telegramConfig.includeQrCode !== false && qrInfo && qrInfo.qrUrl) {
      inlineKeyboard.push([{ text: "🔳 عرض وتنزيل رمز QR Code ↗", url: qrInfo.qrUrl }]);
    }

    if (telegramConfig.customButtons && Array.isArray(telegramConfig.customButtons) && telegramConfig.customButtons.length > 0) {
      for (var b = 0; b < telegramConfig.customButtons.length; b++) {
        var cBtn = telegramConfig.customButtons[b];
        if (cBtn && cBtn.text && cBtn.url && cBtn.url.indexOf("http") === 0) {
          inlineKeyboard.push([{ text: cBtn.text.trim(), url: cBtn.url.trim() }]);
        }
      }
    }

    var replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : null;

    // 1. المحاولة الأولى: إرسال الصورة مباشرة كـ multipart/form-data عبر sendPhoto أو sendDocument
    if (photoBlob) {
      try {
        var mimeType = (photoBlob.getContentType() || "").toLowerCase();
        var isPdfDoc = mimeType.indexOf("pdf") !== -1 || photoBlob.getName().toLowerCase().indexOf(".pdf") !== -1;
        var methodEndpoint = isPdfDoc ? "sendDocument" : "sendPhoto";
        var fileParamKey = isPdfDoc ? "document" : "photo";

        var captionLimit = 950;
        var photoCaption = fullHtmlMessage;
        if (photoCaption.length > captionLimit) {
          photoCaption = photoCaption.slice(0, captionLimit - 50) + String.fromCharCode(10) + "... (تم اختصار باقي التفاصيل)";
        }

        var photoPayloadObj = {
          chat_id: chatId,
          caption: photoCaption,
          parse_mode: "HTML"
        };
        photoPayloadObj[fileParamKey] = photoBlob;
        if (topicId) photoPayloadObj.message_thread_id = Number(topicId);
        if (replyMarkup) photoPayloadObj.reply_markup = JSON.stringify(replyMarkup);

        var photoOptions = {
          method: "post",
          payload: photoPayloadObj,
          muteHttpExceptions: true
        };

        var pRes = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/" + methodEndpoint, photoOptions);
        var pData = JSON.parse(pRes.getContentText());

        if (pData && pData.ok) {
          Logger.log("Telegram " + methodEndpoint + " sent successfully with image!");
          return { success: true, result: pData.result, type: methodEndpoint };
        } else {
          Logger.log("sendPhoto HTML caption failed, retrying with Plain text caption: " + (pData ? pData.description : ""));
          // إعادة المحاولة بنص مجرد للـ Caption في حال وجود وسوم HTML غير مدعومة
          var plainCaption = photoCaption.replace(/<[^>]+>/g, "");
          var plainPhotoPayload = {
            chat_id: chatId,
            caption: plainCaption
          };
          plainPhotoPayload[fileParamKey] = photoBlob;
          if (topicId) plainPhotoPayload.message_thread_id = Number(topicId);
          if (replyMarkup) plainPhotoPayload.reply_markup = JSON.stringify(replyMarkup);

          var pRes2 = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/" + methodEndpoint, {
            method: "post",
            payload: plainPhotoPayload,
            muteHttpExceptions: true
          });
          var pData2 = JSON.parse(pRes2.getContentText());
          if (pData2 && pData2.ok) {
            return { success: true, result: pData2.result, type: methodEndpoint };
          }
        }
      } catch (photoErr) {
        Logger.log("sendPhoto exception in GAS: " + photoErr.message);
      }
    }

    // 2. المحاولة الثانية: إرسال الرسالة كنص HTML عبر sendMessage إذا لم تكن هناك صورة
    if (fullHtmlMessage.length > 3900) {
      fullHtmlMessage = fullHtmlMessage.slice(0, 3850) + String.fromCharCode(10) + "... (تم اختصار باقي البيانات)";
    }

    var url = "https://api.telegram.org/bot" + token + "/sendMessage";
    var payloadObj = {
      chat_id: chatId,
      text: fullHtmlMessage,
      parse_mode: "HTML"
    };
    if (topicId) payloadObj.message_thread_id = Number(topicId);
    if (replyMarkup) payloadObj.reply_markup = replyMarkup;

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payloadObj),
      muteHttpExceptions: true
    };

    var res = UrlFetchApp.fetch(url, options);
    var resData = JSON.parse(res.getContentText());

    // Fallback to plain text if HTML parsing failed
    if (!resData.ok) {
      var plainText = fullHtmlMessage.replace(/<[^>]+>/g, "");
      var fbPayload = {
        chat_id: chatId,
        text: plainText
      };
      if (topicId) fbPayload.message_thread_id = Number(topicId);
      if (replyMarkup) fbPayload.reply_markup = replyMarkup;

      var fbOptions = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(fbPayload),
        muteHttpExceptions: true
      };
      var fbRes = UrlFetchApp.fetch(url, fbOptions);
      resData = JSON.parse(fbRes.getContentText());
    }

    return { success: resData.ok, result: resData.result, description: resData.description };
  } catch (err) {
    Logger.log("sendTelegramNotificationToAdmin error: " + err.message);
    return { success: false, error: err.message };
  }
}

// 10. دالة فحص وتجربة إرسال إشعار تلغرام التجريبي للإدارة
function testTelegramAdminService(postData) {
  try {
    var config = postData.telegramConfig || postData.config;
    var testData = {
      name: postData.name || "مشترك تجريبي (Test User)",
      registrationId: postData.registrationId || "TEST-" + Math.floor(100000 + Math.random() * 900000),
      phone: "+9647701234567",
      email: "subscriber@example.com",
      timestamp: Utilities.formatDate(new Date(), "GMT+3", "yyyy/MM/dd - hh:mm a"),
      answers: [
        { question: "الدورة المطلوبة", answer: "دلالات الخط الكوفي والثلث" },
        { question: "المستوى", answer: "متوسط / متقدم" },
        { question: "المدينة", answer: "الموصل، العراق" }
      ],
      attachment: "https://drive.google.com/file/d/1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7/view"
    };
    return sendTelegramNotificationToAdmin(testData, null, null, config);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 11. دالة جلب بيانات كافة المسجلين من ورقة RegistrationAnswers
function getRegistrationAnswersSheetData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "RegistrationAnswers";
    var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("طلبات التسجيل") || ss.getSheetByName("إجابات التسجيل");
    
    if (!sheet) {
      return { success: true, headers: [], records: [] };
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    if (lastRow < 1 || lastCol < 1) {
      return { success: true, headers: [], records: [] };
    }
    
    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = [];
    for (var c = 0; c < values[0].length; c++) {
      headers.push((values[0][c] || "").toString().trim());
    }
    
    // البحث عن فهارس الأعمدة الرئيسية
    var regIdColIdx = -1;
    var nameColIdx = -1;
    var nameArColIdx = -1;
    var timeColIdx = -1;
    
    for (var h = 0; h < headers.length; h++) {
      var hLower = headers[h].toLowerCase();
      if (headers[h] === "رقم التسجيل" || hLower.indexOf("registration") !== -1 || hLower.indexOf("regid") !== -1) {
        if (regIdColIdx === -1) regIdColIdx = h;
      } else if (headers[h] === "الاسم" || headers[h] === "اسم المشترك" || hLower === "name") {
        if (nameColIdx === -1) nameColIdx = h;
      } else if (headers[h] === "الاسم بالعربي" || headers[h] === "الاسم العربي" || hLower.indexOf("arabic") !== -1) {
        if (nameArColIdx === -1) nameArColIdx = h;
      } else if (headers[h] === "التاريخ والوقت" || headers[h] === "التاريخ" || hLower.indexOf("time") !== -1) {
        if (timeColIdx === -1) timeColIdx = h;
      }
    }
    
    // إسناد افتراضي في حال لم تتطابق التسميات
    if (timeColIdx === -1 && headers.length > 0) timeColIdx = 0;
    if (regIdColIdx === -1 && headers.length > 1) regIdColIdx = 1;
    if (nameColIdx === -1 && headers.length > 2) nameColIdx = 2;
    if (nameArColIdx === -1 && headers.length > 3) nameArColIdx = 3;
    
    var records = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var hasData = false;
      for (var col = 0; col < row.length; col++) {
        if (row[col] !== "" && row[col] !== null && row[col] !== undefined) {
          hasData = true;
          break;
        }
      }
      if (!hasData) continue;
      
      var regId = regIdColIdx !== -1 && row[regIdColIdx] !== undefined ? row[regIdColIdx].toString().trim() : "";
      var rName = nameColIdx !== -1 && row[nameColIdx] !== undefined ? row[nameColIdx].toString().trim() : "";
      var rNameAr = nameArColIdx !== -1 && row[nameArColIdx] !== undefined ? row[nameArColIdx].toString().trim() : "";
      var rTime = timeColIdx !== -1 && row[timeColIdx] !== undefined ? row[timeColIdx].toString().trim() : "";
      
      var rowData = {};
      var rawRowArr = [];
      for (var k = 0; k < headers.length; k++) {
        var hName = headers[k] || ("Column_" + (k + 1));
        var cellVal = row[k] !== undefined && row[k] !== null ? row[k].toString().trim() : "";
        rowData[hName] = cellVal;
        rawRowArr.push(cellVal);
      }
      
      records.push({
        rowIndex: r + 1,
        registrationId: regId,
        name: rName,
        nameArabic: rNameAr,
        timestamp: rTime,
        data: rowData,
        rawRow: rawRowArr
      });
    }
    
    return {
      success: true,
      headers: headers,
      records: records,
      total: records.length
    };
  } catch (err) {
    Logger.log("getRegistrationAnswersSheetData error: " + err.message);
    return { success: false, error: err.message, headers: [], records: [] };
  }
}

// 12. دالة تعديل سجل مسجل في ورقة RegistrationAnswers
function updateRegistrationAnswerInSheet(postData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "RegistrationAnswers";
    var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("طلبات التسجيل") || ss.getSheetByName("إجابات التسجيل");
    
    if (!sheet) {
      return { success: false, message: "ورقة RegistrationAnswers غير موجودة" };
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) {
      return { success: false, message: "لا توجد سجلات لتعديلها في الورقة" };
    }
    
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return (h || "").toString().trim(); });
    
    var targetRowIndex = -1;
    var reqRowIndex = postData.rowIndex ? Number(postData.rowIndex) : -1;
    var reqRegId = postData.registrationId ? postData.registrationId.toString().trim() : "";
    
    // 1. فحص فوري ومباشر على رقم الصف المحدد
    if (reqRowIndex >= 2 && reqRowIndex <= lastRow) {
      if (reqRegId) {
        var checkVal = sheet.getRange(reqRowIndex, 2).getValue();
        if (checkVal && checkVal.toString().trim() === reqRegId) {
          targetRowIndex = reqRowIndex;
        } else {
          var rowVals = sheet.getRange(reqRowIndex, 1, 1, Math.min(lastCol, 10)).getValues()[0];
          for (var c = 0; c < rowVals.length; c++) {
            if (rowVals[c] && rowVals[c].toString().trim() === reqRegId) {
              targetRowIndex = reqRowIndex;
              break;
            }
          }
        }
      }
      if (targetRowIndex === -1 && !reqRegId) {
        targetRowIndex = reqRowIndex;
      }
    }
    
    // 2. البحث فائق السرعة في عمود رقم التسجيل (العمود 2) فقط
    if (targetRowIndex === -1 && reqRegId) {
      var col2Vals = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var r2 = 0; r2 < col2Vals.length; r2++) {
        if (col2Vals[r2][0] && col2Vals[r2][0].toString().trim() === reqRegId) {
          targetRowIndex = r2 + 2;
          break;
        }
      }
    }

    // 3. البحث الاحتياطي في حال كان رقم التسجيل في عمود آخر
    if (targetRowIndex === -1 && reqRegId) {
      var idValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      for (var r = 0; r < idValues.length; r++) {
        for (var c = 0; c < idValues[r].length; c++) {
          if (idValues[r][c] && idValues[r][c].toString().trim() === reqRegId) {
            targetRowIndex = r + 2;
            break;
          }
        }
        if (targetRowIndex !== -1) break;
      }
    }

    // 4. استخدام رقم الصف مباشرة إذا كان صالحاً
    if (targetRowIndex === -1 && reqRowIndex >= 2 && reqRowIndex <= lastRow) {
      targetRowIndex = reqRowIndex;
    }
    
    if (targetRowIndex === -1) {
      return { success: false, message: "لم يتم العثور على سجل المسجل المراد تعديله" };
    }
    
    var currentRowValues = sheet.getRange(targetRowIndex, 1, 1, lastCol).getValues()[0];
    var updatedData = postData.updatedData || postData.data || postData;
    
    for (var colIdx = 0; colIdx < headers.length; colIdx++) {
      var hKey = headers[colIdx];
      if (updatedData[hKey] !== undefined) {
        currentRowValues[colIdx] = updatedData[hKey];
      }
    }
    
    if (updatedData.name !== undefined) {
      var nIdx = headers.indexOf("الاسم");
      if (nIdx !== -1) currentRowValues[nIdx] = updatedData.name;
    }
    if (updatedData.nameArabic !== undefined) {
      var naIdx = headers.indexOf("الاسم بالعربي");
      if (naIdx !== -1) currentRowValues[naIdx] = updatedData.nameArabic;
    }
    if (updatedData.registrationId !== undefined) {
      var rIdx = headers.indexOf("رقم التسجيل");
      if (rIdx !== -1) currentRowValues[rIdx] = updatedData.registrationId;
    }
    
    sheet.getRange(targetRowIndex, 1, 1, lastCol).setValues([currentRowValues]);
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: "تم تحديث بيانات المسجل بنجاح في ورقة RegistrationAnswers",
      rowIndex: targetRowIndex
    };
  } catch (err) {
    Logger.log("updateRegistrationAnswerInSheet error: " + err.message);
    return { success: false, error: err.message };
  }
}

// 13. دالة حذف سجل مسجل من ورقة RegistrationAnswers
function deleteRegistrationAnswerFromSheet(postData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "RegistrationAnswers";
    var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("طلبات التسجيل") || ss.getSheetByName("إجابات التسجيل");
    
    if (!sheet) {
      return { success: false, message: "ورقة RegistrationAnswers غير موجودة" };
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) {
      return { success: false, message: "لا توجد سجلات لحذفها في الورقة" };
    }
    
    var targetRowIndex = -1;
    var reqRowIndex = postData.rowIndex ? Number(postData.rowIndex) : -1;
    var reqRegId = postData.registrationId ? postData.registrationId.toString().trim() : "";
    
    // 1. فحص فوري ومباشر على رقم الصف المحدد
    if (reqRowIndex >= 2 && reqRowIndex <= lastRow) {
      if (reqRegId) {
        var checkVal = sheet.getRange(reqRowIndex, 2).getValue();
        if (checkVal && checkVal.toString().trim() === reqRegId) {
          targetRowIndex = reqRowIndex;
        } else {
          var rowVals = sheet.getRange(reqRowIndex, 1, 1, Math.min(lastCol, 10)).getValues()[0];
          for (var c = 0; c < rowVals.length; c++) {
            if (rowVals[c] && rowVals[c].toString().trim() === reqRegId) {
              targetRowIndex = reqRowIndex;
              break;
            }
          }
        }
      }
      if (targetRowIndex === -1 && !reqRegId) {
        targetRowIndex = reqRowIndex;
      }
    }
    
    // 2. البحث فائق السرعة في عمود رقم التسجيل (العمود 2) فقط
    if (targetRowIndex === -1 && reqRegId) {
      var col2Vals = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var r2 = 0; r2 < col2Vals.length; r2++) {
        if (col2Vals[r2][0] && col2Vals[r2][0].toString().trim() === reqRegId) {
          targetRowIndex = r2 + 2;
          break;
        }
      }
    }

    // 3. البحث الاحتياطي في كامل الجدول
    if (targetRowIndex === -1 && reqRegId) {
      var allValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      for (var r = 0; r < allValues.length; r++) {
        for (var c = 0; c < allValues[r].length; c++) {
          if (allValues[r][c] && allValues[r][c].toString().trim() === reqRegId) {
            targetRowIndex = r + 2;
            break;
          }
        }
        if (targetRowIndex !== -1) break;
      }
    }

    // 4. استخدام رقم الصف مباشرة إذا كان صالحاً
    if (targetRowIndex === -1 && reqRowIndex >= 2 && reqRowIndex <= lastRow) {
      targetRowIndex = reqRowIndex;
    }
    
    if (targetRowIndex === -1) {
      return { success: false, message: "لم يتم العثور على سجل المسجل المراد حذفه في الورقة" };
    }
    
    sheet.deleteRow(targetRowIndex);
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: "تم حذف سجل المسجل بنجاح من ورقة RegistrationAnswers",
      deletedRowIndex: targetRowIndex
    };
  } catch (err) {
    Logger.log("deleteRegistrationAnswerFromSheet error: " + err.message);
    return { success: false, error: err.message };
  }
}

// 14. دالة جلب المشتركين من ورقة Settings
function getSettingsSubscribersData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Settings') || ss.getSheetByName('الإعدادات') || ss.getSheetByName('اعدادات');
    if (!sheet) {
      return { success: false, message: "ورقة Settings غير موجودة", records: [], total: 0 };
    }

    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), 30);
    if (lastRow < 2) {
      return { success: true, records: [], total: 0, message: "لا يوجد مشتركون في ورقة Settings" };
    }

    var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var records = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      // Check if row has any subscriber data
      var topicId = (r[0] !== null && r[0] !== undefined) ? r[0].toString().trim() : "1"; // Col A
      var nameB = (r[1] !== null && r[1] !== undefined) ? r[1].toString().trim() : "";    // Col B
      var nameZ = (r[25] !== null && r[25] !== undefined) ? r[25].toString().trim() : "";  // Col Z
      var regId = (r[26] !== null && r[26] !== undefined) ? r[26].toString().trim() : "";  // Col AA
      var status = (r[27] !== null && r[27] !== undefined) ? r[27].toString().trim() : "مسموح"; // Col AB
      var deviceCount = (r[28] !== null && r[28] !== undefined) ? r[28].toString().trim() : "1"; // Col AC

      var finalName = nameZ || nameB;
      if (!finalName && !regId && !topicId) continue;

      var isAllowed = !(status === "ممنوع" || status === "معطل" || status === "محظور" || status === "لا");

      records.push({
        rowIndex: i + 2,
        name: finalName,
        registrationId: regId,
        topicId: topicId || "1",
        status: status || "مسموح",
        isAllowed: isAllowed,
        deviceCount: deviceCount || "1",
        rawRow: r.map(function(c) { return c !== null && c !== undefined ? c.toString().trim() : ""; })
      });
    }

    return {
      success: true,
      records: records,
      total: records.length
    };
  } catch (err) {
    Logger.log("getSettingsSubscribersData error: " + err.message);
    return { success: false, error: err.message, records: [], total: 0 };
  }
}

// 15. دالة تعديل بيانات المشترك في ورقة Settings
function updateSettingsSubscriberInSheet(postData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Settings') || ss.getSheetByName('الإعدادات') || ss.getSheetByName('اعدادات');
    if (!sheet) {
      return { success: false, message: "ورقة Settings غير موجودة" };
    }

    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), 30);
    var targetRowIndex = -1;
    var reqRowIndex = postData.rowIndex ? Number(postData.rowIndex) : -1;
    var reqRegId = postData.registrationId ? postData.registrationId.toString().trim() : "";

    // البحث عن الصف المستهدف
    if (reqRowIndex >= 2 && reqRowIndex <= lastRow) {
      targetRowIndex = reqRowIndex;
    } else if (reqRegId) {
      var aaVals = sheet.getRange(2, 27, Math.max(lastRow - 1, 1), 1).getValues();
      for (var a = 0; a < aaVals.length; a++) {
        if (aaVals[a][0] && aaVals[a][0].toString().trim() === reqRegId) {
          targetRowIndex = a + 2;
          break;
        }
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: "لم يتم العثور على صف المشترك في ورقة Settings" };
    }

    var rowVals = sheet.getRange(targetRowIndex, 1, 1, lastCol).getValues()[0];
    var updated = postData.updatedData || postData;

    // 1. العامود A: رقم الصفحة الخاصة
    if (updated.topicId !== undefined && updated.topicId !== null) {
      var cleanTopic = updated.topicId.toString().trim() || "1";
      rowVals[0] = cleanTopic;
    }

    // 2. العامود Z والعامود B: اسم المشترك
    if (updated.name !== undefined && updated.name !== null) {
      var cleanName = updated.name.toString().trim();
      rowVals[25] = cleanName; // Col Z
      if (cleanName) rowVals[1] = cleanName;  // Col B
    }

    // 3. العامود AA: رقم التسجيل
    if (updated.registrationId !== undefined && updated.registrationId !== null) {
      var cleanRegId = updated.registrationId.toString().trim();
      rowVals[26] = cleanRegId; // Col AA
    }

    // 4. العامود AB: مسموح / ممنوع للدخول
    if (updated.status !== undefined && updated.status !== null) {
      var cleanStatus = updated.status.toString().trim() || "مسموح";
      rowVals[27] = cleanStatus; // Col AB
    }

    // 5. العامود AC: عدد الأجهزة
    if (updated.deviceCount !== undefined && updated.deviceCount !== null) {
      var cleanDevCount = updated.deviceCount.toString().trim() || "1";
      rowVals[28] = cleanDevCount; // Col AC
    }

    // إذا طلب إعادة ضبط الأجهزة المسجلة
    if (updated.resetRegisteredDevices === true) {
      if (lastCol >= 30) {
        rowVals[29] = ""; // Col AD
      }
    }

    sheet.getRange(targetRowIndex, 1, 1, lastCol).setValues([rowVals]);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: "تم تحديث بيانات المشترك بنجاح في ورقة Settings",
      rowIndex: targetRowIndex
    };
  } catch (err) {
    Logger.log("updateSettingsSubscriberInSheet error: " + err.message);
    return { success: false, error: err.message };
  }
}

// 16. دالة حذف صف المشترك بالكامل من ورقة Settings
function deleteSettingsSubscriberFromSheet(postData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Settings') || ss.getSheetByName('الإعدادات') || ss.getSheetByName('اعدادات');
    if (!sheet) {
      return { success: false, message: "ورقة Settings غير موجودة" };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, message: "لا توجد صفوف لحذفها في ورقة Settings" };
    }

    var targetRowIndex = -1;
    var reqRowIndex = postData.rowIndex ? Number(postData.rowIndex) : -1;
    var reqRegId = postData.registrationId ? postData.registrationId.toString().trim() : "";

    if (reqRowIndex >= 2 && reqRowIndex <= lastRow) {
      targetRowIndex = reqRowIndex;
    } else if (reqRegId) {
      var aaVals = sheet.getRange(2, 27, lastRow - 1, 1).getValues();
      for (var a = 0; a < aaVals.length; a++) {
        if (aaVals[a][0] && aaVals[a][0].toString().trim() === reqRegId) {
          targetRowIndex = a + 2;
          break;
        }
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: "لم يتم العثور على صف المشترك المطلوب حذفه" };
    }

    sheet.deleteRow(targetRowIndex);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: "تم حذف صف المشترك بالكامل من ورقة Settings بنجاح",
      deletedRowIndex: targetRowIndex
    };
  } catch (err) {
    Logger.log("deleteSettingsSubscriberFromSheet error: " + err.message);
    return { success: false, error: err.message };
  }
}

// 17. دالة إضافة مشترك جديد إلى ورقة Settings
function addSettingsSubscriberToSheet(postData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Settings') || ss.getSheetByName('الإعدادات') || ss.getSheetByName('اعدادات');
    if (!sheet) {
      return { success: false, message: "ورقة Settings غير موجودة" };
    }

    var newTopicId = postData.topicId ? postData.topicId.toString().trim() : "1";
    var newName = postData.name ? postData.name.toString().trim() : "";
    var newRegId = postData.registrationId ? postData.registrationId.toString().trim() : "";
    var newStatus = postData.status ? postData.status.toString().trim() : "مسموح";
    var newDevCount = postData.deviceCount ? postData.deviceCount.toString().trim() : "1";

    var newRow = new Array(30).fill("");
    newRow[0] = newTopicId || "1";      // Col A
    newRow[1] = newName;               // Col B
    newRow[25] = newName;              // Col Z
    newRow[26] = newRegId;             // Col AA
    newRow[27] = newStatus || "مسموح"; // Col AB
    newRow[28] = newDevCount || "1";   // Col AC

    sheet.appendRow(newRow);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: "تمت إضافة المشترك بنجاح إلى ورقة Settings",
      rowIndex: sheet.getLastRow()
    };
  } catch (err) {
    Logger.log("addSettingsSubscriberToSheet error: " + err.message);
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// 12. دالة ترجمة النصوص الذكية باستخدام Google LanguageApp
// -------------------------------------------------------------
function translateTextsWithLanguageApp(payload) {
  try {
    var items = payload.items || [];
    var results = {};
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var rawText = item.text || item.ar || "";
      if (!rawText || !rawText.trim()) continue;

      var en = "";
      var th = "";
      try {
        en = LanguageApp.translate(rawText, 'ar', 'en');
      } catch(e) { en = rawText; }
      try {
        th = LanguageApp.translate(rawText, 'ar', 'th');
      } catch(e) { th = rawText; }

      results[item.id] = { en: en, th: th };
    }
    return { success: true, results: results };
  } catch (err) {
    Logger.log("translateTextsWithLanguageApp error: " + err.message);
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// 13. دالة جلب ترجمات الموقع من ورقة SiteTranslations
// -------------------------------------------------------------
function getSiteTranslationsSheetData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('SiteTranslations') || ss.getSheetByName('ترجمات الموقع');
    if (!sheet) {
      return { success: true, translations: [] };
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return { success: true, translations: [] };
    }

    var translations = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var id = row[0] ? row[0].toString().trim() : "";
      if (!id) continue;

      var category = row[1] ? row[1].toString().trim() : "general";
      var label = row[2] ? row[2].toString().trim() : "";
      var ar = row[3] !== undefined && row[3] !== null ? row[3].toString() : "";
      var th = row[4] !== undefined && row[4] !== null ? row[4].toString() : "";
      var en = row[5] !== undefined && row[5] !== null ? row[5].toString() : "";

      translations.push({
        id: id,
        category: category,
        label: label || id,
        ar: ar,
        th: th,
        en: en
      });
    }

    return { success: true, translations: translations, count: translations.length };
  } catch (err) {
    Logger.log("getSiteTranslationsSheetData error: " + err.message);
    return { success: false, error: err.message, translations: [] };
  }
}

// -------------------------------------------------------------
// 14. دالة حفظ وتحديث ترجمات الموقع في ورقة SiteTranslations
// -------------------------------------------------------------
function saveSiteTranslationsToSheet(payload) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "SiteTranslations";
    var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("ترجمات الموقع");

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var items = payload.translations || payload.items || [];
    if (!Array.isArray(items)) {
      items = [];
    }

    // إعداد ترويسة الجدول وتنسيقه
    sheet.clearContents();
    var headers = ["ID", "Category", "Label", "Arabic (العربية)", "Thai (ภาษาไทย)", "English (الإنجليزية)", "LastUpdated"];
    
    var rowsToInsert = [headers];
    var nowStr = new Date().toISOString();

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item || !item.id) continue;
      rowsToInsert.push([
        item.id.toString(),
        (item.category || "general").toString(),
        (item.label || item.id).toString(),
        (item.ar || "").toString(),
        (item.th || "").toString(),
        (item.en || "").toString(),
        nowStr
      ]);
    }

    if (rowsToInsert.length > 0) {
      var range = sheet.getRange(1, 1, rowsToInsert.length, headers.length);
      range.setValues(rowsToInsert);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#D9EAD3");
      sheet.autoResizeColumns(1, headers.length);
      SpreadsheetApp.flush();
    }

    return {
      success: true,
      message: "تم حفظ كافة الترجمات بنجاح في ورقة " + sheetName + " في قوقل شيت",
      count: items.length
    };
  } catch (err) {
    Logger.log("saveSiteTranslationsToSheet error: " + err.message);
    return { success: false, error: err.message };
  }
}

`;
