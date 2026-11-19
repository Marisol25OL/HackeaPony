import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  MessageCircle,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Banknote,
  CreditCard,
  Building,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Leaf,
  Recycle,
  Award,
  X
} from 'lucide-react';
import { type LocalSupplier, type CartItem, db, type InventoryItem } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  suppliers: LocalSupplier[];
  cartItems: CartItem[];
  onRefreshData: () => void;
}

export const MoreliaSuppliersAndCart: React.FC<Props> = ({
  suppliers,
  cartItems,
  onRefreshData
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'spei' | 'card'>('cash');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'local_delivery'>('pickup');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<any>(null);

  // Credit / Debit Card state
  const [cardNumber, setCardNumber] = useState('4152 3190 2841 8421');
  const [cardHolder, setCardHolder] = useState('MARÍA FERNANDA SÁNCHEZ');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('384');
  const [saveCard, setSaveCard] = useState(true);

  // New Supplier Modal State
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppBrand, setNewSuppBrand] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('443 103 8730');
  const [newSuppAddress, setNewSuppAddress] = useState('Morelia, Michoacán');
  const [newSuppDelivery, setNewSuppDelivery] = useState('Entrega express local en Morelia');
  const [newSuppIsSustainable, setNewSuppIsSustainable] = useState(true);

  // Cart calculations
  const cartTotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Add catalog item to cart
  const handleAddToCart = async (supplier: LocalSupplier, product: any, initialQty: number = 1) => {
    const existing = await db.cartItems.get(product.id);
    if (existing) {
      await db.cartItems.update(product.id, {
        quantity: existing.quantity + initialQty
      });
    } else {
      await db.cartItems.add({
        id: product.id,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierPhone: supplier.phone,
        materialName: product.name,
        category: product.category,
        unitPrice: product.price,
        quantity: initialQty,
        unit: 'carrete(s)',
        colorHex: product.colorHex
      });
    }

    confetti({
      particleCount: 35,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#D94680', '#582C7B', '#5C9450']
    });

    onRefreshData();
  };

  // Modify quantity inside cart
  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      await db.cartItems.delete(itemId);
    } else {
      await db.cartItems.update(itemId, { quantity: newQty });
    }
    onRefreshData();
  };

  // Remove from cart
  const handleRemoveItem = async (itemId: string) => {
    await db.cartItems.delete(itemId);
    onRefreshData();
  };

  // Clear entire cart
  const handleClearCart = async () => {
    await db.cartItems.clear();
    onRefreshData();
  };

  // Checkout with Cash / SPEI / Card
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsProcessingPayment(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const receiptFolio = `PAGO-MORELIA-${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(async () => {
      // 1. Automatically update Inventory stock
      for (const item of cartItems) {
        const gramsToAdd = item.quantity * 1000; // 1kg spools
        const existingInv = await db.inventory
          .filter((inv) => inv.name.toLowerCase().includes(item.materialName.toLowerCase().slice(0, 15)))
          .first();

        if (existingInv) {
          const newGrams = existingInv.stockGramsOrUnits + gramsToAdd;
          await db.inventory.update(existingInv.id, {
            stockGramsOrUnits: newGrams,
            status: newGrams > existingInv.minStockAlert ? 'sufficient' : 'reorder_soon',
            lastUpdated: todayStr
          });
        } else {
          // Create new stock entry in inventory
          await db.inventory.add({
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: item.materialName,
            category: item.category.includes('PETG') || item.category.includes('PLA') ? 'Filamentos' : 'Resinas',
            color: 'Insumo Morelia',
            colorHex: item.colorHex || '#1C1917',
            brand: item.supplierName,
            stockGramsOrUnits: gramsToAdd,
            unit: 'g',
            minStockAlert: 350,
            unitCost: item.unitPrice,
            status: 'sufficient',
            lastUpdated: todayStr
          });
        }
      }

      // 2. Register Expense in Cuentas Claras
      const cleanDigits = cardNumber.replace(/\D/g, '');
      const maskedCard = cleanDigits.length >= 4 ? `•••• ${cleanDigits.slice(-4)}` : '•••• 4242';
      const paymentMethodLabel =
        paymentMethod === 'cash'
          ? 'Efectivo / Contraentrega'
          : paymentMethod === 'card'
          ? `Tarjeta (${maskedCard})`
          : 'Transferencia SPEI';

      await db.transactions.add({
        type: 'expense',
        category: 'Filamento PLA/PETG',
        description: `Compra en ${cartItems[0]?.supplierName || 'Proveedor Morelia'}: ${cartItems.map((c) => `${c.quantity}x ${c.materialName}`).join(', ')}`,
        amount: cartTotal,
        date: todayStr,
        synced: true,
        customerOrSupplier: cartItems[0]?.supplierName,
        paymentMethod: paymentMethod === 'cash' ? 'Efectivo / Contraentrega' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia SPEI',
        itemsCount: totalItemsCount
      });

      // 3. Add to Supplier Material Orders
      await db.materialOrders.add({
        id: `MAT-${Math.floor(400 + Math.random() * 500)}`,
        supplierName: cartItems[0]?.supplierName || '3D PRINT3D Morelia',
        supplierPhone: cartItems[0]?.supplierPhone || '443 241 7613',
        materialName: cartItems.map((c) => `${c.quantity}x ${c.materialName}`).join(' + '),
        quantity: `${totalItemsCount} carretes / unidades`,
        totalCost: cartTotal,
        status: deliveryType === 'pickup' ? 'delivered' : 'shipped',
        orderDate: todayStr,
        estimatedArrivalDate: deliveryType === 'pickup' ? 'Listo para recoger en tienda Félix Ireta' : 'Hoy mismo por repartidor local',
        trackingNumber: receiptFolio,
        paymentMethod: paymentMethod === 'cash' ? 'Efectivo / Contraentrega' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia SPEI',
        cardLast4: paymentMethod === 'card' ? (cleanDigits.slice(-4) || '4242') : undefined,
        cardHolder: paymentMethod === 'card' ? (cardHolder || 'Vendedora MiFyMEs') : undefined
      });

      // 4. Set receipt and empty cart
      setPaymentSuccessReceipt({
        folio: receiptFolio,
        total: cartTotal,
        itemsCount: totalItemsCount,
        paymentMethod: paymentMethodLabel,
        cardHolder: paymentMethod === 'card' ? cardHolder : undefined,
        supplier: cartItems[0]?.supplierName,
        deliveryType: deliveryType === 'pickup' ? 'Retiro en Sucursal (Yunuen 131, Félix Ireta, Morelia)' : 'Entrega a domicilio en Morelia'
      });

      await db.cartItems.clear();
      setIsProcessingPayment(false);

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#582C7B', '#D94680']
      });

      onRefreshData();
    }, 800);
  };

  const handleWhatsAppSupplier = (supplier: LocalSupplier, message?: string) => {
    const text = message || `Hola ${supplier.name}! Te escribo desde la app MiFyMEs. Quisiera consultar existencias de filamento PETG y PLA para entrega en Morelia.`;
    window.open(`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName.trim() || !newSuppPhone.trim()) return;

    const cleanPhone = newSuppPhone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    const id = `supp-custom-${Date.now()}`;

    await db.localSuppliers.add({
      id,
      name: newSuppName.trim(),
      brandTitle: newSuppBrand.trim() || 'Distribuidor de Insumos y Filamento 3D en Morelia',
      address: newSuppAddress.trim() || 'Morelia, Michoacán',
      neighborhood: 'Morelia Centro / Alrededores',
      city: 'Morelia',
      state: 'Michoacán',
      phone: cleanPhone,
      whatsapp: digitsOnly.startsWith('52') ? `+${digitsOnly}` : `+52${digitsOnly}`,
      deliverySpeed: newSuppDelivery.trim() || 'Entrega express local en Morelia o retiro',
      acceptsCash: true,
      acceptsSpei: true,
      rating: 5.0,
      isSustainable: newSuppIsSustainable,
      verificationStatus: 'verified',
      registeredDate: new Date().toISOString().split('T')[0],
      sustainabilityBadge: newSuppIsSustainable ? {
        title: 'Insignia Verde de Sustentabilidad: Compromiso Eco Morelia',
        description: 'Distribuidor comprometido con prácticas amigables con el medio ambiente y reciclaje en Morelia.',
        materialSource: 'Materiales Reciclables / Biodegradables',
        ecoScore: 95
      } : undefined,
      catalog: [
        {
          id: `prod-supp-${Date.now()}-1`,
          name: 'Filamento PLA+ Alta Velocidad 1kg',
          material: 'PLA+ Alta Velocidad',
          price: 340,
          stock: 25,
          colorHex: '#38BDF8',
          description: 'Filamento de alta fluidez para impresiones rápidas y acabados definidos.',
          category: 'Filamento PLA'
        },
        {
          id: `prod-supp-${Date.now()}-2`,
          name: 'Filamento PETG Ecológico Reciclado 1kg',
          material: 'PETG Reciclado',
          price: 330,
          stock: 20,
          colorHex: '#10B981',
          description: 'Resistente a la intemperie y de alto impacto, apto para exteriores.',
          category: 'Filamento PETG',
          isRecycledPet: true
        }
      ]
    });

    setIsAddSupplierModalOpen(false);
    setNewSuppName('');
    setNewSuppBrand('');
    setNewSuppPhone('443 103 8730');
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#582C7B] via-[#D94680] to-amber-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold tracking-wide uppercase">
              Red de Proveedores Locales Michoacán
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-serif mt-2 tracking-tight">
              Proveedores de Impresión 3D en Morelia
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 max-w-2xl mt-1 leading-relaxed">
              Consigue carretes de <strong>PETG</strong>, <strong>PLA</strong> y resinas sin esperar envíos largos de paquetería nacional. Compra localmente con retiro en tienda o entrega rápida el mismo día.
            </p>
          </div>

          {/* Quick Cart Counter & Register Supplier Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddSupplierModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>+ Registrar Proveedor</span>
            </button>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#582C7B] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5 text-[#D94680]" />
              </div>
              <div>
                <span className="text-[11px] text-purple-200 block">Mi Carrito de Insumos</span>
                <strong className="text-base font-serif">${cartTotal.toLocaleString('es-MX')} MXN</strong>
                <span className="text-[10px] text-purple-100 ml-1">({totalItemsCount} insumos)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Suppliers Catalog on Left (8 cols) & Shopping Cart on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Local Suppliers & Their Catalogs */}
        <div className="lg:col-span-8 space-y-6">
          
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-5"
            >
              {/* Supplier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100/70">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#582C7B] border border-purple-200 flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6 text-[#582C7B]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-stone-900 font-serif">
                        {supplier.name}
                      </h3>
                      {/* Verificado en color verde */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ★ {supplier.rating} Verificado
                      </span>

                      {/* Insignia por Sustentabilidad (Filamento con botellas de PET) */}
                      {supplier.isSustainable && (
                        <span className="px-2.5 py-1 rounded-sm text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs flex items-center gap-1.5 font-impact uppercase tracking-wider">
                          <Leaf className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Insignia de Sustentabilidad • Botellas PET</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#D94680] font-semibold mt-0.5">
                      {supplier.brandTitle}
                    </p>

                    {/* Extended description of PET recycling if sustainable */}
                    {supplier.sustainabilityBadge && (
                      <div className="mt-2 p-2.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2 shadow-2xs">
                        <Recycle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-snug">
                          <strong className="block text-emerald-900 font-impact uppercase tracking-wide">
                            {supplier.sustainabilityBadge.title}
                          </strong>
                          <p className="text-emerald-800 mt-0.5">
                            {supplier.sustainabilityBadge.description}
                          </p>
                          <span className="inline-block mt-1 font-bold text-emerald-900 bg-white/80 px-2 py-0.5 rounded-2xs border border-emerald-300">
                            ♻️ Materia prima: {supplier.sustainabilityBadge.materialSource}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {supplier.address}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {supplier.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp button */}
                <button
                  onClick={() => handleWhatsAppSupplier(supplier)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp al Proveedor</span>
                </button>
              </div>

              {/* Delivery & Payment Badges */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                <span className="font-bold text-purple-900">Modalidades:</span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200">
                  ⚡ {supplier.deliverySpeed}
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1 text-emerald-700 font-semibold">
                  <Banknote className="w-3 h-3" /> Acepta Efectivo contraentrega
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-stone-700 font-semibold">
                  💳 Transferencia SPEI
                </span>
              </div>

              {/* Supplier's Catalog Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#D94680]" />
                  Materiales Disponibles para Entrega en Morelia
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {supplier.catalog.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/20 hover:bg-purple-50/50 hover:border-purple-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-stone-300 shrink-0"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <div>
                              <h5 className="text-xs font-bold text-stone-900 leading-snug">
                                {item.name}
                              </h5>
                              {item.isRecycledPet && (
                                <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-2xs">
                                  <Recycle className="w-2.5 h-2.5" />
                                  100% Botellas PET Recicladas
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-black text-[#582C7B] font-serif shrink-0">
                            ${item.price} MXN
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-purple-100 flex items-center justify-between">
                        <span className="text-[10px] text-stone-500 font-semibold">
                          {item.stock} unidades en Morelia
                        </span>

                        <button
                          onClick={() => handleAddToCart(supplier, item, 1)}
                          className="px-3 py-1.5 rounded-xl bg-[#582C7B] hover:bg-[#D94680] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar al Carrito</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}

        </div>

        {/* Right Column: Interactive Shopping Cart (Carrito de Insumos) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-4 sticky top-36">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#582C7B] flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4 text-[#D94680]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    Carrito de Insumos
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    {totalItemsCount} insumos seleccionados
                  </span>
                </div>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-[11px] text-stone-400 hover:text-rose-600 transition cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart Items List with Quantity Modifier */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-xs font-semibold text-stone-600">
                    Tu carrito de insumos está vacío
                  </p>
                  <p className="text-[11px] text-stone-400 px-4">
                    Selecciona filamento PETG, PLA o resina de los proveedores de Morelia para agregarlos aquí.
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-stone-900 leading-snug">
                          {item.materialName}
                        </h5>
                        <span className="text-[10px] text-stone-500">
                          {item.supplierName} • ${item.unitPrice} c/u
                        </span>
                      </div>
                      <span className="text-xs font-black font-serif text-[#582C7B]">
                        ${item.unitPrice * item.quantity} MXN
                      </span>
                    </div>

                    {/* Quantity modifier controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/50">
                      <span className="text-[10px] font-semibold text-stone-600">
                        Cantidad a comprar:
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-300 text-stone-700 flex items-center justify-center font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQty(item.id, parseInt(e.target.value, 10) || 1)}
                          className="w-10 text-center font-black text-xs bg-white border border-stone-300 rounded-md py-0.5 focus:outline-none focus:border-purple-400"
                        />

                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-300 text-stone-700 flex items-center justify-center font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center ml-1 hover:bg-rose-100 transition cursor-pointer"
                          title="Quitar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total and Checkout Section */}
            {cartItems.length > 0 && (
              <div className="pt-3 border-t border-purple-100 space-y-3">
                
                {/* Delivery Option */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Método de Entrega en Morelia
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer text-center ${
                        deliveryType === 'pickup'
                          ? 'bg-[#582C7B] text-white border-[#582C7B]'
                          : 'bg-stone-50 text-stone-600 border-stone-200'
                      }`}
                    >
                      Retiro en Sucursal (Félix Ireta)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('local_delivery')}
                      className={`p-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer text-center ${
                        deliveryType === 'local_delivery'
                          ? 'bg-[#582C7B] text-white border-[#582C7B]'
                          : 'bg-stone-50 text-stone-600 border-stone-200'
                      }`}
                    >
                      Envío Local Mismo Día
                    </button>
                  </div>
                </div>

                {/* Payment Option (Efectivo destacado) */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('spei')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                        paymentMethod === 'spei'
                          ? 'bg-[#582C7B] text-white border-[#582C7B] shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      <span>SPEI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                        paymentMethod === 'card'
                          ? 'bg-[#582C7B] text-white border-[#582C7B] shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjeta</span>
                    </button>
                  </div>

                  {/* Payment Method Details & Card Input Fields */}
                  {paymentMethod === 'card' && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#582C7B] flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-[#D94680]" />
                          Datos de tu Tarjeta de Débito / Crédito
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                          🔒 Pago Seguro
                        </span>
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-0.5">
                          Número de Tarjeta (16 dígitos)
                        </label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            // Format with spaces
                            const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                            setCardNumber(val);
                          }}
                          placeholder="4152 0000 0000 0000"
                          className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs font-mono text-stone-800 focus:outline-none focus:border-[#D94680]"
                        />
                      </div>

                      {/* Cardholder Name */}
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-0.5">
                          Nombre de la Titular (como aparece en el plástico)
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NOMBRE COMPLETO"
                          className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs text-stone-800 focus:outline-none focus:border-[#D94680]"
                        />
                      </div>

                      {/* Expiry & CVV */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 block mb-0.5">
                            Vencimiento (MM/AA)
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="08/28"
                            className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs font-mono text-center text-stone-800 focus:outline-none focus:border-[#D94680]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-stone-600 block mb-0.5">
                            CVV (Seguridad)
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs font-mono text-center text-stone-800 focus:outline-none focus:border-[#D94680]"
                          />
                        </div>
                      </div>

                      {/* Remember card toggle */}
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="w-3.5 h-3.5 text-[#582C7B] rounded accent-[#582C7B]"
                        />
                        <span className="text-[10px] text-stone-600 font-medium">
                          Guardar tarjeta de forma segura para compras rápidas de filamento
                        </span>
                      </label>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Pagas en efectivo al retirar en tienda (Yunuen 131, Félix Ireta) o al recibir en tu taller.
                      </span>
                    </div>
                  )}

                  {paymentMethod === 'spei' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900 space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <Building className="w-3.5 h-3.5 text-[#582C7B]" />
                        <span>CLABE Interbancaria Proveedor Morelia:</span>
                      </div>
                      <p className="font-mono font-bold text-xs text-stone-800 bg-white p-1 rounded border border-purple-200 text-center">
                        012 470 00123456789 1 (BBVA)
                      </p>
                    </div>
                  )}
                </div>

                {/* Subtotal breakdown */}
                <div className="space-y-1 text-xs text-stone-600 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal de materiales:</span>
                    <span>${cartTotal} MXN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costo de entrega:</span>
                    <span className="text-emerald-700 font-semibold">
                      {deliveryType === 'pickup' ? '$0 MXN (Gratis retiro)' : '$45 MXN (Local)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-stone-900 font-serif pt-1 border-t border-stone-200">
                    <span>Total a Pagar:</span>
                    <span className="text-[#D94680]">
                      ${deliveryType === 'pickup' ? cartTotal : cartTotal + 45} MXN
                    </span>
                  </div>
                </div>

                {/* Payment button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessingPayment}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Procesando pago...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pagar en {paymentMethod === 'cash' ? 'Efectivo' : paymentMethod.toUpperCase()} (${deliveryType === 'pickup' ? cartTotal : cartTotal + 45} MXN)</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-stone-400 text-center leading-tight">
                  Al pagar, se actualiza automáticamente tu inventario disponible en gramos y se registra el gasto en tus cuentas.
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Payment Success Receipt Modal */}
      {paymentSuccessReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-stone-900 font-serif">
              ¡Compra de Insumos Confirmada!
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed px-2">
              Se ha registrado tu compra con éxito. Tus gramos de filamento ya fueron agregados a tu inventario activo.
            </p>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Folio:</span>
                <span className="font-mono font-bold text-stone-800">{paymentSuccessReceipt.folio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Proveedor:</span>
                <span className="font-semibold text-stone-800">{paymentSuccessReceipt.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Método de Pago:</span>
                <span className="font-bold text-emerald-700">{paymentSuccessReceipt.paymentMethod}</span>
              </div>
              {paymentSuccessReceipt.cardHolder && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Titular Tarjeta:</span>
                  <span className="text-stone-800 font-semibold">{paymentSuccessReceipt.cardHolder}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Modalidad:</span>
                <span className="text-stone-800 font-medium">{paymentSuccessReceipt.deliveryType}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold">
                <span>Total Pagado:</span>
                <span className="text-[#D94680] font-serif">${paymentSuccessReceipt.total} MXN</span>
              </div>
            </div>

            {/* Invoicing Clarification Note */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-left text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">ℹ️ Comprobante de Compra de Insumos:</span>
              Este recibo acredita el gasto deducible de tu materia prima. La expedición de <strong>facturas SAT CFDI 4.0</strong> está reservada para cuando tú como vendedora le cobres a tus clientes por sus piezas 3D terminadas.
            </div>

            <button
              onClick={() => setPaymentSuccessReceipt(null)}
              className="w-full py-2.5 rounded-2xl bg-[#582C7B] hover:bg-purple-900 text-white text-xs font-bold transition cursor-pointer"
            >
              Listo, ver mi inventario actualizado
            </button>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nuevo Proveedor */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-purple-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#582C7B] flex items-center justify-center">
                  <Building className="w-5 h-5 text-[#582C7B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Registrar Nuevo Proveedor
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Añade un contacto directo para surtir filamentos y refacciones en Morelia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddSupplierModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre del Proveedor / Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  placeholder="Ej. Tecno3D Morelia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#582C7B]/30 focus:border-[#582C7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Giro / Especialidad
                </label>
                <input
                  type="text"
                  value={newSuppBrand}
                  onChange={(e) => setNewSuppBrand(e.target.value)}
                  placeholder="Ej. Distribuidor de Filamentos de Alta Velocidad y Refacciones 3D"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#582C7B]/30 focus:border-[#582C7B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Número de Contacto / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSuppPhone}
                    onChange={(e) => setNewSuppPhone(e.target.value)}
                    placeholder="443 103 8730"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#582C7B]/30 focus:border-[#582C7B] font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tiempo de Entrega
                  </label>
                  <input
                    type="text"
                    value={newSuppDelivery}
                    onChange={(e) => setNewSuppDelivery(e.target.value)}
                    placeholder="Ej. Entrega express local en Morelia"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#582C7B]/30 focus:border-[#582C7B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Dirección o Zona en Morelia
                </label>
                <input
                  type="text"
                  value={newSuppAddress}
                  onChange={(e) => setNewSuppAddress(e.target.value)}
                  placeholder="Ej. Calzada Ventura Puente #920, Col. Cuauhtémoc, Morelia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#582C7B]/30 focus:border-[#582C7B]"
                />
              </div>

              {/* Sustainability Badge Toggle */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4 text-emerald-100" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      Insignia Verde de Sustentabilidad
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      ¿Maneja carretes biodegradables o reciclaje de PET?
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newSuppIsSustainable}
                  onChange={(e) => setNewSuppIsSustainable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#582C7B] hover:bg-purple-900 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Proveedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
