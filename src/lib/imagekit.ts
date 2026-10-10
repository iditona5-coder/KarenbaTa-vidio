/**
 * Integrasi ImageKit.io Media CDN Pribadi Kareba'Ta
 * Digunakan untuk mengunggah dan menyimpan foto berita, video warga, serta thumbnail otomatis.
 */

export interface ImageKitConfig {
  publicKey: string;
  urlEndpoint: string;
  privateKey: string;
  folder: string;
}

export const IMAGEKIT_CONFIG: ImageKitConfig = {
  publicKey: 'public_WEwv7Q9gV4tFyZzV0obqGnKfT94=',
  urlEndpoint: 'https://ik.imagekit.io/rdyi1j1sg',
  privateKey: 'private_Hfxv7O6OPu7fA8wOA03WgNaxMKY=',
  folder: '/karebata'
};

export interface ImageKitUploadOptions {
  fileName?: string;
  folder?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
  onProgress?: (percent: number) => void;
}

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  thumbnailUrl: string;
  fileType: 'image' | 'video' | 'non-image';
  size: number;
}

/**
 * Menghasilkan signature HMAC-SHA1 untuk autentikasi client-side ImageKit
 * Menggunakan Web Crypto API bawaan browser untuk performa maksimal & keamanan native
 */
export async function generateImageKitSignature(
  token: string,
  expire: number
): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(IMAGEKIT_CONFIG.privateKey);

  // Fallback jika window.crypto.subtle tidak tersedia
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );
    const messageData = enc.encode(token + expire);
    const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('Web Crypto API tidak tersedia pada lingkungan saat ini');
}

/**
 * Konversi DataURL (base64) ke Blob biner untuk upload cepat dan hemat memori
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Mengunggah berkas foto atau video langsung ke ImageKit.io CDN
 */
export async function uploadToImageKit(
  fileOrBlob: File | Blob | string,
  options?: ImageKitUploadOptions
): Promise<ImageKitUploadResult> {
  let blobToUpload: Blob;
  let defaultName = `media_${Date.now()}`;

  if (typeof fileOrBlob === 'string') {
    if (fileOrBlob.startsWith('data:')) {
      blobToUpload = dataURLtoBlob(fileOrBlob);
      const ext = blobToUpload.type.includes('png') ? '.png' : '.jpg';
      defaultName += ext;
    } else {
      throw new Error('URL string langsung tidak dapat diunggah. Gunakan File atau Blob.');
    }
  } else if (fileOrBlob instanceof File) {
    blobToUpload = fileOrBlob;
    defaultName = fileOrBlob.name;
  } else {
    blobToUpload = fileOrBlob;
    const isVid = fileOrBlob.type.startsWith('video/');
    defaultName += isVid ? '.mp4' : '.jpg';
  }

  const isVideo =
    blobToUpload.type.startsWith('video/') ||
    (fileOrBlob instanceof File && fileOrBlob.type.startsWith('video/'));

  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ik_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const expire = Math.floor(Date.now() / 1000) + 1800; // Berlaku 30 menit
  const signature = await generateImageKitSignature(token, expire);

  const rawFileName = options?.fileName || defaultName;
  const safeFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetFolder = options?.folder || IMAGEKIT_CONFIG.folder;

  const formData = new FormData();
  formData.append('file', blobToUpload, safeFileName);
  formData.append('fileName', safeFileName);
  formData.append('publicKey', IMAGEKIT_CONFIG.publicKey);
  formData.append('signature', signature);
  formData.append('expire', String(expire));
  formData.append('token', token);
  formData.append('folder', targetFolder);
  formData.append('useUniqueFileName', options?.useUniqueFileName !== false ? 'true' : 'false');

  const defaultTags = ['karebata', 'warga_feed', isVideo ? 'video' : 'foto'];
  const allTags = options?.tags ? Array.from(new Set([...defaultTags, ...options.tags])) : defaultTags;
  formData.append('tags', allTags.join(','));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload', true);

    if (options?.onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          options.onProgress?.(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resp = JSON.parse(xhr.responseText);
          // Bila video, buat URL thumbnail otomatis ImageKit atau bawaan respon
          const generatedThumb = isVideo
            ? `${resp.url}/ik-thumbnail.jpg`
            : resp.thumbnailUrl || resp.url;

          resolve({
            url: resp.url,
            fileId: resp.fileId,
            name: resp.name,
            thumbnailUrl: generatedThumb,
            fileType: isVideo ? 'video' : (resp.fileType === 'non-image' ? 'non-image' : 'image'),
            size: resp.size || blobToUpload.size
          });
        } catch (parseErr) {
          reject(new Error('Gagal mengurai balasan dari ImageKit: ' + String(parseErr)));
        }
      } else {
        let msg = `Gagal mengunggah ke ImageKit (Status ${xhr.status})`;
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.message) msg += `: ${errData.message}`;
        } catch {
          // Abaikan jika bukan JSON
        }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Koneksi internet bermasalah saat mengunggah ke ImageKit.io'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Waktu unggah ke ImageKit.io habis (Timeout)'));
    };

    xhr.send(formData);
  });
}

/**
 * Format helper untuk URL gambar ImageKit dengan transformasi dinamis
 * Contoh: resize, crop, format otomatis webp
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  transformations: { width?: number; height?: number; quality?: number; cropMode?: string } = {}
): string {
  if (!originalUrl || !originalUrl.includes('ik.imagekit.io')) {
    return originalUrl;
  }

  const trParts: string[] = [];
  if (transformations.width) trParts.push(`w-${transformations.width}`);
  if (transformations.height) trParts.push(`h-${transformations.height}`);
  if (transformations.quality) trParts.push(`q-${transformations.quality}`);
  if (transformations.cropMode) trParts.push(`c-${transformations.cropMode}`);

  if (trParts.length === 0) return originalUrl;

  const trString = `tr=${trParts.join(',')}`;
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${trString}`;
}
