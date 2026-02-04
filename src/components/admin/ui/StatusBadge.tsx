interface StatusBadgeProps {
    status: string;
    labels?: Record<string, string>;
    colors?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
    active: "Aktif",
    pending: "Beklemede",
    sold: "Satıldı",
    draft: "Taslak",
    new: "Yeni",
    read: "Okundu",
    replied: "Yanıtlandı",
    archived: "Arşivlendi",
    confirmed: "Onaylandı",
    completed: "Tamamlandı",
    cancelled: "İptal",
};

const defaultColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    sold: "bg-red-500/10 text-red-400 border-red-500/20",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    read: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    replied: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    archived: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatusBadge({ status, labels = defaultLabels, colors = defaultColors }: StatusBadgeProps) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${colors[status] || defaultColors.draft}`}>
            {labels[status] || status}
        </span>
    );
}
