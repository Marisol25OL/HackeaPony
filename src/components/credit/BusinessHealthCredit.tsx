import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Printer,
  TrendingUp,
  DollarSign,
  Calendar,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  score?: number;
  maxScore?: number;
  onNavigateToTab?: (tab: any) => void;
}

export const BusinessHealthCredit: React.FC<Props> = ({
  score = 845,
  maxScore = 1000,
  onNavigateToTab
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [selectedTermWeeks, setSelectedTermWeeks] = useState<number>(24);
  const [loanRequested, setLoanRequested] = useState(false);
  const [purpose, setPurpose] = useState('Nueva Impresora 3D Multi-color');

  // Gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = score / maxScore;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Loan calculation
  const weeklyRate = 0.012; // 1.2% semanal transparente
  const totalInterest = selectedAmount * (weeklyRate * selectedTermWeeks);
  const totalRepayment = selectedAmount + totalInterest;
  const weeklyPayment = Math.round(totalRepayment / selectedTermWeeks);

  const handleApplyMicrocredit = (e: React.FormEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#F43F5E', '#10B981', '#F59E0B', '#582C7B']
    });
    setLoanRequested(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#582C7B] via-[#D94680] to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Módulo de Crecimiento & Financiamiento a Futuro
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-serif tracking-tight">
            Salud de tu Negocio 3D & Microcrédito
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 mt-2 leading-relaxed">
            Esta es una herramienta diseñada para la <strong>expansión futura</strong> de tu taller. Cada venta, entrega puntual y compra de filamento que registras en MiFyMEs fortalece tu reputación digital para acceder a capital semilla sin aval ni historial bancario complejo.
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Score & Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: The Circular Score Gauge */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-rose-50/60 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-purple-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Score de Confianza Digital
                  </h3>
                  <p className="text-xs text-stone-500">
                    Salud de tu negocio 3D
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Nivel Diamante
              </span>
            </div>

            {/* Circular Gauge Display */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 180 180">
                  {/* Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke="#FCE7F3"
                    strokeWidth="14"
                    fill="none"
                  />
                  {/* Progress */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke="url(#diamondScoreGrad)"
                    strokeWidth="14"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="diamondScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FB7185" />
                      <stop offset="50%" stopColor="#F43F5E" />
                      <stop offset="100%" stopColor="#D94680" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Inner Counter */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl sm:text-5xl font-black text-stone-900 font-serif tracking-tight">
                    {score}
                  </span>
                  <span className="text-xs font-bold text-stone-500 mt-0.5">
                    de {maxScore} pts
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                    Excelente Salud
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-center w-full">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ¡Financiamiento Pre-Aprobado!
                </span>
                <p className="text-xs text-emerald-700 mt-1">
                  Tu constancia te hace elegible a una línea de crédito de hasta <strong>$35,000 MXN</strong> para maquinaria e insumos.
                </p>
              </div>
            </div>
          </div>

          {/* Pillars of score */}
          <div className="space-y-2 pt-3 border-t border-purple-50">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
              ¿Cómo se calcula tu puntuación?
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-stone-500 block text-[10px]">Entregas a tiempo</span>
                <span className="font-bold text-purple-900">99% Cumplimiento</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-stone-500 block text-[10px]">Margen de ganancia</span>
                <span className="font-bold text-rose-900">62% Promedio</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-stone-500 block text-[10px]">Compras de filamento</span>
                <span className="font-bold text-amber-900">Proveedores locales</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-stone-500 block text-[10px]">Flujo de caja</span>
                <span className="font-bold text-emerald-900">Positivo y activo</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Future Microcredit Simulator */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-purple-50">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
                  Opción a Futuro
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif mt-1">
                  Simulador de Financiamiento para tu Taller 3D
                </h3>
                <p className="text-xs text-stone-500">
                  Calcula tus pagos fijos semanales sin sorpresas ni intereses ocultos
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#582C7B] to-[#D94680] text-white flex items-center justify-center shadow-md shadow-purple-200">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            {loanRequested ? (
              <div className="my-8 p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-emerald-950 font-serif">
                  ¡Pre-solicitud Registrada con Éxito!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                  Hemos reservado tu línea de financiamiento por <strong>${selectedAmount.toLocaleString()} MXN</strong> para <em>"{purpose}"</em> con cuotas de <strong>${weeklyPayment} MXN</strong> semanales.
                </p>
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-left text-xs text-stone-700 space-y-2 max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estatus:</span>
                    <span className="font-bold text-emerald-700">Pre-aprobado por MiFyMEs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Monto:</span>
                    <span className="font-bold">${selectedAmount.toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Plazo elegido:</span>
                    <span className="font-bold">{selectedTermWeeks} semanas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Pago semanal fijo:</span>
                    <span className="font-bold text-stone-900">${weeklyPayment} MXN</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={() => setLoanRequested(false)}
                    className="px-5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                  >
                    Hacer Otra Simulación
                  </button>
                  <button
                    onClick={() => {
                      const msg = `Hola! En MiFyMEs tengo mi Score Nivel Diamante (845 pts) y quisiera formalizar mi financiamiento pre-aprobado de $${selectedAmount} MXN para mi taller 3D.`;
                      window.open(`https://wa.me/524432417613?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition cursor-pointer"
                  >
                    Hablar con Asesora por WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyMicrocredit} className="space-y-5 my-5">
                
                {/* Purpose Selection */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1.5">
                    ¿Para qué planeas utilizar el financiamiento?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Nueva Impresora 3D Multi-color', label: 'Impresora 3D Multi-color', icon: Printer },
                      { id: 'Lote de Filamentos al Mayoreo', label: 'Lote Mayoreo Filamentos', icon: Sparkles },
                      { id: 'Estación de Lavado y Curado UV', label: 'Lavadora / Curado UV', icon: ShieldCheck }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPurpose(item.id)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          purpose === item.id
                            ? 'bg-rose-50/70 border-[#D94680] text-rose-900 shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-purple-50/40'
                        }`}
                      >
                        <item.icon className="w-4 h-4 text-[#D94680] mb-1" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-stone-800">
                      Monto a solicitar:
                    </label>
                    <span className="text-lg font-black text-[#582C7B] font-serif">
                      ${selectedAmount.toLocaleString()} MXN
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="40000"
                    step="1000"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(parseInt(e.target.value, 10))}
                    className="w-full accent-[#D94680] cursor-pointer h-2 bg-stone-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-semibold mt-1">
                    <span>$5,000 (Mínimo)</span>
                    <span>$20,000</span>
                    <span>$40,000 (Límite Diamante)</span>
                  </div>
                </div>

                {/* Term in Weeks */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1.5">
                    Plazo de pago:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { weeks: 12, label: '12 Semanas (3 meses)' },
                      { weeks: 24, label: '24 Semanas (6 meses)' },
                      { weeks: 48, label: '48 Semanas (1 año)' }
                    ].map((term) => (
                      <button
                        key={term.weeks}
                        type="button"
                        onClick={() => setSelectedTermWeeks(term.weeks)}
                        className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                          selectedTermWeeks === term.weeks
                            ? 'bg-[#582C7B] text-white border-[#582C7B] shadow-2xs font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 font-semibold'
                        }`}
                      >
                        <span className="text-xs block">{term.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-rose-50/40 to-amber-50/30 border border-purple-100 space-y-2">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Monto de capital:</span>
                    <span className="font-bold text-stone-800">${selectedAmount.toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Tasa de interés preferencial:</span>
                    <span className="font-bold text-emerald-700">1.2% semanal (Tarifa Diamante)</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Total de intereses en el plazo:</span>
                    <span className="font-bold text-stone-800">${Math.round(totalInterest).toLocaleString()} MXN</span>
                  </div>
                  <div className="pt-2 border-t border-purple-200/60 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 uppercase block">Tu cuota semanal fija</span>
                      <span className="text-2xl font-black text-rose-600 font-serif">
                        ${weeklyPayment} MXN
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 bg-white px-2.5 py-1 rounded-full border border-stone-200">
                      Sin letras chiquitas
                    </span>
                  </div>
                </div>

                {/* Submit Application Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D94680] via-rose-500 to-amber-500 hover:opacity-95 text-white text-sm font-bold shadow-md shadow-rose-200 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Solicitar Financiamiento Pre-Aprobado ($ {selectedAmount.toLocaleString()} MXN)</span>
                </button>
              </form>
            )}

          </div>

          {/* Educational Note */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500 mt-4">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Nota Pedagógica MiFyMEs:</strong> Este crédito no revisa tu buró bancario convencional. Se evalúa únicamente la puntualidad de tus ventas de figuras y macetas 3D en Morelia y tus compras de insumos.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
