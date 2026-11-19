import Dexie, { type Table } from 'dexie';

export interface Transaction {
  id?: string;
  type: 'sale' | 'expense';
  category: 'Venta Producto 3D' | 'Filamento PLA/PETG' | 'Resina UV' | 'Empaque y Cajas' | 'Luz / Mantenimiento' | 'Otros Insumos';
  description: string;
  amount: number;
  date: string;
  synced: boolean;
  customerOrSupplier?: string;
  paymentMethod?: 'Efectivo / Contraentrega' | 'Transferencia SPEI' | 'Mercado Pago / Clip' | 'Tarjeta';
  itemsCount?: number;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Filamentos' | 'Resinas' | 'Piezas Terminadas' | 'Empaques y Accesorios';
  color: string;
  colorHex: string;
  brand: string;
  stockGramsOrUnits: number;
  unit: 'g' | 'ml' | 'piezas';
  minStockAlert: number;
  unitCost: number;
  retailPrice?: number;
  status: 'sufficient' | 'reorder_soon' | 'critical';
  printTimeHoursAvg?: number;
  materialGramsAvg?: number;
  lastUpdated: string;
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  itemsDescription: string;
  totalAmount: number;
  depositAmount: number;
  balancePending: number;
  status: 'preparing' | 'ready_to_ship' | 'on_the_way' | 'delivered';
  deliveryType: 'Punto Rosa Seguro' | 'Plaza Comercial' | 'Envío Paquetería' | 'Entrega a Domicilio';
  deliveryLocation: string;
  createdAt: string;
  estimatedDeliveryDate: string;
  printerAssigned?: string;
  requiredMaterialName?: string;
  requiredGrams?: number;
  isMaterialAvailable?: boolean;
}

export interface SupplierMaterialOrder {
  id: string;
  supplierName: string;
  supplierPhone: string;
  materialName: string;
  quantity: string;
  totalCost: number;
  status: 'ordered' | 'shipped' | 'delivered';
  orderDate: string;
  estimatedArrivalDate: string;
  trackingNumber?: string;
  paymentMethod?: 'Efectivo / Contraentrega' | 'Transferencia SPEI' | 'Tarjeta';
  cardLast4?: string;
  cardHolder?: string;
}

export interface DailyFactura {
  id?: string;
  folio: string;
  dateStr: string; // YYYY-MM-DD
  clientName: string;
  clientRFC: string;
  cfdiUsage: string;
  totalAmount: number;
  taxAmount: number;
  uuidMock: string;
  pdfGenerated: boolean;
}

export interface GroupPurchase {
  id: string;
  title: string;
  material: string;
  supplier: string;
  targetKilos: number;
  currentKilos: number;
  pricePerUnit: number;
  retailPrice: number;
  savingsPerUnit: number;
  deadlineDate: string;
  participantsCount: number;
  userJoinedKilos: number;
  status: 'active' | 'funded';
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string;
  color: string;
  colorHex: string;
  retailPrice: number;
  directCost: number;
  printTimeHours: number;
  materialGrams: number;
  stockUnits: number;
  dimensions: string;
  imageUrl: string;
  isPublished: boolean;
  tags: string[];
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  materialName: string;
  category: 'Filamento PETG' | 'Filamento PLA' | 'Resina UV' | 'Refacciones' | 'Empaque';
  unitPrice: number;
  quantity: number;
  unit: string;
  colorHex: string;
}

export interface LocalSupplier {
  id: string;
  name: string;
  brandTitle: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  deliverySpeed: string;
  acceptsCash: boolean;
  acceptsSpei: boolean;
  rating: number;
  isSustainable?: boolean;
  sustainabilityBadge?: {
    title: string;
    description: string;
    materialSource: string;
    ecoScore: number;
  };
  verificationStatus?: 'verified' | 'pending_review' | 'rejected';
  rejectionReason?: string;
  registeredDate?: string;
  catalog: Array<{
    id: string;
    name: string;
    material: string;
    price: number;
    stock: number;
    colorHex: string;
    description: string;
    category: CartItem['category'];
    isRecycledPet?: boolean;
  }>;
}

export interface UserAccount {
  id: string;
  role: 'seller' | 'supplier' | 'admin';
  name: string;
  businessName: string;
  email: string;
  phone: string;
  city: string;
  status: 'active' | 'pending_verification' | 'sanctioned';
  undeliveredCount: number;
  sanctionReason?: string;
  avatar?: string;
  registeredAt: string;
  sustainableFocus?: boolean;
}

export class BellaDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  inventory!: Table<InventoryItem, string>;
  orders!: Table<CustomerOrder, string>;
  materialOrders!: Table<SupplierMaterialOrder, string>;
  facturasDaily!: Table<DailyFactura, string>;
  groupPurchases!: Table<GroupPurchase, string>;
  products!: Table<ProductItem, string>;
  cartItems!: Table<CartItem, string>;
  localSuppliers!: Table<LocalSupplier, string>;
  users!: Table<UserAccount, string>;

  constructor() {
    super('Bella3DStudioDB');
    this.version(3).stores({
      transactions: '++id, type, category, date, synced',
      inventory: 'id, category, status, name',
      orders: 'id, status, deliveryType, createdAt',
      materialOrders: 'id, status, orderDate',
      facturasDaily: '++id, dateStr, folio',
      groupPurchases: 'id, status',
      products: 'id, category, isPublished, createdAt',
      cartItems: 'id, supplierId',
      localSuppliers: 'id, city, verificationStatus, isSustainable',
      users: 'id, role, email, status'
    });
  }
}

export const db = new BellaDatabase();

// Initial seed data designed for Mexican 3D printing entrepreneur in Morelia & nationwide
export async function seedInitialDataIfNeeded() {
  const count = await db.inventory.count();
  const productsCount = await db.products.count();
  const suppliersCount = await db.localSuppliers.count();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Seed Inventory if empty
  if (count === 0) {
    await db.inventory.bulkPut([
      {
        id: 'inv-1',
        name: 'Filamento PLA+ Rosa Pastel Seda (Silk)',
        category: 'Filamentos',
        color: 'Rosa Pastel',
        colorHex: '#FDA4AF',
        brand: 'eSUN',
        stockGramsOrUnits: 140, // Crítico
        unit: 'g',
        minStockAlert: 300,
        unitCost: 380,
        status: 'critical',
        lastUpdated: todayStr
      },
      {
        id: 'inv-2',
        name: 'Filamento PETG Negro Industrial Alta Resistencia',
        category: 'Filamentos',
        color: 'Negro Mate',
        colorHex: '#1C1917',
        brand: '3D PRINT3D Morelia',
        stockGramsOrUnits: 950,
        unit: 'g',
        minStockAlert: 400,
        unitCost: 340,
        status: 'sufficient',
        lastUpdated: todayStr
      },
      {
        id: 'inv-3',
        name: 'Filamento PLA Blanco Mármol Cerámico',
        category: 'Filamentos',
        color: 'Blanco Mármol',
        colorHex: '#F5F5F4',
        brand: 'Sunlu',
        stockGramsOrUnits: 280, // Comprar pronto
        unit: 'g',
        minStockAlert: 350,
        unitCost: 360,
        status: 'reorder_soon',
        lastUpdated: todayStr
      },
      {
        id: 'inv-4',
        name: 'Resina UV Fotopolímero 405nm Rosa Translúcida',
        category: 'Resinas',
        color: 'Rosa Translúcido',
        colorHex: '#F472B6',
        brand: 'Anycubic Eco',
        stockGramsOrUnits: 750,
        unit: 'ml',
        minStockAlert: 400,
        unitCost: 480,
        status: 'sufficient',
        lastUpdated: todayStr
      },
      {
        id: 'inv-5',
        name: 'Cajas Kraft con Ventana y Moño Rosa',
        category: 'Empaques y Accesorios',
        color: 'Kraft Natural',
        colorHex: '#D7BA89',
        brand: 'Empaques Morelia',
        stockGramsOrUnits: 12, // Comprar pronto
        unit: 'piezas',
        minStockAlert: 20,
        unitCost: 15,
        status: 'reorder_soon',
        lastUpdated: todayStr
      },
      {
        id: 'inv-6',
        name: 'Maceta Geométrica Facetada Suculenta',
        category: 'Piezas Terminadas',
        color: 'Rosa Seda',
        colorHex: '#FDA4AF',
        brand: 'MiFyMEs Taller',
        stockGramsOrUnits: 6,
        unit: 'piezas',
        minStockAlert: 2,
        unitCost: 65,
        retailPrice: 195,
        status: 'sufficient',
        lastUpdated: todayStr
      },
      {
        id: 'inv-7',
        name: 'Dragón Articulado Guardián 45cm',
        category: 'Piezas Terminadas',
        color: 'Bicromático Morado-Rosa',
        colorHex: '#C084FC',
        brand: 'MiFyMEs Taller',
        stockGramsOrUnits: 1, // Crítico
        unit: 'piezas',
        minStockAlert: 3,
        unitCost: 110,
        retailPrice: 380,
        status: 'critical',
        lastUpdated: todayStr
      }
    ]);
  }

  // 2. Seed Local Suppliers in Morelia if empty
  if (suppliersCount === 0) {
    await db.localSuppliers.bulkPut([
      {
        id: 'supp-morelia-1',
        name: '3D PRINT3D / Color Plus 3D',
        brandTitle: 'Proveedor Sustentable & Fabricante de Filamento PET Reciclado',
        address: 'Yunuen 131, Colonia Félix Ireta',
        neighborhood: 'Félix Ireta',
        city: 'Morelia',
        state: 'Michoacán',
        phone: '443 241 7613',
        whatsapp: '+524432417613',
        deliverySpeed: 'Mismo día / Retiro en sucursal Félix Ireta',
        acceptsCash: true,
        acceptsSpei: true,
        rating: 4.9,
        isSustainable: true,
        verificationStatus: 'verified',
        registeredDate: '2024-01-15',
        sustainabilityBadge: {
          title: 'Insignia Verde de Sustentabilidad: Filamento de Botellas PET Recicladas',
          description: 'Este proveedor de Morelia recolecta botellas de plástico PET de la región y las procesa en filamento de impresión 3D resistente y de alta tenacidad, reduciendo residuos plásticos urbanos en Michoacán.',
          materialSource: '100% Botellas PET Recicladas (Economía Circular Local)',
          ecoScore: 98
        },
        catalog: [
          {
            id: 'prod-supp-1',
            name: 'Filamento PET Reciclado de Botellas 1kg (Eco-PETG Morelia)',
            material: 'PET Reciclado de Botellas',
            price: 320,
            stock: 28,
            colorHex: '#059669',
            description: 'Hecho 100% de botellas PET trituradas y extruidas en Morelia. Excelente tenacidad, impacto y resistencia química para todo tipo de proyectos.',
            category: 'Filamento PETG',
            isRecycledPet: true
          },
          {
            id: 'prod-supp-1b',
            name: 'Filamento PETG Negro Industrial 1kg',
            material: 'PETG Industrial',
            price: 340,
            stock: 18,
            colorHex: '#1E293B',
            description: 'Excelente para soportes, piezas mecánicas y macetas para exterior resistentes al sol.',
            category: 'Filamento PETG'
          },
          {
            id: 'prod-supp-2',
            name: 'Filamento PLA Silk Rosa Pastel 1kg',
            material: 'PLA Silk Brillante',
            price: 350,
            stock: 24,
            colorHex: '#FDA4AF',
            description: 'Acabado satinado suave tipo seda, sin marcas de capa visibles.',
            category: 'Filamento PLA'
          },
          {
            id: 'prod-supp-3',
            name: 'Filamento PETG Translúcido Cristal 1kg (Eco Clear)',
            material: 'PET Reciclado Clarificado',
            price: 360,
            stock: 12,
            colorHex: '#E2E8F0',
            description: 'Ideal para pantallas de lámparas litofanías y floreros impermeables.',
            category: 'Filamento PETG',
            isRecycledPet: true
          },
          {
            id: 'prod-supp-4',
            name: 'Pack 4 Boquillas de Latón Endurecido 0.4mm',
            material: 'Latón Premium CHT',
            price: 180,
            stock: 30,
            colorHex: '#D97706',
            description: 'Flujo rápido para impresoras Bambu Lab, Creality K1 y Ender.',
            category: 'Refacciones'
          }
        ]
      },
      {
        id: 'supp-morelia-2',
        name: '3D Market Morelia',
        brandTitle: 'Distribuidor Michoacán con Entrega Rápida',
        address: 'Presencia y distribución en Morelia y todo el estado',
        neighborhood: 'Zona Morelia y Alrededores',
        city: 'Morelia',
        state: 'Michoacán',
        phone: '443 312 9080',
        whatsapp: '+524433129080',
        deliverySpeed: 'Entrega express local 2 a 4 horas en Morelia',
        acceptsCash: true,
        acceptsSpei: true,
        rating: 4.8,
        isSustainable: true,
        verificationStatus: 'verified',
        registeredDate: '2024-03-20',
        sustainabilityBadge: {
          title: 'Insignia Eco: Resinas Vegetales a Base de Soya',
          description: 'Distribuidor con línea de resinas biodegradables plant-based de bajo olor para talleres urbanos.',
          materialSource: 'Aceite de Soya Natural',
          ecoScore: 90
        },
        catalog: [
          {
            id: 'prod-supp-5',
            name: 'Filamento PLA+ Mármol Blanco Cerámico 1kg',
            material: 'PLA Mineral',
            price: 360,
            stock: 15,
            colorHex: '#F5F5F4',
            description: 'Aspecto piedra natural con motas negras, perfecto para esculturas y macetas.',
            category: 'Filamento PLA'
          },
          {
            id: 'prod-supp-6',
            name: 'Resina Anycubic Eco Plant-Based Gris 1kg',
            material: 'Resina UV Biológica',
            price: 490,
            stock: 9,
            colorHex: '#94A3B8',
            description: 'Olor muy bajo, biodegradable a base de soya, altísima definición en miniaturas.',
            category: 'Resina UV'
          },
          {
            id: 'prod-supp-7',
            name: 'Placa Flexible PEI Texturizada Doble Cara',
            material: 'Acero Primavera + PEI',
            price: 290,
            stock: 8,
            colorHex: '#D97706',
            description: 'Adherencia insuperable para PLA y PETG sin necesidad de pegamento.',
            category: 'Refacciones'
          }
        ]
      },
      {
        id: 'supp-morelia-3',
        name: 'Insumos Industriales de Michoacán',
        brandTitle: 'Empaque y Cajas para Talleres en Morelia',
        address: 'Periférico Paseo de la República 4120',
        neighborhood: 'Sector Nueva España',
        city: 'Morelia',
        state: 'Michoacán',
        phone: '443 555 1290',
        whatsapp: '+524435551290',
        deliverySpeed: 'Envío local 24 horas',
        acceptsCash: true,
        acceptsSpei: true,
        rating: 4.8,
        isSustainable: false,
        registeredDate: todayStr,
        catalog: [
          {
            id: 'prod-supp-8',
            name: 'Cajas de Cartón para Envíos 15x15x15 (Pack 25pz)',
            material: 'Cartón Corrugado',
            price: 220,
            stock: 50,
            colorHex: '#B45309',
            description: 'Cajas resistentes para envíos protegidos.',
            category: 'Empaque'
          }
        ]
      },
      {
        id: 'supp-morelia-4',
        name: 'Tecno3D Morelia / Filamentos & Refacciones',
        brandTitle: 'Distribuidor Especializado en Filamentos de Alta Velocidad y Refacciones 3D',
        address: 'Calzada Ventura Puente #920, Col. Cuauhtémoc',
        neighborhood: 'Col. Cuauhtémoc / Centro',
        city: 'Morelia',
        state: 'Michoacán',
        phone: '443 103 8730',
        whatsapp: '+524431038730',
        deliverySpeed: 'Entrega express local en Morelia o retiro en sucursal',
        acceptsCash: true,
        acceptsSpei: true,
        rating: 4.9,
        isSustainable: true,
        verificationStatus: 'verified',
        registeredDate: todayStr,
        sustainabilityBadge: {
          title: 'Insignia Verde de Sustentabilidad: Bobinas de Cartón Biodegradable & Reciclaje 3D',
          description: 'Distribuidor comprometido con el medio ambiente: entrega filamentos en bobinas de cartón biodegradable y recibe sobrantes y soportes de impresión para reintegración en procesos industriales en Morelia.',
          materialSource: 'Carretes de Cartón Biodegradable FSC + PLA Eco-friendly',
          ecoScore: 95
        },
        catalog: [
          {
            id: 'prod-supp-9',
            name: 'Filamento PLA+ High Speed Blanco Nieve 1kg (Hasta 500mm/s)',
            material: 'PLA+ Alta Velocidad',
            price: 340,
            stock: 25,
            colorHex: '#FFFFFF',
            description: 'Optimizado para impresoras de alta velocidad (Bambu Lab, Creality K1, Flsun). Acabado blanco puro sin atascos.',
            category: 'Filamento PLA'
          },
          {
            id: 'prod-supp-10',
            name: 'Filamento PETG Alta Resistencia Azul Morelia 1kg',
            material: 'PETG Reciclado / Grado Industrial',
            price: 330,
            stock: 20,
            colorHex: '#2563EB',
            description: 'Excelente para soportes mecánicos, exteriores y piezas de alta durabilidad química y térmica.',
            category: 'Filamento PETG',
            isRecycledPet: true
          },
          {
            id: 'prod-supp-11',
            name: 'Filamento TPU 95A Flexible Negro Mate 1kg',
            material: 'TPU Flexible Premium',
            price: 395,
            stock: 14,
            colorHex: '#18181B',
            description: 'Ideal para fundas de celular, empaques herméticos, amortiguadores y suelas flexibles con memoria elástica.',
            category: 'Filamento PLA'
          },
          {
            id: 'prod-supp-12',
            name: 'Kit Boquillas Bi-Metálicas Cobre/Acero Templado 0.4mm (Pack 3pz)',
            material: 'Bimetal Cobre CHT + Acero',
            price: 240,
            stock: 30,
            colorHex: '#D97706',
            description: 'Soporta hasta 350°C y materiales abrasivos como fibra de carbono y PETG sin desgaste prematuro.',
            category: 'Refacciones'
          },
          {
            id: 'prod-supp-13',
            name: 'Alcohol Isopropílico 99.9% Alta Pureza 1 Litro (Grado Limpieza 3D)',
            material: 'Alcohol Isopropílico Industrial',
            price: 135,
            stock: 45,
            colorHex: '#38BDF8',
            description: 'Indispensable para limpieza de placas PEI y lavado de piezas en resina UV sin dejar residuos.',
            category: 'Refacciones'
          }
        ]
      }
    ]);
  }

  // Ensure the new supplier with phone 443 103 8730 is present for existing databases
  try {
    const existingSupplier443 = await db.localSuppliers.get('supp-morelia-4');
    if (!existingSupplier443) {
      await db.localSuppliers.put({
        id: 'supp-morelia-4',
        name: 'Tecno3D Morelia / Filamentos & Refacciones',
        brandTitle: 'Distribuidor Especializado en Filamentos de Alta Velocidad y Refacciones 3D',
        address: 'Calzada Ventura Puente #920, Col. Cuauhtémoc',
        neighborhood: 'Col. Cuauhtémoc / Centro',
        city: 'Morelia',
        state: 'Michoacán',
        phone: '443 103 8730',
        whatsapp: '+524431038730',
        deliverySpeed: 'Entrega express local en Morelia o retiro en sucursal',
        acceptsCash: true,
        acceptsSpei: true,
        rating: 4.9,
        isSustainable: true,
        verificationStatus: 'verified',
        registeredDate: todayStr,
        sustainabilityBadge: {
          title: 'Insignia Verde de Sustentabilidad: Bobinas de Cartón Biodegradable & Reciclaje 3D',
          description: 'Distribuidor comprometido con el medio ambiente: entrega filamentos en bobinas de cartón biodegradable y recibe sobrantes y soportes de impresión para reintegración en procesos industriales en Morelia.',
          materialSource: 'Carretes de Cartón Biodegradable FSC + PLA Eco-friendly',
          ecoScore: 95
        },
        catalog: [
          {
            id: 'prod-supp-9',
            name: 'Filamento PLA+ High Speed Blanco Nieve 1kg (Hasta 500mm/s)',
            material: 'PLA+ Alta Velocidad',
            price: 340,
            stock: 25,
            colorHex: '#FFFFFF',
            description: 'Optimizado para impresoras de alta velocidad (Bambu Lab, Creality K1, Flsun). Acabado blanco puro sin atascos.',
            category: 'Filamento PLA'
          },
          {
            id: 'prod-supp-10',
            name: 'Filamento PETG Alta Resistencia Azul Morelia 1kg',
            material: 'PETG Reciclado / Grado Industrial',
            price: 330,
            stock: 20,
            colorHex: '#2563EB',
            description: 'Excelente para soportes mecánicos, exteriores y piezas de alta durabilidad química y térmica.',
            category: 'Filamento PETG',
            isRecycledPet: true
          },
          {
            id: 'prod-supp-11',
            name: 'Filamento TPU 95A Flexible Negro Mate 1kg',
            material: 'TPU Flexible Premium',
            price: 395,
            stock: 14,
            colorHex: '#18181B',
            description: 'Ideal para fundas de celular, empaques herméticos, amortiguadores y suelas flexibles con memoria elástica.',
            category: 'Filamento PLA'
          },
          {
            id: 'prod-supp-12',
            name: 'Kit Boquillas Bi-Metálicas Cobre/Acero Templado 0.4mm (Pack 3pz)',
            material: 'Bimetal Cobre CHT + Acero',
            price: 240,
            stock: 30,
            colorHex: '#D97706',
            description: 'Soporta hasta 350°C y materiales abrasivos como fibra de carbono y PETG sin desgaste prematuro.',
            category: 'Refacciones'
          },
          {
            id: 'prod-supp-13',
            name: 'Alcohol Isopropílico 99.9% Alta Pureza 1 Litro (Grado Limpieza 3D)',
            material: 'Alcohol Isopropílico Industrial',
            price: 135,
            stock: 45,
            colorHex: '#38BDF8',
            description: 'Indispensable para limpieza de placas PEI y lavado de piezas en resina UV sin dejar residuos.',
            category: 'Refacciones'
          }
        ]
      });
    }
  } catch (suppErr) {
    console.warn('Notice checking or putting supp-morelia-4:', suppErr);
  }

  // 3. Seed Published Products matching user's real 3D photos if empty
  if (productsCount === 0) {
    await db.products.bulkPut([
      {
        id: 'prod-1',
        name: 'Llaveros Personalizados con Nombre y Flor Pastel',
        category: 'Llaveros y Accesorios de Moda',
        description: 'Llaveros en doble capa con tu nombre en relieve 3D (Sophia, Alisson, etc.) y dije de flor pastel. Incluye arnés metálico reforzado y base en tono crema.',
        material: 'PLA Silk Pastel + Base Crema',
        color: 'Rosa Pastel, Lavanda y Cyan',
        colorHex: '#F472B6',
        retailPrice: 85,
        directCost: 18,
        printTimeHours: 1.2,
        materialGrams: 22,
        stockUnits: 15,
        dimensions: '8.5 x 3.0 cm',
        imageUrl: '/products/llaveros-flores-pastel.svg',
        isPublished: true,
        tags: ['Personalizado', 'Nombre 3D', 'Flor Pastel', 'Llavero'],
        rating: 5.0,
        reviewsCount: 42,
        createdAt: todayStr
      },
      {
        id: 'prod-2',
        name: 'Set de Macetitas Kawaii Animales para Suculentas',
        category: 'Macetas Tiernas y Decoración de Interiores',
        description: 'Macetas con orificio de drenaje en forma de Elefantito rosa, Gatito celeste y Tortuguita menta. Perfectas para suculentas en ventanas y repisas.',
        material: 'PLA Silk Mate Biodegradable',
        color: 'Rosa Bebé, Celeste y Verde Menta',
        colorHex: '#38BDF8',
        retailPrice: 160,
        directCost: 42,
        printTimeHours: 3.0,
        materialGrams: 65,
        stockUnits: 8,
        dimensions: '8 x 7 x 6 cm c/u',
        imageUrl: '/products/macetas-animales-kawaii.svg',
        isPublished: true,
        tags: ['Suculentas', 'Kawaii', 'Elefante', 'Tortuga'],
        rating: 4.9,
        reviewsCount: 36,
        createdAt: todayStr
      },
      {
        id: 'prod-3',
        name: 'Perchero / Tendedero Miniatura para Aretes y Joyería',
        category: 'Organizadores de Joyería y Vanidad',
        description: 'Soporte tipo rack de ropa en morado pastel con mini ganchitos desmontables para aretes colgantes y barra inferior perforada para broqueles y dijes.',
        material: 'PLA Plus Lavanda Suave',
        color: 'Lavanda / Morado Pastel',
        colorHex: '#C084FC',
        retailPrice: 220,
        directCost: 58,
        printTimeHours: 4.5,
        materialGrams: 95,
        stockUnits: 6,
        dimensions: '18 x 16 x 7 cm',
        imageUrl: '/products/perchero-joyeria-morado.svg',
        isPublished: true,
        tags: ['Aretes', 'Mini Ganchos', 'Organizador', 'Joyas'],
        rating: 5.0,
        reviewsCount: 28,
        createdAt: todayStr
      },
      {
        id: 'prod-4',
        name: 'Colección Figuras Articuladas Fidget & Llaveros Kawaii',
        category: 'Juguetes Sensoriales y Figuras Articuladas',
        description: 'Figuras antiestrés articuladas impresas en una sola pieza (Print-in-Place): Ajolote rosa sonriente, Pulpo flexible, T-Rex y Serpiente, más llaveros kawaii.',
        material: 'PLA Seda Flexible / Multi-color',
        color: 'Rosa Ajolote, Verde Lima y Morado',
        colorHex: '#EC4899',
        retailPrice: 190,
        directCost: 48,
        printTimeHours: 3.8,
        materialGrams: 80,
        stockUnits: 10,
        dimensions: '12 a 15 cm articulados',
        imageUrl: '/products/figuras-articuladas-fidget.svg',
        isPublished: true,
        tags: ['Ajolote', 'Fidget Antiestrés', 'Print in Place', 'Articulado'],
        rating: 4.9,
        reviewsCount: 54,
        createdAt: todayStr
      },
      {
        id: 'prod-5',
        name: 'Portalápices y Vaso Organizador Textura Corazones',
        category: 'Hogar, Belleza y Accesorios de Escritorio',
        description: 'Vaso cilíndrico decorativo con textura acordonada en relieve de corazones 3D en fucsia intenso. Ideal para cepillos de cabello, cosméticos o plumones.',
        material: 'PLA Plus Rosa Mexicano Intenso',
        color: 'Fucsia / Rosa Mexicano',
        colorHex: '#E11D48',
        retailPrice: 175,
        directCost: 45,
        printTimeHours: 4.0,
        materialGrams: 85,
        stockUnits: 7,
        dimensions: '11 cm alto x 8.5 cm diámetro',
        imageUrl: '/products/organizador-corazones-rosa.svg',
        isPublished: true,
        tags: ['Corazones', 'Organizador', 'Cepillos', 'Vanidad'],
        rating: 4.8,
        reviewsCount: 19,
        createdAt: todayStr
      },
      {
        id: 'prod-6',
        name: 'Caja Organizadora Multinivel Desplegable para Taller',
        category: 'Organizadores Técnicos y Herramientas',
        description: 'Sistema cantiléver de 4 niveles desplegables en blanco marfil con charolas turquesa y pernos rosa. Múltiples compartimentos para tornillería o bisutería.',
        material: 'PETG Blanco Marfil + Turquesa',
        color: 'Blanco y Turquesa con Acentos Rosa',
        colorHex: '#06B6D4',
        retailPrice: 390,
        directCost: 115,
        printTimeHours: 8.5,
        materialGrams: 240,
        stockUnits: 4,
        dimensions: '22 x 18 x 12 cm',
        imageUrl: '/products/caja-multinivel-taller.svg',
        isPublished: true,
        tags: ['Taller', 'Cantilever', 'Multinivel', 'Herramientas'],
        rating: 5.0,
        reviewsCount: 31,
        createdAt: todayStr
      }
    ]);
  }

  // 4. Seed initial transactions if empty
  const txCount = await db.transactions.count();
  if (txCount === 0) {
    await db.transactions.bulkPut([
      {
        type: 'sale',
        category: 'Venta Producto 3D',
        description: 'Venta de 3 Macetas Geométricas Rosa Seda',
        amount: 585,
        date: todayStr,
        synced: true,
        customerOrSupplier: 'Mariana Gómez (Morelia)',
        paymentMethod: 'Efectivo / Contraentrega',
        itemsCount: 3
      },
      {
        type: 'sale',
        category: 'Venta Producto 3D',
        description: 'Dragón Articulado Guardián Bicolor',
        amount: 380,
        date: todayStr,
        synced: true,
        customerOrSupplier: 'Rodrigo Silva (Plaza Las Américas)',
        paymentMethod: 'Transferencia SPEI',
        itemsCount: 1
      },
      {
        type: 'expense',
        category: 'Filamento PLA/PETG',
        description: 'Compra 1 Carrete PETG Negro en 3D PRINT3D Morelia (Félix Ireta)',
        amount: 340,
        date: todayStr,
        synced: true,
        customerOrSupplier: '3D PRINT3D Morelia',
        paymentMethod: 'Efectivo / Contraentrega'
      }
    ]);
  }

  // 5. Seed Initial Orders linked to Morelia and inventory materials
  const ordersCount = await db.orders.count();
  if (ordersCount === 0) {
    await db.orders.bulkPut([
      {
        id: 'PED-401',
        customerName: 'Fernanda Navarro',
        customerPhone: '+524431982233',
        itemsDescription: '2 Macetas Geométricas Rosa Seda + 1 Dragón Articulado',
        totalAmount: 770,
        depositAmount: 400,
        balancePending: 370,
        status: 'preparing',
        deliveryType: 'Punto Rosa Seguro',
        deliveryLocation: 'Plaza Las Américas Morelia (Frente a Liverpool)',
        createdAt: todayStr,
        estimatedDeliveryDate: 'Mañana, 04:00 PM',
        requiredMaterialName: 'Filamento PLA+ Rosa Pastel Seda',
        requiredGrams: 310,
        isMaterialAvailable: false // Shows stock deficit to reorder!
      },
      {
        id: 'PED-402',
        customerName: 'Valeria Morales',
        customerPhone: '+524438765412',
        itemsDescription: '1 Florero Espiral Ondulado en PETG Translúcido',
        totalAmount: 280,
        depositAmount: 280,
        balancePending: 0,
        status: 'ready_to_ship',
        deliveryType: 'Plaza Comercial',
        deliveryLocation: 'Centro Histórico Morelia (Kiosco Plaza de Armas / Catedral)',
        createdAt: todayStr,
        estimatedDeliveryDate: 'Hoy, 06:30 PM',
        requiredMaterialName: 'Filamento PETG Translúcido',
        requiredGrams: 110,
        isMaterialAvailable: true
      },
      {
        id: 'PED-403',
        customerName: 'Sofía Castañeda',
        customerPhone: '+524435678901',
        itemsDescription: 'Pack 10 Llaveros con Nombre Cursiva Oro Rosa',
        totalAmount: 250,
        depositAmount: 150,
        balancePending: 100,
        status: 'on_the_way',
        deliveryType: 'Punto Rosa Seguro',
        deliveryLocation: 'Calzada Fray Antonio de San Miguel (Acueducto Morelia)',
        createdAt: todayStr,
        estimatedDeliveryDate: 'Hoy, 05:15 PM',
        requiredMaterialName: 'Filamento PLA Silk Rosa Pastel',
        requiredGrams: 50,
        isMaterialAvailable: true
      },
      {
        id: 'PED-399',
        customerName: 'Alejandra Ruiz',
        customerPhone: '+524433219087',
        itemsDescription: '1 Lámpara Luna Litofanía 3D con luz cálida',
        totalAmount: 460,
        depositAmount: 460,
        balancePending: 0,
        status: 'delivered',
        deliveryType: 'Entrega a Domicilio',
        deliveryLocation: 'Colonia Félix Ireta (Cerca de Yunuen)',
        createdAt: todayStr,
        estimatedDeliveryDate: 'Entregado ayer',
        requiredMaterialName: 'PLA Blanco Óptico',
        requiredGrams: 190,
        isMaterialAvailable: true
      }
    ]);
  }

  // 6. Seed Material Orders
  const matsCount = await db.materialOrders.count();
  if (matsCount === 0) {
    await db.materialOrders.bulkPut([
      {
        id: 'MAT-301',
        supplierName: '3D PRINT3D / Color Plus 3D',
        supplierPhone: '+524432417613',
        materialName: '2 Carretes PETG Negro 1kg + Boquillas 0.4mm',
        quantity: '2 Carretes + Pack 4 boquillas',
        totalCost: 860,
        status: 'shipped',
        orderDate: todayStr,
        estimatedArrivalDate: 'Hoy en la tarde (Morelia Félix Ireta)',
        trackingNumber: 'LOCAL-MORELIA-443',
        paymentMethod: 'Efectivo / Contraentrega'
      },
      {
        id: 'MAT-302',
        supplierName: '3D Market Morelia',
        supplierPhone: '+524433129080',
        materialName: '1 Carrete PLA Mármol Blanco + 1 Botella Resina Eco 1kg',
        quantity: '2 Kilos',
        totalCost: 850,
        status: 'ordered',
        orderDate: todayStr,
        estimatedArrivalDate: 'Viernes 26 Sept',
        paymentMethod: 'Transferencia SPEI'
      }
    ]);
  }

  // 7. Seed Group Purchases
  const grpCount = await db.groupPurchases.count();
  if (grpCount === 0) {
    await db.groupPurchases.bulkPut([
      {
        id: 'grp-morelia-1',
        title: 'Lote Mayoreo Morelia: Filamentos PETG y PLA Premium',
        material: 'Carretes PETG Negro/Blanco/Translúcido 1kg',
        supplier: '3D PRINT3D & Fabricantes Michoacán',
        targetKilos: 30,
        currentKilos: 22,
        pricePerUnit: 275,
        retailPrice: 360,
        savingsPerUnit: 85,
        deadlineDate: 'Viernes 26 Septiembre',
        participantsCount: 7,
        userJoinedKilos: 3,
        status: 'active'
      },
      {
        id: 'grp-morelia-2',
        title: 'Consolidado Resina UV Eco a Base de Soya',
        material: 'Botellas de Resina Anycubic Eco 1kg',
        supplier: 'Distribuidor Directo 3D Market Michoacán',
        targetKilos: 15,
        currentKilos: 11,
        pricePerUnit: 395,
        retailPrice: 490,
        savingsPerUnit: 95,
        deadlineDate: 'Domingo 28 Septiembre',
        participantsCount: 5,
        userJoinedKilos: 2,
        status: 'active'
      }
    ]);
  }

  // 8. Seed Default Users & Demo Profiles
  const usersCount = await db.users.count();
  if (usersCount === 0) {
    await db.users.bulkPut([
      {
        id: 'user-seller-demo',
        role: 'seller',
        name: 'Marysol G.',
        businessName: 'Taller Creativo MiFyMEs',
        email: 'marysol2766@gmail.com',
        phone: '443 123 4567',
        city: 'Morelia, Michoacán',
        status: 'active',
        undeliveredCount: 0,
        registeredAt: '2024-02-10',
        sustainableFocus: true
      },
      {
        id: 'user-supplier-demo',
        role: 'supplier',
        name: 'Ing. Carlos Mendoza',
        businessName: '3D PRINT3D / Color Plus 3D',
        email: 'carlos@colorplus3d.mx',
        phone: '443 241 7613',
        city: 'Morelia, Michoacán (Félix Ireta)',
        status: 'active',
        undeliveredCount: 0,
        registeredAt: '2024-01-15',
        sustainableFocus: true
      },
      {
        id: 'user-pending-supplier',
        role: 'supplier',
        name: 'Roberto Gómez',
        businessName: 'Insumos Industriales de Michoacán',
        email: 'roberto@insumosmichoacan.com',
        phone: '443 555 1290',
        city: 'Morelia, Michoacán',
        status: 'pending_verification',
        undeliveredCount: 0,
        registeredAt: todayStr,
        sustainableFocus: false
      }
    ]);
  }
}

/**
 * Reset database to pristine state for testing and demos
 */
export async function resetDatabaseToDefaults(): Promise<void> {
  await db.transaction('rw', [
    db.transactions,
    db.inventory,
    db.orders,
    db.materialOrders,
    db.facturasDaily,
    db.groupPurchases,
    db.products,
    db.cartItems,
    db.localSuppliers,
    db.users
  ], async () => {
    await db.transactions.clear();
    await db.inventory.clear();
    await db.orders.clear();
    await db.materialOrders.clear();
    await db.facturasDaily.clear();
    await db.groupPurchases.clear();
    await db.products.clear();
    await db.cartItems.clear();
    await db.localSuppliers.clear();
    await db.users.clear();
  });
  await seedInitialDataIfNeeded();
}

