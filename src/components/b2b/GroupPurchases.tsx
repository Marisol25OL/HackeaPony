import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  Percent,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { type GroupPurchase, db } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  groupPurchases: GroupPurchase[];
  onRefreshData: () => void;
}

export const GroupPurchases: React.FC<Props> = ({ groupPurchases, onRefreshData }) => {
  const [selectedGroup, setSelectedGroup] = useState<GroupPurchase | null>(null);
  const [joinAmount, setJoinAmount] = useState<number>(2);

  const handleConfirmJoin = async () => {
    if (!selectedGroup) return;

    const newCurrent = selectedGroup.currentKilos + joinAmount;
    const newJoined = selectedGroup.userJoinedKilos + joinAmount;
    const isFunded = newCurrent >= selectedGroup.targetKilos;

    await db.groupPurchases.update(selectedGroup.id, {
      currentKilos: newCurrent,
      userJoinedKilos: newJoined,
      participantsCount: selectedGroup.participantsCount + 1,
      status: isFunded ? 'funded' : 'active'
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F43F5E', '#FDA4AF', '#F59E0B', '#10B981']
    });

    setSelectedGroup(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#582C7B] rounded-sm p-6 text-white shadow-xs border border-[#472264] relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-sm bg-[#D94680] text-xs font-impact uppercase tracking-wider text-white">
            Compras por Mayoreo
          </span>
          <h2 className="text-xl sm:text-2xl font-impact uppercase mt-2 tracking-wide text-white">
            Ahorro Colectivo en Insumos y Mercancía
          </h2>
          <p className="text-xs sm:text-sm text-pink-100 mt-1 leading-relaxed">
            Los distribuidores ofrecen precios mucho más bajos a partir de mayoreo. Aquí nos unimos varios negocios locales y emprendedores para comprar juntos y ahorrar hasta 35% por paquete o insumo.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {groupPurchases.map((group) => {
          const progressPct = Math.min(100, Math.round((group.currentKilos / group.targetKilos) * 100));

          return (
            <div
              key={group.id}
              className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header with supplier and discount badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {group.supplier}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Ahorras ${group.savingsPerUnit} c/u
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 font-serif leading-tight">
                  {group.title}
                </h3>
                <span className="text-xs text-rose-600 font-semibold block mt-1">
                  {group.material}
                </span>

                {/* Pricing comparison */}
                <div className="my-4 p-3 rounded-2xl bg-rose-50/50 border border-rose-100/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 block line-through">
                      Precio Tienda: ${group.retailPrice} MXN
                    </span>
                    <div className="text-xl font-black text-stone-900 font-serif">
                      ${group.pricePerUnit} <span className="text-xs font-sans text-stone-500 font-normal">MXN/unidad</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      -{Math.round((group.savingsPerUnit / group.retailPrice) * 100)}% Mayoreo
                    </span>
                  </div>
                </div>

                {/* Progress bar towards wholesale goal */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>Meta del grupo: {group.currentKilos} de {group.targetKilos} unidades</span>
                    <span className="text-rose-600">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-rose-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>{group.participantsCount} emprendedoras sumadas</span>
                    <span>Cierra: {group.deadlineDate}</span>
                  </div>
                </div>

                {/* User participation tag */}
                {group.userJoinedKilos > 0 && (
                  <div className="mb-4 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Apartaste {group.userJoinedKilos} unidades en este lote</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedGroup(group);
                  setJoinAmount(2);
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-bold shadow-xs active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Unirme a este pedido grupal</span>
              </button>

            </div>
          );
        })}
      </div>

      {/* Join Group Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-rose-100">
            <div className="flex justify-between items-center pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-stone-900 font-serif">
                Unirme a la Compra Consolidada
              </h4>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <span className="text-xs font-bold text-rose-600">{selectedGroup.title}</span>
                <p className="text-xs text-stone-500 mt-0.5">
                  Precio mayoreo pactado: <strong>${selectedGroup.pricePerUnit} MXN</strong> (Ahorro de ${selectedGroup.savingsPerUnit} por unidad)
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-700">¿Cuántas unidades deseas apartar?</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setJoinAmount(Math.max(1, joinAmount - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-300 font-bold text-sm flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-black text-sm w-6 text-center">{joinAmount}</span>
                    <button
                      onClick={() => setJoinAmount(joinAmount + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-300 font-bold text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-bold text-stone-900">
                  <span>Total a pagar al consolidar:</span>
                  <span className="text-rose-600 font-serif text-sm">
                    ${(joinAmount * selectedGroup.pricePerUnit).toLocaleString('es-MX')} MXN
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold text-right">
                  ¡Te estás ahorrando ${(joinAmount * selectedGroup.savingsPerUnit).toLocaleString('es-MX')} MXN!
                </div>
              </div>

              <div className="text-[11px] text-stone-500 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                Al sumarte, tu pedido se reserva sin pago anticipado forzoso. Cuando el lote llegue al 100%, se realiza la compra conjunta directa al importador.
              </div>

              <button
                onClick={handleConfirmJoin}
                className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 transition cursor-pointer"
              >
                Confirmar y Reservar en el Grupo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
