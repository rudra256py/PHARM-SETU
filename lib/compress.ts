// Place at: lib/compress.ts  (sirf browser me chalega – "use client" components se call karo)

export async function compressImage(
  file: File,
  maxSide = 1600, // isse chhota karne par haath ki likhawat padhna mushkil ho jata hai
  targetBytes = 400_000
): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); // mobile photo seedhi rahe
  } catch {
    bitmap = await createImageBitmap(file);
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas available nahi hai");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.8;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length * 0.75 > targetBytes && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return { base64: dataUrl.split(",")[1], mimeType: "image/jpeg" };
}
