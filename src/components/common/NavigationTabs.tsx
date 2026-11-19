import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  MapPin,
  Calculator,
  Award,
  Store,
  Truck,
  Package,
  Layers,
  FileSpreadsheet,
  Users2
} from 'lucide-react';

export type TabId =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'material_alerts'
  | 'pricing'
  | 'logistics'
  | 'deliveries'
  | 'suppliers'
  | 'group_buy'
  | 'finances'
  | 'credit';

interface Props {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isPremium: boolean;
  ordersCount: number;
  lowStockCount: number;
  productsCount?: number;
  cartCount?: number;
  onOpenCrisisBot?: () => void;
}

interface TabConfig {
  id: TabId;
  label: string;
  sublabel: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  // Distinct pastel tones in shades of pinks and lilacs
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  inactiveSubtext: string;
  iconBg: string;
  iconColor: string;
}

export const NavigationTabs: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  ordersCount,
  lowStockCount,
  productsCount = 0,
  cartCount = 0
}) => {
  // Paleta de colores rosas y lilas diferenciados para cada uno de los 11 menús
  // En estado activo, fondo blanco puro (#FFFFFF), marco sólido y contraste elegante
  const tabs: TabConfig[] = [
    {
      id: 'dashboard',
      label: 'Panel Principal',
      sublabel: 'Resumen financiero',
      icon: LayoutDashboard,
      inactiveBg: 'bg-[#FDF2F8]/70 hover:bg-[#FDF2F8]',
      inactiveBorder: 'border-[#FCE7F3]',
      inactiveText: 'text-[#9D174D]',
      inactiveSubtext: 'text-[#BE185D]/75',
      iconBg: 'bg-[#FCE7F3]',
      iconColor: 'text-[#BE185D]'
    },
    {
      id: 'products',
      label: 'Mis Productos',
      sublabel: 'Catálogo de piezas',
      icon: Store,
      badge: productsCount > 0 ? `${productsCount}` : undefined,
      badgeColor: 'bg-[#D94680] text-white',
      inactiveBg: 'bg-[#F5F3FF]/70 hover:bg-[#F5F3FF]',
      inactiveBorder: 'border-[#EDE9FE]',
      inactiveText: 'text-[#5B21B6]',
      inactiveSubtext: 'text-[#6D28D9]/75',
      iconBg: 'bg-[#EDE9FE]',
      iconColor: 'text-[#6D28D9]'
    },
    {
      id: 'inventory',
      label: 'Inventario',
      sublabel: 'Existencias de filamento',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
      badgeColor: 'bg-[#EC4899] text-white',
      inactiveBg: 'bg-[#FFF1F2]/70 hover:bg-[#FFF1F2]',
      inactiveBorder: 'border-[#FFE4E6]',
      inactiveText: 'text-[#9F1239]',
      inactiveSubtext: 'text-[#BE123C]/75',
      iconBg: 'bg-[#FFE4E6]',
      iconColor: 'text-[#BE123C]'
    },
    {
      id: 'material_alerts',
      label: 'Aviso de Materiales',
      sublabel: 'Insumos por agotarse',
      icon: Package,
      badge: 'Alerta',
      badgeColor: 'bg-[#D94680] text-white',
      inactiveBg: 'bg-[#FAF5FF]/70 hover:bg-[#FAF5FF]',
      inactiveBorder: 'border-[#F5D0FE]',
      inactiveText: 'text-[#86198F]',
      inactiveSubtext: 'text-[#A21CAF]/75',
      iconBg: 'bg-[#F5D0FE]',
      iconColor: 'text-[#A21CAF]'
    },
    {
      id: 'pricing',
      label: 'Precio Inteligente',
      sublabel: 'Calculadora y algoritmos',
      icon: Calculator,
      inactiveBg: 'bg-[#F3E8FF]/70 hover:bg-[#F3E8FF]',
      inactiveBorder: 'border-[#E9D5FF]',
      inactiveText: 'text-[#6B21A8]',
      inactiveSubtext: 'text-[#7E22CE]/75',
      iconBg: 'bg-[#E9D5FF]',
      iconColor: 'text-[#7E22CE]'
    },
    {
      id: 'logistics',
      label: 'Rutas Seguras',
      sublabel: 'Puntos de entrega',
      icon: MapPin,
      badge: ordersCount > 0 ? `${ordersCount}` : undefined,
      badgeColor: 'bg-[#8B5CF6] text-white',
      inactiveBg: 'bg-[#FDF4FF]/70 hover:bg-[#FDF4FF]',
      inactiveBorder: 'border-[#FAE8FF]',
      inactiveText: 'text-[#701A75]',
      inactiveSubtext: 'text-[#86198F]/75',
      iconBg: 'bg-[#FAE8FF]',
      iconColor: 'text-[#86198F]'
    },
    {
      id: 'deliveries',
      label: 'Envíos de Insumos',
      sublabel: 'Proveedor a Vendedor',
      icon: Truck,
      badge: 'Insumos',
      badgeColor: 'bg-[#582C7B] text-white',
      inactiveBg: 'bg-[#FFF1F2]/50 hover:bg-[#FFF1F2]',
      inactiveBorder: 'border-[#FFE4E6]',
      inactiveText: 'text-[#881337]',
      inactiveSubtext: 'text-[#9F1239]/75',
      iconBg: 'bg-[#FFE4E6]',
      iconColor: 'text-[#9F1239]'
    },
    {
      id: 'suppliers',
      label: 'Proveedores Locales',
      sublabel: 'Morelia e insumos',
      icon: Layers,
      badge: cartCount > 0 ? `Carrito (${cartCount})` : 'Morelia',
      badgeColor: 'bg-[#D94680] text-white',
      inactiveBg: 'bg-[#F3E5F5]/60 hover:bg-[#F3E5F5]',
      inactiveBorder: 'border-[#E1BEE7]',
      inactiveText: 'text-[#4A148C]',
      inactiveSubtext: 'text-[#6A1B9A]/75',
      iconBg: 'bg-[#E1BEE7]',
      iconColor: 'text-[#6A1B9A]'
    },
    {
      id: 'group_buy',
      label: 'Compras Mayoreo',
      sublabel: 'Ahorro colaborativo',
      icon: Users2,
      badge: '-35%',
      badgeColor: 'bg-[#D94680] text-white',
      inactiveBg: 'bg-[#FCE4EC]/60 hover:bg-[#FCE4EC]',
      inactiveBorder: 'border-[#F8BBD0]',
      inactiveText: 'text-[#880E4F]',
      inactiveSubtext: 'text-[#AD1457]/75',
      iconBg: 'bg-[#F8BBD0]',
      iconColor: 'text-[#AD1457]'
    },
    {
      id: 'finances',
      label: 'Mis Cuentas',
      sublabel: 'Facturación y RESICO',
      icon: FileSpreadsheet,
      inactiveBg: 'bg-[#E1BEE7]/25 hover:bg-[#E1BEE7]/40',
      inactiveBorder: 'border-[#CE93D8]',
      inactiveText: 'text-[#4A148C]',
      inactiveSubtext: 'text-[#7B1FA2]/75',
      iconBg: 'bg-[#E1BEE7]/60',
      iconColor: 'text-[#7B1FA2]'
    },
    {
      id: 'credit',
      label: 'Crédito y Finanzas',
      sublabel: 'Puntaje del taller',
      icon: Award,
      badge: '845 pts',
      badgeColor: 'bg-[#582C7B] text-white',
      inactiveBg: 'bg-[#F8E8F8] hover:bg-[#F3E0F3]',
      inactiveBorder: 'border-[#E9D0E9]',
      inactiveText: 'text-[#582C7B]',
      inactiveSubtext: 'text-[#7B3F9E]/75',
      iconBg: 'bg-[#EAD4EA]',
      iconColor: 'text-[#582C7B]'
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border border-zinc-200/80 rounded-xl p-3 shadow-xs">
      <div className="pb-2.5 mb-2.5 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Módulos
        </span>
        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
          11 Herramientas
        </span>
      </div>

      <nav className="flex flex-col space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer border ${
                isActive
                  ? 'bg-white text-zinc-950 border-zinc-900 shadow-xs ring-1 ring-zinc-900/10'
                  : `${tab.inactiveBg} ${tab.inactiveBorder}`
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {Icon && (
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-zinc-900 text-white' : `${tab.iconBg} ${tab.iconColor}`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="truncate">
                  <div
                    className={`text-xs font-semibold leading-tight truncate ${
                      isActive ? 'text-zinc-950 font-bold' : tab.inactiveText
                    }`}
                  >
                    {tab.label}
                  </div>
                  <div
                    className={`text-[10px] leading-tight truncate mt-0.5 ${
                      isActive ? 'text-zinc-400' : tab.inactiveSubtext
                    }`}
                  >
                    {tab.sublabel}
                  </div>
                </div>
              </div>

              {tab.badge && (
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1.5 ${
                    isActive ? 'bg-zinc-100 text-zinc-800' : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
