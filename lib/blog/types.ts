export type Author = {
  id: string;
  name: string;
  alternateName?: string;
  path: string;
  sameAs: string[];
};

export type ArticleMedia = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit?: { name: string; url: string };
  // false: a cover used only as the share image, not shown in the article
  visible?: boolean;
};

export type ArticleSection = { id: string; title: string; level: 2 | 3 | 4 };
/** The byline shown in an article's header and sidebar: who, when, how long.
 *  Posts carry these fields directly; article-style site pages build it. */
export type ArticleMeta = { authorId: string; published: string; updated?: string; readingMinutes: number };
export type ArticleResource = { label: string; href: string; note?: string };

export type PostRecord = {
  slug: string;
  path: `/blogs/${string}`;
  status: "published" | "draft";
  badge?: string;
  title: string;
  seoTitle?: string;
  description: string;
  summary: string;
  authorId: string;
  published: string;
  updated?: string;
  tags: string[];
  readingMinutes: number;
  cover?: ArticleMedia;
  sections: ArticleSection[];
  resources: ArticleResource[];
  credits?: ArticleResource[];
  relatedSlugs: string[];
};
