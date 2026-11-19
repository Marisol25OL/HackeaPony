import React, { useState } from 'react';
import {
  Calculator,
  Sliders,
  DollarSign,
  TrendingUp,
  Globe,
  Store,
  ShoppingBag,
  ArrowRight,
  Check,
  Package,
  Scale,
  Percent,
  Target,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  Cpu,
  Layers,
  ShoppingBasket,
  Hammer,
  UtensilsCrossed,
  Briefcase,
  Boxes
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../db/indexedDB';

interface Props {
  onApplyPriceToCatalog?: (productName: string, suggestedPrice: number, cost: number) => void;
  onGoToProducts?: () => void;
}

type BusinessPreset = 'elaboracion' | 'reventa' | 'alimentos' | 'servicios' | 'mayoreo';

export const SmartPricingCalculator: React.FC<Props> = ({
  onApplyPriceToCatalog,
  onGoToProducts
}) => {
  const [activeTab, setActiveTab] = useState<'precio_inteligente' | 'algoritmos_universales' | 'canales_venta'>('precio_inteligente');
  
  // Modelo de negocio / Tipo de venta
  const [businessType, setBusinessType] = useState<BusinessPreset>('reventa');

  // Datos de producto
  const [productName, setProductName] = useState('Artículo de Comercio / Reventa');
  
  // 1. Costo de insumos / materia prima / costo de compra
  const [materialCost, setMaterialCost] = useState(65);

  // 2. Gastos de energía / servicios, flete o herramientas
  const [energyCost, setEnergyCost] = useState(15);

  // 3. Mano de obra, empaque o tiempo invertido
  const [laborCost, setLaborCost] = useState(40);

  // 4. Margen de ganancia deseado
  const [marginPct, setMarginPct] = useState(55);

  // Factores de Precio Inteligente (Ajustes de mercado)
  const [isUrgentOrder, setIsUrgentOrder] = useState(false); // +25%
  const [isHighDemandSeason, setIsHighDemandSeason] = useState(false); // +15%
  const [isScarceMaterial, setIsScarceMaterial] = useState(false); // +20%
  const [bulkVolumeTier, setBulkVolumeTier] = useState<number>(1); // 1 = unitario, 10 = mayoreo, 50 = distribuidor

  const [applied, setApplied] = useState(false);

  // --- ESTADOS PARA ALGORITMOS UNIVERSALES ---
  // Algoritmo 1: Margen Real vs Markup
  const [algoCost, setAlgoCost] = useState(100);
  const [algoDesiredMargin, setAlgoDesiredMargin] = useState(30);

  // Algoritmo 2: Punto de Equilibrio (Break-Even)
  const [fixedCostsMonthly, setFixedCostsMonthly] = useState(6500); // Renta, luz local, internet, sueldos base
  const [unitSellingPrice, setUnitSellingPrice] = useState(250);
  const [unitVariableCost, setUnitVariableCost] = useState(110);

  // Algoritmo 3: Blindaje de Comisiones de Pasarelas / Terminales
  const [targetNetIncome, setTargetNetIncome] = useState(300);
  const [selectedGateway, setSelectedGateway] = useState<'clip' | 'mp_qr' | 'ml_clasica' | 'ml_premium' | 'delivery' | 'custom'>('clip');
  const [customFeePct, setCustomFeePct] = useState(3.5);
  const [customFixedFee, setCustomFixedFee] = useState(0);

  // Algoritmo 4: Factor de Merma y Pérdida Oculta
  const [nominalCost, setNominalCost] = useState(500);
  const [wastePercentage, setWastePercentage] = useState(10); // 10% de desperdicio/rotura/caducidad

  // Algoritmo 5: Punto de Reorden (ROP), Stock de Seguridad y Autonomía
  const [stockDailyDemand, setStockDailyDemand] = useState(6); // Ventas / consumo promedio al día
  const [stockLeadTime, setStockLeadTime] = useState(4); // Días normales que tarda el proveedor en entregar
  const [stockMaxDailyDemand, setStockMaxDailyDemand] = useState(12); // Venta máxima en día pico
  const [stockMaxLeadTime, setStockMaxLeadTime] = useState(7); // Días máximos si el proveedor se atrasa
  const [stockCurrentUnits, setStockCurrentUnits] = useState(38); // Piezas que tienes hoy en bodega/mostrador

  // Cambio de preset
  const handleSelectPreset = (preset: BusinessPreset) => {
    setBusinessType(preset);
    if (preset === 'reventa') {
      setProductName('Producto Comercial para Reventa');
      setMaterialCost(120); // Precio de compra al proveedor
      setEnergyCost(20);   // Flete y empaque
      setLaborCost(30);    // Atención y almacenaje
      setMarginPct(50);
    } else if (preset === 'elaboracion') {
      setProductName('Pieza Fabricada / Artesanía / Taller');
      setMaterialCost(55);
      setEnergyCost(15);
      setLaborCost(60);
      setMarginPct(60);
    } else if (preset === 'alimentos') {
      setProductName('Platillo / Postre / Bebida Preparada');
      setMaterialCost(45);
      setEnergyCost(20);
      setLaborCost(35);
      setMarginPct(65);
    } else if (preset === 'servicios') {
      setProductName('Servicio / Instalación / Trabajo Profesional');
      setMaterialCost(30); // Insumos y viáticos
      setEnergyCost(25);  // Herramientas y transportación
      setLaborCost(180);  // Valor horas de trabajo
      setMarginPct(60);
    } else if (preset === 'mayoreo') {
      setProductName('Lote o Paquete al Mayoreo (10+ pzs)');
      setMaterialCost(400);
      setEnergyCost(50);
      setLaborCost(100);
      setMarginPct(35);
      setBulkVolumeTier(10);
    }
  };

  // Cálculos matemáticos universales
  const totalCost = Number((materialCost + energyCost + laborCost).toFixed(2));
  
  // Algoritmo Universal 1: Precio Base = Costo / (1 - Margen%)
  const safeMargin = Math.min(marginPct, 95);
  const baseCalculatedPrice = Math.round(totalCost / (1 - safeMargin / 100));

  // Ajustes dinámicos de mercado
  let dynamicMultiplier = 1.0;
  if (isUrgentOrder) dynamicMultiplier += 0.25; // Urgente
  if (isHighDemandSeason) dynamicMultiplier += 0.15; // Temporada alta
  if (isScarceMaterial) dynamicMultiplier += 0.20; // Insumo prémium / escaso

  // Descuento automático por mayoreo
  let volumeDiscountPct = 0;
  if (bulkVolumeTier >= 50) volumeDiscountPct = 0.30;
  else if (bulkVolumeTier >= 10) volumeDiscountPct = 0.15;

  const finalSuggestedPrice = Math.max(
    Math.round(totalCost * 1.15),
    Math.round(baseCalculatedPrice * dynamicMultiplier * (1 - volumeDiscountPct))
  );

  const netProfit = Number((finalSuggestedPrice - totalCost).toFixed(2));
  const realMarginPct = finalSuggestedPrice > 0 ? Math.round((netProfit / finalSuggestedPrice) * 100) : 0;

  // Comparativa de canales de venta
  const salesChannels = [
    {
      name: 'Venta Directa o Mostrador',
      icon: Store,
      commissionPct: 0,
      effectiveSalePrice: finalSuggestedPrice,
      netReceived: finalSuggestedPrice - totalCost,
      recommended: true,
      note: 'El 100% de la utilidad se queda íntegra en tu negocio.'
    },
    {
      name: 'WhatsApp y Envíos Locales',
      icon: Globe,
      commissionPct: 0,
      effectiveSalePrice: finalSuggestedPrice,
      netReceived: finalSuggestedPrice - totalCost,
      recommended: false,
      note: 'Cobro en efectivo o transferencia bancaria directa (SPEI) sin comisión.'
    },
    {
      name: 'Mercado Libre / Amazon',
      icon: ShoppingBag,
      commissionPct: 15,
      effectiveSalePrice: Math.round(finalSuggestedPrice * 1.18),
      netReceived: Number((finalSuggestedPrice * 1.18 * 0.85 - totalCost).toFixed(2)),
      recommended: false,
      note: 'Precio sugerido incrementado para absorber retenciones y comisiones.'
    },
    {
      name: 'Terminal Bancaria o Clip',
      icon: Store,
      commissionPct: 3.5,
      effectiveSalePrice: finalSuggestedPrice,
      netReceived: Number((finalSuggestedPrice * 0.965 - totalCost).toFixed(2)),
      recommended: false,
      note: 'Comisión promedio de cobro con tarjeta física en punto de venta.'
    }
  ];

  // Algoritmo 1: Markup vs Margen
  const correctSellingPrice = Math.round(algoCost / (1 - algoDesiredMargin / 100));
  const falseMarkupPrice = Math.round(algoCost * (1 + algoDesiredMargin / 100));
  const realMarginFromMarkup = falseMarkupPrice > 0 ? (((falseMarkupPrice - algoCost) / falseMarkupPrice) * 100).toFixed(1) : '0';
  const lostMoneyPerUnit = correctSellingPrice - falseMarkupPrice;

  // Algoritmo 2: Punto de Equilibrio
  const contributionMargin = Math.max(1, unitSellingPrice - unitVariableCost);
  const breakEvenUnits = Math.ceil(fixedCostsMonthly / contributionMargin);
  const breakEvenRevenue = breakEvenUnits * unitSellingPrice;
  const breakEvenDailyUnits = Math.ceil(breakEvenUnits / 26); // 26 días hábiles al mes

  // Algoritmo 3: Comisiones de Pasarelas
  let gatewayRate = 0.035; // 3.5%
  let gatewayFixed = 0;
  if (selectedGateway === 'clip') {
    gatewayRate = 0.036; // 3.6% + IVA = ~4.17%
  } else if (selectedGateway === 'mp_qr') {
    gatewayRate = 0.015; // 1.5%
  } else if (selectedGateway === 'ml_clasica') {
    gatewayRate = 0.14; // 14%
  } else if (selectedGateway === 'ml_premium') {
    gatewayRate = 0.18; // 18%
  } else if (selectedGateway === 'delivery') {
    gatewayRate = 0.28; // 28% Rappi/Uber
  } else if (selectedGateway === 'custom') {
    gatewayRate = customFeePct / 100;
    gatewayFixed = customFixedFee;
  }
  // Fórmula de protección de comisión:
  // Precio = (IngresoDeseado + CuotaFija) / (1 - TasaComisionConIVA)
  // Con IVA (16% sobre la comisión)
  const effectiveFeeMultiplier = gatewayRate * 1.16;
  const priceToChargeClient = Math.ceil((targetNetIncome + gatewayFixed) / Math.max(0.05, (1 - effectiveFeeMultiplier)));
  const totalCommissionDeducted = Math.round(priceToChargeClient - targetNetIncome);

  // Algoritmo 4: Merma
  const effectiveCostWithWaste = Math.round(nominalCost / (1 - Math.min(wastePercentage, 90) / 100));
  const wasteLossPerBatch = effectiveCostWithWaste - nominalCost;

  // Algoritmo 5: Punto de Reorden (ROP), Stock de Seguridad y Autonomía
  const normalDemandDuringLeadTime = stockDailyDemand * stockLeadTime;
  const maxDemandDuringLeadTime = stockMaxDailyDemand * stockMaxLeadTime;
  const safetyStock = Math.max(1, maxDemandDuringLeadTime - normalDemandDuringLeadTime);
  const reorderPoint = normalDemandDuringLeadTime + safetyStock;
  const daysOfInventoryLeft = stockDailyDemand > 0 ? (stockCurrentUnits / stockDailyDemand).toFixed(1) : '0';

  let stockStatus: 'healthy' | 'reorder' | 'critical' = 'healthy';
  if (stockCurrentUnits <= safetyStock) {
    stockStatus = 'critical';
  } else if (stockCurrentUnits <= reorderPoint) {
    stockStatus = 'reorder';
  }

  const handleApplyToCatalog = async () => {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D94680', '#582C7B', '#A855F7']
    });

    setApplied(true);

    const existing = await db.products
      .filter((p) => p.name.toLowerCase().includes(productName.toLowerCase()))
      .first();

    if (existing) {
      await db.products.update(existing.id, {
        retailPrice: finalSuggestedPrice,
        directCost: totalCost
      });
    }

    onApplyPriceToCatalog?.(productName, finalSuggestedPrice, totalCost);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs space-y-6">
      
      {/* Header Universal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span>Inteligencia de Precios y Algoritmos de Venta</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                Universal
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              Herramientas y fórmulas matemáticas aplicables a cualquier giro comercial: reventa, producción, comida, servicios o mayoreo.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-3">
        <button
          onClick={() => setActiveTab('precio_inteligente')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'precio_inteligente'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Calculadora Universal de Precio</span>
        </button>

        <button
          onClick={() => setActiveTab('algoritmos_universales')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'algoritmos_universales'
              ? 'bg-[#582C7B] text-white shadow-xs'
              : 'bg-purple-50 text-[#582C7B] hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>5 Algoritmos Maestros (Venta y Stock)</span>
        </button>

        <button
          onClick={() => setActiveTab('canales_venta')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'canales_venta'
              ? 'bg-[#D94680] text-white shadow-xs'
              : 'bg-pink-50 text-[#D94680] hover:bg-pink-100 border border-pink-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Canales de Venta & Comisiones</span>
        </button>
      </div>

      {/* VISTA 1: PRECIO INTELIGENTE UNIVERSAL */}
      {activeTab === 'precio_inteligente' && (
        <div className="space-y-6">
          
          {/* Selector de Tipo de Negocio / Giro Comercial */}
          <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-zinc-600" />
                <span>¿Qué tipo de producto o venta vas a calcular hoy?</span>
              </span>
              <span className="text-[11px] text-zinc-500">Selecciona para adaptar los conceptos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[
                { id: 'reventa' as BusinessPreset, label: 'Reventa / Comercio', icon: ShoppingBasket, desc: 'Comprar y revender' },
                { id: 'elaboracion' as BusinessPreset, label: 'Fabricación / Taller', icon: Hammer, desc: 'Materia prima y manos' },
                { id: 'alimentos' as BusinessPreset, label: 'Alimentos / Postres', icon: UtensilsCrossed, desc: 'Recetas e insumos' },
                { id: 'servicios' as BusinessPreset, label: 'Servicios / Oficios', icon: Briefcase, desc: 'Horas y mano de obra' },
                { id: 'mayoreo' as BusinessPreset, label: 'Mayoreo y Lotes', icon: Layers, desc: 'Volumen comercial' }
              ].map((preset) => {
                const Icon = preset.icon;
                const isSelected = businessType === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                      <span className="text-xs font-bold truncate">{preset.label}</span>
                    </div>
                    <span className={`text-[10px] leading-tight ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Formulario de Costos Sencillos (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Nombre del producto */}
              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">
                  Nombre del artículo, lote o servicio:
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej. Blusa artesanal, lote de galletas, lámpara, cambio de aceite..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-xs sm:text-sm font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Los 4 Factores Clave adaptados al giro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                
                {/* 1. Materia prima / Costo de adquisición */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 block">
                    {businessType === 'reventa' && '1. Costo de Compra al Proveedor:'}
                    {businessType === 'elaboracion' && '1. Materiales o Insumos Usados:'}
                    {businessType === 'alimentos' && '1. Ingredientes y Materia Prima:'}
                    {businessType === 'servicios' && '1. Materiales o Viáticos de Traslado:'}
                    {businessType === 'mayoreo' && '1. Costo del Lote Completo:'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block">
                    {businessType === 'reventa' && 'Lo que pagas por unidad al comprar'}
                    {businessType === 'elaboracion' && 'Materia prima física para armarlo'}
                    {businessType === 'alimentos' && 'Alimentos, empaque térmico o frascos'}
                    {businessType === 'servicios' && 'Refacciones o insumos del trabajo'}
                    {businessType === 'mayoreo' && 'Costo total de las unidades del lote'}
                  </span>
                </div>

                {/* 2. Energía / Flete / Empaque */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 block">
                    {businessType === 'reventa' && '2. Flete, Envío o Empaque:'}
                    {businessType === 'elaboracion' && '2. Luz, Gas o Herramientas:'}
                    {businessType === 'alimentos' && '2. Gas, Refrigeración y Desechables:'}
                    {businessType === 'servicios' && '2. Desgaste de Equipo o Gasolina:'}
                    {businessType === 'mayoreo' && '2. Embalaje y Logística de Cajas:'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={energyCost}
                      onChange={(e) => setEnergyCost(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block">Gastos directos para tenerlo listo</span>
                </div>

                {/* 3. Mano de obra */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 block">
                    {businessType === 'reventa' && '3. Atención, Etiquetado y Venta:'}
                    {businessType === 'elaboracion' && '3. Tu Trabajo y Tiempo (Mano de Obra):'}
                    {businessType === 'alimentos' && '3. Tiempo de Cocina y Decoración:'}
                    {businessType === 'servicios' && '3. Horas de Trabajo del Profesional:'}
                    {businessType === 'mayoreo' && '3. Tiempo de Estiba y Verificación:'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block">Tu salario justo por tu tiempo</span>
                </div>

                {/* 4. Margen deseado */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-zinc-700">
                    <span>4. Margen Deseado Real:</span>
                    <span className="text-zinc-900 font-bold">{marginPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="85"
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500 block">
                    Calculado con la fórmula universal: Costo / (1 - Margen%)
                  </span>
                </div>

              </div>

              {/* Ajustes de Mercado y Volumen */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <span className="text-xs font-bold text-zinc-800 block">
                  Ajustes de Mercado (Factores Dinámicos):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-zinc-200 cursor-pointer hover:border-zinc-300">
                    <input
                      type="checkbox"
                      checked={isUrgentOrder}
                      onChange={(e) => setIsUrgentOrder(e.target.checked)}
                      className="rounded text-zinc-900 accent-zinc-900"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-zinc-800">Pedido Urgente</span>
                      <span className="block text-[10px] text-rose-600 font-semibold">+25% recargo</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-zinc-200 cursor-pointer hover:border-zinc-300">
                    <input
                      type="checkbox"
                      checked={isHighDemandSeason}
                      onChange={(e) => setIsHighDemandSeason(e.target.checked)}
                      className="rounded text-zinc-900 accent-zinc-900"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-zinc-800">Temporada Alta</span>
                      <span className="block text-[10px] text-amber-600 font-semibold">+15% fechas pico</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-zinc-200 cursor-pointer hover:border-zinc-300">
                    <input
                      type="checkbox"
                      checked={isScarceMaterial}
                      onChange={(e) => setIsScarceMaterial(e.target.checked)}
                      className="rounded text-zinc-900 accent-zinc-900"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-zinc-800">Insumo Prémium</span>
                      <span className="block text-[10px] text-purple-600 font-semibold">+20% exclusividad</span>
                    </div>
                  </label>
                </div>

                {/* Mayoreo */}
                <div className="pt-2 border-t border-zinc-200">
                  <span className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Escalón de Venta (Volumen):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { tier: 1, label: '1 pieza (Menudeo)', discount: '0%' },
                      { tier: 10, label: '10 a 49 piezas (Medio Mayoreo)', discount: '-15%' },
                      { tier: 50, label: '50+ piezas (Gran Mayoreo)', discount: '-30%' }
                    ].map((t) => (
                      <button
                        key={t.tier}
                        type="button"
                        onClick={() => setBulkVolumeTier(t.tier)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          bulkVolumeTier === t.tier
                            ? 'bg-zinc-900 text-white font-bold'
                            : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
                        }`}
                      >
                        {t.label} <strong className="text-emerald-400 font-normal">({t.discount})</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Columna Derecha: Tarjeta de Precio Sugerido y Ganancia (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-zinc-50 to-purple-50/30 p-5 rounded-xl border border-zinc-300 shadow-xs flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Resultado del Algoritmo
                  </span>
                  <span className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded-full font-semibold text-zinc-600">
                    Fórmula Universal
                  </span>
                </div>

                {/* Precio Grande */}
                <div className="p-4 rounded-xl bg-white border border-zinc-200 text-center shadow-xs">
                  <span className="text-[11px] text-zinc-500 font-semibold block uppercase">
                    Precio de Venta Sugerido:
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-zinc-900 my-1 font-serif">
                    ${finalSuggestedPrice.toLocaleString('es-MX')} <span className="text-sm font-sans text-zinc-500 font-normal">MXN</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-600 block truncate">
                    {productName}
                  </span>
                </div>

                {/* Desglose de Ganancia */}
                <div className="bg-white p-3.5 rounded-xl border border-zinc-200 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Costo total directo (unitario):</span>
                    <strong>${totalCost} MXN</strong>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Tu ganancia neta en dinero:</span>
                    <strong className="text-emerald-700 text-sm font-bold">+${netProfit} MXN</strong>
                  </div>
                  <div className="flex justify-between text-zinc-600 pt-1.5 border-t border-zinc-200">
                    <span>Margen real sobre el precio:</span>
                    <strong className="text-[#582C7B] text-sm font-bold">{realMarginPct}%</strong>
                  </div>
                </div>

                {/* Explicación didáctica rápida */}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                  ✓ <strong>Margen protegido:</strong> De cada $100 que cobres, <strong>${realMarginPct} MXN</strong> serán ganancia limpia después de reponer insumos y cubrir tu mano de obra.
                </div>
              </div>

              {/* Botón para guardar en el catálogo */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleApplyToCatalog}
                  className="w-full py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {applied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>¡Precio Guardado en Catálogo!</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-300" />
                      <span>Guardar Precio en mi Catálogo</span>
                    </>
                  )}
                </button>

                {onGoToProducts && (
                  <button
                    onClick={onGoToProducts}
                    className="w-full py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Ver Todos mis Productos</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* VISTA 2: LOS 5 ALGORITMOS MAESTROS UNIVERSALES */}
      {activeTab === 'algoritmos_universales' && (
        <div className="space-y-6">
          
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-zinc-900 rounded-2xl p-5 text-white shadow-xs">
            <h4 className="text-base sm:text-lg font-bold">
              Suite de 5 Algoritmos Financieros y de Control de Inventario
            </h4>
            <p className="text-xs text-purple-200 mt-1 max-w-2xl leading-relaxed">
              Herramientas matemáticas estándar de comercio para fijar precios, proteger márgenes y calcular exactamente cuándo y cuánto resurtir tu stock sin quedarte sin mercancía ni estancar dinero.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ALGORITMO 1: MARGEN REAL VS RECARGO */}
            <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#582C7B] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h5 className="text-sm font-bold text-zinc-900">
                    Algoritmo de Margen Real vs. Recargo Simple
                  </h5>
                  <span className="text-[11px] text-zinc-500">Evita el error número uno del comerciante</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Si un producto te cuesta $100 y quieres ganar el 30%, multiplicarlo por 1.30 ($130) <strong>es un error común</strong>: tu margen real resultante será solo del 23.1%. Con este algoritmo calculas el precio matemático exacto.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">Costo Unitario ($):</label>
                  <input
                    type="number"
                    min="1"
                    value={algoCost}
                    onChange={(e) => setAlgoCost(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">Margen Deseado (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={algoDesiredMargin}
                    onChange={(e) => setAlgoDesiredMargin(Math.min(90, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                </div>
              </div>

              {/* Comparativa */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Fórmula Correcta:</span>
                  <div className="text-xl font-bold text-emerald-700 font-serif">
                    ${correctSellingPrice} MXN
                  </div>
                  <span className="text-[10px] text-emerald-600 block">
                    Margen real: <strong>{algoDesiredMargin}%</strong> íntegro.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">Recargo Simple (Erróneo):</span>
                  <div className="text-xl font-bold text-rose-700 font-serif">
                    ${falseMarkupPrice} MXN
                  </div>
                  <span className="text-[10px] text-rose-600 block">
                    Margen real: solo <strong>{realMarginFromMarkup}%</strong>.
                  </span>
                </div>
              </div>

              {lostMoneyPerUnit > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Usando la fórmula correcta ganas <strong>+${lostMoneyPerUnit} MXN más por cada pieza</strong> vendida.
                  </span>
                </div>
              )}
            </div>

            {/* ALGORITMO 2: PUNTO DE EQUILIBRIO */}
            <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h5 className="text-sm font-bold text-zinc-900">
                    Algoritmo de Punto de Equilibrio (Break-Even)
                  </h5>
                  <span className="text-[11px] text-zinc-500">¿Cuántas piezas necesitas vender para no perder?</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <label className="text-[10px] font-bold text-zinc-700 block mb-1">Costos Fijos Mes ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={fixedCostsMonthly}
                    onChange={(e) => setFixedCostsMonthly(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Renta, luz, etc.</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-700 block mb-1">Precio Venta ($):</label>
                  <input
                    type="number"
                    min="1"
                    value={unitSellingPrice}
                    onChange={(e) => setUnitSellingPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Por pieza</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-700 block mb-1">Costo Variable ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={unitVariableCost}
                    onChange={(e) => setUnitVariableCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Costo directo</span>
                </div>
              </div>

              {/* Resultados */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Meta Mensual</span>
                  <div className="text-xl font-bold text-zinc-900 font-serif mt-0.5">
                    {breakEvenUnits} <span className="text-xs font-sans font-normal">pzs</span>
                  </div>
                  <span className="text-[9px] text-zinc-500">Para salir tablas</span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] text-[#582C7B] font-bold uppercase block">Meta Diaria</span>
                  <div className="text-xl font-bold text-[#582C7B] font-serif mt-0.5">
                    {breakEvenDailyUnits} <span className="text-xs font-sans font-normal">pzs/día</span>
                  </div>
                  <span className="text-[9px] text-purple-600">Base 26 días</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Venta Mínima ($)</span>
                  <div className="text-lg font-bold text-emerald-700 font-serif mt-0.5">
                    ${breakEvenRevenue.toLocaleString('es-MX')}
                  </div>
                  <span className="text-[9px] text-emerald-600">Facturación mes</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600">
                💡 <strong>Margen de Contribución:</strong> Cada unidad vendida te aporta <strong>${contributionMargin} MXN</strong> para pagar los costos fijos. A partir de la unidad #{breakEvenUnits + 1}, todo es pura ganancia líquida.
              </div>
            </div>

            {/* ALGORITMO 3: BLINDAJE DE PASARELAS / TERMINALES */}
            <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#D94680] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h5 className="text-sm font-bold text-zinc-900">
                    Algoritmo de Blindaje contra Comisiones
                  </h5>
                  <span className="text-[11px] text-zinc-500">¿Cuánto cobrar para que te quede el dinero exacto?</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">Dinero Limpio que Quieres ($):</label>
                  <input
                    type="number"
                    min="10"
                    value={targetNetIncome}
                    onChange={(e) => setTargetNetIncome(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">Plataforma o Terminal:</label>
                  <select
                    value={selectedGateway}
                    onChange={(e: any) => setSelectedGateway(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-semibold text-zinc-900"
                  >
                    <option value="clip">Terminal Clip / Point (~3.6% + IVA)</option>
                    <option value="mp_qr">Mercado Pago QR (1.5% + IVA)</option>
                    <option value="ml_clasica">Mercado Libre Clásica (14% + IVA)</option>
                    <option value="ml_premium">Mercado Libre Premium (18% + IVA)</option>
                    <option value="delivery">Apps Delivery (Rappi/Uber ~28%)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#D94680] uppercase block">
                    Debes cobrarle al cliente:
                  </span>
                  <div className="text-2xl font-black text-zinc-900 font-serif">
                    ${priceToChargeClient} <span className="text-xs font-sans font-normal text-zinc-500">MXN</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    La pasarela retiene <strong>${totalCommissionDeducted} MXN</strong> (comisión + IVA)
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Te depositan a tu cuenta:
                  </span>
                  <div className="text-xl font-bold text-emerald-700 font-serif">
                    ${targetNetIncome} MXN
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">100% de tu dinero</span>
                </div>
              </div>
            </div>

            {/* ALGORITMO 4: FACTOR DE MERMA Y DESPERDICIO */}
            <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h5 className="text-sm font-bold text-zinc-900">
                    Algoritmo de Factor de Merma (Desperdicio Oculto)
                  </h5>
                  <span className="text-[11px] text-zinc-500">Para comida, telas, roturas o artículos frágiles</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Si compras $500 de insumos pero pierdes un 10% en recortes, caducidad o pruebas, tu costo real no es $500. Este algoritmo absorbe la merma para que no reduzca tu sueldo.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">Costo Nominal Insumos ($):</label>
                  <input
                    type="number"
                    min="10"
                    value={nominalCost}
                    onChange={(e) => setNominalCost(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">% Estimado de Merma:</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={wastePercentage}
                    onChange={(e) => setWastePercentage(Math.min(60, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Costo Real Efectivo:</span>
                  <div className="text-2xl font-bold text-amber-900 font-serif">
                    ${effectiveCostWithWaste} MXN
                  </div>
                  <span className="text-[10px] text-amber-700">
                    Factor de corrección: +${wasteLossPerBatch} MXN protegidos
                  </span>
                </div>

                <div className="text-right text-xs text-zinc-600 max-w-[160px]">
                  <span>Usa este costo en tu calculadora para no absorber la pérdida de tu bolsa.</span>
                </div>
              </div>
            </div>

            {/* ALGORITMO 5: CÁLCULO DE STOCK, PUNTO DE REORDEN (ROP) Y SEGURIDAD */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 border-2 border-indigo-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    5
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                      <span>Algoritmo de Cálculo de Stock (Punto de Reorden ROP y Stock de Seguridad)</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold">
                        Operaciones & Logística
                      </span>
                    </h5>
                    <p className="text-xs text-zinc-500">
                      Calcula matemáticamente en cuántas piezas exactas debes pedir resurtido a tu proveedor para nunca quedarte sin mercancía ni sobrellenar tu bodega.
                    </p>
                  </div>
                </div>

                {/* Semáforo de Estado en Tiempo Real */}
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  stockStatus === 'critical'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : stockStatus === 'reorder'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    stockStatus === 'critical' ? 'bg-rose-600' : stockStatus === 'reorder' ? 'bg-amber-500' : 'bg-emerald-600'
                  }`} />
                  <span>
                    {stockStatus === 'critical' && '¡ALERTA CRÍTICA! Consumiendo reserva'}
                    {stockStatus === 'reorder' && '¡MOMENTO DE REORDENAR! Llama a tu proveedor'}
                    {stockStatus === 'healthy' && 'Inventario Saludable (En zona segura)'}
                  </span>
                </div>
              </div>

              {/* Parámetros de Entrada del Algoritmo */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Venta Diaria Promedio (D):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockDailyDemand}
                    onChange={(e) => setStockDailyDemand(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Piezas que vendes al día</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Tiempo de Entrega (L):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockLeadTime}
                    onChange={(e) => setStockLeadTime(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Días que tarda el proveedor</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Venta en Día Pico (Dmáx):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockMaxDailyDemand}
                    onChange={(e) => setStockMaxDailyDemand(Math.max(Number(stockDailyDemand), Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Venta máxima esperada</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Días con Retraso (Lmáx):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockMaxLeadTime}
                    onChange={(e) => setStockMaxLeadTime(Math.max(Number(stockLeadTime), Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-900"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Si hay lluvia, bloqueo o puente</span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                    Stock Actual en Bodega:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockCurrentUnits}
                    onChange={(e) => setStockCurrentUnits(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg bg-indigo-50 border-2 border-indigo-400 text-xs font-black text-indigo-950 focus:bg-white"
                  />
                  <span className="text-[10px] text-indigo-700 font-semibold block mt-0.5">Piezas que tienes hoy</span>
                </div>
              </div>

              {/* Panel de Resultados del Algoritmo */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                
                {/* 1. Punto de Reorden */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide block">
                    Punto de Reorden (ROP):
                  </span>
                  <div className="text-2xl font-black text-indigo-950 font-serif my-1">
                    {reorderPoint} <span className="text-xs font-sans font-normal text-indigo-700">piezas</span>
                  </div>
                  <span className="text-[11px] text-indigo-800 leading-tight block">
                    Cuando tu stock baje a <strong>{reorderPoint} pzs</strong>, ¡levanta el pedido de inmediato!
                  </span>
                </div>

                {/* 2. Stock de Seguridad */}
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                  <span className="text-[10px] font-bold text-[#582C7B] uppercase tracking-wide block">
                    Stock de Seguridad (SS):
                  </span>
                  <div className="text-2xl font-black text-[#582C7B] font-serif my-1">
                    {safetyStock} <span className="text-xs font-sans font-normal text-purple-700">piezas</span>
                  </div>
                  <span className="text-[11px] text-purple-900 leading-tight block">
                    Tu colchón de reserva ante retrasos del proveedor o ventas extraordinarias.
                  </span>
                </div>

                {/* 3. Autonomía Restante */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide block">
                    Autonomía Actual:
                  </span>
                  <div className="text-2xl font-black text-zinc-900 font-serif my-1">
                    {daysOfInventoryLeft} <span className="text-xs font-sans font-normal text-zinc-500">días</span>
                  </div>
                  <span className="text-[11px] text-zinc-600 leading-tight block">
                    Tiempo que resiste tu negocio vendiendo <strong>{stockDailyDemand} pzs/día</strong>.
                  </span>
                </div>

                {/* 4. Diagnóstico y Acción Recomendada */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  stockStatus === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : stockStatus === 'reorder'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wide block">
                    Acción Recomendada:
                  </span>
                  <p className="text-xs font-bold leading-snug my-1">
                    {stockStatus === 'critical' && `Pide un pedido urgente HOY. Tienes ${stockCurrentUnits} pzs y estás por debajo del colchón de seguridad (${safetyStock} pzs).`}
                    {stockStatus === 'reorder' && `Alcanzaste el Punto de Reorden (${reorderPoint} pzs). Tienes ${stockLeadTime} días para que llegue tu nuevo lote sin romper stock.`}
                    {stockStatus === 'healthy' && `Tu inventario está en rango seguro. Tienes mercancía suficiente para cubrir la demanda y los tiempos del proveedor.`}
                  </p>
                  <span className="text-[10px] opacity-80 block">
                    Fórmula: ROP = (Demanda × Tiempo Entrega) + Stock Seguridad
                  </span>
                </div>

              </div>

              {/* Resumen pedagógico del algoritmo */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    A
                  </div>
                  <div>
                    <strong className="text-zinc-900 block">¿Por qué nunca pedir cuando tienes 0 piezas?</strong>
                    Si esperas a que el stock sea 0, durante los {stockLeadTime} días que tarda el proveedor en fabricar y enviar, tu negocio estará cerrado y perdiendo clientes.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    B
                  </div>
                  <div>
                    <strong className="text-zinc-900 block">La regla de oro del Stock de Seguridad:</strong>
                    El colchón de {safetyStock} piezas te da tranquilidad total frente a festivos, lluvias, tráfico o clientes mayoristas inesperados.
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VISTA 3: CANALES DE VENTA & GANANCIAS */}
      {activeTab === 'canales_venta' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-900">
              ¿Cuánto dinero limpio te queda según dónde vendas?
            </h4>
            <p className="text-xs text-zinc-600">
              Compara tu ganancia neta en tu punto físico directo vs ventas digitales por WhatsApp, Mercado Libre o con terminal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {salesChannels.map((ch, idx) => {
              const Icon = ch.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-3 bg-white flex flex-col justify-between ${
                    ch.recommended
                      ? 'border-zinc-900 bg-zinc-50/40 shadow-xs ring-1 ring-zinc-900/10'
                      : 'border-zinc-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      {ch.recommended && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          Mayor Ganancia
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs font-bold text-zinc-900">{ch.name}</h5>
                    <p className="text-[11px] text-zinc-500 leading-tight">{ch.note}</p>
                  </div>

                  <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-zinc-200 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Precio al público:</span>
                      <strong>${ch.effectiveSalePrice} MXN</strong>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Comisión:</span>
                      <span>{ch.commissionPct}%</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-200">
                      <span className="font-bold text-zinc-800">Te quedan limpios:</span>
                      <strong className="text-emerald-700 font-bold text-sm">
                        ${ch.netReceived} MXN
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
