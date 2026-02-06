'use client';

import {
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  ExternalLink,
  Download,
  X,
  Loader2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  uploadTopicNote,
  getTopicNotes,
  deleteTopicNote,
  formatFileSize,
  UploadedNote,
  UploadProgress,
} from '@/lib/firebase/storage-utils';
import { cn } from '@/lib/utils/utils';

import { useCourse } from '@/contexts/CourseContext';

interface HandwrittenNotesTabProps {
  userId: string;
  topicId: string;
}

export function HandwrittenNotesTab({ userId, topicId }: HandwrittenNotesTabProps) {
  const { toast } = useToast();
  const { activeCourseId } = useCourse();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [notes, setNotes] = useState<UploadedNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewNote, setPreviewNote] = useState<UploadedNote | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load notes on first render (lazy loading)
  const loadNotes = useCallback(async () => {
    if (hasLoaded || loading) {
      return;
    }

    setLoading(true);
    try {
      const fetchedNotes = await getTopicNotes(userId, topicId, activeCourseId ?? undefined);
      setNotes(fetchedNotes);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, topicId, hasLoaded, loading, toast]);

  // Trigger load when component mounts (lazy loading)
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Handle file upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setUploadProgress(null);

    const uploadPromises = Array.from(files).map(async file => {
      try {
        const uploadedNote = await uploadTopicNote(userId, topicId, file, progress => setUploadProgress(progress), activeCourseId ?? undefined);
        return uploadedNote;
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload file.',
          variant: 'destructive',
        });
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((note): note is UploadedNote => note !== null);

    if (successfulUploads.length > 0) {
      setNotes(prev => [...successfulUploads, ...prev]);
      toast({
        title: 'Upload Complete',
        description: `${successfulUploads.length} file(s) uploaded successfully.`,
      });
    }

    setUploading(false);
    setUploadProgress(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file delete
  const handleDelete = async (note: UploadedNote) => {
    setDeleting(note.id);
    try {
      await deleteTopicNote(note.storagePath);
      setNotes(prev => prev.filter(n => n.id !== note.id));
      toast({
        title: 'Deleted',
        description: 'File removed successfully.',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  // Preview navigation
  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewNote) {
      return;
    }
    const imageNotes = notes.filter(n => n.fileType === 'image');
    const currentImageIndex = imageNotes.findIndex(n => n.id === previewNote.id);

    if (direction === 'prev' && currentImageIndex > 0) {
      const prevNote = imageNotes[currentImageIndex - 1];
      if (prevNote) {
        setPreviewNote(prevNote);
      }
    } else if (direction === 'next' && currentImageIndex < imageNotes.length - 1) {
      const nextNote = imageNotes[currentImageIndex + 1];
      if (nextNote) {
        setPreviewNote(nextNote);
      }
    }
  };

  // Separate images and PDFs
  const imageNotes = notes.filter(n => n.fileType === 'image');
  const pdfNotes = notes.filter(n => n.fileType === 'pdf');

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200',
          isDragging ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/30',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={e => handleUpload(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <div className="space-y-2">
                <p className="font-medium text-slate-700">
                  {uploadProgress?.state === 'compressing' ? 'Compressing image...' : 'Uploading...'}
                </p>
                {uploadProgress && (
                  <div className="w-48 mx-auto">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          uploadProgress.state === 'compressing' ? 'bg-amber-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {uploadProgress.state === 'compressing'
                        ? `Optimizing quality... ${Math.round(uploadProgress.progress)}%`
                        : `${Math.round(uploadProgress.progress)}%`}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Upload className="h-7 w-7 text-slate-500" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Drag and drop your handwritten notes</p>
                <p className="text-sm text-slate-500 mt-1">
                  or click to browse • Images auto-optimized • PDFs up to 5MB
                </p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-2">
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notes Display */}
      {notes.length === 0 ? (
        <div className="text-center py-16 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="text-xl font-semibold text-slate-900">No notes yet</h4>
          <p className="text-slate-600 mt-2 max-w-sm mx-auto">
            Upload photos of your handwritten notes or PDF documents to keep everything organized.
          </p>
        </div>
      ) : (
        <>
          {/* Image Gallery */}
          {imageNotes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-slate-400" />
                Images
                <span className="text-sm font-normal text-slate-500">({imageNotes.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageNotes.map(note => (
                  <div
                    key={note.id}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <img
                      src={note.thumbnailUrl || note.downloadUrl}
                      alt={note.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{note.fileName}</p>
                        <p className="text-white/70 text-xs">{formatFileSize(note.fileSize)}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => setPreviewNote(note)}
                          className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                          title="Preview"
                        >
                          <ZoomIn className="h-4 w-4 text-slate-700" />
                        </button>
                        <a
                          href={note.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4 text-slate-700" />
                        </a>
                        <a
                          href={note.downloadUrl}
                          download={note.fileName}
                          className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-slate-700" />
                        </a>
                        <button
                          onClick={() => handleDelete(note)}
                          disabled={deleting === note.id}
                          className="p-2 bg-red-500/90 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === note.id ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF List */}
          {pdfNotes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                PDFs
                <span className="text-sm font-normal text-slate-500">({pdfNotes.length})</span>
              </h3>
              <div className="space-y-2">
                {pdfNotes.map(note => (
                  <div
                    key={note.id}
                    className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{note.fileName}</p>
                        <p className="text-sm text-slate-500">{formatFileSize(note.fileSize)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={note.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4 text-slate-600" />
                      </a>
                      <a
                        href={note.downloadUrl}
                        download={note.fileName}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-slate-600" />
                      </a>
                      <button
                        onClick={() => handleDelete(note)}
                        disabled={deleting === note.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === note.id ? (
                          <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Image Preview Modal */}
      {previewNote && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewNote(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setPreviewNote(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Navigation */}
          {imageNotes.length > 1 && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  navigatePreview('prev');
                }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
                disabled={imageNotes.findIndex(n => n.id === previewNote.id) === 0}
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  navigatePreview('next');
                }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
                disabled={imageNotes.findIndex(n => n.id === previewNote.id) === imageNotes.length - 1}
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={previewNote.downloadUrl}
            alt={previewNote.fileName}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {/* Info bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur px-4 py-2 rounded-full">
            <span className="text-white text-sm font-medium">{previewNote.fileName}</span>
            <span className="text-white/60 text-sm">{formatFileSize(previewNote.fileSize)}</span>
            <div className="flex gap-2">
              <a
                href={previewNote.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4 text-white" />
              </a>
              <a
                href={previewNote.downloadUrl}
                download={previewNote.fileName}
                onClick={e => e.stopPropagation()}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
