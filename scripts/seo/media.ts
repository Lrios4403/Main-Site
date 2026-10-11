import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import sharp from "sharp";
import type { ArticleMedia } from "../../lib/blog/types";

export async function checkMedia(media: ArticleMedia, publicRoot = resolve("public")): Promise<void> {
  const file = resolve(publicRoot, `.${media.src}`);
  if (!file.startsWith(`${resolve(publicRoot)}${sep}`)) throw new Error("Media escapes public directory");
  const dimensions = await sharp(await readFile(file)).metadata();
  if (dimensions.width !== media.width || dimensions.height !== media.height) throw new Error("Wrong image dimensions");
}
