import Sidebar from "@/components/sidebar/Sidebar";
import TopNavigation from "@/components/top-navigation/TopNavigation";

// Top navigation replaces only the sidebar navigation links.
// Views (including tracking) and friends remain in the left column.
export default function TopNavigationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNavigation />
      <Sidebar showNavigation={false} />
      {children}
    </>
  );
}
