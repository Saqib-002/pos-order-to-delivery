import React, { useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImagePreviewModalProps {
  /** The image src — can be a URL, base64 data URI, or relative path */
  src: string;
  /** Optional alt text */
  alt?: string;
  /** Called when the user closes the modal */
  onClose: () => void;
}

/**
 * Full-screen image preview modal.
 * Supports zoom in/out, reset, and keyboard close (Escape).
 * Usage:
 *   <ImagePreviewModal src={imageUrl} alt="Slide preview" onClose={() => setPreviewOpen(false)} />
 */
const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  src,
  alt = "Image preview",
  onClose,
}) => {
  const { t } = useTranslation();
  const [scale, setScale] = React.useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.25));
  const resetZoom = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {/* Zoom out */}
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.25}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={t("common.imagePreview.zoomOut")}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Scale indicator */}
          <span className="text-xs font-mono text-white/70 w-12 text-center select-none">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom in */}
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 4}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={t("common.imagePreview.zoomIn")}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={resetZoom}
            disabled={scale === 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={t("common.imagePreview.resetZoom")}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title={t("common.imagePreview.close")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image area — clicking backdrop closes, clicking image itself doesn't */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-150 select-none"
          draggable={false}
        />
      </div>

      {/* Bottom hint */}
      <p
        className="text-center text-[11px] text-white/40 pb-3 flex-shrink-0 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {t("common.imagePreview.hint")}
      </p>
    </div>
  );
};

export default ImagePreviewModal;
