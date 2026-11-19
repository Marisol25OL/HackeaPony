import React, { useState, useRef } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingDown,
  Layers,
  Search,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Mic,
  MicOff,
  Zap,
  Check,
  TrendingUp
} from 'lucide-react';
import { type InventoryItem, db } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  items: InventoryItem[];
  onOpenRestockGroup: (materialName: string) => void;
  onRefreshData: () => void;
  onGoToSuppliers?: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const InventoryTable: React.FC<Props> = ({
  items,
  onOpenRestockGroup,
  onRefreshData,
  onGoToSuppliers,
  onOpenVoiceAssistant
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Natural language auto-stock state
  const [voiceQuery, setVoiceQuery] = useState('');
  const [isListeningLocal, setIsListeningLocal] = useState(false);
  const [autoFeedback, setAutoFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const criticalCount = items.filter((i) => i.status === 'critical').length;
  const reorderSoonCount = items.filter((i) => i.status === 'reorder_soon').length;

  // DEDUCT STOCK AUTOMATICALLY (Venta / Salida)
  const handleQuickDeductStock = async (item: InventoryItem, amountToDeduct: number) => {
    const prevStock = item.stockGramsOrUnits;
    const newStock = Math.max(0, prevStock - amountToDeduct);
    const todayStr = new Date().toISOString().split('T')[0];

    let newStatus: InventoryItem['status'] = 'sufficient';
    if (newStock < item.minStockAlert) {
      newStatus = 'critical';
    } else if (newStock < item.minStockAlert * 1.5) {
      newStatus = 'reorder_soon';
    }

    await db.inventory.update(item.id, {
      stockGramsOrUnits: newStock,
      status: newStatus,
      lastUpdated: todayStr
    });

    // Also register sale in transactions automatically
    const saleValue = amountToDeduct * (item.retailPrice || item.unitCost * 2);
    await db.transactions.add({
      type: 'sale',
      category: 'Venta Producto 3D',
      description: `Salida automática de stock: ${amountToDeduct} ${item.unit} de ${item.name}`,
      amount: saleValue,
      date: todayStr,
      synced: true,
      itemsCount: amountToDeduct,
      paymentMethod: 'Efectivo / Contraentrega',
      notes: `Cálculo automático: de ${prevStock} a ${newStock} ${item.unit}.`
    });

    confetti({
      particleCount: 45,
      spread: 55,
      origin: { y: 0.8 },
      colors: ['#D94680', '#582C7B', '#10B981']
    });

    setAutoFeedback(
      `⚡ Cálculo automático: Tenías ${prevStock} ${item.unit} ➔ Ahora te quedan ${newStock} ${item.unit} (-${amountToDeduct} pzs descontadas y registradas en ventas).`
    );
    setTimeout(() => setAutoFeedback(null), 4500);

    onRefreshData();
  };

  // ADD STOCK AUTOMATICALLY (Entrada / Puse más)
  const handleQuickAddStock = async (item: InventoryItem, amountToAdd: number) => {
    const prevStock = item.stockGramsOrUnits;
    const newStock = prevStock + amountToAdd;
    const todayStr = new Date().toISOString().split('T')[0];

    let newStatus: InventoryItem['status'] = 'sufficient';
    if (newStock < item.minStockAlert) {
      newStatus = 'critical';
    } else if (newStock < item.minStockAlert * 1.5) {
      newStatus = 'reorder_soon';
    }

    await db.inventory.update(item.id, {
      stockGramsOrUnits: newStock,
      status: newStatus,
      lastUpdated: todayStr
    });

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#10B981', '#582C7B', '#D94680']
    });

    setAutoFeedback(
      `⚡ Cálculo automático: Tenías ${prevStock} ${item.unit} ➔ Ahora tienes ${newStock} ${item.unit} (+${amountToAdd} pzs sumadas al stock).`
    );
    setTimeout(() => setAutoFeedback(null), 4500);

    onRefreshData();
  };

  // LOCAL SPEECH RECOGNITION OR TEXT PARSER FOR STOCK
  const handleProcessNaturalStockText = async (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();

    // 1. Detect Action (Venta vs Entrada)
    let isRestock = false;
    const restockKeywords = ['puse', 'agregue', 'agregué', 'sume', 'sumé', 'anadi', 'añadí', 'llegaron', 'compre', 'compré', 'resurti', 'resurtí', 'meti', 'metí'];
    if (restockKeywords.some((k) => lower.includes(k))) {
      isRestock = true;
    }

    // 2. Detect Quantity
    let qty = 1;
    const numberWords: Record<string, number> = {
      'un': 1, 'una': 1, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
      'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
      'once': 11, 'doce': 12, 'quince': 15, 'veinte': 20, 'veinticinco': 25, 'treinta': 30, 'cincuenta': 50
    };
    for (const [w, val] of Object.entries(numberWords)) {
      const reg = new RegExp(`\\b${w}\\b`, 'i');
      if (reg.test(lower)) {
        qty = val;
        break;
      }
    }
    const digitMatch = lower.match(/(\d+)/);
    if (digitMatch && digitMatch[1]) {
      qty = parseInt(digitMatch[1], 10);
    }

    // 3. Find matching inventory item
    let target = items[0];
    let maxScore = 0;
    for (const it of items) {
      let score = 0;
      const iName = it.name.toLowerCase();
      if (lower.includes('filamento') && iName.includes('filamento')) score += 10;
      if (lower.includes('resina') && iName.includes('resina')) score += 10;
      if (lower.includes('caja') && iName.includes('caja')) score += 10;
      if (lower.includes('maceta') && iName.includes('maceta')) score += 10;
      if (lower.includes('llavero') && iName.includes('llavero')) score += 10;
      if (lower.includes('drag') && iName.includes('drag')) score += 10;

      const words = iName.split(/\s+/);
      for (const w of words) {
        if (w.length > 3 && lower.includes(w)) score += 3;
      }

      if (score > maxScore) {
        maxScore = score;
        target = it;
      }
    }

    if (!target) return;

    if (isRestock) {
      await handleQuickAddStock(target, qty);
    } else {
      await handleQuickDeductStock(target, qty);
    }

    setVoiceQuery('');
  };

  const handleStartLocalSpeech = () => {
    if (onOpenVoiceAssistant) {
      onOpenVoiceAssistant();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAutoFeedback('⚠️ Tu navegador no soporta reconocimiento de voz. Escribe tu frase en la barra.');
      setTimeout(() => setAutoFeedback(null), 4000);
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.abort();
      const rec = new SpeechRecognition();
      rec.lang = 'es-MX';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => setIsListeningLocal(true);
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setVoiceQuery(transcript);
        if (e.results[0].isFinal) {
          setIsListeningLocal(false);
          handleProcessNaturalStockText(transcript);
        }
      };
      rec.onerror = (err: any) => {
        setIsListeningLocal(false);
        if (err.error === 'not-allowed') {
          setAutoFeedback('⚠️ Permiso de micrófono bloqueado en tu navegador.');
        } else {
          setAutoFeedback('👂 No se detectó audio del micrófono.');
        }
        setTimeout(() => setAutoFeedback(null), 4000);
      };
      rec.onend = () => setIsListeningLocal(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsListeningLocal(false);
    }
  };

  const handleAddDirectToCart = async (item: InventoryItem, qty: number = 1) => {
    await db.cartItems.add({
      id: `cart-inv-${Date.now()}`,
      supplierId: 'supp-morelia-1',
      supplierName: '3D PRINT3D / Color Plus 3D',
      supplierPhone: '443 241 7613',
      materialName: item.name,
      category: item.category === 'Resinas' ? 'Resina UV' : 'Filamento PLA',
      unitPrice: item.unitCost,
      quantity: qty,
      unit: item.unit === 'g' ? 'carrete (1kg)' : 'unidad',
      colorHex: item.colorHex
    });

    confetti({
      particleCount: 45,
      spread: 55,
      colors: ['#D94680', '#582C7B']
    });

    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Alert Banner */}
      {(criticalCount > 0 || reorderSoonCount > 0) && (
        <div className="bg-gradient-to-r from-purple-50 via-rose-50 to-amber-50 p-4 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#582C7B] to-[#D94680] text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                Alerta de Reabastecimiento de Insumos y Materiales
              </h4>
              <p className="text-xs text-stone-600">
                Tienes <strong className="text-rose-600 font-bold">{criticalCount} material en desabasto crítico (&lt; 14 días)</strong> y <strong className="text-amber-700 font-bold">{reorderSoonCount} por comprar pronto</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {onGoToSuppliers && (
              <button
                onClick={onGoToSuppliers}
                className="px-3.5 py-2 rounded-xl bg-[#582C7B] hover:bg-[#D94680] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Pedir a Proveedor Local</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auto-Calculation Feedback Toast */}
      {autoFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{autoFeedback}</span>
        </div>
      )}

      {/* Natural Language / Voice Quick Action Bar */}
      <div className="bg-zinc-900 text-white p-3.5 sm:p-4 rounded-xl shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold">
              Movimientos Rápidos de Stock por Voz o Texto (Cálculo Automático)
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Di o escribe: "vendí dos piezas de esto" o "puse más piezas de esto"
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessNaturalStockText(voiceQuery);
              }}
              placeholder='Ej. "vendí dos piezas de esto" o "puse 10 más de cajas"...'
              className="w-full pl-3 pr-9 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={handleStartLocalSpeech}
              className={`absolute right-1.5 top-1.5 p-1 rounded-md transition cursor-pointer ${
                isListeningLocal
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Dictar por voz"
            >
              {isListeningLocal ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => handleProcessNaturalStockText(voiceQuery)}
            disabled={!voiceQuery.trim()}
            className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shrink-0"
          >
            Aplicar al Stock
          </button>
        </div>

        {/* 1-Click Quick Voice Simulation Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-zinc-400 font-semibold">Órdenes rápidas:</span>
          {[
            { label: '🗣️ "Vendí 2 piezas"', text: 'vendí dos piezas de esto' },
            { label: '🗣️ "Puse más piezas"', text: 'puse más piezas de esto' },
            { label: '🗣️ "Vendí 1 de esto"', text: 'vendí una pieza de esto' },
            { label: '🗣️ "Llegaron 5 cajas"', text: 'llegaron 5 piezas de cajas' }
          ].map((ch, idx) => (
            <button
              key={idx}
              onClick={() => {
                setVoiceQuery(ch.text);
                handleProcessNaturalStockText(ch.text);
              }}
              className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer font-medium"
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
        
        {/* Search & Categories */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar insumo, material, empaque..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'Filamentos', label: 'Filamentos (PLA/PETG)' },
              { id: 'Resinas', label: 'Resinas UV' },
              { id: 'Piezas Terminadas', label: 'Piezas Impresas 3D' },
              { id: 'Empaques y Accesorios', label: 'Cajas y Empaques' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* Legend for Pedagogy */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 py-1">
          <span className="font-semibold text-zinc-700">Semáforo de Inventario:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Suficiente
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Comprar pronto
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Riesgo desabasto a 14 días
          </span>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-3">Material o Insumo</th>
                <th className="py-3 px-3">Marca / Proveedor</th>
                <th className="py-3 px-3">En Taller</th>
                <th className="py-3 px-3">Costo Unit.</th>
                <th className="py-3 px-3">Alerta de Stock</th>
                <th className="py-3 px-3 text-right">Ajuste Automático</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredItems.map((item) => {
                let badgeStyle = '';
                let badgeText = '';

                if (item.status === 'sufficient') {
                  badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  badgeText = 'Suficiente';
                } else if (item.status === 'reorder_soon') {
                  badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                  badgeText = 'Comprar pronto';
                } else {
                  badgeStyle = 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs';
                  badgeText = 'Riesgo a 14 días';
                }

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/60 transition">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-lg border border-zinc-200 shadow-2xs shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                          title={`Color: ${item.color}`}
                        />
                        <div>
                          <div className="font-bold text-zinc-900">{item.name}</div>
                          <div className="text-[10px] text-zinc-400">{item.category} • {item.color}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-medium text-zinc-600">
                      {item.brand}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-black text-zinc-900 font-serif text-sm">
                        {item.stockGramsOrUnits}
                      </span>
                      <span className="text-[11px] text-zinc-500 ml-1">
                        {item.unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-zinc-600">
                      ${item.unitCost} MXN
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border ${badgeStyle}`}>
                        {badgeText}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        
                        {/* Quick Deduct (Vendí) Buttons with auto calculation */}
                        <div className="flex items-center gap-0.5 bg-rose-50 p-1 rounded-lg border border-rose-200">
                          <span className="text-[10px] font-bold text-rose-800 px-1">Vendí:</span>
                          <button
                            onClick={() => handleQuickDeductStock(item, 1)}
                            className="px-1.5 py-0.5 rounded bg-white text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300 font-bold text-[10px] transition cursor-pointer"
                            title="Restar 1 pieza y registrar venta"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleQuickDeductStock(item, 2)}
                            className="px-1.5 py-0.5 rounded bg-white text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300 font-bold text-[10px] transition cursor-pointer"
                            title="Restar 2 piezas y registrar venta"
                          >
                            -2
                          </button>
                        </div>

                        {/* Quick Add (Puse) Buttons with auto calculation */}
                        <div className="flex items-center gap-0.5 bg-emerald-50 p-1 rounded-lg border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-800 px-1">Puse:</span>
                          <button
                            onClick={() => handleQuickAddStock(item, 1)}
                            className="px-1.5 py-0.5 rounded bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 font-bold text-[10px] transition cursor-pointer"
                            title="Sumar 1 pieza al stock"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleQuickAddStock(item, item.unit === 'g' ? 1000 : 5)}
                            className="px-1.5 py-0.5 rounded bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 font-bold text-[10px] transition cursor-pointer"
                            title={item.unit === 'g' ? 'Sumar 1kg' : 'Sumar 5 piezas'}
                          >
                            {item.unit === 'g' ? '+1kg' : '+5'}
                          </button>
                        </div>

                        {/* Quick Add to Cart button */}
                        <button
                          onClick={() => handleAddDirectToCart(item, 1)}
                          className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                          title="Añadir al carrito de insumos locales"
                        >
                          <ShoppingBag className="w-3 h-3 text-purple-700" />
                          <span>Pedir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
