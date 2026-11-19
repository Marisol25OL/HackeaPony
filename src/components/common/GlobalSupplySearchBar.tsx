import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Package,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  Building,
  Tag,
  ArrowRight,
  Filter,
  CheckCircle2,
  Store
} from 'lucide-react';
import { type LocalSupplier, db } from '../../db/indexedDB';

export interface GlobalSupplyItem {
  id: string;
  name: string;
  material: string;
  price: number;
  stock: number;
  unit: string;
  colorHex: string;
  description: string;
  category: string;
  industry: string; // 'General' | 'Impresión 3D' | 'Textil y Confección' | 'Alimentos y Bebidas' | 'Papelería y Empaque' | 'Químicos y Limpieza' | 'Electrónica y Taller' | 'Madera y Carpintería'
  supplierId: string;
  supplierName: string;
  supplierCity: string;
  supplierPhone: string;
  isRecycled?: boolean;
}

interface Props {
  suppliers: LocalSupplier[];
  onSelectInsumo?: (item: GlobalSupplyItem) => void;
  onOpenSuppliersTab?: () => void;
  onRefreshData?: () => void;
}

export const GlobalSupplySearchBar: React.FC<Props> = ({
  suppliers,
  onSelectInsumo,
  onOpenSuppliersTab,
  onRefreshData
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('todos');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Comprehensive multi-industry supply catalog (Morelia & Región Michoacán)
  const allSupplies: GlobalSupplyItem[] = React.useMemo(() => {
    const list: GlobalSupplyItem[] = [];

    // 1. Incorporate local suppliers catalog from DB
    suppliers.forEach((supp) => {
      supp.catalog.forEach((item) => {
        list.push({
          id: item.id,
          name: item.name,
          material: item.material,
          price: item.price,
          stock: item.stock,
          unit: 'kg',
          colorHex: item.colorHex || '#CBD5E1',
          description: item.description,
          category: item.category,
          industry: 'Impresión 3D & Manufactura',
          supplierId: supp.id,
          supplierName: supp.name,
          supplierCity: supp.city,
          supplierPhone: supp.phone,
          isRecycled: item.isRecycledPet
        });
      });
    });

    // 2. Wide, multi-sector catalog of all types of raw materials, packaging, chemicals, textiles, stationery, etc.
    const universalSupplies: GlobalSupplyItem[] = [
      // --- PAPELERÍA, EMPAQUE Y ENVÍOS ---
      {
        id: 'supp-pack-cajas-kraft',
        name: 'Cajas de Cartón Microcorrugado Autoarmables Kraft 20x15x10cm (50 pz)',
        material: 'Cartón Kraft 100% Reciclable',
        price: 320,
        stock: 120,
        unit: 'paquete',
        colorHex: '#D4A373',
        description: 'Cajas rígidas para paquetería, envíos e-commerce y regalos artesanales.',
        category: 'Cajas y Empaque',
        industry: 'Papelería y Empaque',
        supplierId: 'supp-mor-carton',
        supplierName: 'Empaques & Cartones de Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 315 2200'
      },
      {
        id: 'supp-pack-cinta-canela',
        name: 'Cinta Canela de Embalar de Alta Adherencia 48mm x 150m (Tubo con 6 rollos)',
        material: 'Polipropileno Adhesivo Acrílico',
        price: 185,
        stock: 65,
        unit: 'tubo',
        colorHex: '#C58940',
        description: 'Cinta industrial selladora para cajas pesadas y envíos terrestres.',
        category: 'Cintas y Sellado',
        industry: 'Papelería y Empaque',
        supplierId: 'supp-mor-carton',
        supplierName: 'Empaques & Cartones de Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 315 2200'
      },
      {
        id: 'supp-pack-burbuja-rollo',
        name: 'Rollo de Plástico Burbuja de 1/2 pulgada 40cm x 100 metros',
        material: 'Polietileno Virgen con Burbuja',
        price: 290,
        stock: 45,
        unit: 'rollo',
        colorHex: '#E2E8F0',
        description: 'Amortiguador protector contra golpes para piezas delicadas, cerámica y envíos.',
        category: 'Protección y Relleno',
        industry: 'Papelería y Empaque',
        supplierId: 'supp-mor-carton',
        supplierName: 'Empaques & Cartones de Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 315 2200'
      },
      {
        id: 'supp-pack-bolsas-kraft',
        name: 'Bolsas de Papel Kraft con Asa Macarrón Reforzada 25x30cm (100 pz)',
        material: 'Papel Kraft 120g',
        price: 280,
        stock: 80,
        unit: 'ciento',
        colorHex: '#C29B38',
        description: 'Bolsas ecológicas para boutiques, panaderías, tiendas de regalos y cosmética.',
        category: 'Bolsas Ecológicas',
        industry: 'Papelería y Empaque',
        supplierId: 'supp-mor-papel',
        supplierName: 'Papelera del Centro Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 312 8844'
      },
      {
        id: 'supp-pack-etiquetas-termicas',
        name: 'Rollo de Etiquetas Térmicas Directas 4x6 pulgadas (100x150mm) 500 pz',
        material: 'Papel Térmico sin Tinta',
        price: 140,
        stock: 90,
        unit: 'rollo',
        colorHex: '#FFFFFF',
        description: 'Compatibles con guías de envío Mercado Libre, DHL, FedEx y Estafeta.',
        category: 'Etiquetas y Códigos',
        industry: 'Papelería y Empaque',
        supplierId: 'supp-mor-papel',
        supplierName: 'Papelera del Centro Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 312 8844'
      },

      // --- TEXTIL, CONFECCIÓN Y COSTURA ---
      {
        id: 'supp-tex-hilos-poliester',
        name: 'Cono de Hilo 100% Poliéster Calibre 40/2 para Costura Recta 5000 yardas',
        material: 'Poliéster Spun de Alta Resistencia',
        price: 55,
        stock: 140,
        unit: 'cono',
        colorHex: '#1E293B',
        description: 'Hilo de costura para prendas, uniformes, tapicería ligera y manualidades.',
        category: 'Hilos y Mercería',
        industry: 'Textil y Confección',
        supplierId: 'supp-mor-telas',
        supplierName: 'Mercería & Textiles San Agustín',
        supplierCity: 'Morelia',
        supplierPhone: '443 313 1920'
      },
      {
        id: 'supp-tex-manta-cruda',
        name: 'Tela Manta Cruda de Algodón 100% 1.60m de ancho (Rollo 20 metros)',
        material: 'Algodón Natural sin Teñir',
        price: 840,
        stock: 25,
        unit: 'rollo',
        colorHex: '#FDFBF7',
        description: 'Tela transpirable para bolsas tote bag, bordados purépechas, mandiles y delantales.',
        category: 'Telas por Rollo',
        industry: 'Textil y Confección',
        supplierId: 'supp-mor-telas',
        supplierName: 'Mercería & Textiles San Agustín',
        supplierCity: 'Morelia',
        supplierPhone: '443 313 1920'
      },
      {
        id: 'supp-tex-cierres-metal',
        name: 'Paquete de 50 Cierres de Cremallera Metálicos Diente de Cobre 18cm',
        material: 'Latón Niquelado y Cinta Poliéster',
        price: 210,
        stock: 50,
        unit: 'paquete',
        colorHex: '#B45309',
        description: 'Cierres de alta durabilidad para chamarras, pantalones y estuches de mano.',
        category: 'Herrajes Textiles',
        industry: 'Textil y Confección',
        supplierId: 'supp-mor-telas',
        supplierName: 'Mercería & Textiles San Agustín',
        supplierCity: 'Morelia',
        supplierPhone: '443 313 1920'
      },
      {
        id: 'supp-tex-elasti-20mm',
        name: 'Rollo de Elástico Plano Tejido Reforzado 20mm x 50 metros',
        material: 'Látex Recubierto de Poliéster',
        price: 160,
        stock: 70,
        unit: 'rollo',
        colorHex: '#FFFFFF',
        description: 'Elástico de gran memoria para pretinas, ropa deportiva, cubrebocas y batas.',
        category: 'Elásticos e Insumos',
        industry: 'Textil y Confección',
        supplierId: 'supp-mor-telas',
        supplierName: 'Mercería & Textiles San Agustín',
        supplierCity: 'Morelia',
        supplierPhone: '443 313 1920'
      },

      // --- ALIMENTOS, REPOSTERÍA Y CAFETERÍAS ---
      {
        id: 'supp-food-harina-trigo',
        name: 'Bulto de Harina de Trigo Extra Fina Flor de Michoacán (25 kg)',
        material: 'Harina de Trigo Enriquecida Grado Panadero',
        price: 490,
        stock: 60,
        unit: 'bulto',
        colorHex: '#FDFBF7',
        description: 'Materia prima de alta fuerza (W280) para panadería, pizzerías y repostería.',
        category: 'Harinas y Granos',
        industry: 'Alimentos y Bebidas',
        supplierId: 'supp-mor-molino',
        supplierName: 'Molinos Centrales de Michoacán',
        supplierCity: 'Morelia',
        supplierPhone: '443 314 5510'
      },
      {
        id: 'supp-food-chocolate-cobertura',
        name: 'Caja de Chocolate Cobertura Amargo Semidulce 55% Cacao (5 kg en tabletas)',
        material: 'Cacao Mexicano y Manteca de Cacao',
        price: 680,
        stock: 30,
        unit: 'caja',
        colorHex: '#3E2723',
        description: 'Ideal para temperar, bañar fresas, brownies, pastelería y bombonería.',
        category: 'Chocolatería y Coberturas',
        industry: 'Alimentos y Bebidas',
        supplierId: 'supp-mor-repost',
        supplierName: 'Insumos Dulces Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 317 4099'
      },
      {
        id: 'supp-food-cafe-grano',
        name: 'Café de Especialidad en Grano Tueste Medio de Uruapan / Tacámbaro (5 kg)',
        material: 'Café Arábica de Altura 1250 msnm',
        price: 920,
        stock: 35,
        unit: 'costal',
        colorHex: '#4E342E',
        description: 'Notas a caramelo y chocolate con cuerpo sedoso para cafeterías y espresso bar.',
        category: 'Café y Granos',
        industry: 'Alimentos y Bebidas',
        supplierId: 'supp-mor-cafe',
        supplierName: 'Café Sierra Purépecha',
        supplierCity: 'Morelia',
        supplierPhone: '443 324 8100'
      },
      {
        id: 'supp-food-vasos-eco',
        name: 'Vasos Térmicos Biodegradables de Cartón para Café Caliente 12oz (500 pz)',
        material: 'Cartón con Recubrimiento de PLA de Maíz',
        price: 520,
        stock: 45,
        unit: 'caja',
        colorHex: '#EFEBE9',
        description: 'Vasos compostables con tapa para cafeterías con entrega para llevar.',
        category: 'Desechables Biodegradables',
        industry: 'Alimentos y Bebidas',
        supplierId: 'supp-mor-carton',
        supplierName: 'Empaques & Cartones de Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 315 2200'
      },

      // --- QUÍMICOS, LIMPIEZA Y DESINFECCIÓN ---
      {
        id: 'supp-chem-alcohol-99',
        name: 'Alcohol Isopropílico al 99.9% Grado Químico Puro (Garrafa 4 Litros)',
        material: 'Isopropanol Técnico Puro',
        price: 360,
        stock: 40,
        unit: 'garrafa',
        colorHex: '#38BDF8',
        description: 'Solvente para limpieza electrónica, lavado de resinas y desinfección de superficies.',
        category: 'Solventes y Limpieza',
        industry: 'Químicos y Limpieza',
        supplierId: 'supp-morelia-chem',
        supplierName: 'Reactivos & Solventes de Michoacán',
        supplierCity: 'Morelia',
        supplierPhone: '443 312 4055'
      },
      {
        id: 'supp-chem-cloro-concentrado',
        name: 'Hipoclorito de Sodio Concentrado al 13% Grado Industrial (Porrón 20 Litros)',
        material: 'Solución de Hipoclorito Concentrado',
        price: 240,
        stock: 55,
        unit: 'porrón',
        colorHex: '#FACC15',
        description: 'Desinfectante de alto espectro para plantas procesadoras, pisos y talleres.',
        category: 'Desinfección Industrial',
        industry: 'Químicos y Limpieza',
        supplierId: 'supp-morelia-chem',
        supplierName: 'Reactivos & Solventes de Michoacán',
        supplierCity: 'Morelia',
        supplierPhone: '443 312 4055'
      },
      {
        id: 'supp-chem-desengrasante',
        name: 'Desengrasante Biodegradable Base Cítrica para Motores y Metales (5 Litros)',
        material: 'D-Limoneno Cítrico Biodegradable',
        price: 290,
        stock: 35,
        unit: 'garrafa',
        colorHex: '#FB923C',
        description: 'Elimina aceites pesados y grasas de transmisiones, cadenas y bancadas de máquinas.',
        category: 'Desengrasantes',
        industry: 'Químicos y Limpieza',
        supplierId: 'supp-morelia-chem',
        supplierName: 'Reactivos & Solventes de Michoacán',
        supplierCity: 'Morelia',
        supplierPhone: '443 312 4055'
      },

      // --- FERRETERÍA, MADERA Y TALLER ---
      {
        id: 'supp-taller-tornillos-inox',
        name: 'Surtido de Tornillos Métricos M3 y M4 de Acero Inoxidable 304 con Tuercas (400 pz)',
        material: 'Acero Inoxidable Grado Marino 304',
        price: 275,
        stock: 50,
        unit: 'estuche',
        colorHex: '#94A3B8',
        description: 'Tornillería antioxidable para ensamble de carcasas, perfiles de aluminio y robótica.',
        category: 'Tornillería y Fijación',
        industry: 'Ferretería y Taller',
        supplierId: 'supp-morelia-tools',
        supplierName: 'Herramientas Industriales Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 450 1190'
      },
      {
        id: 'supp-taller-pegamento-madera',
        name: 'Pegamento para Madera Resistol 850 Profesional Grado Carpintero (1 Litro)',
        material: 'Acetato de Polivinilo (PVA)',
        price: 135,
        stock: 60,
        unit: 'bote',
        colorHex: '#FEF08A',
        description: 'Adhesivo blanco de máxima fuerza para ensamble de muebles, bastidores y maquetas.',
        category: 'Adhesivos de Madera',
        industry: 'Ferretería y Taller',
        supplierId: 'supp-morelia-tools',
        supplierName: 'Herramientas Industriales Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 450 1190'
      },
      {
        id: 'supp-taller-silicon-termico',
        name: 'Paquete de 1 Kilogramo de Barras de Silicón Caliente Grueso 11mm (Aprox 45 barras)',
        material: 'Polímero EVA Termofusible',
        price: 140,
        stock: 90,
        unit: 'kilo',
        colorHex: '#F1F5F9',
        description: 'Pegado instantáneo para artesanías, cartonería, sellado de cajas y cables.',
        category: 'Adhesivos y Silicones',
        industry: 'Ferretería y Taller',
        supplierId: 'supp-morelia-tools',
        supplierName: 'Herramientas Industriales Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 450 1190'
      },
      {
        id: 'supp-taller-lijas-agua',
        name: 'Paquete de Lijas de Agua de Carburo de Silicio Grano 240 a 2000 (Pliego 25 pz)',
        material: 'Carburo de Silicio Impermeable',
        price: 175,
        stock: 45,
        unit: 'paquete',
        colorHex: '#334155',
        description: 'Para acabados ultrafinos en madera, resinas epóxicas, pintura automotriz y metal.',
        category: 'Abrasivos y Lijas',
        industry: 'Ferretería y Taller',
        supplierId: 'supp-morelia-tools',
        supplierName: 'Herramientas Industriales Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 450 1190'
      },

      // --- ELECTRICIDAD, ELECTRÓNICA Y SOLDADURA ---
      {
        id: 'supp-elec-soldadura-estanio',
        name: 'Carrete de Soldadura de Estaño-Plomo 60/40 con Núcleo de Resina 1.0mm (250g)',
        material: 'Aleación Sn60/Pb40 Rosin Core',
        price: 210,
        stock: 35,
        unit: 'carrete',
        colorHex: '#CBD5E1',
        description: 'Soldadura fluida de bajo punto de fusión para placas electrónicas y cables.',
        category: 'Soldadura y Electrónica',
        industry: 'Electricidad y Electrónica',
        supplierId: 'supp-morelia-tools',
        supplierName: 'Herramientas Industriales Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 450 1190'
      },
      {
        id: 'supp-elec-termofit',
        name: 'Caja Organizadora con 328 Tubos Termorretráctiles Termofit Multicalibre',
        material: 'Poliolefina Termorretráctil 2:1',
        price: 165,
        stock: 40,
        unit: 'caja',
        colorHex: '#E11D48',
        description: 'Aislamiento eléctrico profesional resistente al calor para empalmes y arneses.',
        category: 'Aislamiento Eléctrico',
        industry: 'Electricidad y Electrónica',
        supplierId: 'supp-morelia-tools',
        supplierName: 'Herramientas Industriales Morelia',
        supplierCity: 'Morelia',
        supplierPhone: '443 450 1190'
      }
    ];

    return [...list, ...universalSupplies];
  }, [suppliers]);

  // Industry sectors definitions with descriptions and count
  const industries = [
    { id: 'todos', label: 'Todos los Sectores', icon: '🌐', desc: 'Ver catálogo unificado de insumos' },
    { id: 'Papelería y Empaque', label: 'Empaque y Envíos', icon: '📦', desc: 'Cajas kraft, burbuja, cintas y etiquetas' },
    { id: 'Alimentos y Bebidas', label: 'Alimentos y Cafetería', icon: '☕', desc: 'Harinas, café, chocolate y desechables' },
    { id: 'Textil y Confección', label: 'Textil y Confección', icon: '🧵', desc: 'Telas, mantas, hilos, cierres y elásticos' },
    { id: 'Químicos y Limpieza', label: 'Químicos y Limpieza', icon: '🧪', desc: 'Alcohol 99%, cloro, desengrasantes' },
    { id: 'Ferretería y Taller', label: 'Ferretería y Taller', icon: '🔧', desc: 'Tornillos inox, adhesivos, lijas y silicón' },
    { id: 'Electricidad y Electrónica', label: 'Electrónica y Cables', icon: '⚡', desc: 'Soldadura estaño, termofit y terminales' },
    { id: 'Impresión 3D & Manufactura', label: '3D y Manufactura', icon: '🖨️', desc: 'Filamentos PLA/PETG, resinas y refacciones' }
  ];

  // Filtering logic
  const filteredSupplies = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return allSupplies.filter((item) => {
      // Industry filter
      if (selectedIndustry !== 'todos' && item.industry !== selectedIndustry) {
        return false;
      }

      // Query filter
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.supplierCity.toLowerCase().includes(q)
      );
    });
  }, [allSupplies, query, selectedIndustry]);

  // Quick Add to Cart
  const handleQuickAddToCart = async (item: GlobalSupplyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const existing = await db.cartItems.get(item.id);
      if (existing) {
        await db.cartItems.update(item.id, {
          quantity: existing.quantity + 1
        });
      } else {
        await db.cartItems.add({
          id: item.id,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          supplierPhone: item.supplierPhone,
          materialName: item.name,
          category: (item.industry === 'Impresión 3D & Manufactura'
            ? 'Filamento PLA'
            : item.industry === 'Papelería y Empaque'
            ? 'Empaque'
            : 'Refacciones') as any,
          unitPrice: item.price,
          quantity: 1,
          unit: item.unit || 'pz',
          colorHex: item.colorHex
        });
      }

      setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
      }, 2000);

      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-zinc-400 pointer-events-none flex items-center">
          <Search className="w-4 h-4 text-zinc-400" />
        </div>

        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Buscar cualquier insumo o materia prima: cajas, bolsas, harina, café, tela, alcohol, soldadura..."
          className="w-full pl-10 pr-10 py-2.5 bg-zinc-50/90 hover:bg-white focus:bg-white text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#582C7B]/20 focus:border-[#582C7B] transition-all shadow-2xs"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Results Modal / Wide Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:-left-20 sm:-right-20 md:-left-40 md:-right-40 lg:-left-60 lg:-right-60 mt-2.5 bg-white rounded-2xl border border-zinc-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-w-5xl mx-auto">
          
          {/* Header of Search Modal */}
          <div className="p-4 bg-gradient-to-r from-zinc-50 via-pink-50/30 to-purple-50/20 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#582C7B]" />
                  Directorio de Sectores Productivos
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#582C7B]/10 text-[#582C7B]">
                  Morelia & Michoacán
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Selecciona un sector para ver sus insumos de manera amplia y ordenada
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-zinc-500">
                <strong className="text-zinc-900">{filteredSupplies.length}</strong> insumos encontrados
              </span>
              {onOpenSuppliersTab && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSuppliersTab();
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-[#582C7B] bg-white border border-purple-200 hover:bg-purple-50 rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <span>Módulo completo</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* SPATIOUS SECTOR CARDS GRID (Wide Layout, Not Cramped!) */}
          <div className="p-3.5 sm:p-4 bg-zinc-50/60 border-b border-zinc-200/70">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {industries.map((ind) => {
                const isSelected = selectedIndustry === ind.id;
                const count = ind.id === 'todos' 
                  ? allSupplies.length 
                  : allSupplies.filter((s) => s.industry === ind.id).length;

                return (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndustry(ind.id)}
                    className={`p-3 rounded-xl text-left transition-all duration-150 cursor-pointer border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#582C7B] shadow-md ring-2 ring-[#582C7B]/15 translate-y-[-1px]'
                        : 'bg-white/90 border-zinc-200/80 hover:bg-white hover:border-zinc-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-lg">{ind.icon}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-[#582C7B] text-white'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                      <h5
                        className={`text-xs font-bold leading-tight ${
                          isSelected ? 'text-[#582C7B]' : 'text-zinc-800'
                        }`}
                      >
                        {ind.label}
                      </h5>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                      {ind.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items List (Spacious & Clean Layout) */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-100 p-2 sm:p-3">
            {filteredSupplies.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Package className="w-10 h-10 text-zinc-300 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-800">
                  No se encontraron insumos para "{query}"
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Prueba cambiando de sector o buscando términos generales como: cajas kraft, bolsas, elástico, harina, café, alcohol, soldadura o tornillos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                {filteredSupplies.map((item) => {
                  const isAdded = addedItemIds[item.id];

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onSelectInsumo) onSelectInsumo(item);
                        if (onOpenSuppliersTab) onOpenSuppliersTab();
                        setIsOpen(false);
                      }}
                      className="p-3.5 bg-white hover:bg-zinc-50/80 rounded-xl border border-zinc-200/80 hover:border-[#582C7B]/30 transition-all flex flex-col justify-between gap-3 cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      {/* Top row: Sector badge & price */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                            {item.industry}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Stock: {item.stock} {item.unit}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-zinc-900 font-serif">
                            ${item.price.toLocaleString('es-MX')} MXN
                          </div>
                          <div className="text-[9px] text-zinc-400">
                            por {item.unit}
                          </div>
                        </div>
                      </div>

                      {/* Main Title and description */}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 group-hover:text-[#582C7B] transition leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Bottom row: Supplier info & Add to cart button */}
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 truncate">
                          <Building className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="font-medium text-zinc-700 truncate">{item.supplierName}</span>
                          <span>•</span>
                          <span className="text-zinc-400 shrink-0">{item.supplierCity}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAddToCart(item, e)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-900 hover:bg-[#582C7B] text-white active:scale-95'
                          }`}
                          title="Agregar al Carrito de Insumos"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Agregado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dropdown footer with quick shortcuts */}
          <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Sparkles className="w-3.5 h-3.5 text-[#D94680]" />
              <span>Directorio local multirubro con pago contraentrega en Morelia.</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenSuppliersTab) onOpenSuppliersTab();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-100 transition cursor-pointer flex items-center gap-1"
            >
              <span>Ver Catálogo Completo de Proveedores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
