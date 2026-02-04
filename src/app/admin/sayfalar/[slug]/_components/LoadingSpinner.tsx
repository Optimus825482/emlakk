"use client";

import { Icon } from "@/components/ui/icon";

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-64">
            <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
        </div>
    );
}
