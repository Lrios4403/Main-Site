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
};

export type ArticleSection = { id: string; title: string; level: 2 | 3 | 4 };
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
