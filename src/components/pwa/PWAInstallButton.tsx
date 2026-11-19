import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, Sparkles, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside installed standalone PWA, hide button
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>App Instalada</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
        title="Instalar Bella 3D en tu pantalla de inicio"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Instalar App en tu Celular</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 text-xs font-semibold text-rose-700 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-rose-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Instalar en tu iPhone</h3>
                    <p className="text-xs text-stone-500">Úsala como una app nativa</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-600 leading-relaxed bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (el ícono del cuadrado con flecha hacia arriba).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Baja un poco en el menú y selecciona <strong>"Agregar a pantalla de inicio"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Toca <strong>"Agregar"</strong> arriba a la derecha. ¡Listo! Tendrás tu panel siempre accesible y sin conexión.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow transition"
              >
                Entendido, ¡gracias!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic install fallback for desktop/other browsers
  return (
    <button
      onClick={() => alert('Para agregar esta app a tu pantalla de inicio o barra de tareas, haz clic en los 3 puntos de tu navegador y elige "Instalar Bella 3D Studio" o "Agregar a marcadores".')}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3 py-1.5 text-xs font-semibold text-rose-700 transition cursor-pointer"
      title="Acceso directo PWA"
    >
      <Smartphone className="w-3.5 h-3.5" />
      <span>Modo App PWA</span>
    </button>
  );
};
