// Photographs: re-drawn on the device before they are kept, which removes
// hidden data such as the GPS location a phone camera stores in the file,
// and keeps them a sensible size.
import { filePut } from './idb';
import { addPhoto, newId } from './store';
import type { Photo } from './types';

const MAX_SIDE = 2200;
const MAX_INPUT = 30 * 1024 * 1024;

export async function addPhotoFile(memoryId: string, file: File, order: number): Promise<Photo | null> {
  if (!file.type.startsWith('image/') || file.size > MAX_INPUT) return null;
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    return null;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.86));
  if (!blob) return null;
  const p: Photo = { id: newId('pho'), memoryId, mime: 'image/jpeg', width: w, height: h, order, createdAt: Date.now() };
  await filePut(p.id, blob);
  await addPhoto(p);
  return p;
}
