"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { pageConfigs } from "./_types";
import { LoadingSpinner } from "./_components";

// Lazy load editors with code splitting
const AnasayfaEditor = dynamic(() => import("./editors/AnasayfaEditor").then((m) => ({ default: m.AnasayfaEditor })), {
    loading: () => <LoadingSpinner />,
});

const HakkimizdaEditor = dynamic(() => import("./editors/HakkimizdaEditor").then((m) => ({ default: m.HakkimizdaEditor })), {
    loading: () => <LoadingSpinner />,
});

const HendekEditor = dynamic(() => import("./editors/HendekEditor").then((m) => ({ default: m.HendekEditor })), {
    loading: () => <LoadingSpinner />,
});

const YatirimRehberiEditor = dynamic(() => import("./editors/YatirimRehberiEditor").then((m) => ({ default: m.YatirimRehberiEditor })), {
    loading: () => <LoadingSpinner />,
});

const IletisimEditor = dynamic(() => import("./editors/IletisimEditor").then((m) => ({ default: m.IletisimEditor })), {
    loading: () => <LoadingSpinner />,
});

const RandevuEditor = dynamic(() => import("./editors/RandevuEditor").then((m) => ({ default: m.RandevuEditor })), {
    loading: () => <LoadingSpinner />,
});

const GenericPageEditor = dynamic(() => import("./editors/GenericPageEditor").then((m) => ({ default: m.GenericPageEditor })), {
    loading: () => <LoadingSpinner />,
});

interface PageEditorClientProps {
    params: Promise<{ slug: string }>;
}

export default function PageEditorClient({ params }: PageEditorClientProps) {
    const { slug } = use(params);
    const pageConfig = pageConfigs[slug];

    // Sayfa bulunamadı
    if (!pageConfig) {
        return (
            <div className="text-center py-12">
                <Icon name="error" className="text-5xl text-red-400 mb-4" />
                <p className="text-slate-400">Sayfa bulunamadı</p>
                <Link
                    href="/admin/sayfalar"
                    className="text-emerald-400 hover:underline mt-4 inline-block"
                >
                    ← Geri Dön
                </Link>
            </div>
        );
    }

    // Sayfa tipine göre uygun editörü lazy load ile render et
    switch (slug) {
        case "anasayfa":
            return <AnasayfaEditor config={pageConfig} />;
        case "hakkimizda":
            return <HakkimizdaEditor config={pageConfig} />;
        case "hendek":
            return <HendekEditor config={pageConfig} />;
        case "rehber":
            return <YatirimRehberiEditor config={pageConfig} />;
        case "iletisim":
            return <IletisimEditor config={pageConfig} />;
        case "randevu":
            return <RandevuEditor config={pageConfig} />;
        default:
            return <GenericPageEditor slug={slug} config={pageConfig} />;
    }
}
