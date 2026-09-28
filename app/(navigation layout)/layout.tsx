 
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {/* Left-hand navigation */}
            <div className={styles.navLhs}>
                <Window title="Navigation" bodyStyle={{ padding: 8, paddingLeft: 12 }}>
                    <ul className={styles.list}>
                        <li>
                            <a className={styles.navLink} href="/">
                                Home
                            </a>
                        </li>
                        <li>
                            <a className={styles.navLink} href="/contact/">
                                Contact / Socials
                            </a>
                        </li>
                        <li>
                            <a className={styles.navLink} href="/projects/">
                                Current Projects
                            </a>
                            <ul className={styles.list}>
                                <li>
                                    <a className={styles.navLink} href="/projects/archives/">
                                        Archives
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a className={styles.navLink} href="/blogs/">
                                Blog Postings
                            </a>
                        </li>
                    </ul>
                </Window>
            </div>
            {children}
        </>
    );
}
