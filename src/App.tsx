/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  db,
  seedInitialDataIfNeeded,
  resetDatabaseToDefaults,
  type Transaction,
  type InventoryItem,
  type CustomerOrder,
  type SupplierMaterialOrder,
  type DailyFactura,
  type GroupPurchase,
  type ProductItem,
  type CartItem,
  type LocalSupplier
} from './db/indexedDB';
import { Header } from './components/common/Header';
import { NavigationTabs, type TabId } from './components/common/NavigationTabs';
import { VersionSidebar } from './components/layout/VersionSidebar';
import { OfflineModeBanner } from './components/common/OfflineModeBanner';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { KPICards } from './components/dashboard/KPICards';
import { SalesChart } from './components/dashboard/SalesChart';
import { TrustScoreWidget } from './components/dashboard/TrustScoreWidget';
import { BusinessHealthCredit } from './components/credit/BusinessHealthCredit';
import { VoiceAssistantModal } from './components/assistant/VoiceAssistantModal';
import { AccountingModule } from './components/financials/AccountingModule';
import { BillingSATModal } from './components/financials/BillingSATModal';
import { FreemiumLimitModal } from './components/financials/FreemiumLimitModal';
import { InventoryTable } from './components/inventory/InventoryTable';
import { SmartPricingCalculator } from './components/inventory/SmartPricingCalculator';
import { ProductShowcase } from './components/products/ProductShowcase';
import { MoreliaSuppliersAndCart } from './components/suppliers/MoreliaSuppliersAndCart';
import { SafeRouteMap } from './components/logistics/SafeRouteMap';
import { OrdersKanban } from './components/logistics/OrdersKanban';
import { GroupPurchases } from './components/b2b/GroupPurchases';
import { MaterialDepletionView } from './components/inventory/MaterialDepletionView';
import { SupplyChainTracker } from './components/logistics/SupplyChainTracker';
import { BusinessCrisisChatModal } from './components/assistant/BusinessCrisisChatModal';
import { Sparkles, Heart, ShieldAlert } from 'lucide-react';
import { MyFimesLogo } from './components/common/MyFimesLogo';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isBillingOpen, setIsBillingOpen] = useState<boolean>(false);
  const [isFreemiumLimitOpen, setIsFreemiumLimitOpen] = useState<boolean>(false);
  const [isCrisisChatOpen, setIsCrisisChatOpen] = useState<boolean>(false);

  // System-Wide Offline Mode Controller
  const { isOnline, isManualOffline, toggleManualOffline } = useOnlineStatus();

  // Database reactive state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [materialOrders, setMaterialOrders] = useState<SupplierMaterialOrder[]>([]);
  const [facturas, setFacturas] = useState<DailyFactura[]>([]);
  const [groupPurchases, setGroupPurchases] = useState<GroupPurchase[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const refreshData = async () => {
    try {
      await seedInitialDataIfNeeded();
    } catch (seedErr) {
      console.warn('Seed notice:', seedErr);
    }

    try {
      const txs = await db.transactions.toArray();
      const inv = await db.inventory.toArray();
      const ord = await db.orders.toArray();
      const mats = await db.materialOrders.toArray();
      const fac = await db.facturasDaily.toArray();
      const grp = await db.groupPurchases.toArray();
      const prods = await db.products.toArray();
      const cart = await db.cartItems.toArray();
      const supps = await db.localSuppliers.toArray();

      setTransactions(txs);
      setInventory(inv);
      setOrders(ord);
      setMaterialOrders(mats);
      setFacturas(fac);
      setGroupPurchases(grp);
      setProducts(prods);
      setCartItems(cart);
      setSuppliers(supps);
      setIsDataLoaded(true);
    } catch (err) {
      console.error('Error loading MiFyMEs database:', err);
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Today calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFacturasCount = facturas.filter((f) => f.dateStr === todayStr).length;

  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const todayIncome = todayTransactions.filter((t) => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const dailyCashflow = todayIncome - todayExpense;

  const monthlySales = transactions.filter((t) => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netMarginPct = monthlySales > 0 ? ((monthlySales - monthlyExpenses) / monthlySales) * 100 : 68.5;

  const lowStockCount = inventory.filter((i) => i.status === 'critical' || i.status === 'reorder_soon').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF8F6] text-zinc-800 font-sans selection:bg-pink-100 selection:text-pink-900">
      
      {/* System-Wide Offline Mode Banner with manual toggle */}
      <OfflineModeBanner
        isOnline={isOnline}
        isManualOffline={isManualOffline}
        onToggleManualOffline={toggleManualOffline}
        pendingCount={transactions.filter((t) => !t.synced).length}
      />

      {/* Top Header with official MyFimes Logo & Global Supply Search */}
      <Header
        onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
        onSyncComplete={refreshData}
        cartCount={cartItems.reduce((acc, c) => acc + c.quantity, 0)}
        onOpenCart={() => setActiveTab('suppliers')}
        suppliers={suppliers}
        onOpenSuppliersTab={() => setActiveTab('suppliers')}
        onSelectInsumo={(_item) => {
          setActiveTab('suppliers');
        }}
      />

      {/* Mobile Top Navigation & Version bar (Never at the bottom!) */}
      <div className="lg:hidden w-full px-3 pt-3 space-y-2">
        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500">Licencia:</span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-[10px] font-bold">
              {isPremium ? '💎 Premium Pro ($199)' : 'Estándar'}
            </span>
          </div>
          <button
            onClick={() => setIsCrisisChatOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs"
          >
            <ShieldAlert className="w-3 h-3 text-white" />
            <span>SOS Bot</span>
          </button>
        </div>

        {/* Horizontal mobile tab scroller with pink/lilac palette */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'dashboard' as TabId, label: 'Panel', color: 'bg-[#FDF2F8] text-[#9D174D] border-[#FCE7F3]' },
            { id: 'products' as TabId, label: 'Productos', color: 'bg-[#F5F3FF] text-[#5B21B6] border-[#EDE9FE]' },
            { id: 'inventory' as TabId, label: 'Inventario', color: 'bg-[#FFF1F2] text-[#9F1239] border-[#FFE4E6]' },
            { id: 'material_alerts' as TabId, label: 'Insumos', color: 'bg-[#FAF5FF] text-[#86198F] border-[#F5D0FE]' },
            { id: 'pricing' as TabId, label: 'Precios', color: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]' },
            { id: 'logistics' as TabId, label: 'Rutas', color: 'bg-[#FDF4FF] text-[#701A75] border-[#FAE8FF]' },
            { id: 'deliveries' as TabId, label: 'Envíos Insumos', color: 'bg-[#FFF1F2] text-[#881337] border-[#FFE4E6]' },
            { id: 'suppliers' as TabId, label: 'Proveedores', color: 'bg-[#F3E5F5] text-[#4A148C] border-[#E1BEE7]' },
            { id: 'group_buy' as TabId, label: 'Mayoreo', color: 'bg-[#FCE4EC] text-[#880E4F] border-[#F8BBD0]' },
            { id: 'finances' as TabId, label: 'Mis Cuentas', color: 'bg-[#E1BEE7]/40 text-[#4A148C] border-[#CE93D8]' },
            { id: 'credit' as TabId, label: 'Crédito', color: 'bg-[#F8E8F8] text-[#582C7B] border-[#E9D0E9]' },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id)}
              className={`px-3 py-1.5 rounded-lg shrink-0 text-xs font-semibold transition-all border ${
                activeTab === tb.id
                  ? 'bg-white text-zinc-950 border-zinc-900 shadow-2xs font-bold'
                  : tb.color
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container with Left Version Sidebar, Central Content, and Right Navigation Sidebar */}
      <div className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          
          {/* Left Sidebar: Version & License Type (Positioned on the Left, never pushed to bottom) */}
          <div className="hidden lg:block w-64 shrink-0 lg:sticky lg:top-22 self-start">
            <VersionSidebar
              isPremium={isPremium}
              onTogglePremium={() => setIsPremium(!isPremium)}
            />
          </div>

          {/* Central Main View Area */}
          <main className="flex-1 min-w-0 w-full space-y-6">
        
        {/* TAB 1: DASHBOARD PRINCIPAL */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <KPICards
              dailyCashflow={dailyCashflow > 0 ? dailyCashflow : 3450}
              dailyIncome={todayIncome > 0 ? todayIncome : 4230}
              dailyExpenses={todayExpense > 0 ? todayExpense : 780}
              netMarginPct={Math.round(netMarginPct)}
              breakEvenUnits={14}
              monthlySales={monthlySales > 0 ? monthlySales : 28400}
              monthlyTarget={35000}
            />

            {/* Middle Section: Sales History Chart & Trust Score */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <SalesChart />
              </div>
              <div className="lg:col-span-4">
                <TrustScoreWidget
                  score={845}
                  maxScore={1000}
                  onOpenFutureCreditTab={() => setActiveTab('credit')}
                />
              </div>
            </div>

            {/* Quick access to Published Products & Morelia Suppliers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div
                onClick={() => setActiveTab('products')}
                className="bg-white p-4.5 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-sm">
                    📸
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 group-hover:text-zinc-600 transition">
                      Catálogo y Tienda Pública
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      {products.length} piezas 3D publicadas
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md group-hover:bg-zinc-900 group-hover:text-white transition">
                  Ver Tienda →
                </span>
              </div>

              <div
                onClick={() => setActiveTab('suppliers')}
                className="bg-white p-4.5 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-sm">
                    📦
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 group-hover:text-zinc-600 transition">
                      Proveedores Locales (Morelia)
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Filamento PETG, PLA reciclado y pago contraentrega
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md group-hover:bg-zinc-900 group-hover:text-white transition">
                  Pedir Insumos →
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MIS PRODUCTOS PUBLICADOS (NUEVO APARTADO) */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ProductShowcase
              products={products}
              onRefreshProducts={refreshData}
              onOpenPricingCalculator={() => setActiveTab('pricing')}
            />
          </div>
        )}

        {/* TAB 3: INVENTARIO */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <InventoryTable
              items={inventory}
              onOpenRestockGroup={() => setActiveTab('group_buy')}
              onRefreshData={refreshData}
              onGoToSuppliers={() => setActiveTab('suppliers')}
              onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
            />
          </div>
        )}

        {/* TAB 4: AVISO DE MATERIALES POR TERMINAR */}
        {activeTab === 'material_alerts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MaterialDepletionView
              onGoToSuppliers={() => setActiveTab('suppliers')}
              onGoToWholesale={() => setActiveTab('group_buy')}
            />
          </div>
        )}

        {/* TAB 5: PRECIO INTELIGENTE */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <SmartPricingCalculator
              onApplyPriceToCatalog={() => {
                refreshData();
              }}
              onGoToProducts={() => setActiveTab('products')}
            />
          </div>
        )}

        {/* TAB 6: RUTA SEGURA Y PUNTOS DE ENTREGA */}
        {activeTab === 'logistics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <SafeRouteMap
              isPremium={isPremium}
              onUpgradeToPremium={() => setIsFreemiumLimitOpen(true)}
              onGoToSupplyChain={() => setActiveTab('deliveries')}
            />
            <OrdersKanban
              orders={orders}
              inventory={inventory}
              onRefreshOrders={refreshData}
            />
          </div>
        )}

        {/* TAB 7: SEGUIMIENTO DE ENVÍOS DE INSUMOS (PROVEEDOR A VENDEDOR) */}
        {activeTab === 'deliveries' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <SupplyChainTracker
              materialOrders={materialOrders}
              suppliers={suppliers}
              onRefreshData={refreshData}
              onGoToSafeRoutes={() => setActiveTab('logistics')}
              onGoToSuppliers={() => setActiveTab('suppliers')}
              onGoToInventory={() => setActiveTab('inventory')}
            />
          </div>
        )}

        {/* TAB 8: PROVEEDORES LOCALES MORELIA */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MoreliaSuppliersAndCart
              suppliers={suppliers}
              cartItems={cartItems}
              onRefreshData={refreshData}
            />
          </div>
        )}

        {/* TAB 9: COMPRAS POR MAYOREO */}
        {activeTab === 'group_buy' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <GroupPurchases
              groupPurchases={groupPurchases}
              onRefreshData={refreshData}
            />
          </div>
        )}

        {/* TAB 10: CUENTAS Y SAT */}
        {activeTab === 'finances' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <AccountingModule
              transactions={transactions}
              onOpenBillingSAT={() => setIsBillingOpen(true)}
              onOpenNewTransaction={() => setIsVoiceOpen(true)}
              todayInvoicesCount={todayFacturasCount}
              isPremium={isPremium}
            />
          </div>
        )}

        {/* TAB 11: SALUD FINANCIERA & CRÉDITO FUTURO (HASTA EL FINAL) */}
        {activeTab === 'credit' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <BusinessHealthCredit />
          </div>
        )}

          </main>

          {/* Right Sidebar: Main Navigation Tabs (Always on the right, top-aligned) */}
          <div className="hidden lg:block w-64 shrink-0 lg:sticky lg:top-22 self-start">
            <NavigationTabs
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isPremium={isPremium}
              ordersCount={orders.length}
              lowStockCount={lowStockCount}
              productsCount={products.length}
              cartCount={cartItems.reduce((acc, c) => acc + c.quantity, 0)}
              onOpenCrisisBot={() => setIsCrisisChatOpen(true)}
            />
          </div>

        </div>
      </div>

      {/* Footer with MyFimes Branding & Slogan */}
      <footer className="mt-auto border-t border-purple-200 bg-white py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <MyFimesLogo size="sm" showSubtitle={false} />
            <span className="hidden md:inline text-purple-300">•</span>
            <span className="text-[#582C7B] font-semibold italic text-[11px] hidden md:inline">
              "Más que compras, impulsamos sus sueños"
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-stone-500 text-[11px]">
            <span className="text-[#582C7B] font-bold">100% Modo Offline</span>
            <span>•</span>
            <span>Proveedores Locales Morelia</span>
            <span>•</span>
            <span>Facturas SAT CFDI 4.0</span>
            <span>•</span>
            <span>Precio Inteligente</span>
            <span>•</span>
            <span>Seguimiento de Envíos</span>
          </div>
        </div>
      </footer>

      {/* Floating Crisis Bot SOS Button */}
      <button
        onClick={() => setIsCrisisChatOpen(true)}
        className="fixed bottom-5 right-5 z-40 px-3.5 py-2.5 rounded-sm bg-[#D94680] hover:bg-[#c23670] text-white shadow-lg shadow-pink-300 active:scale-95 transition cursor-pointer flex items-center gap-2 border border-pink-300"
        title="Bot Guardián: Auxilio si tu negocio está en riesgo"
      >
        <span className="w-2 h-2 rounded-sm bg-white animate-ping" />
        <ShieldAlert className="w-4 h-4 text-white" />
        <span className="text-xs font-impact uppercase tracking-wider hidden sm:inline">
          Bot SOS Negocio
        </span>
      </button>

      {/* Modals */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTransactionSaved={refreshData}
      />

      <BusinessCrisisChatModal
        isOpen={isCrisisChatOpen}
        onClose={() => setIsCrisisChatOpen(false)}
      />

      <BillingSATModal
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
        todayCount={todayFacturasCount}
        isPremium={isPremium}
        onLimitReached={() => {
          setIsBillingOpen(false);
          setIsFreemiumLimitOpen(true);
        }}
        onInvoiceCreated={refreshData}
      />

      <FreemiumLimitModal
        isOpen={isFreemiumLimitOpen}
        onClose={() => setIsFreemiumLimitOpen(false)}
        onUpgradeToPremium={() => {
          setIsPremium(true);
        }}
      />

    </div>
  );
}
