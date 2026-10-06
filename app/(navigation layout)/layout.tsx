import Sidebar from "@/components/sidebar/Sidebar";
import Slideshow from "@/components/slideshow/Slideshow";
import styles from "@/components/main/styles.module.css";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {/* Slideshow cards — spans the row under the header */}
            <Slideshow className={styles.slideshow} />
            
            {/* Left-hand navigation, views and frens windows */}
            <Sidebar />
            {children}
        </>
    );
}
