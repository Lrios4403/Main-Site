"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { credentialGroups, type CredentialGroup } from "./credential-data";
import { formatDate } from "@/lib/blog/dates";
import main from "@/components/main/styles.module.css";
import styles from "./Credentials.module.css";

function CertificateCarousel({ group }: { group: CredentialGroup }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const id = useId();
  const count = group.credentials.length;

  function goTo(index: number) {
    const list = track.current;
    const target = list?.children[index] as HTMLElement | undefined;
    if (!list || !target) return;
    list.scrollTo({ left: target.offsetLeft - (list.children[0] as HTMLElement).offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function syncSlide() {
    const list = track.current;
    if (!list || count < 2) return;
    const step = (list.children[1] as HTMLElement).offsetLeft - (list.children[0] as HTMLElement).offsetLeft;
    if (step) setActive(Math.max(0, Math.min(count - 1, Math.round(list.scrollLeft / step))));
  }

  return <section aria-label={`${group.title} certificates`} aria-roledescription="carousel">
    <div className={styles.groupHeader}>
      <div><h2>{group.title}</h2><p>{group.description}</p></div>
      <div className={styles.controls}>
        <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={`Previous ${group.title} certificate`} aria-controls={id}>‹</button>
        <span aria-live="polite" aria-atomic="true">{active + 1} / {count}</span>
        <button type="button" onClick={() => goTo(active + 1)} disabled={active === count - 1} aria-label={`Next ${group.title} certificate`} aria-controls={id}>›</button>
      </div>
    </div>
    <ul ref={track} id={id} className={styles.track} onScroll={syncSlide} tabIndex={0} aria-label="Certificate slides"
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "ArrowRight") { event.preventDefault(); goTo(Math.min(count - 1, active + 1)); }
        if (event.key === "ArrowLeft") { event.preventDefault(); goTo(Math.max(0, active - 1)); }
      }}>
      {group.credentials.map((credential, index) => <li key={credential.id} className={styles.slide}>
        <figure aria-label={`${index + 1} of ${count}: ${credential.title}`}>
          <a className={styles.preview} href={credential.pdf ?? credential.image} target="_blank" rel="noopener noreferrer"
            tabIndex={index === active ? 0 : -1} aria-label={`Open ${credential.title} ${credential.pdf ? "PDF" : "certificate"}`}>
            <Image src={credential.image} width={credential.width} height={credential.height}
              alt={`Logan Rios — ${credential.title}, ${group.title} ${group.id === "anthropic" ? "certificate of completion" : "credential"}`}
              sizes="(max-width: 768px) 90vw, 760px" />
          </a>
          <figcaption>
            <div><h3>{credential.title}</h3>{credential.date && <p>Earned <time dateTime={credential.date}>{formatDate(credential.date)}</time></p>}</div>
            <div className={styles.links}>
              {credential.pdf && <a href={credential.pdf} target="_blank" rel="noopener noreferrer" tabIndex={index === active ? 0 : -1}>Open PDF ↗</a>}
              {credential.verify && <a href={credential.verify} target="_blank" rel="noopener noreferrer" tabIndex={index === active ? 0 : -1}>View credential ↗</a>}
            </div>
          </figcaption>
        </figure>
      </li>)}
    </ul>
    {count > 1 && <div className={styles.pagination} aria-label={`${group.title} certificate selection`}>
      {group.credentials.map((credential, index) => <button type="button" key={credential.id} onClick={() => goTo(index)}
        aria-label={`Show ${credential.title}`} aria-pressed={active === index} aria-controls={id}>{String(index + 1).padStart(2, "0")}</button>)}
    </div>}
  </section>;
}

export default function Credentials() {
  const [groupIndex, setGroupIndex] = useState(0);
  const id = useId();
  const move = (direction: number) => setGroupIndex(index => (index + direction + credentialGroups.length) % credentialGroups.length);
  return <div className={`${styles.credentials} ${main.gridBackground}`} role="region" aria-label="Credentials by issuer" aria-roledescription="carousel">
    <div className={styles.issuers}>
      <button className={styles.arrow} type="button" onClick={() => move(-1)} aria-label="Previous credential issuer">‹</button>
      <div className={styles.issuerButtons}>{credentialGroups.map((group, index) => <button type="button" key={group.id}
        onClick={() => setGroupIndex(index)} aria-pressed={index === groupIndex} aria-controls={`${id}-${group.id}`}>
        <span className={styles.issuerMark} aria-hidden="true">{group.id === "microsoft" ? "⊞" : "A"}</span>
        <span>{group.title}</span><span className={styles.badge}>{group.credentials.length}</span>
      </button>)}</div>
      <button className={styles.arrow} type="button" onClick={() => move(1)} aria-label="Next credential issuer">›</button>
    </div>
    {credentialGroups.map((group, index) => <div key={group.id} id={`${id}-${group.id}`} hidden={index !== groupIndex}>
      <CertificateCarousel group={group} />
    </div>)}
  </div>;
}
