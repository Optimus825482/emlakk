"use client";

/**
 * Admin Dashboard Client-Side Widgets
 *
 * Dynamic imports with ssr: false must be in Client Components
 * This wrapper component loads the heavy analytics widgets client-side only
 */

import dynamic from "next/dynamic";

const AnalyticsWidget = dynamic(
  () => import("@/components/admin/analytics-widget").then(mod => mod.AnalyticsWidget),
  {
    ssr: false,
    loading: () => <div className="h-[200px] animate-pulse bg-slate-800 rounded-xl" />
  }
);

const ListingAnalyticsWidget = dynamic(
  () => import("@/components/admin/listing-analytics-widget").then(mod => mod.ListingAnalyticsWidget),
  {
    ssr: false,
    loading: () => <div className="h-[200px] animate-pulse bg-slate-800 rounded-xl" />
  }
);

const SahibindenStatsClient = dynamic(
  () => import("@/components/admin/sahibinden-stats-client").then(mod => mod.SahibindenStatsClient),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-slate-800 rounded-xl" />
  }
);

interface AdminDashboardWidgetsProps {
  children?: React.ReactNode;
}

export function AdminDashboardWidgets({ children }: AdminDashboardWidgetsProps) {
  return (
    <>
      <SahibindenStatsClient />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsWidget />
        <ListingAnalyticsWidget />
      </div>
    </>
  );
}

// Individual exports for flexibility
export { AnalyticsWidget, ListingAnalyticsWidget, SahibindenStatsClient };
