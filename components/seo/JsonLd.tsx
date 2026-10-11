// Structured data for search engines. `<` is escaped so a string in the data
// can't close the script tag early. Builders live in lib/seo.ts and lib/blog/schema.ts.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
