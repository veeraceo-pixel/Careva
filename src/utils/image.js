// Shrinks a photo (and fixes its rotation) so it uploads fast and reads well.
export async function prep(file, max = 1800) {
  const b = await createImageBitmap(file), r = Math.min(1, max / Math.max(b.width, b.height));
  const c = document.createElement('canvas'); c.width = Math.round(b.width * r); c.height = Math.round(b.height * r);
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', .88));
}
