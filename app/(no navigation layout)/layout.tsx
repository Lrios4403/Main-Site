import TopNavigation from "@/components/top-navigation/TopNavigation";
import ViewPixel from "@/components/views/ViewPixel";

// Detail pages here supply their own left column and use top navigation.
// The pixel counts their views because they have no standard Sidebar.
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
