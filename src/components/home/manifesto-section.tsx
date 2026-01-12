"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

interface ManifestoData {
  id: string;
  shortTitle: string | null;
  shortText: string | null;
}

export function ManifestoSection() {
  const [manifesto, setManifesto] = useState<ManifestoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/manifesto")
      .then((res) => res.json())
      .then((data) => {
        setManifesto(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="relative py-20 md:py-28 bg-slate-900 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="animate-pulse h-8 bg-slate-700 rounded w-48 mx-auto mb-6" />
          <div className="animate-pulse h-24 bg-slate-700 rounded max-w-3xl mx-auto" />
        </div>
      </section>
    );
  }

  // Varsayılan değerler
  const title = manifesto?.shortTitle || "Manifesto";
  const text =
    manifesto?.shortText ||
    "Teknolojiyi benimsemiyoruz; onu yerel uzmanlığımızı ölçeklendirmek için kullanıyoruz. Hendek'in toprağını biliyoruz, şimdi bu toprağa dijital geleceği getiriyoruz.";

  return (
    <section className="relative py-20 md:py-28 bg-slate-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Icon name="auto_awesome" className="text-amber-400 text-lg" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              {title}
            </span>
          </div>

          {/* Quote */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[120px] text-white/5 font-serif leading-none select-none">
              "
            </div>
            <blockquote className="relative z-10 text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-white/90 max-w-4xl mx-auto">
              {text}
            </blockquote>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30" />
            <Icon name="domain" className="text-blue-400 text-xl" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30" />
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/hakkimizda"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300 group"
            >
              <span>Hikayemizi Keşfedin</span>
              <Icon
                name="arrow_forward"
                className="text-lg group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
