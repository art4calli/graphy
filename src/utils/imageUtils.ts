/**
 * Utility to parse and format image and video URLs, including Google Drive,
 * Dropbox, OneDrive, YouTube, Vimeo, and direct media URLs.
 */

/**
 * Checks if a value is genuinely a media URL (image/video/drive/dropbox)
 * and NOT a plain text note, date, or Arabic words with slashes (e.g. "رقعة / نسخ / ديواني", "1", "2026/08/31")
 */
export function isActualMediaUrl(val: any): boolean {
  if (!val || typeof val !== "string") return false;
  const s = val.trim().replace(/^['"]|['"]$/g, "");
  if (!s || s === "-" || s === "لا يوجد" || s === "null" || s === "undefined") return false;

  // Single numbers or small digits are IDs / numbers, not URLs
  if (/^\d+$/.test(s)) return false;

  // If contains Arabic letters, it's a text string or title, NOT a media URL
  if (/[\u0600-\u06FF]/.test(s)) return false;

  // If contains spaces without http/https protocol, it's human text (e.g. "text / more text")
  if (s.includes(" ") && !s.startsWith("http://") && !s.startsWith("https://")) {
    return false;
  }

  // Valid protocols
  if (/^https?:\/\//i.test(s) || /^data:image\//i.test(s) || /^\/\w+/i.test(s)) {
    return true;
  }

  // Google Drive or Dropbox file indicators
  if (s.includes("drive.google.com") || s.includes("googleusercontent.com") || s.includes("dropbox.com")) {
    return true;
  }

  // Direct media extensions
  if (/\.(jpeg|jpg|png|gif|webp|svg|bmp|ico|mp4|webm|mov|ogg)(\?.*)?$/i.test(s)) {
    return true;
  }

  return false;
}

export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  // Patterns for Google Drive file URLs
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  const userContentMatch = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (userContentMatch && userContentMatch[1]) return userContentMatch[1];

  return null;
}

export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim().replace(/^['"]|['"]$/g, "");
  if (!clean || clean === "-" || clean === "لا يوجد") return "";

  // Validate that it is actually a URL
  if (!isActualMediaUrl(clean)) {
    return "";
  }

  // 1. Google Drive direct link conversion
  if (clean.includes("drive.google.com") || clean.includes("googleusercontent.com")) {
    const driveId = extractGoogleDriveId(clean);
    if (driveId) {
      return `https://lh3.googleusercontent.com/d/${driveId}`;
    }
  }

  // 2. Dropbox conversion to raw direct link
  if (clean.includes("dropbox.com")) {
    return clean
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace("?dl=0", "")
      .replace("?dl=1", "");
  }

  return clean;
}

export function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}
