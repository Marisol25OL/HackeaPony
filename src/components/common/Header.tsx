import React from 'react';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { MyFimesLogo } from './MyFimesLogo';
import { Mic, ShoppingCart } from 'lucide-react';
import { GlobalSupplySearchBar, type GlobalSupplyItem } from './GlobalSupplySearchBar';
import { type LocalSupplier } from '../../db/indexedDB';

interface Props {
  onOpenVoiceAssistant: () => void;
  onSyncComplete?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  suppliers?: LocalSupplier[];
  onSelectInsumo?: (item: GlobalSupplyItem) => void;
  onOpenSuppliersTab?: () => void;
}

export const Header: React.FC<Props> = ({
  onOpenVoiceAssistant,
  onSyncComplete,
  cartCount = 0,
  onOpenCart,
  suppliers = [],
  onSelectInsumo,
  onOpenSuppliersTab
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Brand identity: MyFimes Logo Minimalist */}
        <div className="flex items-center gap-3 shrink-0">
          <MyFimesLogo size="md" showSubtitle={true} />
        </div>

        {/* Global Supply Search Bar for any material / equipment in Morelia & region */}
        <div className="hidden md:flex flex-1 max-w-2xl lg:max-w-3xl mx-3">
          <GlobalSupplySearchBar
            suppliers={suppliers}
            onSelectInsumo={onSelectInsumo}
            onOpenSuppliersTab={onOpenSuppliersTab}
            onRefreshData={onSyncComplete}
          />
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Shopping Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-xs"
            title="Ver Carrito de Compras"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden sm:inline">
              Carrito
            </span>
            {cartCount > 0 && (
              <span className="flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-[#D94680] text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Online / offline status & sync */}
          <OfflineIndicator onSyncComplete={onSyncComplete} />

          {/* Voice Assistant Button: Record Sales by Voice */}
          <button
            onClick={onOpenVoiceAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Mic className="w-3.5 h-3.5 text-purple-200" />
            <span className="hidden sm:inline">Anotar por Voz</span>
            <span className="sm:hidden">Voz</span>
          </button>

        </div>

      </div>

      {/* Mobile-only Supply Search Bar (visible on small screens below header) */}
      <div className="md:hidden px-3 pb-2.5 pt-0.5">
        <GlobalSupplySearchBar
          suppliers={suppliers}
          onSelectInsumo={onSelectInsumo}
          onOpenSuppliersTab={onOpenSuppliersTab}
          onRefreshData={onSyncComplete}
        />
      </div>
    </header>
  );
};
