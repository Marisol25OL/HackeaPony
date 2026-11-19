import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  RefreshCw,
  Plus,
  CheckCircle2,
  TrendingDown,
  ShoppingBag,
  Store,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  dailyUsage: number;
  criticalThreshold: number;
  reorderPoint: string;
  status: 'critical' | 'warning' | 'healthy';
}

interface Props {
  onGoToWholesale?: () => void;
  onGoToSuppliers?: () => void;
}

export const MaterialDepletionView: React.FC<Props> = ({
  onGoToWholesale,
  onGoToSuppliers
}) => {
  const [materials, setMaterials] = useState<MaterialItem[]>([
    {
      id: 'mat-1',
      name: 'Materia Prima Principal (Filamento / Telas / Insumo Base)',
      category: 'Producción',
      currentStock: 320,
      unit: 'g o unidades',
      dailyUsage: 65,
      criticalThreshold: 5,
      reorderPoint: 'Yunuen 131 Félix Ireta o Proveedor Local',
      status: 'critical'
    },
    {
      id: 'mat-2',
      name: 'Cajas y Empaques Protectores de Entrega',
      category: 'Empaque y Envíos',
      currentStock: 14,
      unit: 'cajas',
      dailyUsage: 3,
      criticalThreshold: 5,
      reorderPoint: 'Compra por Mayoreo',
      status: 'warning'
    },
    {
      id: 'mat-3',
      name: 'Etiquetas de Marca y Cintas Adhesivas',
      category: 'Presentación',
      currentStock: 120,
      unit: 'etiquetas',
      dailyUsage: 4,
      criticalThreshold: 10,
      reorderPoint: 'Papelería / Imprenta Local',
      status: 'healthy'
    },
    {
      id: 'mat-4',
      name: 'Bolsas Ecológicas para Entregas Personales',
      category: 'Atención al Cliente',
      currentStock: 45,
      unit: 'piezas',
      dailyUsage: 2,
      criticalThreshold: 8,
      reorderPoint: 'Distribuidora del Centro',
      status: 'healthy'
    }
  ]);

  const [newMaterialName, setNewMaterialName] = useState('');
  const [newStock, setNewStock] = useState(100);
  const [newDailyUsage, setNewDailyUsage] = useState(10);
  const [newUnit, setNewUnit] = useState('piezas');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim()) return;

    const days = Math.round(newStock / (newDailyUsage || 1));
    const status: 'critical' | 'warning' | 'healthy' =
      days <= 4 ? 'critical' : days <= 7 ? 'warning' : 'healthy';

    const newItem: MaterialItem = {
      id: `mat-${Date.now()}`,
      name: newMaterialName,
      category: 'Insumo de Negocio',
      currentStock: newStock,
      unit: newUnit,
      dailyUsage: newDailyUsage,
      criticalThreshold: 5,
      reorderPoint: 'Proveedor habitual',
      status
    };

    setMaterials((prev) => [newItem, ...prev]);
    setNewMaterialName('');
    setShowAddForm(false);
    confetti({ particleCount: 40, spread: 60 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-sm p-5 sm:p-6 border-2 border-purple-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-sm bg-[#582C7B] text-white flex items-center justify-center border border-[#472264] shadow-xs">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-impact uppercase tracking-wider text-stone-900">
              Aviso de Materiales por Terminar
            </h3>
            <p className="text-xs text-stone-600 font-sans">
              Calcula cuántos días te quedan de cada insumo según tus ventas para no quedarte sin mercancía ni atrasar pedidos.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-2 rounded-sm bg-[#D94680] hover:bg-[#c23670] text-white text-xs font-impact uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cerrar Registro' : 'Registrar Nuevo Material'}</span>
        </button>
      </div>

      {/* Add New Material Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMaterial}
          className="bg-purple-50 p-5 rounded-sm border-2 border-purple-300 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-impact uppercase tracking-wider text-[#582C7B]">
              Registrar Material o Insumo de tu Negocio
            </h4>
            <span className="text-[10px] text-stone-500 font-bold">Cálculo Automático de Días Restantes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                Nombre del Material o Producto:
              </label>
              <input
                type="text"
                required
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="Ej. Cajas de regalo, tela, harina, bolsas, etc."
                className="w-full px-3 py-2 bg-white rounded-sm border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#582C7B]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                Cantidad Actual en Taller:
              </label>
              <input
                type="number"
                min="1"
                required
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white rounded-sm border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#582C7B]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                Gasto Promedio por Día:
              </label>
              <input
                type="number"
                min="1"
                required
                value={newDailyUsage}
                onChange={(e) => setNewDailyUsage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white rounded-sm border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#582C7B]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-sm bg-white border border-stone-300 text-stone-700 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-sm bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-impact uppercase tracking-wider shadow-xs"
            >
              Guardar y Monitorear
            </button>
          </div>
        </form>
      )}

      {/* Material Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {materials.map((item) => {
          const daysLeft = Math.round(item.currentStock / (item.dailyUsage || 1));
          const isCritical = daysLeft <= 4;
          const isWarning = daysLeft > 4 && daysLeft <= 7;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-sm border-2 space-y-3 bg-white flex flex-col justify-between ${
                isCritical
                  ? 'border-[#D94680] bg-[#FFF1F2]'
                  : isWarning
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-stone-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    {item.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[10px] font-impact uppercase ${
                      isCritical
                        ? 'bg-[#D94680] text-white animate-pulse'
                        : isWarning
                        ? 'bg-[#582C7B] text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {daysLeft} días restantes
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                  {item.name}
                </h4>
              </div>

              <div className="space-y-1.5 text-xs text-stone-700 bg-white/80 p-2.5 rounded-sm border border-stone-200">
                <div className="flex justify-between">
                  <span>Inventario disponible:</span>
                  <strong>{item.currentStock} {item.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Uso diario estimado:</span>
                  <strong>{item.dailyUsage} / día</strong>
                </div>
                <div className="flex justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                  <span>Surtir en:</span>
                  <span className="font-semibold text-stone-800 truncate max-w-[130px]">{item.reorderPoint}</span>
                </div>
              </div>

              <div className="pt-2">
                {isCritical ? (
                  <button
                    onClick={onGoToSuppliers}
                    className="w-full py-2 rounded-sm bg-[#D94680] hover:bg-[#c23670] text-white text-xs font-impact uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Comprar Insumo Ahora</span>
                  </button>
                ) : (
                  <button
                    onClick={onGoToWholesale}
                    className="w-full py-2 rounded-sm bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-impact uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-pink-300" />
                    <span>Ver Compras por Mayoreo</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Helpful Advice Banner */}
      <div className="bg-white p-5 rounded-sm border-2 border-[#582C7B] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-impact uppercase tracking-wider text-[#582C7B]">
            Consejo para no detener tu producción
          </h4>
          <p className="text-xs text-stone-600 mt-0.5">
            Cuando un material te marque menos de 5 días, pide anticipo del 50% a tus clientes para surtirte con tus proveedores locales sin descapitalizarte.
          </p>
        </div>
        <button
          onClick={onGoToWholesale}
          className="px-4 py-2 rounded-sm bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-impact uppercase tracking-wider shrink-0 transition cursor-pointer"
        >
          Ahorrar en Compras por Mayoreo
        </button>
      </div>
    </div>
  );
};
