"use client";

import { Icon } from "@/components/ui/icon";
import { useValuations } from "./_hooks/useValuations";
import {
    ValuationCard,
    ValuationFilters,
    ValuationStats,
    generatePDFReport,
} from "./_components";
import type { Valuation } from "./_types";

export function DegerlemelerClient() {
    const {
        valuations,
        loading,
        filter,
        setFilter,
        selectedValuation,
        setSelectedValuation,
        page,
        setPage,
        totalPages,
        total,
        groupByUser,
        setGroupByUser,
        groupedData,
        toggleGroup,
        handleDelete,
    } = useValuations();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <ValuationStats
                total={total}
                page={page}
                totalPages={totalPages}
                groupByUser={groupByUser}
                onToggleGroupView={() => setGroupByUser(!groupByUser)}
            />

            {/* Filters */}
            <ValuationFilters filter={filter} onFilterChange={setFilter} />

            {/* Valuations List */}
            {valuations.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    <div className="space-y-4">
                        {groupByUser && groupedData.length > 0
                            ? // Gruplu Görünüm
                            groupedData.map((group, idx) => (
                                <GroupedValuationCard
                                    key={idx}
                                    group={group}
                                    onToggle={() => toggleGroup(group.userId, group.date)}
                                    selectedValuation={selectedValuation}
                                    setSelectedValuation={setSelectedValuation}
                                    handleDelete={handleDelete}
                                />
                            ))
                            : // Liste Görünümü
                            valuations.map((valuation) => (
                                <ValuationCard
                                    key={valuation.id}
                                    valuation={valuation}
                                    isSelected={selectedValuation === valuation.id}
                                    onSelect={setSelectedValuation}
                                    onDelete={handleDelete}
                                    onGeneratePDF={generatePDFReport}
                                />
                            ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12">
            <Icon name="calculate" className="text-4xl text-slate-600 mb-3" />
            <p className="text-slate-400">Değerleme talebi bulunamadı</p>
        </div>
    );
}

interface GroupedValuationCardProps {
    group: {
        userId: string;
        userName: string;
        date: string;
        valuations: Valuation[];
        expanded: boolean;
    };
    onToggle: () => void;
    selectedValuation: string | null;
    setSelectedValuation: (id: string | null) => void;
    handleDelete: (id: string) => Promise<void>;
}

function GroupedValuationCard({
    group,
    onToggle,
    selectedValuation,
    setSelectedValuation,
    handleDelete,
}: GroupedValuationCardProps) {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            {/* Group Header */}
            <div
                className="p-4 bg-slate-900/50 cursor-pointer hover:bg-slate-900/70 transition-colors flex items-center justify-between"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <Icon
                        name={group.expanded ? "expand_more" : "chevron_right"}
                        className="text-emerald-400 text-xl"
                    />
                    <div>
                        <h3 className="text-white font-semibold">{group.userName}</h3>
                        <p className="text-slate-400 text-sm">
                            {group.date} • {group.valuations.length} değerleme
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded bg-slate-700 text-slate-300">
                        {group.userId}
                    </span>
                </div>
            </div>

            {/* Group Items */}
            {group.expanded && (
                <div className="divide-y divide-slate-700">
                    {group.valuations.map((valuation) => (
                        <ValuationCard
                            key={valuation.id}
                            valuation={valuation}
                            isSelected={selectedValuation === valuation.id}
                            onSelect={setSelectedValuation}
                            onDelete={handleDelete}
                            onGeneratePDF={generatePDFReport}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    const getPageNumbers = () => {
        const pages: number[] = [];
        for (let i = 0; i < Math.min(5, totalPages); i++) {
            let pageNum: number;
            if (totalPages <= 5) {
                pageNum = i + 1;
            } else if (page <= 3) {
                pageNum = i + 1;
            } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
            } else {
                pageNum = page - 2 + i;
            }
            pages.push(pageNum);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                title="Önceki sayfa"
                aria-label="Önceki sayfa"
            >
                <Icon name="chevron_left" />
            </button>

            <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${page === pageNum
                            ? "bg-emerald-500 text-slate-900"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                            }`}
                    >
                        {pageNum}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                title="Sonraki sayfa"
                aria-label="Sonraki sayfa"
            >
                <Icon name="chevron_right" />
            </button>
        </div>
    );
}
