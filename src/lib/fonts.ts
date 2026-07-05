import * as fs from "node:fs/promises";
import * as path from "node:path";

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface LoadedFont {
  name: string;
  weight: FontWeight;
  data: Buffer;
}

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

const REGISTRY: Array<{ file: string; name: string; weight: FontWeight }> = [
  { file: "Inter-Regular.ttf", name: "Inter", weight: 400 },
  { file: "Inter-Medium.ttf", name: "Inter", weight: 500 },
  { file: "Inter-SemiBold.ttf", name: "Inter", weight: 600 },
  { file: "Inter-Bold.ttf", name: "Inter", weight: 700 },
];

let cache: LoadedFont[] | null = null;

export async function loadFonts(): Promise<LoadedFont[]> {
  if (cache) return cache;
  const loaded: LoadedFont[] = [];
  for (const entry of REGISTRY) {
    const filePath = path.join(FONT_DIR, entry.file);
    const data = await fs.readFile(filePath);
    loaded.push({ name: entry.name, weight: entry.weight, data });
  }
  cache = loaded;
  return cache;
}

export async function loadDefaultFontData(): Promise<Buffer> {
  const fonts = await loadFonts();
  return fonts[0]?.data ?? Buffer.alloc(0);
}
