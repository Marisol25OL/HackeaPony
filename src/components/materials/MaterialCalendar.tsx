import React, { useState } from 'react';
import {
  CalendarDays,
  Truck,
  MessageCircle,
  XCircle,
  Plus,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { type SupplierMaterialOrder, db } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  materialOrders: SupplierMaterialOrder[];
  onRefreshOrders: () => void;
}

export const MaterialCalendar: React.FC<Props> = ({ materialOrders, onRefreshOrders }) => {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [supplierName, setSupplierName] = useState('Filamentos México Directo');
  const [supplierPhone, setSupplierPhone] = useState('+525534892100');
  const [materialName, setMaterialName] = useState('2 Carretes PLA Rosa Pastel Silk 1kg');
  const [quantity, setQuantity] = useState('2 Carretes (2kg)');
  const [totalCost, setTotalCost] = useState('690');
  const [arrivalDate, setArrivalDate] = useState('Viernes 26 Sept');

  // WhatsApp acceleration action
  const handleAccelerateWhatsApp = (order: SupplierMaterialOrder) => {
    const text = `Hola ${order.supplierName}! 👋 Te saluda el Taller de Impresión 3D MiFyMEs. Te escribo sobre mi pedido #${order.id} (${order.materialName}). Quisiera consultar si es posible acelerar el despacho o darme el número de guía actualizado, ya que tenemos piezas en cola de impresión esperando este material. ¡Muchas gracias por tu apoyo! ✨`;
    const cleanPhone = order.supplierPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp cancellation action
  const handleCancelWhatsApp = (order: SupplierMaterialOrder) => {
    const text = `Hola ${order.supplierName}, buenas tardes. Te escribo del Taller MiFyMEs para solicitar la cancelación formal del pedido #${order.id} (${order.materialName}) por cambio de logística en nuestro taller. ¿Me podrías indicar el proceso para reembolso o saldo a favor? Agradezco mucho tu atención.`;
    const cleanPhone = order.supplierPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCreateMaterialOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    const newId = `MAT-${Math.floor(100 + Math.random() * 900)}`;

    await db.materialOrders.add({
      id: newId,
      supplierName,
      supplierPhone,
      materialName,
      quantity,
      totalCost: parseFloat(totalCost) || 500,
      status: 'ordered',
      orderDate: todayStr,
      estimatedArrivalDate: arrivalDate
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    setShowNewOrderModal(false);
    onRefreshOrders();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
              Calendario de Llegada de Insumos & Conexión WhatsApp
            </h3>
            <p className="text-xs text-stone-500">
              Rastrea cuándo llegan tus filamentos, boquillas y resinas, y comunícate con 1 clic con tu proveedor
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-rose-200 transition active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Pedido de Insumo</span>
        </button>
      </div>

      {/* Visual Timeline / Calendar Cards */}
      <div className="space-y-3">
        {materialOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs hover:border-rose-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-rose-500" />
                <span className="text-[9px] font-bold text-stone-500 mt-0.5">{order.status === 'shipped' ? 'En ruta' : 'Pedido'}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {order.id}
                  </span>
                  <h4 className="text-sm font-bold text-stone-900">
                    {order.materialName}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">Proveedor: {order.supplierName}</span>
                  <span>•</span>
                  <span>Cantidad: <strong className="text-stone-800">{order.quantity}</strong></span>
                  <span>•</span>
                  <span>Inversión: <strong className="text-rose-600 font-serif">${order.totalCost} MXN</strong></span>
                </div>

                <div className="flex items-center gap-2 text-xs text-amber-700 font-medium pt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fecha estimada de llegada a tu taller: <strong>{order.estimatedArrivalDate}</strong></span>
                  {order.trackingNumber && (
                    <span className="text-stone-500">({order.trackingNumber})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic WhatsApp Integration Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-rose-50">
              <button
                onClick={() => handleAccelerateWhatsApp(order)}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Abrir WhatsApp para pedir prioridad de entrega al proveedor"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Acelerar envío por WhatsApp</span>
              </button>

              <button
                onClick={() => handleCancelWhatsApp(order)}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-600 hover:text-rose-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Abrir mensaje cordial de cancelación"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar pedido</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-rose-100">
            <div className="flex justify-between items-center pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-stone-900 font-serif">
                Registrar Llegada de Materia Prima
              </h4>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaterialOrder} className="py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">Proveedor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">Teléfono WhatsApp del Proveedor</label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="+52 55 ..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">Material o Insumo</label>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Cantidad</label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Costo Total ($ MXN)</label>
                  <input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-rose-600 focus:border-rose-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">Fecha Esperada de Llegada</label>
                <input
                  type="text"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  placeholder="Ej: Lunes 29 Sept"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Guardar en Calendario de Insumos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
