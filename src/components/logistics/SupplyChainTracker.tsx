import React, { useState } from 'react';
import {
  Truck,
  PackageCheck,
  CheckCircle2,
  Share2,
  Activity,
  Compass,
  CloudRain,
  WifiOff,
  Clock,
  MapPin,
  Building2,
  Store,
  Box,
  ShieldCheck,
  Phone,
  MessageCircle,
  Plus,
  Navigation,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArchiveRestore,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { type SupplierMaterialOrder, type LocalSupplier, db } from '../../db/indexedDB';

interface Props {
  onGoToSafeRoutes?: () => void;
  materialOrders?: SupplierMaterialOrder[];
  suppliers?: LocalSupplier[];
  onRefreshData?: () => void;
  onGoToSuppliers?: () => void;
  onGoToInventory?: () => void;
}

interface ShipmentItem {
  id: string;
  trackingCode: string;
  supplierName: string;
  supplierLocation: string;
  supplierPhone: string;
  sellerDestination: string;
  materialDesc: string;
  quantity: string;
  totalCost: number;
  stage: number; // 0: Empaque en Proveedor, 1: En Camino Carretera/Vía, 2: En Reparto Local, 3: Entregado en Taller
  transportMode: string;
  packagingProtection: string;
  driverName?: string;
  driverVehicle?: string;
  estimatedArrivalText: string;
  remainingMinutesText: string;
  currentLocationName: string;
  progressPercent: number;
  routeStops: {
    title: string;
    location: string;
    time: string;
    passed: boolean;
  }[];
}

export const SupplyChainTracker: React.FC<Props> = ({
  onGoToSafeRoutes,
  materialOrders = [],
  suppliers = [],
  onRefreshData,
  onGoToSuppliers,
  onGoToInventory
}) => {
  // Pre-configured shipments from Suppliers to Sellers (Morelia / Michoacán context)
  const defaultShipments: ShipmentItem[] = [
    {
      id: 'ship-1',
      trackingCode: 'PROV-MOR-8821',
      supplierName: '3D PRINT3D Morelia / Color Plus 3D',
      supplierLocation: 'Félix Ireta / Yunuen 131, Morelia, Michoacán',
      supplierPhone: '+524432417613',
      sellerDestination: 'Tu Taller MiFyMEs (Morelia, Michoacán)',
      materialDesc: '2 Carretes Filamento PETG Negro Industrial 1kg + Kit 4 Boquillas Latón 0.4mm',
      quantity: '2 Carretes + Pack boquillas',
      totalCost: 860,
      stage: 2, // En Reparto Local
      transportMode: 'Reparto Express Local en Motocicleta / Caja Térmica Protegida',
      packagingProtection: 'Filamento sellado al alto vacío con gel de sílice antihumedad + caja amortiguada con plástico burbuja',
      driverName: 'Jorge Ramírez (Chofer de reparto local)',
      driverVehicle: 'Honda Cargo 150cc • Placas Mich. 44-KT',
      estimatedArrivalText: 'Hoy entre 04:15 PM y 04:45 PM',
      remainingMinutesText: 'Aproximadamente 25 minutos',
      currentLocationName: 'Calzada Ventura Puente esquina Av. Acueducto (a 1.8 km de tu taller)',
      progressPercent: 78,
      routeStops: [
        {
          title: 'Bodega Proveedor',
          location: 'Salida de bodega 3D PRINT3D Morelia',
          time: '02:30 PM',
          passed: true
        },
        {
          title: 'Inspección de Lote',
          location: 'Verificación de bobinas y desecante',
          time: '02:50 PM',
          passed: true
        },
        {
          title: 'En Tránsito Local',
          location: 'Paso por Av. Acueducto y Calzada Ventura Puente',
          time: '03:40 PM',
          passed: true
        },
        {
          title: 'Llegada a tu Taller',
          location: 'Tu local de ventas en Morelia',
          time: '04:25 PM',
          passed: false
        }
      ]
    },
    {
      id: 'ship-2',
      trackingCode: 'PROV-NAC-4090',
      supplierName: '3D Market Morelia & Distribución',
      supplierLocation: 'Centro Logístico Michoacán / Morelia',
      supplierPhone: '+524433129080',
      sellerDestination: 'Tu Taller MiFyMEs (Morelia, Michoacán)',
      materialDesc: '1 Carrete PLA Mármol Blanco + 1 Botella Resina Eco Lavable con Agua 1kg',
      quantity: '2 Kilos de insumos',
      totalCost: 850,
      stage: 1, // En Carretera
      transportMode: 'Camioneta Utilitaria Climatizada de Paquetería Terrestre',
      packagingProtection: 'Caja reforzada con esquineros rígidos y sellos de seguridad anti-aplastamiento',
      driverName: 'Mensajería Terrestre Consolidada',
      driverVehicle: 'Nissan NP300 Cerrada',
      estimatedArrivalText: 'Mañana Viernes, 11:30 AM',
      remainingMinutesText: 'Llegada programada en 18 horas',
      currentLocationName: 'Caseta Panindícuaro / Autopista de Occidente rumbo a Morelia',
      progressPercent: 42,
      routeStops: [
        {
          title: 'Centro de Distribución',
          location: 'Despacho de resinas y filamentos',
          time: 'Ayer 06:00 PM',
          passed: true
        },
        {
          title: 'En Autopista Segura',
          location: 'Tránsito por autopista de cuota',
          time: 'Hoy 08:30 AM',
          passed: true
        },
        {
          title: 'Centro de Reparto Morelia',
          location: 'Zona Industrial Morelia',
          time: 'Mañana 09:00 AM',
          passed: false
        },
        {
          title: 'Entrega en tu Taller',
          location: 'Tu taller de impresión 3D',
          time: 'Mañana 11:30 AM',
          passed: false
        }
      ]
    }
  ];

  // Active shipments state
  const [shipments, setShipments] = useState<ShipmentItem[]>(defaultShipments);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(defaultShipments[0].id);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);
  const [inventoryAddedNotice, setInventoryAddedNotice] = useState<string | null>(null);

  // New Shipment Form State
  const [newTracking, setNewTracking] = useState(`GUIA-PROV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newSupplier, setNewSupplier] = useState('3D PRINT3D Morelia');
  const [newSupplierPhone, setNewSupplierPhone] = useState('+524432417613');
  const [newMaterial, setNewMaterial] = useState('2 Carretes Filamento PLA Silk Rosa');
  const [newETA, setNewETA] = useState('Hoy, 05:00 PM');
  const [newTransport, setNewTransport] = useState('Reparto express local en Morelia');

  const activeShipment = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];

  // Advance stage for this supplier shipment
  const advanceStage = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setShipments((prev) =>
        prev.map((item) => {
          if (item.id === activeShipment.id) {
            const nextStage = item.stage >= 3 ? 0 : item.stage + 1;
            const updatedStops = item.routeStops.map((stop, idx) => ({
              ...stop,
              passed: idx <= nextStage
            }));
            const updatedPercent = nextStage === 0 ? 15 : nextStage === 1 ? 45 : nextStage === 2 ? 80 : 100;
            return {
              ...item,
              stage: nextStage,
              progressPercent: updatedPercent,
              routeStops: updatedStops,
              currentLocationName:
                nextStage === 0
                  ? `Bodega del proveedor (${item.supplierName})`
                  : nextStage === 1
                  ? 'En tránsito por carretera o vía principal'
                  : nextStage === 2
                  ? 'En reparto local por tu colonia (a menos de 2 km)'
                  : '¡Entregado e ingresado a tu taller!'
            };
          }
          return item;
        })
      );
      setIsUpdating(false);
      confetti({ particleCount: 35, spread: 60 });
    }, 400);
  };

  // Add received material to inventory
  const handleAddToInventory = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await db.inventory.add({
        id: `INV-${Date.now()}`,
        name: activeShipment.materialDesc.split('+')[0].trim(),
        category: 'Filamentos',
        color: 'Negro / Surtido',
        colorHex: '#38BDF8',
        brand: activeShipment.supplierName,
        stockGramsOrUnits: 2000,
        unit: 'g',
        minStockAlert: 500,
        unitCost: activeShipment.totalCost > 0 ? Math.round(activeShipment.totalCost / 2) : 340,
        retailPrice: 160,
        status: 'sufficient',
        lastUpdated: todayStr
      });
      setInventoryAddedNotice(
        `¡Insumo "${activeShipment.materialDesc}" agregado exitosamente a tu Inventario!`
      );
      confetti({ particleCount: 80, spread: 90 });
      if (onRefreshData) onRefreshData();
      setTimeout(() => setInventoryAddedNotice(null), 5000);
    } catch (err) {
      console.error('Error adding to inventory:', err);
    }
  };

  // Contact supplier via WhatsApp
  const handleContactSupplierWhatsApp = () => {
    const stageNames = [
      'Empacado y listo para salir de la bodega del proveedor',
      'En camino por carretera en ruta protegida',
      'En reparto local cerca de mi taller',
      'Entregado en mi taller'
    ];

    const message = encodeURIComponent(
      `¡Hola ${activeShipment.supplierName}! Te contacto desde mi taller de ventas MiFyMEs respecto al envío de mis insumos:\n\n📦 Insumo: ${activeShipment.materialDesc}\n🔖 Guía de rastreo: ${activeShipment.trackingCode}\n📍 Estatus registrado: ${stageNames[activeShipment.stage]}\n⏰ ETA: ${activeShipment.estimatedArrivalText}\n\n¿Me podrías confirmar si el chofer ya viene en camino? ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${activeShipment.supplierPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  // Create new shipment tracker
  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `ship-${Date.now()}`;
    const created: ShipmentItem = {
      id: newId,
      trackingCode: newTracking,
      supplierName: newSupplier,
      supplierLocation: 'Bodega de Proveedor',
      supplierPhone: newSupplierPhone,
      sellerDestination: 'Tu Taller MiFyMEs (Morelia)',
      materialDesc: newMaterial,
      quantity: 'Insumos solicitados',
      totalCost: 650,
      stage: 1,
      transportMode: newTransport,
      packagingProtection: 'Empaque hermético con burbuja y sello de proveedor',
      driverName: 'Repartidor de Proveedor',
      driverVehicle: 'Vehículo de carga local',
      estimatedArrivalText: newETA,
      remainingMinutesText: 'En trayecto programado',
      currentLocationName: 'En ruta hacia tu taller en Morelia',
      progressPercent: 40,
      routeStops: [
        {
          title: 'Bodega Proveedor',
          location: 'Despacho registrado',
          time: 'Hoy',
          passed: true
        },
        {
          title: 'En Camino',
          location: 'Transporte en ruta',
          time: 'En curso',
          passed: true
        },
        {
          title: 'Reparto Local',
          location: 'Zona de entrega',
          time: 'Próximamente',
          passed: false
        },
        {
          title: 'Llegada a Taller',
          location: 'Recepción en tu negocio',
          time: newETA,
          passed: false
        }
      ]
    };

    setShipments([created, ...shipments]);
    setSelectedShipmentId(newId);
    setShowNewShipmentModal(false);
    confetti({ particleCount: 40, spread: 60 });
  };

  const stageTitles = [
    {
      step: 0,
      title: '1. Despacho en Proveedor',
      subtitle: 'Bodega del Proveedor',
      desc: 'Insumo revisado, pesado, sellado al alto vacío con desecante para protegerlo de humedad.'
    },
    {
      step: 1,
      title: '2. En Carretera / Vía Principal',
      subtitle: 'En Tránsito Protegido',
      desc: 'Transporte en camioneta o unidad segura evitando baches bruscos y calor excesivo.'
    },
    {
      step: 2,
      title: '3. En Reparto en tu Colonia',
      subtitle: 'Última Milla hacia tu Taller',
      desc: 'Chofer o repartidor local en Morelia rumbo a tu puerta para entregarte en mano.'
    },
    {
      step: 3,
      title: '4. Recibido en tu Taller',
      subtitle: 'Listo para Producir y Vender',
      desc: 'Insumo verificado y listo para alimentar tus impresoras y generar productos.'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Reoriented: PROVEEDOR A VENDEDOR */}
      <div className="bg-[#582C7B] text-white p-5 rounded-sm border border-[#472264] space-y-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-impact uppercase tracking-wider text-white">
                  Rastreo de Envíos: Del Proveedor a tu Taller de Ventas
                </h3>
              </div>
              <p className="text-xs text-pink-200">
                Monitorea en tiempo real <strong>CÓMO</strong>, <strong>DÓNDE</strong> y <strong>CUÁNDO</strong> llegan tus filamentos, resinas, cajas y suministros.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-sm bg-[#D94680] text-white text-xs font-impact uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proveedor → Vendedor</span>
            </span>
            <button
              onClick={() => setShowNewShipmentModal(true)}
              className="px-3 py-1 rounded-sm bg-white/15 hover:bg-white/25 text-white text-xs font-impact uppercase tracking-wider transition flex items-center gap-1 cursor-pointer border border-white/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Rastrear Nueva Guía</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice after adding to inventory */}
      {inventoryAddedNotice && (
        <div className="p-3.5 rounded-sm bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{inventoryAddedNotice}</span>
          </div>
          {onGoToInventory && (
            <button
              onClick={onGoToInventory}
              className="px-2.5 py-1 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-impact uppercase tracking-wider cursor-pointer"
            >
              Ver en Inventario →
            </button>
          )}
        </div>
      )}

      {/* Shipment Selector Tabs: Switch between incoming shipments from suppliers */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-impact uppercase tracking-wider text-stone-500 shrink-0 flex items-center gap-1">
          <Box className="w-3.5 h-3.5 text-[#582C7B]" />
          Envíos Activos de Proveedores:
        </span>
        {shipments.map((sh) => (
          <button
            key={sh.id}
            onClick={() => setSelectedShipmentId(sh.id)}
            className={`px-3.5 py-2 rounded-sm text-xs font-impact uppercase tracking-wider transition shrink-0 cursor-pointer flex items-center gap-2 border ${
              selectedShipmentId === sh.id
                ? 'bg-[#582C7B] text-white border-[#582C7B] shadow-xs'
                : 'bg-white text-stone-700 border-purple-200 hover:bg-purple-50'
            }`}
          >
            <span>{sh.trackingCode}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-xs font-sans font-bold ${
                sh.stage === 3
                  ? 'bg-emerald-100 text-emerald-800'
                  : sh.stage === 2
                  ? 'bg-pink-100 text-pink-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {sh.stage === 3
                ? 'Entregado'
                : sh.stage === 2
                ? 'En Reparto Local'
                : 'En Carretera'}
            </span>
          </button>
        ))}
      </div>

      {/* MAIN ACTIVE SHIPMENT CARD */}
      <div className="bg-white p-5 rounded-sm border-2 border-purple-200 shadow-xs space-y-5">
        
        {/* Top Header of the shipment */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-impact uppercase tracking-wider text-stone-500">
                Guía de Insumos Proveedor:
              </span>
              <span className="text-xl font-impact tracking-wider text-[#582C7B] bg-purple-50 px-2.5 py-0.5 rounded-sm border border-purple-200">
                {activeShipment.trackingCode}
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-pink-100 text-[#D94680] text-[11px] font-bold">
                {activeShipment.progressPercent}% de trayecto completado
              </span>
            </div>

            <div className="text-xs text-stone-700 flex flex-wrap gap-x-3 gap-y-1 items-center pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#582C7B]" />
                Proveedor: <strong>{activeShipment.supplierName}</strong>
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#D94680]" />
                Vendedor / Destino: <strong>{activeShipment.sellerDestination}</strong>
              </span>
              <span className="text-stone-300">•</span>
              <span>
                Insumos: <strong>{activeShipment.materialDesc}</strong> ({activeShipment.quantity})
              </span>
            </div>
          </div>

          {/* Action buttons for seller */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={advanceStage}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-sm bg-[#D94680] hover:bg-[#c23670] text-white text-xs font-impact uppercase tracking-wider transition cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Avanzar etapa de trayecto"
            >
              <Activity className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Avanzar Paso del Insumo</span>
            </button>

            <button
              onClick={handleContactSupplierWhatsApp}
              className="px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-impact uppercase tracking-wider transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-100" />
              <span>Contactar al Proveedor (WhatsApp)</span>
            </button>

            {activeShipment.stage === 3 && (
              <button
                onClick={handleAddToInventory}
                className="px-3.5 py-2 rounded-sm bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-impact uppercase tracking-wider transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ArchiveRestore className="w-3.5 h-3.5 text-pink-300" />
                <span>Ingresar a mi Inventario</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* LAS 3 PREGUNTAS CLAVE DEL VENDEDOR: CÓMO, DÓNDE Y CUÁNDO */}
        {/* ======================================================== */}
        <div>
          <span className="text-[11px] font-impact uppercase tracking-wider text-[#582C7B] block mb-2">
            Información Clave para el Vendedor (Cómo, Dónde y Cuándo viene):
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. ¿CÓMO VIENE TU INSUMO? */}
            <div className="p-4 rounded-sm border-2 border-pink-200 bg-pink-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-sm bg-[#D94680] text-white flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-impact uppercase tracking-wider text-pink-800 block">
                      Medio y Cuidado
                    </span>
                    <h4 className="text-xs font-impact uppercase text-stone-900">
                      1. ¿CÓMO VIENE?
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-[#D94680] text-white">
                  Protegido
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block">Transporte:</span>
                  <p className="text-stone-800 font-semibold leading-snug">
                    {activeShipment.transportMode}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-stone-600 block">Embalaje y Sellos:</span>
                  <p className="text-[11px] text-stone-700 leading-snug">
                    {activeShipment.packagingProtection}
                  </p>
                </div>

                {activeShipment.driverName && (
                  <div className="pt-1 border-t border-pink-200/60 text-[11px] text-stone-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Operador:</strong> {activeShipment.driverName} ({activeShipment.driverVehicle})</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. ¿DÓNDE VIENE TU INSUMO? */}
            <div className="p-4 rounded-sm border-2 border-purple-200 bg-purple-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-sm bg-[#582C7B] text-white flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-impact uppercase tracking-wider text-purple-800 block">
                      Ubicación en Ruta
                    </span>
                    <h4 className="text-xs font-impact uppercase text-stone-900">
                      2. ¿DÓNDE VIENE?
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-[#582C7B] text-white flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-300 animate-ping" />
                  En Vivo
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block">Punto Actual:</span>
                  <p className="text-[#582C7B] font-bold text-xs leading-snug">
                    {activeShipment.currentLocationName}
                  </p>
                </div>

                <div className="space-y-1 text-[11px] text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#582C7B]" />
                    <span><strong>Origen:</strong> {activeShipment.supplierLocation}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D94680]" />
                    <span><strong>Destino:</strong> {activeShipment.sellerDestination}</span>
                  </div>
                </div>

                {onGoToSafeRoutes && (
                  <button
                    onClick={onGoToSafeRoutes}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-sm bg-white hover:bg-purple-100 border border-purple-300 text-[#582C7B] text-[11px] font-impact uppercase tracking-wider transition text-center cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-3 h-3 text-[#D94680]" />
                    <span>Ver Mapa de Puntos Seguros</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. ¿CUÁNDO VIENE TU INSUMO? */}
            <div className="p-4 rounded-sm border-2 border-pink-200 bg-pink-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-sm bg-[#582C7B] text-white flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-impact uppercase tracking-wider text-purple-800 block">
                      Fecha y Hora (ETA)
                    </span>
                    <h4 className="text-xs font-impact uppercase text-stone-900">
                      3. ¿CUÁNDO VIENE?
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-emerald-600 text-white">
                  A Tiempo
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block">Llegada Estimada:</span>
                  <p className="text-lg font-impact tracking-wider text-[#582C7B]">
                    {activeShipment.estimatedArrivalText}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-stone-600 block">Tiempo Restante:</span>
                  <p className="text-xs font-semibold text-[#D94680]">
                    ⏳ {activeShipment.remainingMinutesText}
                  </p>
                </div>

                <div className="p-2 rounded-xs bg-white border border-pink-200 text-[11px] text-stone-600">
                  💡 <strong>Consejo para el vendedor:</strong> Ten listo el espacio de almacén para abrir y verificar el filamento contra humedad al momento de recibir.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* STEPPER: 4 ETAPAS DEL INSUMO PROVEEDOR -> VENDEDOR */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-impact uppercase tracking-wider text-stone-900">
              Progreso del Insumo en Ruta:
            </span>
            <span className="text-xs font-bold text-[#582C7B]">
              Etapa {activeShipment.stage + 1} de 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {stageTitles.map((st) => (
              <div
                key={st.step}
                className={`p-3.5 rounded-sm border-2 transition ${
                  activeShipment.stage === st.step
                    ? 'border-[#D94680] bg-pink-50 shadow-xs'
                    : activeShipment.stage > st.step
                    ? 'border-[#582C7B] bg-purple-50'
                    : 'border-stone-200 bg-stone-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-impact uppercase tracking-wider text-stone-900">
                    {st.title}
                  </span>
                  {activeShipment.stage > st.step ? (
                    <CheckCircle2 className="w-4 h-4 text-[#582C7B]" />
                  ) : activeShipment.stage === st.step ? (
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D94680] animate-ping" />
                  ) : null}
                </div>
                <span className="text-[11px] font-bold text-[#582C7B] block">
                  {st.subtitle}
                </span>
                <p className="text-[10px] text-stone-600 mt-1 leading-tight">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* VISUAL SCHEMATIC ROUTE MAP (PROVEEDOR -> VENDEDOR) */}
        <div className="p-4 rounded-sm border-2 border-purple-200 bg-stone-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#582C7B]" />
              <span className="text-xs font-impact uppercase tracking-wider text-stone-900">
                Trayecto de Entrega: Bodega Proveedor ➔ Tu Taller
              </span>
            </div>
            <span className="text-[10px] font-bold text-stone-500 uppercase">
              Ruta Segura Morelia
            </span>
          </div>

          {/* SVG Map Schematic */}
          <div className="relative w-full h-32 bg-white rounded-sm border border-purple-100 p-2 overflow-hidden flex items-center justify-between">
            {/* Background grid */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <pattern id="routeGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#582C7B" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#routeGrid)" />
            </svg>

            {/* Connecting Route Line */}
            <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-2 bg-purple-100 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-[#582C7B] to-[#D94680] rounded-full transition-all duration-500"
                style={{ width: `${activeShipment.progressPercent}%` }}
              />
            </div>

            {/* Stop 1: Proveedor */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-sm bg-[#582C7B] text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 mt-1 block">Bodega Proveedor</span>
              <span className="text-[9px] text-stone-500">Morelia</span>
            </div>

            {/* Stop 2: En Carretera / Autopista */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`w-9 h-9 rounded-sm flex items-center justify-center transition ${
                  activeShipment.stage >= 1
                    ? 'bg-[#582C7B] text-white shadow-xs'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 mt-1 block">Vía Principal</span>
              <span className="text-[9px] text-stone-500">Casetas / Tránsito</span>
            </div>

            {/* Moving Vehicle Indicator based on progress */}
            <div
              className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-700"
              style={{ left: `calc(10% + ${activeShipment.progressPercent * 0.75}%)` }}
            >
              <div className="w-8 h-8 rounded-full bg-[#D94680] text-white flex items-center justify-center shadow-md animate-bounce">
                <Truck className="w-4 h-4" />
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                Aquí viene tu insumo
              </div>
            </div>

            {/* Stop 3: Reparto Local */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`w-9 h-9 rounded-sm flex items-center justify-center transition ${
                  activeShipment.stage >= 2
                    ? 'bg-[#D94680] text-white shadow-xs'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                <Navigation className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 mt-1 block">Reparto Local</span>
              <span className="text-[9px] text-stone-500">En tu zona</span>
            </div>

            {/* Stop 4: Vendedor Taller */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-sm flex items-center justify-center transition ${
                  activeShipment.stage >= 3
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 mt-1 block">Tu Taller</span>
              <span className="text-[9px] text-stone-500">Destino Final</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-1">
            <span>
              <strong>Ubicación actual reportada:</strong> {activeShipment.currentLocationName}
            </span>
            <span>
              <strong>Tiempo estimado de arribo:</strong> {activeShipment.remainingMinutesText}
            </span>
          </div>
        </div>

      </div>

      {/* RETAIL / VENDOR CARE: PROTECCIÓN DE INSUMOS INDUSTRIALES EN CARRETERAS DE MÉXICO */}
      <div className="space-y-3">
        <h4 className="text-xs font-impact uppercase tracking-wider text-stone-800">
          Cómo protegen los proveedores el envío de tus insumos hasta tu taller:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-sm border-2 border-purple-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#582C7B]" />
              <h5 className="text-xs font-impact uppercase text-stone-900">
                1. Carreteras con Curvas y Baches
              </h5>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Las bobinas de filamento PLA y resinas viajan sujetas con soportes amortiguados. Esto evita que los carretes de plástico se fisuren o se enreden durante el viaje por carreteras de Michoacán.
            </p>
          </div>

          <div className="bg-white p-4 rounded-sm border-2 border-purple-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-[#D94680]" />
              <h5 className="text-xs font-impact uppercase text-stone-900">
                2. Lluvia, Humedad y Calor en Tránsito
              </h5>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              El filamento absorbe humedad del aire en climas lluviosos. Tu proveedor despacha con bolsa sellada al vacío y perlas desecantes para que tus impresiones 3D no presenten burbujas ni hilos.
            </p>
          </div>

          <div className="bg-white p-4 rounded-sm border-2 border-purple-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#582C7B]" />
              <h5 className="text-xs font-impact uppercase text-stone-900">
                3. Tramos Sin Cobertura de Celular
              </h5>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Si la camioneta o moto de reparto pasa por zonas serranas o túneles sin señal 4G, el sistema almacena el último punto registrado en tu app y se sincroniza en cuanto retoma cobertura.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="bg-white p-4 rounded-sm border-2 border-[#582C7B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <PackageCheck className="w-5 h-5 text-[#582C7B] shrink-0" />
          <span className="text-stone-700">
            ¿Necesitas pedir más filamento o resina con entrega el mismo día en Morelia?
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onGoToSuppliers && (
            <button
              onClick={onGoToSuppliers}
              className="px-3 py-1.5 rounded-sm bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-impact uppercase tracking-wider shrink-0 transition"
            >
              Ver Proveedores Locales
            </button>
          )}
          {onGoToSafeRoutes && (
            <button
              onClick={onGoToSafeRoutes}
              className="px-3 py-1.5 rounded-sm bg-pink-50 hover:bg-pink-100 border border-[#D94680] text-[#D94680] text-xs font-impact uppercase tracking-wider shrink-0 transition"
            >
              Rutas y Puntos Seguros
            </button>
          )}
        </div>
      </div>

      {/* MODAL: REGISTRAR NUEVA GUÍA DE INSUMO DE PROVEEDOR */}
      {showNewShipmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-sm border-2 border-purple-300 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#582C7B]" />
                <h3 className="text-sm font-impact uppercase tracking-wider text-stone-900">
                  Rastrear Nuevo Envío de Proveedor a Vendedor
                </h3>
              </div>
              <button
                onClick={() => setShowNewShipmentModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Número de Guía o Rastreo
                </label>
                <input
                  type="text"
                  required
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  className="w-full p-2 rounded-sm border border-stone-300 focus:border-[#582C7B] focus:outline-none"
                  placeholder="Ej. GUIA-PROV-443"
                />
              </div>

              <div>
                <span className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
                  Elegir Proveedor Frecuente en Morelia:
                </span>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewSupplier('Tecno3D Morelia / Filamentos & Refacciones');
                      setNewSupplierPhone('+524431038730');
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-purple-50 text-[#582C7B] hover:bg-purple-100 border border-purple-200 font-medium transition cursor-pointer"
                  >
                    Tecno3D Morelia (443 103 8730)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSupplier('3D PRINT3D Morelia');
                      setNewSupplierPhone('+524432417613');
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-purple-50 text-[#582C7B] hover:bg-purple-100 border border-purple-200 font-medium transition cursor-pointer"
                  >
                    3D PRINT3D (443 241 7613)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSupplier('3D Market Morelia');
                      setNewSupplierPhone('+524433129080');
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-purple-50 text-[#582C7B] hover:bg-purple-100 border border-purple-200 font-medium transition cursor-pointer"
                  >
                    3D Market (443 312 9080)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Nombre del Proveedor
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full p-2 rounded-sm border border-stone-300 focus:border-[#582C7B] focus:outline-none"
                    placeholder="Ej. 3D PRINT3D Morelia"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    WhatsApp del Proveedor
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="w-full p-2 rounded-sm border border-stone-300 focus:border-[#582C7B] focus:outline-none"
                    placeholder="+524432417613"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Descripción del Insumo / Material
                </label>
                <input
                  type="text"
                  required
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  className="w-full p-2 rounded-sm border border-stone-300 focus:border-[#582C7B] focus:outline-none"
                  placeholder="Ej. 3 Carretes PETG Negro + 1 Botella Resina"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Llegada Estimada (ETA)
                  </label>
                  <input
                    type="text"
                    required
                    value={newETA}
                    onChange={(e) => setNewETA(e.target.value)}
                    className="w-full p-2 rounded-sm border border-stone-300 focus:border-[#582C7B] focus:outline-none"
                    placeholder="Hoy, 05:30 PM"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Tipo de Transporte
                  </label>
                  <select
                    value={newTransport}
                    onChange={(e) => setNewTransport(e.target.value)}
                    className="w-full p-2 rounded-sm border border-stone-300 focus:border-[#582C7B] focus:outline-none bg-white"
                  >
                    <option value="Reparto express local en Morelia">Reparto express local en Morelia</option>
                    <option value="Paquetería terrestre consolidada (Estafeta/DHL)">Paquetería terrestre consolidada (Estafeta/DHL)</option>
                    <option value="Entrega directa en camioneta climatizada">Entrega directa en camioneta climatizada</option>
                    <option value="Retiro / Entrega en Punto Rosa Seguro">Retiro / Entrega en Punto Rosa Seguro</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-sm border border-purple-200 text-stone-600 text-[11px]">
                📦 El insumo se registrará con destino a tu taller o negocio de ventas en Morelia, permitiéndote rastrear su avance en vivo.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setShowNewShipmentModal(false)}
                  className="px-3.5 py-2 rounded-sm border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-impact uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-sm bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-impact uppercase tracking-wider cursor-pointer"
                >
                  Comenzar Rastreo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
