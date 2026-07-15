/**
 * Versioned, in-memory-cached localStorage helper.
 *
 * Implements two Vercel React best practices:
 * - `js-cache-storage`: Cache localStorage/sessionStorage reads in memory
 *   to avoid repeated serialization/deserialization on every access.
 * - `client-localstorage-schema`: Version and minimize localStorage data
 *   to safely migrate between schema versions.
 *
 * `advanced-init-once`: migrateSchema() is called once at module load time,
 * NOT inside a component, so it runs exactly once per app lifetime regardless
 * of React's Strict Mode double-invocation behavior.
 */

const SCHEMA_VERSION = 1;
const VERSION_KEY = 'innobilia_schema_version';

import imageCompression from 'browser-image-compression';

// In-memory cache: avoids repeated JSON.parse on every read (js-cache-storage)
const memCache = new Map<string, unknown>();

/** Read from localStorage with in-memory caching */
export function lsGet<T>(key: string): T | null {
  if (memCache.has(key)) return memCache.get(key) as T;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const value = JSON.parse(raw) as T;
    memCache.set(key, value);
    return value;
  } catch {
    return null;
  }
}

/** Write to localStorage and update in-memory cache */
export function lsSet<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    memCache.set(key, value);
  } catch {
    console.warn(`[innobilia] Failed to persist ${key} to localStorage`);
  }
}

/** Remove from localStorage and cache */
function lsRemove(key: string): void {
  localStorage.removeItem(key);
  memCache.delete(key);
}

/** Invalidate in-memory cache for a key (force re-read from storage) */
function lsInvalidate(key: string): void {
  memCache.delete(key);
}

function runMigration(): void {
  try {
    const storedVersion = Number(localStorage.getItem(VERSION_KEY) ?? '0');
    if (storedVersion < SCHEMA_VERSION) {
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('innobilia_')) toDelete.push(k!);
      }
      toDelete.forEach(k => {
        localStorage.removeItem(k);
        memCache.delete(k);
      });
      localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
    }
  } catch {
    // Ignore in restricted environments (SSR, private mode)
  }
}

runMigration();

// ─── Supabase Storage helpers ──────────────────────────────────────────────────

import { supabase, OFFLINE_MODE } from './supabase';

interface UploadResult {
  url: string;
  path: string;
}

export interface UploadBatchResult {
  uploaded: UploadResult[];
  failed: { fileName: string; reason: string }[];
}

/**
 * Sube un archivo individual a Supabase Storage y devuelve su URL pública.
 * Retorna null si está en OFFLINE_MODE o si el upload falla.
 *
 * Bucket policies necesarias (Supabase Dashboard → Storage → Policies):
 *   - INSERT: para subir archivos nuevos
 *   - SELECT: para leer la URL pública
 */
async function uploadImageToStorage(
  bucket: string,
  filePath: string,
  file: File,
): Promise<UploadResult | null> {
  let finalFile: File | Blob = file;
  try {
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp' // <-- Forzar conversión a webp
    };
    finalFile = await imageCompression(file, options);
  } catch (error) {
    console.warn('[storage] Error comprimiendo imagen:', error);
  }

  if (OFFLINE_MODE) {
    console.warn('[storage] Modo offline — imagen no subida:', filePath);
    return null;
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, finalFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[storage] Error al subir:', filePath, '—', error.message);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { url: data.publicUrl, path: filePath };
}

/**
 * Sube múltiples imágenes a Supabase Storage en paralelo.
 * Usa Promise.allSettled → nunca lanza aunque fallen algunos archivos.
 *
 * @param bucket       Nombre del bucket (ej. 'property-images')
 * @param folderName   Carpeta dentro del bucket (ej. 'casa-de-playa')
 * @param files        Array de { file: File } a subir
 */
export async function uploadImageBatch(
  bucket: string,
  folderName: string,
  files: { file: File }[],
): Promise<UploadBatchResult> {
  if (OFFLINE_MODE) {
    console.warn('[storage] Modo offline — batch de imágenes no subido.');
    return { uploaded: [], failed: [] };
  }

  const timestamp = Date.now();

  const results = await Promise.allSettled(
    files.map(async ({ file }, idx) => {
      // Como convertimos todo a webp, forzamos esa extensión
      const ext = 'webp';
      const filePath = `${folderName}/foto-${idx}-${timestamp}.${ext}`;
      const result = await uploadImageToStorage(bucket, filePath, file);
      if (!result) throw new Error(file.name);
      return result;
    }),
  );

  const uploaded: UploadResult[] = [];
  const failed: { fileName: string; reason: string }[] = [];

  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      uploaded.push(r.value);
    } else {
      failed.push({
        fileName: files[idx].file.name,
        reason: r.reason?.message ?? 'Error desconocido',
      });
    }
  });

  return { uploaded, failed };
}

/**
 * Elimina múltiples imágenes de Supabase Storage usando sus URLs públicas.
 *
 * @param bucket Nombre del bucket (ej. 'property-images')
 * @param urls   Array de URLs públicas a eliminar
 */
export async function deleteImagesFromStorage(
  bucket: string,
  urls: string[]
): Promise<void> {
  if (OFFLINE_MODE || !urls || urls.length === 0) return;

  const pathsToRemove: string[] = [];

  urls.forEach(url => {
    // Extraer el path relativo: todo después de `/public/[bucket]/`
    const searchString = `/public/${bucket}/`;
    const index = url.indexOf(searchString);
    if (index !== -1) {
      pathsToRemove.push(url.substring(index + searchString.length));
    }
  });

  if (pathsToRemove.length === 0) return;

  try {
    const { error } = await supabase.storage.from(bucket).remove(pathsToRemove);
    if (error) {
      console.error('[storage] Error al eliminar imágenes del storage:', error.message);
    }
  } catch (err) {
    console.error('[storage] Excepción al intentar eliminar imágenes:', err);
  }
}
