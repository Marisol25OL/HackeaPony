import React from 'react';
import { Crown, Sparkles, X, Check, ShieldCheck, Zap, Receipt, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeToPremium: () => void;
}

export const FreemiumLimitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUpgradeToPremium
}) => {
  if (!isOpen) return null;

  const handleSimulateUpgrade = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#F43F5E', '#FDA4AF', '#F59E0B', '#FCE7F3']
    });
    onUpgradeToPremium();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-rose-200 relative overflow-hidden">
        
        {/* Rose gold background shimmer */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-rose-300/30 via-amber-200/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Crown */}
        <div className="text-center pt-2 pb-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-400 to-rose-300 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-200/80 mb-3">
            <Crown className="w-9 h-9 fill-white/80" />
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Límite Diario Alcanzado
          </span>

          <h3 className="text-xl font-black text-stone-900 font-serif tracking-tight leading-tight px-2">
            Has alcanzado el límite de 2 facturas diarias en la versión Gratuita
          </h3>

          <p className="text-xs text-stone-600 mt-2 leading-relaxed px-3">
            Actualiza a la versión <strong className="text-rose-600">Premium</strong> para facturación CFDI 4.0 ilimitada y protege todas tus entregas con la ruta segura.
          </p>
        </div>

        {/* Plan comparison / benefits card */}
        <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 space-y-2.5 my-3">
          <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
            Lo que desbloqueas con MiFyMEs Pro:
          </div>

          <div className="flex items-center gap-2.5 text-xs text-stone-700">
            <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <Receipt className="w-3 h-3" />
            </div>
            <span><strong>Facturación SAT CFDI ilimitada</strong> sin restricciones diarias</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-stone-700">
            <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <MapPin className="w-3 h-3" />
            </div>
            <span><strong>Ruta Segura y Google Maps</strong> con puntos rosa vigilados</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-stone-700">
            <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <Zap className="w-3 h-3" />
            </div>
            <span><strong>Alertas automáticas de desabasto</strong> en filamentos y resinas</span>
          </div>
        </div>

        {/* Pricing tag */}
        <div className="text-center my-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-stone-900 font-serif">$199</span>
            <span className="text-xs text-stone-500 font-medium">MXN / mes</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
            Prueba gratis por 14 días • Cancela cuando quieras
          </span>
        </div>

        {/* Action button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSimulateUpgrade}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-200 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Activar Prueba Gratis de 14 Días</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer"
          >
            Continuar con versión gratuita mañana
          </button>
        </div>

      </div>
    </div>
  );
};
