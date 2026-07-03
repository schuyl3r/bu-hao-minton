const AVATAR_SIZE = 160;
const AVATAR_JPEG_QUALITY = 0.72;

/** Pure crop-rect math, split out so it's testable without a canvas/DOM. */
export function squareCropRect(
  width: number,
  height: number,
): { sx: number; sy: number; side: number } {
  const side = Math.min(width, height);
  return { sx: (width - side) / 2, sy: (height - side) / 2, side };
}

/**
 * Reads an image file, center-crops it to a square, and downsizes it to a
 * small JPEG data URL suitable for storing directly in localStorage-backed
 * state — a raw phone-camera photo can be several MB, which would blow the
 * quota after just a handful of players.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image file"));
      el.src = objectUrl;
    });

    const { sx, sy, side } = squareCropRect(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    return canvas.toDataURL("image/jpeg", AVATAR_JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
