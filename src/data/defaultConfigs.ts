export const DEFAULT_SUBSCRIBER_EMAIL_CONFIG = {
  enabled: true,
  emailColumn: "G",
  deliveryStatusColumn: "P",
  dataFields: [
    { id: "1", label: "رقم التسجيل", labelEn: "Registration ID", labelTh: "หมายเลขลงทะเบียน", columnLetter: "B" },
    { id: "2", label: "اسم المشترك", labelEn: "Participant Name", labelTh: "ชื่อผู้สมัคร", columnLetter: "C" },
    { id: "3", label: "تاريخ ووقت التسجيل", labelEn: "Registration Date & Time", labelTh: "วันและเวลาที่ลงทะเบียน", columnLetter: "A" },
    { id: "4", label: "رقم الهاتف / الواتساب", labelEn: "Phone / WhatsApp", labelTh: "เบอร์โทรศัพท์ / WhatsApp", columnLetter: "F" },
    { id: "5", label: "رابط الدخول لصفحة الاشتراك", labelEn: "Login / Courses Portal", labelTh: "ลิงก์เข้าสู่ระบบบทเรียน", columnLetter: "LOGIN_URL" }
  ],
  qrCodeColumns: "B",
  qrDriveUrlColumn: "O",
  includeQrInEmail: true,
  messages: {
    ar: {
      subject: "تأكيد تسجيلك في منصة مؤسسة يوسف ذنون - بيانات الدخول والاشتراك",
      header: "مرحباً بك في مؤسسة يوسف ذنون للخط العربي",
      body: "نشكرك على تسجيلك واهتمامك بتعلم وإتقان فنون الخط العربي الأصيل. فيما يلي تفاصيل وبيانات تسجيلك المعتمدة للدخول ومتابعة الدورات والمحتوى الحصري:",
      footerNote: "يرجى الاحتفاظ برمز الاستجابة السريعة (QR Code) وبيانات التسجيل لاستخدامها عند مراجعة اشتراكك أو حضور الجلسات."
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
  },
  attachments: [
    {
      id: "1",
      title: "دليل المشترك ومنهاج الدورات (PDF)",
      titleEn: "Subscriber Guide & Curriculum (PDF)",
      titleTh: "คู่มือสมาชิกและหลักสูตร (PDF)",
      url: "https://drive.google.com/file/d/1vukeCKi_3QS3nIOXCAUS1_-Q3oHRZ2uT/view?usp=drive_link",
      type: "file_button"
    },
    {
      id: "2",
      title: "شعار وبطاقة عضوية المؤسسة",
      titleEn: "Institute Badge & Emblem",
      titleTh: "ตราสัญลักษณ์บัตรสมาชิก",
      url: "https://drive.google.com/file/d/1A-BriZ8TuL5Ua1lHyrmssB6WjtWX9O1z/view?usp=drive_link",
      type: "image"
    },
    {
      id: "1788877999615",
      title: "مرفق جديد",
      titleEn: "New Attachment",
      titleTh: "เอกสารแนบใหม่",
      url: "https://drive.google.com/file/d/1AWN0tKboI0bxICu-8awV-q8nxU7hSy8z/view?usp=drive_link",
      type: "image"
    }
  ]
};

export const DEFAULT_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: "8777153005:AAF48_X1uMzhJLlJhWcJndLmuY402SZZmzA",
  chatId: "5371796147",
  topicId: "",
  notificationTitle: "🔔 إشعار تسجيل جديد - مؤسسة يوسف ذنون",
  includeAllAnswers: true,
  includeQrCode: true,
  includeAttachment: true,
  includeWhatsappButton: true,
  includeSheetButton: true,
  customButtons: [
    {
      id: "btn_1787919188092",
      text: "رابط جديد",
      url: "https://drive.google.com/file/d/1vukeCKi_3QS3nIOXCAUS1_-Q3oHRZ2uT/view?usp=drive_link"
    }
  ],
  customHeader: "🏛️ مؤسسة يوسف ذنون للخط العربي",
  customFooter: "⚡ نظام المتابعة الفورية للإدارة"
};
