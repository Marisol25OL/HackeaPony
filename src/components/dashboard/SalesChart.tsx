import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const SalesChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');

  const dataSets: Record<Timeframe, {
    title: string;
    total: string;
    growth: string;
    labels: string[];
    values: number[];
    maxVal: number;
    categories: Array<{ name: string; pct: number; color: string; amount: string }>;
  }> = {
    daily: {
      title: 'Ventas de Hoy por Turnos',
      total: '$3,890 MXN',
      growth: '+12% vs ayer',
      labels: ['09:00', '12:00', '15:00', '18:00', '21:00'],
      values: [650, 1100, 480, 1260, 400],
      maxVal: 1500,
      categories: [
        { name: 'Macetas Geométricas', pct: 40, color: 'bg-zinc-900', amount: '$1,556' },
        { name: 'Dragones Articulados', pct: 35, color: 'bg-zinc-700', amount: '$1,361' },
        { name: 'Llaveros y Recuerdos', pct: 25, color: 'bg-zinc-400', amount: '$973' }
      ]
    },
    weekly: {
      title: 'Ventas de Esta Semana',
      total: '$14,680 MXN',
      growth: '+24% vs semana previa',
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      values: [1450, 1800, 2100, 1950, 3200, 2780, 1400],
      maxVal: 3500,
      categories: [
        { name: 'Figuras y Dragones', pct: 38, color: 'bg-zinc-900', amount: '$5,578' },
        { name: 'Macetas y Hogar', pct: 32, color: 'bg-zinc-700', amount: '$4,697' },
        { name: 'Llaveros y Recuerdos', pct: 20, color: 'bg-zinc-500', amount: '$2,936' },
        { name: 'Maquetas y Litofonías', pct: 10, color: 'bg-zinc-300', amount: '$1,469' }
      ]
    },
    monthly: {
      title: 'Ventas de los Últimos 6 Meses',
      total: '$82,450 MXN',
      growth: '+35% semestral',
      labels: ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'],
      values: [11200, 18900, 12400, 13100, 14600, 18920],
      maxVal: 22000,
      categories: [
        { name: 'Regalos Personalizados', pct: 42, color: 'bg-zinc-900', amount: '$34,629' },
        { name: 'Macetas y Hogar', pct: 28, color: 'bg-zinc-700', amount: '$23,086' },
        { name: 'Recuerdos de Eventos', pct: 18, color: 'bg-zinc-500', amount: '$14,841' },
        { name: 'Piezas a Medida / STL', pct: 12, color: 'bg-zinc-300', amount: '$9,894' }
      ]
    },
    yearly: {
      title: 'Comparativa Anual',
      total: '$198,200 MXN',
      growth: '+48% anual',
      labels: ['2023', '2024', '2025', '2026'],
      values: [42000, 78000, 135000, 198200],
      maxVal: 220000,
      categories: [
        { name: 'Catálogo Propio', pct: 55, color: 'bg-zinc-900', amount: '$109,010' },
        { name: 'Pedidos Mayoreo', pct: 27, color: 'bg-zinc-700', amount: '$53,514' },
        { name: 'Servicios de Impresión', pct: 18, color: 'bg-zinc-400', amount: '$35,676' }
      ]
    }
  };

  const current = dataSets[timeframe];

  return (
    <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900">
              Ventas Históricas
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              {current.growth}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {current.title} — Acumulado: <strong className="text-zinc-900">{current.total}</strong>
          </p>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg self-start sm:self-auto">
          {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {tf === 'daily' && 'Día'}
              {tf === 'weekly' && 'Semana'}
              {tf === 'monthly' && 'Mes'}
              {tf === 'yearly' && 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-4">
        
        {/* Visual Bar Graph */}
        <div className="xl:col-span-7 flex flex-col justify-between bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
              Comportamiento ($ MXN)
            </span>
            <span className="text-[11px] text-zinc-400">
              Tope: ${current.maxVal.toLocaleString('es-MX')}
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 px-2 pt-4">
            {current.labels.map((label, idx) => {
              const val = current.values[idx];
              const heightPct = Math.min(100, Math.max(10, Math.round((val / current.maxVal) * 100)));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-[24px]">
                  <span className="text-[9px] font-medium text-zinc-500 whitespace-nowrap">
                    ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  </span>

                  <div className="w-full max-w-[32px] bg-zinc-200/70 rounded-md relative overflow-hidden h-full flex items-end">
                    <div
                      className="w-full rounded-md bg-zinc-900 hover:bg-[#582C7B] transition-colors duration-150"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-medium text-zinc-500 truncate text-center max-w-[50px]">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 text-[11px] text-zinc-500 border-t border-zinc-200/50">
            Los viernes y sábados concentran mayor volumen por entregas de fin de semana.
          </div>
        </div>

        {/* Right Column: Category breakdown */}
        <div className="xl:col-span-5 flex flex-col justify-between bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide block mb-3">
              Ventas por Categoría
            </span>

            <div className="space-y-3">
              {current.categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800">{cat.name}</span>
                    <span className="font-semibold text-zinc-900">{cat.amount} ({cat.pct}%)</span>
                  </div>
                  <div className="w-full bg-zinc-200/70 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${cat.color} h-1.5 rounded-full`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200/50 text-[11px] text-zinc-500">
            Categoría más rentable: <strong className="text-zinc-800">{current.categories[0].name}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};
