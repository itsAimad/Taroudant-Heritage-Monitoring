import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface PhotoMeta {
  crack_id: number
  has_photo: number
  mime_type: string | null
  file_size: number | null
  uploaded_at: string | null
}

interface Props {
  open: boolean
  crackId: number | null
  photos: PhotoMeta[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const CrackPhotoGallery = ({
  open,
  crackId,
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: Props) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    if (open) {
      window.addEventListener('keydown', handler)
    }
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, onPrev, onNext])

  const photo = photos[currentIndex]
  const hasPhoto = photo?.has_photo === 1

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-[#140e0a] border border-sand/10 rounded-2xl shadow-2xl w-full max-w-xl pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-sand/[0.08]">
                <span className="font-heading text-base text-sand-light">
                  Crack Photos
                  {photos.length > 0 && (
                    <span className="text-sand/40 text-sm font-normal ml-2">
                      ({photos.length})
                    </span>
                  )}
                </span>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full border border-sand/10 flex items-center justify-center text-sand/40 hover:text-sand-light hover:border-sand/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Photo display */}
              <div className="px-5 pt-5">
                {photos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-sand/20">
                    <ImageOff className="w-8 h-8 mb-2" />
                    <p className="text-xs font-mono">No photos available</p>
                  </div>
                ) : hasPhoto && crackId ? (
                  <div className="relative">
                    <img
                      key={`${crackId}-${currentIndex}`}
                      src={`${API_BASE}/api/cracks/${crackId}/image`}
                      className="w-full max-h-72 object-contain rounded-lg bg-black/40"
                      alt={`Crack photo ${currentIndex + 1}`}
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-sand/20">
                    <ImageOff className="w-8 h-8 mb-2" />
                    <p className="text-xs font-mono">No photo uploaded for this crack</p>
                  </div>
                )}

                {/* Navigation */}
                {photos.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={onPrev}
                      className="w-7 h-7 rounded-full border border-sand/10 flex items-center justify-center text-sand/40 hover:text-sand-light hover:border-sand/30 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Dot indicators */}
                    <div className="flex gap-1.5">
                      {photos.map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-full transition-all duration-200 ${
                            i === currentIndex
                              ? 'w-4 h-1.5 bg-copper-light'
                              : 'w-1.5 h-1.5 bg-sand/20'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={onNext}
                      className="w-7 h-7 rounded-full border border-sand/10 flex items-center justify-center text-sand/40 hover:text-sand-light hover:border-sand/30 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata row */}
              {photo && (
                <div className="px-5 py-4 mt-3 border-t border-sand/[0.08] flex flex-wrap gap-x-5 gap-y-1">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-sand/25 block">
                      Uploaded
                    </span>
                    <span className="text-xs text-sand/50">
                      {formatDate(photo.uploaded_at)}
                    </span>
                  </div>
                  {photo.mime_type && (
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-sand/25 block">
                        Type
                      </span>
                      <span className="text-xs text-sand/50 font-mono">
                        {photo.mime_type}
                      </span>
                    </div>
                  )}
                  {photo.file_size && (
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-sand/25 block">
                        Size
                      </span>
                      <span className="text-xs text-sand/50 font-mono">
                        {(photo.file_size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CrackPhotoGallery
