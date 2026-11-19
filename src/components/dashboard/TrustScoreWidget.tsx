import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle2,
  X,
  CreditCard,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  score?: number;
  maxScore?: number;
  onOpenFutureCreditTab?: () => void;
}

export const TrustScoreWidget: React.FC<Props> = ({
  score = 845,
  maxScore = 1000,
  onOpenFutureCreditTab
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanRequested, setLoanRequested] = useState(false);

  // SVG Gauge calculations
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = score / maxScore;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const handleApplyMicrocredit = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#582C7B', '#D94680', '#10B981']
    });
    setLoanRequested(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-2xs flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                  Score de Confianza
                </h3>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Salud operativa del taller
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-900 text-white flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-300" />
              Diamante
            </span>
          </div>

          {/* Circular Gauge and score */}
          <div className="flex items-center gap-4 my-1">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#F4F4F5"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#18181B"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-serif font-bold text-zinc-900 tracking-tight">
                  {score}
                </span>
                <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
                  de 1,000 pts
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Crédito Pre-Aprobado
              </div>
              <p className="text-xs text-zinc-600 leading-snug">
                Línea disponible hasta <strong className="text-zinc-900">$25,000 MXN</strong> para nueva maquinaria o insumos por mayoreo.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Sin trámites bancarios
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowDetailsModal(true)}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Ver desglose</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => {
              if (onOpenFutureCreditTab) {
                onOpenFutureCreditTab();
              } else {
                setShowLoanModal(true);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            Ver Crédito
          </button>
        </div>
      </div>

      {/* Modal Details */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-zinc-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                Cómo se calcula tu Score ({score}/1,000)
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-600">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span>Ventas y Cobros Registrados</span>
                <span className="font-semibold text-zinc-900">380 pts</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span>Margen Operativo Mayor al 35%</span>
                <span className="font-semibold text-zinc-900">220 pts</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span>Entregas a Tiempo sin Reportes</span>
                <span className="font-semibold text-zinc-900">145 pts</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span>Uso Activo de Proveedores Locales</span>
                <span className="font-semibold text-zinc-900">100 pts</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Microcredit */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-zinc-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-800" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Microcrédito de Equipamiento 3D
                </h3>
              </div>
              <button
                onClick={() => setShowLoanModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loanRequested ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-center space-y-2 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">
                  ¡Solicitud Enviada con Éxito!
                </h4>
                <p className="text-xs text-emerald-700">
                  Un asesor te contactará vía WhatsApp para depositar tu línea de crédito.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-600">
                <p>
                  Monto pre-aprobado: <strong className="text-zinc-900 text-sm">$25,000 MXN</strong>
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                  <Printer className="w-4 h-4 text-zinc-700 shrink-0" />
                  <span>Ideal para comprar una Bambu Lab A1 / P1S o surtir 30 kg de filamento.</span>
                </div>
                <button
                  onClick={handleApplyMicrocredit}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  Confirmar Solicitud
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
