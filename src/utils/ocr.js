import { createWorker } from 'tesseract.js';
// Reads text from an image in the browser. The first run downloads the English language data (~10 MB).
export async function ocr(file, onProgress) {
  const worker = await createWorker('eng', 1, { logger: m => { if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100)); } });
  try { const { data } = await worker.recognize(file); return data.text; } finally { await worker.terminate(); }
}
