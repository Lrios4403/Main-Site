import { site } from "@/lib/site";
import type { Author } from "./types";

export const authors: Author[] = [{ id: "logan-rios", ...site.author, path: "/" }];

export function getAuthor(id: string): Author {
  const author = authors.find(author => author.id === id);
  if (!author) throw new Error(`Unknown author: ${id}`);
  return author;
}
