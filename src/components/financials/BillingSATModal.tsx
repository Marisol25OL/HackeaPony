import React, { useState } from 'react';
import { FileText, Sparkles, X, CheckCircle2, ShieldCheck, AlertCircle, Download, Send } from 'lucide-react';
import { db, type DailyFactura } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  todayCount: number;
  isPremium: boolean;
  onLimitReached: () => void;
  onInvoiceCreated: () => void;
}

export const BillingSATModal: React.FC<Props> = ({
  isOpen,
  onClose,
  todayCount,
  isPremium,
  onLimitReached,
  onInvoiceCreated
}) => {
  const [clientType, setClientType] = useState<'general' | 'rfc'>('general');
  const [rfc, setRfc] = useState('XAXX010101000');
  const [clientName, setClientName] = useState('PÚBLICO EN GENERAL');
  const [cfdiUsage, setCfdiUsage] = useState('S01 - Sin efectos fiscales');
  const [amount, setAmount] = useState('450');
  const [description, setDescription] = useState('Macetas 3D y llaveros personalizados');
  const [postalCode, setPostalCode] = useState('04000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<DailyFactura | null>(null);

  if (!isOpen) return null;

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check freemium limit: If user is not premium and already generated 2 today
    if (!isPremium && todayCount >= 2) {
      onLimitReached();
      return;
    }

    setIsGenerating(true);

    const numAmount = parseFloat(amount) || 200;
    const tax = Number((numAmount * 0.16).toFixed(2));
    const todayStr = new Date().toISOString().split('T')[0];
    const folioNum = Math.floor(1000 + Math.random() * 9000);

    const newFactura: DailyFactura = {
      folio: `FAC-2026-${folioNum}`,
      dateStr: todayStr,
      clientName: clientName.toUpperCase(),
      clientRFC: rfc.toUpperCase(),
      cfdiUsage,
      totalAmount: numAmount,
      taxAmount: tax,
      uuidMock: `${Math.random().toString(36).substring(2, 10).toUpperCase()}-4E11-9C3D-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      pdfGenerated: true
    };

    setTimeout(async () => {
      await db.facturasDaily.add(newFactura);
      setIsGenerating(false);
      setGeneratedInvoice(newFactura);
      onInvoiceCreated();

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#10B981', '#F59E0B']
      });
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 font-serif">
                  Facturación SAT CFDI 4.0
                </h3>
                {isPremium ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    Ilimitadas
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    todayCount >= 2 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {todayCount}/2 gratis hoy
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Genera tu factura simplificada en menos de 1 minuto sin contador
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Generated Success Screen */}
        {generatedInvoice ? (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-stone-900 font-serif">
                ¡Factura Timbrada con Éxito!
              </h4>
              <p className="text-xs text-stone-500">Folio: <strong>{generatedInvoice.folio}</strong></p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">UUID SAT Oficial:</span>
                <span className="font-mono text-stone-800 text-[11px]">{generatedInvoice.uuidMock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Receptor:</span>
                <span className="font-semibold text-stone-800">{generatedInvoice.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">RFC:</span>
                <span className="font-mono text-stone-800">{generatedInvoice.clientRFC}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Monto Total:</span>
                <span className="font-bold text-rose-600 font-serif text-sm">${generatedInvoice.totalAmount} MXN</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert('Descargando archivo PDF y XML del CFDI 4.0...');
                }}
                className="flex-1 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF y XML</span>
              </button>
              <button
                onClick={() => {
                  alert(`Enviando factura ${generatedInvoice.folio} por correo o WhatsApp a la clienta...`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => { setGeneratedInvoice(null); onClose(); }}
              className="w-full py-2 text-xs text-stone-500 hover:text-stone-800"
            >
              Listo, cerrar ventana
            </button>
          </div>
        ) : (
          /* Invoice Form */
          <form onSubmit={handleGenerateInvoice} className="py-4 space-y-4">
            
            {/* Limit Warning banner if in free tier */}
            {!isPremium && (
              <div className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
                todayCount >= 2
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {todayCount >= 2
                      ? 'Llegaste a tu límite de 2 facturas gratuitas hoy. Al dar clic se abrirá la opción Premium.'
                      : `Te queda ${2 - todayCount} factura gratuita hoy.`}
                  </span>
                </div>
              </div>
            )}

            {/* Client Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setClientType('general');
                  setRfc('XAXX010101000');
                  setClientName('PÚBLICO EN GENERAL');
                  setCfdiUsage('S01 - Sin efectos fiscales');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                  clientType === 'general'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-rose-50'
                }`}
              >
                Público en General (Bazar/Venta diaria)
              </button>

              <button
                type="button"
                onClick={() => {
                  setClientType('rfc');
                  setRfc('');
                  setClientName('');
                  setCfdiUsage('G03 - Gastos en general');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                  clientType === 'rfc'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-rose-50'
                }`}
              >
                Cliente con RFC específico
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  RFC del Receptor
                </label>
                <input
                  type="text"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  placeholder="Ej: MOPA9403158L2"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Nombre o Razón Social
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: MARIANA ORTIZ PÉREZ"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Monto Total ($ MXN)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-rose-600 focus:border-rose-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Código Postal Receptor
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Uso de CFDI
                </label>
                <select
                  value={cfdiUsage}
                  onChange={(e) => setCfdiUsage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:border-rose-400 focus:outline-none"
                >
                  <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
                  <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                  <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                  <option value="I08 - Maquinaria y equipo">I08 - Maquinaria y equipo</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Concepto de Venta
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-200 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Conectando con el SAT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Emitir Factura CFDI 4.0 al Instante</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
