import React, { useState } from 'react';
import {
  Plus,
  Store,
  Eye,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Tag,
  Clock,
  Layers,
  Edit3,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  X,
  Upload,
  Camera,
  Maximize2,
  Box,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { type ProductItem, db } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  products: ProductItem[];
  onRefreshProducts: () => void;
  onOpenPricingCalculator?: () => void;
}

export const ProductShowcase: React.FC<Props> = ({
  products,
  onRefreshProducts,
  onOpenPricingCalculator
}) => {
  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>('admin');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductItem | null>(null);
  const [stockFeedback, setStockFeedback] = useState<string | null>(null);

  // Form fields for Add / Edit
  const [name, setName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('Llaveros y Accesorios de Moda');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('PLA Silk Rosa Pastel + Base Crema');
  const [color, setColor] = useState('Rosa Pastel y Lavanda');
  const [colorHex, setColorHex] = useState('#F472B6');
  const [retailPrice, setRetailPrice] = useState('85');
  const [directCost, setDirectCost] = useState('18');
  const [printTimeHours, setPrintTimeHours] = useState('1.2');
  const [materialGrams, setMaterialGrams] = useState('22');
  const [stockUnits, setStockUnits] = useState('15');
  const [dimensions, setDimensions] = useState('8.5 x 3.0 cm');
  const [imageUrl, setImageUrl] = useState('/products/llaveros-flores-pastel.svg');

  // Real 3D Printed Photo Assets matching the 6 user uploaded pictures
  const real3DPhotos = [
    {
      title: 'Llaveros Pastel con Flor y Nombre 3D (Sophia, Alisson)',
      url: '/products/llaveros-flores-pastel.svg',
      suggestedCategory: 'Llaveros y Accesorios de Moda',
      suggestedPrice: '85',
      suggestedCost: '18',
      suggestedGrams: '22',
      suggestedHours: '1.2'
    },
    {
      title: 'Set de Macetitas Kawaii Animales (Elefante, Gato, Tortuga)',
      url: '/products/macetas-animales-kawaii.svg',
      suggestedCategory: 'Macetas Tiernas y Decoración de Interiores',
      suggestedPrice: '160',
      suggestedCost: '42',
      suggestedGrams: '65',
      suggestedHours: '3.0'
    },
    {
      title: 'Perchero / Tendedero Miniatura para Aretes con Ganchos',
      url: '/products/perchero-joyeria-morado.svg',
      suggestedCategory: 'Organizadores de Joyería y Vanidad',
      suggestedPrice: '220',
      suggestedCost: '58',
      suggestedGrams: '95',
      suggestedHours: '4.5'
    },
    {
      title: 'Colección Figuras Articuladas Fidget (Ajolote, Pulpo, Dino)',
      url: '/products/figuras-articuladas-fidget.svg',
      suggestedCategory: 'Juguetes Sensoriales y Figuras Articuladas',
      suggestedPrice: '190',
      suggestedCost: '48',
      suggestedGrams: '80',
      suggestedHours: '3.8'
    },
    {
      title: 'Vaso Organizador Textura Corazones en Relieve Fucsia',
      url: '/products/organizador-corazones-rosa.svg',
      suggestedCategory: 'Hogar, Belleza y Accesorios de Escritorio',
      suggestedPrice: '175',
      suggestedCost: '45',
      suggestedGrams: '85',
      suggestedHours: '4.0'
    },
    {
      title: 'Caja Organizadora Multinivel Desplegable para Taller',
      url: '/products/caja-multinivel-taller.svg',
      suggestedCategory: 'Organizadores Técnicos y Herramientas',
      suggestedPrice: '390',
      suggestedCost: '115',
      suggestedGrams: '240',
      suggestedHours: '8.5'
    }
  ];

  // Dynamic list of unique categories created by the user
  const dynamicCategories = Array.from(new Set(products.map((p) => p.category.trim()).filter(Boolean)));

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  // Handle uploading user's personal photo file (FileReader to Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es algo pesada. Selecciona una imagen menor a 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Open modal for creating a new product
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryDesc('Llaveros y Accesorios de Moda');
    setDescription('');
    setMaterial('PLA Silk Rosa Pastel');
    setColor('Rosa Pastel');
    setColorHex('#F472B6');
    setRetailPrice('120');
    setDirectCost('30');
    setPrintTimeHours('2.5');
    setMaterialGrams('45');
    setStockUnits('5');
    setDimensions('10 x 8 cm');
    setImageUrl('/products/llaveros-flores-pastel.svg');
    setShowUploadModal(true);
  };

  // Open modal for editing an existing product
  const handleOpenEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategoryDesc(prod.category);
    setDescription(prod.description);
    setMaterial(prod.material);
    setColor(prod.color);
    setColorHex(prod.colorHex);
    setRetailPrice(prod.retailPrice.toString());
    setDirectCost(prod.directCost.toString());
    setPrintTimeHours(prod.printTimeHours.toString());
    setMaterialGrams(prod.materialGrams.toString());
    setStockUnits(prod.stockUnits.toString());
    setDimensions(prod.dimensions);
    setImageUrl(prod.imageUrl);
    setShowUploadModal(true);
  };

  // Save product (New or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    const prodPayload = {
      name: name.trim() || 'Pieza 3D Personalizada',
      category: categoryDesc.trim() || 'General 3D',
      description: description.trim() || 'Pieza impresa en 3D con materiales biodegradables de alta durabilidad.',
      material,
      color,
      colorHex,
      retailPrice: parseFloat(retailPrice) || 120,
      directCost: parseFloat(directCost) || 30,
      printTimeHours: parseFloat(printTimeHours) || 2,
      materialGrams: parseFloat(materialGrams) || 40,
      stockUnits: parseInt(stockUnits, 10) || 1,
      dimensions,
      imageUrl,
      isPublished: true,
      tags: ['Impresión 3D', 'MiFyMEs', 'Hecho en Morelia'],
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 1,
      createdAt: editingProduct ? editingProduct.createdAt : todayStr
    };

    if (editingProduct) {
      // Update existing product
      await db.products.update(editingProduct.id, prodPayload);

      // Sync inventory item if exists
      const invItem = await db.inventory.get(`inv-${editingProduct.id}`);
      if (invItem) {
        await db.inventory.update(invItem.id, {
          name: prodPayload.name,
          stockGramsOrUnits: prodPayload.stockUnits,
          unitCost: prodPayload.directCost,
          retailPrice: prodPayload.retailPrice,
          lastUpdated: todayStr
        });
      }
    } else {
      // Create new product
      const newId = `prod-${Date.now()}`;
      const newProd: ProductItem = {
        id: newId,
        ...prodPayload
      };
      await db.products.add(newProd);

      // Sync to inventory
      await db.inventory.add({
        id: `inv-${newId}`,
        name: newProd.name,
        category: 'Piezas Terminadas',
        color: newProd.color,
        colorHex: newProd.colorHex,
        brand: 'MiFyMEs Taller',
        stockGramsOrUnits: newProd.stockUnits,
        unit: 'piezas',
        minStockAlert: 2,
        unitCost: newProd.directCost,
        retailPrice: newProd.retailPrice,
        status: newProd.stockUnits > 2 ? 'sufficient' : 'critical',
        lastUpdated: todayStr
      });
    }

    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#D94680', '#582C7B', '#5C9450']
    });

    setShowUploadModal(false);
    setEditingProduct(null);
    onRefreshProducts();
  };

  // Delete product
  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (confirm(`¿Estás segura de eliminar "${prodName}" del catálogo?`)) {
      await db.products.delete(id);
      onRefreshProducts();
    }
  };

  // Quick stock adjuster in Admin view (+ / -) with automatic calculation and sales logging
  const handleAdjustStock = async (prod: ProductItem, change: number) => {
    const prevStock = prod.stockUnits;
    const newStock = Math.max(0, prevStock + change);
    const todayStr = new Date().toISOString().split('T')[0];

    await db.products.update(prod.id, { stockUnits: newStock });

    // Also update in inventory
    const inv = await db.inventory.get(`inv-${prod.id}`);
    if (inv) {
      await db.inventory.update(inv.id, {
        stockGramsOrUnits: newStock,
        status: newStock > 2 ? 'sufficient' : 'critical',
        lastUpdated: todayStr
      });
    }

    if (change < 0) {
      // Automatic sale logging in Mis Cuentas
      const qtySold = Math.abs(change);
      const saleAmount = qtySold * prod.retailPrice;
      await db.transactions.add({
        type: 'sale',
        category: 'Venta Producto 3D',
        description: `Venta directa de producto: ${qtySold}x ${prod.name}`,
        amount: saleAmount,
        date: todayStr,
        synced: true,
        itemsCount: qtySold,
        paymentMethod: 'Efectivo / Contraentrega',
        notes: `Cálculo automático de stock: de ${prevStock} a ${newStock} piezas.`
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D94680', '#582C7B', '#10B981']
      });

      setStockFeedback(
        `⚡ Venta registrada automáticamente: +$${saleAmount} MXN. Stock de "${prod.name}": ${prevStock} ➔ ${newStock} pzs.`
      );
    } else {
      setStockFeedback(
        `⚡ Stock aumentado automáticamente: "${prod.name}" ahora tiene ${newStock} pzs (+${change} sumadas al taller).`
      );
    }

    setTimeout(() => setStockFeedback(null), 4500);
    onRefreshProducts();
  };

  // WhatsApp order for Customer View
  const handleOrderViaWhatsApp = (prod: ProductItem) => {
    const text = `¡Hola! Me encantó su producto publicado en MiFyMEs: "${prod.name}" a $${prod.retailPrice} MXN (${prod.category}). ¿Tienen disponibilidad o cuánto tarda la entrega? ¡Muchas gracias! ✨`;
    window.open(`https://wa.me/524432417613?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#582C7B] rounded-md p-6 text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-sm bg-white/20 text-xs font-bold uppercase font-impact tracking-wider">
                Mis Productos
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-[#D94680] text-white text-[11px] font-bold uppercase">
                {products.length} Productos
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-impact tracking-wide uppercase mt-2">
              Mis Productos
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 max-w-xl mt-1 leading-relaxed">
              Define libremente la categoría de tus piezas, sube tus propias fotos o usa las fotos de tus impresiones reales. Alterna entre la vista de tu clienta y el modo administradora para editar precios y existencias.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-md bg-[#D94680] text-white hover:bg-[#c23670] text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Subir Nuevo Producto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Calculation Stock Feedback Banner */}
      {stockFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{stockFeedback}</span>
        </div>
      )}

      {/* Control Bar: Mode Switcher & Category Filter */}
      <div className="bg-white rounded-md p-4 sm:p-5 border border-purple-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Toggle between Storefront (Cliente) and Admin Mode - NO ICONS, ONLY FUNCTION NAME */}
        <div className="flex items-center bg-stone-100 p-1 rounded-md border border-stone-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('storefront')}
            className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-bold transition cursor-pointer ${
              viewMode === 'storefront'
                ? 'bg-[#582C7B] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Vista Cliente
          </button>

          <button
            onClick={() => setViewMode('admin')}
            className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-bold transition cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-[#D94680] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Modo Administradora
          </button>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-stone-500 shrink-0 uppercase font-impact">Categoría:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#582C7B] text-white shadow-xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Todas ({products.length})
          </button>

          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#582C7B] text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Notice Banner based on View Mode */}
      {viewMode === 'storefront' ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-rose-50/50 to-pink-50 border border-purple-100 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#D94680]" />
            <span>
              <strong>Vista Pública de la Tienda:</strong> Así es como tus clientes ven tus piezas con fotos de alta resolución, descripción y botón directo a WhatsApp.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-bold text-stone-500">
            Precios en Pesos Mexicanos (MXN)
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-700" />
            <span>
              <strong>Modo Administradora Activo:</strong> Puedes hacer clic en <em>"✏️ Editar Producto"</em> en cualquier tarjeta para cambiar nombre, categoría, precio, costo o subir tu propia foto.
            </span>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="text-xs font-bold text-[#582C7B] hover:underline cursor-pointer"
          >
            + Subir otra pieza
          </button>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => {
          const profit = prod.retailPrice - prod.directCost;
          const margin = Math.round((profit / prod.retailPrice) * 100);

          return (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-purple-100/90 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              {/* Product Image Container */}
              <div className="relative aspect-4/3 overflow-hidden bg-stone-50 border-b border-stone-100 flex items-center justify-center">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to svg if image link breaks
                    (e.target as HTMLImageElement).src = '/products/llaveros-flores-pastel.svg';
                  }}
                />

                {/* Free Custom Category Badge */}
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#582C7B] shadow-xs backdrop-blur-xs border border-purple-100 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#D94680]" />
                  {prod.category}
                </span>

                {/* Stock indicator badge */}
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                    prod.stockUnits > 3
                      ? 'bg-emerald-500 text-white'
                      : prod.stockUnits > 0
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {prod.stockUnits > 0 ? `${prod.stockUnits} en stock` : 'Agotado'}
                </span>

                {/* Quick inspect button */}
                <button
                  onClick={() => setSelectedProductDetail(prod)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 text-stone-700 hover:bg-white hover:text-stone-950 flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Ver detalle completo"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Product Info Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-stone-900 font-serif leading-snug line-clamp-1 group-hover:text-[#582C7B] transition-colors">
                      {prod.name}
                    </h3>
                  </div>

                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                {/* Specs Pill tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-purple-100">
                    <Box className="w-3 h-3 text-[#D94680]" />
                    {prod.material.split('+')[0].trim()}
                  </span>
                  <span className="text-[10px] bg-stone-50 text-stone-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border border-stone-200">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {prod.printTimeHours} hrs
                  </span>
                  <span className="text-[10px] bg-stone-50 text-stone-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border border-stone-200">
                    {prod.materialGrams}g peso
                  </span>
                </div>

                {/* Pricing / Cost info */}
                <div className="pt-2 border-t border-stone-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Precio Venta</span>
                      <span className="text-xl font-black text-rose-600 font-serif">
                        ${prod.retailPrice} <span className="text-xs text-stone-500 font-normal">MXN</span>
                      </span>
                    </div>

                    {/* Admin Profit insight */}
                    {viewMode === 'admin' && (
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Costo / Margen</span>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-stone-500">${prod.directCost} costo</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            +{margin}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons based on View Mode */}
                <div className="pt-2">
                  {viewMode === 'storefront' ? (
                    <button
                      onClick={() => handleOrderViaWhatsApp(prod)}
                      className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-emerald-200 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Pedir por WhatsApp ($ {prod.retailPrice} MXN)</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {/* Stock Quick Controller with Automatic Math */}
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stone-600">Stock actual:</span>
                          <span className="font-black text-stone-900 text-sm">{prod.stockUnits} pzs</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                            <span className="text-[9px] font-bold text-rose-800">Vendí:</span>
                            <button
                              onClick={() => handleAdjustStock(prod, -1)}
                              className="flex-1 py-0.5 rounded bg-white text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300 font-bold text-[10px] transition cursor-pointer"
                              title="Restar 1 y registrar venta"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleAdjustStock(prod, -2)}
                              className="flex-1 py-0.5 rounded bg-white text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300 font-bold text-[10px] transition cursor-pointer"
                              title="Restar 2 y registrar venta"
                            >
                              -2
                            </button>
                          </div>

                          <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-lg border border-emerald-200">
                            <span className="text-[9px] font-bold text-emerald-800">Puse:</span>
                            <button
                              onClick={() => handleAdjustStock(prod, 1)}
                              className="flex-1 py-0.5 rounded bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 font-bold text-[10px] transition cursor-pointer"
                              title="Sumar 1 al stock"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleAdjustStock(prod, 5)}
                              className="flex-1 py-0.5 rounded bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 font-bold text-[10px] transition cursor-pointer"
                              title="Sumar 5 al stock"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Admin Modify Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#582C7B] text-xs font-bold border border-purple-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#D94680]" />
                          <span>Modificar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="py-2 px-3 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold border border-stone-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-stone-400 hover:text-rose-600" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Product */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-purple-100 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#582C7B] to-[#D94680] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">
                    {editingProduct ? 'Modificar Producto Publicado' : 'Subir Nueva Pieza al Catálogo'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Describe libremente tu categoría y asigna tu foto personalizada
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setEditingProduct(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 my-4">
              
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Nombre de la Pieza o Producto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Llaveros Flores Pastel con Nombre 3D"
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-[#D94680]"
                />
              </div>

              {/* Free Custom Category Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    Descripción Libre de la Categoría * (Sin categorías fijas)
                  </label>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-semibold">
                    Escribe lo que quieras
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="Ej. Llaveros y Joyería, Macetitas Tiernas, Juguetes Sensoriales, Piezas para Taller..."
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-[#D94680]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Descripción Detallada para tu Clienta
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explica qué incluye, cuidados, si es resistente al agua o si se puede personalizar con nombres..."
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-[#D94680]"
                />
              </div>

              {/* Image Upload & Presets */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#D94680]" />
                    Fotografía del Producto
                  </label>
                  <span className="text-[10px] text-stone-500">
                    Sube tu archivo o elige una de tus fotos
                  </span>
                </div>

                {/* Current Image Preview & File Input */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white border-2 border-dashed border-[#D94680] shrink-0 flex items-center justify-center shadow-xs">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    {/* Native File Selector */}
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold cursor-pointer shadow-xs transition active:scale-95">
                        <Upload className="w-4 h-4 text-[#D94680]" />
                        <span>Subir Foto desde mi Dispositivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-stone-400 mt-1">
                        Acepta JPG, PNG, WEBP tomadas con tu celular o cámara.
                      </p>
                    </div>

                    {/* Or URL input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="O pega aquí el enlace de la imagen..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-[11px] text-stone-700 focus:outline-none focus:border-[#D94680]"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets of the 6 real photos provided by user */}
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block mb-1.5">
                    O selecciona una de tus fotos registradas:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {real3DPhotos.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImageUrl(item.url);
                          if (!name) setName(item.title);
                          if (!categoryDesc || categoryDesc === 'Llaveros y Accesorios de Moda') setCategoryDesc(item.suggestedCategory);
                          setRetailPrice(item.suggestedPrice);
                          setDirectCost(item.suggestedCost);
                          setMaterialGrams(item.suggestedGrams);
                          setPrintTimeHours(item.suggestedHours);
                        }}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                          imageUrl === item.url
                            ? 'bg-rose-50 border-[#D94680] shadow-xs'
                            : 'bg-white border-stone-200 hover:border-purple-200'
                        }`}
                      >
                        <img src={item.url} alt={item.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        <span className="text-[10px] font-bold text-stone-800 line-clamp-1">
                          {item.title.split('(')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Pricing & Costs (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <label className="text-xs font-bold text-rose-900 block mb-1">
                    Precio al Público ($ MXN) *
                  </label>
                  <input
                    type="number"
                    required
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-200 font-bold text-stone-900 text-sm focus:outline-none focus:border-rose-400"
                  />
                  <span className="text-[10px] text-rose-700 mt-1 block">
                    Lo que paga tu clienta
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Costo Directo ($ MXN) *
                  </label>
                  <input
                    type="number"
                    required
                    value={directCost}
                    onChange={(e) => setDirectCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-300 font-bold text-stone-900 text-sm focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Filamento + Luz + Desgaste
                  </span>
                </div>
              </div>

              {/* Technical Specifications (Material, Grams, Hours, Stock) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="PLA Silk / PETG"
                    className="w-full p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Horas Impresión</label>
                  <input
                    type="number"
                    step="0.1"
                    value={printTimeHours}
                    onChange={(e) => setPrintTimeHours(e.target.value)}
                    placeholder="2.5"
                    className="w-full p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Gramos (g)</label>
                  <input
                    type="number"
                    value={materialGrams}
                    onChange={(e) => setMaterialGrams(e.target.value)}
                    placeholder="35"
                    className="w-full p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Unidades Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stockUnits}
                    onChange={(e) => setStockUnits(e.target.value)}
                    className="w-full p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#D94680] to-[#582C7B] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-200 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingProduct ? 'Guardar Cambios' : 'Publicar en Mi Catálogo'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Detail Modal when customer or seller clicks full inspect */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProductDetail(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-stone-100 mb-4">
              <img
                src={selectedProductDetail.imageUrl}
                alt={selectedProductDetail.name}
                className="w-full h-full object-cover"
              />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              {selectedProductDetail.category}
            </span>

            <h3 className="text-xl font-bold text-stone-900 font-serif mt-2">
              {selectedProductDetail.name}
            </h3>

            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              {selectedProductDetail.description}
            </p>

            <div className="grid grid-cols-2 gap-2 my-4 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Material</span>
                <span className="font-bold text-stone-800">{selectedProductDetail.material}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Dimensiones</span>
                <span className="font-bold text-stone-800">{selectedProductDetail.dimensions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Tiempo de Impresión</span>
                <span className="font-bold text-stone-800">{selectedProductDetail.printTimeHours} hrs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Disponibilidad</span>
                <span className="font-bold text-emerald-700">{selectedProductDetail.stockUnits} piezas listas</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              <div>
                <span className="text-xs text-stone-400 block">Precio Total</span>
                <span className="text-2xl font-black text-rose-600 font-serif">
                  ${selectedProductDetail.retailPrice} MXN
                </span>
              </div>

              <button
                onClick={() => handleOrderViaWhatsApp(selectedProductDetail)}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition cursor-pointer flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pedir por WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
