import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

export function AppLayout() {
  return (
    <div className="min-h-svh bg-background">
      <div className="lg:hidden">
        <Navbar />
      </div>
      <div className="lg:grid lg:grid-cols-[17rem_1fr]">
        <aside className="sticky top-0 hidden h-svh lg:block">
          <Sidebar />
        </aside>
        <main className="min-h-svh">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
