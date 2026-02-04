import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: string;
    };
    backHref?: string;
}

export function PageHeader({ title, description, action, backHref }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                {backHref && (
                    <Link href={backHref} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <Icon name="arrow_back" className="text-[20px]" />
                    </Link>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight uppercase">{title}</h1>
                    {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
                </div>
            </div>
            {action && (
                action.href ? (
                    <Link
                        href={action.href}
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        {action.icon && <Icon name={action.icon} />}
                        {action.label}
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        {action.icon && <Icon name={action.icon} />}
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}
