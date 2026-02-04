"use client";

import { Icon } from "@/components/ui/icon";

interface SaveButtonProps {
    onClick: () => void;
    saving: boolean;
    label?: string;
}

export function SaveButton({ onClick, saving, label = "Kaydet" }: SaveButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
        >
            {saving ? (
                <>
                    <Icon name="sync" className="animate-spin" />
                    Kaydediliyor...
                </>
            ) : (
                <>
                    <Icon name="save" />
                    {label}
                </>
            )}
        </button>
    );
}
