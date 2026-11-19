import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  isPremium: boolean;
  onTogglePremium: () => void;
}

export const VersionSidebar: React.FC<Props> = ({ isPremium, onTogglePremium }) => {
  return (
    <aside className="w-full lg:w-64 bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
      <div className="space-y-4">
        {/* Version Header */}
        <div className="border-b border-zinc-100 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Licencia
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                isPremium
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {isPremium ? 'PRO' : 'ESTÁNDAR'}
            </span>
          </div>

          <h2 className="text-sm font-bold text-zinc-900 mt-1">
            {isPremium ? 'MiFyMEs Premium Pro' : 'MiFyMEs Estándar'}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
            {isPremium
              ? 'Control total sin límites para tu taller.'
              : 'Versión básica de control para microtalleres.'}
          </p>
        </div>

        {/* Feature status list */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-zinc-700 block">
            Incluido:
          </span>

          <ul className="space-y-1.5 text-xs text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>100% Offline (PWA)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Anotar por Voz</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Calculadora de Costos</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Proveedores de Morelia</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Compras por Mayoreo</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Switcher Button */}
      <div className="mt-5 pt-3 border-t border-zinc-100">
        <button
          onClick={onTogglePremium}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isPremium
              ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs'
          }`}
        >
          {isPremium ? 'Cambiar a Estándar' : 'Activar Premium Pro ($199)'}
        </button>
      </div>
    </aside>
  );
};
