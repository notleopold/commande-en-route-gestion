import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
            <div className="flex h-16 items-center px-4">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}