"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { PageConfig } from "../_types";

interface PageHeaderProps {
    config: PageConfig;
}

export function PageHeader({ config }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/sayfalar"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <Icon name="arrow_back" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Icon name={config.icon} className="text-emerald-400" />
                        <h2 className="text-2xl font-bold text-white">{config.name}</h2>
                    </div>
                    <p className="text-slate-500 text-sm">{config.path}</p>
                </div>
            </div>
            <a
                href={config.path}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
            >
                <Icon name="open_in_new" />
                Önizle
            </a>
        </div>
    );
}
