import TopNavigation from "@/components/top-navigation/TopNavigation";
import ViewPixel from "@/components/views/ViewPixel";

// Pages here fill the left column themselves, so the site navigation moves
// to the top bar. The pixel still counts their views (they have no Views window).
export default function NoNavigationLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <TopNavigation />
            {children}
            <ViewPixel />
        </>
    );
}
