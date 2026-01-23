"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { AdminHeader } from "@/components/admin/header";
import { DemirAICommandCenter } from "@/components/admin/DemirAICommandCenter";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans flex flex-col">
      <AdminHeader user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global Demir-AI Command Center */}
      <DemirAICommandCenter />
    </div>
  );
}
