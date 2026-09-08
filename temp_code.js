// =========================================================================
// كود تطبيق نص برمجيات جوجل (Google Apps Script) الشامل لمؤسسة يوسف ذنون
// =========================================================================

// 1. استقبال طلبات GET (جلب البيانات العامة، والأسئلة الديناميكية)
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    
    // جلب أسئلة الفوورم الديناميكية
    if (action === "getFormQuestions") {
      var questions = getFormQuestions();
      return ContentService.createTextOutput(JSON.stringify({ success: true, questions: questions }))
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
        postData.lng || ""
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
 
  return {
    profile: profileSheet ? profileSheet.getDataRange().getValues().slice(1) : [],
    artwork: artworkSheet ? artworkSheet.getDataRange().getValues().slice(1) : [],
    video: videoSheet ? videoSheet.getDataRange().getValues().slice(1) : [],
    courses: coursesSheet ? coursesSheet.getDataRange().getValues().slice(1) : [],
    tools: toolsSheet ? toolsSheet.getDataRange().getValues().slice(1) : [],
    contact: contactSheet ? contactSheet.getDataRange().getValues().slice(1) : [],
    about: aboutSheet ? aboutSheet.getDataRange().getValues().slice(1) : [],
    settings: settingsSheet ? settingsSheet.getDataRange().getValues().slice(1) : [],
    subscriberContent: subscriberContentSheet ? subscriberContentSheet.getDataRange().getValues().slice(1) : []
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

    // 6. بناء قائمة الأعمدة المطلوبة بالكامل
    var allRequiredHeaders = ["التاريخ والوقت", "رقم التسجيل"];
    
    for (var f = 0; f < formQuestionsList.length; f++) {
      var qName = formQuestionsList[f];
      if (allRequiredHeaders.indexOf(qName) === -1) {
        allRequiredHeaders.push(qName);
      }
    }

    // إضافة أي إجابات إضافية لها مدخلات غير موجودة بالقائمة الأساسية
    for (var extraKey in answersMap) {
      if (extraKey && allRequiredHeaders.indexOf(extraKey) === -1) {
        if (
          extraKey !== "صورة" &&
          extraKey !== "زر" &&
          extraKey !== "عرض صورة" &&
          extraKey !== "البريد الإلكتروني" &&
          extraKey !== "إجابات الأسئلة التفصيلية" &&
          extraKey !== "ملخص الإجابات" &&
          extraKey !== "Facebook"
        ) {
          allRequiredHeaders.push(extraKey);
        }
      }
    }

    // 7. التأكد من وجود الورقة وضبط الترويسة
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // قراءة الترويسة الحالية
    var maxCols = Math.max(sheet.getLastColumn(), allRequiredHeaders.length);
    var currentHeaders = sheet.getLastRow() > 0 ? (sheet.getRange(1, 1, 1, maxCols).getValues()[0] || []) : [];
    
    // إذا كانت الترويسة قديمة أو تحتوي على عامود مجمع أو غير مطابقة، يتم تحديث الترويسة بالكامل
    var needsHeaderReset = false;
    if (currentHeaders.length === 0 || !currentHeaders[0]) {
      needsHeaderReset = true;
    } else {
      for (var ch = 0; ch < currentHeaders.length; ch++) {
        var hText = currentHeaders[ch] ? currentHeaders[ch].toString().trim() : "";
        if (hText === "إجابات الأسئلة التفصيلية" || hText === "ملخص الإجابات" || hText === "Facebook") {
          needsHeaderReset = true;
          break;
        }
      }
    }

    if (needsHeaderReset) {
      sheet.getRange(1, 1, 1, allRequiredHeaders.length).setValues([allRequiredHeaders]);
      sheet.getRange(1, 1, 1, allRequiredHeaders.length)
           .setFontWeight("bold")
           .setBackground("#1E293B")
           .setFontColor("#F8FAFC")
           .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
      currentHeaders = allRequiredHeaders.slice();
    } else {
      // إضافة أي أعمدة جديدة غير موجودة
      for (var h = 0; h < allRequiredHeaders.length; h++) {
        var reqHeader = allRequiredHeaders[h];
        if (currentHeaders.indexOf(reqHeader) === -1) {
          var newColIdx = currentHeaders.length + 1;
          var headerCell = sheet.getRange(1, newColIdx);
          headerCell.setValue(reqHeader)
                    .setFontWeight("bold")
                    .setBackground("#0F766E")
                    .setFontColor("#FFFFFF")
                    .setHorizontalAlignment("center");
          currentHeaders.push(reqHeader);
        }
      }
    }

    // 8. بناء صف الإجابات بما يطابق الأعمدة بدقة 100%
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
        var val = answersMap[col];
        if (val === undefined || val === null) {
          if (col === "ايميل" || col === "البريد الإلكتروني") val = answersMap["ايميل"] || answersMap["البريد الإلكتروني"] || data.email;
          else if (col === "الاسم" || col === "الاسم الكامل") val = answersMap["الاسم"] || data.name;
          else if (col === "الاسم بالعربي") val = answersMap["الاسم بالعربي"] || data.nameArabic;
          else if (col === "العمر") val = answersMap["العمر"] || data.age;
          else if (col === "رقم الهاتف" || col === "هاتف") val = answersMap["رقم الهاتف"] || answersMap["هاتف"] || data.phone;
          else if (col === "ID Line" || col === "لاين") val = answersMap["ID Line"] || answersMap["لاين"] || data.lineId;
          else if (col === "فيس بوك" || col === "Facebook") val = answersMap["فيس بوك"] || answersMap["Facebook"] || data.facebook;
          else if (col === "رفع ملف" || col === "ملف المرفقات / رابط Drive" || col.indexOf("رفع") !== -1 || col.indexOf("ملف") !== -1) val = answersMap["رفع ملف"] || answersMap["ملف المرفقات / رابط Drive"] || data.attachment;
          else val = "";
        }
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
    var qrColLetter = (data.emailConfig && data.emailConfig.qrDriveUrlColumn) ? data.emailConfig.qrDriveUrlColumn : "Y";
    var statusColLetter = (data.emailConfig && data.emailConfig.deliveryStatusColumn) ? data.emailConfig.deliveryStatusColumn : "Z";
    var qrColIdx = colLetterToNumber(qrColLetter);
    var statusColIdx = colLetterToNumber(statusColLetter);

    try {
      var maxNeededCol = Math.max(currentHeaders.length, qrColIdx, statusColIdx);
      if (sheet.getMaxColumns() < maxNeededCol) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), maxNeededCol - sheet.getMaxColumns() + 2);
      }

      if (sheet.getRange(1, qrColIdx).getValue() === "") {
        sheet.getRange(1, qrColIdx)
             .setValue("رابط صورة QR Code (Google Drive)")
             .setFontWeight("bold")
             .setBackground("#D97706")
             .setFontColor("#FFFFFF")
             .setHorizontalAlignment("center");
      }
      if (sheet.getRange(1, statusColIdx).getValue() === "") {
        sheet.getRange(1, statusColIdx)
             .setValue("حالة إرسال الإيميل (Email Status)")
             .setFontWeight("bold")
             .setBackground("#059669")
             .setFontColor("#FFFFFF")
             .setHorizontalAlignment("center");
      }
    } catch(headErr) {
      Logger.log("Header setup note: " + headErr.message);
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
      message: "تم استلام وحفظ طلب التسجيل بنجاح في ورقة RegistrationAnswers"
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
    var emailConfig = customEmailConfig || {};
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

    // توليد الـ QR Code من الأعمدة المحددة (مثال: B, C)
    var qrDataCols = (emailConfig && emailConfig.qrCodeColumns) ? emailConfig.qrCodeColumns.toString().trim() : "B, C";
    var qrColsArr = qrDataCols.split(/[,\s+]+/);
    var qrParts = [];

    for (var qci = 0; qci < qrColsArr.length; qci++) {
      var colLet = qrColsArr[qci].trim().toUpperCase();
      if (!colLet) continue;
      var cIdx = colLetterToNumber(colLet);
      var val = "";
      if (rowValues && rowValues.length >= cIdx && rowValues[cIdx - 1] !== undefined && rowValues[cIdx - 1] !== null && rowValues[cIdx - 1] !== "") {
        val = rowValues[cIdx - 1].toString().trim();
      } else if (sheet && rowIdx) {
        try {
          var cellV = sheet.getRange(rowIdx, cIdx).getValue();
          if (cellV !== undefined && cellV !== null && cellV !== "") {
            val = cellV.toString().trim();
          }
        } catch(e) {}
      } else if (data.answersMap) {
        if (colLet === "B" && (data.answersMap["رقم التسجيل"] || data.registrationId)) val = data.answersMap["رقم التسجيل"] || data.registrationId;
        else if (colLet === "C" && (data.answersMap["الاسم"] || data.answersMap["اسم المشترك"] || data.name)) val = data.answersMap["الاسم"] || data.answersMap["اسم المشترك"] || data.name;
      }
      if (val) {
        qrParts.push(val);
      }
    }

    if (qrParts.length === 0) {
      if (registrationId) qrParts.push(registrationId);
      if (displayName && displayName !== "Valued Subscriber" && displayName !== "المشترك الكريم") qrParts.push(displayName);
    }

    var qrText = qrParts.join(" - ");

    var qrImageUrl = "https://quickchart.io/qr?text=" + encodeURIComponent(qrText) + "&size=260&margin=1";
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
    var qrColToSave = (emailConfig && emailConfig.qrDriveUrlColumn) ? emailConfig.qrDriveUrlColumn.toString().trim().toUpperCase() : "Y";
    if (sheet && rowIdx && qrColToSave) {
      try {
        var qrColIdx = colLetterToNumber(qrColToSave);
        if (sheet.getMaxColumns() < qrColIdx) {
          sheet.insertColumnsAfter(sheet.getMaxColumns(), qrColIdx - sheet.getMaxColumns() + 2);
        }
        sheet.getRange(rowIdx, qrColIdx).setValue(driveQrFileUrl || qrImageUrl);
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
      var isImg = att.type === "image" || normalizedUrl.indexOf("googleusercontent.com") !== -1 || normalizedUrl.indexOf("unsplash.com") !== -1 || normalizedUrl.match(/\.(jpeg|jpg|png|webp|gif)/i);

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
            fileBlob = dFile.getBlob();
            var mime = fileBlob.getContentType() || "";
            var ext = mime.indexOf("png") !== -1 ? ".png" : (mime.indexOf("pdf") !== -1 ? ".pdf" : (mime.indexOf("jpeg") !== -1 || mime.indexOf("jpg") !== -1 ? ".jpg" : ""));
            var cleanName = attTitle;
            if (ext && cleanName.indexOf(ext) === -1 && cleanName.indexOf(".") === -1) {
              cleanName += ext;
            }
            fileBlob.setName(cleanName);
            if (mime.indexOf("image") !== -1 || isImg) {
              isImg = true;
              imgBlob = fileBlob;
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
      } else if (imgBlob) {
        emailFileBlobs.push(imgBlob);
      }

      // تجهيز كود العرض داخل HTML
      var cidKey = "att_img_" + ati;
      if (isImg && imgBlob) {
        inlineImagesMap[cidKey] = imgBlob;
        attachmentsHtml += '<div style="margin-top:16px;text-align:center;background:#1e293b;padding:16px;border-radius:12px;border:1px solid #475569;">' +
          '<div style="color:#f8fafc;font-size:14px;margin-bottom:8px;font-weight:bold;">' + attTitle + '</div>' +
          '<img src="cid:' + cidKey + '" alt="' + attTitle + '" style="max-width:100%;max-height:280px;border-radius:8px;border:1px solid #64748b;display:block;margin:0 auto;" />' +
          '<div style="margin-top:8px;"><a href="' + rawUrl + '" target="_blank" style="color:#d97706;font-size:12px;text-decoration:none;font-weight:bold;">🔗 ' + (userLang === "en" ? "Open in Google Drive" : (userLang === "th" ? "เปิดใน Google Drive" : "فتح في Google Drive")) + ' ↗</a></div>' +
        '</div>';
      } else if (isImg) {
        attachmentsHtml += '<div style="margin-top:16px;text-align:center;background:#1e293b;padding:16px;border-radius:12px;border:1px solid #475569;">' +
          '<div style="color:#f8fafc;font-size:14px;margin-bottom:8px;font-weight:bold;">' + attTitle + '</div>' +
          '<img src="' + normalizedUrl + '" alt="' + attTitle + '" style="max-width:100%;max-height:280px;border-radius:8px;border:1px solid #64748b;display:block;margin:0 auto;" />' +
          '<div style="margin-top:8px;"><a href="' + rawUrl + '" target="_blank" style="color:#d97706;font-size:12px;text-decoration:none;font-weight:bold;">🔗 ' + (userLang === "en" ? "Open in Google Drive" : (userLang === "th" ? "เปิดใน Google Drive" : "فتح في Google Drive")) + ' ↗</a></div>' +
        '</div>';
      } else {
        attachmentsHtml += '<div style="margin-top:12px;text-align:center;">' +
          '<a href="' + rawUrl + '" target="_blank" style="display:inline-block;padding:12px 24px;background:#d97706;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;box-shadow:0 3px 8px rgba(217,119,6,0.3);">' +
            '📥 ' + attTitle +
          '</a>' +
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

    // تسجيل حالة "تم الإرسال" في العامود المحدد في الشيت
    var statusColToSave = (emailConfig && emailConfig.deliveryStatusColumn) ? emailConfig.deliveryStatusColumn.toString().trim().toUpperCase() : "Z";
    if (sheet && rowIdx && statusColToSave) {
      try {
        var statusColIdx = colLetterToNumber(statusColToSave);
        if (sheet.getMaxColumns() < statusColIdx) {
          sheet.insertColumnsAfter(sheet.getMaxColumns(), statusColIdx - sheet.getMaxColumns() + 2);
        }
        sheet.getRange(rowIdx, statusColIdx).setValue("تم الإرسال: " + timestamp);
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

// 7. تسجيل الدخول الآمن للمشتركين
function loginUser(username, password, deviceId, lat, lng) {
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
    
    var usersRange = settingsSheet.getRange("A2:AX" + lastRow);
    var usersData = usersRange.getValues();
    var userRow = -1;
    
    for (var i = 0; i < usersData.length; i++) {
      if (usersData[i][25].toString().trim() === username.toString().trim()) {
        if (usersData[i][26].toString().trim() !== password.toString().trim()) {
          return { success: false, message: 'كلمة المرور غير صحيحة' };
        }
        userRow = i + 2;
        break;
      }
    }
    
    if (userRow === -1) {
      return { success: false, message: 'مستخدم غير موجود' };
    }
    
    var userData = usersData[userRow - 2];
    var topicId = userData[0] ? userData[0].toString().trim() : '1';
    var topicContent = null;
    
    try {
      var contentSheet = ss.getSheetByName("SubscriberContent");
      if (contentSheet) {
        var cData = contentSheet.getDataRange().getValues();
        for (var c = 1; c < cData.length; c++) {
          if (cData[c][0] && cData[c][0].toString().trim() === topicId) {
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
      subscriberName: userData[1] || 'مشترك',
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
    return { success: false, message: 'خطأ في التحقق من الدخول' };
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
// 9. دالة إرسال إشعار تلغرام المباشر للإدارة للمتابعة الفورية
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

    var msg = "";
    if (telegramConfig.customHeader) {
      msg += "<b>" + escapeTelHtml(telegramConfig.customHeader) + "</b>\n";
    }
    msg += "<b>" + escapeTelHtml(telegramConfig.notificationTitle || "🔔 إشعار تسجيل جديد") + "</b>\n";
    msg += "━━━━━━━━━━━━━━━━━━━━\n";
    msg += "👤 <b>اسم المشترك:</b> " + escapeTelHtml(name) + "\n";
    msg += "🆔 <b>رقم التسجيل:</b> <code>" + escapeTelHtml(regId) + "</code>\n";
    if (phone) msg += "📱 <b>الهاتف:</b> <code>" + escapeTelHtml(phone) + "</code>\n";
    if (email) msg += "📧 <b>البريد:</b> " + escapeTelHtml(email) + "\n";
    msg += "⏰ <b>التاريخ والوقت:</b> " + escapeTelHtml(timestamp) + "\n";

    if (telegramConfig.includeAllAnswers && data.answers && Array.isArray(data.answers) && data.answers.length > 0) {
      msg += "\n📋 <b>تفاصيل الاستمارة:</b>\n";
      for (var i = 0; i < data.answers.length; i++) {
        var it = data.answers[i];
        if (!it) continue;
        var q = it.question || ("سؤال " + (i + 1));
        var a = it.answer;
        if (a === undefined || a === null || a === "") a = "—";

        if (typeof a === "string" && a.indexOf("data:") === 0) {
          msg += "▫️ <b>" + escapeTelHtml(q) + ":</b> <i>[ملف / صورة مرفوعة]</i>\n";
        } else if (typeof a === "string" && (a.indexOf("http://") === 0 || a.indexOf("https://") === 0)) {
          msg += "▫️ <b>" + escapeTelHtml(q) + ":</b> " + a + "\n";
        } else {
          var safeStr = String(a).length > 250 ? String(a).slice(0, 250) + "..." : String(a);
          msg += "▫️ <b>" + escapeTelHtml(q) + ":</b> " + escapeTelHtml(safeStr) + "\n";
        }
      }
    }

    if (telegramConfig.includeAttachment && data.attachment && typeof data.attachment === "string") {
      if (data.attachment.indexOf("http") === 0) {
        msg += "\n📎 <b>المرفق:</b> " + data.attachment + "\n";
      }
    }

    if (telegramConfig.customFooter) {
      msg += "\n<i>" + escapeTelHtml(telegramConfig.customFooter) + "</i>";
    }

    var inlineKeyboard = [];
    var rowBtns = [];
    if (telegramConfig.includeWhatsappButton && phone) {
      var cleanPhone = phone.toString().replace(/[^0-9]/g, "");
      if (cleanPhone) {
        rowBtns.push({ text: "💬 محادثة واتساب", url: "https://wa.me/" + cleanPhone });
      }
    }
    if (telegramConfig.includeSheetButton) {
      try {
        var ssId = SpreadsheetApp.getActiveSpreadsheet().getId();
        if (ssId) rowBtns.push({ text: "📊 فتح الشيت", url: "https://docs.google.com/spreadsheets/d/" + ssId });
      } catch(e) {}
    }
    if (rowBtns.length > 0) inlineKeyboard.push(rowBtns);

    var replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : null;

    if (msg.length > 3900) {
      msg = msg.slice(0, 3850) + "\n... (تم اختصار باقي البيانات)";
    }

    var url = "https://api.telegram.org/bot" + token + "/sendMessage";
    var payloadObj = {
      chat_id: chatId,
      text: msg,
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
    var resText = res.getContentText();
    var resData = JSON.parse(resText);

    // Fallback to plain text if HTML parsing failed
    if (!resData.ok) {
      var plainText = msg.replace(/<[^>]*>?/gm, "");
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
