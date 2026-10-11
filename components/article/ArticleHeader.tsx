import { getAuthor } from "@/lib/blog/authors";
import PizzaCube from "@/components/pizza-cube/PizzaCube";
import Window from "@/components/window/Window";
import main from "@/components/main/styles.module.css";
import { formatDate, type Post } from "@/lib/posts";
import styles from "./Prose.module.css";
export default function ArticleHeader({ title, description, post, id }: { title: string; description: string; post?: Post; id?: string }) {
  return <Window title="Title" className={main.header} style={{overflow:"visible"}} bodyStyle={{position:"relative", padding:"12px 16px 14px"}}>
    <div className={main.headerText}>
    <h1 id={id} className={main.brand}>{title}</h1><p className={main.headerWelcome}>{description}</p>
    {post && <div className={styles.meta}><span>{getAuthor(post.authorId).name}</span><span>Published <time dateTime={post.published}>{formatDate(post.published)}</time></span>{post.updated && <span>Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></span>}<span>About {post.readingMinutes} min read</span></div>}
  </div><PizzaCube /></Window>;
}
