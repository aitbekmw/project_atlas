import { Outlet } from "react-router-dom";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function PublicLayout() {
  return (
    <div className="min-h-svh overflow-x-clip bg-background">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
