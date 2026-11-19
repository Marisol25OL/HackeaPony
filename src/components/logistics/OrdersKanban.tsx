import React, { useState } from 'react';
import {
  Printer,
  PackageCheck,
  Truck,
  CheckCircle,
  MessageCircle,
  Clock,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  Plus,
  Box,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { type CustomerOrder, type InventoryItem, db } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  orders: CustomerOrder[];
  inventory: InventoryItem[];
  onRefreshOrders: () => void;
  onAddToCart?: (materialName: string, quantity: number) => void;
}

export const OrdersKanban: React.FC<Props> = ({
  orders,
  inventory,
  onRefreshOrders,
  onAddToCart
}) => {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemsDescription, setItemsDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('350');
  const [depositAmount, setDepositAmount] = useState('200');
  const [deliveryLocation, setDeliveryLocation] = useState('Centro Histórico Morelia (Catedral)');
  const [requiredMaterial, setRequiredMaterial] = useState('Filamento PLA+ Rosa Pastel Seda');
  const [requiredGrams, setRequiredGrams] = useState('120');

  const columns: Array<{
    id: CustomerOrder['status'];
    title: string;
    icon: any;
    color: string;
    badgeBg: string;
    nextStatus?: CustomerOrder['status'];
    nextLabel?: string;
  }> = [
    {
      id: 'preparing',
      title: 'Por Preparar / Imprimir',
      icon: Printer,
      color: 'text-amber-600',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      nextStatus: 'ready_to_ship',
      nextLabel: 'Marcar como Impreso y Listo'
    },
    {
      id: 'ready_to_ship',
      title: 'Listos para Enviar',
      icon: PackageCheck,
      color: 'text-[#D94680]',
      badgeBg: 'bg-rose-100 text-[#D94680] border-rose-200',
      nextStatus: 'on_the_way',
      nextLabel: 'Iniciar Ruta de Entrega'
    },
    {
      id: 'on_the_way',
      title: 'En Camino / En Ruta',
      icon: Truck,
      color: 'text-[#582C7B]',
      badgeBg: 'bg-purple-100 text-[#582C7B] border-purple-200',
      nextStatus: 'delivered',
      nextLabel: 'Marcar como Entregado'
    },
    {
      id: 'delivered',
      title: 'Entregados y Cobrados',
      icon: CheckCircle,
      color: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  const handleAdvanceStatus = async (orderId: string, nextStatus?: CustomerOrder['status']) => {
    if (!nextStatus) return;

    await db.orders.update(orderId, {
      status: nextStatus,
      balancePending: nextStatus === 'delivered' ? 0 : undefined
    });

    if (nextStatus === 'delivered') {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#582C7B', '#D94680']
      });
    }

    onRefreshOrders();
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    const tot = parseFloat(totalAmount) || 0;
    const dep = parseFloat(depositAmount) || 0;

    await db.orders.add({
      id: `PED-${Math.floor(400 + Math.random() * 500)}`,
      customerName,
      customerPhone,
      itemsDescription,
      totalAmount: tot,
      depositAmount: dep,
      balancePending: Math.max(0, tot - dep),
      status: 'preparing',
      deliveryType: 'Punto Rosa Seguro',
      deliveryLocation,
      createdAt: todayStr,
      estimatedDeliveryDate: 'Mañana, 04:00 PM',
      requiredMaterialName: requiredMaterial,
      requiredGrams: parseFloat(requiredGrams) || 80,
      isMaterialAvailable: true
    });

    setShowNewOrderModal(false);
    setCustomerName('');
    setItemsDescription('');
    onRefreshOrders();
  };

  const handleAddMissingToCart = async (order: CustomerOrder) => {
    // Add 1 spool of the required material to cart
    await db.cartItems.add({
      id: `cart-req-${Date.now()}`,
      supplierId: 'supp-morelia-1',
      supplierName: '3D PRINT3D / Color Plus 3D',
      supplierPhone: '443 241 7613',
      materialName: order.requiredMaterialName || 'Carrete Filamento PETG/PLA 1kg',
      category: 'Filamento PLA',
      unitPrice: 350,
      quantity: 1,
      unit: 'carrete',
      colorHex: '#FDA4AF'
    });

    confetti({
      particleCount: 40,
      spread: 50,
      colors: ['#D94680', '#582C7B', '#5C9450']
    });

    onRefreshOrders();
  };

  const handleReportUndelivered = async (order: CustomerOrder) => {
    // If not delivered, increment undelivered count and apply sanction to sellers
    const allUsers = await db.users.where('role').equals('seller').toArray();
    if (allUsers.length > 0) {
      const seller = allUsers[0];
      await db.users.update(seller.id, {
        status: 'sanctioned',
        undeliveredCount: (seller.undeliveredCount || 0) + 1,
        sanctionReason: `Paquete no entregado: Pedido ${order.id} (${order.itemsDescription}) a ${order.customerName}`
      });
    }

    alert(
      `⚠️ Sanción Aplicada: Se ha registrado el reporte de que el pedido ${order.id} no fue entregado a ${order.customerName}. La cuenta del vendedor ha sido sancionada temporalmente por incumplimiento en entregas.`
    );
    onRefreshOrders();
  };

  const handleNotifyWhatsApp = (order: CustomerOrder) => {
    const text = encodeURIComponent(
      `Hola ${order.customerName}! Te escribo de MiFyMEs Impresión 3D. Tu pedido "${order.itemsDescription}" está en preparación para entregarse en: ${order.deliveryLocation}. Te avisamos al salir a ruta.`
    );
    window.open(`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header with New Order Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-stone-900 font-serif">
            Tablero de Entregas & Control de Material Faltante
          </h3>
          <p className="text-xs text-stone-500">
            Monitorea el avance de tus pedidos, qué material tienes en taller y qué te falta comprar para surtir
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#582C7B] to-[#D94680] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Anotar Nuevo Pedido de Clienta</span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className="bg-stone-50/70 rounded-3xl p-4 border border-stone-200/80 flex flex-col space-y-3 min-h-[460px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center ${col.color}`}>
                    <ColIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 leading-tight">
                      {col.title}
                    </h4>
                    <span className="text-[10px] text-stone-400">
                      {colOrders.length} pedidos
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${col.badgeBg}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center p-4">
                    <span className="text-[11px] text-stone-400 font-medium">
                      No hay pedidos en esta etapa
                    </span>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    // Check if stock is sufficient
                    const matInv = inventory.find((i) =>
                      i.name.toLowerCase().includes((order.requiredMaterialName || '').toLowerCase().slice(0, 10))
                    );
                    const hasStock = matInv ? matInv.stockGramsOrUnits >= (order.requiredGrams || 100) : true;

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl p-4 border border-purple-100/90 shadow-2xs hover:shadow-md transition space-y-3"
                      >
                        {/* Order Top Bar */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-stone-400">
                            {order.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#582C7B] border border-purple-100">
                            {order.deliveryType}
                          </span>
                        </div>

                        {/* Customer & Items */}
                        <div>
                          <h5 className="text-xs font-bold text-stone-900 leading-tight">
                            {order.customerName}
                          </h5>
                          <p className="text-[11px] text-[#582C7B] font-semibold mt-0.5">
                            {order.itemsDescription}
                          </p>
                        </div>

                        {/* Location in Morelia or user query */}
                        <div className="flex items-start gap-1.5 text-[10px] text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-100">
                          <MapPin className="w-3 h-3 text-[#D94680] shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight font-medium">
                            {order.deliveryLocation}
                          </span>
                        </div>

                        {/* Material Availability Indicator (Stock vs What is Missing) */}
                        <div className={`p-2 rounded-xl text-[10px] space-y-1 border ${
                          hasStock
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                            : 'bg-amber-50/70 border-amber-300 text-amber-900'
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1">
                              {hasStock ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{hasStock ? 'Material Suficiente' : 'Material Faltante'}</span>
                            </span>
                            <span>{order.requiredGrams || 100}g requeridos</span>
                          </div>

                          <span className="block text-[9px] text-stone-600 truncate">
                            {order.requiredMaterialName || 'PLA / PETG'}
                          </span>

                          {!hasStock && (
                            <button
                              onClick={() => handleAddMissingToCart(order)}
                              className="w-full mt-1 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <ShoppingBag className="w-2.5 h-2.5" />
                              <span>Pedir carrete faltante al carrito</span>
                            </button>
                          )}
                        </div>

                        {/* Amount & Balance Pending */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                          <div>
                            <span className="text-[10px] text-stone-400 block leading-none">Total</span>
                            <span className="font-bold text-stone-900">${order.totalAmount} MXN</span>
                          </div>

                          {order.balancePending > 0 ? (
                            <div className="text-right">
                              <span className="text-[10px] text-amber-600 block leading-none">Resta cobrar</span>
                              <span className="font-bold text-amber-700">${order.balancePending} MXN</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Liquidado ✓
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-1.5 pt-1">
                          {col.nextStatus && (
                            <button
                              onClick={() => handleAdvanceStatus(order.id, col.nextStatus)}
                              className="w-full py-1.5 rounded-xl bg-purple-50 hover:bg-[#582C7B] text-[#582C7B] hover:text-white border border-purple-200 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>{col.nextLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => handleNotifyWhatsApp(order)}
                            className="w-full py-1 rounded-xl text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>Avisar a clienta por WhatsApp</span>
                          </button>

                          {col.id !== 'delivered' && (
                            <button
                              onClick={() => handleReportUndelivered(order)}
                              className="w-full py-1 rounded-xl text-rose-600 hover:bg-rose-50 text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Reportar paquete no entregado y aplicar sanción al vendedor"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>Reportar Paquete No Entregado</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 space-y-4">
            <h3 className="text-base font-bold text-stone-900 font-serif">
              Anotar Nuevo Pedido de Clienta
            </h3>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Nombre de la clienta</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Paola Villagómez"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">WhatsApp / Teléfono</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 443 123 4567"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Pieza(s) solicitadas</label>
                <input
                  type="text"
                  value={itemsDescription}
                  onChange={(e) => setItemsDescription(e.target.value)}
                  placeholder="Ej: 2 Macetas Geométricas Rosa Seda"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Total ($ MXN)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Anticipo recibido ($)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Punto de Entrega en Morelia o Domicilio</label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Ej: Plaza Las Américas Morelia"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#582C7B] hover:bg-[#D94680] text-white text-xs font-bold transition cursor-pointer"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
