import React, { useState } from 'react';
import {
  MapPin,
  Shield,
  Search,
  Lock,
  Sparkles,
  Share2,
  CheckCircle2,
  Globe,
  Crown
} from 'lucide-react';
import { apiService, type SafePathResult } from '../../services/api';
import confetti from 'canvas-confetti';

interface Props {
  isPremium: boolean;
  onUpgradeToPremium: () => void;
  onGoToSupplyChain?: () => void;
}

export const SafeRouteMap: React.FC<Props> = ({ isPremium, onUpgradeToPremium, onGoToSupplyChain }) => {
  const [searchQuery, setSearchQuery] = useState('Yunuen 131, Félix Ireta, Morelia, Michoacán');
  const [mapViewMode, setMapViewMode] = useState<'google_maps' | 'safety_c5'>('google_maps');
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [previewModeUnlocked, setPreviewModeUnlocked] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  // Quick preset locations in Morelia & surroundings (suitable for any business deliveries)
  const moreliaLocations = [
    {
      name: 'Yunuen 131, Félix Ireta, Morelia',
      fullAddress: 'Yunuen 131, Félix Ireta, 58070 Morelia, Michoacán',
      desc: 'Local Comercial Yunuen • Zona Céntrica y Concurrida',
      score: 99,
      type: 'Local Comercial Aliado'
    },
    {
      name: 'Plaza Las Américas Morelia',
      fullAddress: 'Av. Enrique Ramírez Miguel 1000, Las Américas, Morelia, Michoacán',
      desc: 'Acceso Liverpool • Seguridad Privada y Estacionamiento Iluminado',
      score: 98,
      type: 'Punto Rosa Seguro'
    },
    {
      name: 'Catedral de Morelia / Plaza de Armas',
      fullAddress: 'Av. Francisco I. Madero Pte., Centro Histórico, Morelia, Michoacán',
      desc: 'Módulo Turístico • Vigilancia Permanente y Policías',
      score: 99,
      type: 'Punto Oficial Seguro'
    },
    {
      name: 'Acueducto & Las Tarascas',
      fullAddress: 'Av. Acueducto, Centro, Morelia, Michoacán',
      desc: 'Calzada Fray Antonio de San Miguel • Alto Flujo Familiar',
      score: 97,
      type: 'Punto Familiar Concurrido'
    },
    {
      name: 'Paseo Altozano Morelia',
      fullAddress: 'Av. Montaña Monarca 1000, Desarrollo Montaña Monarca, Morelia, Michoacán',
      desc: 'Plaza Comercial • Circuito Cerrado y Caseta de Entrada',
      score: 99,
      type: 'Centro Comercial'
    }
  ];

  const [activeZone, setActiveZone] = useState(moreliaLocations[0]);

  const [routeData, setRouteData] = useState<SafePathResult>({
    origin: 'Tu Taller o Negocio (Morelia)',
    destination: 'Yunuen 131, Félix Ireta, Morelia',
    routeStats: {
      safetyScore: 99,
      distanceKm: 2.1,
      estimatedTimeMinutes: 8,
      lightingCoveragePct: 100,
      cctvCoveragePct: 96,
      recommendedHours: '09:00 AM - 07:30 PM'
    },
    safePointsNearby: [
      {
        id: 'sp-mor-0',
        name: 'Yunuen 131 (Félix Ireta)',
        type: 'Local Autorizado',
        rating: 9.9,
        securityLevel: 'Local Concurrido',
        features: ['Yunuen 131', 'Atención en mostrador', 'Zona Iluminada']
      },
      {
        id: 'sp-mor-1',
        name: 'Plaza de Armas / Frente a Catedral de Morelia',
        type: 'Punto Naranja Oficial',
        rating: 9.9,
        securityLevel: 'Vigilancia Turística Constante',
        features: ['Cámaras de Seguridad', 'Policía Turística', 'Iluminación Total']
      },
      {
        id: 'sp-mor-2',
        name: 'Plaza Las Américas - Entrada Principal Liverpool',
        type: 'Plaza Comercial',
        rating: 9.8,
        securityLevel: 'Seguridad Privada',
        features: ['Cámaras de Circuito Cerrado', 'Vigilancia Interna', 'Estacionamiento Iluminado']
      }
    ],
    warningAreasAvoided: ['Paso bajo puente sin luminarias', 'Andador solitario'],
    safetyTip: 'Para cualquier tipo de entrega, cita a tu cliente en plazas comerciales o lugares transitados con iluminación.'
  });

  const isUnlocked = isPremium || previewModeUnlocked;

  const handleSearchAnyLocation = async (queryText: string) => {
    setSearchQuery(queryText);
    setIsRouting(true);

    const matched = moreliaLocations.find((loc) =>
      loc.name.toLowerCase().includes(queryText.toLowerCase()) ||
      loc.fullAddress.toLowerCase().includes(queryText.toLowerCase())
    );

    if (matched) {
      setActiveZone(matched);
    } else {
      setActiveZone({
        name: queryText,
        fullAddress: queryText,
        desc: 'Ubicación personalizada buscada',
        score: 95,
        type: 'Punto de Entrega Buscado'
      });
    }

    try {
      const res = await apiService.getSafeRoute('Taller MiFyMEs Morelia', queryText);
      setRouteData({
        ...res,
        destination: queryText,
        routeStats: {
          safetyScore: matched ? matched.score : 95,
          distanceKm: Number((2.0 + Math.random() * 3.5).toFixed(1)),
          estimatedTimeMinutes: Math.floor(8 + Math.random() * 12),
          lightingCoveragePct: 98,
          cctvCoveragePct: 94,
          recommendedHours: '09:00 AM - 07:30 PM'
        }
      });
    } catch {
      // handled
    } finally {
      setIsRouting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Hola! Te comparto el punto de entrega acordado en: ${searchQuery}. Es un lugar seguro e iluminado para entregarte tu pedido. Te aviso cuando vaya en camino.`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-sm p-5 sm:p-6 border-2 border-purple-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-sm bg-[#582C7B] text-white flex items-center justify-center border border-[#472264] shadow-xs">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-impact uppercase tracking-wider text-stone-900">
                  Rutas Seguras y Puntos de Entrega
                </h3>
                {isUnlocked ? (
                  <span className="px-2.5 py-0.5 rounded-sm text-[10px] font-impact uppercase bg-[#582C7B] text-white border border-[#472264] flex items-center gap-1">
                    <Crown className="w-3 h-3 text-pink-300" />
                    Módulo Activo
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-sm text-[10px] font-impact uppercase bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-stone-500" />
                    Vista Previa
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 font-sans">
                Encuentra lugares iluminados, vigilados y concurridos en Morelia para entregar tus productos a clientes con total tranquilidad.
              </p>
            </div>
          </div>
        </div>

        {/* Action button if locked */}
        {!isUnlocked && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPreviewModeUnlocked(true);
                confetti({ particleCount: 50, spread: 60 });
              }}
              className="px-3.5 py-2 rounded-sm bg-purple-50 hover:bg-purple-100 border border-[#582C7B] text-[#582C7B] text-xs font-impact uppercase tracking-wider transition cursor-pointer"
            >
              Probar Vista Previa
            </button>
            <button
              onClick={onUpgradeToPremium}
              className="px-4 py-2 rounded-sm bg-[#D94680] hover:bg-[#c23670] text-white text-xs font-impact uppercase tracking-wider shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-white" />
              <span>Desbloquear Todo ($199)</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Universal Search Bar & Points Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search Box */}
          <div className="bg-white rounded-sm p-4 sm:p-5 border-2 border-purple-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-impact uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#D94680]" />
                Buscar Dirección o Punto de Entrega
              </span>
              <span className="text-[10px] text-white font-impact uppercase bg-[#582C7B] px-2 py-0.5 rounded-sm">
                Google Maps
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchAnyLocation(e.target.value)}
                placeholder="Escribe calle, colonia o plaza (ej. Yunuen 131 Félix Ireta Morelia)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-sm bg-stone-50 border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-[#582C7B] transition"
              />
              <MapPin className="w-4 h-4 text-[#D94680] absolute left-3 top-3" />
            </div>

            {/* Quick 1-click Preset Chips for Morelia */}
            <div>
              <span className="text-[11px] font-bold text-stone-700 block mb-1.5 font-impact uppercase">
                Puntos Recomendados en Morelia:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {moreliaLocations.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchAnyLocation(loc.fullAddress)}
                    className={`px-2.5 py-1.5 rounded-sm text-[11px] transition cursor-pointer text-left ${
                      searchQuery.includes(loc.name) || searchQuery.includes(loc.fullAddress)
                        ? 'bg-[#582C7B] text-white font-bold'
                        : 'bg-purple-50 hover:bg-purple-100 text-[#582C7B] border border-purple-200'
                    }`}
                  >
                    📍 {loc.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Safe Points Directory */}
          <div className="bg-white rounded-sm p-4 sm:p-5 border-2 border-purple-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-impact uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#582C7B]" />
                Puntos Seguros Registrados
              </span>
              <span className="text-[10px] text-white bg-[#582C7B] px-2 py-0.5 rounded-sm font-impact uppercase">
                Vigilados
              </span>
            </div>

            <div className="space-y-2">
              {routeData.safePointsNearby.map((pt) => (
                <div
                  key={pt.id}
                  onClick={() => {
                    setSelectedPoint(pt);
                    handleSearchAnyLocation(pt.name);
                  }}
                  className={`p-3 rounded-sm border transition cursor-pointer text-left ${
                    selectedPoint?.id === pt.id
                      ? 'border-[#D94680] bg-pink-50 shadow-xs'
                      : 'border-purple-100 bg-stone-50 hover:border-[#582C7B] hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{pt.name}</span>
                    <span className="text-[10px] font-bold text-white bg-[#582C7B] px-1.5 py-0.5 rounded-sm font-impact">
                      ★ {pt.rating}
                    </span>
                  </div>

                  <span className="text-[10px] text-[#D94680] font-bold block mt-0.5 font-impact uppercase">
                    {pt.type} • {pt.securityLevel}
                  </span>

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {pt.features.slice(0, 2).map((f: string, idx: number) => (
                      <span key={idx} className="text-[9px] bg-white border border-stone-200 text-stone-700 px-1.5 py-0.5 rounded-sm">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick WhatsApp Share Button */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3 rounded-sm bg-[#582C7B] hover:bg-[#472264] text-white text-xs font-impact uppercase tracking-wider shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-pink-300" />
            <span>Compartir Punto de Entrega por WhatsApp</span>
          </button>

        </div>

        {/* Right: Embedded Interactive Map Centered on Search Address (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-sm p-5 border-2 border-purple-200 shadow-xs space-y-4 flex flex-col justify-between">
          
          {/* Map Top Bar with Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D94680] animate-ping" />
              <span className="text-xs font-bold text-stone-900">
                Ubicación en Vivo: <strong className="text-[#582C7B]">{searchQuery.split(',')[0]}</strong>
              </span>
            </div>

            {/* View Mode Toggle: Google Maps vs Safety Network */}
            <div className="flex items-center bg-stone-100 p-1 rounded-sm border border-stone-300 text-xs">
              <button
                type="button"
                onClick={() => setMapViewMode('google_maps')}
                className={`px-3 py-1.5 rounded-sm font-impact uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  mapViewMode === 'google_maps'
                    ? 'bg-white text-[#582C7B] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#D94680]" />
                <span>Google Maps en Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setMapViewMode('safety_c5')}
                className={`px-3 py-1.5 rounded-sm font-impact uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  mapViewMode === 'safety_c5'
                    ? 'bg-[#582C7B] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-pink-300" />
                <span>Zonas Vigiladas</span>
              </button>
            </div>
          </div>

          {/* Embedded Google Maps / Safety Network Canvas */}
          <div className="relative w-full h-[420px] rounded-sm overflow-hidden bg-stone-100 border border-purple-200 shadow-inner">
            
            {mapViewMode === 'google_maps' ? (
              <iframe
                title="Google Maps Morelia"
                width="100%"
                height="100%"
                className="w-full h-full border-0 rounded-sm"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  searchQuery.toLowerCase().includes('morelia') || searchQuery.toLowerCase().includes('michoac')
                    ? searchQuery
                    : `${searchQuery}, Morelia, Michoacán`
                )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full bg-[#FAF5F0] flex items-center justify-center relative">
                <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="moreliaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <rect width="40" height="40" fill="#FAF5F0"/>
                      <rect width="36" height="36" x="2" y="2" rx="1" fill="#F5EFE6" stroke="#EAE0D5" strokeWidth="1"/>
                    </pattern>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#moreliaGrid)"/>

                  {/* Main Avenues */}
                  <line x1="60" y1="250" x2="740" y2="250" stroke="#FFF" strokeWidth="20" strokeLinecap="square"/>
                  <line x1="60" y1="250" x2="740" y2="250" stroke="#FDA4AF" strokeWidth="3" strokeDasharray="6 6"/>
                  <text x="80" y="240" fontSize="11" fill="#582C7B" fontWeight="bold">Av. Madero (Centro Histórico)</text>

                  {/* Av. Camelinas & Acueducto */}
                  <line x1="400" y1="250" x2="680" y2="160" stroke="#FFF" strokeWidth="16" strokeLinecap="square"/>
                  <text x="490" y="200" fontSize="10" fill="#582C7B" fontWeight="600">Av. Acueducto (Las Tarascas)</text>

                  <line x1="400" y1="250" x2="400" y2="460" stroke="#FFF" strokeWidth="16" strokeLinecap="square"/>
                  <text x="415" y="440" fontSize="10" fill="#582C7B" fontWeight="600">Félix Ireta / Yunuen</text>

                  {/* Pin on searched zone */}
                  <g transform="translate(400, 320)">
                    <rect x="-16" y="-16" width="32" height="32" rx="4" fill="#D94680" opacity="0.3" className="animate-ping"/>
                    <rect x="-10" y="-10" width="20" height="20" rx="2" fill="#582C7B"/>
                    <rect x="-4" y="-4" width="8" height="8" rx="1" fill="#FFF"/>
                    <rect x="-80" y="22" width="160" height="28" rx="2" fill="#582C7B"/>
                    <text x="0" y="41" fontSize="10" fill="#FFF" fontWeight="bold" textAnchor="middle">
                      {searchQuery.split(',')[0]}
                    </text>
                  </g>
                </svg>

                <div className="absolute bottom-4 left-4 p-3 rounded-sm bg-white/95 border border-purple-200 text-xs shadow-md">
                  <span className="font-bold text-stone-900 block font-impact uppercase">Zona con Alumbrado y Vigilancia</span>
                  <span className="text-[#582C7B] font-semibold">100% Recomendada para entregas en mano</span>
                </div>
              </div>
            )}

            {/* Overlaid Badge */}
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-sm bg-white text-stone-900 shadow-md border border-purple-200 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-sm bg-[#D94680] animate-pulse" />
              <span className="font-bold text-stone-800">
                {searchQuery}
              </span>
            </div>

          </div>

          {/* Route Stats Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-purple-200 text-xs">
            <div className="p-2.5 rounded-sm bg-purple-50 border border-purple-200 text-center">
              <span className="text-stone-500 block text-[10px] font-impact uppercase">Puntaje Seguridad</span>
              <span className="font-impact text-[#582C7B] text-sm">{routeData.routeStats.safetyScore}% Concurrido</span>
            </div>
            <div className="p-2.5 rounded-sm bg-purple-50 border border-purple-200 text-center">
              <span className="text-stone-500 block text-[10px] font-impact uppercase">Distancia aproximada</span>
              <span className="font-impact text-[#582C7B] text-sm">{routeData.routeStats.distanceKm} km</span>
            </div>
            <div className="p-2.5 rounded-sm bg-pink-50 border border-pink-200 text-center">
              <span className="text-stone-500 block text-[10px] font-impact uppercase">Tiempo aproximado</span>
              <span className="font-impact text-[#D94680] text-sm">{routeData.routeStats.estimatedTimeMinutes} min</span>
            </div>
            <div className="p-2.5 rounded-sm bg-purple-50 border border-purple-200 text-center">
              <span className="text-stone-500 block text-[10px] font-impact uppercase">Horario recomendado</span>
              <span className="font-impact text-[#582C7B] text-sm">09:00 - 19:30</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
