import Sidebar from "@/components/sidebar/Sidebar";
import TopNavigation from "@/components/top-navigation/TopNavigation";

// Section indexes keep the complete sidebar, with top navigation and no slideshow.
// Sidebar owns view tracking, so these pages need no separate tracking pixel.
export default function TopNavigationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNavigation />
      <Sidebar />
      {children}
    </>
  );
}
