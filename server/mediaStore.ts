import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type MediaAsset = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string; // absolute
  createdAt: string;
};

const dataDir = path.resolve(process.cwd(), "data");
const uploadsDir = path.resolve(process.cwd(), "uploads");
const indexPath = path.join(dataDir, "media-assets.json");

function ensureDirs() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function loadIndex(): MediaAsset[] {
  ensureDirs();
  try {
    const raw = fs.readFileSync(indexPath, "utf8");
    const j = JSON.parse(raw);
    return Array.isArray(j) ? (j as MediaAsset[]) : [];
  } catch {
    return [];
  }
}

function saveIndex(items: MediaAsset[]) {
  ensureDirs();
  fs.writeFileSync(indexPath, JSON.stringify(items, null, 2), "utf8");
}

export function listMediaAssets(): MediaAsset[] {
  const items = loadIndex();
  // newest first
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getMediaAsset(id: string): MediaAsset | undefined {
  return loadIndex().find((x) => x.id === id);
}

export function createMediaAsset(params: {
  originalName: string;
  mimeType: string;
  size: number;
  tempPath: string; // where multer stored
}) {
  ensureDirs();
  const id = crypto.randomUUID();
  const safeExt = (() => {
    const ext = path.extname(params.originalName || "");
    if (!ext) return "";
    if (ext.length > 10) return "";
    return ext.replace(/[^a-zA-Z0-9.]/g, "");
  })();

  const dest = path.join(uploadsDir, `${id}${safeExt || ""}`);
  fs.renameSync(params.tempPath, dest);

  const asset: MediaAsset = {
    id,
    originalName: params.originalName,
    mimeType: params.mimeType,
    size: params.size,
    filePath: dest,
    createdAt: new Date().toISOString(),
  };

  const items = loadIndex();
  items.push(asset);
  saveIndex(items);
  return asset;
}

export function deleteMediaAsset(id: string) {
  const items = loadIndex();
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  const asset = items[idx];
  items.splice(idx, 1);
  saveIndex(items);
  try {
    fs.unlinkSync(asset.filePath);
  } catch {
    // ignore
  }
  return true;
}

export function getUploadsDir() {
  ensureDirs();
  return uploadsDir;
}
