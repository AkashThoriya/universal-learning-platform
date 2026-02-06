/**
 * @fileoverview Firebase Storage Utilities for Handwritten Notes
 *
 * Provides utility functions for uploading, listing, and managing
 * handwritten notes (images/PDFs) in Firebase Storage.
 *
 * Storage path: users/{userId}/notes/{topicId}/{fileName}
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import imageCompression from 'browser-image-compression';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  deleteObject,
  getMetadata,
  updateMetadata,
  UploadTaskSnapshot,
} from 'firebase/storage';

import { storage } from './firebase';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadedNote {
  /** Unique identifier (file name) */
  id: string;
  /** Original file name */
  fileName: string;
  /** File type: 'image' or 'pdf' */
  fileType: 'image' | 'pdf';
  /** Full storage path */
  storagePath: string;
  /** Signed download URL */
  downloadUrl: string;
  /** Upload timestamp (ISO string) */
  uploadedAt: string;
  /** File size in bytes */
  fileSize: number;
  /** Content type (MIME) */
  contentType: string;
  /** Thumbnail download URL (if available) */
  thumbnailUrl?: string;
}

export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Bytes transferred */
  bytesTransferred: number;
  /** Total bytes */
  totalBytes: number;
  /** Current state */
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error' | 'compressing';
}

// ============================================================================
// NOTES CACHE (Reduces redundant API calls on tab switches)
// ============================================================================

interface CacheEntry {
  data: UploadedNote[];
  timestamp: number;
}

const notesCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cache key for notes
 */
const getCacheKey = (userId: string, topicId: string, courseId?: string): string => {
  return `${userId}:${courseId || 'global'}:${topicId}`;
};

/**
 * Invalidate notes cache for a specific topic
 * Call this after upload or delete operations
 */
export const invalidateNotesCache = (_userId: string, _topicId: string, _courseId?: string) => {
  // Simplified for now: just clear by key pattern or simpler invalidation.
  notesCache.clear(); // Safest approach for now to avoid complexity
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate storage path for a topic note
 */
const getNotePath = (userId: string, topicId: string, fileName: string, courseId?: string): string => {
  if (courseId) {
    return `users/${userId}/courses/${courseId}/notes/${topicId}/${fileName}`;
  }
  return `users/${userId}/notes/${topicId}/${fileName}`;
};

/**
 * Generate unique file name to prevent collisions
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50); // Max 50 chars
  return `${baseName}_${timestamp}_${randomSuffix}.${extension}`;
};

/**
 * Determine file type from content type
 */
const getFileType = (contentType: string): 'image' | 'pdf' => {
  if (contentType === 'application/pdf') {
    return 'pdf';
  }
  return 'image';
};

/**
 * Check if file is an image type that can be compressed
 */
const isCompressibleImage = (type: string): boolean => {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type);
};

// Max file size for Firebase Storage: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Only compress images that are large enough to benefit (skip small images entirely)
// Handwritten notes need crisp detail, so we're very conservative
const MIN_COMPRESS_SIZE = 2 * 1024 * 1024; // Only compress if > 2MB

/**
 * Get adaptive compression options for HANDWRITTEN NOTES
 *
 * PRIORITY: READABILITY > Storage savings
 *
 * Handwritten notes contain fine details (pen strokes, small text) that
 * are easily blurred by JPEG compression. We use very conservative settings:
 *
 * - < 2MB: NO compression (preserve original quality completely)
 * - 2-5MB: Minimal optimization (99% quality, no resolution reduction)
 * - > 5MB: Must compress to fit, but with highest possible quality
 *
 * The library will iterate to achieve target size while we set high quality floors.
 */
const getAdaptiveCompressionOptions = (originalSizeBytes: number, onProgress?: (progress: UploadProgress) => void) => {
  const sizeInMB = originalSizeBytes / (1024 * 1024);

  let initialQuality: number;
  let maxWidthOrHeight: number;
  let maxSizeMB: number;

  if (sizeInMB <= 5) {
    // UNDER LIMIT: Very gentle optimization only
    // 99% quality is virtually lossless for handwritten notes
    initialQuality = 0.99;
    maxWidthOrHeight = 4096; // Don't reduce resolution
    maxSizeMB = sizeInMB * 0.95; // Target minimal 5% reduction only
  } else if (sizeInMB <= 8) {
    // SLIGHTLY OVER: High quality, just need to get under 5MB
    initialQuality = 0.95;
    maxWidthOrHeight = 4096; // Preserve resolution, let quality do the work
    maxSizeMB = 4.8;
  } else if (sizeInMB <= 15) {
    // MODERATELY OVER: Still high quality
    initialQuality = 0.92;
    maxWidthOrHeight = 4096;
    maxSizeMB = 4.8;
  } else if (sizeInMB <= 30) {
    // LARGE: Need more reduction, but keep it readable
    initialQuality = 0.88;
    maxWidthOrHeight = 3840; // 4K is plenty for handwritten notes
    maxSizeMB = 4.8;
  } else {
    // VERY LARGE (>30MB): Maximum practical compression
    // Still prioritize readability - 85% JPEG is good for text
    initialQuality = 0.85;
    maxWidthOrHeight = 3200; // Reduce resolution only for huge files
    maxSizeMB = 4.8;
  }

  return {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality,
    preserveExif: true,
    fileType: 'image/jpeg' as const,
    onProgress: (percentage: number) => {
      onProgress?.({
        progress: percentage,
        bytesTransferred: Math.floor((percentage / 100) * originalSizeBytes),
        totalBytes: originalSizeBytes,
        state: 'compressing',
      });
    },
  };
};

/**
 * Compress an image file for optimal storage and loading
 *
 * All images are compressed with quality settings based on their size.
 * Very small images (<100KB) are skipped as they're already optimized.
 */
const compressImage = async (file: File, onProgress?: (progress: UploadProgress) => void): Promise<File> => {
  // Skip non-compressible or already-tiny images
  if (!isCompressibleImage(file.type) || file.size < MIN_COMPRESS_SIZE) {
    return file;
  }

  // Notify user that compression is happening
  onProgress?.({
    progress: 0,
    bytesTransferred: 0,
    totalBytes: file.size,
    state: 'compressing',
  });

  const options = getAdaptiveCompressionOptions(file.size, onProgress);
  const isOverLimit = file.size > MAX_FILE_SIZE;

  console.log(
    `${isOverLimit ? '⚠️ Compressing oversized' : '📦 Optimizing'} ${formatFileSize(file.size)} image ` +
      `(quality: ${Math.round(options.initialQuality * 100)}%, maxRes: ${options.maxWidthOrHeight}px, target: ${options.maxSizeMB}MB)`
  );

  try {
    const compressedFile = await imageCompression(file, options);
    const reductionPercent = Math.round((1 - compressedFile.size / file.size) * 100);

    // Only use compressed if it's actually smaller (some small files might grow)
    if (compressedFile.size >= file.size) {
      console.log(`⏭️ Skipped: compression didn't reduce size`);
      return file;
    }

    console.log(
      `✓ Optimized: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)} ` +
        `(${reductionPercent}% smaller)`
    );
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed, using original:', error);
    return file;
  }
};

/**
 * Generate a small thumbnail for an image
 * Max 300px, lower quality - optimized for grid display
 */
const generateThumbnail = async (file: File): Promise<File> => {
  // If not an image, return original (shouldn't happen due to checks)
  if (!isCompressibleImage(file.type)) {
    return file;
  }

  console.log(`Generating thumbnail for ${file.name}...`);

  try {
    const options = {
      maxWidthOrHeight: 300,
      useWebWorker: true,
      initialQuality: 0.6, // 60% quality is fine for thumbnails
      fileType: 'image/jpeg' as const,
    };

    const thumbnail = await imageCompression(file, options);
    console.log(`✓ Thumbnail created: ${formatFileSize(thumbnail.size)}`);
    return thumbnail;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    // If thumbnail fails, we'll just skip it (return null logic handled in upload)
    throw error;
  }
};

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a file to topic notes storage with progress tracking
 *
 * @param userId - User's Firebase UID
 * @param topicId - Topic ID
 * @param file - File to upload
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to UploadedNote
 */

export const uploadTopicNote = async (
  userId: string,
  topicId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  courseId?: string
): Promise<UploadedNote> => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.');
  }

  // For PDFs, enforce strict 5MB limit (can't compress)
  if (file.type === 'application/pdf' && file.size > MAX_FILE_SIZE) {
    throw new Error('PDF too large. Maximum size is 5MB.');
  }

  // Compress ALL images for optimal storage and loading
  let fileToUpload = file;
  if (isCompressibleImage(file.type)) {
    fileToUpload = await compressImage(file, onProgress);

    // If compression still couldn't get under 5MB, reject
    if (fileToUpload.size > MAX_FILE_SIZE) {
      throw new Error(
        `Image still too large after compression (${formatFileSize(fileToUpload.size)}). ` +
          'Please use a smaller image or reduce its resolution.'
      );
    }
  }

  const uniqueFileName = generateUniqueFileName(file.name);
  const storagePath = getNotePath(userId, topicId, uniqueFileName, courseId);
  const storageRef = ref(storage, storagePath);

  // 1. Generate & Upload Thumbnail (if it's an image)
  let thumbnailUrl = '';
  if (isCompressibleImage(file.type) && file.size > 0) {
    // We notify 'compressing' state for thumbnail too
    onProgress?.({ progress: 99, bytesTransferred: 0, totalBytes: 0, state: 'compressing' });

    try {
      // Use original file for thumbnail source to ensure quality
      const thumbFile = await generateThumbnail(file);
      const thumbPath = courseId 
        ? `users/${userId}/courses/${courseId}/notes/${topicId}/thumbnails/thumb_${uniqueFileName}`
        : `users/${userId}/notes/${topicId}/thumbnails/thumb_${uniqueFileName}`;
      const thumbRef = ref(storage, thumbPath);

      // Simple upload for thumbnail (small file)
      const thumbSnapshot = await uploadBytesResumable(thumbRef, thumbFile, {
        contentType: 'image/jpeg',
        customMetadata: { originalId: uniqueFileName },
      });

      thumbnailUrl = await getDownloadURL(thumbSnapshot.ref);
    } catch (error) {
      console.warn('Skipping thumbnail generation due to error:', error);
      // Proceed without thumbnail
    }
  }

  // 2. Upload Main File
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload, {
      contentType: fileToUpload.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        wasCompressed: (fileToUpload !== file).toString(),
        originalSize: file.size.toString(),
        thumbnailUrl, // Store link to thumbnail
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          state: snapshot.state as UploadProgress['state'],
        });
      },
      error => {
        console.error('Upload error:', error);
        reject(new Error('Failed to upload file. Please try again.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Store downloadUrl in metadata for fast retrieval in getTopicNotes
          // This eliminates the need to call getDownloadURL for each file during listing
          await updateMetadata(uploadTask.snapshot.ref, {
            customMetadata: {
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
              wasCompressed: (fileToUpload !== file).toString(),
              originalSize: file.size.toString(),
              thumbnailUrl,
              downloadUrl, // Store for fast retrieval
            },
          });

          const metadata = await getMetadata(uploadTask.snapshot.ref);

          const uploadedNote: UploadedNote = {
            id: uniqueFileName,
            fileName: file.name,
            fileType: getFileType(file.type),
            storagePath,
            downloadUrl,
            uploadedAt: metadata.customMetadata?.uploadedAt || new Date().toISOString(),
            fileSize: metadata.size,
            contentType: metadata.contentType || file.type,
            thumbnailUrl: metadata.customMetadata?.thumbnailUrl || '',
          };

          // Invalidate cache so next getTopicNotes fetches fresh data
          invalidateNotesCache(userId, topicId);

          resolve(uploadedNote);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(new Error('Upload completed but failed to get download URL.'));
        }
      }
    );
  });
};

// ============================================================================
// LIST FUNCTIONS
// ============================================================================

/**
 * Get all notes for a specific topic
 *
 * @param userId - User's Firebase UID
 * @param topicId - Topic ID
 * @returns Promise resolving to array of UploadedNote
 */
export const getTopicNotes = async (userId: string, topicId: string, courseId?: string): Promise<UploadedNote[]> => {
  // Check cache first
  const cacheKey = getCacheKey(userId, topicId, courseId);
  const cached = notesCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for notes: ${cacheKey}`);
    return cached.data;
  }

  const folderPath = courseId 
    ? `users/${userId}/courses/${courseId}/notes/${topicId}`
    : `users/${userId}/notes/${topicId}`;
  const folderRef = ref(storage, folderPath);

  try {
    const result = await listAll(folderRef);

    if (result.items.length === 0) {
      // Cache empty result too
      notesCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }

    const notes = await Promise.all(
      result.items.map(async itemRef => {
        try {
          // Optimized: Only fetch metadata (contains cached downloadUrl)
          // This reduces API calls by 50% compared to fetching both
          const metadata = await getMetadata(itemRef);

          // Use cached URL from metadata, fallback to API call for old files
          const downloadUrl = metadata.customMetadata?.downloadUrl || (await getDownloadURL(itemRef));

          return {
            id: itemRef.name,
            fileName: metadata.customMetadata?.originalName || itemRef.name,
            fileType: getFileType(metadata.contentType || ''),
            storagePath: itemRef.fullPath,
            downloadUrl,
            uploadedAt: metadata.customMetadata?.uploadedAt || metadata.timeCreated,
            fileSize: metadata.size,
            contentType: metadata.contentType || '',
            thumbnailUrl: metadata.customMetadata?.thumbnailUrl || '',
          } as UploadedNote;
        } catch (error) {
          console.error(`Error fetching metadata for ${itemRef.name}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed items and sort by upload date (newest first)
    const sortedNotes = notes
      .filter((note): note is UploadedNote => note !== null)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    // Cache the result
    notesCache.set(cacheKey, { data: sortedNotes, timestamp: Date.now() });

    return sortedNotes;
  } catch (error) {
    // If folder doesn't exist, return empty array
    console.error('Error listing notes:', error);
    return [];
  }
};

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a specific note
 *
 * @param storagePath - Full storage path of the file
 * @returns Promise resolving when delete is complete
 */
export const deleteTopicNote = async (storagePath: string, userId?: string, topicId?: string): Promise<void> => {
  const fileRef = ref(storage, storagePath);

  try {
    // Delete the main file
    await deleteObject(fileRef);

    // Try to delete the thumbnail as well
    // Path: .../topicId/fileName -> .../topicId/thumbnails/thumb_fileName
    try {
      const pathParts = storagePath.split('/');
      const fileName = pathParts.pop();
      if (fileName) {
        // Helper to reconstruct thumb path based on parent path structure
        const thumbPath = `${pathParts.join('/')}/thumbnails/thumb_${fileName}`;
        const thumbRef = ref(storage, thumbPath);
        await deleteObject(thumbRef);
      }
    } catch (thumbError) {
      // It's okay if thumbnail deletion fails (might not exist)
      console.warn('Thumbnail deletion failed (might not exist):', thumbError);
    }

    // Invalidate cache if userId and topicId provided
    if (userId && topicId) {
      invalidateNotesCache(userId, topicId);
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete file. Please try again.');
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Check if file is an image
 */
export const isImageFile = (contentType: string): boolean => {
  return contentType.startsWith('image/');
};

/**
 * Check if file is a PDF
 */
export const isPdfFile = (contentType: string): boolean => {
  return contentType === 'application/pdf';
};
