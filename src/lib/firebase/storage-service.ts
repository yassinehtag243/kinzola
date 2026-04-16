import { isFirebaseConfigured, storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload a file (image or audio) to Firebase Storage
 * @param file - File or Blob to upload
 * @param path - Storage path (e.g., "images/message-123.jpg" or "audio/message-456.webm")
 * @returns Public download URL, or empty string in demo mode
 */
export async function uploadFile(file: File | Blob, path: string): Promise<string> {
  if (!isFirebaseConfigured || !storage) {
    console.warn('⚠️ Firebase Storage: upload ignoré — Firebase non configuré');
    // In demo mode, convert to base64 for local display
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('❌ Firebase Storage upload error:', error);
    // Fallback to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Upload an image to Firebase Storage
 * Falls back to base64 data URL in demo mode
 */
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return uploadFile(file, filename);
}

/**
 * Upload an audio blob to Firebase Storage
 * Falls back to base64 data URL in demo mode
 */
export async function uploadAudio(blob: Blob, mimeType: string): Promise<string> {
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const filename = `audio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return uploadFile(blob, filename);
}
