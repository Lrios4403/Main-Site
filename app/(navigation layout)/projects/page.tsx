import type { Metadata } from "next";
import type { CSSProperties } from "react";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import Window from "@/components/window/Window";
import projects from "./page.module.css";

export const metadata: Metadata = {
  title: "Projects and Workloads.",
  description:
    "Here are some projects I have been working on. Feel free to check them out. JavaScript is required for some projects!",
};

type Project = {
  href: string;
  title: string;
  description: string;
  card?: {
    type: "iframe" | "image";
    src: string;
    style?: CSSProperties;
  };
};

const cards: Project[] = [
  {
    href: "/projects/archives/",
    title: "My Archives",
    description: "Archives of websites and other stuff I find interesting.",
    card: {
      type: "iframe",
      src: "https://archives.m4cgyver.net/",
      style: {
        width: "100%",
        aspectRatio: "16 / 9",
      },
    },
  },
  {
    href: "/projects/startupos/",
    title: "Startup OS",
    description: "A basic OS written in Assembly, based on MikeOS.",
  },
];

export default function Projects() {
  return (
    <>
      <PageHeader title="Projects and Workloads.">
        Here are some projects I have been working on. Feel free to check them
        out. JavaScript is required for some projects!
      </PageHeader>

      <Window title="Projects" className={styles.contentArea}>
        <ul className={projects.grid}>
          {cards.map((card) => (
            <li key={card.href}>
              <div className={projects.card}>
                {card.card?.type === "iframe" && (
                  <iframe
                    src={card.card.src}
                    title={`${card.title} preview`}
                    className={projects.cover}
                    style={card.card.style}
                    loading="lazy"
                  />
                )}

                <a className={projects.link} href={card.href}>
                  {card.card?.type === "image" && (
                    <img
                      src={card.card.src}
                      alt={`${card.title} preview`}
                      className={projects.cover}
                      style={card.card.style}
                      loading="lazy"
                    />
                  )}

                  {!card.card && (
                    <span className={projects.cover} aria-hidden="true">
                      {card.title}
                    </span>
                  )}

                  <span className={projects.cardTitle}>{card.title}</span>
                  <span className={projects.cardDesc}>{card.description}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Window>
    </>
  );
}