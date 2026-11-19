import React from 'react';
import {
  Wallet,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';

interface Props {
  dailyCashflow: number;
  dailyIncome: number;
  dailyExpenses: number;
  netMarginPct: number;
  breakEvenUnits: number;
  monthlySales: number;
  monthlyTarget: number;
}

export const KPICards: React.FC<Props> = ({
  dailyCashflow,
  dailyIncome,
  dailyExpenses,
  netMarginPct,
  breakEvenUnits,
  monthlySales,
  monthlyTarget
}) => {
  const targetProgress = Math.min(100, Math.round((monthlySales / monthlyTarget) * 100));

  const kpis = [
    {
      title: 'Flujo de Caja Hoy',
      amount: `$${dailyCashflow.toLocaleString('es-MX')} MXN`,
      subtitle: `Cobrado $${dailyIncome.toLocaleString('es-MX')} • Gastado $${dailyExpenses.toLocaleString('es-MX')}`,
      badge: '+18% vs ayer',
      badgeColor: 'text-[#D94680] bg-pink-50',
      icon: Wallet,
      iconColor: 'text-zinc-700',
      iconBg: 'bg-zinc-100',
      pedagogicalTitle: 'En mano hoy',
      pedagogicalExplanation: 'Dinero real disponible tras cobrar pedidos de piezas y pagar insumos.'
    },
    {
      title: 'Margen Operativo Neto',
      amount: `${netMarginPct.toFixed(1)}%`,
      subtitle: 'Margen libre descontando luz y filamento',
      badge: 'Saludable',
      badgeColor: 'text-[#582C7B] bg-purple-50',
      icon: TrendingUp,
      iconColor: 'text-zinc-700',
      iconBg: 'bg-zinc-100',
      pedagogicalTitle: 'Ganancia real',
      pedagogicalExplanation: `De cada $100 cobrados, $${netMarginPct.toFixed(1)} son ganancia limpia.`
    },
    {
      title: 'Punto de Equilibrio',
      amount: `${breakEvenUnits} piezas / mes`,
      subtitle: 'Meta mensual para no perder dinero',
      badge: '26 vendidas',
      badgeColor: 'text-emerald-700 bg-emerald-50',
      icon: Target,
      iconColor: 'text-zinc-700',
      iconBg: 'bg-zinc-100',
      pedagogicalTitle: 'Cero pérdidas',
      pedagogicalExplanation: 'Piezas mínimas para cubrir luz, internet y desgaste del equipo.'
    },
    {
      title: 'Ventas del Mes',
      amount: `$${monthlySales.toLocaleString('es-MX')} MXN`,
      subtitle: `Meta: $${monthlyTarget.toLocaleString('es-MX')} (${targetProgress}%)`,
      badge: `${targetProgress}% logrado`,
      badgeColor: 'text-rose-700 bg-rose-50',
      icon: Zap,
      iconColor: 'text-zinc-700',
      iconBg: 'bg-zinc-100',
      pedagogicalTitle: 'Meta mensual',
      pedagogicalExplanation: `Faltan $${Math.max(0, monthlyTarget - monthlySales).toLocaleString('es-MX')} para superar la meta.`,
      hasProgressBar: true,
      progressPct: targetProgress
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;

        return (
          <div
            key={idx}
            className="bg-white rounded-xl p-4.5 border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Minimal header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                  {kpi.title}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${kpi.badgeColor}`}>
                  {kpi.badge}
                </span>
              </div>

              {/* Numerical stat */}
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-2xl font-serif font-bold text-zinc-900 tracking-tight">
                  {kpi.amount}
                </div>
                <div className={`w-7 h-7 rounded-lg ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${kpi.iconColor}`} />
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-normal">
                {kpi.subtitle}
              </p>

              {/* Progress bar if present */}
              {kpi.hasProgressBar && (
                <div className="mt-3">
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-900 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${kpi.progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pedagogical explanation */}
            <div className="mt-3.5 pt-2.5 border-t border-zinc-100 text-[11px] text-zinc-500 leading-snug">
              <span className="font-semibold text-zinc-700">
                {kpi.pedagogicalTitle}:
              </span>{' '}
              {kpi.pedagogicalExplanation}
            </div>
          </div>
        );
      })}
    </div>
  );
};
