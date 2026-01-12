import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export const metadata = {
  title: "DEMİR-NET Komuta Merkezi | Demir Gayrimenkul",
  description: "Demir Gayrimenkul Yönetim ve Kontrol Sistemi",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Giriş sayfası için sadece children render et
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans flex flex-col">
      <AdminHeader user={session.user} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
