import React from 'react';
import { useTranslation } from 'react-i18next';

interface ImageAspectHintProps {
  /** Aspect ratio label, e.g. "1:1" or "16:9" */
  ratio: string;
  /** Example width in pixels, e.g. 800 */
  width: number;
  /** Example height in pixels, e.g. 800 */
  height: number;
  className?: string;
}

/**
 * Small hint line shown below image upload fields.
 * Renders: "Recommended 1:1 aspect ratio (e.g. 800 × 800)"
 *
 * Usage:
 *   <ImageAspectHint ratio="1:1" width={800} height={800} />
 *   <ImageAspectHint ratio="16:9" width={1280} height={720} />
 */
export function ImageAspectHint({ ratio, width, height, className }: ImageAspectHintProps) {
  const { t } = useTranslation();

  const text = (t('common.imageAspectHint') as string)
    .replace('{ratio}', ratio)
    .replace('{width}', width.toString())
    .replace('{height}', height.toString());

  return (
    <p className={`text-xs text-gray-400 ${className ?? ''}`}>
      {text}
    </p>
  );
}
