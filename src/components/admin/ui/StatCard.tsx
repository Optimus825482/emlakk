"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface StatCardProps {
    label: string;
    value: number;
    total?: number;
    icon: string;
    color: "emerald" | "yellow" | "blue" | "red" | "purple";
    href?: string;
}

const colorClasses = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "text-emerald-500" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: "text-yellow-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", icon: "text-blue-500" },
    red: { bg: "bg-red-500/10", text: "text-red-400", icon: "text-red-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", icon: "text-purple-500" },
};

export function StatCard({ label, value, total, icon, color, href }: StatCardProps) {
    const colors = colorClasses[color];

    const content = (
        <div className={`${colors.bg} rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className={`text-3xl font-bold ${colors.text} mt-1`}>
                        {value}
                        {total !== undefined && (
                            <span className="text-lg text-slate-500">/{total}</span>
                        )}
                    </p>
                </div>
                <div className={`${colors.icon} opacity-50`}>
                    <Icon name={icon} className="text-[40px]" />
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return content;
}
