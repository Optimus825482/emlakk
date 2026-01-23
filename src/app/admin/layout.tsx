import { auth } from "@/lib/auth";
import { AdminLayoutClient } from "./layout-client";
import { DemirAICommandCenter } from "@/components/admin/DemirAICommandCenter";

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
    return (
      <>
        {children}
        <DemirAICommandCenter />
      </>
    );
  }

  return <AdminLayoutClient user={session.user}>{children}</AdminLayoutClient>;
}
