import { Icon } from "@/components/ui/icon";

interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-800 p-4 mb-4">
                <Icon name={icon} className="text-[40px] text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            {description && <p className="text-sm text-slate-400 max-w-sm">{description}</p>}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
