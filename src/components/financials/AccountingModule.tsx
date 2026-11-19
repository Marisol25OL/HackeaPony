import React, { useState } from 'react';
import {
  BadgeDollarSign,
  TrendingUp,
  Receipt,
  PlusCircle,
  HelpCircle,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { type Transaction } from '../../db/indexedDB';

interface Props {
  transactions: Transaction[];
  onOpenBillingSAT: () => void;
  onOpenNewTransaction: () => void;
  todayInvoicesCount: number;
  isPremium: boolean;
}

export const AccountingModule: React.FC<Props> = ({
  transactions,
  onOpenBillingSAT,
  onOpenNewTransaction,
  todayInvoicesCount,
  isPremium
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    return true;
  });

  const totalSales = transactions
    .filter((t) => t.type === 'sale')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netProfit = totalSales - totalExpenses;
  const marginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Summary */}
      <div className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold tracking-wide uppercase">
              Contabilidad Sin Complicaciones
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-serif mt-2 tracking-tight">
              Tus Cuentas Claras y Tu Ganancia Limpia
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl mt-1">
              Aquí ves lo que realmente te queda en la bolsa. Sin términos de contadores enredados, solo entradas, salidas e impuestos en orden.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenNewTransaction}
              className="px-4 py-2.5 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Movimiento</span>
            </button>

            <button
              onClick={onOpenBillingSAT}
              className="px-4 py-2.5 rounded-2xl bg-stone-900/80 hover:bg-stone-900 text-white text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 border border-white/20"
            >
              <Receipt className="w-4 h-4 text-amber-300" />
              <span>Generar Factura SAT ({todayInvoicesCount}/2 gratis)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Cobrado (Ventas)</span>
            <div className="text-2xl font-black text-stone-900 font-serif mt-1">
              ${totalSales.toLocaleString('es-MX')} <span className="text-xs font-sans text-stone-400">MXN</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Dinero que entró a tu cuenta
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Gastos en Insumos</span>
            <div className="text-2xl font-black text-stone-900 font-serif mt-1">
              ${totalExpenses.toLocaleString('es-MX')} <span className="text-xs font-sans text-stone-400">MXN</span>
            </div>
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Filamentos, resina y cajas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-rose-50/50 p-5 rounded-3xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Tu Ganancia Real Limpia</span>
            <div className="text-2xl font-black text-stone-900 font-serif mt-1">
              ${netProfit.toLocaleString('es-MX')} <span className="text-xs font-sans text-stone-400">MXN</span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-1">
              Margen neto del <strong className="text-rose-600">{marginPct}%</strong> para ti
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pedagogical Step-by-Step Educational Card (Standard México) */}
      <div className="bg-white rounded-3xl p-5 border border-rose-100/90 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-[#D94680]" />
          <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-impact">
            Reglas de oro
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 leading-relaxed text-stone-600">
            <strong className="text-stone-900 block font-bold mb-1">1. Separa tu dinero:</strong>
            Nunca uses el dinero de tus ventas para gastos personales del día a día. Asígnate un sueldo fijo y deja el resto en el negocio para comprar materiales e inventario.
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 leading-relaxed text-stone-600">
            <strong className="text-stone-900 block font-bold mb-1">2. La materia prima es inversión:</strong>
            Cuando compras insumos o mercancía al mayoreo, multiplicas tu dinero al vender tus productos terminados. ¡Cada peso bien invertido genera ganancia!
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 leading-relaxed text-stone-600">
            <strong className="text-stone-900 block font-bold mb-1">3. El SAT simplificado (RESICO):</strong>
            En México, el Régimen Simplificado (RESICO) cobra entre 1% y 2.5% de impuesto sobre ventas. Es el régimen más accesible para cualquier microempresa o negocio local.
          </div>
        </div>
      </div>

      {/* Transaction List and Filters */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-serif">
              Historial de Ventas y Gastos Registrados
            </h3>
            <p className="text-xs text-stone-500">
              {filteredTransactions.length} movimientos encontrados
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-rose-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterType === 'sale'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Solo Ventas
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterType === 'expense'
                  ? 'bg-rose-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Solo Gastos
            </button>
          </div>
        </div>

        {/* Table / List */}
        <div className="divide-y divide-rose-50">
          {filteredTransactions.map((tx) => (
            <div key={tx.id || Math.random()} className="py-3.5 flex items-center justify-between gap-3 hover:bg-rose-50/20 px-2 rounded-xl transition">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'sale'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  {tx.type === 'sale' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-stone-900">
                      {tx.description}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                      {tx.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                    <span>{tx.date}</span>
                    {tx.customerOrSupplier && (
                      <>
                        <span>•</span>
                        <span>{tx.customerOrSupplier}</span>
                      </>
                    )}
                    {tx.paymentMethod && (
                      <>
                        <span>•</span>
                        <span className="text-stone-500">{tx.paymentMethod}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm sm:text-base font-black font-serif ${
                    tx.type === 'sale' ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {tx.type === 'sale' ? '+' : '-'}${tx.amount.toLocaleString('es-MX')} MXN
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {tx.synced ? 'Sincronizado' : 'Pendiente sync'}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
