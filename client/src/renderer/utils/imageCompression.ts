import imageCompression from 'browser-image-compression';

export interface CompressInfo {
  original: number;
  compressed: number;
  width?: number;
  height?: number;
}

/**
 * Reads the natural pixel dimensions of a File or Blob by rendering it
 * into an off-screen Image element.
 */
export function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

/**
 * Compresses an image file to WebP, capping at 2 MB and 85 % quality while
 * preserving the original pixel dimensions.
 *
 * Returns:
 *   - outputFile  — the compressed File (or the original on failure)
 *   - previewUrl  — a blob: URL for immediate preview (caller must revoke it)
 *   - compressInfo — size / dimension stats, or null if compression failed
 */
export async function compressImageFile(file: File): Promise<{
  outputFile: File;
  previewUrl: string;
  compressInfo: CompressInfo | null;
}> {
  try {
    const origDims = await getImageDimensions(file);

    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: Math.max(origDims.width || 1920, origDims.height || 1080, 1920),
      alwaysKeepResolution: true,
      initialQuality: 0.85,
      useWebWorker: true,
      fileType: 'image/webp',
    });

    const outName = file.name.replace(/\.[^.]+$/, '.webp');
    const outputFile = new File([compressed], outName, { type: 'image/webp' });
    const outDims = await getImageDimensions(outputFile);

    const compressInfo: CompressInfo = {
      original: file.size,
      compressed: outputFile.size,
      width: outDims.width || origDims.width,
      height: outDims.height || origDims.height,
    };

    return {
      outputFile,
      previewUrl: URL.createObjectURL(outputFile),
      compressInfo,
    };
  } catch {
    // Compression failed — fall back to the raw file, no stats
    return {
      outputFile: file,
      previewUrl: URL.createObjectURL(file),
      compressInfo: null,
    };
  }
}

/**
 * Converts a File or Blob to a base64 Data URL string (used by the Electron
 * IPC layer which expects base64 rather than a blob URL).
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
